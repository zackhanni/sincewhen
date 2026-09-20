"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CopyIcon, FolderInputIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { getDescendants, listPlacementTargets, type TaskNode, type TreeIndex } from "@/lib/core";
import { useTreeIndex } from "@/lib/hooks/use-tree-index";
import { requestPersistentStorage } from "@/lib/pwa/pwa";
import { roomHref } from "@/lib/routes";
import { showError } from "@/lib/show-error";
import { appStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { NodeForm, type NodeFormResult } from "./node-form";
import { useSheet, type SheetState } from "./sheet-context";

/**
 * The single bottom sheet of the app. What it shows depends on `sheet.mode`: the options menu,
 * the add / edit form, the move or duplicate picker, or the delete confirmation.
 */
export function NodeSheet() {
  const { sheet, closeSheet } = useSheet();
  const index = useTreeIndex();

  return (
    <Drawer open={sheet !== null} onOpenChange={(open) => !open && closeSheet()} showSwipeHandle>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* `key` gives each opening a fresh form, so values typed last time do not linger. */}
          {sheet && <SheetBody key={JSON.stringify(sheet)} sheet={sheet} index={index} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SheetHeading({ title, description }: { title: string; description?: string }) {
  return (
    <DrawerHeader className="px-0">
      <DrawerTitle>{title}</DrawerTitle>
      {description && <DrawerDescription>{description}</DrawerDescription>}
    </DrawerHeader>
  );
}

function SheetBody({ sheet, index }: { sheet: SheetState; index: TreeIndex }) {
  const { closeSheet } = useSheet();

  if (sheet.mode === "add") {
    const parent = sheet.parentId === null ? undefined : index.byId.get(sheet.parentId);
    const submit = (result: NodeFormResult) => {
      try {
        appStore.getState().addNode({
          parentId: sheet.parentId,
          name: result.name,
          frequency: result.frequency,
          lastCompleted: result.lastCompleted ?? null,
        });
        // There is now something worth protecting, and this is a user action, which is when
        // browsers expect to be asked. It does nothing if storage is already persistent.
        void requestPersistentStorage();
        closeSheet();
      } catch (error) {
        showError(error);
      }
    };
    return (
      <>
        <SheetHeading title={parent ? `Add to ${parent.name}` : "Add a location"} />
        {/* A top-level item is a place (Home, Work), so it starts as a folder; anything inside
            a place is most often a task. Either can be switched in the form. */}
        <NodeForm startsRepeating={sheet.parentId !== null} submitLabel="Add" onSubmit={submit} />
      </>
    );
  }

  const node = index.byId.get(sheet.nodeId);
  // The item can vanish while the sheet is closing (it was just deleted). Render nothing.
  if (!node) return null;

  switch (sheet.mode) {
    case "menu":
      return <MenuBody node={node} />;
    case "edit":
      return (
        <>
          <SheetHeading title={`Edit ${node.name}`} />
          <NodeForm
            node={node}
            startsRepeating={false}
            submitLabel="Save"
            onSubmit={(result) => {
              try {
                appStore.getState().updateNode(node.id, result);
                closeSheet();
              } catch (error) {
                showError(error);
              }
            }}
          />
        </>
      );
    case "move":
      return <PlacementBody node={node} index={index} action="move" />;
    case "duplicate":
      return <PlacementBody node={node} index={index} action="duplicate" />;
    case "delete":
      return <DeleteBody node={node} index={index} />;
  }
}

function MenuBody({ node }: { node: TaskNode }) {
  const { openSheet } = useSheet();
  const items = [
    { label: "Edit", icon: PencilIcon, open: () => openSheet({ mode: "edit", nodeId: node.id }) },
    { label: "Add an item inside", icon: PlusIcon, open: () => openSheet({ mode: "add", parentId: node.id }) },
    { label: "Duplicate", icon: CopyIcon, open: () => openSheet({ mode: "duplicate", nodeId: node.id }) },
    { label: "Move", icon: FolderInputIcon, open: () => openSheet({ mode: "move", nodeId: node.id }) },
  ];
  return (
    <>
      <SheetHeading title={node.name} />
      <div className="flex flex-col gap-1">
        {items.map(({ label, icon: Icon, open }) => (
          <Button key={label} variant="ghost" size="lg" className="justify-start gap-3" onClick={open}>
            <Icon className="size-5" />
            {label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="lg"
          className="justify-start gap-3 text-red-600"
          onClick={() => openSheet({ mode: "delete", nodeId: node.id })}
        >
          <Trash2Icon className="size-5" />
          Delete
        </Button>
      </div>
    </>
  );
}

/** The destination picker shared by Move and Duplicate. Only legal destinations are listed. */
function PlacementBody({ node, index, action }: { node: TaskNode; index: TreeIndex; action: "move" | "duplicate" }) {
  const { closeSheet } = useSheet();
  // Copies into another room usually describe work not done there yet, so "due now" is the default.
  const [resetCompletion, setResetCompletion] = useState(true);
  const targets = listPlacementTargets(index, node.id, { excludeOwnBranch: action === "move" });

  const choose = (parentId: string | null) => {
    try {
      if (action === "move") appStore.getState().moveNode(node.id, parentId);
      else appStore.getState().duplicateNode(node.id, parentId, resetCompletion);
      toast.success(action === "move" ? `Moved ${node.name}` : `Duplicated ${node.name}`);
      closeSheet();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <>
      <SheetHeading
        title={action === "move" ? `Move ${node.name}` : `Duplicate ${node.name}`}
        description={action === "move" ? "Choose where it goes." : "Choose where the copy goes."}
      />
      {action === "duplicate" && (
        <label className="mb-3 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={resetCompletion}
            onChange={(event) => setResetCompletion(event.target.checked)}
            className="size-5"
          />
          Start the copy as never done (due now)
        </label>
      )}
      <ul className="flex flex-col gap-1">
        {targets.map(({ node: target, depth }) => {
          const isCurrentParent = action === "move" && (target?.id ?? null) === node.parentId;
          return (
            <li key={target?.id ?? "top"}>
              <Button
                variant="ghost"
                size="lg"
                disabled={isCurrentParent}
                className={cn("w-full justify-start", target === null && "italic")}
                // Indent by depth so the list reads as the tree it represents.
                style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
                onClick={() => choose(target?.id ?? null)}
              >
                {target?.name ?? "Top level (a new location)"}
                {isCurrentParent && <span className="ml-2 text-xs text-muted-foreground">current</span>}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DeleteBody({ node, index }: { node: TaskNode; index: TreeIndex }) {
  const { closeSheet } = useSheet();
  const router = useRouter();
  const viewedId = useSearchParams().get("id");
  const insideCount = getDescendants(index, node.id).length;

  const confirmDelete = () => {
    try {
      appStore.getState().deleteNode(node.id);
      toast.success(`Deleted ${node.name}`);
      closeSheet();
      // If we are looking at the item that was just deleted, step out to where it lived.
      if (viewedId === node.id) router.replace(roomHref(node.parentId));
    } catch (error) {
      showError(error);
    }
  };

  return (
    <>
      <SheetHeading
        title={`Delete ${node.name}?`}
        description={
          insideCount > 0
            ? `This also deletes the ${insideCount} ${insideCount === 1 ? "item" : "items"} inside it. This cannot be undone.`
            : "This cannot be undone."
        }
      />
      <div className="flex flex-col gap-2">
        <Button variant="destructive" size="lg" onClick={confirmDelete}>
          Delete
        </Button>
        <Button variant="outline" size="lg" onClick={closeSheet}>
          Cancel
        </Button>
      </div>
    </>
  );
}
