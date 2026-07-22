/*
 * Playground smoke test — the one thing the framework's own `bun test` can't catch.
 *
 * `astro build` stays green even when the worker is broken: a bundler externalizes any stray
 * `node:*` import lazily, so it only throws at RUN time inside the worker (exactly how the
 * `node:url` regression shipped). `check:browser-safe` guards the package graph; this guards the
 * worker's own wiring — its MODULES map, the sucrase transpile, the injected `run`/`usage` globals
 * — by spawning the REAL worker and running the default preset end-to-end, same as the UI does.
 */
import { describe, expect, test } from "bun:test";
import { DEFAULT_PRESET } from "./presets.ts";
import { assembleExample } from "./providers.ts";
import type { RunnerMessage } from "./protocol.ts";

// Generous ceiling: cold worker start + transpile + a scripted run. Scripted mode is pure compute.
const TIMEOUT_MS = 20_000;

function runInWorker(code: string): Promise<readonly RunnerMessage[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./runner-worker.ts", import.meta.url), { type: "module" });
    const messages: RunnerMessage[] = [];
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`worker did not finish within ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    worker.addEventListener("message", (ev: MessageEvent<RunnerMessage>) => {
      const msg = ev.data;
      messages.push(msg);
      if (msg.type === "done") {
        clearTimeout(timer);
        worker.terminate();
        resolve(messages);
      }
      if (msg.type === "error") {
        clearTimeout(timer);
        worker.terminate();
        reject(new Error(`worker reported error: ${msg.message}`));
      }
    });
    worker.addEventListener("error", (ev) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(`worker failed to load: ${ev.message}`));
    });

    worker.postMessage({ type: "run", code });
  });
}

describe("playground runner worker", () => {
  test(
    "runs the default preset end-to-end and streams events",
    async () => {
      const code = assembleExample(DEFAULT_PRESET.parts, { kind: "scripted" });
      const messages = await runInWorker(code);

      // No error crossed the wire (runInWorker would have rejected), and we reached a terminal `done`.
      expect(messages.at(-1)?.type).toBe("done");
      // The stream actually produced MithrilEvents — not an empty run that silently "finished".
      const events = messages.filter((m) => m.type === "event");
      expect(events.length).toBeGreaterThan(0);
      // The default "Tool call" preset ends by answering — assert the text made it through.
      const text = events
        .flatMap((m) => (m.type === "event" && m.event.type === "text.delta" ? [(m.event as { delta: string }).delta] : []))
        .join("");
      expect(text).toContain("Istanbul");
    },
    TIMEOUT_MS,
  );
});
