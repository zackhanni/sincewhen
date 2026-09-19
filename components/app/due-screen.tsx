"use client";

import Link from "next/link";
import { getChildren, isOverdue, listAttentionItems, summarizeNode } from "@/lib/core";
import { useToday } from "@/lib/hooks/use-today";
import { useTreeIndex } from "@/lib/hooks/use-tree-index";
import { useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { NodeRow } from "./node-row";

/** The home screen: everything overdue or due soon, most urgent first, across all rooms. */
export function DueScreen() {
  const index = useTreeIndex();
  const today = useToday();
  const activeLocationId = useAppStore((state) => state.activeLocationId);
  const setActiveLocation = useAppStore((state) => state.setActiveLocation);

  const locations = getChildren(index, null);
  const items = listAttentionItems(index, activeLocationId, today);
  const overdueCount = items.filter((item) => isOverdue(item.timing.status)).length;

  const filters = [{ id: null as string | null, name: "All" }, ...locations];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Due</h1>
        <p className="text-sm text-muted-foreground">
          {overdueCount > 0 ? `${overdueCount} overdue` : "Nothing overdue"}
          {items.length > overdueCount && ` · ${items.length - overdueCount} coming up`}
        </p>
      </header>

      {/* The location filter only earns its space once there is more than one location. */}
      {locations.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {filters.map((filter) => (
            <button
              key={filter.id ?? "all"}
              type="button"
              aria-pressed={filter.id === activeLocationId}
              onClick={() => setActiveLocation(filter.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                filter.id === activeLocationId ? "border-foreground bg-foreground text-background" : "bg-card",
              )}
            >
              {filter.name}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map(({ node, timing, path }) => (
            <NodeRow
              key={node.id}
              view={{ node, timing, summary: summarizeNode(index, node.id, today) }}
              hasChildren={getChildren(index, node.id).length > 0}
              location={path.slice(0, -1).map((step) => step.name).join(" › ")}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {locations.length === 0 ? (
            <>
              <p className="mb-2 font-medium text-foreground">Welcome to Sincewhen</p>
              <p>
                Add a location and some tasks in{" "}
                <Link href="/rooms" className="underline">
                  Rooms
                </Link>
                . Tasks appear here when they come due.
              </p>
            </>
          ) : (
            <p>All caught up. Nothing is due soon.</p>
          )}
        </div>
      )}
    </div>
  );
}
