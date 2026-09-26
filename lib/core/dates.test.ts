import { describe, expect, it } from "vitest";
import {
  addFrequency,
  convertFrequency,
  daysBetween,
  isValidCalendarDate,
  toCalendarDate,
  toLocalDate,
} from "./dates";

describe("isValidCalendarDate", () => {
  it("accepts real dates, including a leap day", () => {
    expect(isValidCalendarDate("2026-06-01")).toBe(true);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
  });

  it("rejects dates that have the right shape but do not exist", () => {
    expect(isValidCalendarDate("2026-02-30")).toBe(false);
    expect(isValidCalendarDate("2026-02-29")).toBe(false); // 2026 is not a leap year
    expect(isValidCalendarDate("2026-13-01")).toBe(false);
    expect(isValidCalendarDate("2026-00-10")).toBe(false);
  });

  it("rejects the wrong shape", () => {
    expect(isValidCalendarDate("2026-3-1")).toBe(false);
    expect(isValidCalendarDate("2026-03-01T00:00:00Z")).toBe(false);
    expect(isValidCalendarDate("")).toBe(false);
  });
});

describe("toLocalDate / toCalendarDate", () => {
  it("parses as local midnight, not UTC (the 1st stays the 1st)", () => {
    const date = toLocalDate("2026-03-01");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 1]);
  });

  it("round-trips", () => {
    expect(toCalendarDate(toLocalDate("2026-12-31"))).toBe("2026-12-31");
  });

  it("throws on an invalid date", () => {
    expect(() => toLocalDate("2026-02-30")).toThrow();
  });
});

describe("addFrequency", () => {
  it("adds days and weeks across a month boundary", () => {
    expect(addFrequency("2026-01-25", { count: 10, unit: "day" })).toBe("2026-02-04");
    expect(addFrequency("2026-01-25", { count: 2, unit: "week" })).toBe("2026-02-08");
  });

  it("adds calendar months, not 30-day blocks", () => {
    expect(addFrequency("2026-01-15", { count: 2, unit: "month" })).toBe("2026-03-15");
  });

  it("clamps to the end of a shorter month", () => {
    expect(addFrequency("2026-01-31", { count: 1, unit: "month" })).toBe("2026-02-28");
    expect(addFrequency("2024-01-31", { count: 1, unit: "month" })).toBe("2024-02-29");
  });

  it("moves a leap day to Feb 28 the following year", () => {
    expect(addFrequency("2024-02-29", { count: 1, unit: "year" })).toBe("2025-02-28");
  });
});

describe("daysBetween", () => {
  it("counts forward, backward and zero", () => {
    expect(daysBetween("2026-01-01", "2026-03-01")).toBe(59);
    expect(daysBetween("2026-03-01", "2026-01-01")).toBe(-59);
    expect(daysBetween("2026-06-01", "2026-06-01")).toBe(0);
  });

  it("is not thrown off by a daylight-saving change", () => {
    // US clocks move forward on 2026-03-08, making that day 23 hours long.
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });
});

describe("convertFrequency", () => {
  const converted = (count: number, unit: "day" | "week" | "month" | "year") => ({ ok: true, frequency: { count, unit } });

  it("converts weeks to days exactly", () => {
    expect(convertFrequency({ count: 2, unit: "week" }, "day")).toEqual(converted(14, "day"));
  });

  it("rounds months and years to the nearest whole day", () => {
    expect(convertFrequency({ count: 2, unit: "month" }, "day")).toEqual(converted(61, "day"));
    expect(convertFrequency({ count: 1, unit: "year" }, "day")).toEqual(converted(365, "day"));
    expect(convertFrequency({ count: 2, unit: "year" }, "day")).toEqual(converted(730, "day"));
  });

  it("converts years and months exactly", () => {
    expect(convertFrequency({ count: 1, unit: "year" }, "month")).toEqual(converted(12, "month"));
    expect(convertFrequency({ count: 18, unit: "month" }, "year")).toEqual(converted(2, "year"));
  });

  it("rounds to the nearest when going to a bigger unit", () => {
    expect(convertFrequency({ count: 10, unit: "day" }, "week")).toEqual(converted(1, "week"));
    expect(convertFrequency({ count: 2, unit: "month" }, "week")).toEqual(converted(9, "week"));
  });

  it("refuses instead of clamping when no valid count is close", () => {
    // Clamping would save a different interval: 999 days is 3 months short of 3 years.
    expect(convertFrequency({ count: 3, unit: "year" }, "day")).toEqual({ ok: false, reason: "over-maximum" });
    expect(convertFrequency({ count: 1, unit: "day" }, "year")).toEqual({ ok: false, reason: "less-than-one" });
  });

  it("still converts right up to the limit", () => {
    expect(convertFrequency({ count: 2, unit: "year" }, "day")).toEqual(converted(730, "day"));
    expect(convertFrequency({ count: 4, unit: "day" }, "week")).toEqual(converted(1, "week"));
  });
});
