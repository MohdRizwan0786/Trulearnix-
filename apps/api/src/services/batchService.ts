import Batch, { IBatch } from '../models/Batch';
import Course from '../models/Course';

/**
 * Returns the current active batch for a course.
 * If no active batch exists (none, or all closed/full), creates a new one.
 * Also auto-closes expired batches by date.
 */
export async function getOrCreateActiveBatch(courseId: string): Promise<IBatch | null> {
  const course = await Course.findById(courseId).select('batchSettings');
  if (!course) return null;

  // Auto-close expired active batches
  await Batch.updateMany(
    { course: courseId, status: 'active', closingDate: { $lt: new Date() } },
    { $set: { status: 'closed' } }
  );

  // Find current active batch
  const activeBatch = await Batch.findOne({ course: courseId, status: 'active' });
  if (activeBatch) return activeBatch;

  // If there's already a pending batch, return it
  const pendingBatch = await Batch.findOne({ course: courseId, status: 'pending' });
  if (pendingBatch) return pendingBatch;

  return createPendingBatch(courseId);
}

/**
 * Creates a new pending batch for the course. Admin must manually start it.
 */
export async function createPendingBatch(courseId: string): Promise<IBatch> {
  const course = await Course.findById(courseId).select('batchSettings');
  const { minStrength = 5, maxStrength = 50, closingDays = 30, durationDays = 0 } = course?.batchSettings || {};

  const lastBatch = await Batch.findOne({ course: courseId }).sort('-batchNumber');
  const batchNumber = (lastBatch?.batchNumber || 0) + 1;

  return Batch.create({
    course: courseId,
    batchNumber,
    label: `Batch ${batchNumber}`,
    minStrength,
    maxStrength,
    closingDays,
    totalDays: durationDays,
    status: 'pending',
    enrolledCount: 0,
    daysCompleted: 0,
  });
}

/**
 * After a student is enrolled, increment batch count and mark full if needed.
 */
export async function onStudentEnrolled(batchId: string): Promise<void> {
  const batch = await Batch.findById(batchId);
  if (!batch) return;
  batch.enrolledCount += 1;
  if (batch.enrolledCount >= batch.maxStrength) {
    batch.status = 'full';
  }
  await batch.save();
}
