"use client";

import { useMemo } from "react";
import { buildTreeIndex, type TreeIndex } from "@/lib/core";
import { useAppStore } from "@/lib/store/use-app-store";

/** The lookup tables for the current nodes, rebuilt only when the nodes actually change. */
export function useTreeIndex(): TreeIndex {
  const nodes = useAppStore((state) => state.data.nodes);
  return useMemo(() => buildTreeIndex(nodes), [nodes]);
}
