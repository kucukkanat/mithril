# @mithril/evals

A [promptfoo](https://promptfoo.dev) evaluation suite for Mithril's **on-device local models** — the
ones shipped in `@mithril/runner-web`'s `LOCAL_MODELS` catalog. Every test runs through the **real
Mithril agent harness** (`agent({ model: transformers(...) })` + tools + `run()`), so the suite grades
the harness and the model together, exactly as an app would use them.

It produces an interactive **HTML report** comparing every model across every suite. The report opens
with a **compact model-comparison overview** — a ranked leaderboard (overall pass rate) and a
models × suites heatmap — above promptfoo's full detailed results table.

## How it works

- **Models are auto-derived** from `@mithril/runner-web` `LOCAL_MODELS` (`src/models.ts`) — the model
  matrix can never drift from the shipped catalog.
- **`src/provider.ts`** is a custom promptfoo provider: for each prompt it builds an agent around the
  chosen model, streams the run, and reports the final text **plus the tool calls it observed**.
- **Suites live in `suites/*.yaml`** — easy to read and edit. Each test supplies the user turn as
  `input`, optionally names a `toolset` / `outputSchema`, and lists assertions.
- **`src/grading.ts`** adds harness-level assertions (which tools were called, with which args).
- **`promptfooconfig.ts` tags each suite** — it loads every `suites/*.yaml`, stamps the suite's display
  name onto each test as a `category` var, and passes them as inline tests. That `category` flows into
  `_report/report.json` and is what the overview groups by (the suite YAML files stay clean). It also prints a
  **run banner** (`src/banner.ts`) at the top of every run — the models it's about to evaluate
  (label / size / dtype / repo id), any active `MITHRIL_EVAL_MODELS` filter, and the suites — so you
  see the scope before promptfoo's output scrolls by. (Colors/box-drawing are emitted only to a TTY and
  suppressed under `NO_COLOR`, so piped/CI logs stay plain.)
- **`src/report.ts`** post-processes `_report/report.json` after promptfoo runs: it groups results by model ×
  suite, computes each model's per-suite pass rate and an **equal-weighted overall** (every suite counts
  once, regardless of test count), and injects the compact leaderboard + heatmap above promptfoo's table
  in `_report/report.html`. Zero dependencies — inline SVG/CSS reusing the report's own theme tokens.
- Models run **on-device on CPU** (onnxruntime-node) — no network, no API keys. WebGPU is browser-only,
  so CPU here is **slow**; that's expected (correctness over speed).

> The first run **downloads model weights** (~0.5–4.75 GB per model) into the Transformers.js cache. They
> are cached across runs. Use `MITHRIL_EVAL_MODELS` (below) to iterate on a single small model first.

## Run it

From this directory (`evals/`):

```sh
bun install                 # once, from the repo root
bun run models              # list the local models the suite can run against (with repo ids + sizes)
bun run eval                # run all suites against all catalog models (text report)
bun run eval:html           # write _report/report.json + an interactive _report/report.html (with the comparison overview)
bun run report              # same as eval:html (writes _report/report.json + _report/report.html)
bun run report:overview     # re-inject the overview into an existing _report/report.html from _report/report.json
bun run view                # open the promptfoo web UI for the last run
```

`eval:html` and `report` run promptfoo, then `src/report.ts` to add the comparison overview — one
command, both outputs. **A run where some eval assertions fail still exits 0** (promptfoo's "tests
failed" code `100` is treated as success, since failing model answers are eval *data*, not a tooling
error); a genuine tooling/config error still fails loudly. Scripts invoke promptfoo, which loads this
TS config, the custom provider, and the transitive `@mithril/*` source-`.ts` imports through its
built-in TypeScript loader.

### Run a subset (fast iteration)

`MITHRIL_EVAL_MODELS` filters the model matrix — a comma-separated list of repo ids **or** labels.
Matching is **forgiving**: case-insensitive, and it ignores spaces, dashes and dots, so `qwen3 0.6b`,
`Qwen3-0.6B-ONNX` and `qwen306b` all select the same model. Terms are **fuzzy** — a partial like
`qwen3` selects *every* Qwen3 model, and a small typo (`granit`, `qwn3`) still resolves via subsequence
matching. A term that matches nothing prints a warning (so typos surface) instead of silently running
everything. Use `bun run models` to see the valid names.

