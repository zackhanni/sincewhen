import { describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";
import { SCHEMA_VERSION } from "@/lib/core";
import { CORRUPT_BACKUP_KEY, STORAGE_KEY, createAppStore } from "./app-store";

/** A stand-in for localStorage that tests can read and pre-fill. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
  return { storage, items };
}

async function loadedStore(storage: StateStorage) {
  const store = createAppStore(storage);
  await store.persist.rehydrate();
  return store;
}

const weekly = { count: 1, unit: "week" } as const;

describe("app store", () => {
  it("starts empty and reports when loading has finished", async () => {
    const store = createAppStore(memoryStorage().storage);
    expect(store.getState().hasHydrated).toBe(false);
    await store.persist.rehydrate();
    expect(store.getState()).toMatchObject({ hasHydrated: true, loadError: null });
    expect(store.getState().data.nodes).toEqual([]);
  });

  it("saves changes and loads them back in a fresh store", async () => {
    const { storage } = memoryStorage();
    const first = await loadedStore(storage);
    const homeId = first.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
    first.getState().addNode({ parentId: homeId, name: "Filter", frequency: weekly, lastCompleted: null });
    first.getState().setActiveLocation(homeId);

    const second = await loadedStore(storage);
    expect(second.getState().data.nodes.map((n) => n.name)).toEqual(["Home", "Filter"]);
    expect(second.getState().activeLocationId).toBe(homeId);
  });

  it("fills an empty app with the examples, and never touches one that has data", async () => {
    const empty = await loadedStore(memoryStorage().storage);
    empty.getState().startWithExamples();
    expect(empty.getState().data.nodes.length).toBeGreaterThan(10);

    const used = await loadedStore(memoryStorage().storage);
    used.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
    used.getState().startWithExamples();
    expect(used.getState().data.nodes.map((n) => n.name)).toEqual(["Home"]);
  });

  it("does not save the loading flags", async () => {
    const { storage, items } = memoryStorage();
    const store = await loadedStore(storage);
    store.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
    const saved = JSON.parse(items.get(STORAGE_KEY)!);
    expect(Object.keys(saved.state).sort()).toEqual(["activeLocationId", "data", "lastBackupDate"]);
    expect(saved.version).toBe(SCHEMA_VERSION);
  });

  it("remembers the last backup date, and ignores a saved one that is not a date", async () => {
    const { storage, items } = memoryStorage();
    const first = await loadedStore(storage);
    first.getState().markBackedUp();
    expect((await loadedStore(storage)).getState().lastBackupDate).toBe(first.getState().lastBackupDate);

    const saved = JSON.parse(items.get(STORAGE_KEY)!);
    saved.state.lastBackupDate = "yesterday";
    items.set(STORAGE_KEY, JSON.stringify(saved));
    expect((await loadedStore(storage)).getState().lastBackupDate).toBeNull();
  });

  it("completes and undoes through core", async () => {
    const store = await loadedStore(memoryStorage().storage);
    const id = store.getState().addNode({ parentId: null, name: "Filter", frequency: weekly, lastCompleted: null });
    const undo = store.getState().completeTask(id);
    expect(store.getState().data.nodes[0].lastCompleted).not.toBeNull();
    store.getState().undoCompletion(undo);
    expect(store.getState().data.nodes[0].lastCompleted).toBeNull();
    expect(store.getState().data.completions).toEqual([]);
  });

  it("lets a refused operation throw and leaves the data alone", async () => {
    const store = await loadedStore(memoryStorage().storage);
    const id = store.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
    expect(() => store.getState().moveNode(id, id)).toThrow(expect.objectContaining({ code: "WOULD_CREATE_CYCLE" }));
    expect(store.getState().data.nodes[0].parentId).toBeNull();
  });

  it("falls back to all locations when the active one is deleted", async () => {
    const store = await loadedStore(memoryStorage().storage);
    const id = store.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
    store.getState().setActiveLocation(id);
    store.getState().deleteNode(id);
    expect(store.getState().activeLocationId).toBeNull();
  });

  describe("unreadable saved data", () => {
    const brokenTree = JSON.stringify({
      version: SCHEMA_VERSION,
      state: {
        activeLocationId: null,
        data: {
          schemaVersion: SCHEMA_VERSION,
          completions: [],
          nodes: [{ id: "a", parentId: "ghost", name: "Orphan", frequency: null, lastCompleted: null, createdAt: "2026-01-01", sortOrder: "a0" }],
        },
      },
    });

    it("raises loadError and parks the original text instead of overwriting it", async () => {
      const { storage, items } = memoryStorage({ [STORAGE_KEY]: brokenTree });
      const store = await loadedStore(storage);
      expect(store.getState().loadError).toContain("does not exist");
      expect(store.getState().hasHydrated).toBe(true);
      expect(items.get(CORRUPT_BACKUP_KEY)).toBe(brokenTree);

      // Even after the user carries on and the main key is rewritten, the backup survives.
      store.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });
      expect(items.get(CORRUPT_BACKUP_KEY)).toBe(brokenTree);
    });

    it("keeps warning on later launches, until the parked copy is discarded", async () => {
      const { storage, items } = memoryStorage({ [STORAGE_KEY]: brokenTree });
      const first = await loadedStore(storage);
      // Carrying on rewrites the main key with valid data, so the NEXT load has no error...
      first.getState().addNode({ parentId: null, name: "Home", frequency: null, lastCompleted: null });

      const second = await loadedStore(storage);
      expect(second.getState().loadError).toBeNull();
      // ...but the parked copy is still there, and the app must still say so.
      expect(second.getState().hasUnreadableBackup).toBe(true);

      second.getState().discardUnreadableBackup();
      expect(second.getState().hasUnreadableBackup).toBe(false);
      expect(items.has(CORRUPT_BACKUP_KEY)).toBe(false);
      expect((await loadedStore(storage)).getState().hasUnreadableBackup).toBe(false);
    });

    it("reports no parked copy on a healthy device", async () => {
      expect((await loadedStore(memoryStorage().storage)).getState().hasUnreadableBackup).toBe(false);
    });

    it("treats text that is not JSON the same way", async () => {
      const { storage, items } = memoryStorage({ [STORAGE_KEY]: "{not json" });
      const store = await loadedStore(storage);
      expect(store.getState()).toMatchObject({ hasHydrated: true });
      expect(store.getState().loadError).not.toBeNull();
      expect(items.get(CORRUPT_BACKUP_KEY)).toBe("{not json");
    });
  });
});
