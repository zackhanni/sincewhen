import { describe, expect, it } from "vitest";
import type { TaskTiming } from "@/lib/core";
import { formatDue, formatFrequency } from "./format";

const timing = (daysUntilDue: number) => ({ daysUntilDue }) as TaskTiming;

describe("formatFrequency", () => {
  it("handles singular and plural", () => {
    expect(formatFrequency({ count: 1, unit: "week" })).toBe("Every week");
    expect(formatFrequency({ count: 2, unit: "month" })).toBe("Every 2 months");
  });
});

describe("formatDue", () => {
  it.each([
    [0, "Due today"],
    [1, "Due tomorrow"],
    [2, "Due in 2 days"],
    [13, "Due in 13 days"],
    [14, "Due in 2 weeks"],
    [59, "Due in 8 weeks"],
    [60, "Due in 2 months"],
    [800, "Due in 2 years"],
    [-1, "Overdue 1 day"],
    [-12, "Overdue 12 days"],
    [-30, "Overdue 4 weeks"],
  ])("%i days -> %s", (days, text) => {
    expect(formatDue(timing(days))).toBe(text);
  });
});
