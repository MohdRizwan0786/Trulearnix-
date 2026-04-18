import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, otp: string, name: string) => {
  await sendEmail(to, '🔐 Password Reset OTP — TruLearnix', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px">
      <div style="text-align:center;padding:20px 0">
        <h1 style="color:#6366f1">TruLearnix</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:8px">
        <h2>Hello ${name},</h2>
        <p>We received a request to reset your password. Use the OTP below:</p>
        <div style="text-align:center;margin:30px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6366f1;background:#f0f0ff;padding:15px 30px;border-radius:8px">${otp}</span>
        </div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888">If you didn't request a password reset, please ignore this email. Your account is safe.</p>
      </div>
    </div>
  `);
};

export const sendOTPEmail = async (to: string, otp: string, name: string) => {
  await sendEmail(to, 'Verify Your TruLearnix Account', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:10px">
      <div style="text-align:center;padding:20px 0">
        <h1 style="color:#6366f1">TruLearnix</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:8px">
        <h2>Hello ${name},</h2>
        <p>Your OTP for verification is:</p>
        <div style="text-align:center;margin:30px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6366f1;background:#f0f0ff;padding:15px 30px;border-radius:8px">${otp}</span>
        </div>
        <p>This OTP expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `);
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  await sendEmail(to, 'Welcome to TruLearnix!', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6366f1">Welcome to TruLearnix, ${name}!</h1>
      <p>Start your learning journey today. Explore courses, join live classes, and earn certificates.</p>
      <a href="${process.env.WEB_URL}/courses" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:20px">Explore Courses</a>
    </div>
  `);
};

export const sendPurchaseWelcomeEmail = async (to: string, name: string, packageName: string, email: string, password: string) => {
  await sendEmail(to, `🎉 Welcome to TruLearnix — Your ${packageName} Account is Ready!`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your journey to financial freedom starts now</p>
      </div>
      <div style="padding:32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 8px">Welcome, ${name}! 🎉</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">You've successfully enrolled in the <strong style="color:#a78bfa">${packageName} Package</strong>. Your account is fully activated!</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 24px">
          <p style="color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px">Your Login Credentials</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Email</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0 0 16px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px;word-break:break-all;overflow-wrap:anywhere">${email}</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Password</p>
          <p style="color:#a78bfa;font-weight:700;font-size:20px;letter-spacing:3px;font-family:monospace;margin:0 0 12px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px">${password}</p>
          <p style="color:#f59e0b;font-size:11px;margin:0">⚠️ Please save your password and change it after first login for security.</p>
        </div>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.WEB_URL}/login" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">Login to Your Dashboard →</a>
        </div>

        <div style="border-top:1px solid #2d2d4e;padding-top:20px;margin-top:8px">
          <p style="color:#a0a0b8;font-size:13px;margin:0">Need help? Contact us at <a href="mailto:support@peptly.in" style="color:#6366f1">support@peptly.in</a></p>
        </div>
      </div>
    </div>
  `);
};

