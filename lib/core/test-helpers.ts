import { generateKeyBetween } from "fractional-indexing";
import { SCHEMA_VERSION } from "./constants";
import type { AppData, Frequency, TaskNode } from "./types";

// Shared fixtures for the core tests. Every test pins "today" to TODAY so results never depend
// on the day the suite happens to run.
export const TODAY = "2026-06-01";

export const WEEKLY: Frequency = { count: 1, unit: "week" };

let lastSortKey: string | null = null;

/** Builds a node with sensible defaults. Sort keys are handed out in creation order. */
export function makeNode(
  id: string,
  parentId: string | null,
  overrides: Partial<TaskNode> = {},
): TaskNode {
  // Real fractional-indexing keys, because the operations under test validate the keys they
  // are given — a made-up string like "a0000" is rejected.
  const sortOrder = generateKeyBetween(lastSortKey, null);
  lastSortKey = sortOrder;
  return {
    id,
    parentId,
    name: id,
    frequency: null,
    lastCompleted: null,
    createdAt: "2026-01-01",
    sortOrder,
    ...overrides,
  };
}

export const folder = (id: string, parentId: string | null) => makeNode(id, parentId);

// Weekly tasks in each status, relative to TODAY (2026-06-01).
/** Completed today. */
export const okTask = (id: string, parentId: string | null) =>
  makeNode(id, parentId, { frequency: WEEKLY, lastCompleted: "2026-06-01" });
/** 6 of 7 days elapsed (progress 0.86). */
export const soonTask = (id: string, parentId: string | null) =>
  makeNode(id, parentId, { frequency: WEEKLY, lastCompleted: "2026-05-26" });
/** Due 2026-05-31, so 1 day overdue. */
export const dueTask = (id: string, parentId: string | null) =>
  makeNode(id, parentId, { frequency: WEEKLY, lastCompleted: "2026-05-24" });
/** Due 2026-05-08, so 24 days overdue. */
export const severeTask = (id: string, parentId: string | null) =>
  makeNode(id, parentId, { frequency: WEEKLY, lastCompleted: "2026-05-01" });

export function makeData(nodes: TaskNode[]): AppData {
  return { schemaVersion: SCHEMA_VERSION, nodes, completions: [] };
}
