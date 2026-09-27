"use client";

import { toast } from "sonner";
import { useStore } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { STORAGE_WARNING_CHARS } from "@/lib/core";
import { createAppStore, type AppState } from "./app-store";

/** So a run of failed saves shows one warning, not one per tap. Reset when saving works again. */
let saveFailureReported = false;

/** A fixed id lets the warning be taken down again once saving recovers. */
const SAVE_FAILURE_TOAST_ID = "save-failure";

/** So the "nearly full" warning shows once per launch, not on every tap. */
let nearlyFullReported = false;

/**
 * Characters the site will keep in storage once `key` holds `value`, counting every key. They
 * all share the browser's ~5 million, including the copy kept before an import, which can be as
 * big as the saved data itself.
 */
function projectedStorageChars(key: string, value: string): number {
  let total = key.length + value.length;
  for (let index = 0; index < window.localStorage.length; index++) {
    const otherKey = window.localStorage.key(index);
    if (otherKey === null || otherKey === key) continue;
    total += otherKey.length + (window.localStorage.getItem(otherKey)?.length ?? 0);
  }
  return total;
}

/**
 * Warns once per launch when everything the site stores passes STORAGE_WARNING_CHARS. The
 * completion log only grows and the browser's space is fixed, and nothing in the app can free
 * space yet (see docs/scaling-and-algorithm-audit.md), so the best it can do is say so while a
 * backup still captures everything. Call it after any write of the app's own keys.
 */
export function warnIfStorageNearlyFull(key: string, value: string): void {
  if (nearlyFullReported) return;
  try {
    if (projectedStorageChars(key, value) <= STORAGE_WARNING_CHARS) return;
  } catch {
    return; // Storage cannot be read; a failed save reports that on its own.
  }
  nearlyFullReported = true;
  toast.warning("This device's storage for Sincewhen is nearly full.", {
    description: "Back up from Settings now, so nothing is lost if saving stops.",
    duration: Infinity,
  });
}

/** The browser's "this site has used all its storage" error. Older Firefox used its own name. */
function isStorageFull(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

/**
 * localStorage, made safe to touch. It does not exist during server rendering, and reading it
 * throws in some private-browsing modes, so every call is guarded. A failed write must not crash
 * the tap that caused it, but it must not be silent either: the app would look fine while every
 * change was being lost, so the user is told once.
 */
const deviceStorage: StateStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      if (saveFailureReported) {
        // Saving works again, so the warning is no longer true. It never times out on its own.
        toast.dismiss(SAVE_FAILURE_TOAST_ID);
        saveFailureReported = false;
      }
      warnIfStorageNearlyFull(key, value);
    } catch (error) {
      console.error("Sincewhen could not save to this device", error);
      if (!saveFailureReported) {
        saveFailureReported = true;
        toast.error("Changes are not being saved on this device.", {
          description: isStorageFull(error)
            ? "The storage this browser gives Sincewhen is full. Back up from Settings now."
            : "Private browsing or blocked site data can cause this. Back up from Settings now.",
          duration: Infinity,
          id: SAVE_FAILURE_TOAST_ID,
        });
      }
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to remove if storage is unavailable.
    }
  },
};

/** The one store for the whole app. */
export const appStore = createAppStore(deviceStorage);

/** Read a slice of the store: `const data = useAppStore((state) => state.data)`. */
export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}