// Welcome email for user who joined via a partner/salesperson — includes credentials + sponsor name
export const sendReferralWelcomeEmail = async (to: string, name: string, email: string, password: string, sponsorName: string) => {
  await sendEmail(to, '🎉 Welcome to TruLearnix — Your Account is Ready!', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your journey to financial freedom starts now</p>
      </div>
      <div style="padding:32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 8px">Welcome, ${name}! 🎉</h2>
        <p style="color:#a0a0b8;margin:0 0 6px">You've been registered on TruLearnix by your mentor:</p>
        <p style="color:#a78bfa;font-weight:700;font-size:16px;margin:0 0 24px">👤 ${sponsorName}</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 24px">
          <p style="color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px">Your Login Credentials</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Email</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0 0 16px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px;word-break:break-all;overflow-wrap:anywhere">${email}</p>
          <p style="color:#a0a0b8;font-size:12px;margin:0 0 4px">Password</p>
          <p style="color:#a78bfa;font-weight:700;font-size:20px;letter-spacing:3px;font-family:monospace;margin:0 0 12px;padding:10px 12px;background:#1a1a2e;border:1px solid #3d3d5e;border-radius:6px">${password}</p>
          <p style="color:#f59e0b;font-size:11px;margin:0">⚠️ Please save your password and change it after first login for security.</p>
        </div>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.WEB_URL}/login" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">Login to Your Dashboard →</a>
        </div>

        <div style="border-top:1px solid #2d2d4e;padding-top:20px;margin-top:8px">
          <p style="color:#a0a0b8;font-size:13px;margin:0">Need help? Contact us at <a href="mailto:support@peptly.in" style="color:#6366f1">support@peptly.in</a></p>
        </div>
      </div>
    </div>
  `);
};

// Sponsor alert — someone joined through their referral link
export const sendSponsorJoinAlert = async (to: string, sponsorName: string, newUserName: string, newUserEmail: string) => {
  await sendEmail(to, '🔔 New Member Joined Through Your Link!', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Your team is growing!</p>
      </div>
      <div style="padding:32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 16px">Hi ${sponsorName}! 🎉</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">A new member has joined TruLearnix through your referral link:</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 24px">
          <p style="color:#10b981;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">New Member Details</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0;width:80px">Name:</td>
              <td style="color:#fff;font-weight:600;font-size:14px">${newUserName}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0">Email:</td>
              <td style="color:#a78bfa;font-weight:600;font-size:14px">${newUserEmail}</td>
            </tr>
          </table>
        </div>

        <p style="color:#a0a0b8;font-size:13px;">Encourage them to purchase a package to unlock your commission earnings! 💰</p>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.WEB_URL}/partner/dashboard" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">View Partner Dashboard →</a>
        </div>
      </div>
    </div>
  `);
};

