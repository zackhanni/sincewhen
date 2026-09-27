"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode } from "react";
import { DownloadIcon, Share2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  backupFileName,
  buildBackupText,
  buildCompactBackupText,
  readBackupText,
  summarizeData,
  type BackupReadResult,
} from "@/lib/backup/backup";
import { downloadTextFile, makeShareableFile, shareFile } from "@/lib/backup/send-file";
import { MAX_BACKUP_FILE_BYTES, daysBetween } from "@/lib/core";
import {
  getDisplaySettings,
  setDisplaySettings,
  type DisplaySettings,
  type SizeChoice,
  type StartScreenChoice,
  type ThemeChoice,
} from "@/lib/display/display-settings";
import { useDisplaySettings } from "@/lib/hooks/use-display-settings";
import { useToday } from "@/lib/hooks/use-today";
import { isInstalled, requestPersistentStorage } from "@/lib/pwa/pwa";
import { showError } from "@/lib/show-error";
import { CORRUPT_BACKUP_KEY } from "@/lib/store/app-store";
import { appStore, useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { InstallSteps } from "./install-steps";
import { openIntro } from "./intro";

/** Where the data being replaced by an import is parked, in case the import was a mistake. */
const BEFORE_IMPORT_KEY = "sincewhen:before-import";

const subscribeToNothing = () => () => { };

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SIZE_CHOICES: { value: SizeChoice; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
];

const START_CHOICES: { value: StartScreenChoice; label: string }[] = [
  { value: "folders", label: "Folders" },
  { value: "due", label: "Due" },
];

/** "theme: Dark, size: Large, opens on: Due" — only the settings given, so it also fits a partial set from a file. */
function describeDisplaySettings(settings: Partial<DisplaySettings>): string {
  const parts = [
    settings.theme && `theme: ${THEME_CHOICES.find((choice) => choice.value === settings.theme)?.label}`,
    settings.size && `size: ${SIZE_CHOICES.find((choice) => choice.value === settings.size)?.label}`,
    settings.startOn && `opens on: ${START_CHOICES.find((choice) => choice.value === settings.startOn)?.label}`,
  ];
  return parts.filter(Boolean).join(", ");
}

/** A row of buttons where exactly one is chosen, like the "Last done" choice in the task form. */
function ChoiceButtons<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {choices.map((choice) => (
        <Button
          key={choice.value}
          size="lg"
          variant={value === choice.value ? "default" : "outline"}
          aria-pressed={value === choice.value}
          onClick={() => onChange(choice.value)}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  );
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
  const displaySettings = useDisplaySettings();
  const [includeDisplaySettings, setIncludeDisplaySettings] = useState(false);
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
  const backupText = () => buildBackupText(data, today, includeDisplaySettings ? displaySettings : undefined);

  const saveToFile = () => {
    downloadTextFile(fileName, backupText());
    // A page cannot tell whether a download was kept, so starting one counts as backed up.
    appStore.getState().markBackedUp();
  };

  const share = async () => {
    try {
      const file = makeShareableFile(fileName, backupText());
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
    if (file.size > MAX_BACKUP_FILE_BYTES) {
      toast.error("This file is too big to be a Sincewhen backup.");
      return;
    }
    const result = readBackupText(await file.text());
    if (result.ok) setPendingImport(result);
    else toast.error(result.error);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    // Importing replaces everything, so keep what is being replaced. It is not shown anywhere;
    // it exists so a wrong import can be recovered from by hand.
    try {
      window.localStorage.setItem(BEFORE_IMPORT_KEY, buildCompactBackupText(data, today));
    } catch {
      // Storage full or unavailable: the import itself can still go ahead.
    }
    appStore.getState().replaceAllData(pendingImport.data);
    // Only the settings the file has; the rest stay as they are on this device.
    if (pendingImport.displaySettings) setDisplaySettings({ ...getDisplaySettings(), ...pendingImport.displaySettings });
    void requestPersistentStorage();
    setPendingImport(null);
    toast.success("Backup restored");
  };

  return (
    // Settings is read top to bottom, so it stays one column; this keeps it readable on a tablet.
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Section title="Display">
        <p className="text-sm text-muted-foreground">
          Saved on this device only. &ldquo;Match device&rdquo; follows your phone&rsquo;s light or dark setting, so the
          app goes dark at night if your phone does.
        </p>
        <p className="text-sm font-medium">Theme</p>
        <ChoiceButtons
          label="Theme"
          choices={THEME_CHOICES}
          value={displaySettings.theme}
          onChange={(theme) => setDisplaySettings({ ...displaySettings, theme })}
        />
        <p className="text-sm font-medium">Size</p>
        <ChoiceButtons
          label="Size"
          choices={SIZE_CHOICES}
          value={displaySettings.size}
          onChange={(size) => setDisplaySettings({ ...displaySettings, size })}
        />
        <p className="text-sm font-medium">Open the app on</p>
        <ChoiceButtons
          label="Open the app on"
          choices={START_CHOICES}
          value={displaySettings.startOn}
          onChange={(startOn) => setDisplaySettings({ ...displaySettings, startOn })}
        />
        <p className="text-sm text-muted-foreground">
          Folders shows which place or category needs the most attention. Due lists everything that is due, from
          everywhere, most urgent first.
        </p>
      </Section>

      <Section title="Back up">
        <p className="text-sm text-muted-foreground">
          Your tasks live only on this device. A backup file lets you move them to a new phone, or get
          them back if this one loses them.
        </p>
        <p className="text-sm">
          {current.tasks} {current.tasks === 1 ? "task" : "tasks"} in {current.folders}{" "}
          {current.folders === 1 ? "folder" : "folders"}.{" "}
          {lastBackupDate
            ? `Last backup: ${lastBackupDate} (${daysBetween(lastBackupDate, today)} days ago).`
            : "Never backed up."}
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={includeDisplaySettings}
            onChange={(event) => setIncludeDisplaySettings(event.target.checked)}
            className="mt-0.5 size-5"
          />
          <span>
            Include display settings ({describeDisplaySettings(displaySettings)}). Restoring the file then sets
            them on the other device too.
          </span>
        </label>
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
          <div role="alert" className="flex flex-col gap-3 rounded-lg border border-orange-400 bg-orange-50 p-3 text-sm dark:bg-orange-950">
            <p>
              This backup{pendingImport.exportedAt ? ` from ${pendingImport.exportedAt}` : ""} has{" "}
              <strong>
                {pendingImport.summary.tasks} tasks in {pendingImport.summary.folders} folders
              </strong>
              .
            </p>
            {pendingImport.displaySettings && (
              <p>It also sets this device&rsquo;s display ({describeDisplaySettings(pendingImport.displaySettings)}).</p>
            )}
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
              // `!== null`, not truthiness: the parked text can be an empty string, and the button
              // must not silently do nothing while the warning is still showing.
              if (parked !== null) downloadTextFile("sincewhen-unreadable-data.json", parked);
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
            <Button variant="ghost" size="lg" className="text-red-600 dark:text-red-400" onClick={() => setConfirmingDiscard(true)}>
              Discard the unreadable data
            </Button>
          )}
        </Section>
      )}

      <Section title="This device">
        {installed ? (
          <p className="text-sm">
            Installed as an app. It works without internet, and your data is safe from the browser&rsquo;s 7-day
            cleanup.
          </p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Running in a browser tab. It works without internet here too, but the browser may erase your tasks
              after a week away. Add it to your home screen:
            </p>
            <InstallSteps />
          </div>
        )}
      </Section>

      <Section title="About">
        <p className="text-sm">
          Sincewhen version {process.env.NEXT_PUBLIC_APP_VERSION}
          {process.env.NEXT_PUBLIC_COMMIT && (
            <span className="text-muted-foreground"> ({process.env.NEXT_PUBLIC_COMMIT})</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          The version is the date of the latest update. New versions arrive on their own the next time you open
          the app with internet.
        </p>
        <p className="text-sm text-muted-foreground">
          Free, with no account, no ads and no tracking. Your tasks stay on this device.
        </p>
        <Button size="lg" variant="outline" onClick={openIntro}>
          Show the intro tutorial
        </Button>
        {/* The public page about the app, handy for telling someone else about it. Styled like
            the button above so it reads as something to tap, not small print. `cn` is needed:
            it drops the base style's transparent border in favor of the outline one. */}
        <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Software product landing page
        </Link>
      </Section>
    </div>
  );
}
