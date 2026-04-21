import { Router } from 'express';
import { CronJob } from 'cron';
import { protect, authorize } from '../middleware/auth';
import NovaConfig from '../models/NovaConfig';
import EmployeeReport from '../models/EmployeeReport';
import User from '../models/User';
import Task from '../models/Task';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import { novaChat, generateAndSendFounderReport, generateMorningBriefing } from '../services/novaAgentService';
import { sendWhatsAppText, broadcastWhatsApp } from '../services/whatsappMetaService';
import { format } from 'date-fns';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayIST(): Date {
  const now = new Date();
  // IST = UTC+5:30, get start of today in IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  return new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
}

function normalisePhone(phone: string) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '91' + p.slice(1);
  if (!p.startsWith('91') && p.length === 10) p = '91' + p;
  return p;
}

async function logAction(action: string, detail: string) {
  try {
    await NovaConfig.updateOne({}, {
      $push: { actionLog: { $each: [{ action, detail, ts: new Date() }], $slice: -100 } }
    }, { upsert: true });
  } catch (_) {}
}

// ── Employee helpers ──────────────────────────────────────────────────────────

async function getEmployees() {
  return User.find({
    role: { $in: ['admin', 'manager', 'employee', 'salesperson'] },
    isActive: true,
    phone: { $exists: true, $ne: '' },
  }).select('name email phone role department').lean();
}

async function getEmployeeTasks(employeeId: string) {
  const [pending, inProgress, done] = await Promise.all([
    Task.find({ assignedTo: employeeId, status: 'todo' }).select('title priority dueDate').lean(),
    Task.find({ assignedTo: employeeId, status: 'in-progress' }).select('title priority dueDate').lean(),
    Task.find({ assignedTo: employeeId, status: 'done', updatedAt: { $gte: todayIST() } }).select('title').lean(),
  ]);
  return { pending, inProgress, done };
}