```sh
MITHRIL_EVAL_MODELS="qwen3 0.6b" bun run eval:html          # case/space/dot-insensitive
MITHRIL_EVAL_MODELS="qwen3" bun run eval                    # fuzzy: every Qwen3 model
MITHRIL_EVAL_MODELS="onnx-community/Qwen3-0.6B-ONNX,onnx-community/Qwen2.5-0.5B-Instruct" bun run eval
```

### A/B the self-healing middleware

The harness's [self-healing](../apps/docs/src/content/docs/guides/self-correction.mdx) behaviour is a
stack of pluggable middleware (`argRepair` / `loopGuard` / `retryBudget` / `outputRetry`). Every run
uses the batteries-included `defaults()` unless you say otherwise, so **healing is entirely optional
here** — omit `MITHRIL_EVAL_HEALING` and the suite runs each model once with the full default stack.

Set `MITHRIL_EVAL_HEALING` to a comma-separated list of **variants** (`src/healing.ts`) to run the
matrix once **per variant**, so you can measure exactly what each layer buys you:

| Variant | Healing applied |
| --- | --- |
| `full` | `defaults()` — every layer (the default) |
| `raw` | none (`healing: false`) — the bare loop, no self-correction |
| `no-argrepair` | defaults minus `argRepair` |
| `no-loopguard` | defaults minus `loopGuard` |
| `no-retrybudget` | defaults minus `retryBudget` |
| `no-outputretry` | defaults minus `outputRetry` |

```sh
MITHRIL_EVAL_HEALING=full,raw MITHRIL_EVAL_MODELS="qwen3 0.6b" bun run eval:html   # A/B full vs. raw
MITHRIL_EVAL_HEALING=full,no-argrepair,no-loopguard bun run eval                   # ablate two layers
```

When more than one variant is active, each provider label is suffixed with ` · <variant>`, so the
comparison overview's leaderboard shows a separate row per model × variant. With a single variant (or
none) the labels stay clean. The run banner lists the active variants before the run starts.

## The suites

| Suite | File | What it checks |
| --- | --- | --- |
| Tool calling | `suites/tool-calling.yaml` | Right tool selected, right arguments (single + multi-tool) |
| Instruction following | `suites/instruction-following.yaml` | Concrete formatting / content constraints |
| Structured output | `suites/structured-output.yaml` | Output parses + validates against an `agent({ output })` schema |
| Reasoning / QA | `suites/reasoning-qa.yaml` | Short factual + arithmetic questions (deterministic) |
| Reasoning (rubric) | `suites/reasoning-rubric.yaml` | **Opt-in**, LLM-graded subjective quality |

Grading is **deterministic and offline by default**. LLM-rubric grading is opt-in:

```sh
MITHRIL_EVAL_RUBRIC=1 OPENAI_API_KEY=sk-... bun run eval:html
# override the grader model:
MITHRIL_EVAL_RUBRIC=1 MITHRIL_EVAL_GRADER=anthropic:claude-3-5-haiku-latest ANTHROPIC_API_KEY=... bun run eval
```

## Extending

- **Add a model to test:** add it to `LOCAL_MODELS` in `packages/runner-web/src/catalog.ts` — it shows
  up here automatically. To test an ad-hoc model without touching the catalog, add a provider entry in
  `promptfooconfig.ts`.
- **Add a suite:** drop a new `suites/<name>.yaml` and add a `{ file, category }` entry to
  `promptfooconfig.ts`'s `suites` array — the `category` is the display name shown in the comparison
  overview's heatmap.
- **Add a tool set:** extend `TOOLSETS` in `src/tools.ts`, then reference it via a test's `toolset` var.
- **Add an output schema:** extend `SCHEMAS` in `src/schemas.ts`, then reference it via `outputSchema`.
- **Add a harness assertion:** export a `(output, context)` function from `src/grading.ts` and reference
  it as `type: javascript`, `value: file://src/grading.ts:yourFn`.

## Notes

- This workspace is **private and unpublished**; its `promptfoo` + `@huggingface/transformers` deps are
  isolated here and never leak into the framework packages (which stay dependency-free).
- The suite is **additive tooling** — it makes no changes to `packages/*`.
