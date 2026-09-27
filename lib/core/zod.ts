import { z } from "zod";

// The app's one way in to zod. Import `z` from here, never from "zod" (a lint rule enforces it),
// so this setting always runs before any schema is built.
//
// Zod speeds up object parsing by generating code with `new Function`, after probing whether it
// may. It probes when a `z.object()` is created, at page load. The page's Content-Security-Policy
// (next.config.ts) forbids generated code, so in the browser zod already falls back to plain
// parsing, but its probe still logs a CSP violation on every page. Turning the speed-up off skips
// the probe; the checks themselves are identical.
z.config({ jitless: true });

export { z };
