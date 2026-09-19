import { MAX_DEPTH, SCHEMA_VERSION } from "./constants";
import { buildTreeIndex } from "./tree";
import { appDataSchema, type AppData } from "./types";

export type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

export function createEmptyAppData(): AppData {
  return { schemaVersion: SCHEMA_VERSION, nodes: [], completions: [] };
}

/**
 * Checks data that came from outside the app — an imported backup file, or whatever is sitting
 * in device storage — before it is trusted.
 *
 * The zod schema checks each field. The rest checks what a schema cannot see: that the nodes
 * actually form a tree. Bad links would not crash anything straight away; they would make nodes
 * silently disappear from every screen, which is worse.
 */
export function parseAppData(raw: unknown): ParseResult {
  const parsed = appDataSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".") || "file"}: ${issue.message}` };
  }
  const data = parsed.data;

  if (data.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of the app." };
  }

  const index = buildTreeIndex(data.nodes);
  if (index.byId.size !== data.nodes.length) {
    return { ok: false, error: "Two items share the same id." };
  }

  for (const node of data.nodes) {
    // Walk up to the top. A healthy chain ends at a location within MAX_DEPTH steps; a chain
    // that runs longer is either nested too deep or loops back on itself.
    let depth = 1;
    let parentId = node.parentId;
    while (parentId !== null) {
      const parent = index.byId.get(parentId);
      if (!parent) return { ok: false, error: `"${node.name}" points at a parent that does not exist.` };
      depth += 1;
      if (depth > MAX_DEPTH) {
        return { ok: false, error: `"${node.name}" is nested deeper than ${MAX_DEPTH} levels, or is inside a loop.` };
      }
      parentId = parent.parentId;
    }
  }

  // Log entries for deleted items are harmless leftovers, so drop them rather than reject the file.
  const completions = data.completions.filter((completion) => index.byId.has(completion.nodeId));
  return { ok: true, data: { ...data, completions } };
}
