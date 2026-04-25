/**
 * Seed 1 mentor + 2 learner test accounts specifically for AirDrawer QA testing.
 *
 * Run on the QA server:
 *   cd apps/api && npx ts-node src/seedAirDrawerAccounts.ts
 * or, if compiled:
 *   node dist/seedAirDrawerAccounts.js
 *
 * Credentials (password same for all):
 *   Mentor  : airdrawer.mentor@trulearnix.test   / Test@1234
 *   Learner1: airdrawer.learner1@trulearnix.test / Test@1234
 *   Learner2: airdrawer.learner2@trulearnix.test / Test@1234
 */

import mongoose from 'mongoose';
import User from './models/User';
import { connectDB } from './config/database';

const PASSWORD = 'Test@1234';

const ACCOUNTS = [
  {
    name: 'AirDrawer Mentor',
    email: 'airdrawer.mentor@trulearnix.test',
    phone: '9000000001',
    role: 'mentor',
    permissions: ['dashboard', 'courses', 'classes', 'assignments', 'quizzes', 'live-classes'],
  },
  {
    name: 'AirDrawer Learner One',
    email: 'airdrawer.learner1@trulearnix.test',
    phone: '9000000002',
    role: 'student',
    permissions: [],
  },
  {
    name: 'AirDrawer Learner Two',
    email: 'airdrawer.learner2@trulearnix.test',
    phone: '9000000003',
    role: 'student',
    permissions: [],
  },
] as const;

async function run() {
  await connectDB();

  for (const acc of ACCOUNTS) {
    await User.deleteOne({ email: acc.email });
    await User.create({
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      password: PASSWORD,
      role: acc.role,
      isActive: true,
      isVerified: true,
      permissions: acc.permissions,
    });
    console.log(`  ✅ ${acc.role.padEnd(8)} ${acc.email}  /  ${PASSWORD}`);
  }

  await mongoose.disconnect();
  console.log(`\nDone. All 3 AirDrawer test accounts ready.\n`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
