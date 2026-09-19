"use client";

import Link from "next/link";
import { CheckIcon, ChevronRightIcon, CircleAlertIcon, EllipsisVerticalIcon, FolderIcon } from "lucide-react";
import { isOverdue, type ChildView, type TaskNode } from "@/lib/core";
import { formatDue, formatFrequency } from "@/lib/format";
import { useCompleteTask } from "@/lib/hooks/use-complete-task";
import { ROOM_BADGE, ROOM_BORDER, TASK_BAR, TASK_DUE_TEXT } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import { useSheet } from "./sheet-context";

type NodeRowProps = {
  view: ChildView;
  hasChildren: boolean;
  /** Shown under the name on the Due tab, e.g. "Home › Kitchen". */
  location?: string;
};

/** One line in a list. A node with a frequency renders as a task, anything else as a room card. */
export function NodeRow({ view, hasChildren, location }: NodeRowProps) {
  return view.timing ? (
    <TaskRow view={view} hasChildren={hasChildren} location={location} />
  ) : (
    <FolderRow view={view} />
  );
}

function MenuButton({ node }: { node: TaskNode }) {
  const { openSheet } = useSheet();
  return (
    <button
      type="button"
      aria-label={`Options for ${node.name}`}
      onClick={() => openSheet({ mode: "menu", nodeId: node.id })}
      className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
    >
      <EllipsisVerticalIcon className="size-5" />
    </button>
  );
}

function TaskRow({ view, hasChildren, location }: NodeRowProps) {
  const { node, summary } = view;
  const timing = view.timing!;
  const completeTask = useCompleteTask();
  const isSevere = timing.status === "severe";

  return (
    <li
      className={cn(
        "flex items-center rounded-lg border border-l-4 bg-card",
        TASK_BAR[timing.status],
        // A long-neglected task gets a full red border as well as the "!" icon.
        isSevere && "border-red-600 bg-red-50",
      )}
    >
      <button
        type="button"
        aria-label={`Mark ${node.name} done`}
        onClick={() => completeTask(node.id, node.name)}
        className="flex size-12 shrink-0 items-center justify-center"
      >
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-transparent active:bg-green-500 active:text-white">
          <CheckIcon className="size-4" />
        </span>
      </button>

      <Link href={`/rooms/${node.id}`} className="flex min-w-0 flex-1 items-center gap-2 py-2">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {isSevere && <CircleAlertIcon aria-label="Long overdue" className="size-4 shrink-0 text-red-600" />}
            <span className="truncate font-medium">{node.name}</span>
          </span>
          <span className="block truncate text-xs">
            <span className={TASK_DUE_TEXT[timing.status]}>{formatDue(timing)}</span>
            <span className="text-muted-foreground"> · {formatFrequency(node.frequency!)}</span>
          </span>
          {location && <span className="block truncate text-xs text-muted-foreground">{location}</span>}
        </span>
        {/* An overdue task already counts for its sub-tasks, so the badge only appears when
            the task itself is fine but something inside it is not. */}
        {!isOverdue(timing.status) && summary.overdueCount > 0 && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROOM_BADGE[summary.level])}>
            {summary.overdueCount}
          </span>
        )}
        {hasChildren && <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />}
      </Link>

      <MenuButton node={node} />
    </li>
  );
}

function FolderRow({ view }: { view: ChildView }) {
  const { node, summary } = view;
  return (
    <li className={cn("flex items-center rounded-lg border-2 bg-card", ROOM_BORDER[summary.level])}>
      <Link href={`/rooms/${node.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3">
        <FolderIcon className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        {summary.overdueCount > 0 && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROOM_BADGE[summary.level])}>
            {summary.overdueCount} overdue
          </span>
        )}
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
      <MenuButton node={node} />
    </li>
  );
}
