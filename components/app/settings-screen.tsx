"use client";

import { useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode } from "react";
import { DownloadIcon, Share2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backupFileName, buildBackupText, readBackupText, summarizeData, type BackupReadResult } from "@/lib/backup/backup";
import { downloadTextFile, makeShareableFile, shareFile } from "@/lib/backup/send-file";
import { daysBetween } from "@/lib/core";
import { useToday } from "@/lib/hooks/use-today";
import { isInstalled } from "@/lib/pwa/pwa";
import { showError } from "@/lib/show-error";
import { CORRUPT_BACKUP_KEY } from "@/lib/store/app-store";
import { appStore, useAppStore } from "@/lib/store/use-app-store";

/** Where the data being replaced by an import is parked, in case the import was a mistake. */
const BEFORE_IMPORT_KEY = "sincewhen:before-import";

const subscribeToNothing = () => () => {};

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const lastBackupDate = useAppStore((state) => state.lastBackupDate);
  const hasUnreadableBackup = useAppStore((state) => state.hasUnreadableBackup);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [pendingImport, setPendingImport] = useState<Extract<BackupReadResult, { ok: true }> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Browser-only facts, read without a server/client mismatch (see install-hint.tsx).
  const installed = useSyncExternalStore(subscribeToNothing, isInstalled, () => false);
  const canShareFiles = useSyncExternalStore(
    subscribeToNothing,
    () => makeShareableFile("probe.json", "{}") !== null,
    () => false,
  );

  const current = summarizeData(data);
  const fileName = backupFileName(today);

  const saveToFile = () => {
    downloadTextFile(fileName, buildBackupText(data, today));
    // A page cannot tell whether a download was kept, so starting one counts as backed up.
    appStore.getState().markBackedUp();
  };

  const share = async () => {
    try {
      const file = makeShareableFile(fileName, buildBackupText(data, today));
      if (file && (await shareFile(file))) {
        appStore.getState().markBackedUp();
        toast.success("Backup shared");
      }
    } catch (error) {
      showError(error);
    }
  };

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear the input so picking the same file again still fires this handler.
    event.target.value = "";
    if (!file) return;
    const result = readBackupText(await file.text());
    if (result.ok) setPendingImport(result);
    else toast.error(result.error);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    // Importing replaces everything, so keep what is being replaced. It is not shown anywhere;
    // it exists so a wrong import can be recovered from by hand.
    try {
      window.localStorage.setItem(BEFORE_IMPORT_KEY, buildBackupText(data, today));
    } catch {
      // Storage full or unavailable: the import itself can still go ahead.
    }
    appStore.getState().replaceAllData(pendingImport.data);
    setPendingImport(null);
    toast.success("Backup restored");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Section title="Back up">
        <p className="text-sm text-muted-foreground">
          Your tasks live only on this device. A backup file lets you move them to a new phone, or get
          them back if this one loses them.
        </p>
        <p className="text-sm">
          {current.locations} {current.locations === 1 ? "location" : "locations"}, {current.folders} rooms,{" "}
          {current.tasks} tasks.{" "}
          {lastBackupDate
            ? `Last backup: ${lastBackupDate} (${daysBetween(lastBackupDate, today)} days ago).`
            : "Never backed up."}
        </p>
        {canShareFiles && (
          <Button size="lg" onClick={share}>
            <Share2Icon />
            Share backup (text, email, AirDrop)
          </Button>
        )}
        <Button size="lg" variant={canShareFiles ? "outline" : "default"} onClick={saveToFile}>
          <DownloadIcon />
          Save backup file
        </Button>
      </Section>

      <Section title="Restore">
        <p className="text-sm text-muted-foreground">
          Open a backup file made by Sincewhen. To move to a new phone: share the backup to yourself,
          save the file on the new phone, then choose it here.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          onChange={pickFile}
          className="sr-only"
          aria-label="Backup file"
        />
        {pendingImport ? (
          <div role="alert" className="flex flex-col gap-3 rounded-lg border border-orange-400 bg-orange-50 p-3 text-sm">
            <p>
              This backup{pendingImport.exportedAt ? ` from ${pendingImport.exportedAt}` : ""} has{" "}
              <strong>
                {pendingImport.summary.locations} locations, {pendingImport.summary.folders} rooms and{" "}
                {pendingImport.summary.tasks} tasks
              </strong>
              .
            </p>
            <p>
              It will <strong>replace</strong> the {data.nodes.length} items on this device. They will not be
              merged.
            </p>
            <Button variant="destructive" size="lg" onClick={confirmImport}>
              Replace my data
            </Button>
            <Button variant="outline" size="lg" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="lg" variant="outline" onClick={() => fileInput.current?.click()}>
            <UploadIcon />
            Choose a backup file
          </Button>
        )}
      </Section>

      {hasUnreadableBackup && (
        <Section title="Unreadable data">
          <p className="text-sm text-muted-foreground">
            Saved data on this device could not be read at some point, and the original was kept. Save it
            somewhere safe first; it may be repairable. The warning at the top stays until you discard it.
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              // Read at the moment of the tap, so the file is whatever is parked right now.
              const parked = readStorage(CORRUPT_BACKUP_KEY);
              if (parked) downloadTextFile("sincewhen-unreadable-data.json", parked);
            }}
          >
            <DownloadIcon />
            Save the unreadable data
          </Button>
          {confirmingDiscard ? (
            <>
              <Button variant="destructive" size="lg" onClick={() => appStore.getState().discardUnreadableBackup()}>
                Yes, delete it for good
              </Button>
              <Button variant="outline" size="lg" onClick={() => setConfirmingDiscard(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="lg" className="text-red-600" onClick={() => setConfirmingDiscard(true)}>
              Discard the unreadable data
            </Button>
          )}
        </Section>
      )}

      <Section title="This device">
        <p className="text-sm">
          {installed
            ? "Installed as an app. Your data is safe from the browser's 7-day cleanup."
            : "Running in a browser tab. Install it from the Share menu (Add to Home Screen), or the browser may erase your tasks after a week away."}
        </p>
      </Section>
    </div>
  );
}
