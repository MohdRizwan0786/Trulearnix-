import crypto from 'crypto';
import axios from 'axios';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const PAYOUT_BASE = 'https://api.razorpay.com/v1';

// Basic Auth header
const authHeader = () => ({
  Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
  'Content-Type': 'application/json',
});

export function isPayoutConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET &&
    RAZORPAY_KEY_ID !== 'your_razorpay_key' &&
    RAZORPAY_KEY_SECRET !== 'your_razorpay_secret');
}

// Step 1: Create or fetch contact
async function createContact(name: string, email: string, phone?: string): Promise<string> {
  const res = await axios.post(`${PAYOUT_BASE}/contacts`, {
    name,
    email,
    contact: phone || undefined,
    type: 'vendor',
  }, { headers: authHeader() });
  return res.data.id; // contact_xxxxx
}

// Step 2: Create fund account (bank)
async function createFundAccount(contactId: string, opts: {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
}): Promise<string> {
  const res = await axios.post(`${PAYOUT_BASE}/fund_accounts`, {
    contact_id: contactId,
    account_type: 'bank_account',
    bank_account: {
      name: opts.accountHolderName,
      ifsc: opts.ifsc,
      account_number: opts.accountNumber,
    },
  }, { headers: authHeader() });
  return res.data.id; // fa_xxxxx
}

// Step 3: Create payout
async function createPayout(opts: {
  fundAccountId: string;
  amountPaise: number; // amount in paise
  reference: string;   // withdrawal._id string
  narration: string;
}): Promise<{ id: string; status: string }> {
  const res = await axios.post(`${PAYOUT_BASE}/payouts`, {
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '', // RazorpayX account
    fund_account_id: opts.fundAccountId,
    amount: opts.amountPaise,
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    queue_if_low_balance: true,
    reference_id: opts.reference,
    narration: opts.narration,
  }, { headers: authHeader() });
  return { id: res.data.id, status: res.data.status };
}

// Full payout flow: contact → fund account → payout
export async function initiateWithdrawalPayout(opts: {
  withdrawalId: string;
  netAmount: number; // in rupees
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankHolderName: string;
}): Promise<{ payoutId: string; status: string }> {
  const contactId = await createContact(opts.partnerName, opts.partnerEmail, opts.partnerPhone);
  const fundAccountId = await createFundAccount(contactId, {
    accountHolderName: opts.bankHolderName,
    accountNumber: opts.bankAccountNumber,
    ifsc: opts.bankIfsc,
  });
  const payout = await createPayout({
    fundAccountId,
    amountPaise: Math.round(opts.netAmount * 100),
    reference: opts.withdrawalId,
    narration: `TruLearnix Partner Payout`,
  });
  return { payoutId: payout.id, status: payout.status };
}

// Verify Razorpay webhook signature
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}
