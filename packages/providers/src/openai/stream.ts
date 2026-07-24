import type { FinishReason, JsonValue, ProviderChunk, UsageDelta } from "@mithril/core/protocol";

// Parse an OpenAI (or OpenAI-compatible) chat-completions SSE stream into Mithril ProviderChunks. The loop
// stamps EventMeta; this only translates the wire format. Streamed tool-call argument fragments are
// accumulated per index and emitted as a single `tool.call` (with parsed input) once the stream ends.

interface OAToolCallDelta {
  readonly index: number;
  readonly id?: string;
  readonly function?: { readonly name?: string; readonly arguments?: string };
}
interface OADelta {
  readonly content?: string;
  readonly tool_calls?: readonly OAToolCallDelta[];
}
interface OAChoice {
  readonly delta?: OADelta;
  readonly finish_reason?: string | null;
}
interface OAChunk {
  readonly choices?: readonly OAChoice[];
  readonly usage?: { readonly prompt_tokens?: number; readonly completion_tokens?: number };
}

const ZERO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function mapFinish(reason: string | null | undefined): FinishReason {
  switch (reason) {
    case "length":
      return "length";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    default:
      return "stop";
  }
}

function safeJson(s: string): JsonValue {
  if (s.trim() === "") return {};
  try {
    return JSON.parse(s) as JsonValue;
  } catch {
    return {};
  }
}

// Parse one SSE data frame, skipping (not throwing on) a malformed one — a truncated or corrupt frame
// must not take the whole stream (and thus the run) down.
function parseFrame<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

/**
 * Parse an OpenAI (or OpenAI-compatible) chat-completions SSE stream into {@link ProviderChunk}s.
 *
 * @param body - ReadableStream from a fetch response (application/x-ndjson).
 * @returns AsyncGenerator yielding text, tool calls, and usage chunks as they stream.
 * @remarks
 * - Handles malformed frames gracefully (skips without crashing).
 * - Accumulates streamed tool-call argument fragments per index and emits a single `tool.call` once the stream ends.
 * - The loop stamps {@link EventMeta}; this translates wire format only.
 * - Provider-agnostic: works with OpenAI, compatible gateways, and local SSE sources.
 */
export async function* parseOpenAIStream(body: ReadableStream<Uint8Array>): AsyncGenerator<ProviderChunk> {
  // Read raw bytes + decode manually (pipeThrough(TextDecoderStream) trips the generic-Uint8Array lib types).
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const tools = new Map<number, { id: string; name: string; args: string }>();
  let usage: UsageDelta = ZERO;
  let finishReason: FinishReason = "stop";
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += value !== undefined ? decoder.decode(value, { stream: true }) : "";
      let idx = buf.indexOf("\n\n");
      while (idx !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        idx = buf.indexOf("\n\n");
        const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
        if (dataLine === undefined) continue;
        const data = dataLine.slice(5).trim();
        if (data === "[DONE]") continue;
        const json = parseFrame<OAChunk>(data);
        if (json === undefined) continue;
        const choice = json.choices?.[0];
        const delta = choice?.delta;
        if (delta?.content !== undefined && delta.content !== "") {
          yield { type: "text.delta", delta: delta.content };
        }
        if (delta?.tool_calls !== undefined) {
          for (const tc of delta.tool_calls) {
            const cur = tools.get(tc.index) ?? { id: "", name: "", args: "" };
            if (tc.id !== undefined) cur.id = tc.id;
            if (tc.function?.name !== undefined) cur.name = tc.function.name;
            const args = tc.function?.arguments;
            if (args !== undefined && args !== "") {
              cur.args += args;
              yield { type: "tool.input.delta", callId: cur.id, name: cur.name, partial: args };
            }
            tools.set(tc.index, cur);
          }
        }
        if (choice?.finish_reason !== undefined && choice.finish_reason !== null) {
          finishReason = mapFinish(choice.finish_reason);
        }
        if (json.usage !== undefined) {
          usage = { ...ZERO, input: json.usage.prompt_tokens ?? 0, output: json.usage.completion_tokens ?? 0 };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  for (const t of tools.values()) {
    yield { type: "tool.call", callId: t.id, name: t.name, input: safeJson(t.args) };
  }
  yield { type: "message.end", usage, finishReason };
}
