import { describe, expect, it } from "vitest";
import { getTaskTiming } from "./status";
import { makeNode } from "./test-helpers";

// The air filter: every 2 months, last changed Jan 1 -> due Mar 1, a 59-day cycle.
const airFilter = makeNode("filter", null, {
  frequency: { count: 2, unit: "month" },
  lastCompleted: "2026-01-01",
});
const statusOn = (today: string) => getTaskTiming(airFilter, today)!.status;

describe("getTaskTiming", () => {
  it("returns null for a folder", () => {
    expect(getTaskTiming(makeNode("room", null), "2026-06-01")).toBeNull();
  });

  it("measures the cycle in real days from the last completion", () => {
    expect(getTaskTiming(airFilter, "2026-02-01")).toMatchObject({
      dueDate: "2026-03-01",
      intervalDays: 59,
      daysUntilDue: 28,
      status: "ok",
    });
  });

  it("is green on the day it was completed", () => {
    expect(getTaskTiming(airFilter, "2026-01-01")).toMatchObject({ progress: 0, status: "ok" });
  });

  it("turns yellow once 80% of the cycle has passed", () => {
    expect(statusOn("2026-02-17")).toBe("ok"); // day 47 of 59 = 0.797
    expect(statusOn("2026-02-18")).toBe("soon"); // day 48 of 59 = 0.814
  });

  it("turns red on the due date itself, with progress exactly 1", () => {
    expect(statusOn("2026-02-28")).toBe("soon");
    expect(getTaskTiming(airFilter, "2026-03-01")).toMatchObject({
      daysUntilDue: 0,
      progress: 1,
      status: "due",
    });
  });

  it("turns severe once overdue by half its own interval", () => {
    expect(statusOn("2026-03-30")).toBe("due"); // 29 days overdue, needs 29.5
    expect(statusOn("2026-03-31")).toBe("severe"); // 30 days overdue
  });

  it("restarts the cycle from the day it was actually done, not from the old due date", () => {
    const doneLate = { ...airFilter, lastCompleted: "2026-03-20" };
    expect(getTaskTiming(doneLate, "2026-03-20")!.dueDate).toBe("2026-05-20");
  });

  it("needs at least 3 days overdue before a short task is severe", () => {
    const daily = makeNode("dishes", null, {
      frequency: { count: 1, unit: "day" },
      lastCompleted: "2026-06-01",
    });
    expect(getTaskTiming(daily, "2026-06-04")!.status).toBe("due"); // 2 days overdue
    expect(getTaskTiming(daily, "2026-06-05")!.status).toBe("severe"); // 3 days overdue
  });

  it("keeps a daily task green on the day it is done, then due the next day", () => {
    const daily = makeNode("dishes", null, {
      frequency: { count: 1, unit: "day" },
      lastCompleted: "2026-06-01",
    });
    expect(getTaskTiming(daily, "2026-06-01")!.status).toBe("ok");
    expect(getTaskTiming(daily, "2026-06-02")!.status).toBe("due");
  });

  it("turns a short task yellow the day before it is due", () => {
    const everyFourDays = makeNode("plants", null, {
      frequency: { count: 4, unit: "day" },
      lastCompleted: "2026-06-01",
    });
    expect(getTaskTiming(everyFourDays, "2026-06-03")!.status).toBe("ok"); // 0.5, 2 days left
    expect(getTaskTiming(everyFourDays, "2026-06-04")!.status).toBe("soon"); // 0.75, 1 day left
  });

  it("treats a never-completed task as due from the day it was created", () => {
    const neverDone = makeNode("gutters", null, {
      frequency: { count: 1, unit: "month" },
      createdAt: "2026-01-01",
    });
    expect(getTaskTiming(neverDone, "2026-01-01")).toMatchObject({
      dueDate: "2026-01-01",
      intervalDays: 31,
      progress: 1,
      status: "due",
    });
    // 16 days overdue against a 31-day interval is past the halfway mark.
    expect(getTaskTiming(neverDone, "2026-01-17")!.status).toBe("severe");
  });
});
