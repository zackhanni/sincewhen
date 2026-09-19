import { parseAppData, type AppData, type CalendarDate } from "@/lib/core";

// The backup file is simply the saved AppData as JSON, plus the date it was made. Reading one
// goes through the same parseAppData check as loading from the device, so a hand-edited or
// damaged file is refused rather than imported.

export type BackupSummary = {
  locations: number;
  tasks: number;
  folders: number;
  completions: number;
};

export type BackupReadResult =
  | { ok: true; data: AppData; exportedAt: string | null; summary: BackupSummary }
  | { ok: false; error: string };

export function backupFileName(today: CalendarDate): string {
  return `sincewhen-backup-${today}.json`;
}

export function buildBackupText(data: AppData, today: CalendarDate): string {
  // Indented so the file is readable (and diff-able) if someone opens it.
  return JSON.stringify({ exportedAt: today, ...data }, null, 2);
}

/** Counts shown before an import, so the user can tell it is the backup they meant to pick. */
export function summarizeData(data: AppData): BackupSummary {
  const locations = data.nodes.filter((node) => node.parentId === null).length;
  const tasks = data.nodes.filter((node) => node.frequency !== null).length;
  return {
    locations,
    tasks,
    // Rooms and sub-rooms: every non-task that is not itself a location.
    folders: data.nodes.filter((node) => node.frequency === null && node.parentId !== null).length,
    completions: data.completions.length,
  };
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

  const exportedAt =
    typeof raw === "object" && raw !== null && "exportedAt" in raw && typeof raw.exportedAt === "string"
      ? raw.exportedAt
      : null;
  return { ok: true, data: parsed.data, exportedAt, summary: summarizeData(parsed.data) };
}
