import type { RuntimeAdapter, Transport } from "./context.ts";
import type { FinishReason, JsonValue, ModelId, UsageDelta } from "./primitives.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";
import type { Message } from "./state.ts";
import type { AnyTool } from "./tool.ts";

// §6 — a tiny, published, versioned provider spec. `'provider/model'` strings route over a registry; a
// provider handle (from anthropic()/openai()/…) self-wires.

/** The feature flags a model supports, used for capability-gated routing. */
export interface ModelCapabilities {
  readonly tools: boolean;
  readonly structuredOutput: boolean;
  readonly reasoning: boolean;
  readonly promptCaching: boolean;
  readonly vision: boolean;
  /** Whether the model is safe to call directly from a browser (BYOK) context. */
  readonly browserSafe: boolean;
}

/** Per-token pricing for a model, in integer micro-USD, matching {@link UsageDelta}'s cost fields. */
export interface Pricing {
  readonly inputMicroUsdPerToken: number;
  readonly outputMicroUsdPerToken: number;
  readonly cacheReadMicroUsdPerToken: number;
  readonly cacheWriteMicroUsdPerToken: number;
  readonly reasoningMicroUsdPerToken: number;
}

/** The published spec for one model: its capabilities, pricing, and context size. */
export interface ModelSpec {
  readonly capabilities: ModelCapabilities;
  readonly pricing: Pricing;
  readonly contextWindow: number;
}

/** A provider's published spec: its id and the models it offers keyed by name. */
export interface ProviderSpec {
  readonly id: string;
  readonly models: Readonly<Record<string, ModelSpec>>;
}

/** The provider-agnostic semantic input for one model call. */
export interface ChatRequest {
  readonly model: ModelId;
  readonly system: string;
  readonly messages: readonly Message[];
  readonly tools: readonly AnyTool<unknown>[];
  /** When set, the caller wants structured output (JSON mode) validated by this schema. */
  readonly output?: StandardSchemaV1<unknown, JsonValue>;
}

/**
 * A pre-{@link EventMeta} streaming chunk emitted by a {@link Provider}.
 *
 * @remarks
 * Providers yield chunks, not {@link MithrilEvent}s: the loop is the single
 * `seq` authority and stamps `v`/`runId`/`seq`/`span`/`ts`. This is why
 * providers cannot assign `seq`, and why the eval cache stores `ProviderChunk[]`.
 */
export type ProviderChunk =
  | { readonly type: "text.delta"; readonly delta: string }
  | { readonly type: "reasoning.delta"; readonly delta: string }
  | { readonly type: "tool.input.delta"; readonly callId: string; readonly name: string; readonly partial: string }
  | { readonly type: "tool.call"; readonly callId: string; readonly name: string; readonly input: JsonValue }
  | { readonly type: "object.delta"; readonly partial: JsonValue }
  | { readonly type: "message.end"; readonly usage: UsageDelta; readonly finishReason: FinishReason };

/** A model provider: its {@link ProviderSpec} plus a streaming `chat` entry point. */
export interface Provider {
  readonly spec: ProviderSpec;
  /**
   * Stream one model call as {@link ProviderChunk}s.
   *
   * @param req - The semantic request.
   * @param rt - The {@link RuntimeAdapter} supplying `fetch`/time/crypto.
   * @param transport - How the request reaches the model ({@link Transport}).
   * @param signal - Abort signal for cancellation.
   */
  chat(
    req: ChatRequest,
    rt: RuntimeAdapter,
    transport: Transport,
    signal: AbortSignal,
  ): AsyncGenerator<ProviderChunk>;
}

/**
 * A provider-bound model reference.
 *
 * @remarks
 * Referencing it self-wires the provider and autocompletes model names.
 */
export interface ModelHandle {
  readonly id: ModelId;
  readonly provider: Provider;
}

/** Either a bare `'provider/model'` {@link ModelId} string or a self-wiring {@link ModelHandle}. */
export type ModelInput = ModelId | ModelHandle;

/** Resolves a {@link ModelId} to its {@link Provider} over the set of registered {@link ProviderSpec}s. */
export interface ProviderRegistry {
  resolve(model: ModelId): Provider;
  readonly specs: readonly ProviderSpec[];
}
