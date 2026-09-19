import { describe, expect, it } from "vitest";
import { MAX_DEPTH, MAX_NAME_LENGTH } from "./constants";
import { addNode, deleteSubtree, duplicateSubtree, moveNode, updateNode } from "./operations";
import { TODAY, dueTask, folder, makeData } from "./test-helpers";
import { buildTreeIndex, getChildren } from "./tree";
import type { AppData } from "./types";

const find = (data: AppData, id: string) => data.nodes.find((node) => node.id === id)!;
const expectCode = (run: () => unknown, code: string) => expect(run).toThrow(expect.objectContaining({ code }));

/** A chain of folders nested `depth` levels deep: level1 > level2 > ... */
function chain(depth: number) {
  return Array.from({ length: depth }, (_, i) => folder(`level${i + 1}`, i === 0 ? null : `level${i}`));
}

function counterIds() {
  let n = 0;
  return () => `copy${++n}`;
}

describe("addNode", () => {
  it("adds each new node after its existing siblings", () => {
    let data = makeData([folder("home", null)]);
    for (const id of ["a", "b", "c"]) {
      data = addNode(data, { id, parentId: "home", name: id, frequency: null, lastCompleted: null, today: TODAY });
    }
    const keys = ["a", "b", "c"].map((id) => find(data, id).sortOrder);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(3);
  });

  it("trims the name and stamps the creation date", () => {
    const data = addNode(makeData([]), {
      id: "home", parentId: null, name: "  Home  ", frequency: null, lastCompleted: null, today: TODAY,
    });
    expect(find(data, "home")).toMatchObject({ name: "Home", createdAt: TODAY });
  });

  it("refuses a missing parent", () => {
    expectCode(
      () => addNode(makeData([]), { id: "a", parentId: "ghost", name: "a", frequency: null, lastCompleted: null, today: TODAY }),
      "NOT_FOUND",
    );
  });

  it("allows nesting up to the limit and refuses one level more", () => {
    const input = { id: "new", name: "new", frequency: null, lastCompleted: null, today: TODAY };
    const underLimit = makeData(chain(MAX_DEPTH - 1));
    expect(() => addNode(underLimit, { ...input, parentId: `level${MAX_DEPTH - 1}` })).not.toThrow();
    const atLimit = makeData(chain(MAX_DEPTH));
    expectCode(() => addNode(atLimit, { ...input, parentId: `level${MAX_DEPTH}` }), "TOO_DEEP");
  });

  it("refuses an id that is already in use", () => {
    const data = makeData([folder("home", null)]);
    expectCode(
      () => addNode(data, { id: "home", parentId: null, name: "Again", frequency: null, lastCompleted: null, today: TODAY }),
      "INVALID_DATA",
    );
  });

  it("refuses a node that would not survive being loaded back", () => {
    const base = { id: "a", parentId: null, lastCompleted: null, today: TODAY };
    expectCode(() => addNode(makeData([]), { ...base, name: "   ", frequency: null }), "INVALID_DATA");
    expectCode(() => addNode(makeData([]), { ...base, name: "x".repeat(MAX_NAME_LENGTH + 1), frequency: null }), "INVALID_DATA");
    expectCode(() => addNode(makeData([]), { ...base, name: "ok", frequency: { count: 0, unit: "week" } }), "INVALID_DATA");
  });

  it("does not mutate the data it was given", () => {
    const data = makeData([folder("home", null)]);
    addNode(data, { id: "a", parentId: "home", name: "a", frequency: null, lastCompleted: null, today: TODAY });
    expect(data.nodes).toHaveLength(1);
  });
});

describe("updateNode", () => {
  it("keeps the last-completed date when a task is turned into a folder", () => {
    const data = updateNode(makeData([dueTask("a", null)]), "a", { frequency: null });
    expect(find(data, "a")).toMatchObject({ frequency: null, lastCompleted: "2026-05-24" });
  });

  it("treats an undefined field as not provided, rather than erasing it", () => {
    const data = updateNode(makeData([dueTask("a", null)]), "a", { name: "New", lastCompleted: undefined });
    expect(find(data, "a")).toMatchObject({ name: "New", lastCompleted: "2026-05-24" });
  });

  it("refuses an edit that would not survive being loaded back", () => {
    const data = makeData([dueTask("a", null)]);
    expectCode(() => updateNode(data, "a", { name: "" }), "INVALID_DATA");
    expectCode(() => updateNode(data, "a", { lastCompleted: "2026-02-30" }), "INVALID_DATA");
  });

  it("trims an edited name", () => {
    expect(find(updateNode(makeData([folder("a", null)]), "a", { name: " Attic " }), "a").name).toBe("Attic");
  });
});

