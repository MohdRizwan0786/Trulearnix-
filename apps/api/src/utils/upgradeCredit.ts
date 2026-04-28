import PackagePurchase from '../models/PackagePurchase';

export const UPGRADE_WINDOW_DAYS = 10;
const UPGRADE_WINDOW_MS = UPGRADE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface UpgradeInfo {
  eligible: boolean;
  reason?: 'no_prev_purchase' | 'window_expired' | 'no_prev_value' | 'not_an_upgrade' | 'same_or_lower_package';
  upgradeCredit: number;
  prevPurchaseId?: any;
  prevPackageId?: any;
  prevPurchaseDate?: Date;
  daysRemaining?: number;
  windowDays: number;
}

// Looks up the user's most recent paid PackagePurchase. If it's within the
// 10-day window and its notional value is below the new package total, return
// that value as a credit so the upgrade only charges the difference.
export async function getUpgradeCredit(userId: any, newPkgFullTotal: number, newPackageId?: any): Promise<UpgradeInfo> {
  const base: UpgradeInfo = { eligible: false, upgradeCredit: 0, windowDays: UPGRADE_WINDOW_DAYS };
  if (!userId || !newPkgFullTotal) return base;

  const prev = await PackagePurchase.findOne({ user: userId, status: 'paid' }).sort({ createdAt: -1 });
  if (!prev) return { ...base, reason: 'no_prev_purchase' };

  // If they already paid for the same package, no upgrade
  if (newPackageId && prev.package?.toString() === newPackageId.toString()) {
    return { ...base, prevPurchaseId: prev._id, reason: 'same_or_lower_package' };
  }

  const prevDate: Date = (prev as any).updatedAt || prev.createdAt;
  const ageMs = Date.now() - new Date(prevDate).getTime();
  if (ageMs > UPGRADE_WINDOW_MS) return { ...base, reason: 'window_expired' };

  // For chained upgrades, fullPackagePrice carries the notional total of the prior tier.
  const prevNotional = (prev as any).fullPackagePrice || prev.totalAmount || 0;
  if (prevNotional <= 0) return { ...base, reason: 'no_prev_value' };

  if (newPkgFullTotal <= prevNotional) {
    return { ...base, prevPurchaseId: prev._id, reason: 'not_an_upgrade' };
  }

  const daysRemaining = Math.max(0, Math.ceil((UPGRADE_WINDOW_MS - ageMs) / DAY_MS));

  return {
    eligible: true,
    upgradeCredit: prevNotional,
    prevPurchaseId: prev._id,
    prevPackageId: prev.package,
    prevPurchaseDate: prevDate,
    daysRemaining,
    windowDays: UPGRADE_WINDOW_DAYS,
  };
}
