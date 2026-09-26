"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDisplaySettings } from "@/lib/display/display-settings";
import { START_SCREEN_HREF } from "@/lib/routes";

/**
 * Where the app opens: "/" is the manifest's start_url, and what every installed home-screen
 * icon points to. It shows nothing and sends the user on to the start screen chosen in
 * Settings (Folders or Due). The tabs have their own addresses, so tapping one never lands here.
 */
export default function LaunchPage() {
  const router = useRouter();
  useEffect(() => {
    // replace, not push: "/" should not sit in the history for Back to return to.
    router.replace(START_SCREEN_HREF[getDisplaySettings().startOn]);
  }, [router]);
  return null;
}
