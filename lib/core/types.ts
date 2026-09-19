import { z } from "zod";
import { MAX_FREQUENCY_COUNT, MAX_NAME_LENGTH } from "./constants";
import { isValidCalendarDate } from "./dates";

const calendarDateSchema = z.string().refine(isValidCalendarDate, "Must be a real YYYY-MM-DD date");

export const frequencySchema = z.object({
  count: z.number().int().min(1).max(MAX_FREQUENCY_COUNT),
  unit: z.enum(["day", "week", "month", "year"]),
});

/**
 * The one building block of the app. Locations, rooms, tasks and sub-tasks are all TaskNodes:
 *
 * - `parentId: null`   -> a top-level location (Home, Work, ...)
 * - `frequency: null`  -> a folder: it groups things but cannot be checked off
 * - `frequency` set    -> a task: it comes due that long after `lastCompleted`
 *
 * Any node can have children, which is how a task gets sub-tasks. Nodes are stored as a flat
 * list linked by `parentId` rather than nested, so a move is one field change and each node maps
 * to one database row later. (Named TaskNode because `Node` is already a DOM global.)
 */
export const taskNodeSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  frequency: frequencySchema.nullable(),
  /**
   * null on a task means "never done", which makes it due immediately. Ignored on a folder, but
   * deliberately not cleared: turning a task into a folder and back must not lose its history.
   */
  lastCompleted: calendarDateSchema.nullable(),
  createdAt: calendarDateSchema,
  /** A fractional-indexing key. Compare with plain `<`, never localeCompare — see compareSortOrder. */
  sortOrder: z.string().min(1),
});

/** One entry in the completion log. Everything completed by a single tap shares a `batchId`, so undo can find it. */
export const completionSchema = z.object({
  nodeId: z.string().min(1),
  date: calendarDateSchema,
  batchId: z.string().min(1),
});

/** Everything the app saves. This is also the export / import file format. */
export const appDataSchema = z.object({
  schemaVersion: z.number().int().min(1),
  nodes: z.array(taskNodeSchema),
  completions: z.array(completionSchema),
});

export type Frequency = z.infer<typeof frequencySchema>;
export type FrequencyUnit = Frequency["unit"];
export type TaskNode = z.infer<typeof taskNodeSchema>;
export type Completion = z.infer<typeof completionSchema>;
export type AppData = z.infer<typeof appDataSchema>;
