import type { FinishReason, JsonValue, ProviderChunk, UsageDelta } from "@mithril/core/protocol";

// Parse an OpenAI (or OpenAI-compatible) chat-completions SSE stream into Mithril ProviderChunks. The loop
// stamps EventMeta; this only translates the wire format. Streamed tool-call argument fragments are
// accumulated per index and emitted as a single `tool.call` (with parsed input) once the stream ends.

interface OAToolCallDelta {
  readonly index: number;
  readonly id?: string;
  readonly function?: { readonly name?: string; readonly arguments?: string };
}
/*
 * Every field is nullable on the wire. A vendor streaming one channel nulls the others rather than
 * omitting them — DeepSeek sends `content: null` throughout a reasoning burst, and `tool_calls: null`
 * on plain text frames — so these are `?: T | null`, not `?: T`.
 */
interface OADelta {
  readonly content?: string | null;
  /** DeepSeek's reasoning channel (`deepseek-reasoner`, and the V4 line). */
  readonly reasoning_content?: string | null;
  /** OpenRouter's reasoning channel (any model it exposes reasoning for). */
  readonly reasoning?: string | null;
  readonly tool_calls?: readonly OAToolCallDelta[] | null;
}
interface OAChoice {
  readonly delta?: OADelta;
  readonly finish_reason?: string | null;
}
interface OAUsage {
  readonly prompt_tokens?: number;
  readonly completion_tokens?: number;
  /** OpenAI/OpenRouter shape for prompt tokens served from cache. */
  readonly prompt_tokens_details?: { readonly cached_tokens?: number };
  /** DeepSeek's flat equivalent of `prompt_tokens_details.cached_tokens`. */
  readonly prompt_cache_hit_tokens?: number;
  readonly completion_tokens_details?: { readonly reasoning_tokens?: number };
  /** OpenRouter only: the generation's cost in credits, where 1 credit is 1 USD. */
  readonly cost?: number;
}
interface OAChunk {
  readonly choices?: readonly OAChoice[];
  /*
   * Explicitly nullable: with `stream_options.include_usage` DeepSeek stamps `"usage": null` on
   * every non-final chunk (OpenAI omits the key entirely), so a presence check is not enough.
   */
  readonly usage?: OAUsage | null;
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

// `prompt_tokens` already counts cached tokens on every vendor here, so cacheRead is reported as a
// breakdown of `input`, not an addition to it. Cost is only ever present on OpenRouter.
function mapUsage(u: OAUsage): UsageDelta {
  return {
    ...ZERO,
    input: u.prompt_tokens ?? 0,
    output: u.completion_tokens ?? 0,
    cacheRead: u.prompt_tokens_details?.cached_tokens ?? u.prompt_cache_hit_tokens ?? 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0,
    costMicroUsd: typeof u.cost === "number" ? Math.round(u.cost * 1e6) : 0,
  };
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
 * - Emits `reasoning.delta` for vendors that stream a reasoning channel — DeepSeek's `reasoning_content`
 *   and OpenRouter's `reasoning` (OpenAI's own chat-completions endpoint streams neither).
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
        // Reasoning arrives before the answer and under a different key per vendor; both map to the
        // one protocol chunk so consumers never branch on which service produced the stream.
        const reasoning = delta?.reasoning_content ?? delta?.reasoning;
        if (typeof reasoning === "string" && reasoning !== "") {
          yield { type: "reasoning.delta", delta: reasoning };
        }
        if (typeof delta?.content === "string" && delta.content !== "") {
          yield { type: "text.delta", delta: delta.content };
        }
        if (delta?.tool_calls != null) {
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
        if (json.usage != null) usage = mapUsage(json.usage);
      }
    }
  } finally {
    reader.releaseLock();
  }
  // Fall back to the block index when the server omits `id`: OpenAI always sends one, but compatible
  // servers (groq, vLLM, llama.cpp) often don't, and two parallel calls sharing "" would be indistinguishable
  // to anything that keys results by callId.
  for (const [index, t] of tools) {
    yield { type: "tool.call", callId: t.id !== "" ? t.id : `call_${index}`, name: t.name, input: safeJson(t.args) };
  }
  yield { type: "message.end", usage, finishReason };
}
