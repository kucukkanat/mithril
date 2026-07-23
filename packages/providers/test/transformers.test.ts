import { expect, test } from "bun:test";
import { agent } from "@mithril/core/agent";
import type { ChatRequest, ProviderChunk } from "@mithril/core/protocol";
import { type EngineChunk, type TransformersEngine, transformersProvider } from "../src/transformers/core.ts";
import { angleToolCall, formatForModel, gemmaToolCall, liquidToolCall, reasoningForModel, splitToolCalls, thinkReasoning } from "../src/transformers/tool-formats.ts";

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const c of gen) out.push(c);
  return out;
}
async function* toks(...xs: string[]): AsyncGenerator<string> {
  for (const x of xs) yield x;
}
function engineOf(chunks: readonly EngineChunk[], usage?: { inputTokens: number; outputTokens: number }): TransformersEngine {
  return {
    async *generate() {
      for (const c of chunks) yield c;
    },
    usage: () => usage,
  };
}
const REQ = (model: string): ChatRequest => ({ model: model as ChatRequest["model"], system: "", messages: [], tools: [] });
const SIGNAL = new AbortController().signal;

// ── provider core (the injection seam — no ONNX/WebGPU) ─────────────────────────────────────────────────
test("provider streams text, buffers tool calls before message.end, synthesizes callIds + real usage", async () => {
  const provider = transformersProvider(
    engineOf(
      [
        { kind: "token", text: "Hello " },
        { kind: "token", text: "world" },
        { kind: "toolCall", name: "search", input: { q: "x" } },
        { kind: "toolCall", name: "fetch", input: { id: 3 } },
      ],
      { inputTokens: 10, outputTokens: 5 },
    ),
  );
  const chunks = await collect(provider.chat(REQ("transformers/onnx-community/Qwen3-0.6B-ONNX"), {} as never, {} as never, SIGNAL));
  expect(chunks.map((c: ProviderChunk) => c.type)).toEqual(["text.delta", "text.delta", "tool.call", "tool.call", "message.end"]);
  const calls = chunks.filter((c) => c.type === "tool.call");
  expect(calls).toEqual([
    { type: "tool.call", callId: "call_0", name: "search", input: { q: "x" } },
    { type: "tool.call", callId: "call_1", name: "fetch", input: { id: 3 } },
  ]);
  expect(chunks.at(-1)).toMatchObject({ type: "message.end", finishReason: "tool_calls", usage: { input: 10, output: 5 } });
});

test("no tools → finishReason stop; no usage → ZERO delta", async () => {
  const provider = transformersProvider(engineOf([{ kind: "token", text: "hi" }]));
  const chunks = await collect(provider.chat(REQ("transformers/x/y"), {} as never, {} as never, SIGNAL));
  expect(chunks.at(-1)).toMatchObject({ type: "message.end", finishReason: "stop", usage: { input: 0, output: 0, costMicroUsd: 0 } });
});

test("an agent runs on a fake transformers engine end-to-end (zero network)", async () => {
  const handle = { id: "transformers/onnx-community/Qwen3-0.6B-ONNX" as const, provider: transformersProvider(engineOf([{ kind: "token", text: "It is sunny." }])) };
  const res = await agent({ model: handle, instructions: "help" }).run("weather?");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("It is sunny.");
});

// ── splitToolCalls (pure streaming parser, per-format) ──────────────────────────────────────────────────
async function drain(gen: AsyncIterable<EngineChunk>): Promise<{ text: string; calls: EngineChunk[] }> {
  const out = await collect(gen);
  return { text: out.filter((c): c is Extract<EngineChunk, { kind: "token" }> => c.kind === "token").map((c) => c.text).join(""), calls: out.filter((c) => c.kind === "toolCall") };
}

test("passthrough when no format", async () => {
  expect((await drain(splitToolCalls(toks("a", "b"), undefined))).text).toBe("ab");
});

test("Hermes JSON tool call — text kept, sentinels suppressed", async () => {
  const r = await drain(splitToolCalls(toks("Let me check ", '<tool_call>{"name":"search","arguments":{"q":"cats"}}</tool_call>'), angleToolCall));
  expect(r.text).toBe("Let me check ");
  expect(r.calls).toEqual([{ kind: "toolCall", name: "search", input: { q: "cats" } }]);
});

test("sentinel split across token boundaries never leaks", async () => {
  const r = await drain(splitToolCalls(toks("<tool_", 'call>{"name":"f","arguments":{}}', "</tool_call>"), angleToolCall));
  expect(r.text).toBe("");
  expect(r.calls).toEqual([{ kind: "toolCall", name: "f", input: {} }]);
});

test("Qwen3.5 nested-XML tool call", async () => {
  const r = await drain(splitToolCalls(toks("<tool_call><function=get_weather><parameter=city>Paris</parameter></function></tool_call>"), angleToolCall));
  expect(r.calls).toEqual([{ kind: "toolCall", name: "get_weather", input: { city: "Paris" } }]);
});

test("Gemma native <|tool_call|> token, call to EOS", async () => {
  const r = await drain(splitToolCalls(toks('<|tool_call|>{"name":"g","arguments":{"x":1}}'), gemmaToolCall));
  expect(r.calls).toEqual([{ kind: "toolCall", name: "g", input: { x: 1 } }]);
});

// ── Liquid LFM2: <|tool_call_start|>[ name(k=v, …), … ]<|tool_call_end|> (Python-style, parallel calls) ────
test("Liquid LFM2 — multiple keyword-arg calls in one block", async () => {
  const r = await drain(
    splitToolCalls(toks('Sure. <|tool_call_start|>[getWeather(city="Istanbul"), findHotels(city="Istanbul", nights=2)]<|tool_call_end|>'), liquidToolCall),
  );
  expect(r.text).toBe("Sure. ");
  expect(r.calls).toEqual([
    { kind: "toolCall", name: "getWeather", input: { city: "Istanbul" } },
    { kind: "toolCall", name: "findHotels", input: { city: "Istanbul", nights: 2 } },
  ]);
});

