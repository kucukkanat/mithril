/**
 * The set of on-device models under evaluation — derived from the shipped catalog so it can never
 * drift. `@mithril/runner-web`'s {@link LOCAL_MODELS} is the single source of truth; an env var lets a
 * developer narrow to a fast subset while iterating.
 *
 * Set `MITHRIL_EVAL_MODELS` to a comma-separated list of repo ids OR labels to run a subset, e.g.
 *   MITHRIL_EVAL_MODELS="Qwen3 0.6B, onnx-community/Qwen2.5-0.5B-Instruct" bun run eval
 * Matching is **forgiving**: case-insensitive, ignores spaces/dashes/dots, and fuzzy — a term can be a
 * partial ("qwen3" selects every Qwen3), a repo-id fragment, or a slightly mistyped subsequence
 * ("qwn3", "granit"). A term that matches nothing is warned about (so typos surface). Unset (or empty)
 * ⇒ every model in the catalog.
 */
import { LOCAL_MODELS, requiresWebGPU, type Backend, type LocalModel } from "@mithril/runner-web";

/** One model the suite runs against: its HF repo id, a display label, and an optional pinned dtype. */
export interface EvalModel {
  readonly repoId: string;
  readonly label: string;
  /** Quantization dtype pinned by the catalog (e.g. Granite → `q4`, Qwen3-4B → `q4f16`); omitted otherwise. */
  readonly dtype?: string;
  /** Backends the model may run on (from the catalog). Passed to the provider so a forced WebGPU-only run fails clearly. */
  readonly backends?: readonly Backend[];
}

/** True when `MITHRIL_EVAL_INCLUDE_WEBGPU` opts into attempting WebGPU-only models on CPU (they can't run — a debug escape hatch). */
export function includeWebGPUModels(): boolean {
  const v = process.env["MITHRIL_EVAL_INCLUDE_WEBGPU"];
  return v !== undefined && v !== "" && v !== "0" && v.toLowerCase() !== "false";
}

/** Parse `MITHRIL_EVAL_MODELS` into a trimmed, non-empty filter list, or `undefined` when unset/blank. */
function envFilter(): readonly string[] | undefined {
  const raw = process.env["MITHRIL_EVAL_MODELS"];
  if (raw === undefined) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}

/** Lowercase and strip everything but letters/digits, so "Qwen3-0.6B-ONNX" ≈ "qwen3 0.6b" ≈ "qwen306b". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** True if every char of `needle` appears in `haystack` in order (fzf-style subsequence, for typos). */
function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

/**
 * Forgiving match of one filter term against a catalog model. A term matches when — after normalizing
 * away case, spaces, dashes and dots — it is a substring of the model's label, full repo id, or the
 * repo's short name; or (for terms of 3+ chars, to tolerate typos) an in-order subsequence of them.
 */
function matchesModel(term: string, model: LocalModel): boolean {
  const q = normalize(term);
  if (q.length === 0) return false;
  const targets = [normalize(model.label), normalize(model.id), normalize(model.id.split("/").pop() ?? model.id)];
  if (targets.some((t) => t.includes(q))) return true;
  return q.length >= 3 && targets.some((t) => isSubsequence(q, t));
}

/**
 * The catalog models to evaluate, after applying the {@link envFilter} (forgiving id/label matching).
 * WebGPU-only models (e.g. Ternary-Bonsai-8B) are **excluded by default** — the harness runs on CPU
 * (onnxruntime-node), where their quantized kernel can't execute — unless {@link includeWebGPUModels}
 * (`MITHRIL_EVAL_INCLUDE_WEBGPU=1`) forces an attempt.
 */
export function selectedModels(): readonly EvalModel[] {
  const runnable = includeWebGPUModels() ? LOCAL_MODELS : LOCAL_MODELS.filter((m) => !requiresWebGPU(m));
  const filter = envFilter();
  if (filter === undefined) return runnable.map(toEvalModel);

  const unmatched = filter.filter((term) => !LOCAL_MODELS.some((m) => matchesModel(term, m)));
  if (unmatched.length > 0) {
    console.warn(`[models] MITHRIL_EVAL_MODELS: no model matched ${unmatched.map((t) => JSON.stringify(t)).join(", ")} — run 'bun run models' to see valid names.`);
  }
  // Warn when a filter term matches only WebGPU-only models that are being skipped, so the skip is never silent.
  const skipped = LOCAL_MODELS.filter((m) => requiresWebGPU(m) && !runnable.includes(m) && filter.some((term) => matchesModel(term, m)));
  if (skipped.length > 0) {
    console.warn(`[models] Skipping WebGPU-only model(s) ${skipped.map((m) => JSON.stringify(m.label)).join(", ")} — they can't run on the CPU harness. Set MITHRIL_EVAL_INCLUDE_WEBGPU=1 to attempt anyway.`);
  }

  const models = runnable.filter((m) => filter.some((term) => matchesModel(term, m)));
  if (models.length === 0) {
    console.warn("[models] MITHRIL_EVAL_MODELS matched no runnable models; nothing will run. Run 'bun run models' to list them.");
  }
  return models.map(toEvalModel);
}

/** Project a catalog {@link LocalModel} onto the {@link EvalModel} shape the provider consumes. */
function toEvalModel(m: LocalModel): EvalModel {
  return { repoId: m.id, label: m.label, ...(m.dtype !== undefined ? { dtype: m.dtype } : {}), ...(m.backends !== undefined ? { backends: m.backends } : {}) };
}
