import { expect, test } from "bun:test";
import type { MithrilEvent, StandardSchemaV1 } from "../src/protocol/index.ts";
import { agentLoop, harmonyRepair, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn } from "../src/testkit/index.ts";

function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

async function collect<R>(gen: AsyncGenerator<MithrilEvent, R>): Promise<{ readonly events: readonly MithrilEvent[]; readonly result: R }> {
  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) return { events, result: r.value };
    events.push(r.value);
  }
}

// A leaked-tool-call turn: the model's native tool grammar arrives as ordinary assistant TEXT (finish
// reason "stop"), so the provider parses NO tool_calls — harmonyRepair must recover the call.
function leakedTextTurn(text: string): ReturnType<typeof textTurn> {
  return textTurn(text, "stop");
}

test("harmonyRepair recovers a gpt-oss harmony tool call that leaked into assistant text", async () => {
  let ranWith: unknown;
  const saveNote = tool({
    name: "save_note",
    description: "",
    inputSchema: passSchema<{ title: string }>(),
    execute: async (input) => {
      ranWith = input;
      return { ok: true };
    },
  });
  const harmony = '<|channel|>commentary to=functions.save_note <|message|>{"title":"Tokyo Trip"}';
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([leakedTextTurn(harmony), textTurn("saved")])),
      instructions: "hi",
      tools: [saveNote],
      input: "go",
      deps: undefined,
      healing: [harmonyRepair()],
    }),
  );
  // The salvaged call actually executed with the recovered args.
  expect(ranWith).toEqual({ title: "Tokyo Trip" });
  // A visible tool.repair (mechanism "parse") documents the salvage.
  const repair = events.find((e) => e.type === "tool.repair");
  expect(repair?.type).toBe("tool.repair");
  if (repair?.type === "tool.repair") {
    expect(repair.mechanism).toBe("parse");
    expect(repair.name).toBe("save_note");
    expect(repair.after).toEqual({ title: "Tokyo Trip" });
  }
  // The salvaged call executed and produced a tool.result (a middleware-injected call is announced via
  // tool.repair + tool.result, not a provider-sourced tool.call event).
  expect(events.some((e) => e.type === "tool.result")).toBe(true);
  expect(result.status).toBe("completed");
});

test("harmonyRepair recovers a leaked <tool_call> JSON block (Hermes/Qwen grammar)", async () => {
  let ranWith: unknown;
  const weather = tool({
    name: "get_weather",
    description: "",
    inputSchema: passSchema<{ city: string }>(),
    execute: async (input) => {
      ranWith = input;
      return { ok: true };
    },
  });
  const leaked = '<tool_call>{"name":"get_weather","arguments":{"city":"Tokyo"}}</tool_call>';
  const { result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([leakedTextTurn(leaked), textTurn("done")])),
      instructions: "hi",
      tools: [weather],
      input: "go",
      deps: undefined,
      healing: [harmonyRepair()],
    }),
  );
  expect(ranWith).toEqual({ city: "Tokyo" });
  expect(result.status).toBe("completed");
});

test("harmonyRepair never salvages a call whose name the agent does not expose", async () => {
  const other = tool({ name: "other", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => ({ ok: true }) });
  // References a tool the agent does NOT have — must be treated as plain text, not a tool call.
  const harmony = '<|channel|>commentary to=functions.delete_everything <|message|>{"confirm":true}';
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([leakedTextTurn(harmony)])),
      instructions: "hi",
      tools: [other],
      input: "go",
      deps: undefined,
      healing: [harmonyRepair()],
    }),
  );
  expect(events.some((e) => e.type === "tool.call")).toBe(false);
  expect(events.some((e) => e.type === "tool.repair")).toBe(false);
  // No salvage ⇒ the leaked text is the final answer and the run completes as text.
  expect(result.status).toBe("completed");
  if (result.status === "completed") expect(result.output).toContain("to=functions.delete_everything");
});

test("harmonyRepair leaves a normal text answer untouched", async () => {
  const t = tool({ name: "noop", description: "", inputSchema: passSchema<Record<string, never>>(), execute: async () => ({ ok: true }) });
  const { events, result } = await collect(
    agentLoop({
      model: testModel(scriptedProvider([textTurn("Just a plain answer, no tools.")])),
      instructions: "hi",
      tools: [t],
      input: "go",
      deps: undefined,
      healing: [harmonyRepair()],
    }),
  );
  expect(events.some((e) => e.type === "tool.repair")).toBe(false);
  expect(result.status).toBe("completed");
  if (result.status === "completed") expect(result.output).toBe("Just a plain answer, no tools.");
});
