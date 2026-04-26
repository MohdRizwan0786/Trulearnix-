/**
 * Bulk Password Reset for Old Website Users
 * Sets temp password + sends email to all null-password users
 */

require('dotenv').config({ path: '/var/www/trulearnix-prod/apps/api/.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trulearnix_prod';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const WEB_URL = process.env.WEB_URL || 'https://trulearnix.com';

function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const rand = (s) => s[crypto.randomInt(s.length)];
  const body = Array.from({ length: 5 }, () => rand(upper + lower + digits)).join('');
  return rand(upper) + body + rand(digits) + rand(special);
}

async function sendCredentialEmail(transporter, to, name, tempPassword) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your login credentials are ready</p>
      </div>
      <div style="padding:32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 12px">Hello ${name || 'User'},</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">
          We have migrated your account from our old website to the new <strong style="color:#fff">TruLearnix</strong> platform. 
          Your temporary password is set below. Please login and change it immediately.
        </p>
        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 24px">
          <p style="color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px">Your Login Credentials</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Email</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0 0 16px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px">${to}</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Temporary Password</p>
          <p style="color:#a78bfa;font-weight:700;font-size:22px;letter-spacing:3px;font-family:monospace;margin:0 0 12px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px">${tempPassword}</p>
          <p style="color:#f59e0b;font-size:11px;margin:0">⚠️ Please change your password immediately after login for security.</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${WEB_URL}/login" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">Login Now →</a>
        </div>
        <div style="border-top:1px solid #2d2d4e;padding-top:20px;margin-top:8px">
          <p style="color:#a0a0b8;font-size:13px;margin:0">Need help? Contact us at <a href="mailto:support@trulearnix.com" style="color:#6366f1">support@trulearnix.com</a></p>
        </div>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: '🔐 Your TruLearnix Login Credentials (New Website)',
    html,
  });
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const users = await mongoose.connection.db.collection('users')
    .find({ password: null })
    .project({ _id: 1, name: 1, email: 1, phone: 1 })
    .toArray();

  console.log(`Found ${users.length} users with null password`);
  console.log('');

  let success = 0, failed = 0;
  const results = [];

  for (const user of users) {
    const tempPass = generateTempPassword();
    const hashed = await bcrypt.hash(tempPass, 12);

    // Update password in DB
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashed } }
    );

    results.push({ email: user.email, phone: user.phone, tempPass });

    // Send email
    try {
      await sendCredentialEmail(transporter, user.email, user.name, tempPass);
      console.log(`✅ ${user.email} → ${tempPass}`);
      success++;
    } catch (e) {
      console.log(`❌ ${user.email} → ${tempPass} (email failed: ${e.message})`);
      failed++;
    }

    // Small delay to avoid SMTP rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('');
  console.log(`✅ Success: ${success} | ❌ Failed: ${failed}`);
  console.log('');
  console.log('=== ALL PASSWORDS (save this) ===');
  results.forEach(r => console.log(`${r.email} | Phone: ${r.phone} | Pass: ${r.tempPass}`));

  await mongoose.disconnect();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
