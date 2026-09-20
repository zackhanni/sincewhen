import { describe, expect, it } from "vitest";
import { completeTask, undoCompletion } from "./complete";
import { TODAY, dueTask, folder, makeData, makeNode, okTask, soonTask } from "./test-helpers";
import type { AppData } from "./types";

const lastCompleted = (data: AppData, id: string) => data.nodes.find((n) => n.id === id)!.lastCompleted;

/** A yearly task done two months ago: nowhere near due. */
const regrout = (parentId: string) =>
  makeNode("regrout", parentId, { frequency: { count: 1, unit: "year" }, lastCompleted: "2026-04-01" });

describe("completeTask", () => {
  it("sets last-completed to today and logs it", () => {
    const { data } = completeTask(makeData([dueTask("filter", null)]), "filter", TODAY, "b1");
    expect(lastCompleted(data, "filter")).toBe(TODAY);
    expect(data.completions).toEqual([{ nodeId: "filter", date: TODAY, batchId: "b1" }]);
  });

  it("refuses a folder or an unknown id", () => {
    const data = makeData([folder("room", null)]);
    expect(() => completeTask(data, "room", TODAY, "b1")).toThrow(expect.objectContaining({ code: "NOT_A_TASK" }));
    expect(() => completeTask(data, "ghost", TODAY, "b1")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  describe("cascade down", () => {
    const data = makeData([
      dueTask("clean", null),
      dueTask("scrub", "clean"),
      soonTask("mirror", "clean"),
      regrout("clean"),
    ]);
    const result = completeTask(data, "clean", TODAY, "b1").data;

    it("completes sub-tasks that were due or due soon", () => {
      expect(lastCompleted(result, "scrub")).toBe(TODAY);
      expect(lastCompleted(result, "mirror")).toBe(TODAY);
    });

    it("leaves a sub-task that was not due alone, so a yearly task is not reset monthly", () => {
      expect(lastCompleted(result, "regrout")).toBe("2026-04-01");
      expect(result.completions.map((c) => c.nodeId).sort()).toEqual(["clean", "mirror", "scrub"]);
    });
  });

  describe("auto-complete up", () => {
    it("completes the parent when its last outstanding sub-task is done", () => {
      const data = makeData([dueTask("clean", null), dueTask("scrub", "clean"), okTask("mirror", "clean"), regrout("clean")]);
      const result = completeTask(data, "scrub", TODAY, "b1").data;
      expect(lastCompleted(result, "clean")).toBe(TODAY);
      expect(lastCompleted(result, "regrout")).toBe("2026-04-01");
    });

    it("leaves the parent alone while another sub-task is still outstanding", () => {
      const data = makeData([dueTask("clean", null), dueTask("scrub", "clean"), dueTask("mirror", "clean")]);
      const result = completeTask(data, "scrub", TODAY, "b1").data;
      expect(lastCompleted(result, "clean")).toBe("2026-05-24");
    });

    it("does not touch a parent that is not due", () => {
      const data = makeData([okTask("clean", null), dueTask("scrub", "clean")]);
      const { data: result, undo } = completeTask(data, "scrub", TODAY, "b1");
      expect(undo.previous.map((p) => p.nodeId)).toEqual(["scrub"]);
      expect(result.completions).toHaveLength(1);
    });

    it("reaches a parent task through a folder, and keeps going up", () => {
      const data = makeData([
        dueTask("deepClean", null),
        dueTask("clean", "deepClean"),
        folder("sinkArea", "clean"),
        dueTask("mirror", "sinkArea"),
      ]);
      const result = completeTask(data, "mirror", TODAY, "b1").data;
      expect(lastCompleted(result, "clean")).toBe(TODAY);
      expect(lastCompleted(result, "deepClean")).toBe(TODAY);
    });

    it("never completes a folder", () => {
      const data = makeData([folder("room", null), dueTask("a", "room")]);
      const result = completeTask(data, "a", TODAY, "b1").data;
      expect(lastCompleted(result, "room")).toBeNull();
      expect(result.completions).toHaveLength(1);
    });
  });
});

describe("undoCompletion", () => {
  it("restores every node the completion touched and removes its log entries", () => {
    const before: AppData = {
      ...makeData([dueTask("clean", null), dueTask("scrub", "clean"), makeNode("never", "clean", { frequency: { count: 1, unit: "week" } })]),
      completions: [{ nodeId: "scrub", date: "2026-05-24", batchId: "old" }],
    };
    const { data: after, undo } = completeTask(before, "clean", TODAY, "b1");
    expect(after.completions).toHaveLength(4);

    const restored = undoCompletion(after, undo);
    expect(restored).toEqual(before);
    expect(lastCompleted(restored, "never")).toBeNull();
  });

  it("leaves a node alone if it was completed again after this batch", () => {
    const first = completeTask(makeData([dueTask("a", null)]), "a", "2026-06-01", "b1");
    const second = completeTask(first.data, "a", "2026-06-03", "b2");

    const result = undoCompletion(second.data, first.undo);
    // Rewinding to the pre-b1 date would contradict the b2 entry still in the log.
    expect(lastCompleted(result, "a")).toBe("2026-06-03");
    expect(result.completions).toEqual([{ nodeId: "a", date: "2026-06-03", batchId: "b2" }]);
  });

  it("keeps edits made while the undo toast was showing", () => {
    const { data: after, undo } = completeTask(makeData([dueTask("a", null), dueTask("b", null)]), "a", TODAY, "b1");
    const edited = { ...after, nodes: after.nodes.map((n) => (n.id === "b" ? { ...n, name: "renamed" } : n)) };
    expect(undoCompletion(edited, undo).nodes.find((n) => n.id === "b")!.name).toBe("renamed");
  });
});
