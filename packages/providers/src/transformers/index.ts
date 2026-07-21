/**
 * Browser-runnable local LLMs for Mithril via Transformers.js (`@huggingface/transformers`). A `Provider`
 * that runs models **on-device** (WebGPU, falling back to WASM) — no network, no keys.
 *
 * @remarks
 * `@huggingface/transformers` is an **optional peer dependency**, dynamic-imported only in the browser edge,
 * so `@mithril/providers` stays dependency-free and this module type-checks/tests in Node without it. The pure
 * provider core (`transformersProvider` over an injected {@link TransformersEngine}) is unit-tested with a fake
 * engine, exactly like `scriptedProvider`. Model weights are large (~0.4–2 GB) and cached across reloads; use
 * {@link preload} + `onProgress` to drive a download UI. See the local-inference guide for the curated model
 * set and honest tool-calling caveats (small local models are best-effort at function calling).
 *
 * @packageDocumentation
 */

import type { ModelHandle } from "@mithril/core/protocol";
import { transformersProvider } from "./core.ts";
import { browserEngine, type EdgeOptions } from "./edge.ts";
import type { TransformersEngine } from "./core.ts";

export { TRANSFORMERS_SPEC, transformersProvider } from "./core.ts";
export type { EngineChunk, EngineRequest, TransformersEngine } from "./core.ts";
export { angleToolCall, formatForModel, gemmaToolCall, splitToolCalls } from "./tool-formats.ts";
export type { ToolFormat } from "./tool-formats.ts";
export { browserEngine, preload } from "./edge.ts";
export type { EdgeOptions, ProgressReport } from "./edge.ts";

/** The default model — the smallest ONNX chat model with a verified tool-call template (`~0.4 GB`, WebGPU/WASM). */
export const DEFAULT_MODEL = "onnx-community/Qwen3-0.6B-ONNX";

/** Options for {@link transformers}: {@link EdgeOptions} plus an optional injected engine (tests / custom runtimes). */
export interface TransformersHandleOptions extends EdgeOptions {
  /** Inject a custom {@link TransformersEngine} (a fake for tests, a Web Worker engine, a wllama backend, …). */
  readonly engine?: TransformersEngine;
}

/**
 * Self-wiring model handle for a local Transformers.js model: `agent({ model: transformers("…") })`.
 *
 * @param model - a Hugging Face repo id (default {@link DEFAULT_MODEL}), e.g. `onnx-community/Qwen3-0.6B-ONNX`.
 * @param opts - {@link TransformersHandleOptions} — `onProgress`/`device`/`dtype`, or an injected `engine`.
 * @returns a {@link ModelHandle} bound to the local provider (no registry, no network).
 * @example
 * ```ts
 * import { agent } from "@mithril/core/agent";
 * import { transformers, preload } from "@mithril/providers/transformers";
 *
 * await preload("onnx-community/Qwen3-0.6B-ONNX", { onProgress: (p) => setBar(p.progress) });
 * const a = agent({ model: transformers("onnx-community/Qwen3-0.6B-ONNX"), instructions: "Be brief." });
 * const r = await a.run("Say hi."); // runs entirely in the browser tab
 * ```
 */
export function transformers(model: string = DEFAULT_MODEL, opts?: TransformersHandleOptions): ModelHandle {
  const engine = opts?.engine ?? browserEngine(opts);
  return { id: `transformers/${model}`, provider: transformersProvider(engine) };
}
