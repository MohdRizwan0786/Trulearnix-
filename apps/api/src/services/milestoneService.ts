import EarningMilestone from '../models/EarningMilestone';

const MILESTONES = [50000, 100000] as const;

/**
 * Call this after any totalEarnings increment.
 * Checks if the user crossed a 50K or 1L milestone and records it (idempotent).
 *
 * @param userId   - MongoDB user _id string
 * @param prevTotal - totalEarnings BEFORE this credit
 * @param newTotal  - totalEarnings AFTER this credit
 * @param name      - user's display name (snapshot)
 * @param avatarUrl - user's profile photo URL (snapshot, optional)
 * @param affiliateCode - partner's affiliate code (optional)
 */
export async function checkEarningMilestones(
  userId: string,
  prevTotal: number,
  newTotal: number,
  name: string,
  avatarUrl?: string,
  affiliateCode?: string,
): Promise<void> {
  for (const level of MILESTONES) {
    if (prevTotal < level && newTotal >= level) {
      try {
        await EarningMilestone.create({
          user:           userId,
          milestone:      level,
          achievedAt:     new Date(),
          totalEarningsAtAchievement: newTotal,
          name,
          avatarUrl:      avatarUrl || '',
          affiliateCode:  affiliateCode || '',
        });
      } catch (e: any) {
        // Duplicate key = already recorded; ignore silently
        if (e.code !== 11000) console.error('[Milestone Error]', e.message);
      }
    }
  }
}
