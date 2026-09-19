"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Which bottom sheet is open, and for which item. There is one sheet for the whole app; any row
 * or button opens it with `openSheet(...)`. Keeping this in one place means a row does not need
 * its own copy of the edit form, the move picker and the delete prompt.
 */
export type SheetState =
  | { mode: "menu"; nodeId: string }
  | { mode: "add"; parentId: string | null }
  | { mode: "edit"; nodeId: string }
  | { mode: "move"; nodeId: string }
  | { mode: "duplicate"; nodeId: string }
  | { mode: "delete"; nodeId: string };

type SheetContextValue = {
  sheet: SheetState | null;
  openSheet: (sheet: SheetState) => void;
  closeSheet: () => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const value = useMemo(
    () => ({ sheet, openSheet: setSheet, closeSheet: () => setSheet(null) }),
    [sheet],
  );
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useSheet(): SheetContextValue {
  const value = useContext(SheetContext);
  if (!value) throw new Error("useSheet must be used inside SheetProvider");
  return value;
}