async function getEmployeePerformance(employeeId: string) {
  const today = todayIST();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [recentReports, commissions] = await Promise.all([
    EmployeeReport.find({ employee: employeeId, date: { $gte: weekAgo }, status: 'submitted' })
      .sort('-date').limit(7).lean(),
    Commission.aggregate([
      { $match: { earner: employeeId as any, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
    ]),
  ]);
  return {
    reportedDays: recentReports.length,
    avgScore: recentReports.length ? (recentReports.reduce((s, r) => s + (r.performanceScore || 5), 0) / recentReports.length).toFixed(1) : 'N/A',
    weeklyCommission: commissions[0]?.total || 0,
    recentReports: recentReports.slice(0, 3),
  };
}

// ── Morning briefing per employee ─────────────────────────────────────────────

async function sendMorningBriefingToEmployee(emp: any) {
  const today = todayIST();
  const tasks = await getEmployeeTasks(emp._id.toString());
  const perf = await getEmployeePerformance(emp._id.toString());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yReport = await EmployeeReport.findOne({ employee: emp._id, date: yesterday });

  const allTasks = [...tasks.pending, ...tasks.inProgress];
  const taskList = allTasks.slice(0, 5).map(t => `  • ${t.title} [${(t as any).priority?.toUpperCase() || 'MEDIUM'}]`).join('\n') || '  • No tasks assigned';
  const doneCount = tasks.done.length;
  const totalActive = allTasks.length;

  const msg = `☀️ *Good morning, ${emp.name}!*
📅 ${format(new Date(), 'EEEE, dd MMM yyyy')}

📋 *Your Tasks Today* (${totalActive} active)
${taskList}${totalActive > 5 ? `\n  ...and ${totalActive - 5} more` : ''}

📊 *This Week*
• Reports submitted: ${perf.reportedDays}/7 days
• Avg performance: ${perf.avgScore}/10
${perf.weeklyCommission > 0 ? `• Commission earned: ₹${perf.weeklyCommission.toLocaleString('en-IN')}` : ''}

${yReport?.status === 'submitted' ? `✅ Yesterday's report: received` : `⚠️ Yesterday's report: missing`}

💬 Reply with your EOD update anytime today.
— NOVA, TruLearnix AI`;

  const sent = await sendWhatsAppText(emp.phone, msg);
  if (sent) {
    await EmployeeReport.findOneAndUpdate(
      { employee: emp._id, date: today },
      { $set: { sentBriefing: true } },
      { upsert: true, new: true }
    );
  }
  return sent;
}

// ── EOD reminder per employee ─────────────────────────────────────────────────

async function sendEodReminderToEmployee(emp: any) {
  const today = todayIST();
  const existing = await EmployeeReport.findOne({ employee: emp._id, date: today });
  if (existing?.status === 'submitted') return true; // already submitted

  const msg = `🌆 *Hey ${emp.name}, time for your daily report!*

Please reply with:
1️⃣ What did you accomplish today?
2️⃣ Any blockers or challenges?
3️⃣ Plan for tomorrow?

📝 Just reply to this message with your update.

Your report goes directly to the founder.
— NOVA`;

  const sent = await sendWhatsAppText(emp.phone, msg);
  if (sent) {
    await EmployeeReport.findOneAndUpdate(
      { employee: emp._id, date: today },
      { $set: { sentEodReminder: true } },
      { upsert: true, new: true }
    );
  }
  return sent;
}

// ── Parse and save employee WhatsApp report ───────────────────────────────────

async function saveEmployeeReport(employee: any, text: string) {
  const today = todayIST();

  // Simple AI summary if OpenAI available, else use raw text
  let aiSummary = text.slice(0, 200);
  let performanceScore = 5;

  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are NOVA, an AI for TruLearnix. Summarize this employee daily report in 1-2 sentences and give a performance score 1-10. Reply as JSON: {"summary":"...","score":7}'
        }, { role: 'user', content: `Employee: ${employee.name} (${employee.department || employee.role})\nReport: ${text}` }],
        temperature: 0.3,
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      aiSummary = parsed.summary || text.slice(0, 200);
      performanceScore = Math.min(10, Math.max(1, parsed.score || 5));
    } catch (_) {}
  }

  await EmployeeReport.findOneAndUpdate(
    { employee: employee._id, date: today },
    {
      $set: {
        reportText: text,
        accomplishments: text,
        status: 'submitted',
        reportedAt: new Date(),
        aiSummary,
        performanceScore,
      }
    },
    { upsert: true, new: true }
  );

  // Ack to employee
  await sendWhatsAppText(employee.phone, `✅ *Report saved, ${employee.name}!*\n\n${performanceScore >= 7 ? '🌟 Great work today!' : performanceScore >= 5 ? '👍 Good effort!' : '💪 Keep pushing!'}\n\nYour report has been forwarded to the founder.\n— NOVA`);

  // Check if all employees have reported → send founder compilation
  const config = await NovaConfig.findOne();
  if (config?.founderPhone) {
    const allEmps = await getEmployees();
    const todayReports = await EmployeeReport.find({ date: today, status: 'submitted' });
    const remaining = allEmps.length - todayReports.length;
    if (remaining === 0 || remaining <= 1) {
      await sendCompiledReportToFounder(config.founderPhone, config.founderName);
    }
  }

  await logAction('Employee Report', `${employee.name} submitted daily report (score: ${performanceScore}/10)`);
}

// ── Compiled team report for founder ─────────────────────────────────────────

