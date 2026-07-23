# Structured-Output Reliability for Small Models: Repair, Retry, and Constrained Decoding — Evidence Review

> Research-agent report, 2026-07-22, part of the self-correction sweep (7 dimensions + adversarial fact-check). Synthesis: [../self-correction-2026-07.md](../self-correction-2026-07.md). Raw output preserved as produced; verification appendix below notes any corrections — read it before quoting numbers.

## Top takeaways

- Schema-aligned lenient parsing (BAML SAP) shows the largest measured lift at zero token/latency cost: on BFCL, claude-3-haiku went 57.3% (native FC) to 91.7% and gpt-4o-mini 19.8% to 92.4%; llama-3.1 8B-class went 60.9% to 76.8% — vendor-published but with public interactive methodology. This is a pure parse-layer change that works identically for Transformers.js local models.
- Constrained decoding is now PROVEN net-positive: JSONSchemaBench (arXiv 2501.10868, by the Guidance/llguidance authors + independent academics) found grammar-constrained decoding IMPROVED task accuracy ~3-4% on GSM8K/Last Letter/Shuffle Objects and can be up to 50% FASTER than unconstrained (token fast-forwarding); the widely-cited 'Let Me Speak Freely' degradation result (arXiv 2408.02442) was rebutted by dottxt with methodological flaws (inconsistent prompts, schema-free JSON prompts).
- In-browser logit-level JSON-schema constrained decoding EXISTS today — but not for Transformers.js: WebLLM ships XGrammar compiled to WASM (response_format json_schema + EBNF, shipped, HF Spaces demo), Chrome's built-in Prompt API (Gemini Nano, Chrome 137+) supports responseConstraint JSON schema via llguidance merged into Chromium, and llguidance-wasm + guidance-ts is an experimental Microsoft demo. Transformers.js exposes a logits_processor hook but has NO shipped schema-constrained decoding library — this is the key gap for Mithril's playground; lenient parsing + retry is the practical path there.
- CRITICAL agent-loop caveat (arXiv 2606.25605, 2026): enabling JSON-schema grammar masks while tool calling is possible makes tool-call tokens unreachable — 'tool suppression'. Constrain only after tool selection (the argument payload) or when the output type is final; never naively wrap the whole agent turn in a schema grammar.
- Retry-with-validation-error loops are the universal production pattern (Instructor max_retries appending Zod/Pydantic errors to history; Pydantic-AI ModelRetry with a default retry budget of 1; TypeChat repair prompts; Vercel AI SDK experimental_repairToolCall) — shipped everywhere, but NO rigorous published benchmark quantifies the lift, and each retry costs a full extra round trip. Treat as budgeted fallback, not primary defense.
- Small models fail at tool calling for schema-alignment reasons, not just JSON syntax: PA-Tool (arXiv 2510.07248) showed training-free renaming of tools/params to match pretraining conventions lifts small-model accuracy up to +17% (MetaTool/RoTBench) and cuts schema-misalignment errors 80%. Compact schema rendering (BAML-style typedefs use ~60% fewer tokens than JSON Schema) and structure-matched few-shot demos compound this.
- Recommended Mithril layering (defense in depth, all evidence-backed): (1) default SAP-style lenient parser over zod (jsonrepair-class fixes + coercion + fence stripping) — free; (2) budgeted validation-error retry middleware emitting typed repair events — observable; (3) opt-in per-provider constrained decoding capability (OpenAI strict / Ollama format / WebLLM json_schema) with the tool-suppression guard; (4) prompt-layer schema compaction and naming alignment.
- jsonrepair (josdejong, ~1.8k stars, ~2M weekly npm downloads, TypeScript, streaming transform) is the battle-tested lenient-parsing primitive in JS; Vercel's AI SDK officially documents it as the repair layer, and instructor-js builds streaming partial-object parsing on schema-stream/zod-stream.
- Engine choice if Mithril ever embeds a grammar engine: JSONSchemaBench ranks Guidance/llguidance best on coverage, compliance and speed (~50us/token masks; OpenAI switched Structured Outputs to llguidance in May 2025; it's in Chromium, llama.cpp, vLLM, SGLang, onnxruntime-genai); XGrammar is the WASM-proven browser option (WebLLM); Outlines is Python-only with slow grammar compilation (3.5-12.8s) and timeout-driven compliance failures.
- Baseline reality check: raw small models score ~35% (Qwen2.5-3B, Llama-3.2-3B) to ~45% (Qwen2.5-7B FC) overall on BFCL — the gap to usable reliability is large enough that Mithril should ship parse-repair + retry ON by default, not as opt-in.

# Structured-Output Reliability & Repair Engineering for Small Models

Research question: what PROVEN techniques make tiny/small models (0.5B–8B, including in-browser WASM/WebGPU) produce reliable tool calls and structured output, and how do they map onto a TypeScript harness's middleware/loop? All sources below were fetched and verified 2026-07-22.

## 1. Retry-with-validation-error loops (production-shipped; lift unquantified)

**Instructor** (Python + [instructor-js](https://github.com/567-labs/instructor-js), 799 stars, active, v1.7.0 Jan 2025, npm `@instructor-ai/instructor`, built on Island AI's `zod-stream`/`schema-stream`) is the canonical pattern: on Zod/Pydantic validation failure it performs up to `max_retries`, and "in each retry, the validation error is appended to the message history, allowing the LLM to see its mistake and correct the output" ([retry docs](https://python.useinstructor.com/learning/validation/retry_mechanisms/)).

**Pydantic-AI** ([output docs](https://pydantic.dev/docs/ai/core-concepts/output/)) formalizes this as a typed `ModelRetry` exception raisable from output validators, output functions, and tool functions, with a **retry budget defaulting to 1**, configurable agent-wide, per-run, or per-tool (`ToolOutput(max_retries=N)`). It also ranks its three structured-output modes by reliability: **tool output** (schema-as-tool-parameters — "supported by virtually all models and highly reliable") > **native output** (provider structured-outputs feature, model-dependent) > **prompted output** ("least reliable but universally supported"). That ranking is directly reusable as a Mithril provider-capability fallback chain.

**TypeChat** (Microsoft, [8.7k stars, actively maintained](https://github.com/microsoft/TypeChat), TS/Python/C#) pioneered "schema engineering over prompt engineering": prompt with TypeScript type definitions, validate, and "if the validation fails, repair the non-conforming output through further language model interaction." Its docs publish **no quantitative effectiveness metrics** — conceptually influential, evidentially anecdotal.

**Vercel AI SDK** ships `experimental_repairToolCall` — a callback receiving `{toolCall, messages, error}` that can return a corrected tool call (e.g., re-ask a model with the error, or run jsonrepair) ([tool-calling docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)); its [cookbook officially recommends jsonrepair](https://ai-sdk.dev/cookbook/node/repair-json-with-jsonrepair). Note open bugs like [#8240](https://github.com/vercel/ai/issues/8240) (repair hook not firing on validation errors) — an API-design cautionary tale: the repair hook must be wired into *every* failure path.

**Evidence grade:** shipped in at least four production frameworks; **no rigorous published benchmark** isolates the accuracy lift of retry loops, especially for small models. Cost: each retry is a full extra round trip (2x latency/tokens worst case per attempt). Mapping: a loop-level middleware with a typed retry budget, compact zod-error rendering into the re-ask message, and a `MithrilEvent` per repair attempt (observability is the DX win — Pydantic-AI's budget-consumption model is the cleanest to copy).

## 2. Schema-Aligned Parsing — repair WITHOUT retry (vendor benchmark, biggest measured lift)

BAML's **Schema-Aligned Parsing (SAP)** ([technical explainer](https://boundaryml.com/blog/schema-aligned-parsing)) parses malformed output *against the target schema* using an edit-distance-like cost function: it fixes unquoted strings, unescaped quotes/newlines, missing commas/colons/brackets, trailing commas, comments, misnamed/superfluous keys, does type coercion (fractions→floats), strips prefix/suffix "yapping" and markdown fences, ranks multiple candidate parses, and completes partial objects for streaming — **zero retries, zero extra tokens**.

Their published [BFCL results](https://www.boundaryml.com/blog/sota-function-calling) (Aug 2024, interactive methodology): SAP vs native function calling — **gpt-3.5-turbo 87.5%→92%, claude-3-haiku 57.3%→91.7%, gpt-4o-mini 19.8%→92.4%, llama-3.1 8B-class 60.9% (AST parser)→76.8%**; small models with SAP land "less than 2%" behind gpt-4o with structured outputs, 2-4x faster than OpenAI FC-strict, and their compact `baml_schema` prompt format uses ~60% fewer tokens than JSON Schema (~140 vs ~420 tokens). **Evidence grade: vendor-published, publicly inspectable, not independently replicated** — but the mechanism is a deterministic parser, so the risk profile is low. Mapping: this is the single highest-leverage feature for Mithril — a lenient zod-aligned parser as the *default* tool-call/structured-output decode step. It works identically across scripted/live/local targets, including Transformers.js where constrained decoding is unavailable (see 3).

## 3. Constrained/grammar decoding (proven, with one critical agent-loop caveat)

**Server-side is settled.** [OpenAI Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) (Aug 2024): gpt-4o-2024-08-06 with constrained decoding scores **100%** on their complex-schema benchmark vs **<40%** for gpt-4-0613 prompting. [llguidance](https://github.com/guidance-ai/llguidance) (816 stars, MIT, Rust, v1.0.0 Jun 2025) computes token masks in ~50μs/token and now powers OpenAI Structured Outputs (switched May 2025), llama.cpp (`-DLLAMA_LLGUIDANCE=ON`), **Chromium**, SGLang, vLLM, mistral.rs, and onnxruntime-genai. [XGrammar](https://github.com/mlc-ai/xgrammar) (1.8k stars, active — v0.2.5 July 2026) claims up to 14x faster JSON-schema and 80x CFG generation and is the default backend for vLLM/SGLang/TensorRT-LLM. [Ollama structured outputs](https://ollama.com/blog/structured-outputs) (Dec 2024) exposes grammar-constrained JSON-schema via a `format` parameter with first-class Zod support. [Outlines](https://github.com/dottxt-ai/outlines) (15k stars) is Python-only.

**Does constraining hurt quality?** The famous ["Let Me Speak Freely?"](https://arxiv.org/abs/2408.02442) (EMNLP 2024 Industry) claimed reasoning degradation under format restrictions, but dottxt's rebuttal ["Say What You Mean"](https://blog.dottxt.ai/say-what-you-mean.html) documented five methodological flaws (inconsistent prompts across arms, JSON prompts lacking any schema, AI-parser confounds) and showed *structured ≥ unstructured* on Llama-3-8B-Instruct (GSM8K 0.78 vs 0.77; Last Letter 0.77 vs 0.73; Shuffle Objects 0.44 vs 0.41). The independent-scale confirmation is [JSONSchemaBench](https://arxiv.org/abs/2501.10868) (10K real-world schemas; Guidance, Outlines, llama.cpp, XGrammar, OpenAI, Gemini): "constrained decoding, regardless of the framework, achieves higher performance than the unconstrained setting" (~3-4% task-accuracy gains), Guidance/llguidance had the best coverage, compliance, and speed (6.37–9.47ms/token; grammar compile ~0s vs Outlines' 3.48–12.77s), and constrained decoding "can speed up the generation process by 50%" via mask-driven token fast-forwarding. **Evidence grade: PROVEN** (peer-adjacent benchmark, multiple engines, replicated direction).

**The agent-loop trap.** The 2026 "Constraint Tax" paper ([arXiv 2606.25605](https://arxiv.org/abs/2606.25605)) documents **tool suppression**: when JSON-schema constraints and tool calling are enabled simultaneously, "JSON Schema constraints are compiled into grammar-based token masks, causing tool-call tokens to become unreachable during decoding" — the model keeps emitting schema-valid output but stops invoking tools. Their fix is two-pass execution (unconstrained action selection, then constrained payload generation). For Mithril: **never apply an output-schema grammar while the model may still choose to call a tool**; constrain either the tool-argument payload after selection or the final answer only.

## 4. In-browser feasibility — the question that matters for Mithril's playground

Logit-level JSON-schema constrained decoding in JS/WASM **exists and ships today, but only outside Transformers.js**:

- **WebLLM + XGrammar (SHIPPED).** WebLLM compiled XGrammar's engine into its WASM model library and supports `response_format: json_schema` plus EBNF grammars, demoed in the [WebLLM Structured Generation Playground](https://huggingface.co/spaces/mlc-ai/WebLLM-Structured-Generation-Playground) ([MLC blog](https://blog.mlc.ai/2024/11/22/achieving-efficient-flexible-portable-structured-generation-with-xgrammar)). Requires WebGPU.
- **Chrome built-in Prompt API (SHIPPED in stable Chrome).** `responseConstraint` accepts a JSON Schema for Gemini Nano since Chrome 137 ([Chrome docs](https://developer.chrome.com/docs/ai/structured-output-for-prompt-api)); llguidance is merged into Chromium to enforce it. Relevant since a Chrome Prompt API provider is already on Mithril's roadmap.
- **llguidance-wasm + guidance-ts (EXPERIMENTAL).** A [Microsoft demo](https://sushraja-msft.github.io/llguidance-demo/) runs llguidance compiled to WASM against WebLLM over WebGPU, with grammars authored in TypeScript (`guidance-ts`).
- **Transformers.js: NOT AVAILABLE.** No shipped schema-constrained decoding library exists for it. It does expose a [`logits_processor` (LogitsProcessorList) generation parameter](https://huggingface.co/docs/transformers.js/api/generation/parameters) for "advanced users", so wiring llguidance-wasm/XGrammar-JS masks in is *technically feasible DIY* — but for Mithril today, the practical reliability stack for the Transformers.js local target is **SAP-style lenient parsing + grammar-aware tag parsing (`<tool_call>` etc., already in place) + budgeted retry**, with WebLLM as the future path if hard guarantees are wanted (already implicitly on the roadmap as "WASM/CPU-guaranteed backend").

## 5. Lenient parsing libraries (proven infrastructure)

[jsonrepair](https://github.com/josdejong/jsonrepair) (josdejong, ~1.8k stars, **~2.07M weekly npm downloads**, TypeScript, streaming-transform mode) fixes missing quotes/commas/brackets, truncation, single quotes, comments, JSONP — and its README explicitly targets LLM output. Python's `json_repair` (mangiucugna) mirrors it. For streaming partial objects, instructor-js's foundation (`schema-stream`, `zod-stream`) parses incomplete JSON against a Zod schema progressively. These cover perhaps 70% of SAP's fix list out of the box; SAP's schema-aware coercion, key-fuzzy-matching, and candidate ranking are the parts Mithril would build itself.

## 6. What lifts SMALL-model tool-calling most (comparative evidence)

Baselines are grim: on [BFCL](https://openreview.net/pdf?id=2GmDdhBdDk), Qwen2.5-3B ~35.7%, Llama-3.2-3B ~35.6% overall (prompted), Qwen2.5-7B (FC) 44.7%. Ranked by measured lift:

1. **Parse-layer repair (SAP-class): +15 to +70pts on BFCL** for small/cheap models (haiku 57.3→91.7; 4o-mini 19.8→92.4) — vendor benchmark, zero cost. Largest and cheapest lift.
2. **Schema adaptation to the model: up to +17%.** [PA-Tool](https://arxiv.org/abs/2510.07248) (2025) shows small models hallucinate tool names because of pretraining naming conventions; training-free renaming cut schema-misalignment errors 80% on MetaTool/RoTBench. Compact schema rendering (BAML: ~60% fewer tokens) and structure-matched few-shot demos (dottxt's finding) belong in this bucket. PROVEN-academic but single-paper.
3. **Constrained decoding: 100% syntax guarantee, +3-4% task accuracy, up to 50% faster** (JSONSchemaBench) — but guards syntax only (wrong tool/values still possible), unavailable on Transformers.js, and carries the tool-suppression trap in agent loops.
4. **Retry loops: unquantified but universal** — the fallback when 1-3 still fail; budget it (default 1) and surface every attempt as a typed event with a clear terminal error when the budget is exhausted.

The layered architecture for Mithril: **prompt layer** (compact schema + naming alignment + demos) → **decode layer** (opt-in provider capability: OpenAI strict / Ollama format / WebLLM json_schema / Chrome responseConstraint, with tool-suppression guard) → **parse layer** (default SAP-style zod-aligned repair, jsonrepair-based) → **loop layer** (budgeted validation-error retry middleware + `repairToolCall`-style escape hatch, all emitting `MithrilEvent`s). Each layer is independently testable with focused fixtures, and layers 1+3+4 work in every runtime Mithril supports today.

## Sources

| Title | Type | Year | URL |
|---|---|---|---|
| Beating OpenAI's structured outputs on cost, accuracy and speed (BFCL + SAP benchmarks) | benchmark | 2024 | https://www.boundaryml.com/blog/sota-function-calling |
| Schema-Aligned Parsing — BAML technical explainer | blog | 2024 | https://boundaryml.com/blog/schema-aligned-parsing |
| JSONSchemaBench: Generating Structured Outputs from Language Models — Benchmark and Studies (arXiv 2501.10868) | paper | 2025 | https://arxiv.org/abs/2501.10868 |
| Let Me Speak Freely? A Study on the Impact of Format Restrictions on Performance of LLMs (arXiv 2408.02442, EMNLP 2024 Industry) | paper | 2024 | https://arxiv.org/abs/2408.02442 |
| Say What You Mean: A Response to 'Let Me Speak Freely' — dottxt | blog | 2024 | https://blog.dottxt.ai/say-what-you-mean.html |
| Constraint Tax in Open-Weight LLMs: Tool Calling Suppression Under Structured Output Constraints (arXiv 2606.25605) | paper | 2026 | https://arxiv.org/abs/2606.25605 |
| Don't Adapt Small Language Models for Tools; Adapt Tool Schemas to the Models — PA-Tool (arXiv 2510.07248) | paper | 2025 | https://arxiv.org/abs/2510.07248 |
| guidance-ai/llguidance — Super-fast Structured Outputs (Rust, powers OpenAI/Chromium/llama.cpp) | repo | 2025 | https://github.com/guidance-ai/llguidance |
| mlc-ai/xgrammar — Fast, Flexible and Portable Structured Generation | repo | 2026 | https://github.com/mlc-ai/xgrammar |
| MLC: Achieving Efficient, Flexible, and Portable Structured Generation with XGrammar (WebLLM WASM integration) | blog | 2024 | https://blog.mlc.ai/2024/11/22/achieving-efficient-flexible-portable-structured-generation-with-xgrammar |
| WebLLM Structured Generation Playground (HF Space) | benchmark | 2024 | https://huggingface.co/spaces/mlc-ai/WebLLM-Structured-Generation-Playground |
| llguidance-wasm demo — llguidance compiled to WebAssembly with WebLLM | docs | 2025 | https://sushraja-msft.github.io/llguidance-demo/ |
| Structured output support for the Prompt API — Chrome for Developers (responseConstraint, Chrome 137+) | docs | 2025 | https://developer.chrome.com/docs/ai/structured-output-for-prompt-api |
| Introducing Structured Outputs in the API — OpenAI (100% vs <40% complex-schema benchmark) | docs | 2024 | https://openai.com/index/introducing-structured-outputs-in-the-api/ |
| Pydantic AI — Output validation, ModelRetry, retry budgets, output modes | docs | 2026 | https://pydantic.dev/docs/ai/core-concepts/output/ |
| microsoft/TypeChat — schema engineering + repair prompts | repo | 2024 | https://github.com/microsoft/TypeChat |
| 567-labs/instructor-js — structured extraction with Zod + validation-error retries | repo | 2025 | https://github.com/567-labs/instructor-js |
| Instructor — Retry Mechanisms (validation errors appended to message history) | docs | 2025 | https://python.useinstructor.com/learning/validation/retry_mechanisms/ |
| josdejong/jsonrepair — Repair invalid JSON documents (TS, ~2M weekly downloads) | repo | 2025 | https://github.com/josdejong/jsonrepair |
| Vercel AI SDK — Tool Calling (experimental_repairToolCall) | docs | 2025 | https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling |
| Vercel AI SDK Cookbook — Repair Malformed JSON with jsonrepair | docs | 2025 | https://ai-sdk.dev/cookbook/node/repair-json-with-jsonrepair |
| Ollama — Structured outputs (JSON-schema format parameter, Zod support) | blog | 2024 | https://ollama.com/blog/structured-outputs |
| The Berkeley Function Calling Leaderboard (BFCL): From Tool Use to Agentic (small-model baselines) | paper | 2025 | https://openreview.net/pdf?id=2GmDdhBdDk |
| dottxt-ai/outlines — Structured generation via logit masking (Python) | repo | 2026 | https://github.com/dottxt-ai/outlines |
| Transformers.js generation parameters — logits_processor hook | docs | 2025 | https://huggingface.co/docs/transformers.js/api/generation/parameters |

## Verification appendix

Fact-check verdict: **minor-issues**

Checked claims:

- **[confirmed]** BAML SAP BFCL per-model results: gpt-3.5-turbo 87.5%→92%, claude-3-haiku 57.3%→91.7%, gpt-4o-mini 19.8%→92.4%, llama-3.1 60.9% (AST parser)→76.8%
- **[confirmed]** BAML claims small models with SAP land 'less than 2%' behind gpt-4o with structured outputs and are 2-4x faster than OpenAI FC-strict (boundaryml.com/blog/sota-function-calling)
- **[unverifiable]** BAML's compact baml_schema format uses ~60% fewer tokens than JSON Schema (~140 vs ~420 tokens)
- **[confirmed]** OpenAI Structured Outputs announcement: gpt-4o-2024-08-06 scores 100% on complex JSON-schema-following benchmark vs <40% for gpt-4-0613 prompting
- **[confirmed]** JSONSchemaBench (arXiv 2501.10868): 10K real-world schemas, six frameworks; 'constrained decoding, regardless of the framework, achieves higher performance than the unconstrained setting'; can 'speed up the generation process by 50%'; Guidance best with 6.37–9.47 ms/token and ~0s grammar compile vs Outlines seconds
- **[confirmed]** Constraint Tax paper (arXiv 2606.25605) exists and documents tool suppression: JSON Schema constraints compiled into grammar-based token masks make tool-call tokens unreachable; proposes a two-pass execution fix
- **[confirmed]** Chrome Prompt API structured output via responseConstraint (JSON Schema) is available as of Chrome 137 (developer.chrome.com docs)
- **[confirmed]** Transformers.js exposes a logits_processor (LogitsProcessorList) generation parameter documented as 'intended for advanced users'
- **[confirmed]** Pydantic-AI docs (URL resolves at pydantic.dev/docs/ai/core-concepts/output/): ModelRetry exception, retry budget defaulting to 1, three output modes ranked tool > native > prompted by reliability
- **[confirmed]** dottxt 'Say What You Mean' rebuttal reports structured ≥ unstructured on Llama-3-8B-Instruct: GSM8K 0.78 vs 0.77, Last Letter 0.77 vs 0.73, Shuffled Objects 0.44 vs 0.41
- **[confirmed]** PA-Tool (arXiv 2510.07248) 'Don't Adapt Small Language Models for Tools; Adapt Tool Schemas to the Models': training-free schema renaming, up to 17% improvement, schema-misalignment errors reduced by 80% on MetaTool/RoTBench

Corrections:

- **Claim:** JSONSchemaBench shows '~3-4% task-accuracy gains' from constrained decoding
  - **Problem:** The paper's stated figure is 'approximately a 3% improvement over the LM-only approach in every task' — and that is for Guidance, the best-performing framework, not a general 3-4% range. '3-4%' slightly overstates.
  - **Correction:** Change to '~3% task-accuracy gains (Guidance, the best framework; other frameworks also beat unconstrained but by less)'. Also note: the Outlines grammar-compile range I could verify in the paper is 3.48–8.05s; the 12.77s upper bound was not found in the fetched text.
- **Claim:** BAML's compact baml_schema prompt format uses ~60% fewer tokens than JSON Schema (~140 vs ~420 tokens)
  - **Problem:** Neither cited BAML page (sota-function-calling, schema-aligned-parsing) contains these token counts in fetched content; the claim's source is unaccounted for.
  - **Correction:** Either locate and cite the actual BAML source for the token comparison or downgrade to 'BAML claims a more token-compact schema format' without specific numbers. Note also the per-model BFCL table lives on boundaryml.com/blog/schema-aligned-parsing (static), not the sota-function-calling page whose table is JS-rendered — cite the former for the numbers.
- **Claim:** Pydantic-AI quotes: tool output 'supported by virtually all models and highly reliable'; prompted output 'least reliable but universally supported'
  - **Problem:** Presented as verbatim quotes, but the page's actual wording is 'supported by virtually all models and has been shown to work very well' and 'usable with all models, but is often the least reliable approach'. Substance identical, quotation inexact.
  - **Correction:** Reword as paraphrase or use the exact page wording. The three-mode ranking, ModelRetry, and default budget of 1 are all accurate.
