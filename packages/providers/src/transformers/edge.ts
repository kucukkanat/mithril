import type { ChatMessage, PreTrainedModel, PreTrainedTokenizer, ProgressInfo } from "@huggingface/transformers";
import { MithrilError } from "@mithril/core/agent";
import type { AnyTool } from "@mithril/core/protocol";
import { toJsonSchema } from "@mithril/core/protocol";
import type { EngineChunk, EngineRequest, TransformersEngine } from "./core.ts";
import { formatForModel, reasoningForModel, splitToolCalls } from "./tool-formats.ts";

// The heavy BROWSER edge — the sole place `@huggingface/transformers` is imported (dynamically, so this module
// still loads in Node and type-checks with the peer uninstalled). It builds a `TransformersEngine`: chat
// templating + `generate()` + a `TextStreamer` callback bridged to an async generator + AbortSignal→interrupt
// + real token counts from tensor dims + the per-model tool-call parser. WebGPU is feature-detected (it throws
// on unsupported hardware, so we never request it blindly), falling back to WASM/CPU.

/** An ONNX execution backend — mirrors {@link EdgeOptions.device}. */
export type Backend = "webgpu" | "wasm" | "cpu";

/** Options for {@link browserEngine} / {@link transformers} / {@link preload}. */
export interface EdgeOptions {
  /** Model-download progress, reported OUTSIDE the event stream (aggregate `loaded/total` across files). */
  readonly onProgress?: (report: ProgressReport) => void;
  /**
   * Force an ONNX execution device; omit to feature-detect: `webgpu` when available, else `cpu` on Node/Bun
   * (onnxruntime-node rejects `wasm`), else `wasm` in the browser. Pass this explicitly to silence the
   * Node/Bun CPU-fallback warning.
   */
  readonly device?: Backend;
  /** Force a quantization dtype; omit for `q4f16` (webgpu) / `q4` (cpu/wasm). */
  readonly dtype?: string;
  /**
   * Restrict the {@link Backend}s this model may run on (fed from the catalog's `LocalModel.backends`). When the
   * resolved device isn't in this list, {@link loadModel}/{@link preload} throws an ergonomic `MithrilError`
   * **before** downloading weights (code `WEBGPU_REQUIRED` for a WebGPU-only model, else `UNSUPPORTED_BACKEND`)
   * instead of failing with a cryptic mid-stream ONNX kernel error. Omit ⇒ no restriction.
   */
  readonly backends?: readonly Backend[];
  readonly maxNewTokens?: number;
  readonly doSample?: boolean;
}

/** A model-download progress report (see {@link EdgeOptions.onProgress}). */
export interface ProgressReport {
  readonly status: string;
  readonly file?: string;
  /** Overall fraction across all files, `0..1`. */
  readonly progress: number;
  readonly loaded: number;
  readonly total: number;
}

interface Loaded {
  readonly tokenizer: PreTrainedTokenizer;
  readonly model: PreTrainedModel;
  /** The device the weights were actually loaded on — used to shape reactive backend errors. */
  readonly device: Backend;
}

// One weight-load per repo id, reused across handles/preload/generate (first opts win).
const MODELS = new Map<string, Promise<Loaded>>();

// Signatures of ONNX Runtime failures that mean "this quantized build has no kernel on this backend" —
// notably 2-bit `MatMulNBits` (ternary models) on the CPU/WASM path. Used to translate an otherwise
// cryptic mid-stream crash into an actionable {@link backendError}.
const QUANT_KERNEL_ERROR = /MatMulNBits|nbits_|Non-zero status code returned/i;

/**
 * Pure, unit-tested backend-guard: the proactive error to throw when a model's resolved `device` isn't among
 * its `allowed` backends, or `undefined` when it's allowed (or unrestricted). A WebGPU-only model yields code
 * `WEBGPU_REQUIRED`; any other mismatch yields `UNSUPPORTED_BACKEND`.
 */
export function backendError(model: string, device: Backend, allowed: readonly Backend[] | undefined): MithrilError | undefined {
  if (allowed === undefined || allowed.length === 0 || allowed.includes(device)) return undefined;
  const webgpuOnly = allowed.length === 1 && allowed[0] === "webgpu";
  const list = allowed.map((b) => `"${b}"`).join(" or ");
  const detail = webgpuOnly
    ? `It ships only a WebGPU-compatible build (e.g. a ternary/2-bit quantization whose ONNX MatMulNBits kernel has no CPU/WASM path). Run it in a browser tab with WebGPU enabled.`
    : `Run it on a supported backend, or pass \`device\` explicitly.`;
  return new MithrilError(
    webgpuOnly ? "WEBGPU_REQUIRED" : "UNSUPPORTED_BACKEND",
    `The local model "${model}" requires ${list}, but this runtime resolved to "${device}". ${detail}`,
  );
}

