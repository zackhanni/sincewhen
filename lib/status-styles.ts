import type { RoomLevel, TaskStatus } from "@/lib/core";

// The color language of the app, in one place. Class names are written out in full (never
// built from pieces) because Tailwind only generates the classes it can find as whole strings.
// Every text color has a `dark:` partner: a shade that reads on light cards is too dim on the
// near-black ones, so dark mode uses lighter shades of the same hue.

/** The colored bar down the left edge of a task row. */
export const TASK_BAR: Record<TaskStatus, string> = {
  ok: "border-l-green-500",
  soon: "border-l-yellow-400",
  due: "border-l-red-500",
  severe: "border-l-red-600",
};

export const TASK_DUE_TEXT: Record<TaskStatus, string> = {
  ok: "text-muted-foreground",
  soon: "text-yellow-700 dark:text-yellow-400",
  due: "text-red-600 dark:text-red-400",
  severe: "font-semibold text-red-700 dark:text-red-400",
};

/** The border of a room card: green, yellow, orange, red, then dark red for the worst. */
export const ROOM_BORDER: Record<RoomLevel, string> = {
  green: "border-green-500/60",
  yellow: "border-yellow-400",
  orange: "border-orange-500",
  red: "border-red-500",
  darkRed: "border-red-900 bg-red-50 dark:border-red-700 dark:bg-red-950",
};

/**
 * The overdue-count badge on a room card. Every pair needs 4.5:1 contrast (WCAG AA for small
 * text): white on orange-500 is only about 2.8:1 and white on red-500 about 3.8:1, so orange
 * keeps its color with dark text, and red is one shade darker.
 */
export const ROOM_BADGE: Record<RoomLevel, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  orange: "bg-orange-500 text-orange-950",
  red: "bg-red-600 text-white",
  darkRed: "bg-red-900 text-white",
};
