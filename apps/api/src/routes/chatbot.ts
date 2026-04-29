import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import Package from '../models/Package';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

const router = Router();

const SUPPORT_PHONE = '918979616798';
const SUPPORT_EMAIL = 'official@trulearnix.com';
const INTRO_VIDEO = 'https://www.youtube.com/watch?v=7rkNye-Ennw';

// Cached platform context — refreshed every 5 minutes so the bot stays current
// without hammering the DB on every chat.
let cachedContext: { text: string; expires: number } | null = null;
const CONTEXT_TTL_MS = 5 * 60 * 1000;

async function buildPlatformContext(): Promise<string> {
  if (cachedContext && Date.now() < cachedContext.expires) return cachedContext.text;

  const [packages, courses] = await Promise.all([
    Package.find({ isActive: true, tier: { $ne: 'free' } })
      .select('name tier price description features liveClassAccess aiCoachAccess jobEngineAccess communityAccess emiAvailable emiMonthlyAmount')
      .sort('displayOrder price')
      .lean(),
    Course.find({ status: 'published' })
      .select('title category level isCompulsory shortDescription')
      .sort('-enrolledCount')
      .limit(40)
      .lean(),
  ]);

  const pkgLines = packages.map((p: any) => {
    const feats = (p.features || []).slice(0, 4).join(', ');
    const access: string[] = [];
    if (p.liveClassAccess) access.push('live classes');
    if (p.aiCoachAccess) access.push('AI coach');
    if (p.jobEngineAccess) access.push('job engine');
    if (p.communityAccess) access.push('community');
    const emi = p.emiAvailable && p.emiMonthlyAmount ? ` · EMI from ₹${p.emiMonthlyAmount}/month` : '';
    return `- ${p.name} (₹${p.price.toLocaleString('en-IN')}): ${p.description?.slice(0, 120) || ''}${access.length ? ' · Includes: ' + access.join(', ') : ''}${feats ? ' · ' + feats : ''}${emi}`;
  }).join('\n');

  const courseLines = courses.map((c: any) => {
    const tag = c.isCompulsory ? ' [Required]' : '';
    return `- ${c.title} (${c.category}, ${c.level})${tag}`;
  }).join('\n');

  const text = `
=== TruLearnix Platform Overview ===
TruLearnix is a learning + earning platform: live courses, AI coach, projects, certifications, and a 3-level affiliate/MLM program where partners earn commissions on package sales.

Roles on the platform:
- Student / Learner — buys a package, takes courses, attends live classes, gets certificates
- Partner — affiliate who shares referral links and earns L1/L2/L3 commissions on sales
- Mentor — creates and teaches courses, manages batches, runs live classes
- Manager (Student Manager) — oversees a group of partners, earns override commissions
- Salesperson — closes leads via the CRM, earns sales commissions
- Employee — internal team (admin/HR/operations)

Key features:
- Packages with tier-based access (Starter / Pro / Elite / Supreme — actual list below)
- Courses, Live Classes, AI Coach, Quizzes, Assignments, Certificates, Report Cards
- Affiliate panel with referral link generator, leaderboard, EMI commissions
- Wallet + Withdrawals (Razorpay payouts), KYC verification
- WhatsApp + Email notifications via Meta Cloud API
- Community page with package-wise Telegram & WhatsApp groups
- Compulsory courses auto-enroll for every paid learner; self-enroll capped at 2 active courses

Platform Intro Video: ${INTRO_VIDEO}

=== Active Packages ===
${pkgLines || '(no active packages)'}

=== Popular / Featured Courses ===
${courseLines || '(no published courses yet)'}

=== Support Contact ===
WhatsApp: +91 8979616798 · Email: ${SUPPORT_EMAIL}
`.trim();

  cachedContext = { text, expires: Date.now() + CONTEXT_TTL_MS };
  return text;
}

