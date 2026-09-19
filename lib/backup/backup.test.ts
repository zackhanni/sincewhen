import { describe, expect, it } from "vitest";
import { dueTask, folder, makeData } from "@/lib/core/test-helpers";
import { backupFileName, buildBackupText, readBackupText, summarizeData } from "./backup";

const data = {
  ...makeData([folder("home", null), folder("kitchen", "home"), dueTask("filter", "home"), dueTask("oven", "kitchen")]),
  completions: [{ nodeId: "filter", date: "2026-05-24", batchId: "b1" }],
};

describe("backup", () => {
  it("names the file after the day it was made", () => {
    expect(backupFileName("2026-09-19")).toBe("sincewhen-backup-2026-09-19.json");
  });

  it("counts locations, rooms, tasks and history separately", () => {
    expect(summarizeData(data)).toEqual({ locations: 1, folders: 1, tasks: 2, completions: 1 });
  });

  it("round-trips: what is exported is exactly what is imported", () => {
    const result = readBackupText(buildBackupText(data, "2026-09-19"));
    expect(result).toMatchObject({ ok: true, exportedAt: "2026-09-19" });
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
