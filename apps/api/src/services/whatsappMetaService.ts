/**
 * Meta WhatsApp Cloud API Service
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import axios from 'axios';

const PHONE_ID    = process.env.META_PHONE_NUMBER_ID || '';
const TOKEN       = process.env.META_WHATSAPP_TOKEN  || '';
const BASE        = `https://graph.facebook.com/v20.0/${PHONE_ID}`;

function normalisePhone(phone: string) {
  // Strip spaces/dashes, ensure country code (default 91 for India)
  let p = phone.replace(/[\s\-().+]/g, '');
  if (p.startsWith('0')) p = '91' + p.slice(1);
  if (!p.startsWith('91') && p.length === 10) p = '91' + p;
  return p;
}

export async function sendWhatsAppText(phone: string, message: string): Promise<boolean> {
  if (!PHONE_ID || !TOKEN) {
    console.warn('[NOVA-WA] META_PHONE_NUMBER_ID or META_WHATSAPP_TOKEN not set');
    return false;
  }
  try {
    await axios.post(`${BASE}/messages`, {
      messaging_product: 'whatsapp',
      to: normalisePhone(phone),
      type: 'text',
      text: { preview_url: false, body: message },
    }, { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
    return true;
  } catch (e: any) {
    console.error('[NOVA-WA] send failed:', e.response?.data || e.message);
    return false;
  }
}

export async function sendWhatsAppTemplate(phone: string, templateName: string, langCode = 'en', components: any[] = []): Promise<boolean> {
  if (!PHONE_ID || !TOKEN) return false;
  try {
    await axios.post(`${BASE}/messages`, {
      messaging_product: 'whatsapp',
      to: normalisePhone(phone),
      type: 'template',
      template: { name: templateName, language: { code: langCode }, components },
    }, { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
    return true;
  } catch (e: any) {
    console.error('[NOVA-WA] template failed:', e.response?.data || e.message);
    return false;
  }
}

export async function broadcastWhatsApp(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (const phone of phones) {
    const ok = await sendWhatsAppText(phone, message);
    ok ? sent++ : failed++;
    await new Promise(r => setTimeout(r, 200)); // rate limit
  }
  return { sent, failed };
}

const bodyParams = (...vals: (string | number | undefined | null)[]) => ({
  type: 'body',
  parameters: vals.map(v => ({ type: 'text', text: String(v ?? '') })),
});

export async function sendOTPTemplate(phone: string, otp: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_login_v1', 'en_US', [
    { type: 'body', parameters: [{ type: 'text', text: otp }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
  ]);
}

export async function sendPasswordResetOTPTemplate(phone: string, otp: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_password_reset_v1', 'en_US', [
    { type: 'body', parameters: [{ type: 'text', text: otp }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
  ]);
}

export async function sendPurchaseWelcomeTemplate(phone: string, name: string, packageName: string, email: string, password: string, loginUrl: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_purchase_welcome_v1', 'en_US', [bodyParams(name, packageName, email, password, loginUrl)]);
}

export async function sendReferralWelcomeTemplate(phone: string, name: string, sponsorName: string, email: string, password: string, loginUrl: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_referral_welcome_v1', 'en_US', [bodyParams(name, sponsorName, email, password, loginUrl)]);
}

export async function sendSponsorJoinTemplate(phone: string, sponsorName: string, memberName: string, memberEmail: string, dashboardUrl: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_sponsor_join_v1', 'en_US', [bodyParams(sponsorName, memberName, memberEmail, dashboardUrl)]);
}

export async function sendSponsorSaleTemplate(phone: string, sponsorName: string, memberName: string, item: string, commission: number | string, earningsUrl: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_sponsor_sale_v1', 'en_US', [bodyParams(sponsorName, memberName, item, commission, earningsUrl)]);
}

export async function sendInvoiceTemplate(phone: string, name: string, description: string, amount: number | string, invoiceNumber: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_invoice_v1', 'en_US', [bodyParams(name, description, amount, invoiceNumber)]);
}

export async function sendWithdrawalSuccessTemplate(phone: string, name: string, amount: number | string, netAmount: number | string, transactionId: string, dateStr: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_withdrawal_success_v1', 'en_US', [bodyParams(name, amount, netAmount, transactionId, dateStr)]);
}

export async function sendSalaryPaidTemplate(phone: string, name: string, monthName: string, year: number | string, netAmount: number | string, grossAmount: number | string, slipNo: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'trulearnix_salary_paid_v1', 'en_US', [bodyParams(name, monthName, year, netAmount, grossAmount, slipNo)]);
}
