"use client";

import { toast } from "sonner";
import { appStore } from "@/lib/store/use-app-store";
import { showError } from "@/lib/show-error";

/**
 * Returns a function that completes a task and shows a toast with an Undo button.
 * The toast names how many items were completed, because one tap can complete several
 * (due sub-tasks cascade down, and a finished parent auto-completes).
 */
export function useCompleteTask() {
  return (id: string, name: string) => {
    try {
      const undo = appStore.getState().completeTask(id);
      const others = undo.previous.length - 1;
      toast.success(others > 0 ? `Done: ${name} (+${others} more)` : `Done: ${name}`, {
        action: { label: "Undo", onClick: () => appStore.getState().undoCompletion(undo) },
      });
    } catch (error) {
      showError(error);
    }
  };
}
