"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_DISPLAY_SETTINGS,
  getDisplaySettings,
  subscribeToDisplaySettings,
  type DisplaySettings,
} from "@/lib/display/display-settings";

/** This device's theme, size and start screen, kept current when Settings changes them. */
export function useDisplaySettings(): DisplaySettings {
  // The server has no device storage, so it renders with the defaults; the browser then reads
  // the saved choice. The page itself was already styled by the script in layout.tsx.
  return useSyncExternalStore(subscribeToDisplaySettings, getDisplaySettings, () => DEFAULT_DISPLAY_SETTINGS);
}
