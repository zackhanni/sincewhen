import { toast } from "sonner";
import { CoreError, type CoreErrorCode } from "@/lib/core";

const MESSAGES: Record<CoreErrorCode, string> = {
  NOT_FOUND: "That item no longer exists.",
  NOT_A_TASK: "Only items with a frequency can be completed.",
  TOO_DEEP: "That would nest items too deeply.",
  WOULD_CREATE_CYCLE: "An item cannot be moved inside itself.",
  INVALID_DATA: "That data is not valid.",
};

/** Shows a refused operation as a toast. Anything unexpected is logged as well as shown. */
export function showError(error: unknown): void {
  if (error instanceof CoreError) {
    toast.error(MESSAGES[error.code]);
    return;
  }
  console.error(error);
  toast.error("Something went wrong.");
}
