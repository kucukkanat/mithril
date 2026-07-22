/**
 * Browser client for the {@link inspectorReport} HTML — lazily mounts the `@mithril/devtools` run inspector
 * (span tree, time-travel scrubber, cost/context meters) into each case row the first time it is expanded.
 *
 * @remarks
 * This module is **not** part of the library runtime: it is bundled to a self-contained IIFE by
 * {@link inspectorReport} (via `Bun.build`) and inlined into the report document. It runs only in the
 * browser that opens the report. Keeping it a separate entry is what lets base `@mithril/evals` stay free
 * of any `@mithril/devtools` import.
 *
 * @packageDocumentation
 */
import type { MithrilEvent } from "@mithril/core/protocol";
import { mountRunInspector } from "@mithril/devtools/dom";

// The report embeds each case's event log as a <script type="application/json"> so the browser never
// executes it; we parse it on demand. `<` is written as < upstream, so a "</script>" inside model
// output can never break out of the block.
function readLog(details: HTMLElement): readonly MithrilEvent[] {
  const raw = details.querySelector<HTMLScriptElement>("script.mth-traj")?.textContent;
  if (raw === null || raw === undefined || raw === "") return [];
  return JSON.parse(raw) as readonly MithrilEvent[];
}

function wire(): void {
  const rows = document.querySelectorAll<HTMLDetailsElement>("details.row");
  rows.forEach((details) => {
    const mount = details.querySelector<HTMLElement>(".mth-inspect");
    if (mount === null) return;
    let mounted = false;
    const doMount = (): void => {
      if (mounted) return;
      mounted = true;
      const cw = Number(mount.dataset["contextWindow"] ?? "");
      mountRunInspector(mount, { events: readLog(details), ...(cw > 0 ? { contextWindow: cw } : {}) });
    };
    // Mount lazily — only when the row is first opened (a large suite stays cheap until you look).
    if (details.open) doMount();
    details.addEventListener("toggle", () => {
      if (details.open) doMount();
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
else wire();
