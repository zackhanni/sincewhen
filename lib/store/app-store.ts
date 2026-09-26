import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  SCHEMA_VERSION,
  addNode,
  buildExampleData,
  completeTask,
  createEmptyAppData,
  deleteSubtree,
  isValidCalendarDate,
  duplicateSubtree,
  moveNode,
  parseAppData,
  todayCalendarDate,
  undoCompletion,
  updateNode,
  type AppData,
  type CompletionUndo,
  type Frequency,
  type NodeEdit,
  type CalendarDate,
} from "@/lib/core";

// The store is a thin shell around lib/core. It owns three jobs and nothing else:
//   1. hold the current AppData and swap in the new copy each core operation returns,
//   2. supply the impure inputs core refuses to touch (today's date, fresh ids),
//   3. save to the device and load back, distrusting whatever it finds there.
// A refused operation throws a CoreError straight through to the caller, which shows a message.

export const STORAGE_KEY = "sincewhen";
/** Where unreadable saved data is parked so it is never overwritten. See `loadError`. */
export const CORRUPT_BACKUP_KEY = "sincewhen:unreadable-backup";

export type NewNodeForm = {
  parentId: string | null;
  name: string;
  frequency: Frequency | null;
  lastCompleted: CalendarDate | null;
};

export type AppState = {
  data: AppData;
  /** The location whose rooms and due tasks are shown. null = show all locations. */
  activeLocationId: string | null;
  /** The day of the last export, for the "time to back up" nudge. null = never backed up. */
  lastBackupDate: CalendarDate | null;
  /**
   * False until saved data has been read from the device. Screens must wait for it: before
   * that, `data` is the empty default, and rendering it would flash "no tasks yet" at someone
   * who has fifty.
   */
  hasHydrated: boolean;
  /** Set when saved data existed but could not be read. The UI must show this, never hide it. */
  loadError: string | null;
  /**
   * True while a parked copy of unreadable data is still on the device. `loadError` only lasts
   * for the session in which loading failed: once the user adds a task, the next launch loads
   * cleanly and it is null again. This flag is read from the parked copy itself, so the warning
   * and the way to rescue the data stay visible until the user saves or discards that copy.
   * (Derived from storage on purpose, not saved as a second flag that could disagree with it.)
   */
  hasUnreadableBackup: boolean;

  addNode: (form: NewNodeForm) => string;
  updateNode: (id: string, edit: NodeEdit) => void;
  moveNode: (id: string, newParentId: string | null) => void;
  duplicateNode: (id: string, newParentId: string | null, resetCompletion: boolean) => void;
  deleteNode: (id: string) => void;
  completeTask: (id: string) => CompletionUndo;
  undoCompletion: (undo: CompletionUndo) => void;
  setActiveLocation: (id: string | null) => void;
  /** Fills an empty app with the example setup. Returns false, and does nothing, once there is any data. */
  startWithExamples: () => boolean;
  /** Replaces everything with an imported backup that has already passed parseAppData. */
  replaceAllData: (data: AppData) => void;
  markBackedUp: () => void;
  /** Permanently removes the parked unreadable copy, once the user has saved it or given up on it. */
  discardUnreadableBackup: () => void;
};

/** The slice of state that is written to the device. Everything else is rebuilt on load. */
type PersistedState = Pick<AppState, "data" | "activeLocationId" | "lastBackupDate">;

const newId = () => crypto.randomUUID();

/**
 * Builds a store on top of any key-value storage. The app passes localStorage; tests pass an
 * in-memory fake. A future Supabase-backed storage plugs in here too — zustand accepts an async
 * StateStorage — which is why there is no separate storage interface of our own.
 */
