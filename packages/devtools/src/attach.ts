import { registerGlobalConsumer } from "@mithril/core/agent";
import type { MithrilEvent } from "@mithril/core/protocol";
import { getGlobalInspector } from "./index.ts";

// §9.2 zero-touch attach. Importing this module (`import "mithril/devtools/attach"`) fans EVERY run in the
// process out to the global inspector — no per-run wiring. In a browser it also mirrors events onto a
// BroadcastChannel so a devtools panel in another tab/window can live-tail. Guarded so it no-ops in
// production unless MITHRIL_DEVTOOLS is explicitly set; `package.json` keeps this file's side effect while
// the rest of the package stays tree-shakeable.

/** The `BroadcastChannel` name the attach shim publishes to and `DevtoolsPanel` subscribes to. */
export const DEVTOOLS_CHANNEL = "mithril.devtools";

function env(): Record<string, string | undefined> | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
}

/** Whether the attach shim should activate: on by default in dev, off in production unless MITHRIL_DEVTOOLS is set. */
export function devtoolsEnabled(): boolean {
  const e = env();
  const flag = e?.["MITHRIL_DEVTOOLS"];
  if (flag !== undefined && flag !== "" && flag !== "0") return true;
  return e?.["NODE_ENV"] !== "production";
}

let detach: (() => void) | undefined;

/**
 * Attach the global devtools inspector to every run in this process (idempotent).
 *
 * @returns a detach function that unregisters the fanout and closes the broadcast channel.
 * @remarks Normally you don't call this — `import "mithril/devtools/attach"` runs it for you. It registers a
 * process-wide {@link registerGlobalConsumer} that forwards events to {@link getGlobalInspector} and, in a
 * browser, to a {@link DEVTOOLS_CHANNEL} `BroadcastChannel`.
 */
export function attachDevtools(): () => void {
  if (detach !== undefined) return detach;
  const inspector = getGlobalInspector();
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(DEVTOOLS_CHANNEL) : undefined;
  const off = registerGlobalConsumer({
    name: "mithril.devtools.attach",
    onEvent(e: MithrilEvent) {
      inspector.consumer.onEvent(e);
      channel?.postMessage(e);
    },
  });
  detach = () => {
    off();
    channel?.close();
    detach = undefined;
  };
  return detach;
}

// Side effect on import: attach unless disabled (the zero-touch entry point).
if (devtoolsEnabled()) attachDevtools();
