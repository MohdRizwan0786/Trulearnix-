#!/usr/bin/env node
/* eslint-disable */
// Backfill EarningMilestone records for users who already crossed 50K/1L
// but never got a milestone record (because milestoneService only fires on
// NEW commissions, not migrated data).
//
// Usage: MONGODB_URI=mongodb://localhost:27017/trulearnix_prod node scripts/backfill-earning-milestones.js
// Idempotent — duplicate (user, milestone) pairs are skipped by unique index.

const mongoose = require('mongoose');

const MILESTONES = [50000, 100000];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('[backfill] connected:', uri);

  const Users = mongoose.connection.collection('users');
  const Milestones = mongoose.connection.collection('earningmilestones');

  // Get all eligible users (totalEarnings >= 50000), skip admin roles
  const users = await Users.find(
    { totalEarnings: { $gte: 50000 }, role: { $nin: ['superadmin', 'admin'] } },
    { projection: { _id: 1, name: 1, totalEarnings: 1, avatar: 1, affiliateCode: 1 } }
  ).toArray();

  console.log(`[backfill] found ${users.length} eligible partners`);

  let created = 0, skipped = 0;

  for (const u of users) {
    for (const level of MILESTONES) {
      if ((u.totalEarnings || 0) < level) continue;

      // Check if already exists
      const existing = await Milestones.findOne({ user: u._id, milestone: level });
      if (existing) { skipped++; continue; }

      try {
        await Milestones.insertOne({
          user: u._id,
          milestone: level,
          achievedAt: new Date(),
          totalEarningsAtAchievement: u.totalEarnings,
          name: u.name,
          avatarUrl: u.avatar || '',
          affiliateCode: u.affiliateCode || '',
          __v: 0,
        });
        created++;
        console.log(`  ✓ ${u.name} — ₹${level} milestone (total: ₹${u.totalEarnings})`);
      } catch (e) {
        if (e.code === 11000) { skipped++; continue; }
        console.error(`  ✗ ${u.name}: ${e.message}`);
      }
    }
  }

  console.log(`[backfill] done — created=${created} skipped=${skipped}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
