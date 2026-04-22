import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import User from '../models/User';
import MarketingTemplate from '../models/MarketingTemplate';
import Campaign from '../models/Campaign';
import WhatsAppChat from '../models/WhatsAppChat';
import ChatbotFlow from '../models/ChatbotFlow';
import { sendEmail } from '../services/emailService';
import axios from 'axios';

const router = Router();

// ── WhatsApp helper ───────────────────────────────────────────────────────────
const sendWhatsApp = async (phone: string, message: string) => {
  const token = process.env.WHATSAPP_API_TOKEN;
  const url = process.env.WHATSAPP_API_URL;
  if (!token || !url) throw new Error('WhatsApp API not configured');
  await axios.post(`${url}/sendSessionMessage/${phone}`, { body: message }, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
};

// ── Public: WATI Webhook ──────────────────────────────────────────────────────
router.post('/whatsapp/webhook', async (req: any, res) => {
  try {
    const { waId, senderName, text } = req.body;
    if (!waId) return res.status(400).json({ success: false });
    await WhatsAppChat.findOneAndUpdate(
      { contactPhone: waId },
      {
        $push: { messages: { direction: 'inbound', text: text?.body || '', type: 'text', status: 'received', timestamp: new Date() } },
        contactName: senderName,
        lastMessageAt: new Date(),
        lastMessageText: text?.body || '',
        lastMessageDirection: 'inbound',
      },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin protected routes ────────────────────────────────────────────────────
router.use(protect, authorize('superadmin', 'admin', 'manager', 'employee', 'department_head', 'team_lead'));

// ── Overview stats ────────────────────────────────────────────────────────────
router.get('/overview', async (req: any, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [totalTemplates, totalCampaigns, sentCampaigns, totalChats, emailAgg, waAgg, chatbotFlows, recentCampaigns] = await Promise.all([
      MarketingTemplate.countDocuments({ isActive: true }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'sent' }),
      WhatsAppChat.countDocuments(),
      Campaign.aggregate([{ $match: { type: 'email', status: 'sent' } }, { $group: { _id: null, sent: { $sum: '$sentCount' }, failed: { $sum: '$failedCount' }, total: { $sum: '$totalTargeted' } } }]),
      Campaign.aggregate([{ $match: { type: 'whatsapp', status: 'sent' } }, { $group: { _id: null, sent: { $sum: '$sentCount' }, failed: { $sum: '$failedCount' }, total: { $sum: '$totalTargeted' } } }]),
      ChatbotFlow.countDocuments({ isActive: true }),
      Campaign.find({ status: 'sent' }).sort('-sentAt').limit(5).select('name type sentCount failedCount sentAt totalTargeted'),
    ]);
    res.json({
      success: true,
      stats: {
        totalTemplates, totalCampaigns, sentCampaigns, totalChats, chatbotFlows,
        emailSent: emailAgg[0]?.sent || 0, emailFailed: emailAgg[0]?.failed || 0,
        waSent: waAgg[0]?.sent || 0, waFailed: waAgg[0]?.failed || 0,
      },
      recentCampaigns,
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Templates CRUD ────────────────────────────────────────────────────────────
router.get('/templates', async (req: any, res) => {
  try {
    const { type, category } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    const templates = await MarketingTemplate.find(filter).sort('-createdAt').populate('createdBy', 'name');
    res.json({ success: true, templates });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/templates', async (req: any, res) => {
  try {
    const { name, type, category, subject, body, previewText } = req.body;
    if (!name || !type || !body) return res.status(400).json({ success: false, message: 'name, type and body required' });
    const variables = [...(body.match(/\{\{(\w+)\}\}/g) || [])];
    const template = await MarketingTemplate.create({ name, type, category: category || 'custom', subject, body, variables, previewText, createdBy: req.user._id });
    res.status(201).json({ success: true, template });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/templates/:id', async (req: any, res) => {
  try {
    const { name, type, category, subject, body, previewText, isActive } = req.body;
    const update: any = { name, type, category, subject, previewText, isActive };
    if (body) { update.body = body; update.variables = [...(body.match(/\{\{(\w+)\}\}/g) || [])]; }
    const template = await MarketingTemplate.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, template });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/templates/:id', async (req: any, res) => {
  try {
    await MarketingTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns', async (req: any, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).populate('createdBy', 'name').populate('templateId', 'name'),
      Campaign.countDocuments(filter),
    ]);
    res.json({ success: true, campaigns, total, pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/campaigns', async (req: any, res) => {
  try {
    const { name, type, templateId, subject, body, targetFilter } = req.body;
    if (!name || !type || !body) return res.status(400).json({ success: false, message: 'name, type and body required' });
    const campaign = await Campaign.create({ name, type, templateId, subject, body, targetFilter: targetFilter || {}, status: 'draft', createdBy: req.user._id });
    res.status(201).json({ success: true, campaign });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/campaigns/:id', async (req: any, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// Send campaign
router.post('/campaigns/:id/send', async (req: any, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.status === 'sending') return res.status(400).json({ success: false, message: 'Campaign already sending' });

    const filter: any = { isActive: true, isVerified: true };
    const tf = campaign.targetFilter as any;
    if (tf?.roles?.length) filter.role = { $in: tf.roles };
    if (tf?.packageTiers?.length) filter.packageTier = { $in: tf.packageTiers };
    if (tf?.isAffiliate !== undefined) filter.isAffiliate = tf.isAffiliate;

    let users: any[] = [];
    if (tf?.customPhones?.length || tf?.customEmails?.length) {
      const orClauses: any[] = [];
      if (tf.customPhones?.length) orClauses.push({ phone: { $in: tf.customPhones } });
      if (tf.customEmails?.length) orClauses.push({ email: { $in: tf.customEmails } });
      users = await User.find({ $or: orClauses }).select('name email phone');
    } else {
      users = await User.find(filter).select('name email phone');
    }

    await Campaign.findByIdAndUpdate(campaign._id, { status: 'sending', totalTargeted: users.length });

    let sentCount = 0, failedCount = 0;

    // Process in batches of 10
    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);
      await Promise.allSettled(batch.map(async (user) => {
        try {
          const body = campaign.body
            .replace(/\{\{name\}\}/g, user.name || 'there')
            .replace(/\{\{email\}\}/g, user.email || '');

          if (campaign.type === 'email' && user.email) {
            await sendEmail(
              user.email,
              campaign.subject || 'Message from TruLearnix',
              `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;padding:24px;border-radius:12px;color:#fff">${body.replace(/\n/g, '<br>')}</div>`
            );
            sentCount++;
          } else if (campaign.type === 'whatsapp' && user.phone) {
            await sendWhatsApp(user.phone, body);
            await WhatsAppChat.findOneAndUpdate(
              { contactPhone: user.phone },
              {
                $push: { messages: { direction: 'outbound', text: body, type: 'text', status: 'sent', timestamp: new Date() } },
                contactName: user.name, userId: user._id,
                lastMessageAt: new Date(), lastMessageText: body, lastMessageDirection: 'outbound',
              },
              { upsert: true }
            );
            sentCount++;
          } else { failedCount++; }
        } catch { failedCount++; }
      }));
    }

    await Campaign.findByIdAndUpdate(campaign._id, { status: 'sent', sentAt: new Date(), sentCount, failedCount });
    if (campaign.templateId) await MarketingTemplate.findByIdAndUpdate(campaign.templateId, { $inc: { usageCount: 1 } });

    res.json({ success: true, message: `Campaign sent: ${sentCount} success, ${failedCount} failed`, sentCount, failedCount });
  } catch (e: any) {
    await Campaign.findByIdAndUpdate(req.params.id, { status: 'failed' }).catch(() => {});
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Single email send ─────────────────────────────────────────────────────────
router.post('/send-email', async (req: any, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) return res.status(400).json({ success: false, message: 'to, subject and body required' });
    await sendEmail(to, subject,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;padding:24px;border-radius:12px;color:#fff">${body.replace(/\n/g, '<br>')}</div>`
    );
    res.json({ success: true, message: 'Email sent' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── WhatsApp Chats ────────────────────────────────────────────────────────────
router.get('/chats', async (req: any, res) => {
  try {
    const { page = 1, limit = 30, search } = req.query;
    const filter: any = {};
    if (search) filter.$or = [
      { contactPhone: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [chats, total] = await Promise.all([
      WhatsAppChat.find(filter).sort('-lastMessageAt').skip(skip).limit(Number(limit))
        .select('-messages').populate('userId', 'name email').populate('leadId', 'name phone stage'),
      WhatsAppChat.countDocuments(filter),
    ]);
    res.json({ success: true, chats, total, pages: Math.ceil(total / Number(limit)) });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/chats/:phone', async (req: any, res) => {
  try {
    const chat = await WhatsAppChat.findOne({ contactPhone: req.params.phone })
      .populate('userId', 'name email avatar').populate('leadId', 'name phone stage aiScore');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, chat });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/chats/:phone/send', async (req: any, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message required' });
    await sendWhatsApp(req.params.phone, message);
    const chat = await WhatsAppChat.findOneAndUpdate(
      { contactPhone: req.params.phone },
      {
        $push: { messages: { direction: 'outbound', text: message, type: 'text', status: 'sent', timestamp: new Date() } },
        lastMessageAt: new Date(), lastMessageText: message, lastMessageDirection: 'outbound',
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, chat });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Chatbot Flows ─────────────────────────────────────────────────────────────
router.get('/chatbot', async (req: any, res) => {
  try {
    const flows = await ChatbotFlow.find().sort('-createdAt').populate('createdBy', 'name');
    res.json({ success: true, flows });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/chatbot', async (req: any, res) => {
  try {
    const { name, trigger, steps } = req.body;
    if (!name || !trigger || !steps?.length) return res.status(400).json({ success: false, message: 'name, trigger and steps required' });
    const flow = await ChatbotFlow.create({ name, trigger, steps, createdBy: req.user._id });
    res.status(201).json({ success: true, flow });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/chatbot/:id', async (req: any, res) => {
  try {
    const flow = await ChatbotFlow.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, flow });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/chatbot/:id/toggle', async (req: any, res) => {
  try {
    const flow = await ChatbotFlow.findById(req.params.id);
    if (!flow) return res.status(404).json({ success: false, message: 'Flow not found' });
    flow.isActive = !flow.isActive;
    await flow.save();
    res.json({ success: true, flow });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/chatbot/:id', async (req: any, res) => {
  try {
    await ChatbotFlow.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
