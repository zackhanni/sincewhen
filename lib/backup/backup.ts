import {
  BACKUP_NUDGE_DAYS,
  FIRST_BACKUP_NUDGE_DAYS,
  daysBetween,
  parseAppData,
  type AppData,
  type CalendarDate,
} from "@/lib/core";
import { readValidDisplayFields, type DisplaySettings } from "@/lib/display/display-settings";

// The backup file is simply the saved AppData as JSON, plus the date it was made and, if the
// user ticked the box, this device's display settings. Reading one goes through the same
// parseAppData check as loading from the device, so a hand-edited or damaged file is refused
// rather than imported.
//
// `displaySettings` sits beside the AppData fields, not inside them, and is optional. That keeps
// every backup readable both ways: an older app ignores the extra field (zod drops keys it does
// not know), and a file without it imports as before. Inside it, each setting is read on its
// own: one the file lacks (it was made before that setting existed) or cannot read is left as
// it is on the device, rather than reset or blocking the rest.

export type BackupSummary = {
  tasks: number;
  /** Everything that is not a task: locations, categories, rooms and any folder inside them. */
  folders: number;
  completions: number;
};

export type BackupReadResult =
  | {
      ok: true;
      data: AppData;
      exportedAt: string | null;
      summary: BackupSummary;
      /** Only the settings the file has and that are valid; null when there are none. */
      displaySettings: Partial<DisplaySettings> | null;
    }
  | { ok: false; error: string };

export function backupFileName(today: CalendarDate): string {
  return `sincewhen-backup-${today}.json`;
}

/** Pass `displaySettings` only when the user chose to include them. */
export function buildBackupText(data: AppData, today: CalendarDate, displaySettings?: DisplaySettings): string {
  // Indented so the file is readable (and diff-able) if someone opens it.
  return JSON.stringify({ exportedAt: today, ...data, ...(displaySettings && { displaySettings }) }, null, 2);
}

/**
 * The same backup without the indentation, for the copy kept on the device before an import.
 * That copy shares the browser's ~5 MB with the saved data, and indentation adds about 30%.
 * It still reads back with `readBackupText`.
 */
export function buildCompactBackupText(data: AppData, today: CalendarDate): string {
  return JSON.stringify({ exportedAt: today, ...data });
}

/** Counts shown before an import, so the user can tell it is the backup they meant to pick. */
export function summarizeData(data: AppData): BackupSummary {
  const tasks = data.nodes.filter((node) => node.frequency !== null).length;
  return { tasks, folders: data.nodes.length - tasks, completions: data.completions.length };
}

/**
 * Whether the Due tab should suggest a backup. Nothing saved yet means nothing to lose. Someone
 * who has never backed up is first asked a week after their oldest item was added (`createdAt`),
 * so a new user is not nagged on day one; after a backup, every 30 days.
 */
export function isBackupDue(data: AppData, lastBackupDate: CalendarDate | null, today: CalendarDate): boolean {
  if (data.nodes.length === 0) return false;
  if (lastBackupDate !== null) return daysBetween(lastBackupDate, today) >= BACKUP_NUDGE_DAYS;
  // Calendar dates compare correctly as strings (see CalendarDate).
  const firstAdded = data.nodes.reduce((oldest, node) => (node.createdAt < oldest ? node.createdAt : oldest), today);
  return daysBetween(firstAdded, today) >= FIRST_BACKUP_NUDGE_DAYS;
}

export function readBackupText(text: string): BackupReadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not a Sincewhen backup (it is not valid JSON)." };
  }
  const parsed = parseAppData(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const extras = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const exportedAt = typeof extras.exportedAt === "string" ? extras.exportedAt : null;
  const displaySettings = readValidDisplayFields(extras.displaySettings);
  return {
    ok: true,
    data: parsed.data,
    exportedAt,
    summary: summarizeData(parsed.data),
    displaySettings: Object.keys(displaySettings).length > 0 ? displaySettings : null,
  };
}
