// Every tunable number in the app lives here, so behaviour can be adjusted without touching logic.

/** Bumped whenever the saved data shape changes; the store migrates older versions forward. */
export const SCHEMA_VERSION = 1;

/** Deepest allowed nesting. A top-level location is depth 1. */
export const MAX_DEPTH = 5;

export const MAX_NAME_LENGTH = 120;
export const MAX_FREQUENCY_COUNT = 999;

// --- Task status -------------------------------------------------------------------------------
// progress = elapsed days / interval days. 0 = just completed, 1 = due today, 2 = a full interval late.

/** A task turns yellow ("soon") once this share of its interval has passed... */
export const SOON_PROGRESS = 0.8;
/** ...or once it is this many days from due, whichever comes first. */
export const SOON_DAYS = 1;

/** A task is "severe" once it is overdue by this share of its own interval... */
export const SEVERE_OVERDUE_RATIO = 0.5;
/** ...and by at least this many days, so a daily task is not severe after 12 hours. */
export const SEVERE_MIN_DAYS = 3;

// --- Room colour -------------------------------------------------------------------------------
// score = number of overdue tasks inside the room, with a severe task counting double.

export const SEVERE_WEIGHT = 2;
export const ROOM_ORANGE_MIN_SCORE = 1;
export const ROOM_RED_MIN_SCORE = 3;
export const ROOM_DARK_RED_MIN_SCORE = 6;