/**
 * Reactive translation of a mid-run ONNX failure: on a non-WebGPU device, a quantized-kernel error (see
 * {@link QUANT_KERNEL_ERROR}) is almost always a missing-backend-kernel problem, so surface the same
 * ergonomic `WEBGPU_REQUIRED` guidance instead of the raw stack. Anything else is returned unchanged.
 */
export function wrapRuntimeError(model: string, device: Backend, err: unknown): unknown {
  if (err instanceof MithrilError) return err;
  const message = err instanceof Error ? err.message : String(err);
  if (device !== "webgpu" && QUANT_KERNEL_ERROR.test(message)) {
    return new MithrilError(
      "WEBGPU_REQUIRED",
      `The local model "${model}" failed on the "${device}" backend (${message}). This build likely requires WebGPU — its quantized ONNX kernel has no CPU/WASM path. Run it in a browser tab with WebGPU enabled.`,
    );
  }
  return err;
}

function isBrowserCapable(): boolean {
  return typeof WebAssembly !== "undefined";
}

/** True on Node/Bun (has `process.versions.node`/`.bun`); false in browsers and browser Web Workers. */
export function isNodeLike(): boolean {
  const p = (globalThis as { process?: { versions?: { node?: string; bun?: string } } }).process;
  return p?.versions != null && (p.versions.node != null || p.versions.bun != null);
}

/**
 * Pure device policy (unit-tested): an explicit `pref` wins; else WebGPU when present; else `cpu` on Node/Bun
 * (onnxruntime-node rejects `"wasm"`) or `wasm` in the browser (onnxruntime-web). Not re-exported from the
 * package index — it backs {@link pickDevice} and is imported directly by the provider's tests.
 */
export function chooseDevice(env: { readonly pref?: EdgeOptions["device"]; readonly webgpu: boolean; readonly node: boolean }): "webgpu" | "wasm" | "cpu" {
  if (env.pref !== undefined) return env.pref;
  if (env.webgpu) return "webgpu";
  return env.node ? "cpu" : "wasm";
}

let warnedCpuFallback = false;

async function pickDevice(pref: EdgeOptions["device"]): Promise<"webgpu" | "wasm" | "cpu"> {
  let webgpu = false;
  if (pref === undefined) {
    const nav = (globalThis as { navigator?: { gpu?: { requestAdapter(): Promise<unknown> } } }).navigator;
    try {
      webgpu = nav?.gpu !== undefined && (await nav.gpu.requestAdapter()) !== null;
    } catch {
      /* WebGPU unavailable — fall through */
    }
  }
  const device = chooseDevice({ pref, webgpu, node: isNodeLike() });
  // Notify once when a Node/Bun run silently drops to CPU — it's much slower than WebGPU, and the auto-pick
  // (rather than the browser's `wasm`) is what makes onnxruntime-node accept the device at all.
  if (pref === undefined && device === "cpu" && !warnedCpuFallback) {
    warnedCpuFallback = true;
    console.warn(
      '[@mithril/providers/transformers] No WebGPU in this Node/Bun runtime — falling back to CPU (onnxruntime-node). Inference is slower than WebGPU; pass `device` explicitly (e.g. { device: "cpu" }) to silence this warning.',
    );
  }
  return device;
}

function loadModel(modelId: string, opts?: EdgeOptions): Promise<Loaded> {
  const cached = MODELS.get(modelId);
  if (cached !== undefined) return cached;
  const p = (async (): Promise<Loaded> => {
    if (!isBrowserCapable()) throw new MithrilError("NO_WASM", "@mithril/providers/transformers needs a WebAssembly runtime (browser); none was found.");
    const device = await pickDevice(opts?.device);
    // Proactive backend guard: refuse a WebGPU-only model on CPU/WASM *before* downloading multi-GB weights,
    // with an ergonomic typed error the playground/Studio/evals can surface (rather than a mid-stream crash).
    const guard = backendError(modelId, device, opts?.backends);
    if (guard !== undefined) {
      console.warn(`[@mithril/providers/transformers] ${guard.message}`);
      throw guard;
    }
    const hf = await import("@huggingface/transformers");
    const dtype = opts?.dtype ?? (device === "webgpu" ? "q4f16" : "q4");
    // Aggregate per-file download progress into a single 0..1 fraction.
    const files = new Map<string, { loaded: number; total: number }>();
    const progress_callback = (info: ProgressInfo): void => {
      if (opts?.onProgress === undefined) return;
      if (info.file !== undefined && info.total !== undefined) files.set(info.file, { loaded: info.loaded ?? 0, total: info.total });
      let loaded = 0;
      let total = 0;
      for (const f of files.values()) {
        loaded += f.loaded;
        total += f.total;
      }
      opts.onProgress({ status: info.status, ...(info.file !== undefined ? { file: info.file } : {}), loaded, total, progress: total > 0 ? loaded / total : 0 });
    };
    const load = { device, dtype, progress_callback };
    const [tokenizer, model] = await Promise.all([hf.AutoTokenizer.from_pretrained(modelId, load), hf.AutoModelForCausalLM.from_pretrained(modelId, load)]);
    return { tokenizer, model, device };
  })();
  MODELS.set(modelId, p);
  p.catch(() => MODELS.delete(modelId)); // don't cache a failed load
  return p;
}

