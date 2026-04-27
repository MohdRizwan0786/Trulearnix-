import User from '../models/User';
import PackagePurchase from '../models/PackagePurchase';
import Commission from '../models/Commission';
import EmiInstallment from '../models/EmiInstallment';
import Lead from '../models/Lead';
import SalesOrder from '../models/SalesOrder';
import { sendPurchaseWelcomeEmail } from './emailService';
import { sendPurchaseWelcomeTemplate } from './whatsappMetaService';

// ── Activate order: create purchase, commissions, notify customer ─────────────
export async function activateOrder(order: any, paymentMethod = 'manual', merchantOrderId?: string) {
  const pkg = order.package;
  const rates: Record<string, number> = { free: 0, starter: 10, pro: 15, elite: 22, supreme: 30 };
  const packageExpiresAt = new Date();
  packageExpiresAt.setFullYear(packageExpiresAt.getFullYear() + 1);

  const isEmi = order.paymentType === 'emi';
  const emiDays: number[] = (order.emiDays && order.emiDays.length)
    ? order.emiDays
    : (pkg.emiDays && pkg.emiDays.length ? pkg.emiDays : [0, 15, 30, 45]);
  const emiTotal = emiDays.length;

  if (order.userId) {
    await User.findByIdAndUpdate(order.userId, {
      packageTier: pkg.tier || 'starter', isAffiliate: true,
      commissionRate: rates[pkg.tier] || 10,
      packagePurchasedAt: new Date(), packageExpiresAt,
      packageSuspended: false,
    });
  }

  if (!order.userId) throw new Error('Customer user account not found for this order');

  const purchase = await PackagePurchase.create({
    user: order.userId, package: pkg._id || pkg,
    packageTier: pkg.tier || 'starter',
    amount: order.totalAmount, gstAmount: 0, totalAmount: order.totalAmount,
    paymentMethod, razorpayOrderId: merchantOrderId,
    status: isEmi ? 'created' : 'paid',
    affiliateCode: order.promoCode, referredBy: order.salesperson,
    isEmi, emiMonth: isEmi ? 1 : undefined, emiTotal: isEmi ? emiTotal : undefined,
  });

  if (isEmi && order.userId) {
    const tokenPaid = order.tokenAmount && order.tokenAmount > 0 ? order.tokenAmount : 0;
    const emiBase = order.totalAmount - tokenPaid;
    const instAmt = Math.ceil(emiBase / emiTotal);
    const perInstComm = order.commissionAmount > 0 ? Math.floor(order.commissionAmount / emiTotal) : 0;
    const webUrl = process.env.WEB_URL || 'https://trulearnix.com';
    const purchaseDate = new Date();

    let managerUserId: any = null;
    let perInstMgrComm = 0;
    if (order.salesperson) {
      const salesUser = await User.findById(order.salesperson).select('managerId');
      if ((salesUser as any)?.managerId) {
        managerUserId = (salesUser as any).managerId;
        const mc = pkg.managerCommission;
        if (mc && mc.value > 0) {
          const rate = mc.type === 'flat' ? mc.value / emiTotal : Math.floor(instAmt * mc.value / 100);
          perInstMgrComm = Math.floor(rate);
        }
      }
    }

    for (let i = 0; i < emiTotal; i++) {
      const dueDate = new Date(purchaseDate);
      dueDate.setDate(dueDate.getDate() + emiDays[i]);
      const instNum = i + 1;
      const inst = await EmiInstallment.create({
        user: order.userId, packagePurchase: purchase._id,
        installmentNumber: instNum, totalInstallments: emiTotal,
        amount: instAmt, dueDate,
        status: instNum === 1 ? 'paid' : 'pending',
        paidAt: instNum === 1 ? new Date() : undefined,
        partnerUser: order.salesperson,
        partnerCommissionAmount: perInstComm,
        partnerCommissionPaid: false,
        managerUser: managerUserId,
        managerCommissionAmount: perInstMgrComm,
        managerCommissionPaid: false,
      });
      if (instNum > 1) await EmiInstallment.findByIdAndUpdate(inst._id, { paymentLink: `${webUrl}/pay/emi/${inst._id}` });
    }
    if (perInstComm > 0 && order.salesperson) {
      await User.findByIdAndUpdate(order.salesperson, { $inc: { wallet: perInstComm, totalEarnings: perInstComm } });
      await EmiInstallment.findOneAndUpdate(
        { packagePurchase: purchase._id, installmentNumber: 1 },
        { partnerCommissionPaid: true }
      );
    }
    if (perInstMgrComm > 0 && managerUserId) {
      await User.findByIdAndUpdate(managerUserId, { $inc: { wallet: perInstMgrComm, totalEarnings: perInstMgrComm } });
      await EmiInstallment.findOneAndUpdate(
        { packagePurchase: purchase._id, installmentNumber: 1 },
        { managerCommissionPaid: true }
      );
    }
  } else {
    if (order.commissionAmount > 0 && !order.commissionPaid && order.salesperson) {
      const salesUser = await User.findById(order.salesperson);
      if (salesUser) {
        await Commission.create({
          earner: order.salesperson, earnerTier: salesUser.packageTier || 'free',
          earnerCommissionRate: order.commissionAmount, buyer: order.userId,
          buyerPackageTier: pkg.tier || 'starter', level: 1,
          levelRate: order.commissionAmount, saleAmount: order.totalAmount,
          commissionAmount: order.commissionAmount,
          packagePurchaseId: purchase._id, saleType: 'package', status: 'approved',
        });
        await User.findByIdAndUpdate(order.salesperson, {
          $inc: { wallet: order.commissionAmount, totalEarnings: order.commissionAmount },
        });
        order.commissionPaid = true;
      }
    }
  }

  await Lead.findOneAndUpdate(
    { salesOrderId: order._id },
    { stage: 'paid', convertedAt: new Date(), convertedUserId: order.userId }
  );

  if (order.userId) {
    const cust = await User.findById(order.userId).select('name email phone');
    if (cust) {
      const pkgName = pkg.name || pkg.tier || 'Package';
      const loginEmail = (cust as any).email?.endsWith('@sales.trulearnix.com') ? `Phone: ${(cust as any).phone}` : (cust as any).email;
      const tempPass = order.customerTempPassword || '';
      try { await sendPurchaseWelcomeEmail((cust as any).email, (cust as any).name, pkgName, loginEmail, tempPass); } catch {}
      if (tempPass) await SalesOrder.findByIdAndUpdate(order._id, { $unset: { customerTempPassword: 1 } });
      try {
        if ((cust as any).phone) {
          await sendPurchaseWelcomeTemplate(
            (cust as any).phone,
            (cust as any).name,
            pkgName,
            loginEmail,
            tempPass || '(your registration password)',
            `${process.env.WEB_URL || 'https://trulearnix.com'}/login`,
          );
        }
      } catch {}
    }
  }
  return purchase;
}
