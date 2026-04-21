import { Request, Response, NextFunction } from 'express';
import SecurityLog from '../models/SecurityLog';
import BlockedIp from '../models/BlockedIp';

// ── In-memory caches ──────────────────────────────────────────────────────────
const reqWindow   = new Map<string, { count: number; windowStart: number }>();
const authFailures = new Map<string, { failures: number; windowStart: number }>();
const blockedCache = new Map<string, number>(); // ip → expiresAt ms (Infinity = permanent)
const geoCache    = new Map<string, { country: string; city: string }>();

let logBatch: any[] = [];
let batchTimer: any = null;

// ── Constants ─────────────────────────────────────────────────────────────────
const RATE_WINDOW_MS   = 60 * 1000;
const RATE_WARN_LIMIT  = 200;
const RATE_BLOCK_LIMIT = 400;
const AUTH_FAIL_WINDOW = 15 * 60 * 1000;
const AUTH_FAIL_LIMIT  = 10;
const BLOCK_DURATION_MS = 60 * 60 * 1000;
const BATCH_INTERVAL_MS = 2000;

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/verify-otp', '/api/auth/resend-otp'];

const SCAN_PATHS = [
  '/.env', '/.git', '/.DS_Store', '/wp-admin', '/wp-login', '/phpmyadmin',
  '/admin.php', '/xmlrpc.php', '/etc/passwd', '/etc/shadow', '/proc/self',
  '/actuator', '/.aws', '/config.php', '/backup', '/shell', '/cmd',
  '/__pycache__', '/cgi-bin', '/.htaccess', '/server-status',
];

const BAD_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /burpsuite/i, /dirbuster/i,
  /w3af/i, /nessus/i, /metasploit/i, /zgrab/i, /gobuster/i, /wfuzz/i,
  /nuclei/i, /hydra/i, /medusa/i, /acunetix/i, /havij/i, /scanbot/i,
];

