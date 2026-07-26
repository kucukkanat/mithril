/*
 * Integration: the drafting program is executed by the REAL runner worker, and its structured output
 * is carried all the way to a ProjectSpec.
 *
 * The model is the framework's own scripted double rather than a mock — the point of the test is the
 * program's SHAPE (its imports, its `tools` list, the injected `run` global, the output schema), and
 * a real model would make that unobservable behind a download. Every unit of code under test is the
 * shipping one.
 */
import { describe, expect, test } from "bun:test";
import type { RunnerMessage, RunnerRequest } from "@mithril/runner-web";
import { draftProgram, draftToSpec, parseSpecDraft, type DraftRequest } from "../src/lib/drafting.ts";

const TIMEOUT_MS = 20_000;

function runInWorker(request: RunnerRequest): Promise<readonly RunnerMessage[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../src/runner/worker-entry.ts", import.meta.url), { type: "module" });
    const messages: RunnerMessage[] = [];
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`worker did not finish within ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    worker.addEventListener("message", (ev: MessageEvent<RunnerMessage>) => {
      messages.push(ev.data);
      if (ev.data.type === "done" || ev.data.type === "error") {
        clearTimeout(timer);
        worker.terminate();
        resolve(messages);
      }
    });
    worker.postMessage(request);
  });
}

const DRAFT = { name: "Meeting notes", instructions: "Summarise the transcript into decisions and owners.", tool: null };

/**
 * The shipping program with only its `model:` line swapped for a scripted double — everything else
 * (imports, tools, output schema, the injected `run` call) is what draftProgram emitted.
 */
function scripted(req: DraftRequest, reply: unknown): string {
  return draftProgram(req, { kind: "code", expr: { code: "__scripted" } })
    .replace(
      `import { agent } from "mithril";`,
      [`import { agent } from "mithril";`, `import { scriptedProvider, testModel } from "@mithril/core/testkit";`].join("\n"),
    )
    .replace(
      "const drafter = agent({",
      [
        `const __scripted = testModel(scriptedProvider([[`,
        `  { type: "text.delta", delta: ${JSON.stringify(JSON.stringify(reply))} },`,
        `  { type: "message.end", finishReason: "stop", usage },`,
        `]]));`,
        `const drafter = agent({`,
      ].join("\n"),
    );
}

const specReq: DraftRequest = { kind: "spec", job: "Summarise meeting transcripts", cases: ["What did we decide?"] };

describe("a drafting run, end to end", () => {
  test(
    "the emitted program runs in the worker and yields the draft as structured output",
    async () => {
      const messages = await runInWorker({ type: "run", code: scripted(specReq, DRAFT) });

      expect(messages.find((m) => m.type === "error")).toBeUndefined();
      const final = messages.flatMap((m) => (m.type === "event" && m.event.type === "object.final" ? [m.event.value] : [])).at(-1);
      expect(final).toBeDefined();

      const draft = parseSpecDraft(final ?? null);
      expect(draft?.instructions).toBe(DRAFT.instructions);

      // …and the draft becomes a project the Designer can open.
      const spec = draftToSpec(draft!, { kind: "local", model: "onnx-community/Qwen3-0.6B-ONNX" });
      expect(spec.name).toBe("Meeting notes");
      expect(spec.entry.target).toBe("assistant");
    },
    TIMEOUT_MS,
  );

  test(
    "a description draft comes back through the same path",
    async () => {
      const req: DraftRequest = { kind: "description", toolName: "weather", current: "conditions", job: "answer weather questions", inputNames: ["city"] };
      const messages = await runInWorker({ type: "run", code: scripted(req, { description: "Call when asked about today's weather." }) });

      expect(messages.find((m) => m.type === "error")).toBeUndefined();
      const final = messages.flatMap((m) => (m.type === "event" && m.event.type === "object.final" ? [m.event.value] : [])).at(-1);
      expect(final).toEqual({ description: "Call when asked about today's weather." });
    },
    TIMEOUT_MS,
  );
});