async function sendCompiledReportToFounder(founderPhone: string, founderName: string) {
  const today = todayIST();
  const allEmps = await getEmployees();
  const reports = await EmployeeReport.find({ date: today })
    .populate('employee', 'name department role')
    .sort('-performanceScore').lean();

  const submitted = reports.filter(r => r.status === 'submitted');
  const pending = allEmps.filter(e => !reports.find(r => r.employee?.toString() === e._id.toString() && r.status === 'submitted'));

  const reportLines = submitted.map(r => {
    const emp = r.employee as any;
    const score = r.performanceScore ? `⭐${r.performanceScore}/10` : '';
    return `*${emp?.name}* (${emp?.department || emp?.role}) ${score}\n> ${r.aiSummary || r.reportText?.slice(0, 150) || '—'}`;
  }).join('\n\n');

  const pendingNames = pending.map(e => `• ${e.name} (${e.department || e.role})`).join('\n');

  const msg = `📊 *Team Daily Report — ${format(new Date(), 'dd MMM yyyy')}*

👥 Submitted: ${submitted.length}/${allEmps.length} employees

${reportLines || 'No reports yet.'}

${pending.length > 0 ? `\n⚠️ *Awaiting Reports (${pending.length}):*\n${pendingNames}` : '\n✅ All team members have reported!'}

${submitted.length > 0 ? `\n📈 Team Avg Score: ${(submitted.reduce((s, r) => s + (r.performanceScore || 5), 0) / submitted.length).toFixed(1)}/10` : ''}

— NOVA`;

  await sendWhatsAppText(founderPhone, msg);
  await logAction('Founder Report', `Team report sent — ${submitted.length}/${allEmps.length} submitted`);
}

// ── WhatsApp Webhook (public) ─────────────────────────────────────────────────

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.META_WA_VERIFY_TOKEN || 'nova_verify')) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always ack immediately
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;
    const entry = body.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages?.length) return;
    const message = entry.messages[0];
    const rawPhone = message.from;
    const text = message.text?.body?.trim() || '';
    if (!text) return;

    const normPhone = normalisePhone(rawPhone);

    // Find who sent this
    const allUsers = await User.find({ phone: { $exists: true, $ne: '' } }).select('_id name role phone department').lean();
    const sender = allUsers.find(u => {
      const uPhone = normalisePhone(u.phone || '');
      return uPhone === normPhone || uPhone.endsWith(normPhone.slice(-9)) || normPhone.endsWith(uPhone.slice(-9));
    });

    if (!sender) return; // unknown number, ignore

    const config = await NovaConfig.findOne();

    // ── Is founder? ──
    const founderNorm = normalisePhone(config?.founderPhone || '');
    const isFounder = founderNorm && (normPhone === founderNorm || normPhone.endsWith(founderNorm.slice(-9)) || founderNorm.endsWith(normPhone.slice(-9)));

    if (isFounder) {
      // Founder chatting with NOVA
      const history = (config?.conversationHistory || []).slice(-10).map(h => ({ role: h.role, content: h.content }));
      const reply = await novaChat(text, history as any);
      await sendWhatsAppText(rawPhone, reply);
      await NovaConfig.updateOne({}, {
        $push: {
          conversationHistory: { $each: [
            { role: 'user', content: text, ts: new Date() },
            { role: 'assistant', content: reply, ts: new Date() },
          ], $slice: -60 }
        }
      });
      return;
    }

    // ── Is employee? ──
    const isEmployee = ['admin', 'manager', 'employee'].includes(sender.role);
    if (isEmployee) {
      const today = todayIST();
      const existingReport = await EmployeeReport.findOne({ employee: sender._id, date: today });

      // Check if they've been sent an EOD reminder (i.e., they're replying to the request)
      const looksLikeReport = text.length > 20 && !text.toLowerCase().startsWith('hello') && !text.toLowerCase().startsWith('hi');

      if (looksLikeReport && (!existingReport || existingReport.status === 'pending')) {
        // Save as their daily report
        await saveEmployeeReport(sender, text);
      } else if (existingReport?.status === 'submitted') {
        await sendWhatsAppText(rawPhone, `✅ *${sender.name}*, we already have your report for today!\n\nWant to update it? Please reply with your updated report starting with "UPDATE:"\n— NOVA`);
      } else if (text.toLowerCase().startsWith('update:')) {
        const updatedText = text.slice(7).trim();
        await saveEmployeeReport(sender, updatedText);
      } else {
        // General query from employee
        const reply = await novaChat(`Employee ${sender.name} (${sender.department || sender.role}) asks: ${text}`, []);
        await sendWhatsAppText(rawPhone, reply);
      }
    }
  } catch (e) {
    console.error('[NOVA webhook]', e);
  }
});

