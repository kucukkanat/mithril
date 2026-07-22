/*
 * The provider catalog + example assembler behind the playground's Run against bar. Pure data +
 * string assembly — no React, no side effects.
 *
 * Accuracy first: every assembled example is REAL, portable @mithril/* code. The only thing the
 * playground adds is the API key, injected into the worker as `process.env.<PROVIDER>_API_KEY` —
 * exactly how BYOK resolves on Node/Bun (see `resolveTransport`). So live examples omit `transport`
 * and let that environment fallback supply the key; nothing here is playground magic. Picking a
 * provider re-assembles the current example (same body, only the model line changes) — see
 * `assembleExample`, which is what removes the need for separate "live" / "local" examples.
 */

/** The playground's three run modes: offline scripted (default), remote BYOK, or on-device. */
export type ProviderMode = "scripted" | "live" | "local";

/** The remote providers the Run against bar supports — the four that make reliable direct-browser BYOK calls. */
export type LiveProviderId = "openai" | "anthropic" | "google" | "groq";

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

export const LIVE_PROVIDERS: readonly LiveProvider[] = [
  { id: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY", defaultModel: "gpt-4o-mini", kind: "native", host: "api.openai.com", consoleUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", envVar: "ANTHROPIC_API_KEY", defaultModel: "claude-3-5-haiku-latest", kind: "native", host: "api.anthropic.com", consoleUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", label: "Google Gemini", envVar: "GOOGLE_API_KEY", defaultModel: "gemini-2.0-flash", kind: "native", host: "generativelanguage.googleapis.com", consoleUrl: "https://aistudio.google.com/apikey" },
  { id: "groq", label: "Groq", envVar: "GROQ_API_KEY", defaultModel: "llama-3.3-70b-versatile", kind: "openai-compat", baseUrl: "https://api.groq.com/openai/v1", host: "api.groq.com", consoleUrl: "https://console.groq.com/keys" },
];

export function liveProvider(id: LiveProviderId): LiveProvider {
  const p = LIVE_PROVIDERS.find((x) => x.id === id);
  if (p === undefined) throw new Error(`Unknown live provider: ${id}`);
  return p;
}

/**
 * Curated in-browser models — all `text-generation` (pipeline_tag verified 2026-07-21). This MUST hold:
 * the transformers provider loads every model with `AutoModelForCausalLM` (a text-only path), so a
 * vision-language / `image-text-to-text` repo — even one with an ONNX build — loads but generates garbled
 * output and never emits tool calls in its trained shape. A subset of the local-inference guide's catalog
 * (the multi-GB Gemma is left out). Any other Hugging Face **text-generation** ONNX repo id still runs via
 * the free-text model field.
 */
export interface LocalModel {
  readonly id: string;
  readonly label: string;
  readonly size: string;
  readonly tools: boolean;
  /**
   * Pin a quantization dtype, overriding the provider's device default (`q4f16` on WebGPU, `q4` on CPU/WASM).
   * Two reasons a model needs this: (1) fp16 instability — Granite 4.0's Mamba2 layers overflow to NaN under
   * `q4f16` on WebGPU and emit a stream of `!` (token 0), so its card recommends `q4`; (2) a repo that ships
   * only one dtype — Qwen3-4B ships `q4f16` only, so the CPU/WASM `q4` default 404s and it must be pinned to
   * `q4f16`. When set, the assembled example AND the preload both use it, so the cached weights match.
   */
  readonly dtype?: string;
}

// The shipped catalog: the two anchors (Qwen3-0.6B, LFM2.5) + five researched, multi-tool-evaluated additions.
// Every entry is text-generation, emits a tool-call grammar the parser handles, and passed the eval suite.
// Ordered smallest-first after the default. See the "Choosing the offline models" guide section for the data.
export const LOCAL_MODELS: readonly LocalModel[] = [
  { id: "onnx-community/Qwen3-0.6B-ONNX", label: "Qwen3 0.6B", size: "~0.55 GB", tools: true },
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B", size: "~0.5 GB", tools: true },
  { id: "LiquidAI/LFM2.5-1.2B-Instruct-ONNX", label: "LFM2.5 1.2B", size: "~0.8 GB", tools: true },
  { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Qwen2.5 1.5B", size: "~1.2 GB", tools: true },
  { id: "onnx-community/Qwen3-1.7B-ONNX", label: "Qwen3 1.7B", size: "~1.4 GB", tools: true },
  { id: "onnx-community/granite-4.0-1b-ONNX-web", label: "Granite 4.0 1B", size: "~1.8 GB", tools: true, dtype: "q4" },
  { id: "onnx-community/Qwen3-4B-ONNX", label: "Qwen3 4B", size: "~2.1 GB", tools: true, dtype: "q4f16" },
];

export const DEFAULT_LOCAL_MODEL = LOCAL_MODELS[0]!.id;

/** Look up a curated local model by repo id (for its `dtype` pin, size, etc.); `undefined` for free-text ids. */
export function localModel(id: string): LocalModel | undefined {
  return LOCAL_MODELS.find((m) => m.id === id);
}

interface NativeParts {
  readonly imp: string;
  readonly expr: string;
}

function nativeParts(id: LiveProviderId, model: string): NativeParts {
  const m = JSON.stringify(model);
  switch (id) {
    case "openai":
      return { imp: `import { openai } from "mithril/openai";`, expr: `openai(${m})` };
    case "anthropic":
      return { imp: `import { anthropic } from "mithril/anthropic";`, expr: `anthropic(${m})` };
    case "google":
      return { imp: `import { google } from "@mithril/providers/google";`, expr: `google(${m})` };
    case "groq":
      // openai-compat — handled by modelBlock's openai-compat branch, so nativeParts never sees it.
      return { imp: `import { openai } from "mithril/openai";`, expr: `openai(${m})` };
  }
}

/** What to run an example against: the offline scripted double, a remote provider, or a local model. */
export type Target =
  | { readonly kind: "scripted" }
  | { readonly kind: "live"; readonly provider: LiveProvider; readonly model: string }
  | { readonly kind: "local"; readonly model: string };

/**
 * The provider-agnostic parts of an example. The model is NOT here — {@link assembleExample} slots in the
 * chosen provider's model line, so the same tools/agent/run body runs against any {@link Target}.
 */
export interface ExampleParts {
  /** Imports the body needs — `agent`/`tool` from `mithril`, `z` from `zod`, etc. (no provider import). */
  readonly bodyImports: string;
  /** The turns array literal passed to `scriptedProvider(...)` — the deterministic offline default. */
  readonly scriptedTurns: string;
  /** Everything after the model declaration: tools, `agent({ model, … })`, and the `run(…)` call. */
  readonly body: string;
}

/** The provider import + `const model = …` block for a target — the only part that varies by provider. */
function modelBlock(target: Target, scriptedTurns: string): { readonly imp: string; readonly decl: string } {
  if (target.kind === "scripted") {
    return {
      imp: `import { scriptedProvider, testModel } from "@mithril/core/testkit";`,
      decl: `// Offline default: the scripted provider replays these turns (zero network). Pick a real provider
// or a local model in the Run against bar to run this exact example against it instead.
const model = testModel(scriptedProvider(${scriptedTurns}));`,
    };
  }
  if (target.kind === "local") {
    const dtype = localModel(target.model)?.dtype;
    const opts = dtype === undefined ? "" : `, { dtype: ${JSON.stringify(dtype)} }`;
    const note = dtype === undefined ? "" : `\n// Pinned to dtype "${dtype}" — the default q4f16 is numerically unstable for this model on WebGPU.`;
    return {
      imp: `import { transformers } from "mithril/transformers";`,
      decl: `// Runs on-device in your browser tab (WebGPU → WASM). No key, no network after the one-time download.${note}
const model = transformers(${JSON.stringify(target.model)}${opts});`,
    };
  }
  const p = target.provider;
  if (p.kind === "openai-compat") {
    return {
      imp: `import { openaiProvider } from "mithril/openai";`,
      decl: `// ${p.label} speaks the OpenAI wire format; ${p.envVar} (set in the Run against bar) is injected as process.env.
const ${p.id} = openaiProvider({ baseUrl: ${JSON.stringify(p.baseUrl)} });
const model = { id: ${JSON.stringify(`${p.id}/${target.model}`)}, provider: ${p.id} };`,
    };
  }
  const { imp, expr } = nativeParts(p.id, target.model);
  return {
    imp,
    decl: `// ${p.envVar} (set in the Run against bar) is injected as process.env — omit \`transport\`, BYOK resolves from env.
const model = ${expr};`,
  };
}

/**
 * Assemble a complete, runnable example for a {@link Target}: the body's imports, the provider-specific
 * model block, then the shared body. Switching provider re-runs this with a new target — the tools, agent,
 * and prompt stay identical; only the model line changes.
 */
export function assembleExample(parts: ExampleParts, target: Target): string {
  const { imp, decl } = modelBlock(target, parts.scriptedTurns);
  return `${parts.bodyImports}\n${imp}\n\n${decl}\n\n${parts.body}\n`;
}