export function createAppStore(storage: StateStorage) {
  /** Copies the saved text aside before anything can overwrite it, and raises the flag. */
  function reportUnreadable(reason: string): Partial<AppState> {
    const raw = storage.getItem(STORAGE_KEY);
    if (typeof raw === "string") storage.setItem(CORRUPT_BACKUP_KEY, raw);
    return { loadError: reason };
  }

  const store = createStore<AppState>()(
    persist(
      (set, get) => ({
        data: createEmptyAppData(),
        activeLocationId: null,
        lastBackupDate: null,
        hasHydrated: false,
        loadError: null,
        hasUnreadableBackup: false,

        addNode: (form) => {
          const id = newId();
          set({ data: addNode(get().data, { ...form, id, today: todayCalendarDate() }) });
          return id;
        },
        updateNode: (id, edit) => set({ data: updateNode(get().data, id, edit) }),
        moveNode: (id, newParentId) => set({ data: moveNode(get().data, id, newParentId) }),
        duplicateNode: (id, newParentId, resetCompletion) =>
          set({
            data: duplicateSubtree(get().data, id, newParentId, {
              newId,
              today: todayCalendarDate(),
              resetCompletion,
            }),
          }),
        deleteNode: (id) => {
          const data = deleteSubtree(get().data, id);
          // If the active location was just deleted, fall back to "all" rather than point at nothing.
          const activeStillExists = data.nodes.some((node) => node.id === get().activeLocationId);
          set({ data, activeLocationId: activeStillExists ? get().activeLocationId : null });
        },
        completeTask: (id) => {
          const result = completeTask(get().data, id, todayCalendarDate(), newId());
          set({ data: result.data });
          return result.undo;
        },
        undoCompletion: (undo) => set({ data: undoCompletion(get().data, undo) }),
        setActiveLocation: (id) => set({ activeLocationId: id }),
        startWithExamples: () => {
          // Only ever offered on an empty app; refusing otherwise means a stale button can
          // never overwrite real tasks.
          if (get().data.nodes.length > 0) return false;
          set({ data: buildExampleData(todayCalendarDate(), newId), activeLocationId: null });
          return true;
        },
        replaceAllData: (data) => set({ data, activeLocationId: null, loadError: null }),
        markBackedUp: () => set({ lastBackupDate: todayCalendarDate() }),
        discardUnreadableBackup: () => {
          storage.removeItem(CORRUPT_BACKUP_KEY);
          set({ hasUnreadableBackup: false, loadError: null });
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => storage),
        version: SCHEMA_VERSION,
        partialize: (state): PersistedState => ({
          data: state.data,
          activeLocationId: state.activeLocationId,
          lastBackupDate: state.lastBackupDate,
        }),
        // Next.js renders on the server first, where there is no device storage. Loading is
        // started by hand from a client effect (see StoreHydrator) so server and client agree
        // on the first render.
        skipHydration: true,

        /**
         * Runs when the saved version is older than SCHEMA_VERSION. There is only one version so
         * far, so there is nothing to convert. When the data shape changes: bump SCHEMA_VERSION,
         * then add `if (fromVersion < 2) { ...convert... }` steps here, oldest first, each
         * returning the shape the next step expects.
         */
        migrate: (persisted) => persisted as PersistedState,

        /**
         * Decides what saved data is allowed into the store. Saved data is untrusted: it may be
         * from an older build, hand-edited, or cut short by a full disk.
         *
         * If it fails validation we must NOT carry on as if there were no data — the next save
         * would overwrite it and the user's tasks would be gone for good. Instead the raw text
         * is copied to a backup key, and `loadError` makes the UI say so.
         */
        merge: (persisted, current) => {
          if (persisted === undefined || persisted === null) return current;
          const saved = persisted as Partial<PersistedState>;
          const parsed = parseAppData(saved.data);
          if (!parsed.ok) return { ...current, ...reportUnreadable(parsed.error) };
          const locationExists = parsed.data.nodes.some(
            (node) => node.id === saved.activeLocationId && node.parentId === null,
          );
          return {
            ...current,
            data: parsed.data,
            activeLocationId: locationExists ? (saved.activeLocationId ?? null) : null,
            lastBackupDate:
              typeof saved.lastBackupDate === "string" && isValidCalendarDate(saved.lastBackupDate)
                ? saved.lastBackupDate
                : null,
          };
        },

        // Runs once loading finishes, whether it worked or not. An `error` here means the saved
        // text was not even valid JSON, so `merge` never ran; it gets the same treatment.
        onRehydrateStorage: () => (_state, error) => {
          const failure = error ? reportUnreadable("The saved data is not valid JSON.") : {};
          store.setState({
            hasHydrated: true,
            ...failure,
            // Checked after reportUnreadable, so a copy parked a moment ago is counted too.
            hasUnreadableBackup: typeof storage.getItem(CORRUPT_BACKUP_KEY) === "string",
          });
        },
      },
    ),
  );

  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
