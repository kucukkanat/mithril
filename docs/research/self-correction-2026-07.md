# Self-Correcting Capabilities for Small-Model Harnesses (July 2026)

> Produced 2026-07-22 by a 14-agent research sweep: 7 research agents (one per dimension), each
> followed by an adversarial fact-checker that fetched the cited sources. Corrections are applied
> in place. Full per-dimension reports with sources and verification appendices live in
> [self-correction-2026-07/](self-correction-2026-07/). One caveat: the fact-checker for the
> execution-feedback report failed to run (spend limit), so that report's *unique* claims are
> unverified — though its headline numbers were independently verified via the academic and
> harness-engineering fact-checks.
>
> Dimensions: [academic-self-correction](self-correction-2026-07/academic-self-correction.md) ·
> [structured-output-repair](self-correction-2026-07/structured-output-repair.md) ·
> [harness-engineering](self-correction-2026-07/harness-engineering.md) ·
> [small-model-agents](self-correction-2026-07/small-model-agents.md) ·
> [verifier-ensembles](self-correction-2026-07/verifier-ensembles.md) ·
> [execution-feedback](self-correction-2026-07/execution-feedback.md) (unverified) ·
> [recent-2025-2026](self-correction-2026-07/recent-2025-2026.md)

## The one design law

**Self-correction only works when the verdict comes from outside the model.** This is the single
most replicated finding in the field:

- *Intrinsic* self-correction ("review your answer") is refuted for reasoning: GPT-3.5 falls
  75.9%→74.7% on GSM8K and collapses 75.8%→38.1% on CommonSenseQA under critique prompting; models
  flip more correct answers to wrong than the reverse (Huang et al., ICLR 2024, arXiv:2310.01798;
  independently confirmed by the Kamoi et al. TACL 2024 survey and 2025–26 successors).
- The failure is the *critique*, not the revision — and it gets **worse as models get smaller**:
  the generation-verification gap scales monotonically with pretraining FLOPs (Mind the Gap,
  arXiv:2412.02674). A 0.5B–4B model judging its own free-form output is a weak signal.
- *Extrinsic* feedback — zod validation errors, execution results, tests, deterministic checks —
  reliably works, including at small scale: with nothing but execution-error feedback, Llama 3.1 8B
  gains +9.8pp on HumanEval and +16pp on MBPP (arXiv:2604.10508, 2026), and 1–3B models gain
  significantly from execution feedback while text-only self-refinement gains nothing
  (arXiv:2604.21950, 2026).

Every mechanism below is a way of **manufacturing an external verdict and feeding it back**.
Mithril already owns the two best verdict sources in existence: zod schemas at every tool boundary
and tool execution results flowing through the event stream. The harness is structurally positioned
to do this better than any incumbent.

## The layered architecture (defense in depth)

The methods organize into five layers. Lower layers are cheaper and should ship on by default;
higher layers are opt-in compute. Each layer is independently testable against `apps/evals`.

### Layer 0 — Prompt: make the call succeed the first time

| Method | Evidence | Cost |
|---|---|---|
| **Few-shot exemplars in tool defs** | Strongest quantified prompt-side result: on a 1.3B model, 3 in-context examples took JSON parsability 7.34%→89.38% and task accuracy 1.11%→55.65%; zero-shot tool calling at ≤4B is effectively broken — most models emit 0% parsable JSON (arXiv:2504.19277). Vercel AI SDK 6 shipped tool `inputExamples` for exactly this reason. | A few hundred prompt tokens/tool |
| **Tool RAG / tool-count reduction** | Selection accuracy triples (13.62%→43.13%) with semantic top-k tool retrieval, prompt tokens halve (RAG-MCP, arXiv:2505.03275); accuracy cliffs as tool count grows. | Embed descriptions once |
| **Schema adaptation to the model** | Small models hallucinate tool names due to pretraining conventions; training-free renaming lifts accuracy up to +17% and cuts schema-misalignment errors 80% (PA-Tool, arXiv:2510.07248). Hammer's function-masking result implies **descriptions, not names, are the load-bearing part of a schema** for small models (arXiv:2410.04587). | Free (lint/DX guidance) |
| **Single-turn-shaped loops for small models** | Multi-turn is where small models die: Qwen3-4B scores 62.0% overall on BFCL but 35.3% multi-turn; Qwen3-0.6B 45.8% overall, **1.4%** multi-turn (TinyLLM, arXiv:2511.22138). Externalize state into the harness; don't rely on the model's conversation tracking. | Free (loop design) |

### Layer 1 — Decode: constrain generation where possible

