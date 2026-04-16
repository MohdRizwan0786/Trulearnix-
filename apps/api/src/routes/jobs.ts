import { Router, Response } from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import OpenAI from 'openai';

const router = Router();

// Skill → Freelancer skill IDs mapping (common ones)
const SKILL_MAP: Record<string, number[]> = {
  'seo': [14],
  'content writing': [10],
  'digital marketing': [532],
  'social media': [267],
  'facebook ads': [1218],
  'google ads': [268],
  'email marketing': [80],
  'affiliate marketing': [13],
  'copywriting': [50],
  'wordpress': [26],
  'graphic design': [9],
  'video editing': [92],
  'photoshop': [11],
  'python': [130],
  'javascript': [3],
  'react': [533],
  'node.js': [534],
  'php': [16],
  'data entry': [43],
  'excel': [39],
  'analytics': [135],
  'instagram': [267],
  'youtube': [92],
  'blogging': [10],
  'web design': [2],
  'ui/ux': [158],
  'android': [22],
  'ios': [23],
  'flutter': [636],
}

// Platform apply URL generators based on skills
function getUpworkSearchUrl(skills: string[]) {
  const q = skills.slice(0, 3).join(' ');
  return `https://www.upwork.com/nx/find-work/best-matches?q=${encodeURIComponent(q)}`;
}
function getFiverrGigUrl(skills: string[]) {
  const q = skills.slice(0, 2).join(' ');
  return `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(q)}`;
}
function getLinkedInJobUrl(skills: string[]) {
  const q = skills.slice(0, 3).join(' ');
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&f_WT=2`;
}
function getFreelancerSearchUrl(skills: string[]) {
  const q = skills.slice(0, 2).join(' ');
  return `https://www.freelancer.com/search/projects/?q=${encodeURIComponent(q)}`;
}
function getGuruSearchUrl(skills: string[]) {
  const q = skills[0] || 'marketing';
  return `https://www.guru.com/d/jobs/q/${encodeURIComponent(q)}/`;
}

// Fetch live projects from Freelancer.com API
async function fetchFreelancerJobs(skills: string[]): Promise<any[]> {
  try {
    const token = process.env.FREELANCER_TOKEN;
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Freelancer-OAuth-V1'] = token;

    // Get matching skill IDs
    const skillIds: number[] = [];
    for (const s of skills) {
      const key = s.toLowerCase();
      const ids = SKILL_MAP[key];
      if (ids) skillIds.push(...ids);
    }

    const query = skills.slice(0, 3).join(' ');
    const params: any = {
      query,
      limit: 10,
      full_description: false,
      compact: false,
      job_details: true,
      languages: 'en',
    };
    if (skillIds.length > 0) {
      params['jobs[]'] = skillIds.slice(0, 3);
    }

    const { data } = await axios.get('https://www.freelancer.com/api/projects/0.1/projects/active/', {
      params,
      headers,
      timeout: 8000,
    });

    const projects = data?.result?.projects || [];
    return projects.map((p: any) => ({
      id: `fl_${p.id}`,
      title: p.title,
      description: (p.preview_description || '').slice(0, 200),
      platform: 'Freelancer',
      budget: p.budget
        ? p.type === 'fixed'
          ? `$${p.budget.minimum}–$${p.budget.maximum}`
          : `$${p.hourly_project_info?.hourly_rate?.min || p.budget.minimum}/hr`
        : 'Negotiable',
      budgetINR: p.budget ? `₹${Math.round((p.budget.minimum || 0) * 84)}–₹${Math.round((p.budget.maximum || 0) * 84)}` : 'Negotiable',
      skills: (p.jobs || []).map((j: any) => j.name).slice(0, 5),
      type: p.type === 'hourly' ? 'Hourly' : 'Fixed',
      posted: p.time_submitted ? new Date(p.time_submitted * 1000).toISOString() : new Date().toISOString(),
      proposals: p.bid_stats?.bid_count || 0,
      hot: (p.bid_stats?.bid_count || 0) < 5,
      applyUrl: `https://www.freelancer.com/projects/${p.seo_url || p.id}`,
      currency: 'USD',
    }));
  } catch (err) {
    return [];
  }
}

