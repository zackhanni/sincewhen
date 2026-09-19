import { describe, expect, it } from "vitest";
import { MAX_DEPTH, SCHEMA_VERSION } from "./constants";
import { dueTask, folder, makeData } from "./test-helpers";
import { createEmptyAppData, parseAppData } from "./validate";

const errorOf = (raw: unknown) => {
  const result = parseAppData(raw);
  return result.ok ? null : result.error;
};

describe("parseAppData", () => {
  it("accepts empty data and a healthy tree", () => {
    expect(parseAppData(createEmptyAppData()).ok).toBe(true);
    expect(parseAppData(makeData([folder("home", null), dueTask("a", "home")])).ok).toBe(true);
  });

  it("survives a JSON round trip, which is what export and import do", () => {
    const data = makeData([folder("home", null), dueTask("a", "home")]);
    expect(parseAppData(JSON.parse(JSON.stringify(data)))).toEqual({ ok: true, data });
  });

  it("rejects things that are not app data at all", () => {
    expect(errorOf(null)).not.toBeNull();
    expect(errorOf("hello")).not.toBeNull();
    expect(errorOf({ nodes: [] })).not.toBeNull();
  });

  it("rejects a date that does not exist", () => {
    const data = makeData([{ ...dueTask("a", null), lastCompleted: "2026-02-30" }]);
    expect(errorOf(data)).toContain("lastCompleted");
  });

  it("rejects a zero or fractional frequency", () => {
    expect(errorOf(makeData([{ ...dueTask("a", null), frequency: { count: 0, unit: "week" } }]))).not.toBeNull();
    expect(errorOf(makeData([{ ...dueTask("a", null), frequency: { count: 1.5, unit: "week" } }]))).not.toBeNull();
  });

  it("rejects a backup from a newer version of the app", () => {
    expect(errorOf({ ...createEmptyAppData(), schemaVersion: SCHEMA_VERSION + 1 })).toContain("newer version");
  });

  it("rejects duplicate ids", () => {
    expect(errorOf(makeData([folder("a", null), folder("a", null)]))).toContain("same id");
  });

  it("rejects a node whose parent is missing", () => {
    expect(errorOf(makeData([folder("a", "ghost")]))).toContain("does not exist");
  });

  it("rejects a loop instead of hanging on it", () => {
    expect(errorOf(makeData([folder("a", "b"), folder("b", "a")]))).toContain("loop");
  });

  it("rejects nesting deeper than the limit", () => {
    const tooDeep = Array.from({ length: MAX_DEPTH + 1 }, (_, i) => folder(`l${i}`, i === 0 ? null : `l${i - 1}`));
    expect(errorOf(makeData(tooDeep))).toContain("nested deeper");
  });

  it("quietly drops log entries for items that no longer exist", () => {
    const result = parseAppData({
      ...makeData([dueTask("a", null)]),
      completions: [
        { nodeId: "a", date: "2026-05-24", batchId: "b1" },
        { nodeId: "deleted", date: "2026-05-24", batchId: "b2" },
      ],
    });
    expect(result.ok && result.data.completions.map((c) => c.nodeId)).toEqual(["a"]);
  });
});
