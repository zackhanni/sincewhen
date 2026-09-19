import { describe, expect, it } from "vitest";
import { MAX_DEPTH } from "./constants";
import { moveNode } from "./operations";
import { listPlacementTargets } from "./placement";
import { folder, makeData } from "./test-helpers";
import { buildTreeIndex } from "./tree";

const nodes = [
  folder("home", null),
  folder("kitchen", "home"),
  folder("pantry", "kitchen"),
  folder("work", null),
];
const index = buildTreeIndex(nodes);
const ids = (targets: ReturnType<typeof listPlacementTargets>) => targets.map((t) => t.node?.id ?? "TOP");

describe("listPlacementTargets", () => {
  it("lists the top level and every node, in tree order with depths", () => {
    const targets = listPlacementTargets(index, "work", { excludeOwnBranch: false });
    expect(ids(targets)).toEqual(["TOP", "home", "kitchen", "pantry", "work"]);
    expect(targets.map((t) => t.depth)).toEqual([0, 1, 2, 3, 1]);
  });

  it("leaves out the node's own branch for a move, but not for a duplicate", () => {
    expect(ids(listPlacementTargets(index, "kitchen", { excludeOwnBranch: true }))).toEqual(["TOP", "home", "work"]);
    expect(ids(listPlacementTargets(index, "kitchen", { excludeOwnBranch: false }))).toContain("pantry");
  });

  it("leaves out destinations where the branch would not fit", () => {
    const chain = Array.from({ length: MAX_DEPTH }, (_, i) => folder(`l${i + 1}`, i === 0 ? null : `l${i}`));
    const deep = buildTreeIndex([...chain, folder("branch", null), folder("leaf", "branch")]);
    // "branch" is 2 levels tall, so it fits under depth MAX_DEPTH - 2 at most.
    const offered = ids(listPlacementTargets(deep, "branch", { excludeOwnBranch: true }));
    expect(offered).toContain(`l${MAX_DEPTH - 2}`);
    expect(offered).not.toContain(`l${MAX_DEPTH - 1}`);
  });

  it("offers only destinations that moveNode accepts", () => {
    const data = makeData(nodes);
    for (const target of listPlacementTargets(index, "kitchen", { excludeOwnBranch: true })) {
      expect(() => moveNode(data, "kitchen", target.node?.id ?? null)).not.toThrow();
    }
  });
});
