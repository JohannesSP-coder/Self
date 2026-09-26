/** Returns today's date as YYYY-MM-DD in UTC, the canonical key used for HabitLog rows. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Computes the current consecutive-day streak ending today (or yesterday, so a day not yet logged doesn't zero it). */
export function computeStreak(completedDates: string[]): number {
  const dates = new Set(completedDates);
  const cursor = new Date();
  let streak = 0;

  // Allow the streak to still count if today isn't logged yet but yesterday was.
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