// ── Protected routes ──────────────────────────────────────────────────────────

router.use(protect, authorize('superadmin', 'admin'));

// GET /nova/config
router.get('/config', async (_req, res) => {
  try {
    let config = await NovaConfig.findOne();
    if (!config) config = await NovaConfig.create({});
    const obj = config.toObject() as any;
    delete obj.conversationHistory;
    res.json({ success: true, config: obj });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /nova/config
router.put('/config', async (req, res) => {
  try {
    let config = await NovaConfig.findOne();
    if (!config) config = await NovaConfig.create({});
    const allowed = ['founderPhone','founderName','morningBriefing','eodReminder','weeklyReport','newSaleAlert','newLearnerAlert','classReminder','lowAttendanceAlert','autoOnboarding','employeeReminders'];
    allowed.forEach(k => { if (req.body[k] !== undefined) (config as any)[k] = req.body[k]; });
    await config.save();
    initNovaCrons(config);
    res.json({ success: true, config });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/chat
router.post('/chat', async (req: any, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
    let config = await NovaConfig.findOne();
    if (!config) config = await NovaConfig.create({});
    const history = (config.conversationHistory || []).slice(-10).map(h => ({ role: h.role, content: h.content }));
    const reply = await novaChat(message, history as any);
    config.conversationHistory = [
      ...(config.conversationHistory || []).slice(-40),
      { role: 'user', content: message, ts: new Date() },
      { role: 'assistant', content: reply, ts: new Date() },
    ];
    await config.save();
    res.json({ success: true, reply });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /nova/history
router.get('/history', async (_req, res) => {
  try {
    const config = await NovaConfig.findOne();
    res.json({ success: true, history: (config?.conversationHistory || []).slice(-30) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /nova/history
router.delete('/history', async (_req, res) => {
  try {
    await NovaConfig.updateOne({}, { conversationHistory: [] });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /nova/pulse
router.get('/pulse', async (_req, res) => {
  try {
    const today = todayIST();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [
      todaySales, monthSales, totalStudents, todayStudents,
      liveClasses, openTickets, pendingWithdrawals, todayReports, totalEmps,
      totalPartners, hotLeads, pendingKyc, liveWebinars, pendingComm,
    ] = await Promise.all([
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: today } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      PackagePurchase.aggregate([{ $match: { status: 'paid', createdAt: { $gte: monthStart } } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', createdAt: { $gte: today } }),
      (await import('../models/LiveClass')).default.countDocuments({ status: 'live' }),
      (await import('../models/SupportTicket')).default.countDocuments({ status: 'open' }),
      (await import('../models/Withdrawal')).default.aggregate([{ $match: { hrStatus: 'pending' } }, { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
      EmployeeReport.countDocuments({ date: today, status: 'submitted' }),
      User.countDocuments({ role: { $in: ['admin', 'manager', 'employee', 'salesperson'] }, isActive: true }),
      User.countDocuments({ isAffiliate: true, isActive: true }),
      (await import('../models/Lead')).default.countDocuments({ aiScoreLabel: 'hot' }),
      (async () => { try { const KYC = require('../models/KYCVerification').default; return KYC.countDocuments({ status: 'submitted' }); } catch { return 0; } })(),
      (await import('../models/Webinar')).default.countDocuments({ status: 'live' }),
      Commission.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$commissionAmount' } } }]),
    ]);
    res.json({
      success: true,
      pulse: {
        today: { revenue: todaySales[0]?.revenue || 0, sales: todaySales[0]?.count || 0, newLearners: todayStudents },
        month: { revenue: monthSales[0]?.revenue || 0, sales: monthSales[0]?.count || 0 },
        totalLearners: totalStudents,
        liveClasses,
        liveWebinars,
        openTickets,
        pendingWithdrawals: pendingWithdrawals[0]?.count || 0,
        pendingWithdrawalAmount: pendingWithdrawals[0]?.amount || 0,
        pendingKyc,
        hotLeads,
        totalPartners,
        pendingCommissions: { count: pendingComm[0]?.count || 0, amount: pendingComm[0]?.amount || 0 },
        employeeReports: { submitted: todayReports, total: totalEmps },
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /nova/action-log
router.get('/action-log', async (_req, res) => {
  try {
    const config = await NovaConfig.findOne();
    res.json({ success: true, log: (config?.actionLog || []).slice(-50).reverse() });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/send-whatsapp
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;
    const ok = await sendWhatsAppText(phone, message);
    await logAction('WhatsApp Sent', `To: ${phone}`);
    res.json({ success: ok });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/broadcast
router.post('/broadcast', async (req, res) => {
  try {
    const { phones, message } = req.body;
    const result = await broadcastWhatsApp(phones, message);
    await logAction('WA Broadcast', `Sent: ${result.sent}, Failed: ${result.failed}`);
    res.json({ success: true, ...result });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/founder-report
router.post('/founder-report', async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    const config = await NovaConfig.findOne();
    if (!config?.founderPhone) return res.status(400).json({ success: false, message: 'Founder phone not configured' });
    const ok = await generateAndSendFounderReport(config.founderPhone, config.founderName, period);
    await logAction('Founder Report', `${period} sent`);
    res.json({ success: ok });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Employee Report endpoints ──────────────────────────────────────────────────

// GET /nova/employee-reports?date=YYYY-MM-DD
router.get('/employee-reports', async (req, res) => {
  try {
    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : todayIST();
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const [reports, employees] = await Promise.all([
      EmployeeReport.find({ date: { $gte: date, $lt: nextDay } })
        .populate('employee', 'name email phone role department')
        .sort('-reportedAt').lean(),
      getEmployees(),
    ]);

    // Merge: all employees + their report (if exists)
    const merged = employees.map(emp => {
      const report = reports.find(r => r.employee?._id?.toString() === emp._id.toString());
      return { employee: emp, report: report || null };
    });

    const submitted = reports.filter(r => r.status === 'submitted').length;
    res.json({ success: true, date, merged, summary: { total: employees.length, submitted, pending: employees.length - submitted } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /nova/employee-reports/:employeeId — individual history
router.get('/employee-reports/:employeeId', async (req, res) => {
  try {
    const emp = await User.findById(req.params.employeeId).select('name email phone role department').lean();
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const reports = await EmployeeReport.find({ employee: req.params.employeeId })
      .sort('-date').limit(30).lean();

    const tasks = await getEmployeeTasks(req.params.employeeId);
    const perf = await getEmployeePerformance(req.params.employeeId);

    res.json({ success: true, employee: emp, reports, tasks, performance: perf });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/send-morning-briefings — trigger for all employees
router.post('/send-morning-briefings', async (req, res) => {
  try {
    const employees = await getEmployees();
    let sent = 0, failed = 0;
    for (const emp of employees) {
      const ok = await sendMorningBriefingToEmployee(emp);
      ok ? sent++ : failed++;
      await new Promise(r => setTimeout(r, 300));
    }
    await logAction('Morning Briefings', `Sent: ${sent}, Failed: ${failed} (${employees.length} employees)`);
    res.json({ success: true, sent, failed, total: employees.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/request-eod-reports — ask all employees for EOD
router.post('/request-eod-reports', async (req, res) => {
  try {
    const employees = await getEmployees();
    let sent = 0, failed = 0, alreadySubmitted = 0;
    for (const emp of employees) {
      const today = todayIST();
      const existing = await EmployeeReport.findOne({ employee: emp._id, date: today, status: 'submitted' });
      if (existing) { alreadySubmitted++; continue; }
      const ok = await sendEodReminderToEmployee(emp);
      ok ? sent++ : failed++;
      await new Promise(r => setTimeout(r, 300));
    }
    await logAction('EOD Reminders', `Sent: ${sent}, Already done: ${alreadySubmitted}, Failed: ${failed}`);
    res.json({ success: true, sent, alreadySubmitted, failed });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/send-team-report — compile + send to founder now
router.post('/send-team-report', async (req, res) => {
  try {
    const config = await NovaConfig.findOne();
    if (!config?.founderPhone) return res.status(400).json({ success: false, message: 'Founder phone not configured' });
    await sendCompiledReportToFounder(config.founderPhone, config.founderName);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /nova/manual-report/:employeeId — admin manually records report
router.post('/manual-report/:employeeId', async (req, res) => {
  try {
    const emp = await User.findById(req.params.employeeId).select('name phone').lean();
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    const { text } = req.body;
    await saveEmployeeReport(emp, text);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /nova/employee-tasks/:employeeId
router.get('/employee-tasks/:employeeId', async (req, res) => {
  try {
    const tasks = await getEmployeeTasks(req.params.employeeId);
    res.json({ success: true, ...tasks });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Cron management ───────────────────────────────────────────────────────────

let activeCrons: CronJob[] = [];

export function initNovaCrons(config?: any) {
  activeCrons.forEach(c => c.stop());
  activeCrons = [];
  if (!config) return;

  // Morning briefing to all employees
  if (config.morningBriefing?.enabled) {
    const [h, m] = (config.morningBriefing.time || '09:00').split(':');
    const job = new CronJob(`0 ${m} ${h} * * *`, async () => {
      const emps = await getEmployees();
      for (const emp of emps) { await sendMorningBriefingToEmployee(emp); await new Promise(r => setTimeout(r, 300)); }
      if (config.founderPhone) await generateMorningBriefing(config.founderPhone);
      await logAction('Auto Morning Briefing', `Sent to ${emps.length} employees + founder`);
    }, null, true, 'Asia/Kolkata');
    activeCrons.push(job);
  }

  // EOD reminder
  if (config.eodReminder?.enabled) {
    const [h, m] = (config.eodReminder.time || '18:00').split(':');
    const job = new CronJob(`0 ${m} ${h} * * 1-6`, async () => {
      const emps = await getEmployees();
      for (const emp of emps) { await sendEodReminderToEmployee(emp); await new Promise(r => setTimeout(r, 300)); }
      await logAction('Auto EOD Reminder', `Sent to ${emps.length} employees`);
    }, null, true, 'Asia/Kolkata');
    activeCrons.push(job);
  }

  // Founder compilation at 9 PM (if EOD enabled)
  if (config.eodReminder?.enabled && config.founderPhone) {
    const job = new CronJob('0 0 21 * * 1-6', async () => {
      await sendCompiledReportToFounder(config.founderPhone, config.founderName);
    }, null, true, 'Asia/Kolkata');
    activeCrons.push(job);
  }

  // Weekly report
  if (config.weeklyReport?.enabled && config.founderPhone) {
    const [h, m] = (config.weeklyReport.time || '10:00').split(':');
    const day = config.weeklyReport.day ?? 0;
    const job = new CronJob(`0 ${m} ${h} * * ${day}`, async () => {
      await generateAndSendFounderReport(config.founderPhone, config.founderName, 'weekly');
      await logAction('Auto Weekly Report', 'Sent to founder');
    }, null, true, 'Asia/Kolkata');
    activeCrons.push(job);
  }
}

// ── EMI Reminder Cron (runs daily at 9 AM IST) ────────────────────────────────
async function runEmiReminders() {
  try {
    const EmiInstallment = (await import('../models/EmiInstallment')).default;
    const { sendPurchaseWelcomeEmail } = await import('../services/emailService');
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';

    const now = new Date();

    // 1. Reminders for due in 3 days
    const in3Days = new Date(now); in3Days.setDate(in3Days.getDate() + 3);
    const in3Start = new Date(in3Days); in3Start.setHours(0, 0, 0, 0);
    const in3End = new Date(in3Days); in3End.setHours(23, 59, 59, 999);

    const dueSoon = await EmiInstallment.find({
      status: 'pending',
      dueDate: { $gte: in3Start, $lte: in3End },
    }).populate('user', 'name email phone').lean();

    for (const inst of dueSoon) {
      const user = inst.user as any;
      if (!user) continue;
      const payLink = (inst as any).paymentLink || `${webUrl}/pay/emi/${(inst as any)._id}`;
      const msg = `⏰ Reminder: Your EMI installment ${inst.installmentNumber}/${inst.totalInstallments} of ₹${inst.amount} is due in 3 days (${new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}).\n\nPay now to avoid access suspension:\n${payLink}`;
      if (user.phone) { try { await sendWhatsAppText(user.phone, msg); } catch {} }
    }

    // 2. Due today reminders
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const dueToday = await EmiInstallment.find({
      status: 'pending',
      dueDate: { $gte: todayStart, $lte: todayEnd },
    }).populate('user', 'name email phone').lean();

    for (const inst of dueToday) {
      const user = inst.user as any;
      if (!user) continue;
      const payLink = (inst as any).paymentLink || `${webUrl}/pay/emi/${(inst as any)._id}`;
      const msg = `🔔 Today is the last day to pay your EMI installment ${inst.installmentNumber}/${inst.totalInstallments} — ₹${inst.amount}.\n\nPay now to keep your access active:\n${payLink}`;
      if (user.phone) { try { await sendWhatsAppText(user.phone, msg); } catch {} }
      if (user.email) { try { await sendPurchaseWelcomeEmail(user.email, user.name, `EMI Due Today — Installment ${inst.installmentNumber}/${inst.totalInstallments}`, user.email, ''); } catch {} }
    }

    // 3. Mark overdue (7+ days past due) and suspend
    const overdueThreshold = new Date(now); overdueThreshold.setDate(overdueThreshold.getDate() - 7);
    const newlyOverdue = await EmiInstallment.find({
      status: 'pending',
      dueDate: { $lt: overdueThreshold },
    }).populate('user', 'name email phone').lean();

    for (const inst of newlyOverdue) {
      await EmiInstallment.findByIdAndUpdate((inst as any)._id, { status: 'overdue' });
      const user = inst.user as any;
      if (!user) continue;
      await User.findByIdAndUpdate(user._id, { packageSuspended: true });
      const payLink = (inst as any).paymentLink || `${webUrl}/pay/emi/${(inst as any)._id}`;
      const msg = `⚠️ Your dashboard access has been suspended! EMI installment ${inst.installmentNumber}/${inst.totalInstallments} of ₹${inst.amount} is overdue.\n\nPay immediately to restore access:\n${payLink}`;
      if (user.phone) { try { await sendWhatsAppText(user.phone, msg); } catch {} }
    }

    console.log(`[EMI Cron] due-soon:${dueSoon.length} due-today:${dueToday.length} overdue:${newlyOverdue.length}`);
  } catch (e) {
    console.error('[EMI Cron Error]', e);
  }
}

export async function bootstrapNovaCrons() {
  try {
    const config = await NovaConfig.findOne();
    if (config) initNovaCrons(config);

    // EMI reminders — daily at 9 AM IST regardless of nova config
    new CronJob('0 0 9 * * *', runEmiReminders, null, true, 'Asia/Kolkata');
    console.log('[NOVA] Crons initialized');
  } catch (e) {
    console.error('[NOVA] Cron bootstrap error:', e);
  }
}

export default router;
