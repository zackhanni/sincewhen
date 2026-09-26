import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { toCalendarDate, toLocalDate } from "./dates";
import { buildExampleData } from "./examples";
import { getTaskTiming } from "./status";
import { summarizeNode } from "./summary";
import { buildTreeIndex } from "./tree";
import { parseAppData } from "./validate";

function counterIds() {
  let next = 0;
  return () => `example-${next++}`;
}

/** Every day from `start`, for `days` days, as calendar dates. */
function everyDay(start: string, days: number): string[] {
  return Array.from({ length: days }, (_, offset) => toCalendarDate(addDays(toLocalDate(start), offset)));
}

describe("buildExampleData", () => {
  it("is valid app data that would load and import", () => {
    const data = buildExampleData("2026-09-26", counterIds());
    expect(parseAppData(data)).toEqual({ ok: true, data });
  });

  it("dates everything relative to the day it is added", () => {
    const data = buildExampleData("2026-09-26", counterIds());
    const bathroom = data.nodes.find((node) => node.name === "Clean the bathroom");
    const sheets = data.nodes.find((node) => node.name === "Wash the sheets");
    expect(bathroom?.lastCompleted).toBe("2026-09-26");
    expect(sheets?.lastCompleted).toBe("2026-09-14");
    expect(data.nodes.every((node) => node.createdAt === "2026-09-26")).toBe(true);
  });

  // The arrangement has to hold on every day, not only the day the test was written: month
  // lengths change how far "35 days ago" is from a monthly due date.
  it("always shows every colour, whatever day it is added (two years checked, one a leap year)", () => {
    for (const today of everyDay("2027-01-01", 365 * 2 + 1)) {
      const data = buildExampleData(today, counterIds());
      const statuses = new Set(data.nodes.map((node) => getTaskTiming(node, today)?.status).filter(Boolean));
      expect([today, [...statuses].sort()]).toEqual([today, ["due", "ok", "severe", "soon"]]);
      expect(data.nodes.some((node) => node.frequency && node.lastCompleted === today)).toBe(true);
    }
  });

  it("gives the top-level items different colours: Home red, Car green, Personal yellow", () => {
    const today = "2026-09-26";
    const data = buildExampleData(today, counterIds());
    const index = buildTreeIndex(data.nodes);
    const level = (name: string) => {
      const node = data.nodes.find((candidate) => candidate.name === name && candidate.parentId === null);
      return summarizeNode(index, node!.id, today).level;
    };
    expect([level("Home"), level("Car"), level("Personal")]).toEqual(["red", "green", "yellow"]);
  });
});
