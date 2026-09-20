import {
  ROOM_DARK_RED_MIN_SCORE,
  ROOM_ORANGE_MIN_SCORE,
  ROOM_RED_MIN_SCORE,
  SEVERE_WEIGHT,
} from "./constants";
import type { CalendarDate } from "./dates";
import { getTaskTiming, isOverdue, type TaskTiming } from "./status";
import { compareSortOrder, getChildren, getPath, type TreeIndex } from "./tree";
import type { TaskNode } from "./types";

export type RoomLevel = "green" | "yellow" | "orange" | "red" | "darkRed";

export type RoomSummary = {
  /** Shown on the badge: how many overdue tasks are inside, at any depth. */
  overdueCount: number;
  /** Drives the colour: like overdueCount, but a severe task counts double. */
  score: number;
  hasSevere: boolean;
  hasSoon: boolean;
  level: RoomLevel;
};

export type AttentionItem = {
  node: TaskNode;
  timing: TaskTiming;
  /** Location > room > ... > the task itself, for showing where it lives. */
  path: TaskNode[];
};

/**
 * Finds every task below `parentId` that wants attention (soon, due or severe).
 *
 * An overdue task hides its own sub-tasks: "clean the bathroom" with three overdue sub-tasks is
 * one thing to do, not four, so it must not inflate the room's count. A task that is NOT overdue
 * is still searched, because one of its sub-tasks can come due on its own.
 *
 * Both the room colour and the Due tab are built from this one walk, so the badge on a room
 * always matches the number of overdue rows the Due tab shows for it.
 */
function collectAttentionItems(
  index: TreeIndex,
  parentId: string | null,
  today: CalendarDate,
): { node: TaskNode; timing: TaskTiming }[] {
  const items: { node: TaskNode; timing: TaskTiming }[] = [];
  for (const child of getChildren(index, parentId)) {
    const timing = getTaskTiming(child, today);
    if (timing && timing.status !== "ok") items.push({ node: child, timing });
    if (timing && isOverdue(timing.status)) continue;
    items.push(...collectAttentionItems(index, child.id, today));
  }
  return items;
}

/**
 * Rolls a room (or any node) up into a colour and a badge count.
 *
 * The colour comes from a COUNT of overdue tasks, not a percentage: a room whose only task is
 * overdue should look milder than a room with three of ten overdue.
 */
export function summarizeNode(index: TreeIndex, id: string, today: CalendarDate): RoomSummary {
  let overdueCount = 0;
  let score = 0;
  let hasSevere = false;
  let hasSoon = false;

  for (const { timing } of collectAttentionItems(index, id, today)) {
    if (timing.status === "soon") {
      hasSoon = true;
    } else if (timing.status === "severe") {
      overdueCount += 1;
      score += SEVERE_WEIGHT;
      hasSevere = true;
    } else {
      overdueCount += 1;
      score += 1;
    }
  }

  return { overdueCount, score, hasSevere, hasSoon, level: getRoomLevel(score, hasSevere, hasSoon) };
}

function getRoomLevel(score: number, hasSevere: boolean, hasSoon: boolean): RoomLevel {
  if (score >= ROOM_DARK_RED_MIN_SCORE) return "darkRed";
  // One badly neglected task is enough to make a room red, however few tasks are overdue.
  if (score >= ROOM_RED_MIN_SCORE || hasSevere) return "red";
  if (score >= ROOM_ORANGE_MIN_SCORE) return "orange";
  return hasSoon ? "yellow" : "green";
}

/** Most urgent first. Ties fall back to manual order so the list does not shuffle between renders. */
function compareUrgency(
  a: { node: TaskNode; timing: TaskTiming },
  b: { node: TaskNode; timing: TaskTiming },
): number {
  return b.timing.progress - a.timing.progress || compareSortOrder(a.node, b.node);
}

/**
 * The Due tab: everything wanting attention, most urgent first.
 * Pass a location id to limit the list to that location, or null for all locations.
 */
export function listAttentionItems(
  index: TreeIndex,
  rootId: string | null,
  today: CalendarDate,
): AttentionItem[] {
  return collectAttentionItems(index, rootId, today)
    .sort(compareUrgency)
    .map(({ node, timing }) => ({ node, timing, path: getPath(index, node.id) }));
}

export type ChildView = {
  node: TaskNode;
  /** null when the node is a folder. */
  timing: TaskTiming | null;
  summary: RoomSummary;
};

/**
 * The rows for one screen: the children of `parentId`, in display order, with everything the UI
 * needs to colour them.
 *
 * - Tasks come first, most urgent on top. Folders come after, worst room on top.
 * - Inside a task, sub-tasks keep their manual order instead, because there they are steps
 *   ("scrub" before "mop") rather than competing chores.
 * - Top-level locations keep their manual order.
 */
export function getChildViews(
  index: TreeIndex,
  parentId: string | null,
  today: CalendarDate,
): ChildView[] {
  const views = getChildren(index, parentId).map((node) => ({
    node,
    timing: getTaskTiming(node, today),
    summary: summarizeNode(index, node.id, today),
  }));

  // getChildren already returns manual order, which is what locations use.
  if (parentId === null) return views;


  // Inside a task everything is a step, folders included, so manual order applies to the whole
  // list — not just to the tasks with the folders pushed underneath.
  const parentIsTask = index.byId.get(parentId)?.frequency != null;
  if (parentIsTask) return views;

  const tasks = views.filter((view) => view.timing !== null);
  const folders = views.filter((view) => view.timing === null);

  tasks.sort(
    (a, b) => b.timing!.progress - a.timing!.progress || compareSortOrder(a.node, b.node),
  );
  folders.sort(
    (a, b) =>
      b.summary.score - a.summary.score ||
      Number(b.summary.hasSoon) - Number(a.summary.hasSoon) ||
      compareSortOrder(a.node, b.node),
  );

  return [...tasks, ...folders];
}
