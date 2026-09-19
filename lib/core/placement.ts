import { MAX_DEPTH } from "./constants";
import { getChildren, getDescendants, getSubtreeHeight, type TreeIndex } from "./tree";
import type { TaskNode } from "./types";

export type PlacementTarget = {
  /** null = the top level, which turns the moved item into a location. */
  node: TaskNode | null;
  /** 0 for the top level, 1 for a location, and so on. Used to indent the picker. */
  depth: number;
};

/**
 * Every place the node `id` could legally go, in tree order, for the Move and Duplicate pickers.
 *
 * The picker offers only valid destinations, so the user never picks one and then gets an
 * error. The rules match moveNode / duplicateSubtree exactly:
 * - the branch must still fit within MAX_DEPTH once it is there;
 * - for a move (`excludeOwnBranch`), a node cannot go inside itself or its own descendants.
 *   A duplicate can, because the copy is a separate set of nodes.
 */
export function listPlacementTargets(
  index: TreeIndex,
  id: string,
  options: { excludeOwnBranch: boolean },
): PlacementTarget[] {
  const branchHeight = getSubtreeHeight(index, id);
  const ownBranch = new Set(
    options.excludeOwnBranch ? [id, ...getDescendants(index, id).map((node) => node.id)] : [],
  );

  const targets: PlacementTarget[] = [];
  const visit = (node: TaskNode | null, depth: number) => {
    if (node && ownBranch.has(node.id)) return; // nothing beneath it is valid either
    if (depth + branchHeight <= MAX_DEPTH) targets.push({ node, depth });
    for (const child of getChildren(index, node?.id ?? null)) visit(child, depth + 1);
  };
  visit(null, 0);
  return targets;
}
