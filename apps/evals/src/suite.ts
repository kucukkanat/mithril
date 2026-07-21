/// <reference path="../../../packages/providers/src/transformers/hf-ambient.d.ts" />
/*
 * Local-model eval suite. Runs each scenario (chat, tool-call) against one or more in-browser models —
 * headless in Bun, on CPU (onnxruntime-node) — scores the trajectories with @mithril/evals, and writes a
 * self-contained, filterable HTML report.
 *
 *   bun run src/suite.ts                # default: the smallest model
 *   bun run src/suite.ts all            # every curated model (heavy — downloads a few GB)
 *   bun run src/suite.ts <hf-model-id>… # specific models
 *
 * Weights download once into the HF cache, then runs are seconds each. Device is auto-detected (CPU on
 * Node/Bun) — the provider warns once on the fallback.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { agent } from "@mithril/core/agent";
import { transformers } from "@mithril/providers/transformers";
import { htmlReport, runEval, type EvalReportEntry } from "@mithril/evals";
import { SCENARIOS, TOOLBOX, getWeather } from "./cases.ts";

// The shipped playground catalog (kept in sync with apps/docs providers.ts LOCAL_MODELS). All
// text-generation ONNX with a parser-compatible tool grammar; a multimodal (image-text-to-text) repo would
// load through the wrong AutoModelForCausalLM path and score as garbage, so none are here.
const LOCAL_MODELS = [
  "onnx-community/Qwen3-0.6B-ONNX",
  "onnx-community/Qwen2.5-0.5B-Instruct",
  "LiquidAI/LFM2.5-1.2B-Instruct-ONNX",
  "onnx-community/Qwen2.5-1.5B-Instruct",
  "onnx-community/Qwen3-1.7B-ONNX",
  "onnx-community/granite-4.0-1b-ONNX-web",
  "onnx-community/Qwen3-4B-ONNX",
] as const;

// Per-model dtype pins (mirrors the catalog): Qwen3-4B ships q4f16 only, so the CPU q4 default 404s.
// EVAL_DTYPE (below) still wins if set explicitly.
const DTYPE_OVERRIDES: Readonly<Record<string, string>> = {
  "onnx-community/Qwen3-4B-ONNX": "q4f16",
};

// Generation budget per scenario. Bump it (EVAL_MAX_TOKENS=512) for "thinking" models (Qwen3 emits a
// <think> block before its tool call by default) so the budget doesn't cut them off mid-reasoning.
const MAX_NEW_TOKENS = Number(process.env["EVAL_MAX_TOKENS"] ?? 256) || 256;

// Override the ONNX dtype (default: q4 on CPU). Needed for repos that ship only q4f16 (e.g. Qwen3-4B),
// which 404 on the CPU q4 default — evaluate them at the dtype they actually ship: EVAL_DTYPE=q4f16.
const DTYPE = process.env["EVAL_DTYPE"];

function selectModels(): readonly string[] {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (args.length === 0) return [LOCAL_MODELS[0]];
  if (args[0] === "all") return LOCAL_MODELS;
  return args;
}

async function main(): Promise<void> {
  const models = selectModels();
  console.log(`Mithril eval suite · ${models.length} model(s) × ${SCENARIOS.length} scenarios`);
  const entries: EvalReportEntry[] = [];

  for (const id of models) {
    console.log(`\n▶ ${id}`);
    let lastPct = -1;
    const dtype = DTYPE ?? DTYPE_OVERRIDES[id];
    const model = transformers(id, {
      maxNewTokens: MAX_NEW_TOKENS, // reasoning models need headroom before they emit a tool call
      ...(dtype === undefined ? {} : { dtype }),
      onProgress: (p) => {
        const pct = p.total > 0 ? Math.round(p.progress * 100) : 0;
        if (pct !== lastPct) {
          lastPct = pct;
          process.stdout.write(`\r  loading ${pct}%   `);
        }
      },
    });

    for (const sc of SCENARIOS) {
      const cases = [{ name: sc.name, input: sc.input, scorers: [...sc.scorers] }];
      const t0 = performance.now();
      // Branch (not a ternary on the agent) so each runEval sees a concrete agent type.
      const gen =
        sc.toolset === "multi"
          ? runEval(agent({ model, instructions: sc.instructions, tools: TOOLBOX }), cases, { deps: undefined })
          : sc.toolset === "single"
            ? runEval(agent({ model, instructions: sc.instructions, tools: [getWeather] }), cases, { deps: undefined })
            : runEval(agent({ model, instructions: sc.instructions }), cases, { deps: undefined });
      for await (const run of gen) {
        const durationMs = performance.now() - t0;
        entries.push({ run, group: id, durationMs });
        const marks = run.scores.map((s) => `${s.name}=${s.value}`).join(" ");
        console.log(`\r  ${run.passed ? "✓" : "✗"} ${run.case}  (${Math.round(durationMs)}ms)  ${marks}`);
      }
    }
  }

  const out = fileURLToPath(new URL("../report.html", import.meta.url));
  writeFileSync(out, htmlReport(entries, { title: "Mithril local-model evals" }));
  const passed = entries.filter((e) => e.run.passed).length;
  console.log(`\n${passed}/${entries.length} passed · report → ${out}`);
}

main().catch((e: unknown) => {
  console.error("\n✗ suite failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