// Smart fallback jobs matched to skills
function buildSmartJobs(skills: string[]): any[] {
  const templates = [
    {
      title: `${skills[0] || 'Digital Marketing'} Expert Needed`,
      platform: 'Upwork', hot: true,
      budget: '$300–800', budgetINR: '₹25,000–67,000', type: 'Fixed', proposals: 4,
      description: `Looking for an expert in ${skills.slice(0, 3).join(', ')} to drive results for our brand.`,
    },
    {
      title: `Freelance ${skills[1] || 'Content Writer'} for Long-Term`,
      platform: 'Freelancer', hot: false,
      budget: '$15–25/hr', budgetINR: '₹1,250–2,100/hr', type: 'Hourly', proposals: 8,
      description: `We need a skilled ${skills[1] || 'content writer'} for ongoing work on our digital properties.`,
    },
    {
      title: `${skills[0] || 'Marketing'} Consultant — Remote`,
      platform: 'LinkedIn', hot: false,
      budget: '$500–1,500', budgetINR: '₹42,000–1,26,000', type: 'Fixed', proposals: 12,
      description: `Remote consulting role for a seasoned ${skills[0] || 'marketing'} professional.`,
    },
    {
      title: `I need a ${skills[2] || 'Social Media'} Manager`,
      platform: 'Fiverr', hot: true,
      budget: '$200–600', budgetINR: '₹16,800–50,400', type: 'Fixed', proposals: 2,
      description: `Looking for a reliable ${skills[2] || 'social media'} expert for monthly retainer.`,
    },
    {
      title: `${skills[0] || 'SEO'} & ${skills[1] || 'Content'} Project`,
      platform: 'Guru', hot: false,
      budget: '$800–2,000', budgetINR: '₹67,200–1,68,000', type: 'Fixed', proposals: 6,
      description: `Need a full ${skills[0] || 'SEO'} and content strategy for a B2B SaaS company.`,
    },
    {
      title: `${skills[0] || 'Digital'} Growth Hacker`,
      platform: 'Internal', hot: true,
      budget: '₹30,000–50,000/month', budgetINR: '₹30,000–50,000/month', type: 'Retainer', proposals: 3,
      description: `TruLearnix partner brand hiring a skilled ${skills[0] || 'digital marketer'} for growth.`,
    },
  ];

  return templates.map((t, i) => ({
    id: `smart_${i}`,
    ...t,
    skills: skills.slice(0, 3).map(s => s),
    posted: new Date(Date.now() - i * 3600000 * 2).toISOString(),
    applyUrl: t.platform === 'Upwork' ? getUpworkSearchUrl(skills)
      : t.platform === 'Freelancer' ? getFreelancerSearchUrl(skills)
      : t.platform === 'Fiverr' ? getFiverrGigUrl(skills)
      : t.platform === 'LinkedIn' ? getLinkedInJobUrl(skills)
      : t.platform === 'Guru' ? getGuruSearchUrl(skills)
      : null,
    currency: 'Mixed',
  }));
}

// GET /api/jobs/feed — Returns skill-matched jobs from all platforms
router.get('/feed', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('expertise name packageTier');
    const skills: string[] = ((user as any)?.expertise || []);

    // Default skills if user hasn't set any
    const effectiveSkills = skills.length > 0 ? skills : ['Digital Marketing', 'SEO', 'Content Writing'];

    // Parallel fetch
    const [freelancerJobs] = await Promise.all([
      fetchFreelancerJobs(effectiveSkills),
    ]);

    // Always include smart jobs (mix of platforms)
    const smartJobs = buildSmartJobs(effectiveSkills);

    // Merge: real jobs first, smart jobs fill the rest
    const allJobs = [
      ...freelancerJobs.slice(0, 8),
      ...smartJobs,
    ];

    // Platform search links for sidebar
    const platformLinks = {
      upwork: { url: getUpworkSearchUrl(effectiveSkills), label: 'Find on Upwork' },
      freelancer: { url: getFreelancerSearchUrl(effectiveSkills), label: 'Find on Freelancer' },
      fiverr: { url: getFiverrGigUrl(effectiveSkills), label: 'Browse Fiverr' },
      linkedin: { url: getLinkedInJobUrl(effectiveSkills), label: 'LinkedIn Jobs' },
      guru: { url: getGuruSearchUrl(effectiveSkills), label: 'Browse Guru' },
    };

    res.json({
      success: true,
      jobs: allJobs,
      skills: effectiveSkills,
      platformLinks,
      total: allJobs.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/proposal — AI-generated proposal using OpenAI
router.post('/proposal', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, jobDescription, platform, skills, budget } = req.body;
    const user = await User.findById(req.user._id).select('name expertise');
    const userSkills: string[] = ((user as any)?.expertise || skills || []);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert freelance proposal writer. Write compelling, professional proposals for ${platform || 'freelance'} platforms. Keep it concise (150-200 words), personal, and results-focused. Do NOT use generic phrases like "I am writing to express my interest". Start directly with value.`,
        },
        {
          role: 'user',
          content: `Write a winning ${platform} proposal for this job:

Job Title: ${jobTitle}
Description: ${jobDescription || 'Not provided'}
Budget: ${budget || 'Not specified'}
Platform: ${platform}

My name is ${user?.name || 'the candidate'}.
My skills: ${userSkills.join(', ')}

Write a short, punchy proposal that stands out. Include 2-3 specific deliverables I'll provide. End with a call to action.`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const proposal = completion.choices[0]?.message?.content || '';
    res.json({ success: true, proposal });
  } catch (err: any) {
    // Fallback proposal if OpenAI fails
    const { jobTitle, skills, budget } = req.body;
    const user = await User.findById(req.user._id).select('name expertise').catch(() => null);
    const name = (user as any)?.name || 'I';
    const userSkills = ((user as any)?.expertise || skills || []).slice(0, 3).join(', ');

    const fallback = `Hi,

${name} here — a specialist in ${userSkills}. I've reviewed your "${jobTitle}" project and I'm confident I can deliver exceptional results.

Here's what I'll provide:
• Professional quality work tailored to your exact requirements
• Regular progress updates and transparent communication
• Measurable, results-driven outcomes within your timeline

My background in ${userSkills} makes me the ideal candidate for this role. I've completed similar projects and understand exactly what it takes to succeed here.

Budget (${budget || 'as discussed'}) works for me — I'm flexible based on scope.

I'd love to discuss your project in more detail. When's a good time to connect?

Best,
${name}`;

    res.json({ success: true, proposal: fallback });
  }
});

