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
  it("converts weeks to days exactly", () => {
    expect(convertFrequency({ count: 2, unit: "week" }, "day")).toEqual({ count: 14, unit: "day" });
  });

  it("rounds months and years to the nearest whole day", () => {
    expect(convertFrequency({ count: 2, unit: "month" }, "day")).toEqual({ count: 61, unit: "day" });
    expect(convertFrequency({ count: 1, unit: "year" }, "day")).toEqual({ count: 365, unit: "day" });
    expect(convertFrequency({ count: 2, unit: "year" }, "day")).toEqual({ count: 730, unit: "day" });
  });

  it("converts years and months exactly", () => {
    expect(convertFrequency({ count: 1, unit: "year" }, "month")).toEqual({ count: 12, unit: "month" });
    expect(convertFrequency({ count: 18, unit: "month" }, "year")).toEqual({ count: 2, unit: "year" });
  });

  it("rounds to the nearest when going to a bigger unit", () => {
    expect(convertFrequency({ count: 10, unit: "day" }, "week")).toEqual({ count: 1, unit: "week" });
    expect(convertFrequency({ count: 2, unit: "month" }, "week")).toEqual({ count: 9, unit: "week" });
  });

  it("never goes below 1 or above the maximum", () => {
    expect(convertFrequency({ count: 1, unit: "day" }, "year")).toEqual({ count: 1, unit: "year" });
    expect(convertFrequency({ count: 999, unit: "year" }, "day")).toEqual({ count: 999, unit: "day" });
  });
});
