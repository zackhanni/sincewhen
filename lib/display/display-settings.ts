import { z } from "@/lib/core/zod";

// How the app looks on this device: light or dark, how big everything is drawn, and which screen
// it opens on. Kept apart from the task data on purpose — a phone and a tablet can want
// different sizes — and only put into a backup file when the user ticks the box for it.

export const displaySettingsSchema = z.object({
  /** "system" follows the device's own light/dark setting, including a sunset schedule. */
  theme: z.enum(["light", "dark", "system"]),
  /** "large" draws text, buttons and tap targets bigger, for people who find small text hard to read. */
  size: z.enum(["default", "large"]),
  /** The screen the app opens on: the folder overview, or the flat list of what is due. */
  startOn: z.enum(["folders", "due"]),
});

export type DisplaySettings = z.infer<typeof displaySettingsSchema>;
export type ThemeChoice = DisplaySettings["theme"];
export type SizeChoice = DisplaySettings["size"];
export type StartScreenChoice = DisplaySettings["startOn"];

/**
 * Folders first: Zack finds the color overview (which room needs work, cleaning or exercise)
 * more useful than the mixed Due list. Under test with other users (2026-09-26).
 */
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = { theme: "system", size: "default", startOn: "folders" };

export const DISPLAY_SETTINGS_KEY = "sincewhen:display";

/**
 * The browser bar color for each resolved theme: the page background, as a hex color. The light one
 * is also the default in app/layout.tsx and the install color in app/manifest.ts.
 */
export const BAR_COLOR = { light: "#ffffff", dark: "#0a0a0a" } as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * The fields of `raw` that are valid settings, and nothing else. Checked one by one, so a bad or
 * missing value never takes the others down with it — and a file made before a setting existed
 * simply lacks that field.
 */
export function readValidDisplayFields(raw: unknown): Partial<DisplaySettings> {
  if (typeof raw !== "object" || raw === null) return {};
  const value = raw as Record<string, unknown>;
  const fields: Partial<DisplaySettings> = {};
  const theme = displaySettingsSchema.shape.theme.safeParse(value.theme);
  if (theme.success) fields.theme = theme.data;
  const size = displaySettingsSchema.shape.size.safeParse(value.size);
  if (size.success) fields.size = size.data;
  const startOn = displaySettingsSchema.shape.startOn.safeParse(value.startOn);
  if (startOn.success) fields.startOn = startOn.data;
  return fields;
}

/** Reads the saved settings. Anything missing or unreadable falls back to the default, field by field. */
export function parseDisplaySettings(raw: unknown): DisplaySettings {
  return { ...DEFAULT_DISPLAY_SETTINGS, ...readValidDisplayFields(raw) };
}

export function readDisplaySettings(): DisplaySettings {
  try {
    const text = window.localStorage.getItem(DISPLAY_SETTINGS_KEY);
    return parseDisplaySettings(text === null ? null : JSON.parse(text));
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

/** Whether the page should be dark right now. "system" asks the device. */
export function resolvesToDark(theme: ThemeChoice): boolean {
  if (theme === "system") return window.matchMedia(DARK_QUERY).matches;
  return theme === "dark";
}

/** Puts the settings on the page: the `dark` class and `data-size` on <html>, and the browser bar color. */
export function applyDisplaySettings(settings: DisplaySettings): void {
  const root = document.documentElement;
  const dark = resolvesToDark(settings.theme);
  root.classList.toggle("dark", dark);
  // Lets the browser draw its own parts (scroll bars, date pickers) to match.
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.size = settings.size;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? BAR_COLOR.dark : BAR_COLOR.light);
}

/**
 * The same job as `applyDisplaySettings`, as a script that runs in <head> while the page is still
 * being read, before anything is drawn. Without it, someone in dark mode would see a white flash
 * on every launch, until React loads. It is plain ES5 because it runs before any of our code
 * exists. Keep it in step with `applyDisplaySettings` above. The theme-color meta tag comes from
 * the viewport metadata, which Next.js renders earlier in <head>, so it is there to update.
 */
export const DISPLAY_SETTINGS_SCRIPT = `(function(){try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(DISPLAY_SETTINGS_KEY)})||"{}")||{};
var dark=s.theme==="dark"||(s.theme!=="light"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);
var root=document.documentElement;
if(dark)root.classList.add("dark");
root.style.colorScheme=dark?"dark":"light";
if(s.size==="large")root.dataset.size="large";
var bar=document.querySelector('meta[name="theme-color"]');
if(bar)bar.setAttribute("content",dark?${JSON.stringify(BAR_COLOR.dark)}:${JSON.stringify(BAR_COLOR.light)});
}catch(e){}})()`;

// --- The current settings, shared by every component that shows or changes them -------------

const listeners = new Set<() => void>();
let current: DisplaySettings | null = null;

export function getDisplaySettings(): DisplaySettings {
  current ??= readDisplaySettings();
  return current;
}

/** Saves the new settings, applies them to the page, and tells every subscriber. */
export function setDisplaySettings(next: DisplaySettings): void {
  current = next;
  try {
    window.localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: the choice still applies until the app is closed.
  }
  applyDisplaySettings(next);
  for (const listener of listeners) listener();
}

export function subscribeToDisplaySettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Keeps "system" in step with the device while the app is open: when the phone switches to dark
 * at sunset, the app follows without a restart. Returns a function that stops listening.
 */
export function followSystemTheme(): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (getDisplaySettings().theme === "system") applyDisplaySettings(getDisplaySettings());
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
