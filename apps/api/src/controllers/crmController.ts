import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Lead from '../models/Lead';
import User from '../models/User';
import Notification from '../models/Notification';

// Round-robin manager assignment
async function getNextManager(): Promise<any> {
  const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('_id');
  if (!managers.length) return null;
  // Simple: use count of leads to balance
  const counts = await Promise.all(managers.map(m => Lead.countDocuments({ assignedTo: m._id, stage: { $nin: ['paid', 'lost'] } })));
  const minIdx = counts.indexOf(Math.min(...counts));
  return managers[minIdx]?._id;
}

// POST /api/crm/leads — create lead (public, from landing page)
export const createLead = async (req: any, res: Response) => {
  try {
    const { name, phone, email, source, utmSource, utmMedium, utmCampaign, utmContent, campaign, city, stage } = req.body;

    // Dedup check
    const existing = await Lead.findOne({ phone });
    if (existing) {
      return res.json({ success: true, message: 'Lead already exists', leadId: existing._id });
    }

    const assignedTo = await getNextManager();
    const lead = await Lead.create({ name, phone, email, source: source || 'website', utmSource, utmMedium, utmCampaign, utmContent, campaign, city, stage: stage || 'new', assignedTo });

    // Notify manager (in-app + push)
    if (assignedTo) {
      await Notification.create({
        user: assignedTo,
        title: '🔥 New Lead Assigned',
        message: `${name} (${phone}) assigned to you. Source: ${source || 'website'}`,
        type: 'info',
        channel: 'inapp',
      });
      try {
        const { sendPushToUser } = await import('../services/pushService');
        await sendPushToUser(assignedTo, {
          title: '🔥 New Lead Assigned!',
          body:  `${name} (${phone}) — Source: ${source || 'website'}`,
          url:   '/sales/leads',
          tag:   'new-lead',
          sound: true,
        });
      } catch {}
    }
    // Also push to all admin/superadmin
    setImmediate(async () => {
      try {
        const { sendPushByRole } = await import('../services/pushService');
        await sendPushByRole(['admin', 'superadmin'], {
          title: '🔥 New Lead',
          body: `${name} — ${phone} (${source || 'website'})`,
          url: '/crm',
          tag: 'new-lead-admin',
          sound: true,
        });
      } catch {}
    });

    // TODO: Trigger AI scoring job via BullMQ
    // TODO: Send WhatsApp welcome via WATI

    res.status(201).json({ success: true, leadId: lead._id });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/crm/leads — get leads (admin/manager)
export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { stage, source, score, page = 1, limit = 20, search } = req.query;
    const filter: any = {};

    // Managers see only their leads
    if (req.user.role === 'manager') filter.assignedTo = req.user._id;

    if (stage) filter.stage = stage;
    if (source) filter.source = source;
    if (score === 'hot') filter.aiScoreLabel = 'hot';
    if (score === 'warm') filter.aiScoreLabel = 'warm';
    if (score === 'cold') filter.aiScoreLabel = 'cold';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate('assignedTo', 'name avatar').sort('-createdAt').skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    res.json({ success: true, leads, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/crm/leads/:id
export const getLead = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email avatar').populate('notes.by', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// PATCH /api/crm/leads/:id — update stage, notes, follow-up
export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const { stage, note, followUp, assignedTo, interestedPackage, objectionType, tags, aiScore, aiScoreLabel, city, lostReason } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (stage) lead.stage = stage;
    if (interestedPackage) lead.interestedPackage = interestedPackage;
    if (objectionType) lead.objectionType = objectionType;
    if (tags) lead.tags = tags;
    if (city) lead.city = city;
    if (lostReason) lead.lostReason = lostReason;
    if (aiScore !== undefined) { lead.aiScore = aiScore; lead.aiScoreLabel = aiScore >= 70 ? 'hot' : aiScore >= 40 ? 'warm' : 'cold'; }
    if (aiScoreLabel) lead.aiScoreLabel = aiScoreLabel;
    if (assignedTo && ['admin', 'superadmin', 'manager'].includes(req.user.role)) lead.assignedTo = assignedTo;

    if (note) {
      lead.notes.push({ text: note, by: req.user._id, createdAt: new Date() });
      lead.lastContactedAt = new Date();
    }

    if (followUp) {
      lead.followUps.push({ scheduledAt: new Date(followUp.scheduledAt), type: followUp.type, done: false });
    }

    await lead.save();
    res.json({ success: true, lead });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/crm/stats
export const getCRMStats = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.user.role === 'manager') filter.assignedTo = req.user._id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, byStage, bySource, hot, avgScore, thisMonth, metaLeads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.aggregate([{ $match: filter }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $match: filter }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      Lead.countDocuments({ ...filter, aiScoreLabel: 'hot' }),
      Lead.aggregate([{ $match: filter }, { $group: { _id: null, avg: { $avg: '$aiScore' } } }]),
      Lead.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Lead.countDocuments({ ...filter, source: 'meta_ads' }),
    ]);

    const paidCount = byStage.find((s: any) => s._id === 'paid')?.count || 0;
    const conversionRate = total > 0 ? parseFloat(((paidCount / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      total, totalLeads: total,
      byStage, bySource,
      hot, hotLeads: hot,
      avgScore: parseFloat((avgScore[0]?.avg || 0).toFixed(1)),
      conversionRate,
      thisMonth,
      metaLeads,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// DELETE /api/crm/leads/:id (admin only)
export const deleteLead = async (req: AuthRequest, res: Response) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/crm/webhook/meta — Facebook webhook verification
export const metaWebhookVerify = async (req: any, res: Response) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'trulearnix_meta_crm_2024';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
};

// POST /api/crm/webhook/meta — Facebook Lead Ads webhook
export const metaWebhookReceive = async (req: any, res: Response) => {
  try {
    res.status(200).send('EVENT_RECEIVED');
    const body = req.body;
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;
        const leadgenId = change.value?.leadgen_id;
        const formId = change.value?.form_id;
        const pageId = change.value?.page_id;
        const adId = change.value?.ad_id;
        const campaignId = change.value?.campaign_id;

        // Parse field_data from webhook payload if available
        const fieldData: any[] = change.value?.field_data || [];
        const getField = (name: string) => fieldData.find((f: any) => f.name === name)?.values?.[0] || '';

        const name = getField('full_name') || getField('name') || 'Meta Lead';
        const phone = getField('phone_number') || getField('phone') || '';
        const email = getField('email') || '';

        if (!phone && !email) continue;

        const existing = await Lead.findOne(phone ? { phone } : { email });
        if (existing) continue;

        const assignedTo = await (async () => {
          const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('_id');
          if (!managers.length) return null;
          const counts = await Promise.all(managers.map((m: any) => Lead.countDocuments({ assignedTo: m._id, stage: { $nin: ['paid', 'lost'] } })));
          return managers[counts.indexOf(Math.min(...counts))]?._id;
        })();

        await Lead.create({
          name, phone: phone || 'N/A', email,
          source: 'meta_ads',
          campaign: campaignId || formId,
          assignedTo,
          stage: 'new',
          aiScore: 50,
          aiScoreLabel: 'warm',
        });
      }
    }
  } catch (e: any) { console.error('Meta webhook error:', e.message); }
};

// POST /api/crm/leads/import — bulk import leads (admin)
export const importLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { leads: rawLeads, source = 'manual' } = req.body;
    if (!Array.isArray(rawLeads) || !rawLeads.length) {
      return res.status(400).json({ success: false, message: 'leads array required' });
    }

    let created = 0, skipped = 0;
    for (const row of rawLeads) {
      const phone = (row.phone || row.Phone || '').toString().replace(/\s/g, '');
      const name = row.name || row.Name || row.full_name || 'Unknown';
      const email = (row.email || row.Email || '').toLowerCase();

      if (!phone) { skipped++; continue; }

      const existing = await Lead.findOne({ phone });
      if (existing) { skipped++; continue; }

      const assignedTo = await (async () => {
        const managers = await User.find({ role: { $in: ['manager', 'admin', 'salesperson'] }, isActive: true }).select('_id');
        if (!managers.length) return null;
        const counts = await Promise.all(managers.map((m: any) => Lead.countDocuments({ assignedTo: m._id, stage: { $nin: ['paid', 'lost'] } })));
        return managers[counts.indexOf(Math.min(...counts))]?._id;
      })();

      await Lead.create({
        name, phone, email,
        source: source as any,
        stage: 'new',
        aiScore: 30,
        aiScoreLabel: 'cold',
        assignedTo,
      });
      created++;
    }

    res.json({ success: true, created, skipped, total: rawLeads.length });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};
