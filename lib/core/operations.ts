import { generateKeyBetween } from "fractional-indexing";
import { MAX_DEPTH, MAX_NAME_LENGTH } from "./constants";
import type { CalendarDate } from "./dates";
import { CoreError } from "./errors";
import {
  buildTreeIndex,
  getChildren,
  getDepth,
  getDescendants,
  getSubtreeHeight,
  type TreeIndex,
} from "./tree";
import type { AppData, Frequency, TaskNode } from "./types";

// Every operation here takes the saved data and returns a NEW copy with the change applied.
// Nothing is mutated, so the store can swap the result in and React sees a fresh reference.
// An operation that cannot be done throws a CoreError and leaves the data untouched.

function requireNode(index: TreeIndex, id: string): TaskNode {
  const node = index.byId.get(id);
  if (!node) throw new CoreError("NOT_FOUND", `No node with id "${id}"`);
  return node;
}

/** A sort key that places a new node after the last existing child of `parentId`. */
function sortOrderAtEnd(index: TreeIndex, parentId: string | null): string {
  const siblings = getChildren(index, parentId);
  const lastKey = siblings.length > 0 ? siblings[siblings.length - 1].sortOrder : null;
  return generateKeyBetween(lastKey, null);
}

/**
 * Refuses a placement that would nest deeper than MAX_DEPTH.
 * `subtreeHeight` is 1 for a single node, more when a whole branch is being moved or copied.
 */
function assertFitsUnder(index: TreeIndex, parentId: string | null, subtreeHeight: number): void {
  const parentDepth = parentId === null ? 0 : getDepth(index, parentId);
  if (parentDepth + subtreeHeight > MAX_DEPTH) {
    throw new CoreError("TOO_DEEP", `Nesting is limited to ${MAX_DEPTH} levels`);
  }
}

export type NewNodeInput = {
  id: string;
  parentId: string | null;
  name: string;
  /** null makes a folder. */
  frequency: Frequency | null;
  /** null = never done, so a task is due immediately. */
  lastCompleted: CalendarDate | null;
  today: CalendarDate;
};

export function addNode(data: AppData, input: NewNodeInput): AppData {
  const index = buildTreeIndex(data.nodes);
  if (input.parentId !== null) requireNode(index, input.parentId);
  assertFitsUnder(index, input.parentId, 1);

  const node: TaskNode = {
    id: input.id,
    parentId: input.parentId,
    name: input.name.trim(),
    frequency: input.frequency,
    lastCompleted: input.lastCompleted,
    createdAt: input.today,
    sortOrder: sortOrderAtEnd(index, input.parentId),
  };
  return { ...data, nodes: [...data.nodes, node] };
}

export type NodeEdit = Partial<Pick<TaskNode, "name" | "frequency" | "lastCompleted">>;

export function updateNode(data: AppData, id: string, edit: NodeEdit): AppData {
  requireNode(buildTreeIndex(data.nodes), id);
  const cleanEdit = edit.name === undefined ? edit : { ...edit, name: edit.name.trim() };
  return {
    ...data,
    nodes: data.nodes.map((node) => (node.id === id ? { ...node, ...cleanEdit } : node)),
  };
}

/** Moves a node, and everything inside it, under a new parent (null = make it a location). */
export function moveNode(data: AppData, id: string, newParentId: string | null): AppData {
  const index = buildTreeIndex(data.nodes);
  const node = requireNode(index, id);
  if (node.parentId === newParentId) return data;

  if (newParentId !== null) {
    requireNode(index, newParentId);
    // Moving a folder inside itself would detach the whole branch from the tree.
    const insideItself =
      newParentId === id || getDescendants(index, id).some((d) => d.id === newParentId);
    if (insideItself) {
      throw new CoreError("WOULD_CREATE_CYCLE", "Cannot move an item inside itself");
    }
  }
  assertFitsUnder(index, newParentId, getSubtreeHeight(index, id));

  const moved = { ...node, parentId: newParentId, sortOrder: sortOrderAtEnd(index, newParentId) };
  return { ...data, nodes: data.nodes.map((n) => (n.id === id ? moved : n)) };
}

export type DuplicateOptions = {
  /** Called once per copied node. Injected so this file stays pure and tests get predictable ids. */
  newId: () => string;
  today: CalendarDate;
  /**
   * true  -> the copies start as "never done" (due now). Right when copying to a different room,
   *          where nothing has actually been done yet.
   * false -> the copies keep the original's last-completed dates.
   */
  resetCompletion: boolean;
};

/**
 * Copies a node and everything inside it under `newParentId`. This is how "the same chore, but a
 * different frequency in the guest bathroom" works: duplicate, move, then edit the frequency.
 */
export function duplicateSubtree(
  data: AppData,
  id: string,
  newParentId: string | null,
  options: DuplicateOptions,
): AppData {
  const index = buildTreeIndex(data.nodes);
  const source = requireNode(index, id);
  if (newParentId !== null) requireNode(index, newParentId);
  assertFitsUnder(index, newParentId, getSubtreeHeight(index, id));

  const originals = [source, ...getDescendants(index, id)];
  const copyIdOf = new Map(originals.map((node) => [node.id, options.newId()]));

  const copies = originals.map((original): TaskNode => {
    const isRoot = original.id === id;
    // Only a copy landing next to its original needs a different name to tell them apart.
    const name =
      isRoot && newParentId === source.parentId
        ? `${original.name} (copy)`.slice(0, MAX_NAME_LENGTH)
        : original.name;
    return {
      ...original,
      id: copyIdOf.get(original.id)!,
      // Children point at their copied parent. They keep their sortOrder: their only siblings are
      // the other copies, so the relative order carries over unchanged.
      parentId: isRoot ? newParentId : copyIdOf.get(original.parentId!)!,
      name,
      sortOrder: isRoot ? sortOrderAtEnd(index, newParentId) : original.sortOrder,
      createdAt: options.today,
      lastCompleted: options.resetCompletion ? null : original.lastCompleted,
    };
  });

  // The completion log is not copied: those completions happened to the original, not the copy.
  return { ...data, nodes: [...data.nodes, ...copies] };
}

/** Deletes a node, everything inside it, and their completion history. */
export function deleteSubtree(data: AppData, id: string): AppData {
  const index = buildTreeIndex(data.nodes);
  requireNode(index, id);
  const removedIds = new Set([id, ...getDescendants(index, id).map((node) => node.id)]);
  return {
    ...data,
    nodes: data.nodes.filter((node) => !removedIds.has(node.id)),
    completions: data.completions.filter((completion) => !removedIds.has(completion.nodeId)),
  };
}
