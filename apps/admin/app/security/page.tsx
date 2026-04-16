'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface SecurityLog {
  _id: string; ip: string; method: string; endpoint: string; statusCode: number
  threat: string; severity: string; reason: string; userAgent: string
  country: string; city: string; blocked: boolean; responseMs: number; createdAt: string
}
interface BlockedIp {
  _id: string; ip: string; reason: string; threat: string; autoBlock: boolean
  country: string; hitCount: number; expiresAt: string | null; active: boolean; createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const THREAT_COLORS: Record<string, string> = {
  sqli: '#ef4444', nosql_injection: '#f97316', xss: '#f59e0b',
  path_traversal: '#8b5cf6', command_injection: '#dc2626', brute_force: '#ec4899',
  rate_abuse: '#06b6d4', scanner: '#a78bfa', bad_bot: '#fb923c',
  suspicious_payload: '#fbbf24', none: '#6b7280',
}
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#6b7280',
}
const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(239,68,68,0.12)', high: 'rgba(249,115,22,0.12)',
  medium: 'rgba(245,158,11,0.1)', low: 'rgba(59,130,246,0.1)', info: 'rgba(107,114,128,0.08)',
}

function fmtTime(d: string) { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }
function fmtDate(d: string) { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) }
function threatLabel(t: string) { return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }

const TABS = ['Overview', 'Live Feed', 'Blocked IPs', 'Analytics']