describe("moveNode", () => {
  it("moves a node to the end of its new parent", () => {
    const data = makeData([folder("home", null), folder("work", null), folder("desk", "work"), dueTask("a", "home")]);
    const moved = moveNode(data, "a", "work");
    expect(find(moved, "a").parentId).toBe("work");
    expect(find(moved, "a").sortOrder > find(moved, "desk").sortOrder).toBe(true);
  });

  it("refuses to move a node inside itself or its own descendants", () => {
    const data = makeData([folder("home", null), folder("kitchen", "home"), folder("pantry", "kitchen")]);
    expectCode(() => moveNode(data, "home", "home"), "WOULD_CREATE_CYCLE");
    expectCode(() => moveNode(data, "home", "pantry"), "WOULD_CREATE_CYCLE");
  });

  it("counts the whole branch against the depth limit", () => {
    // A 2-level branch cannot go under a parent at depth MAX_DEPTH - 1.
    const data = makeData([...chain(MAX_DEPTH - 1), folder("branch", null), folder("leaf", "branch")]);
    expectCode(() => moveNode(data, "branch", `level${MAX_DEPTH - 1}`), "TOO_DEEP");
    expect(() => moveNode(data, "leaf", `level${MAX_DEPTH - 1}`)).not.toThrow();
  });

  it("can promote a room to a top-level location", () => {
    const data = makeData([folder("home", null), folder("garage", "home")]);
    expect(find(moveNode(data, "garage", null), "garage").parentId).toBeNull();
  });
});

describe("duplicateSubtree", () => {
  const data = makeData([
    folder("home", null),
    folder("guest", "home"),
    { ...dueTask("clean", "home"), name: "Clean bathroom" },
    dueTask("scrub", "clean"),
    dueTask("mirror", "clean"),
  ]);

  it("copies the whole branch with new ids and rewired parents", () => {
    const result = duplicateSubtree(data, "clean", "guest", { newId: counterIds(), today: TODAY, resetCompletion: false });
    expect(result.nodes).toHaveLength(data.nodes.length + 3);
    const root = result.nodes.find((n) => n.parentId === "guest")!;
    // Read the children through the index: display order comes from sortOrder, not array order.
    const children = getChildren(buildTreeIndex(result.nodes), root.id);
    expect(root.name).toBe("Clean bathroom");
    expect(children.map((n) => n.name)).toEqual(["scrub", "mirror"]);
    expect(find(result, "scrub").parentId).toBe("clean"); // originals untouched
  });

  it("adds (copy) only when the copy lands beside the original", () => {
    const result = duplicateSubtree(data, "clean", "home", { newId: counterIds(), today: TODAY, resetCompletion: false });
    expect(find(result, "copy1").name).toBe("Clean bathroom (copy)");
  });

  it("keeps the (copy) suffix even when the name is already at the length limit", () => {
    const longName = "x".repeat(MAX_NAME_LENGTH);
    const long = makeData([folder("home", null), { ...folder("room", "home"), name: longName }]);
    const result = duplicateSubtree(long, "room", "home", { newId: counterIds(), today: TODAY, resetCompletion: false });
    const copyName = find(result, "copy1").name;
    expect(copyName).toHaveLength(MAX_NAME_LENGTH);
    expect(copyName.endsWith(" (copy)")).toBe(true);
  });

  it("refuses ids from newId that collide with existing nodes or each other", () => {
    const options = { today: TODAY, resetCompletion: false };
    expectCode(() => duplicateSubtree(data, "clean", "guest", { ...options, newId: () => "home" }), "INVALID_DATA");
    expectCode(() => duplicateSubtree(data, "clean", "guest", { ...options, newId: () => "same" }), "INVALID_DATA");
  });

  it("can reset the copies to never-done", () => {
    const kept = duplicateSubtree(data, "clean", "guest", { newId: counterIds(), today: TODAY, resetCompletion: false });
    const reset = duplicateSubtree(data, "clean", "guest", { newId: counterIds(), today: TODAY, resetCompletion: true });
    expect(find(kept, "copy2").lastCompleted).toBe("2026-05-24");
    expect(find(reset, "copy2").lastCompleted).toBeNull();
  });

  it("respects the depth limit", () => {
    const deep = makeData([...chain(MAX_DEPTH - 1), folder("branch", null), folder("leaf", "branch")]);
    expectCode(
      () => duplicateSubtree(deep, "branch", `level${MAX_DEPTH - 1}`, { newId: counterIds(), today: TODAY, resetCompletion: false }),
      "TOO_DEEP",
    );
  });
});

describe("deleteSubtree", () => {
  it("removes the node, everything inside it, and their completion history", () => {
    const data: AppData = {
      ...makeData([folder("home", null), dueTask("clean", "home"), dueTask("scrub", "clean"), dueTask("other", "home")]),
      completions: [
        { nodeId: "scrub", date: "2026-05-24", batchId: "b1" },
        { nodeId: "other", date: "2026-05-24", batchId: "b2" },
      ],
    };
    const result = deleteSubtree(data, "clean");
    expect(result.nodes.map((n) => n.id)).toEqual(["home", "other"]);
    expect(result.completions.map((c) => c.nodeId)).toEqual(["other"]);
  });

  it("refuses an unknown id", () => {
    expectCode(() => deleteSubtree(makeData([]), "ghost"), "NOT_FOUND");
  });
});