const SQLI_PATTERNS = [
  /('|%27|%22)(\s*(or|and|union|select|insert|update|delete|drop|--|\#))/i,
  /\b(union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|drop\s+database)\b/i,
  /(\-\-|#|\/\*[\s\S]*?\*\/)/,
  /\b(sleep|benchmark|waitfor|delay)\s*\(/i,
  /\bload_file\s*\(/i,
];
const NOSQL_PATTERNS = [
  /\$where/i, /\$regex/i,
  /\["?\$gt"?\]/, /\["?\$lt"?\]/, /\["?\$ne"?\]/, /\["?\$in"?\]/,
  /\{\s*["']?\$/,
];
const XSS_PATTERNS = [
  /<script[\s>]/i, /javascript:/i, /vbscript:/i,
  /on\w+\s*=/i, /<iframe/i, /<object/i, /<embed/i, /eval\s*\(/i,
  /document\.cookie/i, /document\.write/i, /window\.location/i,
];
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.(\/|\\|%2F|%5C)/, /%2e%2e(%2f|%5c)/i, /\.\.[\/\\]/,
];
const CMD_INJECTION_PATTERNS = [
  /[;&|`]\s*(ls|cat|rm|whoami|id|uname|wget|curl|bash|sh|python|perl|php)\b/i,
  /\$\(.*\)/, /`[^`]*`/,
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || (req.connection as any)?.remoteAddress || '0.0.0.0';
}

function scanString(str: string): { threat: string; severity: string } | null {
  if (!str || typeof str !== 'string') return null;
  if (SQLI_PATTERNS.some(p => p.test(str))) return { threat: 'sqli', severity: 'high' };
  if (NOSQL_PATTERNS.some(p => p.test(str))) return { threat: 'nosql_injection', severity: 'high' };
  if (XSS_PATTERNS.some(p => p.test(str))) return { threat: 'xss', severity: 'medium' };
  if (PATH_TRAVERSAL_PATTERNS.some(p => p.test(str))) return { threat: 'path_traversal', severity: 'high' };
  if (CMD_INJECTION_PATTERNS.some(p => p.test(str))) return { threat: 'command_injection', severity: 'critical' };
  return null;
}

function deepScan(obj: any, depth = 0): { threat: string; severity: string } | null {
  if (depth > 4) return null;
  if (typeof obj === 'string') return scanString(obj);
  if (Array.isArray(obj)) {
    for (const v of obj) { const r = deepScan(v, depth + 1); if (r) return r; }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const kr = scanString(k); if (kr) return kr;
      const vr = deepScan(v, depth + 1); if (vr) return vr;
    }
  }
  return null;
}

async function getGeo(ip: string) {
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|localhost)/.test(ip)) {
    const local = { country: 'Local', city: '' };
    geoCache.set(ip, local);
    return local;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json() as any;
      const geo = { country: (data.country as string) || 'Unknown', city: (data.city as string) || '' };
      geoCache.set(ip, geo);
      return geo;
    }
  } catch {}
  const fallback = { country: 'Unknown', city: '' };
  geoCache.set(ip, fallback);
  return fallback;
}

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch {}
}

function flushLogs() {
  if (logBatch.length === 0) return;
  const toWrite = logBatch.splice(0);
  SecurityLog.insertMany(toWrite, { ordered: false }).catch(() => {});
}

function queueLog(doc: any) {
  logBatch.push(doc);
  if (!batchTimer) {
    batchTimer = setTimeout(() => { batchTimer = null; flushLogs(); }, BATCH_INTERVAL_MS);
  }
}

async function blockIp(ip: string, reason: string, threat: string, country = '') {
  const expiresAt = new Date(Date.now() + BLOCK_DURATION_MS);
  blockedCache.set(ip, expiresAt.getTime());
  try {
    await BlockedIp.findOneAndUpdate(
      { ip },
      { $set: { reason, threat, country, active: true, expiresAt, autoBlock: true }, $inc: { hitCount: 1 } },
      { upsert: true, new: true }
    );
  } catch {}
  sendTelegramAlert(`🚨 <b>IP BLOCKED</b>\nIP: <code>${ip}</code>\nReason: ${reason}\nThreat: ${threat}\nCountry: ${country}\nExpires: ${expiresAt.toISOString()}`);
}

async function isBlocked(ip: string): Promise<boolean> {
  if (blockedCache.has(ip)) {
    const exp = blockedCache.get(ip)!;
    if (exp === Infinity || exp > Date.now()) return true;
    blockedCache.delete(ip);
  }
  try {
    const record = await BlockedIp.findOne({ ip, active: true });
    if (!record) return false;
    if (record.expiresAt && record.expiresAt < new Date()) {
      BlockedIp.updateOne({ ip }, { $set: { active: false } }).catch(() => {});
      return false;
    }
    blockedCache.set(ip, record.expiresAt ? record.expiresAt.getTime() : Infinity);
    return true;
  } catch { return false; }
}

export async function loadBlockedIpCache() {
  try {
    const active = await BlockedIp.find({ active: true });
    for (const b of active) {
      if (!b.expiresAt || b.expiresAt > new Date()) {
        blockedCache.set(b.ip, b.expiresAt ? b.expiresAt.getTime() : Infinity);
      }
    }
    console.log(`[Security] Loaded ${blockedCache.size} blocked IPs into cache`);
  } catch (e: any) {
    console.error('[Security] Failed to load blocked IP cache:', e.message);
  }
}

// ── Main Middleware ───────────────────────────────────────────────────────────
export default async function securityMonitor(req: Request, res: Response, next: NextFunction) {
  const startMs = Date.now();
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || '';
  const path = req.path || req.url || '/';
  const method = req.method;

  // Authenticated requests (valid Bearer JWT) and internal/local IPs are exempt from
  // IP blocking and rate abuse. This mirrors the express-rate-limit skip for auth'd users.
  const authHeader = req.headers.authorization;
  const isAuthenticated = !!(authHeader && authHeader.startsWith('Bearer ') && authHeader.split('.').length === 3);
  const isLocalhost = /^(::1|::ffff:127\.|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);

  // 1. Check blocked IP (skip for authenticated or internal requests)
  if (!isAuthenticated && !isLocalhost) {
    const blocked = await isBlocked(ip);
    if (blocked) {
      queueLog({ ip, method, endpoint: path, statusCode: 403, threat: 'none', severity: 'info', reason: 'Blocked IP attempted access', userAgent: ua.slice(0, 200), blocked: true, responseMs: Date.now() - startMs });
      return res.status(403).json({ success: false, message: 'Access denied. Your IP has been blocked.' });
    }
  }

  // 2. Rate limiting (skip for authenticated or internal requests)
  const now = Date.now();
  if (!isAuthenticated && !isLocalhost) {
    const rw = reqWindow.get(ip);
    if (!rw || now - rw.windowStart > RATE_WINDOW_MS) {
      reqWindow.set(ip, { count: 1, windowStart: now });
    } else {
      rw.count++;
      if (rw.count >= RATE_BLOCK_LIMIT) {
        const geo = await getGeo(ip);
        await blockIp(ip, `Rate limit exceeded: ${rw.count} req/min`, 'rate_abuse', geo.country);
        queueLog({ ip, method, endpoint: path, statusCode: 429, threat: 'rate_abuse', severity: 'high', reason: `Rate abuse: ${rw.count} req/min`, userAgent: ua.slice(0, 200), country: geo.country, city: geo.city, blocked: true, responseMs: Date.now() - startMs });
        return res.status(429).json({ success: false, message: 'Too many requests. You have been temporarily blocked.' });
      }
    }
  }

  // 3. Bad bot / scanner UA
  if (BAD_UA_PATTERNS.some(p => p.test(ua))) {
    const geo = await getGeo(ip);
    await blockIp(ip, `Scanner tool detected: ${ua.slice(0, 80)}`, 'scanner', geo.country);
    queueLog({ ip, method, endpoint: path, statusCode: 403, threat: 'bad_bot', severity: 'critical', reason: `Scanner UA: ${ua.slice(0, 200)}`, userAgent: ua.slice(0, 200), country: geo.country, city: geo.city, blocked: true, responseMs: Date.now() - startMs });
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  // 4. Known scan paths
  const isScanPath = SCAN_PATHS.some(sp => path.toLowerCase().startsWith(sp));

  // 5. Injection detection
  let injectionResult = scanString(decodeURIComponent(path))
    ?? deepScan(req.query)
    ?? deepScan(req.body);

  if (!injectionResult && PATH_TRAVERSAL_PATTERNS.some(p => p.test(path))) {
    injectionResult = { threat: 'path_traversal', severity: 'high' };
  }

  res.on('finish', async () => {
    const responseMs = Date.now() - startMs;
    const statusCode = res.statusCode;

    // 6. Brute force detection
    let authThreat: any = null;
    if (AUTH_ENDPOINTS.some(e => path.startsWith(e)) && (statusCode === 401 || statusCode === 400)) {
      const af = authFailures.get(ip);
      if (!af || now - af.windowStart > AUTH_FAIL_WINDOW) {
        authFailures.set(ip, { failures: 1, windowStart: now });
      } else {
        af.failures++;
        if (af.failures >= AUTH_FAIL_LIMIT) {
          const geo = await getGeo(ip);
          await blockIp(ip, `Brute force: ${af.failures} failed auth attempts`, 'brute_force', geo.country);
          authThreat = { threat: 'brute_force', severity: 'critical', reason: `Brute force: ${af.failures} failed attempts on ${path}` };
          sendTelegramAlert(`🔐 <b>BRUTE FORCE DETECTED</b>\nIP: <code>${ip}</code>\nEndpoint: ${path}\nAttempts: ${af.failures}`);
        }
      }
    }

    const finalThreat = authThreat || injectionResult;
    const isScanHit = isScanPath && statusCode !== 404;
    const shouldLog = finalThreat !== null || isScanHit || statusCode >= 400 || (reqWindow.get(ip)?.count ?? 0) >= RATE_WARN_LIMIT;
    if (!shouldLog && Math.random() > 0.02) return;

    const geo = await getGeo(ip);
    let severity = 'info', threat = 'none', reason = '';

    if (finalThreat) {
      threat = finalThreat.threat;
      severity = finalThreat.severity;
      reason = finalThreat.reason || `${threat} detected`;
    } else if (isScanHit) {
      threat = 'scanner'; severity = 'medium'; reason = `Scan path accessed: ${path}`;
    } else if (statusCode === 429) {
      threat = 'rate_abuse'; severity = 'medium'; reason = 'Rate limit hit';
    } else if (statusCode >= 500) {
      severity = 'low'; reason = 'Server error';
    }

    if (severity === 'critical' && !authThreat) {
      sendTelegramAlert(`⚠️ <b>${threat.toUpperCase()}</b>\nIP: <code>${ip}</code>\nEndpoint: ${path}\nReason: ${reason}\nCountry: ${geo.country}`);
    }

    let payloadSnip = '';
    try { payloadSnip = JSON.stringify({ q: req.query, b: req.body }).slice(0, 300); } catch {}

    queueLog({
      ip, method, endpoint: path.slice(0, 200), statusCode, threat, severity, reason,
      payloadSnip, userAgent: ua.slice(0, 200), country: geo.country, city: geo.city,
      userId: (req as any).user?._id?.toString() || '',
      blocked: false, responseMs,
    });
  });

  next();
}
