"use client";

import Link from "next/link";
import { Fragment } from "react";
import { CheckIcon, EllipsisVerticalIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getChildViews, getChildren, getPath, getTaskTiming } from "@/lib/core";
import { formatDue, formatFrequency } from "@/lib/format";
import { useCompleteTask } from "@/lib/hooks/use-complete-task";
import { useToday } from "@/lib/hooks/use-today";
import { useTreeIndex } from "@/lib/hooks/use-tree-index";
import { TASK_DUE_TEXT } from "@/lib/status-styles";
import { NodeRow } from "./node-row";
import { useSheet } from "./sheet-context";

/**
 * The screen for one item. `id === null` is the top of the tree, which lists the locations.
 * Every item has this same screen — a room lists its tasks and sub-rooms, a task lists its
 * sub-tasks — which is what lets anything be broken down further.
 */
export function NodeScreen({ id }: { id: string | null }) {
  const index = useTreeIndex();
  const today = useToday();
  const { openSheet } = useSheet();
  const completeTask = useCompleteTask();

  const node = id === null ? null : index.byId.get(id);
  if (id !== null && !node) {
    return (
      <div className="py-16 text-center">
        <p className="font-medium">This item no longer exists.</p>
        <Link href="/rooms" className="text-sm underline">
          Back to Rooms
        </Link>
      </div>
    );
  }

  const path = id === null ? [] : getPath(index, id);
  const timing = node ? getTaskTiming(node, today) : null;
  const views = getChildViews(index, id, today);

  return (
    <div className="flex flex-col gap-4">
      {node && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/rooms" />}>Rooms</BreadcrumbLink>
            </BreadcrumbItem>
            {path.map((step) => (
              <Fragment key={step.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {step.id === id ? (
                    <BreadcrumbPage>{step.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={`/rooms/${step.id}`} />}>{step.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{node?.name ?? "Rooms"}</h1>
          {node && timing && (
            <p className="text-sm">
              <span className={TASK_DUE_TEXT[timing.status]}>{formatDue(timing)}</span>
              <span className="text-muted-foreground">
                {" · "}
                {formatFrequency(node.frequency!)}
                {" · "}
                {node.lastCompleted ? `last done ${node.lastCompleted}` : "never done"}
              </span>
            </p>
          )}
        </div>
        {node && (
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={`Options for ${node.name}`}
            onClick={() => openSheet({ mode: "menu", nodeId: node.id })}
          >
            <EllipsisVerticalIcon className="size-5" />
          </Button>
        )}
      </header>

      {node && timing && (
        <Button size="lg" onClick={() => completeTask(node.id, node.name)}>
          <CheckIcon />
          Mark done
        </Button>
      )}

      {views.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {views.map((view) => (
            <NodeRow key={view.node.id} view={view} hasChildren={getChildren(index, view.node.id).length > 0} />
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {id === null
            ? "Start by adding a location, such as Home or Work."
            : timing
              ? "No sub-tasks. Add some to break this task into steps."
              : "Nothing here yet. Add a task, or a room to hold tasks."}
        </p>
      )}

      <Button variant="outline" size="lg" onClick={() => openSheet({ mode: "add", parentId: id })}>
        <PlusIcon />
        {id === null ? "Add a location" : timing ? "Add a sub-task" : "Add a task or room"}
      </Button>
    </div>
  );
}
