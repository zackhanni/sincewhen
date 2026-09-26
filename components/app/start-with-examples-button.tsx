"use client";

import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { appStore } from "@/lib/store/use-app-store";

type StartWithExamplesButtonProps = {
  variant?: "default" | "outline";
  /** Runs after the examples are added, e.g. to close the intro. */
  onStarted?: () => void;
};

/** Fills an empty app with the example setup (lib/core/examples.ts). Only rendered while there is no data. */
export function StartWithExamplesButton({ variant = "outline", onStarted }: StartWithExamplesButtonProps) {
  return (
    <Button
      variant={variant}
      size="lg"
      onClick={() => {
        // The store refuses once there is data, so only claim success when it really added them.
        if (appStore.getState().startWithExamples()) {
          toast.success("Examples added", { description: "Edit or delete them like any other item." });
        }
        onStarted?.();
      }}
    >
      <SparklesIcon />
      Start with examples
    </Button>
  );
}