// Sponsor alert — someone purchased a package through their referral
export const sendSponsorPurchaseAlert = async (to: string, sponsorName: string, newUserName: string, newUserEmail: string, packageName: string, commission: number) => {
  await sendEmail(to, '💰 New Sale! Commission Earned!', `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">You earned a commission!</p>
      </div>
      <div style="padding:32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 16px">Congratulations ${sponsorName}! 🎉</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">Your referral just purchased a package. Here are the details:</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 24px">
          <p style="color:#f59e0b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Sale Details</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0;width:100px">Member:</td>
              <td style="color:#fff;font-weight:600;font-size:14px">${newUserName}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0">Email:</td>
              <td style="color:#a78bfa;font-weight:600;font-size:14px">${newUserEmail}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0">Package:</td>
              <td style="color:#fff;font-weight:600;font-size:14px">${packageName}</td>
            </tr>
            ${commission > 0 ? `<tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0">Commission:</td>
              <td style="color:#10b981;font-weight:800;font-size:18px">₹${commission}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align:center;margin:24px 0">
          <a href="${process.env.WEB_URL}/partner/earnings" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:15px">View Earnings →</a>
        </div>
      </div>
    </div>
  `);
};

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  userName: string;
  userEmail: string;
  packageName: string;
  // payment type
  paymentType: 'full' | 'token' | 'emi_installment' | 'wallet' | 'emi' | 'token_emi' | 'token_full';
  // amounts
  amountPaid: number;
  gstAmount?: number;
  walletAmountUsed?: number;
  fullPackagePrice?: number;
  // emi info
  installmentNumber?: number;
  totalInstallments?: number;
  nextDueDate?: string;
  nextInstallmentAmount?: number;
  allInstallmentsPaid?: boolean;
}

export const sendInvoiceEmail = async (to: string, data: InvoiceData) => {
  const {
    invoiceNumber, invoiceDate, userName, userEmail, packageName,
    paymentType, amountPaid, gstAmount = 0, walletAmountUsed = 0,
    installmentNumber, totalInstallments, nextDueDate, nextInstallmentAmount, allInstallmentsPaid,
  } = data;

  const paymentLabel =
    paymentType === 'full'              ? '✅ Full Payment'
    : paymentType === 'token'           ? '🪙 Token Amount (Advance)'
    : paymentType === 'token_emi'       ? '🪙 Token/Advance Payment (Balance via EMI)'
    : paymentType === 'token_full'      ? '🪙 Token/Advance Payment (Balance via Full)'
    : paymentType === 'emi'             ? `📅 EMI — Installment 1 of ${totalInstallments || 4}`
    : paymentType === 'emi_installment' ? `📅 EMI — Installment ${installmentNumber} of ${totalInstallments}`
    :                                     '💰 Wallet Payment';

  const subjectLabel =
    paymentType === 'full'              ? 'Payment Receipt'
    : paymentType === 'token'           ? 'Token Payment Receipt'
    : paymentType === 'token_emi'       ? 'Token/Advance Receipt (EMI Plan)'
    : paymentType === 'token_full'      ? 'Token/Advance Receipt (Full Payment Plan)'
    : paymentType === 'emi'             ? 'EMI Installment 1 Receipt'
    : paymentType === 'emi_installment' ? `EMI Installment ${installmentNumber} Receipt`
    :                                     'Payment Receipt';

  const accentColor =
    paymentType === 'full'                                ? '#10b981'
    : (paymentType === 'token' || paymentType.startsWith('token_')) ? '#f59e0b'
    : paymentType === 'wallet'                            ? '#f59e0b'
    :                                                       '#6366f1';

  const tokenNoteRow = (paymentType === 'token' || paymentType === 'token_emi' || paymentType === 'token_full') ? `
    <div style="background:#1c1400;border:1px solid #92400e;border-radius:8px;padding:14px;margin:16px 0 0">
      <p style="color:#fbbf24;font-size:12px;font-weight:700;margin:0 0 4px">📋 Next Steps</p>
      <p style="color:#fde68a;font-size:13px;margin:0">
        Your advance/token payment has been received.
        ${paymentType === 'token_emi' ? `Balance of ₹${((data as any).fullPackagePrice || 0) - amountPaid} will be charged via EMI installments.`
          : paymentType === 'token_full' ? `Balance of ₹${((data as any).fullPackagePrice || 0) - amountPaid} to be paid as a full payment.`
          : 'Your sales partner will contact you shortly to finalise the remaining payment schedule.'}
      </p>
    </div>` : '';

  const emiNextRow = (!allInstallmentsPaid && nextDueDate && nextInstallmentAmount) ? `
    <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:8px;padding:14px;margin:16px 0 0">
      <p style="color:#f59e0b;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px">Next Installment Due</p>
      <p style="color:#fff;font-size:14px;margin:0"><strong>₹${nextInstallmentAmount}</strong> due on <strong>${nextDueDate}</strong></p>
      <a href="${process.env.WEB_URL}/student/emi" style="display:inline-block;margin-top:10px;padding:8px 18px;background:${accentColor};color:#fff;border-radius:20px;text-decoration:none;font-size:12px;font-weight:700">Pay Next EMI →</a>
    </div>` : '';

  const allPaidRow = allInstallmentsPaid ? `
    <div style="background:#052e16;border:1px solid #16a34a;border-radius:8px;padding:14px;margin:16px 0 0;text-align:center">
      <p style="color:#4ade80;font-size:14px;font-weight:700;margin:0">🎉 All EMI installments paid! Full access unlocked.</p>
    </div>` : '';

  await sendEmail(to, `🧾 TruLearnix — ${subjectLabel} #${invoiceNumber}`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,${accentColor},#1a1a2e);padding:28px 32px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">🎓 TruLearnix</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Payment Invoice</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px">Invoice #</p>
          <p style="margin:0;color:#fff;font-weight:700;font-size:14px">${invoiceNumber}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:11px">${invoiceDate}</p>
        </div>
      </div>

      <div style="padding:28px 32px;background:#1a1a2e">
        <p style="color:#a0a0b8;font-size:13px;margin:0 0 4px">Billed To</p>
        <p style="color:#fff;font-weight:600;font-size:15px;margin:0">${userName}</p>
        <p style="color:#a0a0b8;font-size:13px;margin:2px 0 20px;word-break:break-all">${userEmail}</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 20px">
          <p style="color:#6366f1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Payment Details</p>

          <div style="border-bottom:1px solid #2d2d4e;padding-bottom:10px;margin-bottom:10px">
            <p style="color:#a0a0b8;font-size:12px;margin:0 0 2px">Package</p>
            <p style="color:#fff;font-weight:600;font-size:14px;margin:0">${packageName}</p>
          </div>

          <div style="border-bottom:1px solid #2d2d4e;padding-bottom:10px;margin-bottom:10px">
            <p style="color:#a0a0b8;font-size:12px;margin:0 0 2px">Payment Type</p>
            <p style="color:#fff;font-weight:600;font-size:14px;margin:0">${paymentLabel}</p>
          </div>

          ${walletAmountUsed > 0 ? `
          <div style="border-bottom:1px solid #2d2d4e;padding-bottom:10px;margin-bottom:10px">
            <p style="color:#a0a0b8;font-size:12px;margin:0 0 2px">Wallet Used</p>
            <p style="color:#f59e0b;font-weight:600;font-size:14px;margin:0">₹${walletAmountUsed}</p>
          </div>` : ''}

          ${gstAmount > 0 ? `
          <div style="border-bottom:1px solid #2d2d4e;padding-bottom:10px;margin-bottom:10px">
            <p style="color:#a0a0b8;font-size:12px;margin:0 0 2px">GST (18%)</p>
            <p style="color:#a0a0b8;font-size:14px;margin:0">₹${gstAmount}</p>
          </div>` : ''}

          <div>
            <p style="color:#a0a0b8;font-size:12px;margin:0 0 2px">Amount Paid</p>
            <p style="color:${accentColor};font-weight:800;font-size:24px;margin:0">₹${amountPaid}</p>
          </div>
        </div>

        ${tokenNoteRow}
        ${emiNextRow}
        ${allPaidRow}

        <div style="text-align:center;margin:24px 0 8px">
          <a href="${process.env.WEB_URL}/student/dashboard" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:13px 32px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:14px">Go to Dashboard →</a>
        </div>

        <div style="border-top:1px solid #2d2d4e;padding-top:16px;margin-top:16px">
          <p style="color:#a0a0b8;font-size:12px;margin:0;text-align:center">Need help? <a href="mailto:support@peptly.in" style="color:#6366f1">support@peptly.in</a></p>
        </div>
      </div>
    </div>
  `);
};

// ── Salary Paid Email (Mentor / Employee) ────────────────────────────────────
export interface SalaryPaidData {
  name: string;
  slipNo: string;
  month: string;
  year: number;
  grossAmount: number;
  earnedAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netAmount: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  payableDays: number;
  perDayAmount: number;
  bankAccount?: string;
  bankName?: string;
  paidAt: Date;
  remarks?: string;
  role: 'mentor' | 'employee';
}

export const sendSalaryPaidEmail = async (to: string, data: SalaryPaidData) => {
  const {
    name, slipNo, month, year, grossAmount, earnedAmount, tdsRate, tdsAmount,
    netAmount, workingDays, presentDays, absentDays, halfDays, leaveDays,
    unpaidLeaveDays, holidayDays, payableDays, perDayAmount, bankAccount, bankName,
    paidAt, remarks, role,
  } = data;

  const roleLabel = role === 'mentor' ? 'Mentor' : 'Employee';
  const accentColor = role === 'mentor' ? '#8b5cf6' : '#6366f1';
  const hasAttendance = workingDays > 0;
  const paidDateStr = paidAt.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  await sendEmail(to, `Salary Credited — ${month} ${year} | TruLearnix`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,${accentColor},#1a1a2e);padding:28px 32px">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">TruLearnix</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${roleLabel} Salary Slip — ${month} ${year}</p>
      </div>
      <div style="padding:28px 32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 4px">Hi ${name},</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">Your salary for <strong style="color:#fff">${month} ${year}</strong> has been credited to your bank account.</p>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 20px">
          <p style="color:${accentColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Salary Details</p>

          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Slip No.</td><td style="color:#fff;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">${slipNo}</td></tr>
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Monthly Gross</td><td style="color:#fff;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">₹${grossAmount.toLocaleString('en-IN')}</td></tr>
            ${hasAttendance && earnedAmount !== grossAmount ? `<tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Attendance-Earned</td><td style="color:#fff;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">₹${earnedAmount.toLocaleString('en-IN')}</td></tr>` : ''}
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">TDS @ ${tdsRate}%</td><td style="color:#f87171;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">- ₹${tdsAmount.toLocaleString('en-IN')}</td></tr>
            <tr><td style="color:#4ade80;font-size:14px;font-weight:700;padding:10px 0 0">Net Amount Credited</td><td style="color:#4ade80;font-weight:800;font-size:20px;text-align:right;padding:10px 0 0">₹${netAmount.toLocaleString('en-IN')}</td></tr>
          </table>
        </div>

        ${hasAttendance ? `
        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 20px">
          <p style="color:${accentColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Attendance Breakdown — ${month} ${year}</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              ${[
                ['Working Days', workingDays, '#fff'],
                ['Holidays', holidayDays, '#a78bfa'],
                ['Present', presentDays, '#4ade80'],
                ['Absent', absentDays, '#f87171'],
                ['Half Day', halfDays, '#fbbf24'],
                ['Paid Leave', leaveDays, '#60a5fa'],
              ].map(([l, v, c]: any) => `
              <td style="text-align:center;padding:8px 4px">
                <div style="background:#1a1a2e;border-radius:8px;padding:10px 6px">
                  <p style="color:${c};font-weight:800;font-size:16px;margin:0">${v}</p>
                  <p style="color:#6b7280;font-size:10px;margin:4px 0 0">${l}</p>
                </div>
              </td>`).join('')}
            </tr>
          </table>
          <div style="background:#1a1a2e;border:1px solid ${accentColor}30;border-radius:8px;padding:10px 14px;margin:12px 0 0;display:flex;justify-content:space-between">
            <span style="color:#a0a0b8;font-size:12px">Payable Days</span>
            <span style="color:${accentColor};font-weight:700;font-size:12px">${payableDays.toFixed ? payableDays.toFixed(1) : payableDays} days × ₹${perDayAmount.toLocaleString('en-IN')}/day = ₹${earnedAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>` : ''}

        ${bankAccount ? `
        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:16px 20px;margin:0 0 20px">
          <p style="color:#a0a0b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Credited To</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0">${bankName || 'Bank Account'}</p>
          <p style="color:#a0a0b8;font-size:13px;margin:2px 0 0">Account: ****${bankAccount.slice(-4)}</p>
        </div>` : ''}

        <div style="background:#052e16;border:1px solid #16a34a;border-radius:8px;padding:12px 16px;margin:0 0 20px">
          <p style="color:#4ade80;font-size:13px;font-weight:700;margin:0">✅ Payment Date: ${paidDateStr}</p>
        </div>

        ${remarks ? `<p style="color:#a0a0b8;font-size:13px;font-style:italic;margin:0 0 16px">Note: ${remarks}</p>` : ''}

        <div style="border-top:1px solid #2d2d4e;padding-top:16px">
          <p style="color:#a0a0b8;font-size:12px;margin:0;text-align:center">For queries: <a href="mailto:hr@peptly.in" style="color:${accentColor}">hr@peptly.in</a> | TruLearnix</p>
        </div>
      </div>
    </div>
  `);
};

