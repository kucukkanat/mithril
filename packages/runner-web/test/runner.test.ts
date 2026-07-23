/*
 * End-to-end tests of the worker half: Bun natively runs TS module Workers, so these spawn the
 * REAL worker (via the same 3-line entry a host app owns) and drive the message protocol exactly
 * as a UI would — transpile, module registry, injected `run`/`emit`/`usage` globals, the
 * suspend/resume loop, and resume-from-token.
 */
import { describe, expect, test } from "bun:test";
import type { RunnerMessage, RunnerRequest } from "../src/protocol.ts";

// Generous ceiling: cold worker start + transpile + a scripted run. Scripted turns are pure compute.
const TIMEOUT_MS = 20_000;

interface DriverOptions {
  /** Called on each message; may post a follow-up request (e.g. answer a suspension). */
  readonly onMessage?: (msg: RunnerMessage, postBack: (req: RunnerRequest) => void) => void;
}

function runInWorker(request: RunnerRequest, opts?: DriverOptions): Promise<readonly RunnerMessage[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./fixtures/worker-entry.ts", import.meta.url), { type: "module" });
    const messages: RunnerMessage[] = [];
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`worker did not finish within ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    const finish = (fn: () => void): void => {
      clearTimeout(timer);
      worker.terminate();
      fn();
    };
    worker.addEventListener("message", (ev: MessageEvent<RunnerMessage>) => {
      const msg = ev.data;
      messages.push(msg);
      opts?.onMessage?.(msg, (req) => worker.postMessage(req));
      if (msg.type === "done") finish(() => resolve(messages));
      if (msg.type === "error") finish(() => reject(new Error(`worker reported error: ${msg.message}`)));
    });
    worker.addEventListener("error", (ev) => {
      finish(() => reject(new Error(`worker failed to load: ${ev.message}`)));
    });
    worker.postMessage(request);
  });
}

const textOf = (messages: readonly RunnerMessage[]): string =>
  messages
    .flatMap((m) => (m.type === "event" && m.event.type === "text.delta" ? [(m.event as { delta: string }).delta] : []))
    .join("");

// A scripted tool-call agent: turn 1 calls `weather`, turn 2 answers.
const TOOL_CALL_SNIPPET = `
import { agent, tool } from "mithril";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { z } from "zod";

const model = testModel(scriptedProvider([
  [
    { type: "tool.call", callId: "c1", name: "weather", input: { city: "Istanbul" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "It's 21°C and clear in Istanbul." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]));

const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 21 }),
});

const assistant = agent({ model, instructions: "You are a concise weather assistant.", tools: [weather] });
await run(assistant, "What's the weather in Istanbul?");
`;

// A HITL agent: `deploy` needs approval, so the run suspends before executing it.
const HITL_SNIPPET = (turns: string): string => `
import { agent, tool } from "mithril";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { z } from "zod";

const model = testModel(scriptedProvider(${turns}));

const deploy = tool({
  name: "deploy",
  description: "Deploy the app to an environment.",
  inputSchema: z.object({ env: z.string() }),
  needsApproval: true,
  execute: async ({ env }) => ({ deployed: true, env }),
});

const assistant = agent({ model, instructions: "Deploy when asked.", tools: [deploy] });
await run(assistant, "Deploy to production.");
`;

const HITL_BOTH_TURNS = `[
  [
    { type: "tool.call", callId: "c1", name: "deploy", input: { env: "production" } },
    { type: "message.end", finishReason: "tool_calls", usage },
  ],
  [
    { type: "text.delta", delta: "Deployed to production." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`;

// The resumed worker's provider starts fresh, and the resumed loop's FIRST model call is the
// post-approval turn — so the resume snippet scripts only that turn.
const HITL_RESUME_TURNS = `[
  [
    { type: "text.delta", delta: "Deployed to production." },
    { type: "message.end", finishReason: "stop", usage },
  ],
]`;

describe("runner-web worker", () => {
  test(
    "runs a scripted snippet end-to-end and streams events",
    async () => {
      const messages = await runInWorker({ type: "run", code: TOOL_CALL_SNIPPET });
      expect(messages.at(-1)?.type).toBe("done");
      expect(messages.filter((m) => m.type === "event").length).toBeGreaterThan(0);
      expect(textOf(messages)).toContain("Istanbul");
    },
    TIMEOUT_MS,
  );

  test(
    "suspends on needsApproval and resumes on an approve decision",
    async () => {
      const messages = await runInWorker(
        { type: "run", code: HITL_SNIPPET(HITL_BOTH_TURNS) },
        {
          onMessage: (msg, postBack) => {
            if (msg.type === "suspended") postBack({ type: "resume", decision: { kind: "approve" } });
          },
        },
      );
      const suspended = messages.find((m) => m.type === "suspended");
      expect(suspended).toBeDefined();
      if (suspended?.type === "suspended") expect(typeof suspended.info.token).toBe("string");
      expect(textOf(messages)).toContain("Deployed");
      const result = messages.find((m) => m.type === "result");
      expect(result?.type === "result" && (result.result as { status: string }).status).toBe("completed");
    },
    TIMEOUT_MS,
  );

  test(
    "resumes from a persisted token in a FRESH worker (resume-across-reload)",
    async () => {
      // Phase 1: run until suspension, capture the durable-local token, then kill the worker
      // without resuming — simulating a page unload mid-approval.
      let token: string | undefined;
      await runInWorker(
        { type: "run", code: HITL_SNIPPET(HITL_BOTH_TURNS) },
        {
          onMessage: (msg, postBack) => {
            if (msg.type === "suspended") {
              token = msg.info.token;
              // Reject to let the run finish cleanly; the token stays valid for its own resume.
              postBack({ type: "resume", decision: { kind: "reject", message: "captured token; ending phase 1" } });
            }
          },
        },
      );
      expect(token).toBeDefined();

      // Phase 2: a brand-new worker re-provides the SAME agent shape and resumes from the token.
      const messages = await runInWorker({
        type: "run",
        code: HITL_SNIPPET(HITL_RESUME_TURNS),
        resume: { token: token as string, decision: { kind: "approve" } },
      });
      expect(textOf(messages)).toContain("Deployed");
      const toolResults = messages.filter((m) => m.type === "event" && m.event.type === "tool.result");
      expect(toolResults.length).toBe(1);
    },
    TIMEOUT_MS,
  );

  test(
    "emit() round-trips structured payloads on the data channel",
    async () => {
      const messages = await runInWorker({ type: "run", code: `emit({ hello: "world", n: 42 });` });
      const data = messages.find((m) => m.type === "data");
      expect(data?.type === "data" && data.payload).toEqual({ hello: "world", n: 42 });
    },
    TIMEOUT_MS,
  );

  test(
    "unknown imports fail with a helpful module list",
    async () => {
      // The import must be USED — sucrase elides unused imports as potentially type-only.
      await expect(runInWorker({ type: "run", code: `import x from "left-pad";\nconsole.log(x);` })).rejects.toThrow(
        /Available modules/,
      );
    },
    TIMEOUT_MS,
  );
});
