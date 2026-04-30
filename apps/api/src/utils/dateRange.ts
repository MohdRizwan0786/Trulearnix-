// IST = UTC+5:30. The server clock is UTC, so we anchor day boundaries
// to IST explicitly for any user-facing "today / N days / custom" filter.
const IST_OFFSET_MIN = 5 * 60 + 30;
const IST_OFFSET_MS = IST_OFFSET_MIN * 60 * 1000;

function istStartOfDay(d: Date): Date {
  // Shift into IST, zero the time on that shifted clock, shift back to UTC.
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

function istEndOfDay(d: Date): Date {
  return new Date(istStartOfDay(d).getTime() + 24 * 60 * 60 * 1000 - 1);
}

export type PeriodKey = 'today' | '7' | '30' | 'all' | 'custom' | string | undefined;

export interface PeriodRange {
  start: Date | null;
  end: Date | null;
}

// Resolve a period keyword (and optional custom from/to as ISO date strings) into
// a UTC date range whose boundaries land on IST midnights.
// `all` (or unknown / missing values) returns { start: null, end: null }.
export function resolvePeriod(period: PeriodKey, from?: string, to?: string): PeriodRange {
  const now = new Date();
  if (period === 'today') {
    return { start: istStartOfDay(now), end: null };
  }
  if (period === '7') {
    const istToday = istStartOfDay(now);
    return { start: new Date(istToday.getTime() - 7 * 24 * 60 * 60 * 1000), end: null };
  }
  if (period === '30') {
    const istToday = istStartOfDay(now);
    return { start: new Date(istToday.getTime() - 30 * 24 * 60 * 60 * 1000), end: null };
  }
  if (period === 'custom' && from && to) {
    return {
      start: istStartOfDay(new Date(from)),
      end: istEndOfDay(new Date(to)),
    };
  }
  // 'all', missing, or unknown: no date constraint
  return { start: null, end: null };
}

// Build a Mongo `createdAt` match clause from a resolved period.
// Returns `{}` for all-time so the caller can spread without conditionals.
export function periodMatch(range: PeriodRange): Record<string, any> {
  if (!range.start && !range.end) return {};
  const createdAt: any = {};
  if (range.start) createdAt.$gte = range.start;
  if (range.end) createdAt.$lte = range.end;
  return { createdAt };
}
