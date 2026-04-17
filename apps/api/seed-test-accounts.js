/**
 * TruLearnix — Test Account Seed Script
 * Creates: 12 Sales, 3 Managers, 5 Mentors, 20 Learners+Partners
 * Run: node seed-test-accounts.js
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const PDFDocument = require('pdfkit');
const fs       = require('fs');
const path     = require('path');

const MONGO_URI = 'mongodb://localhost:27017/trulearnix';
const WEB_URL   = 'https://peptly.in';
const ADMIN_URL = 'https://admin.peptly.in';

// ── User Schema (minimal for seeding) ────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, phone: String,
  password: String, role: String, isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true }, isAffiliate: { type: Boolean, default: false },
  packageTier: { type: String, default: 'free' }, wallet: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 }, affiliateCode: String,
  commissionRate: { type: Number, default: 25 }, department: String,
  employeeId: String, managerId: mongoose.Types.ObjectId,
  permissions: [String],
}, { timestamps: true });

let User;
try { User = mongoose.model('User'); }
catch { User = mongoose.model('User', UserSchema); }

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad  = (n, len = 4) => String(n).padStart(len, '0');

const FIRST_NAMES = ['Aarav','Rohit','Priya','Anjali','Rahul','Neha','Vikram','Sonia',
  'Amit','Pooja','Suresh','Kavita','Ravi','Meera','Arjun','Deepa','Karan','Shweta',
  'Manish','Nisha','Vivek','Rekha','Sanjay','Preeti','Nikhil','Divya','Gaurav','Usha',
  'Kunal','Smita','Tarun','Rina','Alok','Pallavi','Varun','Sunita','Harsh','Geeta'];

const LAST_NAMES  = ['Sharma','Verma','Singh','Gupta','Joshi','Patel','Kumar','Yadav',
  'Mishra','Agarwal','Tiwari','Pandey','Shah','Mehta','Nair','Reddy','Iyer','Bose'];

const used = new Set();
function uniqueName() {
  let n;
  do { n = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`; } while (used.has(n));
  used.add(n); return n;
}
function emailFrom(name, tag) {
  return `test.${name.toLowerCase().replace(/ /g, '.')}.${tag}@trulearnix.test`;
}
function phone() { return `9${Math.floor(Math.random() * 900000000 + 100000000)}`; }

const PASSWORD = 'Test@1234';

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const hash = await bcrypt.hash(PASSWORD, 10);
  const accounts = [];

  // ── 3 Partner Managers ───────────────────────────────────────────────────
  const managerIds = [];
  for (let i = 1; i <= 3; i++) {
    const name  = uniqueName();
    const email = emailFrom(name, 'mgr');
    const empId = `MGR${pad(1000 + i)}`;
    await User.deleteOne({ email });
    const mgr = await User.create({
      name, email, phone: phone(), password: hash,
      role: 'manager', employeeId: empId, department: 'partner',
      affiliateCode: `MGR${pad(1000 + i)}`,
      isVerified: true, isActive: true, wallet: Math.floor(Math.random() * 5000 + 1000),
      permissions: ['dashboard','partners','crm','analytics','kanban','reminders','calendar'],
    });
    managerIds.push(mgr._id);
    accounts.push({ group: 'Partner Manager', name, email, password: PASSWORD, empId, panel: `${WEB_URL}/manager/dashboard` });
    console.log(`  ✅ Manager: ${name} <${email}>`);
  }

  // ── 12 Sales Team (Salesperson) ──────────────────────────────────────────
  for (let i = 1; i <= 12; i++) {
    const name    = uniqueName();
    const email   = emailFrom(name, 'sales');
    const affCode = `SALES${pad(2000 + i)}`;
    const managerId = rand(managerIds);
    await User.deleteOne({ email });
    await User.create({
      name, email, phone: phone(), password: hash,
      role: 'salesperson', department: 'sales',
      affiliateCode: affCode, isVerified: true, isActive: true,
      isAffiliate: true, commissionRate: 25,
      wallet: Math.floor(Math.random() * 3000 + 500),
      managerId,
      permissions: ['dashboard','crm','kanban','reminders','calendar','analytics','learners'],
    });
    accounts.push({ group: 'Sales Team', name, email, password: PASSWORD, empId: affCode, panel: `${WEB_URL}/sales/dashboard` });
    console.log(`  ✅ Salesperson: ${name} <${email}>`);
  }

  // ── 5 Mentors ─────────────────────────────────────────────────────────────
  for (let i = 1; i <= 5; i++) {
    const name  = uniqueName();
    const email = emailFrom(name, 'mentor');
    await User.deleteOne({ email });
    await User.create({
      name, email, phone: phone(), password: hash,
      role: 'mentor', isVerified: true, isActive: true,
      affiliateCode: `MNTR${pad(5000 + i)}`,
      wallet: Math.floor(Math.random() * 8000 + 2000),
      permissions: ['dashboard','courses','classes','assignments','quizzes'],
    });
    accounts.push({ group: 'Mentor', name, email, password: PASSWORD, empId: `MENTOR-${pad(i)}`, panel: `${WEB_URL}/mentor/dashboard` });
    console.log(`  ✅ Mentor: ${name} <${email}>`);
  }

  // ── 20 Learners + Partners ────────────────────────────────────────────────
  const tiers = ['starter','starter','pro','pro','elite','supreme'];
  for (let i = 1; i <= 20; i++) {
    const name    = uniqueName();
    const email   = emailFrom(name, `l${i}`);
    const tier    = rand(tiers);
    const affCode = `PART${pad(3000 + i)}`;
    const sponsorId = rand(managerIds);
    await User.deleteOne({ email });
    await User.create({
      name, email, phone: phone(), password: hash,
      role: 'student', isVerified: true, isActive: true,
      isAffiliate: true, affiliateCode: affCode,
      packageTier: tier, commissionRate: 25,
      wallet: Math.floor(Math.random() * 2000),
      referredBy: sponsorId,
    });
    accounts.push({ group: 'Learner + Partner', name, email, password: PASSWORD, empId: affCode, panel: `${WEB_URL}/student/dashboard` });
    console.log(`  ✅ Learner+Partner [${tier}]: ${name} <${email}>`);
  }

  await mongoose.disconnect();
  console.log(`\n✅ All ${accounts.length} accounts created!\n`);

  // ── Generate PDF ─────────────────────────────────────────────────────────
  await generatePDF(accounts);
}

async function generatePDF(accounts) {
  const doc  = new PDFDocument({ margin: 40, size: 'A4' });
  const file = path.join(__dirname, 'TruLearnix-Test-Accounts.pdf');
  doc.pipe(fs.createWriteStream(file));

  const PURPLE = '#6366f1';
  const GREEN  = '#10b981';
  const DARK   = '#1e1b4b';
  const GRAY   = '#6b7280';

  const groups = ['Partner Manager','Sales Team','Mentor','Learner + Partner'];
  const groupColors = {
    'Partner Manager': '#10b981',
    'Sales Team':      '#f59e0b',
    'Mentor':          '#8b5cf6',
    'Learner + Partner': '#6366f1',
  };
  const groupCounts = {
    'Partner Manager': accounts.filter(a => a.group === 'Partner Manager').length,
    'Sales Team':      accounts.filter(a => a.group === 'Sales Team').length,
    'Mentor':          accounts.filter(a => a.group === 'Mentor').length,
    'Learner + Partner': accounts.filter(a => a.group === 'Learner + Partner').length,
  };

  // ── Cover Page ──────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f0f1a');
  doc.rect(0, 0, doc.page.width, 6).fill(PURPLE);

  // Logo circle
  doc.circle(doc.page.width / 2, 180, 50).fill(PURPLE);
  doc.fontSize(30).fillColor('#ffffff').font('Helvetica-Bold')
     .text('TL', doc.page.width / 2 - 20, 162);

  doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
     .text('TruLearnix', 0, 250, { align: 'center' });
  doc.fontSize(13).fillColor('#a0a0b8').font('Helvetica')
     .text('TRULEARNIX DIGITAL SKILLS LLP', 0, 286, { align: 'center' });

  doc.rect(doc.page.width / 2 - 120, 320, 240, 2).fill(PURPLE);

  doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold')
     .text('Test Account Credentials', 0, 340, { align: 'center' });
  doc.fontSize(12).fillColor('#a0a0b8').font('Helvetica')
     .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 0, 368, { align: 'center' });

  // Summary boxes
  const boxW = 110, boxH = 70, startX = 40, boxY = 420, gap = 10;
  groups.forEach((g, idx) => {
    const bx = startX + idx * (boxW + gap);
    doc.roundedRect(bx, boxY, boxW, boxH, 8).fill(groupColors[g] + '22');
    doc.rect(bx, boxY, boxW, 4).fill(groupColors[g]);
    doc.fontSize(26).fillColor(groupColors[g]).font('Helvetica-Bold')
       .text(String(groupCounts[g]), bx, boxY + 14, { width: boxW, align: 'center' });
    doc.fontSize(8).fillColor('#a0a0b8').font('Helvetica')
       .text(g, bx, boxY + 46, { width: boxW, align: 'center' });
  });

  // Password note
  doc.roundedRect(40, 510, doc.page.width - 80, 50, 8).fill('#1a1a2e');
  doc.fontSize(11).fillColor('#fbbf24').font('Helvetica-Bold')
     .text('Default Password for ALL accounts:', 55, 523);
  doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold')
     .text(PASSWORD, 55, 540);

  // URLs
  doc.fontSize(9).fillColor(GRAY).font('Helvetica')
     .text(`Web: ${WEB_URL}    Admin: ${ADMIN_URL}`, 0, 580, { align: 'center' });

  doc.fontSize(8).fillColor('#374151').font('Helvetica')
     .text('CONFIDENTIAL — For internal testing only. Do not share.', 0, 740, { align: 'center' });

  // ── Account Pages ────────────────────────────────────────────────────────
  for (const group of groups) {
    const grpAccounts = accounts.filter(a => a.group === group);
    const color = groupColors[group];

    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f0f1a');
    doc.rect(0, 0, doc.page.width, 6).fill(color);

    // Section header
    doc.roundedRect(40, 20, doc.page.width - 80, 50, 8).fill(color + '22');
    doc.rect(40, 20, 4, 50).fill(color);
    doc.fontSize(18).fillColor(color).font('Helvetica-Bold')
       .text(group, 56, 30);
    doc.fontSize(10).fillColor('#a0a0b8').font('Helvetica')
       .text(`${grpAccounts.length} accounts  |  Panel: ${grpAccounts[0]?.panel}`, 56, 52);

    let y = 88;
    grpAccounts.forEach((acc, idx) => {
      if (y > 700) { doc.addPage(); doc.rect(0,0,doc.page.width,doc.page.height).fill('#0f0f1a'); y = 40; }

      const rowH = 72;
      doc.roundedRect(40, y, doc.page.width - 80, rowH, 8).fill('#1a1a2e');
      doc.rect(40, y, 4, rowH).fill(color);

      // Index badge
      doc.circle(62, y + rowH/2, 12).fill(color + '33');
      doc.fontSize(9).fillColor(color).font('Helvetica-Bold')
         .text(String(idx + 1), 55, y + rowH/2 - 6, { width: 14, align: 'center' });

      // Name + ID
      doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
         .text(acc.name, 82, y + 10, { width: 250 });
      doc.fontSize(8).fillColor(color).font('Helvetica-Bold')
         .text(acc.empId, 82, y + 26);

      // Email label
      doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text('Email:', 82, y + 40);
      doc.fontSize(9).fillColor('#a0a0b8').font('Helvetica').text(acc.email, 114, y + 40);

      // Password box
      doc.roundedRect(doc.page.width - 185, y + 8, 140, 24, 6).fill('#0f0f1a');
      doc.fontSize(8).fillColor('#6b7280').font('Helvetica').text('Password:', doc.page.width - 180, y + 12);
      doc.fontSize(10).fillColor('#fbbf24').font('Helvetica-Bold').text(PASSWORD, doc.page.width - 180, y + 24);

      // Panel
      doc.fontSize(7).fillColor('#374151').font('Helvetica').text(acc.panel, 82, y + 54, { width: 300 });

      y += rowH + 6;
    });
  }

  // ── Final note page ───────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0,0,doc.page.width,doc.page.height).fill('#0f0f1a');
  doc.rect(0,0,doc.page.width,6).fill(PURPLE);

  doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text('Testing Guide', 40, 40);
  doc.rect(40, 65, doc.page.width - 80, 1).fill('#2d2d4e');

  const notes = [
    ['Partner Manager', `Login at ${WEB_URL}/login → /manager/dashboard\n- View assigned partners, EMI commissions, Kanban\n- Withdraw earnings from /manager/withdraw (requires KYC)`],
    ['Sales Team', `Login at ${WEB_URL}/login → /sales/dashboard\n- CRM, leads, orders, earnings\n- Withdraw from /sales/withdraw (requires KYC)`],
    ['Mentor', `Login at ${WEB_URL}/login → /mentor/dashboard\n- Courses, students, assignments, live classes\n- Salary paid by admin → email + WhatsApp notification`],
    ['Learner + Partner', `Login at ${WEB_URL}/login → /student/dashboard\n- Enrolled courses, live classes, assignments\n- Partner panel at /partner/dashboard\n- Withdrawal from /partner/withdraw (requires KYC)`],
    ['Admin Panel', `Login at ${ADMIN_URL}\n- Salary: /mentor-salary and /employee-salary\n- Withdrawals: /withdrawals\n- Mark Paid → triggers email + WhatsApp to recipient`],
  ];

  let ny = 80;
  notes.forEach(([title, desc]) => {
    doc.roundedRect(40, ny, doc.page.width - 80, 80, 8).fill('#1a1a2e');
    doc.rect(40, ny, 4, 80).fill(PURPLE);
    doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold').text(title, 56, ny + 10);
    doc.fontSize(9).fillColor('#a0a0b8').font('Helvetica').text(desc, 56, ny + 28, { width: doc.page.width - 120 });
    ny += 90;
  });

  doc.fontSize(8).fillColor('#374151').font('Helvetica')
     .text('CONFIDENTIAL — TruLearnix Internal Testing Document', 0, 760, { align: 'center' });

  doc.end();
  console.log(`\n📄 PDF generated: ${file}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
