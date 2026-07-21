# @mithril/evals-suite

A runnable eval suite for Mithril's local/in-browser models. It runs each scenario (a chat turn and a
tool-calling turn) against one or more Transformers.js models **headless in Bun** (CPU / onnxruntime-node),
scores the trajectories with [`@mithril/evals`](../../packages/evals), and writes a self-contained,
filterable **HTML report** (`report.html`).

This is the programmatic replacement for clicking through the playground: scriptable, repeatable, and it
scores tool-calling objectively instead of by eye.

## Run

From the repo root:

```sh
bun run evals            # the smallest model (Qwen3-0.6B)
bun run evals all        # every curated model — heavy, downloads a few GB
```

Or from here:

```sh
bun run eval                                    # default model
bun run eval onnx-community/Qwen2.5-0.5B-Instruct  # a specific HF text-generation model id
bun run eval all                                # the whole shipped playground catalog

# Env knobs:
EVAL_MAX_TOKENS=512 bun run eval all            # more headroom for "thinking" models (Qwen3 emits <think>)
EVAL_DTYPE=q4f16 bun run eval onnx-community/Qwen3-4B-ONNX  # force a dtype for repos that ship only one
```

Weights download once into the HF cache (`~/.cache/huggingface`), so subsequent runs are seconds each.
Then open `report.html` in a browser — filter by pass/fail or model, and search across case names,
output, tool calls, and scorers.

## Extend

- **Add scenarios** in [`src/cases.ts`](src/cases.ts) — a name, input, instructions, whether it gets the
  tool, and a list of scorers. They flow into every model run and the report automatically.
- **Add models** in [`src/suite.ts`](src/suite.ts) (`LOCAL_MODELS`), or pass HF ids on the command line.
- **Custom scorers** are just `(trajectory) => { name, value, rationale? }` — see `nonEmptyAnswer` in
  `cases.ts` and the [evals guide](../docs/src/content/docs/guides/evals.mdx).

## Notes

- Device is auto-detected — CPU on Node/Bun (WebGPU in the browser). The provider warns once on the CPU
  fallback; pass `{ device: "cpu" }` to `transformers(...)` to silence it.
- Small local models are **best-effort** at tool calls; give reasoning models enough `maxNewTokens`
  (the suite uses 256) or they can run out of budget before emitting a call.
