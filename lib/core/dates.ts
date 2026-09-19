import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays } from "date-fns";
import type { Frequency } from "./types";

/**
 * A calendar date in the user's local time, written "YYYY-MM-DD".
 *
 * Dates are stored this way (not as timestamps) because "the day I changed the filter" is a
 * calendar day, not a moment. Because the format is zero-padded and biggest-unit-first, two
 * CalendarDates can be compared with plain `<` and `>`.
 */
export type CalendarDate = string;

const DATE_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Turns "YYYY-MM-DD" into a Date at local midnight, or null if it is not a real date.
 *
 * Never use `new Date("2026-03-01")` for this: a bare date string parses as UTC midnight, which
 * is the evening of Feb 28 in US timezones.
 */
function parseLocalDate(value: string): Date | null {
  const match = DATE_SHAPE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // The regex only checks the shape. "2026-02-30" passes it, and Date silently rolls it over to
  // March 2 — so read the parts back and make sure nothing moved.
  const unchanged =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return unchanged ? date : null;
}

export function isValidCalendarDate(value: string): boolean {
  return parseLocalDate(value) !== null;
}

export function toLocalDate(value: CalendarDate): Date {
  const date = parseLocalDate(value);
  if (!date) throw new Error(`Not a valid calendar date: "${value}"`);
  return date;
}

export function toCalendarDate(date: Date): CalendarDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today in the device's timezone. `now` is a parameter so tests can pin the clock. */
export function todayCalendarDate(now: Date = new Date()): CalendarDate {
  return toCalendarDate(now);
}

/**
 * The date one frequency after `from`.
 *
 * Months and years use calendar arithmetic, not day counts: 2 months after Jan 15 is Mar 15,
 * whatever the month lengths. When the target month is too short the day clamps to its last day
 * (Jan 31 + 1 month = Feb 28), which is date-fns' behaviour.
 */
export function addFrequency(from: CalendarDate, frequency: Frequency): CalendarDate {
  const date = toLocalDate(from);
  switch (frequency.unit) {
    case "day":
      return toCalendarDate(addDays(date, frequency.count));
    case "week":
      return toCalendarDate(addWeeks(date, frequency.count));
    case "month":
      return toCalendarDate(addMonths(date, frequency.count));
    case "year":
      return toCalendarDate(addYears(date, frequency.count));
  }
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. Unaffected by DST. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return differenceInCalendarDays(toLocalDate(to), toLocalDate(from));
}
