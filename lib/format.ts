import type { Frequency, TaskTiming } from "@/lib/core";

// Turns core's numbers into the short phrases shown on a task row.

/** "1 day", "3 days". Only for words that take a plain "s". */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** "Every day", "Every 2 months". */
export function formatFrequency(frequency: Frequency): string {
  return frequency.count === 1 ? `Every ${frequency.unit}` : `Every ${plural(frequency.count, frequency.unit)}`;
}

/**
 * A rough, readable length of time: days up to two weeks, then weeks, months, years.
 * It rounds down, so "3 weeks" means at least three full weeks.
 */
function formatDayCount(days: number): string {
  if (days < 14) return plural(days, "day");
  if (days < 60) return plural(Math.floor(days / 7), "week");
  if (days < 730) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

/** "Due today", "Overdue 12 days", "Due tomorrow", "Due in 3 weeks". */
export function formatDue(timing: TaskTiming): string {
  const { daysUntilDue } = timing;
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue === 1) return "Due tomorrow";
  if (daysUntilDue < 0) return `Overdue ${formatDayCount(-daysUntilDue)}`;
  return `Due in ${formatDayCount(daysUntilDue)}`;
}
