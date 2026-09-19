import type { CalendarDate } from "./dates";
import { CoreError } from "./errors";
import { getTaskTiming, needsAttention } from "./status";
import { buildTreeIndex, getDescendants } from "./tree";
import type { AppData, TaskNode } from "./types";

/** What a completion changed, kept so the undo toast can put it back exactly. */
export type CompletionUndo = {
  batchId: string;
  previous: { nodeId: string; lastCompleted: CalendarDate | null }[];
};

export type CompletionResult = {
  data: AppData;
  undo: CompletionUndo;
};

function taskNeedsAttention(node: TaskNode, today: CalendarDate): boolean {
  const timing = getTaskTiming(node, today);
  return timing !== null && needsAttention(timing.status);
}

/**
 * Marks a task done today. Two follow-on rules apply:
 *
 * 1. CASCADE DOWN. Sub-tasks that were due or due soon are completed too — finishing "clean the
 *    bathroom" finishes "scrub the toilet". Sub-tasks that were NOT due are left alone: a yearly
 *    "regrout" inside a monthly "clean the bathroom" must not be reset every month.
 *
 * 2. AUTO-COMPLETE UP. If the parent is itself a task that wants attention, and after this
 *    completion nothing inside it wants attention any more, the parent is completed as well.
 *    Otherwise doing every sub-task one by one would leave the parent stuck on red. This repeats
 *    up the tree. Sub-tasks that were not due do not block it, for the same "regrout" reason.
 *
 * `batchId` tags every log entry written by this one tap, which is how undo finds them.
 */
export function completeTask(
  data: AppData,
  id: string,
  today: CalendarDate,
  batchId: string,
): CompletionResult {
  const index = buildTreeIndex(data.nodes);
  const target = index.byId.get(id);
  if (!target) throw new CoreError("NOT_FOUND", `No node with id "${id}"`);
  if (!target.frequency) throw new CoreError("NOT_A_TASK", "A folder cannot be completed");

  const completedIds = new Set<string>([id]);

  // Rule 1: cascade down.
  for (const descendant of getDescendants(index, id)) {
    if (taskNeedsAttention(descendant, today)) completedIds.add(descendant.id);
  }

  // Rule 2: auto-complete up. Folders and tasks that are not due are stepped over, so a task can
  // still auto-complete when its sub-tasks are grouped in a folder beneath it. The walk stops at
  // the first task that still has something outstanding: everything above it contains that same
  // outstanding item, so none of them can complete either.
  let ancestorId = target.parentId;
  while (ancestorId !== null) {
    const ancestor = index.byId.get(ancestorId);
    if (!ancestor) break;
    if (taskNeedsAttention(ancestor, today)) {
      const somethingOutstanding = getDescendants(index, ancestor.id).some(
        (descendant) => !completedIds.has(descendant.id) && taskNeedsAttention(descendant, today),
      );
      if (somethingOutstanding) break;
      completedIds.add(ancestor.id);
    }
    ancestorId = ancestor.parentId;
  }

  const previous = data.nodes
    .filter((node) => completedIds.has(node.id))
    .map((node) => ({ nodeId: node.id, lastCompleted: node.lastCompleted }));

  return {
    data: {
      ...data,
      nodes: data.nodes.map((node) =>
        completedIds.has(node.id) ? { ...node, lastCompleted: today } : node,
      ),
      completions: [
        ...data.completions,
        ...previous.map(({ nodeId }) => ({ nodeId, date: today, batchId })),
      ],
    },
    undo: { batchId, previous },
  };
}

/**
 * Reverses one completeTask call. Only the nodes that call touched are restored, so any other
 * edit made while the undo toast was on screen survives. A node deleted in the meantime is
 * skipped.
 */
export function undoCompletion(data: AppData, undo: CompletionUndo): AppData {
  const previousById = new Map(undo.previous.map((entry) => [entry.nodeId, entry.lastCompleted]));
  return {
    ...data,
    nodes: data.nodes.map((node) =>
      previousById.has(node.id)
        ? { ...node, lastCompleted: previousById.get(node.id) ?? null }
        : node,
    ),
    completions: data.completions.filter((completion) => completion.batchId !== undo.batchId),
  };
}