test("Liquid LFM2 — value types (string, number, bool) and a comma inside a quoted arg", async () => {
  const r = await drain(splitToolCalls(toks('<|tool_call_start|>[deploy(env="prod, staging", force=True, count=3)]<|tool_call_end|>'), liquidToolCall));
  expect(r.calls).toEqual([{ kind: "toolCall", name: "deploy", input: { env: "prod, staging", force: true, count: 3 } }]);
});

test("Liquid LFM2 — sentinel split across token boundaries never leaks", async () => {
  const r = await drain(splitToolCalls(toks("<|tool_", 'call_start|>[f(x=1)]<|tool_call', "_end|>"), liquidToolCall));
  expect(r.text).toBe("");
  expect(r.calls).toEqual([{ kind: "toolCall", name: "f", input: { x: 1 } }]);
});

test("formatForModel routes Gemma / LFM / else", () => {
  expect(formatForModel("onnx-community/gemma-4-E2B-it-ONNX").name).toBe("gemma-tool_call");
  expect(formatForModel("LiquidAI/LFM2.5-1.2B-Instruct-ONNX").name).toBe("liquid-tool_call");
  expect(formatForModel("onnx-community/Qwen3-0.6B-ONNX").name).toBe("angle-tool_call");
});

test("multiple Hermes calls in one turn", async () => {
  const r = await drain(splitToolCalls(toks('<tool_call>{"name":"a","arguments":{}}</tool_call><tool_call>{"name":"b","arguments":{}}</tool_call>'), angleToolCall));
  expect(r.calls.map((c) => (c.kind === "toolCall" ? c.name : ""))).toEqual(["a", "b"]);
});

test("malformed tool JSON fails soft — no crash, no call", async () => {
  const r = await drain(splitToolCalls(toks("<tool_call>{not json</tool_call>"), angleToolCall));
  expect(r.calls).toEqual([]);
});

// ── reasoning split: <think>…</think> → reasoning chunks, answer stays clean ─────────────────────────────
function drainReason(out: EngineChunk[]): { text: string; reasoning: string; calls: EngineChunk[] } {
  const text = out.filter((c): c is Extract<EngineChunk, { kind: "token" }> => c.kind === "token").map((c) => c.text).join("");
  const reasoning = out.filter((c): c is Extract<EngineChunk, { kind: "reasoning" }> => c.kind === "reasoning").map((c) => c.text).join("");
  return { text, reasoning, calls: out.filter((c) => c.kind === "toolCall") };
}

test("reasoning block is routed to reasoning chunks, answer text stays clean", async () => {
  const out = await collect(splitToolCalls(toks("<think>let me consider the sky</think>", "blue"), undefined, thinkReasoning));
  const r = drainReason(out);
  expect(r.reasoning).toBe("let me consider the sky");
  expect(r.text).toBe("blue");
});

test("reasoning sentinels split across token boundaries never leak into the answer", async () => {
  const out = await collect(splitToolCalls(toks("<thin", "k>thinking hard</thi", "nk>the answer"), undefined, thinkReasoning));
  const r = drainReason(out);
  expect(r.reasoning).toBe("thinking hard");
  expect(r.text).toBe("the answer");
});

test("reasoning then a tool call — both parsed, no leakage", async () => {
  const out = await collect(
    splitToolCalls(toks("<think>I should search</think>", '<tool_call>{"name":"search","arguments":{"q":"cats"}}</tool_call>'), angleToolCall, thinkReasoning),
  );
  const r = drainReason(out);
  expect(r.reasoning).toBe("I should search");
  expect(r.text).toBe("");
  expect(r.calls).toEqual([{ kind: "toolCall", name: "search", input: { q: "cats" } }]);
});

test("an unterminated reasoning block flushes as reasoning, never as answer text", async () => {
  const out = await collect(splitToolCalls(toks("<think>still thinking with no close"), undefined, thinkReasoning));
  const r = drainReason(out);
  expect(r.reasoning).toBe("still thinking with no close");
  expect(r.text).toBe("");
});

test("no reasoning format ⇒ <think> stays in the visible text (legacy behavior preserved)", async () => {
  const out = await collect(splitToolCalls(toks("<think>x</think>y"), undefined));
  const r = drainReason(out);
  expect(r.reasoning).toBe("");
  expect(r.text).toBe("<think>x</think>y");
});

test("the transformers provider surfaces reasoning as reasoning.delta and keeps text.delta clean", async () => {
  const provider = transformersProvider(engineOf([
    { kind: "reasoning", text: "deciding" },
    { kind: "token", text: "final answer" },
  ]));
  const chunks = await collect(provider.chat(REQ("onnx-community/Qwen3-0.6B-ONNX"), {} as never, {} as never, SIGNAL));
  const reasoning = chunks.filter((c): c is Extract<ProviderChunk, { type: "reasoning.delta" }> => c.type === "reasoning.delta").map((c) => c.delta).join("");
  const text = chunks.filter((c): c is Extract<ProviderChunk, { type: "text.delta" }> => c.type === "text.delta").map((c) => c.delta).join("");
  expect(reasoning).toBe("deciding");
  expect(text).toBe("final answer");
});

test("reasoningForModel returns the shared <think> grammar", () => {
  expect(reasoningForModel("onnx-community/Qwen3-0.6B-ONNX")).toEqual(thinkReasoning);
});
