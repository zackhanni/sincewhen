"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { CheckIcon, CircleAlertIcon, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isInstalled } from "@/lib/pwa/pwa";
import { SITE_HOST } from "@/lib/site";
import { ROOM_BADGE, ROOM_BORDER, TASK_BAR, TASK_DUE_TEXT } from "@/lib/status-styles";
import { useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { InstallSteps } from "./install-steps";
import { StartWithExamplesButton } from "./start-with-examples-button";

// The walkthrough shown on launch until someone ticks "Don't show this again" or reads it to the
// end. Settings can open it again. Whether it is open lives here, outside React, so Settings can
// open it without the two components sharing a parent.

const DISMISSED_KEY = "sincewhen:intro-dismissed";

let isOpen = false;
/** So it opens once per launch, not every time the user switches tabs. */
let launchCheckDone = false;
const introListeners = new Set<() => void>();

function setIntroOpen(open: boolean) {
  isOpen = open;
  for (const listener of introListeners) listener();
}

function subscribeToIntro(listener: () => void) {
  introListeners.add(listener);
  return () => introListeners.delete(listener);
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage unavailable: the intro will simply show again next launch.
  }
}

/** Opens the intro on launch unless the user has asked not to see it again. Call once saved data has loaded. */
export function showIntroOnLaunch() {
  if (launchCheckDone) return;
  launchCheckDone = true;
  if (!wasDismissed()) setIntroOpen(true);
}

/** Opens the intro on request (Settings > Show the intro tutorial). */
export function openIntro() {
  setIntroOpen(true);
}

// A computer with a mouse. Phones and tablets report a coarse pointer, even an iPad in landscape.
const DESKTOP_QUERY = "(hover: hover) and (pointer: fine)";
const subscribeToNothing = () => () => {};

type Page = { title: string; body: ReactNode };

/** A task row as it looks in the app, reduced to what the color lesson needs. */
function SampleTask({ status, due, name }: { status: keyof typeof TASK_BAR; due: string; name: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-l-4 bg-card px-3 py-2", TASK_BAR[status])}>
      <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium">
          {status === "severe" && <CircleAlertIcon className="size-4 shrink-0 text-red-600 dark:text-red-400" />}
          {name}
        </span>
        <span className={cn("block text-xs", TASK_DUE_TEXT[status])}>{due}</span>
      </span>
    </div>
  );
}

function SampleFolder({ level, name, overdue }: { level: keyof typeof ROOM_BORDER; name: string; overdue?: number }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border-2 bg-card px-3 py-2", ROOM_BORDER[level])}>
      <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 font-medium">{name}</span>
      {overdue !== undefined && (
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ROOM_BADGE[level])}>{overdue} overdue</span>
      )}
    </div>
  );
}

