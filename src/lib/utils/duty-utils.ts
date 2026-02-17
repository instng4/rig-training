import type { DutyPattern } from '@/lib/types/database';

const CYCLE_LENGTH = 28; // 14 on + 14 off

/**
 * Calculate the day offset from the duty pattern start date
 */
function daysSinceStart(startDate: string, targetDate: Date): number {
  const start = new Date(startDate + 'T00:00:00');
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffMs = target.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a specific date falls in the on-duty period
 */
export function isOnDuty(dutyPattern: DutyPattern, date: Date): boolean {
  const days = daysSinceStart(dutyPattern.start_date, date);
  if (days < 0) {
    // Before the pattern started - extrapolate backwards
    const mod = ((days % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
    return mod < 14;
  }
  const posInCycle = days % CYCLE_LENGTH;
  return posInCycle < 14;
}

/**
 * Get all on/off duty ranges within a date window
 */
export function getDutyRanges(
  dutyPattern: DutyPattern,
  from: Date,
  to: Date
): { start: Date; end: Date; type: 'on' | 'off' }[] {
  const ranges: { start: Date; end: Date; type: 'on' | 'off' }[] = [];
  const patternStart = new Date(dutyPattern.start_date + 'T00:00:00');

  // Find the first cycle boundary at or before `from`
  const daysFromStart = daysSinceStart(dutyPattern.start_date, from);
  const cycleOffset = ((daysFromStart % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;
  
  // Walk back to the start of the current block
  let cursor = new Date(from);
  cursor.setDate(cursor.getDate() - cycleOffset);

  while (cursor <= to) {
    // On-duty block: days 0-13 of cycle
    const onStart = new Date(cursor);
    const onEnd = new Date(cursor);
    onEnd.setDate(onEnd.getDate() + 13);

    // Off-duty block: days 14-27 of cycle
    const offStart = new Date(cursor);
    offStart.setDate(offStart.getDate() + 14);
    const offEnd = new Date(cursor);
    offEnd.setDate(offEnd.getDate() + 27);

    // Clip to requested window
    const clippedOnStart = onStart < from ? from : onStart;
    const clippedOnEnd = onEnd > to ? to : onEnd;
    if (clippedOnStart <= clippedOnEnd) {
      ranges.push({ start: new Date(clippedOnStart), end: new Date(clippedOnEnd), type: 'on' });
    }

    const clippedOffStart = offStart < from ? from : offStart;
    const clippedOffEnd = offEnd > to ? to : offEnd;
    if (clippedOffStart <= clippedOffEnd) {
      ranges.push({ start: new Date(clippedOffStart), end: new Date(clippedOffEnd), type: 'off' });
    }

    // Move to next cycle
    cursor.setDate(cursor.getDate() + CYCLE_LENGTH);
  }

  return ranges;
}

/**
 * Categorize a date range as on-duty, off-duty, or mixed
 */
export function categorizeDateRange(
  dutyPattern: DutyPattern,
  rangeStart: Date,
  rangeEnd: Date
): 'off' | 'on' | 'mixed' {
  let hasOn = false;
  let hasOff = false;
  
  const current = new Date(rangeStart);
  while (current <= rangeEnd) {
    if (isOnDuty(dutyPattern, current)) {
      hasOn = true;
    } else {
      hasOff = true;
    }
    if (hasOn && hasOff) return 'mixed';
    current.setDate(current.getDate() + 1);
  }
  
  return hasOff ? 'off' : 'on';
}

/**
 * Generate preview of upcoming duty cycles from a start date
 */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateDutyPreview(
  startDate: string,
  cycleCount: number = 4
): { start: string; end: string; type: 'on' | 'off' }[] {
  const preview: { start: string; end: string; type: 'on' | 'off' }[] = [];
  const start = new Date(startDate + 'T00:00:00');

  for (let i = 0; i < cycleCount; i++) {
    const cycleStart = new Date(start);
    cycleStart.setDate(cycleStart.getDate() + i * CYCLE_LENGTH);

    // On-duty block
    const onEnd = new Date(cycleStart);
    onEnd.setDate(onEnd.getDate() + 13);
    preview.push({
      start: formatLocalDate(cycleStart),
      end: formatLocalDate(onEnd),
      type: 'on',
    });

    // Off-duty block
    const offStart = new Date(cycleStart);
    offStart.setDate(offStart.getDate() + 14);
    const offEnd = new Date(cycleStart);
    offEnd.setDate(offEnd.getDate() + 27);
    preview.push({
      start: formatLocalDate(offStart),
      end: formatLocalDate(offEnd),
      type: 'off',
    });
  }

  return preview;
}
