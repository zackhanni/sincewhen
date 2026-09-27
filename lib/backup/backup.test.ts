import { describe, expect, it } from "vitest";
import { dueTask, folder, makeData } from "@/lib/core/test-helpers";
import { buildExampleData } from "@/lib/core";
import {
  backupFileName,
  buildBackupText,
  buildCompactBackupText,
  isBackupDue,
  readBackupText,
  summarizeData,
} from "./backup";

const data = {
  ...makeData([folder("home", null), folder("kitchen", "home"), dueTask("filter", "home"), dueTask("oven", "kitchen")]),
  completions: [{ nodeId: "filter", date: "2026-05-24", batchId: "b1" }],
};

describe("isBackupDue", () => {
  const addedOn = (createdAt: string) => ({ ...data, nodes: data.nodes.map((node) => ({ ...node, createdAt })) });

  it("never asks when there is nothing to lose", () => {
    expect(isBackupDue({ ...data, nodes: [] }, null, "2026-09-26")).toBe(false);
  });

  it("waits a week after the first item before the first ask", () => {
    expect(isBackupDue(addedOn("2026-09-20"), null, "2026-09-26")).toBe(false); // 6 days
    expect(isBackupDue(addedOn("2026-09-19"), null, "2026-09-26")).toBe(true); // 7 days
  });

  it("does not ask on the day the examples are added", () => {
    let id = 0;
    expect(isBackupDue(buildExampleData("2026-09-26", () => `e${id++}`), null, "2026-09-26")).toBe(false);
  });

  it("counts from the oldest item, so adding a new one does not reset the wait", () => {
    const mixed = { ...data, nodes: data.nodes.map((node, i) => ({ ...node, createdAt: i === 0 ? "2026-09-01" : "2026-09-26" })) };
    expect(isBackupDue(mixed, null, "2026-09-26")).toBe(true);
  });

  it("after a backup, asks again once it is 30 days old", () => {
    expect(isBackupDue(addedOn("2026-01-01"), "2026-08-28", "2026-09-26")).toBe(false); // 29 days
    expect(isBackupDue(addedOn("2026-01-01"), "2026-08-27", "2026-09-26")).toBe(true); // 30 days
  });
});

describe("backup", () => {
  it("names the file after the day it was made", () => {
    expect(backupFileName("2026-09-19")).toBe("sincewhen-backup-2026-09-19.json");
  });

  it("counts tasks, folders (top level included) and history separately", () => {
    expect(summarizeData(data)).toEqual({ folderCount: 2, taskCount: 2, completionCount: 1 });
  });

  it("round-trips: what is exported is exactly what is imported", () => {
    const result = readBackupText(buildBackupText(data, "2026-09-19"));
    expect(result).toMatchObject({ ok: true, exportedAt: "2026-09-19" });
    expect(result.ok && result.data).toEqual(data);
  });

  it("the compact copy kept before an import reads back the same, and is smaller", () => {
    const compact = buildCompactBackupText(data, "2026-09-19");
    const result = readBackupText(compact);
    expect(result.ok && result.data).toEqual(data);
    expect(compact.length).toBeLessThan(buildBackupText(data, "2026-09-19").length);
  });

  it("leaves display settings out unless asked, and reads them back when included", () => {
    expect(readBackupText(buildBackupText(data, "2026-09-19"))).toMatchObject({ ok: true, displaySettings: null });
    const settings = { theme: "dark", size: "large", startOn: "due" } as const;
    const result = readBackupText(buildBackupText(data, "2026-09-19", settings));
    expect(result.ok && result.displaySettings).toEqual(settings);
  });

  it("reads each display setting on its own: a bad or missing one is left out, not the rest", () => {
    // `theme` is unreadable and `startOn` is missing, as in a file made before that setting existed.
    const text = JSON.stringify({ ...data, displaySettings: { theme: "purple", size: "large" } });
    const result = readBackupText(text);
    expect(result.ok && result.displaySettings).toEqual({ size: "large" });
    expect(result.ok && result.data).toEqual(data);
  });

  it("still imports the tasks when the display settings are not readable at all", () => {
    const result = readBackupText(JSON.stringify({ ...data, displaySettings: "dark please" }));
    expect(result).toMatchObject({ ok: true, displaySettings: null });
    expect(result.ok && result.data).toEqual(data);
  });

  it("accepts a backup with no export date", () => {
    expect(readBackupText(JSON.stringify(data))).toMatchObject({ ok: true, exportedAt: null });
  });

  it("refuses text that is not JSON", () => {
    expect(readBackupText("hello")).toMatchObject({ ok: false });
  });

  it("refuses JSON that is not valid app data", () => {
    const broken = { ...data, nodes: [{ ...data.nodes[1], parentId: "ghost" }] };
    const result = readBackupText(JSON.stringify(broken));
    expect(result.ok === false && result.error).toContain("does not exist");
  });
});
