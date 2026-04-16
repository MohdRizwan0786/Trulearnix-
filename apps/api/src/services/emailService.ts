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
          <p style="color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Your Login Credentials</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0;width:80px">Email:</td>
              <td style="color:#fff;font-weight:600;font-size:14px">${email}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b8;font-size:13px;padding:6px 0">Password:</td>
              <td style="color:#a78bfa;font-weight:700;font-size:18px;letter-spacing:2px;font-family:monospace">${password}</td>
            </tr>
          </table>
          <p style="color:#f59e0b;font-size:11px;margin:12px 0 0">⚠️ Please save your password and change it after first login for security.</p>
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

export const sendClassReminderEmail = async (to: string, name: string, classTitle: string, scheduledAt: Date) => {
  await sendEmail(to, `Reminder: ${classTitle} starts soon`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2>Hi ${name},</h2>
      <p>Your live class <strong>${classTitle}</strong> starts at <strong>${scheduledAt.toLocaleString()}</strong>.</p>
      <a href="${process.env.WEB_URL}/student/classes" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Join Class</a>
    </div>
  `);
};
