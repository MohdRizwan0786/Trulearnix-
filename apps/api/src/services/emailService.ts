import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
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

export const sendClassReminderEmail = async (to: string, name: string, classTitle: string, scheduledAt: Date) => {
  await sendEmail(to, `Reminder: ${classTitle} starts soon`, `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2>Hi ${name},</h2>
      <p>Your live class <strong>${classTitle}</strong> starts at <strong>${scheduledAt.toLocaleString()}</strong>.</p>
      <a href="${process.env.WEB_URL}/student/classes" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Join Class</a>
    </div>
  `);
};
