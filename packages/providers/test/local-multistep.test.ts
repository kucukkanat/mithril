import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { StandardSchemaV1 } from "@mithril/core/protocol";
import { transformersProvider, type EngineChunk, type EngineRequest } from "../src/transformers/core.ts";
import { toTemplateMessages, formatForModel } from "../src/transformers/tool-formats.ts";

/*
 * The chained-tool-call case, end to end on a local model.
 *
 * This is the failure the framework shipped with: step 2's prompt carried the tool RESULT but not the call
 * that produced it, so a small model saw an orphan payload and narrated/invented instead of continuing. The
 * assertion that matters is on what the ENGINE receives for step 2 — the prompt itself.
 */

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "t", validate: (v) => ({ value: v as T }) } };
}

const calendar = tool({
  name: "calendar",
  description: "today's events",
  inputSchema: schema<Record<string, never>>(),
  execute: async () => ({ events: [{ title: "Weekly sync", attendees: ["Tolga"] }] }),
});
const notes = tool({
  name: "notes",
  description: "notes for a person",
  inputSchema: schema<{ person: string }>(),
  execute: async ({ person }) => ({ found: false, person }),
});

/** An engine that records each request and replays scripted chunks, one script per step. */
function recordingEngine(scripts: readonly (readonly EngineChunk[])[]) {
  const seen: EngineRequest[] = [];
  let i = 0;
  return {
    seen,
    engine: {
      async *generate(req: EngineRequest): AsyncGenerator<EngineChunk> {
        // Snapshot the messages: the loop mutates its array in place across steps.
        seen.push({ ...req, messages: req.messages.map((m) => ({ ...m, toolCalls: [...m.toolCalls] })) });
        for (const c of scripts[i] ?? []) yield c;
        i++;
      },
    },
  };
}

test("two chained tool calls: every step's prompt restates the calls already made", async () => {
  const { seen, engine } = recordingEngine([
    [{ kind: "toolCall", name: "calendar", input: {} }],
    [{ kind: "toolCall", name: "notes", input: { person: "Tolga" } }],
    [{ kind: "token", text: "One meeting; no notes on Tolga." }],
  ]);
  const a = agent({
    model: { id: "transformers/LiquidAI/LFM2.5-1.2B-Instruct-ONNX", provider: transformersProvider(engine) },
    instructions: "be exact",
    tools: [calendar, notes],
  });
  const res = await a.run("what's on today?", { deps: undefined });
  expect(res.status).toBe("completed");
  expect(seen).toHaveLength(3);

  const fmt = formatForModel("LiquidAI/LFM2.5-1.2B-Instruct-ONNX");

  // Step 2 must show the calendar call, not just its result.
  const step2 = toTemplateMessages(seen[1]?.system ?? "", seen[1]?.messages ?? [], fmt);
  expect(step2.some((m) => m.role === "assistant" && m.content.includes("calendar()"))).toBe(true);
  expect(step2.some((m) => m.role === "tool" && m.content.includes("Weekly sync"))).toBe(true);

  // Step 3 must still show BOTH calls — history accumulates, it does not get overwritten.
  const step3 = toTemplateMessages(seen[2]?.system ?? "", seen[2]?.messages ?? [], fmt);
  const assistantTurns = step3.filter((m) => m.role === "assistant").map((m) => m.content);
  expect(assistantTurns.some((c) => c.includes("calendar()"))).toBe(true);
  expect(assistantTurns.some((c) => c.includes('notes(person="Tolga")'))).toBe(true);
  expect(step3.filter((m) => m.role === "tool")).toHaveLength(2);
});

test("parallel calls in one step both reach the prompt and both get results", async () => {
  const { seen, engine } = recordingEngine([
    [
      { kind: "toolCall", name: "calendar", input: {} },
      { kind: "toolCall", name: "notes", input: { person: "Tolga" } },
    ],
    [{ kind: "token", text: "done" }],
  ]);
  const a = agent({
    model: { id: "transformers/onnx-community/Qwen3-0.6B-ONNX", provider: transformersProvider(engine) },
    instructions: "",
    tools: [calendar, notes],
  });
  await a.run("go", { deps: undefined });

  const last = seen[1];
  const asst = last?.messages.find((m) => m.role === "assistant" && m.toolCalls.length > 0);
  expect(asst?.toolCalls.map((c) => c.name)).toEqual(["calendar", "notes"]);
  // Distinct ids, so each result binds to its own call.
  expect(new Set(asst?.toolCalls.map((c) => c.callId)).size).toBe(2);
  expect(last?.messages.filter((m) => m.role === "tool")).toHaveLength(2);

  const rendered = toTemplateMessages("", last?.messages ?? [], formatForModel("onnx-community/Qwen3-0.6B-ONNX"));
  const turn = rendered.find((m) => m.role === "assistant")?.content ?? "";
  expect(turn).toContain('"name":"calendar"');
  expect(turn).toContain('"name":"notes"');
});
