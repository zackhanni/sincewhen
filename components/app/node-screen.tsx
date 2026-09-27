"use client";

import Link from "next/link";
import { Fragment } from "react";
import { CheckIcon, ChevronLeftIcon, EllipsisVerticalIcon, PlusIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { roomHref } from "@/lib/routes";
import { TASK_DUE_TEXT } from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import { NodeRow, ROW_LIST } from "./node-row";
import { StartWithExamplesButton } from "./start-with-examples-button";
import { useSheet } from "./sheet-context";
import { SwipeBack } from "./swipe-back";

/** Which of the three kinds of screen this is decides its empty text and its add button. */
type ScreenKind = "top" | "task" | "folder";

function screenKind(id: string | null, isTask: boolean): ScreenKind {
  if (id === null) return "top";
  return isTask ? "task" : "folder";
}

const EMPTY_TEXT: Record<ScreenKind, string> = {
  top: "Start with a location or a category, such as Home, Work or Cleaning.",
  task: "No sub-tasks. Add some to break this task into steps.",
  folder: "Nothing here yet. Add a task, or a folder to hold tasks.",
};

const ADD_LABEL: Record<ScreenKind, string> = {
  top: "Add a location or category",
  task: "Add a sub-task",
  folder: "Add a task or folder",
};

/**
 * The screen for one item. `id === null` is the top of the tree, which lists the locations and
 * categories. It carries the app's name, because top-level items are not always places (Home,
 * Work) — they can just as well be categories (Cleaning, Exercise).
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
        <Link href={roomHref(null)} className="text-sm underline">
          Back to Sincewhen
        </Link>
      </div>
    );
  }

  const path = id === null ? [] : getPath(index, id);
  const timing = node ? getTaskTiming(node, today) : null;
  const kind = screenKind(id, timing !== null);
  const views = getChildViews(index, id, today);
  // "Back" always means one level up, to the item this one sits in, whichever way the user
  // arrived. The breadcrumb covers jumping further.
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const backHref = roomHref(parent?.id ?? null);

  return (
    <div className="flex flex-col gap-4">
      {node && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={roomHref(null)} />}>Sincewhen</BreadcrumbLink>
            </BreadcrumbItem>
            {path.map((step) => (
              <Fragment key={step.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {step.id === id ? (
                    <BreadcrumbPage>{step.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={roomHref(step.id)} />}>{step.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <header className="flex items-start gap-2">
        {node && (
          <Link
            href={backHref}
            aria-label={`Back to ${parent?.name ?? "Sincewhen"}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "-ml-2")}
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{node?.name ?? "Sincewhen"}</h1>
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
      {node && <SwipeBack href={backHref} />}

      {/* Full width on a phone, where it is easy to hit; its natural width on a wide screen. */}
      {node && timing && (
        <Button size="lg" className="sm:w-fit sm:px-6" onClick={() => completeTask(node.id, node.name)}>
          <CheckIcon />
          Mark done
        </Button>
      )}

      {views.length > 0 ? (
        <ul className={ROW_LIST}>
          {views.map((view) => (
            <NodeRow key={view.node.id} view={view} hasChildren={getChildren(index, view.node.id).length > 0} />
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {EMPTY_TEXT[kind]}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="sm:w-fit sm:px-6"
          onClick={() => openSheet({ mode: "add", parentId: id })}
        >
          <PlusIcon />
          {ADD_LABEL[kind]}
        </Button>
        {/* An empty app can be filled with common chores to try it out, or to keep. */}
        {id === null && views.length === 0 && <StartWithExamplesButton />}
      </div>
    </div>
  );
}
