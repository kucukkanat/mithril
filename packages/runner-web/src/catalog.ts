/*
 * The provider + local-model catalog behind an in-browser runner's "Run against" UI. Pure data —
 * no React, no side effects. Shared by the docs playground and the Studio so the supported-provider
 * list, default models, and dtype pins can never drift between them.
 */

/** A runner's three execution modes: offline scripted double, remote BYOK, or on-device. */
export type ProviderMode = "scripted" | "live" | "local";

/**
 * An ONNX execution backend a local model can run on. Mirrors the transformers provider's `device`
 * union (defined here too so the catalog stays import-free). `webgpu` is the browser GPU path; `wasm`
 * is the browser CPU path; `cpu` is onnxruntime-node (Node/Bun, and the eval harness).
 */
export type Backend = "webgpu" | "wasm" | "cpu";

/** Every backend — the portable default a model runs on when it declares no {@link LocalModel.backends} restriction. */
export const ALL_BACKENDS: readonly Backend[] = ["webgpu", "wasm", "cpu"];

/** The remote providers supported for direct-browser BYOK — the four that reliably allow CORS calls. */
export type LiveProviderId = "openai" | "anthropic" | "google" | "groq";

/** A remote provider a browser snippet can call directly with the user's own key. */
export interface LiveProvider {
  readonly id: LiveProviderId;
  readonly label: string;
  /** The env var the BYOK fallback reads — `<PROVIDER>_API_KEY`, keyed off the model id's prefix. */
  readonly envVar: string;
  /** A cheap, sensible default model, prefilled in the panel. */
  readonly defaultModel: string;
  /** `native` adapters ship first-class; `openai-compat` reuse the OpenAI adapter + a `baseUrl`. */
  readonly kind: "native" | "openai-compat";
  /** The OpenAI-wire base URL — set only for `openai-compat` providers. */
  readonly baseUrl?: string;
  /** The host the BYOK key is sent to (shown in the security-confirm gate). */
  readonly host: string;
  /** Where a visitor creates a key (linked from the panel). */
  readonly consoleUrl: string;
}

