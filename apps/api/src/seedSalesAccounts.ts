/**
 * TruLearnix — Demo Sales Person Accounts Seeder
 * Run: npx ts-node -r tsconfig-paths/register src/seedSalesAccounts.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User';

const accounts = [
  { name: 'Arjun Sharma',   email: 'arjun.sharma@trulearnix.com',   phone: '9811001001' },
  { name: 'Priya Verma',    email: 'priya.verma@trulearnix.com',    phone: '9811001002' },
  { name: 'Rahul Gupta',    email: 'rahul.gupta@trulearnix.com',    phone: '9811001003' },
  { name: 'Sneha Patel',    email: 'sneha.patel@trulearnix.com',    phone: '9811001004' },
  { name: 'Vikram Singh',   email: 'vikram.singh@trulearnix.com',   phone: '9811001005' },
  { name: 'Anjali Mehta',   email: 'anjali.mehta@trulearnix.com',   phone: '9811001006' },
  { name: 'Rohit Yadav',    email: 'rohit.yadav@trulearnix.com',    phone: '9811001007' },
  { name: 'Kavya Nair',     email: 'kavya.nair@trulearnix.com',     phone: '9811001008' },
  { name: 'Aditya Joshi',   email: 'aditya.joshi@trulearnix.com',   phone: '9811001009' },
  { name: 'Pooja Mishra',   email: 'pooja.mishra@trulearnix.com',   phone: '9811001010' },
  { name: 'Manish Tiwari',  email: 'manish.tiwari@trulearnix.com',  phone: '9811001011' },
  { name: 'Riya Agarwal',   email: 'riya.agarwal@trulearnix.com',   phone: '9811001012' },
];

const PASSWORD = 'Sales@123';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trulearnix');
  console.log('MongoDB connected\n');

  let created = 0, skipped = 0;

  for (const acc of accounts) {
    const exists = await User.findOne({ email: acc.email });
    if (exists) {
      console.log(`SKIP  ${acc.email}`);
      skipped++;
      continue;
    }
    await User.create({
      ...acc,
      password: PASSWORD,
      role: 'salesperson',
      isVerified: true,
      isActive: true,
    });
    console.log(`OK    ${acc.name} <${acc.email}>`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`);
  console.log(`Password: ${PASSWORD}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
