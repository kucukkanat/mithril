import type { AnyTool, JsonValue, Message, Provider, ProviderChunk, ProviderSpec, UsageDelta } from "@mithril/core/protocol";

// Pure, dependency-free CORE for the browser-local Transformers.js provider. It imports only TYPES (erasable),
// so `@mithril/providers` stays dependency-free and this provider is Node-unit-testable with a fake engine —
// exactly the `scriptedProvider` blueprint. The heavy `@huggingface/transformers` code lives in `./edge.ts`,
// reached only through the injected `TransformersEngine` port. A local model does NO network: `chat()` ignores
// `transport` and never touches `rt.fetch`.

const ZERO_DELTA: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

/** The semantic request handed to a {@link TransformersEngine} (a flattened {@link ChatRequest}). */
export interface EngineRequest {
  /** HF repo id (the `transformers/` handle prefix already stripped), e.g. `onnx-community/Qwen3-0.6B-ONNX`. */
  readonly model: string;
  readonly system: string;
  readonly messages: readonly Message[];
  readonly tools: readonly AnyTool<unknown>[];
  readonly signal: AbortSignal;
}

/** One item a {@link TransformersEngine} yields: a visible text token, a reasoning token, or a fully-parsed tool call. */
export type EngineChunk =
  | { readonly kind: "token"; readonly text: string }
  | { readonly kind: "reasoning"; readonly text: string }
  | { readonly kind: "toolCall"; readonly name: string; readonly input: JsonValue; readonly callId?: string };

/**
 * The injected inference engine — the seam that keeps the provider testable without WebGPU/ONNX.
 *
 * @remarks A browser implementation ({@link browserEngine}) wraps `@huggingface/transformers`; a test injects a
 * fake that yields scripted {@link EngineChunk}s. Sentinel stripping + tool-call parsing happen inside the
 * engine (see `./tool-formats.ts`), so it yields already-parsed tool calls.
 */
export interface TransformersEngine {
  generate(req: EngineRequest): AsyncIterable<EngineChunk>;
  /** Real token counts for the last generation, when the engine can supply them (from tensor dims). */
  usage?(): { readonly inputTokens: number; readonly outputTokens: number } | undefined;
}

/** The provider spec id for local Transformers.js models. `models` is advisory (real capability is per-model). */
export const TRANSFORMERS_SPEC: ProviderSpec = { id: "transformers", models: {} };

// The handle id is `transformers/<repo-id>` (repo id may itself contain a slash, e.g. `onnx-community/…`), so
// strip only the leading `transformers/` segment — mirrors openai's `req.model.slice(indexOf("/")+1)`.
function stripPrefix(id: string): string {
  return id.includes("/") ? id.slice(id.indexOf("/") + 1) : id;
}

/**
 * Build a {@link Provider} from an injected {@link TransformersEngine} — the pure, Node-testable core.
 *
 * @param engine - the inference engine (a browser engine for real use, a fake for tests).
 * @returns a `Provider` whose `chat()` streams `text.delta` (and `reasoning.delta` for models that think),
 * buffers tool calls and flushes them before a
 * single terminal `message.end` — the exact ordering of the OpenAI adapter. It ignores `transport`/`rt` and
 * never performs I/O.
 * @example
 * ```ts
 * import { transformersProvider } from "@mithril/providers/transformers";
 *
 * const fake = { async *generate() { yield { kind: "token", text: "hi" }; } };
 * const provider = transformersProvider(fake);
 * ```
 */
export function transformersProvider(engine: TransformersEngine): Provider {
  return {
    spec: TRANSFORMERS_SPEC,
    async *chat(req, _rt, _transport, signal): AsyncGenerator<ProviderChunk> {
      const calls: { readonly callId: string; readonly name: string; readonly input: JsonValue }[] = [];
      let n = 0;
      for await (const c of engine.generate({
        model: stripPrefix(req.model),
        system: req.system,
        messages: req.messages,
        tools: req.tools,
        signal,
      })) {
        if (c.kind === "token") {
          if (c.text !== "") yield { type: "text.delta", delta: c.text };
        } else if (c.kind === "reasoning") {
          if (c.text !== "") yield { type: "reasoning.delta", delta: c.text };
        } else {
          calls.push({ callId: c.callId ?? `call_${n++}`, name: c.name, input: c.input });
        }
      }
      // Flush buffered tool calls before the terminator (openai/stream.ts ordering).
      for (const t of calls) yield { type: "tool.call", callId: t.callId, name: t.name, input: t.input };
      const u = engine.usage?.();
      const usage: UsageDelta = u !== undefined ? { ...ZERO_DELTA, input: u.inputTokens, output: u.outputTokens } : ZERO_DELTA;
      // FinishReason has no "abort"; the loop derives cancellation from the signal itself, so "stop" is fine.
      yield { type: "message.end", usage, finishReason: calls.length > 0 ? "tool_calls" : "stop" };
    },
  };
}