function buildPages({ onDesktop, installed }: { onDesktop: boolean; installed: boolean }): Page[] {
  const pages: Page[] = [
    {
      title: "Welcome to Sincewhen",
      body: (
        <>
          <p>
            For the things you do every so often: change the air filter, wash the sheets, book the dentist.
          </p>
          <p>
            Each task comes due a set time after you <strong>last did it</strong>, not on a fixed date. Do it late,
            and the next one simply counts from the day you did.
          </p>
        </>
      ),
    },
    {
      title: "Folders inside folders",
      body: (
        <>
          <p>
            Start with a location or a category, such as Home, Car or Cleaning. Put rooms or more folders inside,
            then tasks. A task can have its own sub-tasks.
          </p>
          <ul className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
            <li className="flex items-center gap-2">
              <FolderIcon className="size-4 text-muted-foreground" /> Home
            </li>
            <li className="flex items-center gap-2 pl-5">
              <FolderIcon className="size-4 text-muted-foreground" /> Kitchen
            </li>
            <li className="pl-11">Clean the fridge &middot; every 3 months</li>
            <li className="pl-11">Replace the sponge &middot; every 2 weeks</li>
          </ul>
        </>
      ),
    },
    {
      title: "Check it off, the clock restarts",
      body: (
        <>
          <p>
            Tap the circle next to a task when you have done it. It turns green again, and its next due date counts
            from today.
          </p>
          <p className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-green-500 text-white">
              <CheckIcon className="size-3.5" />
            </span>
            Wash the sheets &middot; <span className="text-muted-foreground">due in 2 weeks</span>
          </p>
          <p>Every check-off is recorded, and a tap by mistake can be undone right away.</p>
        </>
      ),
    },
    {
      title: "Colors show what needs doing",
      body: (
        <>
          <p>Each task changes color on its own schedule:</p>
          <div className="flex flex-col gap-1.5">
            <SampleTask status="ok" name="Oil change" due="Due in 4 months" />
            <SampleTask status="soon" name="Wash the sheets" due="Due in 2 days" />
            <SampleTask status="due" name="Test the smoke detectors" due="Overdue 5 days" />
            <SampleTask status="severe" name="Clean the fridge" due="Overdue 2 months" />
          </div>
          <p>A folder takes its color from how many things inside it are overdue:</p>
          <div className="flex flex-col gap-1.5">
            <SampleFolder level="green" name="Car" />
            <SampleFolder level="orange" name="Kitchen" overdue={2} />
          </div>
        </>
      ),
    },
    {
      title: "Free, private and offline",
      body: (
        <>
          <p>No account, no ads and no tracking.</p>
          <p>
            It works without internet, like any app on your phone. Open it and check things off anywhere, even with no
            signal.
          </p>
          <p>
            Your tasks are saved on this device and go nowhere else unless you save a backup file. That also means
            the backup is the only other copy: save one now and then from Settings.
          </p>
        </>
      ),
    },
  ];

  if (onDesktop) {
    pages.push({
      title: "Best on your phone",
      body: (
        <>
          <p>Scan this with your phone&rsquo;s camera to open Sincewhen there, then add it to your home screen.</p>
          {/* Always black on white, even in dark mode: a camera needs the contrast. The file is
              made once from the app's address; see the note in docs/pwa.md to remake it. */}
          <Image
            src="/qr-code.svg"
            unoptimized
            alt={`QR code for ${SITE_HOST}`}
            width={176}
            height={176}
            className="mx-auto rounded-lg bg-white p-2"
          />
          <p>
            Your phone and this computer keep separate lists, with no syncing between them. You can keep using it
            here too.
          </p>
        </>
      ),
    });
  } else if (!installed) {
    pages.push({
      title: "Add it to your home screen",
      body: (
        <>
          <p>
            Installed, it opens from its own icon like any other app, works without internet, and keeps your tasks
            safe. In a browser tab, the phone may erase them after a week away.
          </p>
          <InstallSteps />
          <p>On iPhone and iPad, tasks added in a browser tab do not move into the app, so install first.</p>
        </>
      ),
    });
  }

  return pages;
}

/**
 * The intro's forward buttons: Next until the last page. There, someone who already has tasks just
 * closes it; an empty app is offered the examples or a clean start.
 */
function ForwardButtons({
  isLastPage,
  hasData,
  onNext,
  onFinish,
}: {
  isLastPage: boolean;
  hasData: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  if (!isLastPage) {
    return (
      <Button size="lg" onClick={onNext}>
        Next
      </Button>
    );
  }
  if (hasData) {
    return (
      <Button size="lg" onClick={onFinish}>
        Done
      </Button>
    );
  }
  return (
    <>
      <Button variant="outline" size="lg" onClick={onFinish}>
        Start empty
      </Button>
      <StartWithExamplesButton variant="default" onStarted={onFinish} />
    </>
  );
}

export function Intro() {
  const open = useSyncExternalStore(subscribeToIntro, () => isOpen, () => false);
  const onDesktop = useSyncExternalStore(subscribeToNothing, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);
  const installed = useSyncExternalStore(subscribeToNothing, isInstalled, () => false);
  const hasData = useAppStore((state) => state.data.nodes.length > 0);
  const [pageNumber, setPageNumber] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const pages = buildPages({ onDesktop, installed });
  const page = pages[Math.min(pageNumber, pages.length - 1)];
  const isLastPage = pageNumber >= pages.length - 1;

  /** Skipping only sticks when the box is ticked; reading to the end always does. */
  const close = (finished: boolean) => {
    if (finished || dontShowAgain) rememberDismissed();
    setIntroOpen(false);
    setPageNumber(0);
  };


  return (
    <Dialog open={open} onOpenChange={(next) => !next && close(false)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto sm:max-w-md">
        <p className="text-xs text-muted-foreground">
          {pageNumber + 1} of {pages.length}
        </p>
        <DialogTitle className="text-lg font-semibold">{page.title}</DialogTitle>
        {/* The page's text is its description, so a screen reader announces it with the title. */}
        <DialogDescription render={<div />} className="flex flex-col gap-3 text-sm text-foreground">
          {page.body}
        </DialogDescription>

        <label className="mt-1 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
            className="size-5"
          />
          Don&rsquo;t show this again
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          {pageNumber > 0 ? (
            <Button variant="ghost" size="lg" onClick={() => setPageNumber(pageNumber - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="lg" onClick={() => close(false)}>
              Skip
            </Button>
          )}
          <ForwardButtons
            isLastPage={isLastPage}
            hasData={hasData}
            onNext={() => setPageNumber(pageNumber + 1)}
            onFinish={() => close(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
