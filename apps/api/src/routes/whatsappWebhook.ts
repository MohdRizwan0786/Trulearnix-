import { Router, Request, Response } from 'express';
import WhatsAppChat from '../models/WhatsAppChat';

const router = Router();

// Meta webhook verification (GET): https://developers.facebook.com/docs/graph-api/webhooks/getting-started
router.get('/', (req: Request, res: Response) => {
  // express-mongo-sanitize replaces dots in keys with underscores, so Meta's
  // `hub.mode` / `hub.verify_token` / `hub.challenge` arrive as `hub_*`.
  const q: any = req.query;
  const mode = q['hub.mode'] ?? q.hub_mode;
  const token = q['hub.verify_token'] ?? q.hub_verify_token;
  const challenge = q['hub.challenge'] ?? q.hub_challenge;
  const expected = process.env.META_WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expected) {
    return res.status(200).send(String(challenge));
  }
  return res.sendStatus(403);
});

// Meta webhook receiver (POST): inbound messages + status updates
router.post('/', async (req: Request, res: Response) => {
  // Always 200 OK fast — Meta retries aggressively otherwise
  res.sendStatus(200);

  try {
    const entry = req.body?.entry || [];
    for (const e of entry) {
      const changes = e.changes || [];
      for (const c of changes) {
        const value = c.value || {};
        const contactName = value.contacts?.[0]?.profile?.name;

        // Inbound messages
        for (const msg of value.messages || []) {
          const phone = msg.from;
          const type = msg.type;
          const text =
            msg.text?.body ||
            msg.button?.text ||
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            `[${type}]`;

          await WhatsAppChat.findOneAndUpdate(
            { contactPhone: phone },
            {
              $push: {
                messages: {
                  direction: 'inbound',
                  text,
                  type: ['text', 'template', 'image', 'document'].includes(type) ? type : 'text',
                  status: 'received',
                  timestamp: new Date(Number(msg.timestamp) * 1000),
                  waMessageId: msg.id,
                },
              },
              ...(contactName && { contactName }),
              lastMessageAt: new Date(),
              lastMessageText: text,
              lastMessageDirection: 'inbound',
              isOpen: true,
            },
            { upsert: true, new: true }
          );
        }

        // Status updates (sent/delivered/read/failed)
        for (const st of value.statuses || []) {
          await WhatsAppChat.updateOne(
            { contactPhone: st.recipient_id, 'messages.waMessageId': st.id },
            { $set: { 'messages.$.status': st.status } }
          );
        }
      }
    }
  } catch (err: any) {
    console.error('[META-WA webhook] error:', err.message);
  }
});

export default router;