// ── Withdrawal Successful Email ───────────────────────────────────────────────
export interface WithdrawalSuccessData {
  name: string;
  amount: number;
  tdsAmount: number;
  gatewayFee: number;
  netAmount: number;
  transactionId: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  completedAt: Date;
}

export const sendWithdrawalSuccessEmail = async (to: string, data: WithdrawalSuccessData) => {
  const { name, amount, tdsAmount, gatewayFee, netAmount, transactionId, bankAccount, bankName, accountName, completedAt } = data;
  const dateStr = completedAt.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  await sendEmail(to, `Withdrawal Successful — ₹${netAmount.toLocaleString('en-IN')} Credited | TruLearnix`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#10b981,#0f172a);padding:28px 32px">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff">TruLearnix</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Withdrawal Successfully Processed</p>
      </div>
      <div style="padding:28px 32px;background:#1a1a2e">
        <h2 style="color:#fff;margin:0 0 4px">Hi ${name},</h2>
        <p style="color:#a0a0b8;margin:0 0 24px">Your withdrawal request has been processed and the amount has been transferred to your bank account.</p>

        <div style="background:#052e16;border:1px solid #16a34a;border-radius:10px;padding:20px;margin:0 0 20px;text-align:center">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Amount Credited</p>
          <p style="color:#4ade80;font-weight:800;font-size:36px;margin:0">₹${netAmount.toLocaleString('en-IN')}</p>
          <p style="color:#6b7280;font-size:11px;margin:6px 0 0">${dateStr}</p>
        </div>

        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin:0 0 20px">
          <p style="color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px">Transaction Details</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Transaction ID</td><td style="color:#10b981;font-weight:700;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e;font-family:monospace">${transactionId}</td></tr>
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Requested Amount</td><td style="color:#fff;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">₹${amount.toLocaleString('en-IN')}</td></tr>
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">TDS (2%)</td><td style="color:#f87171;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">- ₹${tdsAmount.toLocaleString('en-IN')}</td></tr>
            <tr><td style="color:#a0a0b8;font-size:13px;padding:7px 0;border-bottom:1px solid #2d2d4e">Gateway Fee</td><td style="color:#f87171;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #2d2d4e">- ₹${gatewayFee.toFixed(2)}</td></tr>
            <tr><td style="color:#4ade80;font-size:14px;font-weight:700;padding:10px 0 0">Net Credited</td><td style="color:#4ade80;font-weight:800;font-size:20px;text-align:right;padding:10px 0 0">₹${netAmount.toLocaleString('en-IN')}</td></tr>
          </table>
        </div>

        ${bankAccount ? `
        <div style="background:#0f0f1a;border:1px solid #2d2d4e;border-radius:10px;padding:16px 20px;margin:0 0 20px">
          <p style="color:#a0a0b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Credited To</p>
          <p style="color:#fff;font-weight:600;font-size:14px;margin:0">${accountName || bankName || 'Bank Account'}</p>
          ${bankName ? `<p style="color:#a0a0b8;font-size:13px;margin:2px 0 0">${bankName}</p>` : ''}
          <p style="color:#a0a0b8;font-size:13px;margin:2px 0 0">Account: ****${bankAccount.slice(-4)}</p>
        </div>` : ''}

        <div style="text-align:center;margin:16px 0">
          <a href="${process.env.WEB_URL}/partner/earnings" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:12px 28px;border-radius:50px;text-decoration:none;display:inline-block;font-weight:700;font-size:14px">View Earnings Dashboard →</a>
        </div>

        <div style="border-top:1px solid #2d2d4e;padding-top:16px">
          <p style="color:#a0a0b8;font-size:12px;margin:0;text-align:center">Queries? <a href="mailto:support@peptly.in" style="color:#10b981">support@peptly.in</a> | TruLearnix</p>
        </div>
      </div>
    </div>
  `);
};

export const sendClassReminderEmail = async (to: string, name: string, classTitle: string, scheduledAt: Date) => {
  await sendEmail(to, `Reminder: ${classTitle} starts soon`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2>Hi ${name},</h2>
      <p>Your live class <strong>${classTitle}</strong> starts at <strong>${scheduledAt.toLocaleString()}</strong>.</p>
      <a href="${process.env.WEB_URL}/student/classes" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Join Class</a>
    </div>
  `);
};