export default function SecurityPage() {
  const [tab, setTab] = useState('Overview')
  const [dashboard, setDashboard] = useState<any>(null)
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([])
  const [loading, setLoading] = useState(true)
  const [logFilter, setLogFilter] = useState({ threat: 'all', severity: 'all' })
  const [blockForm, setBlockForm] = useState({ ip: '', reason: '', duration: '60' })
  const [blockModal, setBlockModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<any>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const res = await adminAPI.securityDashboard()
      if (res.data?.success) setDashboard(res.data)
    } catch {}
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      const params: any = { limit: 100 }
      if (logFilter.threat !== 'all') params.threat = logFilter.threat
      if (logFilter.severity !== 'all') params.severity = logFilter.severity
      const res = await adminAPI.securityLogs(params)
      if (res.data?.success) setLogs(res.data.logs || [])
    } catch {}
  }, [logFilter])

  const loadBlocked = useCallback(async () => {
    try {
      const res = await adminAPI.securityBlocked()
      if (res.data?.success) setBlockedIps(res.data.ips || [])
    } catch {}
  }, [])

  const init = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadDashboard(), loadLogs(), loadBlocked()])
    setLoading(false)
  }, [loadDashboard, loadLogs, loadBlocked])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadDashboard()
        if (tab === 'Live Feed') loadLogs()
        if (tab === 'Blocked IPs') loadBlocked()
      }, 10000)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, tab, loadDashboard, loadLogs, loadBlocked])

  async function unblock(ip: string) {
    try {
      const res = await adminAPI.securityUnblock(ip)
      if (res.data?.success) { toast.success(`${ip} unblocked`); loadBlocked() }
      else toast.error(res.data?.message || 'Failed')
    } catch { toast.error('Failed to unblock') }
  }

  async function manualBlock() {
    if (!blockForm.ip) { toast.error('IP required'); return }
    try {
      const res = await adminAPI.securityBlock({ ...blockForm, duration: parseInt(blockForm.duration) })
      if (res.data?.success) { toast.success(`${blockForm.ip} blocked`); setBlockModal(false); loadBlocked() }
      else toast.error(res.data?.message || 'Failed')
    } catch { toast.error('Failed to block') }
  }

  const s = dashboard?.summary || {}
  const topThreats: any[] = dashboard?.threatBreakdown || []
  const countries: any[] = dashboard?.countryBreakdown || []
  const hourly: any[] = dashboard?.hourlyTrend || []
  const topIps: any[] = dashboard?.topAttackerIps || []
  const maxHourlyCount = Math.max(...hourly.map((h: any) => h.total), 1)

  const activeTabStyle = { background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', color: '#fff', boxShadow: '0 0 14px rgba(124,58,237,0.5)' }
  const inactiveTabStyle = { background: 'transparent', color: 'rgba(255,255,255,0.5)' }
  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 12.5, outline: 'none' as const }

  return (
    <AdminLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 20, marginBottom: 24,
        background: 'linear-gradient(135deg, #0d0d1a 0%, #12103a 40%, #0a0a1a 100%)',
        border: '1px solid rgba(124,58,237,0.25)', padding: '28px 28px 0',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛡️</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #c4b5fd, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Security Dashboard
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                peptly.in — Live attack tracking · IP blocking · Threat analysis
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: autoRefresh ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${autoRefresh ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, cursor: 'pointer' }}
              onClick={() => setAutoRefresh(p => !p)}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: autoRefresh ? '#10b981' : '#6b7280' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: autoRefresh ? '#34d399' : '#6b7280' }}>{autoRefresh ? 'Live' : 'Paused'}</span>
            </div>
            <button onClick={init} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
            <button onClick={() => setBlockModal(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⊘ Block IP</button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Requests Today', value: s.todayRequests ?? '—', color: '#c4b5fd' },
            { label: 'Threats Detected', value: s.todayThreats ?? '—', color: '#f87171' },
            { label: 'High/Critical', value: s.todayCritical ?? '—', color: '#ef4444' },
            { label: 'Active Blocked IPs', value: s.activeBlocked ?? '—', color: '#f97316' },
            { label: 'Last Threat', value: dashboard?.recentLogs?.find((l: SecurityLog) => l.threat !== 'none')?.threat ? threatLabel(dashboard.recentLogs.find((l: SecurityLog) => l.threat !== 'none').threat) : 'None', color: '#fbbf24', small: true },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: (k as any).small ? 14 : 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ position: 'relative', display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: '12px 12px 0 0', padding: '6px 6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 500, transition: 'all 0.2s', whiteSpace: 'nowrap', ...(tab === t ? activeTabStyle : inactiveTabStyle) }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          Loading security data...
        </div>
      )}

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {!loading && tab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Threat breakdown */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Threat Breakdown (7d)</div>
              {topThreats.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>✅ No threats in last 7 days</div>
              ) : topThreats.map((t: any, i: number) => {
                const col = THREAT_COLORS[t._id] || '#6b7280'
                const max = topThreats[0].count || 1
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{threatLabel(t._id)}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{t.count}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(t.count / max) * 100}%`, background: col, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top attacker IPs */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Top Attacker IPs (7d)</div>
              {topIps.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>✅ No attacks logged</div>
              ) : topIps.map((ip: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#8b5cf6', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#fff' }}>{ip._id}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{ip.country} · {(ip.threats || []).slice(0, 2).join(', ')}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{ip.count}</span>
                    <button onClick={() => { setBlockForm({ ip: ip._id, reason: 'Manual block from dashboard', duration: '1440' }); setBlockModal(true) }}
                      style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 4, color: '#8b5cf6', cursor: 'pointer', fontWeight: 700 }}>Block</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Countries */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Attack Sources (Country)</div>
              {countries.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No geo data yet</div>
              ) : countries.map((c: any, i: number) => {
                const max = countries[0].count || 1
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c._id || 'Unknown'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{c.count}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(c.count / max) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hourly traffic */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: '#fff' }}>Hourly Traffic (Last 24h)</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
              {Array.from({ length: 24 }, (_, h) => {
                const data = hourly.find((x: any) => x._id === h)
                const total = data?.total || 0; const threats = data?.threats || 0
                const barH = total > 0 ? Math.max(Math.round((total / maxHourlyCount) * 80), 4) : 2
                const threatH = threats > 0 ? Math.max(Math.round((threats / maxHourlyCount) * 80), 2) : 0
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 80, gap: 1 }}>
                      <div style={{ width: '55%', height: barH, background: 'rgba(124,58,237,0.4)', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                      <div style={{ width: '35%', height: threatH, background: '#ef4444', borderRadius: '3px 3px 0 0', minHeight: threatH > 0 ? 2 : 0 }} />
                    </div>
                    {h % 4 === 0 && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{h}h</div>}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[['rgba(124,58,237,0.4)', 'All Requests'], ['#ef4444', 'Threats']].map(([col, lbl]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />{lbl}
                </div>
              ))}
            </div>
          </div>

          {/* Recent threats table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Recent Threats</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'rgba(124,58,237,0.04)' }}>
                    {['Time', 'IP', 'Endpoint', 'Threat', 'Severity', 'Country', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'rgba(196,181,253,0.7)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentLogs || []).filter((l: SecurityLog) => l.threat !== 'none').slice(0, 15).map((l: SecurityLog, i: number) => {
                    const threatCol = THREAT_COLORS[l.threat] || '#6b7280'
                    const sevCol = SEVERITY_COLORS[l.severity] || '#6b7280'
                    return (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtTime(l.createdAt)}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>{l.ip}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.endpoint}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: threatCol + '18', color: threatCol }}>{threatLabel(l.threat)}</span></td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: SEVERITY_BG[l.severity], color: sevCol }}>{l.severity}</span></td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{l.country || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, fontWeight: 700, color: l.blocked ? '#ef4444' : '#6b7280' }}>{l.statusCode}</span></td>
                      </tr>
                    )
                  })}
                  {(dashboard?.recentLogs || []).filter((l: SecurityLog) => l.threat !== 'none').length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>✅ No threats in last 24 hours</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE FEED ─────────────────────────────────────────────────────── */}
      {!loading && tab === 'Live Feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={logFilter.threat} onChange={e => setLogFilter(p => ({ ...p, threat: e.target.value }))} style={{ ...inp, width: 'auto' }}>
              <option value="all">All Threats</option>
              {['sqli', 'nosql_injection', 'xss', 'path_traversal', 'command_injection', 'brute_force', 'rate_abuse', 'scanner', 'bad_bot', 'none'].map(t => (
                <option key={t} value={t}>{threatLabel(t)}</option>
              ))}
            </select>
            <select value={logFilter.severity} onChange={e => setLogFilter(p => ({ ...p, severity: e.target.value }))} style={{ ...inp, width: 'auto' }}>
              <option value="all">All Severity</option>
              {['critical', 'high', 'medium', 'low', 'info'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={loadLogs} style={{ padding: '8px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{logs.length} logs · auto-refreshes every 10s</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: 'rgba(124,58,237,0.06)', backdropFilter: 'blur(8px)' }}>
                    {['Time', 'IP', 'Method', 'Endpoint', 'Status', 'Threat', 'Severity', 'Country', 'Reason', 'ms'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'rgba(196,181,253,0.7)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => {
                    const threatCol = THREAT_COLORS[l.threat] || '#6b7280'
                    const sevCol = SEVERITY_COLORS[l.severity] || '#6b7280'
                    const isAttack = l.threat !== 'none'
                    return (
                      <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isAttack ? 'rgba(239,68,68,0.02)' : '' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: isAttack ? '#fca5a5' : '#fff', whiteSpace: 'nowrap' }}>{l.ip}</td>
                        <td style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: l.method === 'POST' ? '#60a5fa' : l.method === 'DELETE' ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{l.method}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.endpoint}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: l.statusCode >= 400 ? '#f87171' : '#4ade80' }}>{l.statusCode}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {isAttack ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: threatCol + '18', color: threatCol, whiteSpace: 'nowrap' }}>{threatLabel(l.threat)}</span> : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: SEVERITY_BG[l.severity], color: sevCol }}>{l.severity}</span></td>
                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{l.country || '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: 10, color: 'rgba(255,255,255,0.35)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason}>{l.reason || '—'}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 10, color: l.responseMs > 1000 ? '#fb923c' : 'rgba(255,255,255,0.35)' }}>{l.responseMs}</td>
                      </tr>
                    )
                  })}
                  {logs.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No logs found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCKED IPs ───────────────────────────────────────────────────── */}
      {!loading && tab === 'Blocked IPs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{blockedIps.filter(b => b.active).length} active blocks</div>
            <button onClick={() => { setBlockForm({ ip: '', reason: '', duration: '60' }); setBlockModal(true) }}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              ⊘ Block New IP
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(124,58,237,0.06)' }}>
                  {['IP Address', 'Country', 'Reason', 'Threat', 'Source', 'Hits', 'Expires', 'Blocked At', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'rgba(196,181,253,0.7)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedIps.map((b, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', opacity: b.active ? 1 : 0.4 }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: b.active ? '#fca5a5' : 'rgba(255,255,255,0.4)' }}>{b.ip}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.country || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.reason}>{b.reason}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (THREAT_COLORS[b.threat] || '#6b7280') + '18', color: THREAT_COLORS[b.threat] || '#6b7280' }}>{threatLabel(b.threat)}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: b.autoBlock ? '#fb923c' : '#60a5fa' }}>{b.autoBlock ? '🤖 Auto' : '👤 Manual'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#f87171' }}>{b.hitCount}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{b.expiresAt ? fmtDate(b.expiresAt) : '∞ Permanent'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtDate(b.createdAt)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {b.active && <button onClick={() => unblock(b.ip)} style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Unblock</button>}
                      {!b.active && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Unblocked</span>}
                    </td>
                  </tr>
                ))}
                {blockedIps.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No blocked IPs</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ─────────────────────────────────────────────────────── */}
      {!loading && tab === 'Analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Severity Distribution (7d)</div>
              {['critical', 'high', 'medium', 'low', 'info'].map(sev => {
                const count = (dashboard?.recentLogs || []).filter((l: SecurityLog) => l.severity === sev).length
                const total = (dashboard?.recentLogs || []).length || 1
                const pct = Math.round((count / total) * 100)
                const col = SEVERITY_COLORS[sev]
                return (
                  <div key={sev} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: col, textTransform: 'capitalize' }}>{sev}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Block Statistics</div>
              {[
                { label: 'Total Blocked (Ever)', value: blockedIps.length, color: '#f87171' },
                { label: 'Active Blocks', value: blockedIps.filter(b => b.active).length, color: '#ef4444' },
                { label: 'Auto-blocked', value: blockedIps.filter(b => b.autoBlock).length, color: '#fb923c' },
                { label: 'Manually blocked', value: blockedIps.filter(b => !b.autoBlock).length, color: '#60a5fa' },
                { label: 'Permanent blocks', value: blockedIps.filter(b => !b.expiresAt && b.active).length, color: '#ef4444' },
                { label: 'Temporary blocks', value: blockedIps.filter(b => !!b.expiresAt && b.active).length, color: 'rgba(255,255,255,0.4)' },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{k.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: k.color }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security health */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Security Health Check</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Helmet.js Headers', status: 'active', desc: 'CSP, HSTS, X-Frame enabled' },
                { label: 'CORS Protection', status: 'active', desc: 'Only peptly.in origins allowed' },
                { label: 'Rate Limiting', status: 'active', desc: '400 req/min limit per IP' },
                { label: 'Injection Detection', status: 'active', desc: 'SQLi, NoSQLi, XSS, Path traversal' },
                { label: 'Auto IP Blocking', status: 'active', desc: '1h auto-block on trigger' },
                { label: 'Brute Force Guard', status: 'active', desc: '10 failed auth → blocked' },
                { label: 'Scanner Detection', status: 'active', desc: 'sqlmap, nikto, nmap blocked' },
                { label: 'Telegram Alerts', status: process.env.NEXT_PUBLIC_TELEGRAM_ENABLED ? 'active' : 'inactive', desc: 'Critical threat notifications' },
                { label: 'Geo Tracking', status: 'active', desc: 'IP country/city via ip-api.com' },
              ].map((check, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px', border: `1px solid ${check.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: check.status === 'active' ? '#10b981' : '#f59e0b' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{check.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{check.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK IP MODAL ────────────────────────────────────────────────── */}
      {blockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setBlockModal(false)}>
          <div style={{ background: '#12103a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 18, padding: '28px 32px', width: 420, borderTop: '3px solid #7c3aed', boxShadow: '0 0 40px rgba(124,58,237,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 20, color: '#fff' }}>⊘ Block IP Address</div>
            {[
              { k: 'ip', l: 'IP Address *', p: '1.2.3.4' },
              { k: 'reason', l: 'Reason', p: 'Suspicious activity' },
              { k: 'duration', l: 'Duration (minutes, 0 = permanent)', p: '60' },
            ].map((f: any) => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, display: 'block' }}>{f.l}</label>
                <input value={(blockForm as any)[f.k]} onChange={e => setBlockForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.p} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setBlockModal(false)} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={manualBlock} style={{ flex: 1, padding: 11, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Block IP</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
