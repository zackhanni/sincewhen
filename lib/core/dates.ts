import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays } from "date-fns";
import { MAX_FREQUENCY_COUNT } from "./constants";
import type { Frequency, FrequencyUnit } from "./types";

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
 * (Jan 31 + 1 month = Feb 28), which is date-fns' behavior.
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

/**
 * Average days in each unit, for converting a frequency between units. A year is the average
 * Gregorian year and a month is a twelfth of it, so years and months convert exactly (1 year =
 * 12 months) and a year comes out at 365 days after rounding.
 */
const AVERAGE_DAYS: Record<FrequencyUnit, number> = {
  day: 1,
  week: 7,
  month: 365.2425 / 12,
  year: 365.2425,
};

export type FrequencyConversion =
  | { ok: true; frequency: Frequency }
  /** No whole number of the new unit, from 1 to MAX_FREQUENCY_COUNT, comes close. */
  | { ok: false; reason: "less-than-one" | "over-maximum" };

/**
 * The same length of time in another unit, rounded to a whole number: 2 weeks → 14 days,
 * 2 months → 61 days, 10 days → 1 week. A convenience for editing, not date arithmetic: due
 * dates still come from `addFrequency`, where "2 months" is never a day count.
 *
 * Refuses rather than clamps when the answer is not a valid count: 3 years is about 1,096
 * days, and quietly offering 999 days (or 1 year for "every day") would save a different
 * interval that looks like the same one. The caller asks the user for the number instead.
 */
export function convertFrequency(frequency: Frequency, unit: FrequencyUnit): FrequencyConversion {
  const days = frequency.count * AVERAGE_DAYS[frequency.unit];
  const count = Math.round(days / AVERAGE_DAYS[unit]);
  if (count < 1) return { ok: false, reason: "less-than-one" };
  if (count > MAX_FREQUENCY_COUNT) return { ok: false, reason: "over-maximum" };
  return { ok: true, frequency: { count, unit } };
}
