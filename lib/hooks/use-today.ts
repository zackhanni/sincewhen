"use client";

import { useEffect, useState } from "react";
import { todayCalendarDate, type CalendarDate } from "@/lib/core";

/**
 * Today's date, kept current. A phone app is rarely "reloaded" — it is left open and brought
 * back days later — so the date is re-read whenever the app returns to the foreground.
 * Without this, a task that came due overnight would stay green until a manual refresh.
 */
export function useToday(): CalendarDate {
  const [today, setToday] = useState(() => todayCalendarDate());

  useEffect(() => {
    const refresh = () => setToday(todayCalendarDate());
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return today;
}
