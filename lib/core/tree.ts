import type { TaskNode } from "./types";

/**
 * Lookup tables built once from the flat node list, so walking the tree does not rescan the
 * whole list at every step. Rebuild it whenever the nodes change (it is cheap).
 */
export type TreeIndex = {
  byId: Map<string, TaskNode>;
  /** Children of each parent in manual (`sortOrder`) order. The `null` key holds the locations. */
  childrenOf: Map<string | null, TaskNode[]>;
};

/**
 * Orders two nodes by their fractional-indexing keys.
 *
 * This must be a plain code-unit comparison. `localeCompare` ignores case in many locales, and
 * these keys are case-sensitive ("Zz" sorts before "a0"), so it would scramble the order.
 */
export function compareSortOrder(a: TaskNode, b: TaskNode): number {
  if (a.sortOrder < b.sortOrder) return -1;
  if (a.sortOrder > b.sortOrder) return 1;
  // Keys should be unique among siblings; fall back to id so the order is at least stable.
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function buildTreeIndex(nodes: TaskNode[]): TreeIndex {
  const byId = new Map<string, TaskNode>();
  const childrenOf = new Map<string | null, TaskNode[]>();
  for (const node of nodes) {
    byId.set(node.id, node);
    const siblings = childrenOf.get(node.parentId);
    if (siblings) siblings.push(node);
    else childrenOf.set(node.parentId, [node]);
  }
  for (const siblings of childrenOf.values()) siblings.sort(compareSortOrder);
  return { byId, childrenOf };
}

export function getChildren(index: TreeIndex, parentId: string | null): TaskNode[] {
  return index.childrenOf.get(parentId) ?? [];
}

/** Every node below `id`, at any depth. Does not include the node itself. */
export function getDescendants(index: TreeIndex, id: string): TaskNode[] {
  const descendants: TaskNode[] = [];
  const toVisit = [...getChildren(index, id)];
  while (toVisit.length > 0) {
    const node = toVisit.pop()!;
    descendants.push(node);
    toVisit.push(...getChildren(index, node.id));
  }
  return descendants;
}

/**
 * The chain from the top-level location down to the node itself — the breadcrumb.
 * The length of this path is the node's depth (a location is depth 1).
 */
export function getPath(index: TreeIndex, id: string): TaskNode[] {
  const path: TaskNode[] = [];
  let current = index.byId.get(id);
  // `path.length <= index.byId.size` stops an infinite loop if corrupt data contains a cycle.
  while (current && path.length <= index.byId.size) {
    path.unshift(current);
    current = current.parentId === null ? undefined : index.byId.get(current.parentId);
  }
  return path;
}

export function getDepth(index: TreeIndex, id: string): number {
  return getPath(index, id).length;
}

/** How many levels the subtree spans, counting the node itself: a node with no children is 1. */
export function getSubtreeHeight(index: TreeIndex, id: string): number {
  let tallestChild = 0;
  for (const child of getChildren(index, id)) {
    tallestChild = Math.max(tallestChild, getSubtreeHeight(index, child.id));
  }
  return 1 + tallestChild;
}
