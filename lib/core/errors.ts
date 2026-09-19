export type CoreErrorCode =
  | "NOT_FOUND"
  | "NOT_A_TASK"
  | "TOO_DEEP"
  | "WOULD_CREATE_CYCLE"
  | "INVALID_DATA";

/** Thrown when an operation is refused. The UI switches on `code` to show a friendly message. */
export class CoreError extends Error {
  constructor(
    public readonly code: CoreErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CoreError";
  }
}
