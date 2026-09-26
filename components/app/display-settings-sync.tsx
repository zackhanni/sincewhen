"use client";

import { useLayoutEffect } from "react";
import { applyDisplaySettings, followSystemTheme, getDisplaySettings } from "@/lib/display/display-settings";

/**
 * Keeps the page's theme and size in step with Settings, on every page (the app and the
 * landing page). The script in layout.tsx already applied them before the first paint; doing
 * it again here matters in development only, where React's Strict Mode remount resets <html>
 * to its JSX attributes and wipes what the script set. A layout effect runs before paint, so
 * nothing flashes. It also makes "Match device" follow the device while the page is open.
 */
export function DisplaySettingsSync() {
  useLayoutEffect(() => {
    applyDisplaySettings(getDisplaySettings());
    return followSystemTheme();
  }, []);
  return null;
}
