import { SEVERE_MIN_DAYS, SEVERE_OVERDUE_RATIO, SOON_DAYS, SOON_PROGRESS } from "./constants";
import { addFrequency, daysBetween, type CalendarDate } from "./dates";
import type { TaskNode } from "./types";

/** ok = green, soon = yellow, due = red, severe = red border and "!". */
export type TaskStatus = "ok" | "soon" | "due" | "severe";

export type TaskTiming = {
  dueDate: CalendarDate;
  /** Length of the current cycle in real days, e.g. 59 for "2 months" starting Jan 1. */
  intervalDays: number;
  /** 0 = due today, negative = that many days overdue. */
  daysUntilDue: number;
  /** elapsed / interval. 0 = just completed, 1 = due today, 2 = a whole interval late. */
  progress: number;
  status: TaskStatus;
};

/**
 * Works out when a task is due and how urgent it is. Returns null for a folder (no frequency).
 *
 * The due date is measured from the day the task was last *actually* completed, not from a fixed
 * schedule — finish a 2-month task three weeks late and the next one is due 2 months after that.
 */
export function getTaskTiming(node: TaskNode, today: CalendarDate): TaskTiming | null {
  if (!node.frequency) return null;

  // A task that was never completed is due from the day it was created. Its interval is still
  // needed, to judge how overdue it is relative to its own frequency.
  const neverCompleted = node.lastCompleted === null;
  const cycleStart = node.lastCompleted ?? node.createdAt;
  const cycleEnd = addFrequency(cycleStart, node.frequency);
  const intervalDays = daysBetween(cycleStart, cycleEnd);
  const dueDate = neverCompleted ? node.createdAt : cycleEnd;

  const daysUntilDue = daysBetween(today, dueDate);
  // Same as elapsed / interval, but written from the due date so the never-completed case
  // (where the cycle has no real start) needs no special handling.
  const progress = 1 - daysUntilDue / intervalDays;

  return { dueDate, intervalDays, daysUntilDue, progress, status: getStatus(daysUntilDue, intervalDays, progress) };
}

function getStatus(daysUntilDue: number, intervalDays: number, progress: number): TaskStatus {
  if (daysUntilDue <= 0) {
    const daysOverdue = -daysUntilDue;
    // "Severe" scales with the task's own frequency: a weekly task 4 days late is neglected, a
    // yearly task 4 days late is not.
    const isSevere =
      daysOverdue >= SEVERE_MIN_DAYS && daysOverdue >= intervalDays * SEVERE_OVERDUE_RATIO;
    return isSevere ? "severe" : "due";
  }

  // `progress > 0` keeps a task green on the day it was completed. Without it a daily task
  // would go straight back to yellow the moment it is checked off (it is due "within 1 day").
  const isSoon = progress > 0 && (progress >= SOON_PROGRESS || daysUntilDue <= SOON_DAYS);
  return isSoon ? "soon" : "ok";
}

/** True for anything that wants attention: soon, due or severe. */
export function needsAttention(status: TaskStatus): boolean {
  return status !== "ok";
}

export function isOverdue(status: TaskStatus): boolean {
  return status === "due" || status === "severe";
}
