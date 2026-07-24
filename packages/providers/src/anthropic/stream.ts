import type { FinishReason, JsonValue, ProviderChunk, UsageDelta } from "@mithril/core/protocol";

// Parse an Anthropic Messages API SSE stream into Mithril ProviderChunks. Anthropic streams content blocks:
// text blocks (text_delta) and tool_use blocks (input_json_delta, accumulated into one tool.call).

interface AContentBlock {
  readonly type: string;
  readonly id?: string;
  readonly name?: string;
}
interface ADelta {
  readonly type?: string;
  readonly text?: string;
  readonly partial_json?: string;
  readonly stop_reason?: string;
}
interface AEvent {
  readonly type: string;
  readonly index?: number;
  readonly content_block?: AContentBlock;
  readonly delta?: ADelta;
  readonly message?: { readonly usage?: { readonly input_tokens?: number } };
  readonly usage?: { readonly output_tokens?: number };
}

function mapStop(reason: string | undefined): FinishReason {
  switch (reason) {
    case "tool_use":
      return "tool_calls";
    case "max_tokens":
      return "length";
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
 * Parse an Anthropic messages SSE stream into {@link ProviderChunk}s.
 *
 * @param body - ReadableStream from a fetch response (application/x-ndjson).
 * @returns AsyncGenerator yielding text, tool uses, and usage chunks as they stream.
 * @remarks
 * - Handles malformed frames gracefully (skips without crashing).
 * - Accumulates streamed tool input fragments per index and emits a single `tool.call` once the stream ends.
 * - The loop stamps {@link EventMeta}; this translates wire format only.
 * - Anthropic's native `stop_reason` is mapped to the generic {@link FinishReason} for provider interop.
 */
export async function* parseAnthropicStream(body: ReadableStream<Uint8Array>): AsyncGenerator<ProviderChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const tools = new Map<number, { id: string; name: string; args: string }>();
  let inputTokens = 0;
  let outputTokens = 0;
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
        const e = parseFrame<AEvent>(dataLine.slice(5).trim());
        if (e === undefined) continue;
        if (e.type === "message_start") {
          inputTokens = e.message?.usage?.input_tokens ?? 0;
        } else if (e.type === "content_block_start" && e.content_block?.type === "tool_use") {
          tools.set(e.index ?? 0, { id: e.content_block.id ?? "", name: e.content_block.name ?? "", args: "" });
        } else if (e.type === "content_block_delta") {
          if (e.delta?.type === "text_delta" && e.delta.text !== undefined) {
            yield { type: "text.delta", delta: e.delta.text };
          } else if (e.delta?.type === "input_json_delta" && e.delta.partial_json !== undefined) {
            const cur = tools.get(e.index ?? 0);
            if (cur !== undefined) {
              cur.args += e.delta.partial_json;
              yield { type: "tool.input.delta", callId: cur.id, name: cur.name, partial: e.delta.partial_json };
            }
          }
        } else if (e.type === "message_delta") {
          finishReason = mapStop(e.delta?.stop_reason);
          outputTokens = e.usage?.output_tokens ?? outputTokens;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  for (const t of tools.values()) yield { type: "tool.call", callId: t.id, name: t.name, input: safeJson(t.args) };
  const usage: UsageDelta = { input: inputTokens, output: outputTokens, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
  yield { type: "message.end", usage, finishReason };
}