/** Warm the weight cache for a model (and drive `onProgress`) so the first `run()` doesn't stall. */
export function preload(modelId: string, opts?: EdgeOptions): Promise<void> {
  return loadModel(modelId, opts).then(() => undefined);
}

function toChatMessages(req: EngineRequest): ChatMessage[] {
  const out: ChatMessage[] = [];
  if (req.system !== "") out.push({ role: "system", content: req.system });
  // v1: role + content (tool-result turns are role "tool" with JSON content). Structured assistant tool_calls
  // are not re-projected into the template yet — a faithful multi-turn tool history is a follow-up.
  for (const m of req.messages) out.push({ role: m.role, content: m.content });
  return out;
}

function toToolDefs(tools: readonly AnyTool<unknown>[]): readonly unknown[] {
  return tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: toJsonSchema(t.inputSchema) } }));
}

// A pushable queue bridging a callback source to an async generator (final flush + error propagation).
function pushQueue<T>() {
  const buf: T[] = [];
  let waiting: ((r: IteratorResult<T>) => void) | undefined;
  let done = false;
  let failure: unknown;
  return {
    push(v: T): void {
      if (done) return;
      if (waiting !== undefined) {
        const w = waiting;
        waiting = undefined;
        w({ value: v, done: false });
      } else buf.push(v);
    },
    close(): void {
      done = true;
      if (waiting !== undefined) {
        const w = waiting;
        waiting = undefined;
        w({ value: undefined as never, done: true });
      }
    },
    fail(e: unknown): void {
      failure = e;
      this.close();
    },
    async *stream(): AsyncGenerator<T> {
      for (;;) {
        if (buf.length > 0) {
          yield buf.shift() as T;
          continue;
        }
        if (failure !== undefined) throw failure;
        if (done) return;
        const next = await new Promise<IteratorResult<T>>((res) => {
          waiting = res;
        });
        if (next.done) {
          if (failure !== undefined) throw failure;
          return;
        }
        yield next.value;
      }
    },
  };
}

/**
 * Build the browser {@link TransformersEngine} backing a {@link transformers} handle.
 *
 * @param opts - device/dtype/progress ({@link EdgeOptions}); omit to feature-detect WebGPU → CPU (Node/Bun) / WASM (browser).
 * @returns an engine that loads (cached) the requested model, streams tokens, and parses tool calls per model.
 * @remarks Runtime-verified in a real WebGPU browser only (the pure core + parser carry the unit tests). Text
 * streams cleanly (special tokens skipped); the literal `<tool_call>` grammar (Qwen/Granite/Qwen3.5) is
 * detected in-stream — Gemma-4's special-token tool format is best-effort pending raw-token decode.
 */
export function browserEngine(opts?: EdgeOptions): TransformersEngine {
  let lastUsage: { inputTokens: number; outputTokens: number } | undefined;
  return {
    usage: () => lastUsage,
    async *generate(req: EngineRequest): AsyncGenerator<EngineChunk> {
      const hf = await import("@huggingface/transformers");
      const { tokenizer, model, device } = await loadModel(req.model, opts);
      const inputs = tokenizer.apply_chat_template(toChatMessages(req), {
        ...(req.tools.length > 0 ? { tools: toToolDefs(req.tools) } : {}),
        add_generation_prompt: true,
        return_dict: true,
      });
      const inputTokens = inputs.input_ids.dims.at(-1) ?? 0;

      const stopper = new hf.InterruptableStoppingCriteria();
      const onAbort = (): void => stopper.interrupt();
      if (req.signal.aborted) stopper.interrupt();
      else req.signal.addEventListener("abort", onAbort, { once: true });

      const q = pushQueue<string>();
      const streamer = new hf.TextStreamer(tokenizer, { skip_prompt: true, skip_special_tokens: true, callback_function: (t: string) => q.push(t) });

      let outputTokens = 0;
      const genDone = model
        .generate({ ...inputs, max_new_tokens: opts?.maxNewTokens ?? 1024, do_sample: opts?.doSample ?? false, streamer, stopping_criteria: stopper, return_dict_in_generate: true })
        .then(
          (o) => {
            outputTokens = Math.max(0, (o.sequences.dims.at(-1) ?? inputTokens) - inputTokens);
            q.close();
          },
          // Reactive safety net: a quantized-kernel crash on CPU/WASM becomes the same ergonomic WebGPU guidance.
          (e) => q.fail(wrapRuntimeError(req.model, device, e)),
        );

      try {
        yield* splitToolCalls(q.stream(), req.tools.length > 0 ? formatForModel(req.model) : undefined, reasoningForModel(req.model));
        await genDone;
      } finally {
        req.signal.removeEventListener("abort", onAbort);
      }
      lastUsage = { inputTokens, outputTokens };
    },
  };
}