- **Grammar-constrained decoding is proven net-positive** when prompts are held constant:
  ~3% task-accuracy gain for the best engine (Guidance/llguidance) plus up to 50% *faster*
  generation via token fast-forwarding (JSONSchemaBench, arXiv:2501.10868). The famous "format
  restrictions hurt reasoning" result (arXiv:2408.02442) was rebutted with controlled replication
  (dottxt: structured ≥ unstructured on all three tasks, Llama-3-8B).
- **Provider strict modes are converging**: OpenAI Structured Outputs (llguidance-powered since
  May 2025), Anthropic structured outputs + `strict: true` per tool (beta Nov 2025, now GA via
  `output_config.format`), Ollama `format` with zod support, Gemini 3 thought signatures.
  Mithril's provider layer should expose one capability flag and route to each.
- **The agent-loop trap — "tool suppression"**: naively enabling a JSON-schema grammar while the
  model may still choose to call a tool makes tool-call tokens *unreachable* — the model emits
  schema-valid output and silently stops using tools (Constraint Tax, arXiv:2606.25605). Constrain
  only the argument payload after tool selection, or the final answer — never the whole turn.
- **In-browser status (the Mithril gap)**: Transformers.js v4 (Feb 2026) still ships **no**
  grammar/JSON-schema decoding (it does expose a `logits_processor` hook). WebLLM + XGrammar ships
  JSON-schema + EBNF constrained decoding in-browser today; Chrome's Prompt API enforces
  `responseConstraint` via llguidance in Chromium; llguidance-wasm exists as a Microsoft
  experiment. Roadmap implication: hard local guarantees arrive via a WebLLM/XGrammar-class or
  llama.cpp-class backend — matching the existing roadmap entry — not via Transformers.js alone.

### Layer 2 — Parse: repair without retrying (the biggest measured lift)

