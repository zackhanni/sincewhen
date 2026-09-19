import type { RoomLevel, TaskStatus } from "@/lib/core";

// The colour language of the app, in one place. Class names are written out in full (never
// built from pieces) because Tailwind only generates the classes it can find as whole strings.

/** The coloured bar down the left edge of a task row. */
export const TASK_BAR: Record<TaskStatus, string> = {
  ok: "border-l-green-500",
  soon: "border-l-yellow-400",
  due: "border-l-red-500",
  severe: "border-l-red-600",
};

export const TASK_DUE_TEXT: Record<TaskStatus, string> = {
  ok: "text-muted-foreground",
  soon: "text-yellow-700",
  due: "text-red-600",
  severe: "font-semibold text-red-700",
};

/** The border of a room card: green, yellow, orange, red, then dark red for the worst. */
export const ROOM_BORDER: Record<RoomLevel, string> = {
  green: "border-green-500/60",
  yellow: "border-yellow-400",
  orange: "border-orange-500",
  red: "border-red-500",
  darkRed: "border-red-900 bg-red-50",
};

/** The overdue-count badge on a room card. */
export const ROOM_BADGE: Record<RoomLevel, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-500 text-white",
  red: "bg-red-500 text-white",
  darkRed: "bg-red-900 text-white",
};