/** The remote providers the "Run against" UI supports. */
export const LIVE_PROVIDERS: readonly LiveProvider[] = [
  { id: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY", defaultModel: "gpt-4o-mini", kind: "native", host: "api.openai.com", consoleUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", envVar: "ANTHROPIC_API_KEY", defaultModel: "claude-3-5-haiku-latest", kind: "native", host: "api.anthropic.com", consoleUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", label: "Google Gemini", envVar: "GOOGLE_API_KEY", defaultModel: "gemini-2.0-flash", kind: "native", host: "generativelanguage.googleapis.com", consoleUrl: "https://aistudio.google.com/apikey" },
  { id: "groq", label: "Groq", envVar: "GROQ_API_KEY", defaultModel: "llama-3.3-70b-versatile", kind: "openai-compat", baseUrl: "https://api.groq.com/openai/v1", host: "api.groq.com", consoleUrl: "https://console.groq.com/keys" },
];

/** Look up a {@link LiveProvider} by id; throws on an unknown id. */
export function liveProvider(id: LiveProviderId): LiveProvider {
  const p = LIVE_PROVIDERS.find((x) => x.id === id);
  if (p === undefined) throw new Error(`Unknown live provider: ${id}`);
  return p;
}

/**
 * A curated in-browser model — all `text-generation` ONNX repos. This MUST hold: the transformers
 * provider loads every model with `AutoModelForCausalLM` (a text-only path), so a vision-language /
 * `image-text-to-text` repo — even one with an ONNX build — loads but generates garbled output and
 * never emits tool calls in its trained shape.
 */
export interface LocalModel {
  readonly id: string;
  readonly label: string;
  readonly size: string;
  readonly tools: boolean;
  /**
   * Pin a quantization dtype, overriding the provider's device default (`q4f16` on WebGPU, `q4` on CPU/WASM).
   * Three reasons a model needs this: (1) fp16 instability — Granite 4.0's Mamba2 layers overflow to NaN under
   * `q4f16` on WebGPU and emit a stream of `!` (token 0), so its card recommends `q4`; (2) a repo that ships
   * only one dtype — Qwen3-4B ships `q4f16` only, so the CPU/WASM `q4` default 404s and it must be pinned to
   * `q4f16`; (3) a repo with no `q4f16` build — Bonsai-1.7B-ONNX ships `q1`/`q2`/`q4`/`q8` (a 1-bit-native
   * model) but no `q4f16`, so the WebGPU default 404s and it's pinned to the device-portable `q4`. When set,
   * generated examples AND the preload both use it, so the cached weights match.
   */
  readonly dtype?: string;
  /**
   * Restrict which ONNX {@link Backend}s this model can run on. Omit (the common case) ⇒ portable across
   * all of {@link ALL_BACKENDS}. Set it when a model's only published build can't execute everywhere — e.g.
   * Ternary-Bonsai-8B ships a lone `q2f16` (ternary/1.58-bit) ONNX, and ONNX Runtime's CPU/WASM `MatMulNBits`
   * kernel has no 2-bit fp16 path, so it runs **only** on WebGPU (`backends: ["webgpu"]`). Consumers use this
   * to gate the model: the picker disables it when the required backend is unavailable, the eval harness (CPU)
   * skips it, and the provider throws an ergonomic `WEBGPU_REQUIRED` MithrilError rather than a cryptic
   * mid-stream ONNX failure. See {@link requiresWebGPU} / {@link modelBackends}.
   */
  readonly backends?: readonly Backend[];
}

// The shipped catalog: the two anchors (Qwen3-0.6B, LFM2.5) + eight researched, multi-tool-evaluated
// additions. Every entry is text-generation, emits a tool-call grammar the parser handles, and was
// verified against the multi-tool scenarios. Ordered smallest-first after the default. Ternary-Bonsai-8B
// is the first WebGPU-only entry (see its `backends`).
export const LOCAL_MODELS: readonly LocalModel[] = [
  { id: "onnx-community/Qwen3-0.6B-ONNX", label: "Qwen3 0.6B", size: "~0.55 GB", tools: true },
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B", size: "~0.5 GB", tools: true },
  { id: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX", label: "LFM2.5 1.2B", size: "~0.8 GB", tools: true },
  { id: "onnx-community/Bonsai-1.7B-ONNX", label: "Bonsai 1.7B", size: "~1.1 GB", tools: true, dtype: "q4" },
  { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Qwen2.5 1.5B", size: "~1.2 GB", tools: true },
  { id: "onnx-community/Qwen3-1.7B-ONNX", label: "Qwen3 1.7B", size: "~1.4 GB", tools: true },
  { id: "onnx-community/granite-4.0-1b-ONNX-web", label: "Granite 4.0 1B", size: "~1.8 GB", tools: true, dtype: "q4" },
  { id: "onnx-community/Qwen3-4B-ONNX", label: "Qwen3 4B", size: "~2.1 GB", tools: true, dtype: "q4f16" },
  // WebGPU-only: ships a lone `q2f16` (ternary/1.58-bit) build; CPU/WASM MatMulNBits has no 2-bit fp16 path.
  // Verified against the HF file tree + chat template (2026-07-24); tool-calling on WebGPU is UNVERIFIED
  // (no headless WebGPU in CI — the CPU eval harness skips it). See guides/local-inference.
  { id: "onnx-community/Ternary-Bonsai-8B-ONNX", label: "Ternary Bonsai 8B", size: "~2.2 GB", tools: true, dtype: "q2f16", backends: ["webgpu"] },
  { id: "onnx-community/Bonsai-8B-ONNX", label: "Bonsai 8B", size: "~4.75 GB", tools: true },
];

/** The catalog's default on-device model. */
export const DEFAULT_LOCAL_MODEL = LOCAL_MODELS[0]!.id;

/** Look up a curated local model by repo id (for its `dtype` pin, size, etc.); `undefined` for free-text ids. */
export function localModel(id: string): LocalModel | undefined {
  return LOCAL_MODELS.find((m) => m.id === id);
}

/**
 * The backends a model may run on: its declared {@link LocalModel.backends}, or {@link ALL_BACKENDS} when
 * unrestricted. Accepts a {@link LocalModel} or a bare repo id (unknown/free-text ids ⇒ all backends).
 */
export function modelBackends(model: LocalModel | string): readonly Backend[] {
  const m = typeof model === "string" ? localModel(model) : model;
  return m?.backends ?? ALL_BACKENDS;
}

/** True when a model can run **only** on WebGPU — i.e. its {@link LocalModel.backends} is exactly `["webgpu"]`. */
export function requiresWebGPU(model: LocalModel | string): boolean {
  const b = modelBackends(model);
  return b.length === 1 && b[0] === "webgpu";
}