**Schema-aligned lenient parsing** (BAML's SAP) parses malformed output *against* the target
schema — fixing unquoted strings, missing brackets, trailing commas, markdown fences, "yapping"
prefixes, key fuzzy-matches, type coercions — with **zero retries and zero extra tokens**. BAML's
published BFCL numbers (vendor-published, methodology public, deterministic mechanism so low risk):
claude-3-haiku 57.3%→91.7%, gpt-4o-mini 19.8%→92.4%, llama-3.1 8B-class 60.9%→76.8%. Nothing else
in this document buys +15 to +70 points for free. The JS building block is
[jsonrepair](https://github.com/josdejong/jsonrepair) (~2M weekly downloads, TS, streaming);
schema-aware coercion and candidate ranking on top of zod is the part a harness builds itself.

Two corroborating field findings (Local Agent Bench, Feb 2026, indie but instructive): **the
harness's parser changes the measured quality of a model** (LFM2.5 "improved" 0.640→0.880 purely
from adding a bracket-notation parser), and parser leniency can *mask* restraint failures — so the
parser must be a first-class, per-model-family, eval-tested surface.

### Layer 3 — Loop: typed feedback, bounded retries, guards (the harness's home turf)

This is where the production frameworks have converged, and where Mithril's typed event stream is
an unfair advantage — every mechanism below should emit typed `MithrilEvent`s so the devtools can
show *why* something was retried, steered, or halted (the "clear errors" pillar).

1. **Validation-error re-ask (the Instructor pattern), on by default.** zod failure → feed the
   *flattened, compact* error (paths + expected/received) back as the tool result → bounded retry.
   Universal in production (Instructor ~13.6k stars; Pydantic-AI `ModelRetry` with default budget
   **1**; TypeChat repair prompts; Vercel `experimental_repairToolCall`). Known pitfall to fix by
   design: Pydantic-AI resends full history + full validation error, ballooning tokens — a
   small-model killer (pydantic-ai#4908). Send a compact diff, not the transcript.
2. **Retry budget: 2, then fail loud.** The first repair round gives the largest marginal gain and
   two rounds capture 76–95% of achievable improvement (arXiv:2604.10508). Without early stopping,
   extra refinement rounds are *net-negative* — 1–3B refiners break already-passing output 43–62%
   of the time (arXiv:2604.21950). Never refine output that already validates ("stop-on-green").
3. **Route by error class.** Repair success is error-type dependent: name errors ~77%, syntax ~66%,
   assertion/semantic ~45% (arXiv:2604.10508) — auto-retry the mechanical class, prefer *resample*
   or escalate for the semantic class. ToolScan (arXiv:2411.13547) provides the canonical 7-class
   tool-error taxonomy to encode as typed error codes: hallucinated tool name, wrong arg name,
   wrong arg value, wrong arg type, premature stopping, repeated calls, invalid format.
4. **Error-as-observation contract.** Tool failures never throw; they return short, structured,
   actionable results the model can react to. Measured: SWE-agent's lint-reject-with-reason
   guardrail was worth +3.0 SWE-bench points; edit-success probability collapses 90.5%→57.2% after
   one failure, so steering the *first* failure matters most (arXiv:2405.15793). Even silence is
   designed: "command ran successfully and did not produce any output." Anthropic's tool-writing
   guidance says the same: actionable text, not tracebacks or opaque codes.
5. **Recovery-exemplar injection (PALADIN-lite).** On tool failure, inject a matched few-shot
   recovery exemplar per error class into the retry prompt. The trained version took Llama-3.1-8B's
   recovery rate 21.8%→79.8% (arXiv:2509.25238); the harness version is a static error-class →
   snippet map — pure middleware, no fine-tuning.
6. **Loop/stall detection.** Convergent production heuristics: OpenHands halts on 4× identical
   action→observation, 3× action→error, 6× alternating pairs; Gemini CLI hashes (tool, args) and
   flags cycles of length 1–5 repeated 5× in the last 25 calls, plus content-"chanting" detection;
   smolagents' zero-cost prompt rule: "never re-do a tool call with the exact same parameters."
   Action on detection: inject one steering message, then halt with a typed event. Keep the
   false-positive rate measured — only fire when something is *definitely* wrong.
7. **Budget guards + graceful degradation.** Converged defaults: LangGraph recursion_limit 25;
   Pydantic-AI retries 1; Vercel ToolLoopAgent 20 steps. The best degradation UX is smolagents: on
   hitting max steps, force one final answer synthesized *from the run history* instead of
   throwing. Budgets (`maxTurns`, `maxTokens`, `timeoutMs`) should be first-class run options with
   typed events, including an idle-timeout that resets on observable progress (LangGraph's shipped
   stall detector).
8. **Tool-*result* validation (MCP included).** Since MCP spec 2025-06-18, tools declare
   `outputSchema` and must return conforming `structuredContent` — and real-world gateways pass
   violations silently. Validating tool results (not just inputs) and converting violations into
   typed failure events is a genuine differentiation gap today.

### Layer 4 — Ensemble: spend compute instead of parameters (opt-in)

- **Self-consistency (sample N, vote)** is the cheapest reliable ensemble and beats both critique
  loops and multi-agent debate at equal cost (85.3% vs 83.2%, Huang et al.). Original result
  +17.9% GSM8K; works at 1B (~30.6%→~45% on MATH-500 at N=64, HF experiment). Cost is controllable:
  early-stopping variants cut samples up to 80% on GSM8K with no accuracy loss (arXiv:2401.10480).
  Mithril has a free equivalence relation for voting: canonical-JSON equality of zod-parsed outputs
  / (tool, validated-args) pairs. In-browser caveat: one WebGPU device means N× wall-clock — keep
  N≤5 with early stopping.
- **Best-of-N against a deterministic verifier** is the proven test-time-scaling recipe for tiny
  models: T1 (ICLR 2026, arXiv:2504.04718) shows Llama-3.2-1B beating Llama-3.1-8B when
  verification is offloaded to tools/code. The famous PRM-guided results (1B→matches-8B at beam
  N=32; 0.5B>GPT-4o with compute-optimal TTS, arXiv:2502.06703) all depend on a 7–8B reward model —
  server-only. The browser-viable existence proof for learned verifiers is Weaver's distilled 400M
  cross-encoder retaining 98.7% of a full verifier ensemble's accuracy (arXiv:2506.18203).
- **Confidence-gated cascade (generate small, escalate big).** RouteLLM keeps 95% of GPT-4 quality
  at 85% lower cost; Trust-or-Escalate (ICLR 2025) starts with a Mistral-7B judge and escalates
  only on low confidence with provable agreement guarantees (~87% cost savings). Maps one-to-one
  onto Mithril's run targets: local generates → agreement-rate / validation-failure gate →
  escalate to BYOK provider. Mastra's `{model, maxRetries}[]` fallback chains are the shipped TS
  precedent for the mechanics.
- **Tree search (ToT/LATS)**: proven on benchmarks (LATS 92.7% HumanEval with GPT-4) but 10–100×
  token cost, serialized wall-clock, needs environment checkpointing. Power-user opt-in at most;
  not viable in-browser.

### Cross-cutting — Evals and observability close the loop

- MAST (NeurIPS 2025 spotlight, 1,600+ traces): most agent failures are **system-design failures**
  (~42% spec/design, ~37% coordination, ~21% weak verification) — fixable at the harness layer
  without better models. And frontier LLMs localize errors in traces at only ~11% accuracy (TRAIL) —
  **deterministic detectors beat LLM-as-debugger**; put the intelligence in typed events, not in a
  "debugging agent."
- Eval-suite additions the literature directly motivates: **repair-success rate per error class per
  round** (nobody has measured this for 0.5B–4B — Mithril's evals can be first), **restraint /
  abstention scoring** (the dominant small-model failure in the wild is keyword-tripping — calling
  `get_weather` on any mention of weather), **wrong-tool avoidance**, and **parser robustness per
  model family**. BFCL v4 itself reweighted toward multi-step/multi-turn — the leaderboard now
  measures the loop.
- Targeted beats blind: root-caused single reruns repaired 13/73 failed GAIA tasks vs 4–6 for
  generic self-correction (AgentDebugX, July 2026); the self-healing-orchestrator architecture
  (typed failure events → classifier → per-class recovery policy under hard budgets) beat blind
  retry 98.8% vs 94.5% on a synthetic benchmark (arXiv:2606.01416 — architecture credible, numbers
  preliminary).

## Anti-patterns (evidence says don't)

1. **A default "reflect on your answer" middleware** — refuted; burns tokens and flips correct
   answers, worst for small models. If offered at all: opt-in, documented with Huang et al.
2. **Unbounded or generous retry budgets** — round 3+ adds ≤5–24% of achievable gain and risks
   breaking passing output. Default 2, stop-on-green, fail loud with typed history.
3. **Refining output that already validates** — 43–62% regression rate at 1–3B scale.
4. **Whole-turn schema grammars in an agent loop** — tool suppression (arXiv:2606.25605).
5. **Resending full history + full validation error on retry** — token bloat that specifically
   harms small models (pydantic-ai#4908).
6. **LLM-as-trace-debugger as the failure detector** — ~11% localization accuracy; use
   deterministic detectors and typed events.
7. **Trusting the parser to be neutral** — leniency changes measured model quality and can mask
   restraint failures; eval the parser itself.

## Proposed defaults (for discussion)

| Mechanism | Default | Rationale |
|---|---|---|
| SAP-style lenient parse (zod-aligned) | ON | Zero cost, biggest measured lift |
| Validation-error re-ask | ON, budget 2, compact-diff prompt | Universal production pattern; 2 rounds = 76–95% of gains |
| Error-class routing + typed ToolScan codes | ON | Free; enables targeted prompts, evals, clear DX errors |
| Error-as-observation (never throw) + designed empty output | ON | SWE-agent ablated (+3 pts) |
| Loop detector (hash (tool,args), 3× identical → steer once → halt) | ON | Convergent across OpenHands/Gemini CLI/smolagents; free |
| Budget guards + forced final synthesis | ON (turns ≈ 20–25) | Converged industry defaults; graceful degradation UX |
| Tool-result (incl. MCP outputSchema) validation | ON | Differentiation gap; silent failures → 0 with verifier gating |
| Few-shot examples in tool defs, auto-injected for small models | ON when model < threshold | 7%→89% parsability at 1.3B |
| Tool RAG top-k | AUTO when tool count × model size crosses threshold | Tripled selection accuracy |
| Self-consistency w/ early stop (N≤5) | OPT-IN | N× cost; proven but sequential in-browser |
| Best-of-N w/ deterministic verifier (T1 pattern) | OPT-IN (or auto on first-attempt failure) | Proven for 1B; linear cost |
| Cascade escalation local→BYOK | OPT-IN (config: fallback chain) | Proven pattern; needs user consent (keys, cost) |
| Constrained decoding | OPT-IN per provider capability; args-only in loops | Proven; tool-suppression caveat; not on Transformers.js |
| Tree search, intrinsic critique | OPT-IN, explicitly labeled experimental | Cost / refuted-by-default respectively |

## Verification status

31 load-bearing claims were adversarially fact-checked across six reports (the execution-feedback
checker did not run): 24 confirmed, 4 unverifiable (secondary-blog numbers, star counts), and the
rest corrected in place above — notably: the "beam search matches 8B at N=32" attribution (was
misattributed to weighted best-of-N), the Qwen PRM maj@8 claim (softened: good PRMs *do* beat
majority voting, but only modestly at small N), the browser tok/s figures (replaced with the
source's actual Qwen2.5-0.5B/Llama-3.2-1B numbers), the BFCL small-model table's true source
(TinyLLM, arXiv:2511.22138), the WebLLM/XGrammar citation (Nov 2024 announcement, not the June 2024
post), Anthropic structured outputs now GA (`output_config.format`), and Instructor's star count
(13.6k). Fabrication caught and removed: a "Phi-4-Mini ≥97% BFCL" figure attributed to the SLM
survey (arXiv:2510.03847) — the survey makes only qualitative claims plus a ">99% schema validity"
figure for extraction tasks.