async function buildUserContext(user: any): Promise<string> {
  if (!user) return 'The user is NOT logged in. Treat them as a new candidate exploring TruLearnix.';
  const role = user.role || 'student';
  const tier = user.packageTier || 'free';
  const lines: string[] = [
    `Logged-in user: ${user.name || 'Learner'} · role: ${role} · plan: ${tier}`,
  ];
  if (role === 'student') {
    const enrollments = await Enrollment.countDocuments({ student: user._id });
    lines.push(`Enrolled in ${enrollments} course(s).`);
  }
  if (user.isAffiliate) lines.push('Has the partner/affiliate panel unlocked.');
  if (user.isIndustrialPartner) lines.push('Industrial partner with extra earnings configured.');
  return lines.join(' ');
}

router.get('/intro', (_req, res) => {
  res.json({
    success: true,
    introVideo: INTRO_VIDEO,
    supportPhone: SUPPORT_PHONE,
    supportEmail: SUPPORT_EMAIL,
    welcome: 'Hi! Main TruLearnix ka virtual assistant hoon. Platform ke baare mein, packages, courses, ya support — kuch bhi pucho.',
    quickQuestions: [
      'What is TruLearnix and how does it work?',
      'Which package should I buy?',
      'How do I become a partner and earn commissions?',
      'Mentor / Salesperson kaise ban sakte hain?',
      'Mera package upgrade kaise karein?',
      'Withdrawal kaise kare?',
    ],
  });
});

router.post('/ask', optionalAuth, async (req: any, res) => {
  try {
    const { message, history } = req.body as { message?: string; history?: { role: 'user' | 'assistant'; content: string }[] };
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message required' });
    }

    const [platformCtx, userCtx] = await Promise.all([
      buildPlatformContext(),
      buildUserContext(req.user),
    ]);

    if (!process.env.OPENAI_API_KEY) {
      // Graceful fallback when OpenAI is not configured
      return res.json({
        success: true,
        reply: `Main abhi offline assistant ke saath hoon. Direct support ke liye WhatsApp karein: https://wa.me/${SUPPORT_PHONE}, ya intro video dekhein: ${INTRO_VIDEO}`,
        introVideo: INTRO_VIDEO,
        supportPhone: SUPPORT_PHONE,
        model: 'fallback',
      });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are TruLearnix's official platform guide and support assistant. Help anyone — students, partners, mentors, managers, salespersons, employees, or new visitors — understand and navigate TruLearnix.

Guidelines:
- Be concise and practical. Use short paragraphs and bullet points.
- Reply in the language the user writes in (Hindi, Hinglish or English).
- Use ONLY the facts in the "Platform Overview", "Active Packages", and "Featured Courses" sections below. Do NOT invent prices, commissions, dates, or features.
- For questions about a specific learner's data (their wallet, their commissions, their KYC status, etc.) tell them to open the relevant panel page or contact support — you do not have live access to private accounts.
- For payment, refund, EMI miss, or account/login issues, recommend WhatsApp support: https://wa.me/${SUPPORT_PHONE} (or email ${SUPPORT_EMAIL}).
- When a user is new or asks "what is TruLearnix", recommend the intro video: ${INTRO_VIDEO}
- Never share or promise things that are not listed in the context. If unsure, say "main confirm karke batata hoon — support se baat karein" and link WhatsApp.

${platformCtx}

=== Current User ===
${userCtx}`;

    const safeHistory = Array.isArray(history) ? history.slice(-6) : [];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeHistory.map(h => ({ role: h.role, content: String(h.content || '').slice(0, 1000) })),
        { role: 'user', content: message.slice(0, 1500) },
      ],
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, abhi reply generate nahi ho paya. Kripya phir try karein.';
    res.json({
      success: true,
      reply,
      introVideo: INTRO_VIDEO,
      supportPhone: SUPPORT_PHONE,
      model: 'gpt-4o-mini',
    });
  } catch (e: any) {
    console.error('[chatbot]', e?.message);
    res.status(500).json({ success: false, message: e?.message || 'Chatbot error' });
  }
});

export default router;
