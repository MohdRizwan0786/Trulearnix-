import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Package from '../models/Package';
import User from '../models/User';
import { getOrCreateActiveBatch, onStudentEnrolled } from './batchService';

// Max non-compulsory, incomplete enrollments a learner can hold at once
export const SELF_ENROLL_CAP = 2;

const isCompletedEnrollment = (e: any) =>
  !!e.completedAt || (typeof e.progressPercent === 'number' && e.progressPercent >= 100);

const isPaidTier = async (tier?: string | null) => {
  if (!tier || tier === 'free') return false;
  const paid = await Package.distinct('tier', { isActive: true, tier: { $ne: 'free' } });
  return paid.includes(tier);
};

/**
 * Enroll the user into every published compulsory course they don't yet have.
 * Safe to call repeatedly (idempotent per course). Returns the count of newly created enrollments.
 */
export const ensureCompulsoryEnrollments = async (userId: string): Promise<number> => {
  try {
    const compulsory = await Course.find({ isCompulsory: true, status: 'published' }).select('_id batchSettings');
    if (compulsory.length === 0) return 0;

    const courseIds = compulsory.map(c => c._id);
    const existing = await Enrollment.find({ student: userId, course: { $in: courseIds } }).select('course');
    const existingIds = new Set(existing.map(e => e.course.toString()));

    let created = 0;
    for (const course of compulsory) {
      if (existingIds.has(course._id.toString())) continue;
      try {
        const activeBatch = (course as any).batchSettings?.enabled
          ? await getOrCreateActiveBatch(course._id.toString())
          : null;
        await Enrollment.create({
          student: userId,
          course: course._id,
          amount: 0,
          source: 'compulsory',
          paymentId: 'compulsory',
          ...(activeBatch ? { batch: activeBatch._id } : {}),
        });
        if (activeBatch) await onStudentEnrolled(activeBatch._id.toString());
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
        created++;
      } catch (err: any) {
        // Race with unique index — already enrolled. Ignore.
        if (err?.code !== 11000) {
          console.error('[ensureCompulsory] enroll failed', course._id, err.message);
        }
      }
    }
    return created;
  } catch (e: any) {
    console.error('[ensureCompulsory]', e.message);
    return 0;
  }
};

/**
 * Backfill — enroll every paid (non-free) active learner into a compulsory course.
 * Used when an admin marks a course compulsory.
 */
export const backfillCompulsoryEnrollments = async (courseId: string): Promise<number> => {
  const course = await Course.findById(courseId).select('isCompulsory status batchSettings');
  if (!course || !course.isCompulsory || course.status !== 'published') return 0;

  const paidTiers = await Package.distinct('tier', { isActive: true, tier: { $ne: 'free' } });
  const learners = await User.find({
    role: 'student',
    isActive: true,
    $or: [
      { packageTier: { $in: paidTiers } },
      { isAffiliate: true },
    ],
  }).select('_id');

  let created = 0;
  for (const u of learners) {
    const exists = await Enrollment.findOne({ student: u._id, course: course._id }).select('_id');
    if (exists) continue;
    try {
      const activeBatch = (course as any).batchSettings?.enabled
        ? await getOrCreateActiveBatch(course._id.toString())
        : null;
      await Enrollment.create({
        student: u._id,
        course: course._id,
        amount: 0,
        source: 'compulsory',
        paymentId: 'compulsory',
        ...(activeBatch ? { batch: activeBatch._id } : {}),
      });
      if (activeBatch) await onStudentEnrolled(activeBatch._id.toString());
      created++;
    } catch (err: any) {
      if (err?.code !== 11000) {
        console.error('[backfillCompulsory]', u._id, err.message);
      }
    }
  }
  if (created > 0) {
    await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: created } });
  }
  return created;
};

export interface SelfEnrollStatus {
  cap: number;
  activeCount: number;
  remainingSlots: number;
  canEnroll: boolean;
  activeCourseIds: string[];
}

/**
 * Returns the learner's self-enroll status: how many non-compulsory incomplete courses
 * they currently hold and whether they can pick another.
 */
export const getSelfEnrollStatus = async (userId: string): Promise<SelfEnrollStatus> => {
  const enrollments = await Enrollment.find({ student: userId })
    .populate('course', 'isCompulsory')
    .select('course completedAt progressPercent source')
    .lean();

  const active = enrollments.filter((e: any) => {
    if (isCompletedEnrollment(e)) return false;
    // Compulsory and admin-overrides don't count toward the cap
    if (e.source === 'compulsory' || e.source === 'admin' || e.source === 'paid') return false;
    if (e.course?.isCompulsory) return false;
    return true;
  });

  return {
    cap: SELF_ENROLL_CAP,
    activeCount: active.length,
    remainingSlots: Math.max(0, SELF_ENROLL_CAP - active.length),
    canEnroll: active.length < SELF_ENROLL_CAP,
    activeCourseIds: active.map((e: any) => e.course?._id?.toString() || e.course?.toString()),
  };
};