// POST /api/jobs/brand/linkedin — AI LinkedIn summary using real profile
router.post('/brand/linkedin', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('name expertise bio socialLinks');
    const skills: string[] = ((user as any)?.expertise || []);
    const extraSkills: string[] = (req.body.extraSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const allSkills = [...new Set([...skills, ...extraSkills])];
    const bio = (user as any)?.bio || '';
    const name = (user as any)?.name || 'Professional';

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn profile writer. Write compelling, professional LinkedIn About sections. Use emojis sparingly. Include a headline, a powerful intro, key contributions/expertise bullets, current focus, and a CTA. Max 300 words. Add relevant hashtags at the end.',
        },
        {
          role: 'user',
          content: `Write a LinkedIn About section for:
Name: ${name}
Skills/Expertise: ${allSkills.join(', ')}
Bio: ${bio || 'Upskilling through TruLearnix EdTech platform'}
Platform: TruLearnix (EdTech/Digital Skills)

Make it professional, achievement-oriented, and keyword-rich for LinkedIn search. Format with emojis and line breaks.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.75,
    });

    const summary = completion.choices[0]?.message?.content || '';
    res.json({ success: true, summary });
  } catch (err: any) {
    // Fallback
    const user = await User.findById(req.user._id).select('name expertise').catch(() => null);
    const name = (user as any)?.name || 'Professional';
    const skills: string[] = ((user as any)?.expertise || ['Digital Marketing', 'SEO']);
    const extraSkills: string[] = (req.body.extraSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const allSkills = [...new Set([...skills, ...extraSkills])];
    const topSkills = allSkills.slice(0, 4).join(' | ');
    const hashTags = allSkills.slice(0, 5).map(s => `#${s.replace(/\s+/g, '')}`).join(' ');

    const fallback = `🚀 ${topSkills}

I'm ${name}, a results-driven professional with expertise in ${allSkills.slice(0, 3).join(', ')}. Currently upskilling through TruLearnix's industry-leading EdTech platform to stay ahead in today's competitive landscape.

💡 What I bring to the table:
• Hands-on expertise in ${allSkills.slice(0, 2).join(' & ')}
• Data-driven approach with measurable results
• Continuous learner committed to growth
• Strong ability to execute and deliver

🎯 Currently focused on: Building expertise in ${allSkills[0] || 'digital skills'} to create real value for businesses and clients.

Let's connect and grow together! 🤝

${hashTags}`;

    res.json({ success: true, summary: fallback });
  }
});

// GET /api/jobs/brand/profile — Full brand profile (user + certs + courses)
router.get('/brand/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const Certificate = (await import('../models/Certificate')).default;
    const Enrollment = (await import('../models/Enrollment')).default;

    const [user, certs, enrollments] = await Promise.all([
      User.findById(req.user._id).select('name avatar bio expertise socialLinks email phone'),
      Certificate.find({ student: req.user._id }).countDocuments(),
      Enrollment.find({ student: req.user._id }).select('_id').limit(1),
    ]);

    const hasLinkedin = !!(user as any)?.socialLinks?.linkedin;
    const hasSkills = ((user as any)?.expertise || []).length > 0;
    const hasCerts = certs > 0;
    const hasEnrolled = enrollments.length > 0;

    res.json({
      success: true,
      profile: user,
      completeness: {
        avatar: !!(user as any)?.avatar,
        linkedin: hasLinkedin,
        skills: hasSkills,
        portfolio: hasEnrolled,
        certificate: hasCerts,
      },
      certCount: certs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
