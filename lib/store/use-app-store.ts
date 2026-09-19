"use client";

import { useStore } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { createAppStore, type AppState } from "./app-store";

/**
 * localStorage, made safe to touch. It does not exist during server rendering, and reading it
 * throws in some private-browsing modes, so every call is guarded. A failed write is reported
 * to the console rather than crashing the tap that caused it.
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
    } catch (error) {
      console.error("Sincewhen could not save to this device", error);
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
