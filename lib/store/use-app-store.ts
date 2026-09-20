"use client";

import { toast } from "sonner";
import { useStore } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { createAppStore, type AppState } from "./app-store";

/**
 * localStorage, made safe to touch. It does not exist during server rendering, and reading it
 * throws in some private-browsing modes, so every call is guarded. A failed write must not crash
 * the tap that caused it, but it must not be silent either: the app would look fine while every
 * change was being lost, so the user is told once.
 */
/** So a run of failed saves shows one warning, not one per tap. Reset when saving works again. */
let saveFailureReported = false;

/** A fixed id lets the warning be taken down again once saving recovers. */
const SAVE_FAILURE_TOAST_ID = "save-failure";

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
    } catch (error) {
      console.error("Sincewhen could not save to this device", error);
      if (!saveFailureReported) {
        saveFailureReported = true;
        toast.error("Changes are not being saved on this device.", {
          description: "Private browsing or a full device can cause this. Back up from Settings now.",
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
