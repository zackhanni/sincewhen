"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { isIosInstalledApp } from "@/lib/pwa/pwa";
import { cn } from "@/lib/utils";

/** A swipe must start this close to the left edge of the screen, in px. */
const EDGE_WIDTH = 24;
/** Movement smaller than this does not yet say whether it is a swipe or a scroll, in px. */
const DECIDE_AFTER = 10;
/** How far right the finger must travel to go back, in px. */
const TRIGGER_DISTANCE = 80;

/**
 * Swipe right from the left edge of the screen to go up one level to `href`, as in iPhone apps.
 * Goes to the same place as the back button beside the title.
 *
 * Only switched on in the app installed on an iPhone or iPad, which has no back gesture of its
 * own. A Safari tab and Android already go back on an edge swipe, and a second gesture on top
 * would fire both. While the finger moves, a round arrow follows it from the edge; it fills in
 * once letting go will go back.
 */
export function SwipeBack({ href }: { href: string }) {
  const router = useRouter();
  const [distance, setDistance] = useState(0);
  const goBack = useEffectEvent(() => router.push(href));

  useEffect(() => {
    if (!isIosInstalledApp()) return;
    let start: { x: number; y: number } | null = null;
    let isSwipe = false;

    const reset = () => {
      start = null;
      isSwipe = false;
      setDistance(0);
    };
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (event.touches.length !== 1 || touch.clientX > EDGE_WIDTH) return;
      start = { x: touch.clientX, y: touch.clientY };
    };
    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (!isSwipe) {
        if (Math.hypot(dx, dy) < DECIDE_AFTER) return;
        // Mostly up or down, or leftwards: the user is scrolling, not swiping back.
        if (Math.abs(dy) > Math.abs(dx) || dx < 0) return reset();
        isSwipe = true;
      }
      setDistance(Math.max(0, dx));
    };
    const onEnd = (event: TouchEvent) => {
      if (!start) return;
      const traveled = event.changedTouches[0].clientX - start.x;
      const wasSwipe = isSwipe;
      reset();
      if (wasSwipe && traveled >= TRIGGER_DISTANCE) goBack();
    };

    // Passive: the page keeps scrolling normally; this only watches.
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", reset);
    };
  }, []);

  if (distance === 0) return null;
  const armed = distance >= TRIGGER_DISTANCE;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed top-1/2 left-0 z-50 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition-colors",
        armed ? "bg-foreground text-background" : "bg-background text-foreground",
      )}
      // Slides out with the finger, at half speed, and stops once letting go would go back.
      style={{ transform: `translate(${Math.min(distance, TRIGGER_DISTANCE) / 2 - 8}px, -50%)` }}
    >
      <ChevronLeftIcon className="size-5" />
    </div>
  );
}
