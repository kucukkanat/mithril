# Self-Correction Mechanisms in Production Agent Frameworks: A Survey for Small-Model Harnesses

> Research-agent report, 2026-07-22, part of the self-correction sweep (7 dimensions + adversarial fact-check). Synthesis: [../self-correction-2026-07.md](../self-correction-2026-07.md). Raw output preserved as produced; verification appendix below notes any corrections — read it before quoting numbers.

## Top takeaways

- Intrinsic self-correction (model critiques itself with no new signal) is PROVEN NOT to work — ICLR 2024 (arXiv 2310.01798) shows reasoning performance often degrades; every production mechanism that works grounds correction in an EXTERNAL signal: schema validation errors, linter output, execution errors, or reward functions. Design the harness around feeding those signals back, not around 'reflect' prompts.
- The single most adoptable TS-native mechanism is Vercel AI SDK's experimental_repairToolCall: a hook invoked on NoSuchToolError/InvalidToolInputError that can (a) deterministically fix args, (b) re-ask the same model with the error appended as a tool result, or (c) regenerate args with a stronger structured-output model — explicitly motivated by 'smaller models'. Maps 1:1 onto a Mithril middleware.
- Error-message design is a measured lever, not folklore: SWE-agent (NeurIPS 2024, arXiv 2405.15793) showed a lint-guardrail that REJECTS syntax-breaking edits and shows the error cost ~3 points of SWE-bench resolve rate when removed (15.0% w/o vs ~18% with); Anthropic's tool-writing guidance says the same — actionable, specific error text instead of tracebacks/opaque codes.
- Small-model tool calling collapses specifically in MULTI-TURN: BFCL-style benchmarks (TinyLLM, arXiv 2511.22138) show Qwen3-4B 62% overall but 35% multi-turn; 1.7B 55%/17%; 0.6B 46%/1.4%. Reliability work for the in-browser playground should target multi-turn state tracking (compact feedback, dedup guards, planning steps), not just single-call schema validity.
- Retry budgets are converged and small: Pydantic-AI defaults to 1 retry per category (tools/output) with ModelRetry feeding the validation error back; LangGraph's RetryPolicy retries only transient errors by default (never ValueError/TypeError) and caps loops at recursion_limit=25; OpenAI SDK uses max_turns; smolagents uses max_steps plus a prompt rule 'never re-do a tool call with the exact same parameters' (cheap loop detection).
- Constrained/grammar decoding gives 100% structurally valid tool calls at near-zero overhead (XGrammar, arXiv 2411.15100) and is the strongest guarantee available for tiny local models — but the 'Constraint Tax' paper (arXiv 2606.25605) warns that naively combining tool-call and JSON-schema grammars can SUPPRESS tool invocation; use two-pass decoupling.
- DSPy is the only framework with replicated evidence that its mechanism helps SMALL models specifically: compiling (bootstrapped demos + instruction search) lifted llama2-13b-chat from 9%→47% on multi-hop QA (ICLR 2024, arXiv 2310.03714), and LM Assertions (retry-with-past-output-plus-feedback, arXiv 2312.13382) gave up to 35.7% intrinsic gains; the modern API is dspy.Refine (N attempts, reward_fn, auto-generated feedback hints) — a directly portable wrapper pattern.
- Model fallback chains are shipped and TS-native in Mastra: model accepts an array of {model, maxRetries}, failing over on 500/rate-limit/timeout with streaming preserved — the right shape for 'local model failed twice → escalate to BYOK provider' in a playground.
- Claude Agent SDK hooks are the best-designed feedback-injection surface: PostToolUse/PostToolUseFailure can append additionalContext or replace tool output before the model sees it — i.e., validators run OUTSIDE the model and their findings are injected as observations ('3 TypeScript errors at lines 42, 78, 103' beats silently blocking).
- Anecdotal but consistent across frameworks: fewer, coarser tools beat many small ones for weak models (smolagents' top guideline is 'reduce the number of LLM calls'; SWE-agent's ACI principle is simple actions with concise docs) — harness-level tool simplification helps small models more than any retry loop.

# Self-Correction & Reliability Mechanisms in Production Agent Frameworks (2024–2026)

Research goal: identify proven, adoptable mechanisms for a TypeScript agent harness (Mithril) that must make 0.5B–8B models — including in-browser Transformers.js models — work reliably. All framework claims below were verified against current docs/papers; star counts are from the GitHub API on 2026-07-22.

## The foundational result: self-correction needs an external signal

**PROVEN (negative result).** [Large Language Models Cannot Self-Correct Reasoning Yet](https://arxiv.org/abs/2310.01798) (ICLR 2024) shows *intrinsic* self-correction — asking a model to critique its own answer with no new information — fails and often degrades performance. Emerging counter-evidence exists for *trained* self-correction at small scale ([ISC, arXiv 2401.07301](https://arxiv.org/pdf/2401.07301), 6B models fine-tuned with Partial Answer Masking), but that requires fine-tuning, not harness work. Conversely, [Reflexion](https://arxiv.org/abs/2303.11366) (NeurIPS 2023, [repo](https://github.com/noahshinn/reflexion) ~3.2k stars) works precisely because it converts an **external** binary/scalar signal (test pass/fail) into verbal feedback stored in episodic memory across retries.

**Design consequence:** every mechanism worth adopting is a way of manufacturing and delivering an external correction signal — zod validation errors, linter output, execution exceptions, reward functions — back into the model's context. "Reflect on your answer" middleware without such a signal is anti-evidence-based.

## TypeScript-native frameworks (directly adoptable)

### Vercel AI SDK (~25.7k stars) — tool-call repair

The most directly portable mechanism. Per the [tool-calling docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling), `experimental_repairToolCall` is an async hook `({ toolCall, tools, inputSchema, error, messages, system }) => repairedCall | null`, invoked on `NoSuchToolError` and `InvalidToolInputError`. The docs motivate it explicitly: models "fail to generate valid tool calls, especially when the input schema is complex or the model is smaller." Two documented strategies: **re-ask** (append the invalid call plus the error as a tool result and let the same model retry) and **structured-output regeneration** (a stronger model regenerates just the arguments via `Output.object({ schema: tool.inputSchema })`). Separately, tool *execution* errors are added as `tool-error` content parts "to enable automated LLM roundtrips in multi-step scenarios" — i.e., execution failures are observations, not exceptions. Loop bounding is via `stopWhen` step limits. **Status: PROVEN-shipped** (production SDK, still `experimental_` prefixed; [gaps exist](https://github.com/vercel/ai/issues/8240) around some validation paths). **Mithril mapping:** a `repairToolCall` middleware slot with a deterministic first tier (JSON repair, `z.coerce`, strip markdown fences — zero cost) before any model round-trip (one extra call, only on failure).

### Mastra (~26.4k stars) — model fallback chains

Per the [model-fallback post](https://mastra.ai/blog/model-fallback), `model:` accepts an array of `{ model, maxRetries }`; fallback triggers on 500s, rate limits, and timeouts; each model has an independent retry count; streaming is preserved ("only the last model in the chain returns error streams"). Workflow steps also take a `retries` param and a [StreamErrorRetryProcessor](https://mastra.ai/reference/processors/stream-error-retry-processor). **Status: PROVEN-shipped.** **Mithril mapping:** the exact shape for "local 1B model exhausted its budget → escalate to BYOK provider" with a typed `fallback` event on the stream.

### LangGraph / LangGraph.js (~37.8k stars) — retry policies, timeouts, checkpoint resume

Per the [fault-tolerance post](https://www.langchain.com/blog/fault-tolerance-in-langgraph): per-node `RetryPolicy(max_attempts, initial_interval=0.5, backoff_factor=2.0, max_interval, jitter, retry_on)` whose **default predicate is deliberately conservative** — transient errors (ConnectionError, 5xx) retry; `ValueError`/`TypeError` do **not**, because "those are almost always programming bugs." Timeouts distinguish `run_timeout` (wall clock) from `idle_timeout` (**max time without observable progress**, reset by channel writes/streamed chunks — a shipped stall detector). Error handlers fire after retries exhaust, atomically committed to the checkpoint; runs resume from node boundaries. Loop guard: [`recursion_limit` defaults to 25](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT), raising `GraphRecursionError` (same in [langgraphjs](https://github.com/langchain-ai/langgraphjs/issues/1524)). Reflection/self-correction is a *pattern users build* (critique node + edge back), not a primitive. **Status: PROVEN-shipped infra; reflection patterns anecdotal.**

### Claude Agent SDK / Claude Code — hooks as feedback injectors

Per the [hooks docs](https://code.claude.com/docs/en/agent-sdk/hooks): `PreToolUse` can block/modify calls; exactly one of `PostToolUse`/`PostToolUseFailure` fires after execution and can append `additionalContext` or replace output via `updatedToolOutput` before the model sees it. The design idiom: a validator that reports "3 TypeScript errors in handler.ts at lines 42, 78, 103" outperforms one that silently blocks. Anthropic's [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) codifies error-response design: "prompt-engineer your error responses to clearly communicate specific and actionable improvements, rather than opaque error codes or tracebacks," plus token-efficient defaults and pagination. **Status: shipped; error-design advice is production-informed but not ablated publicly.**

## Python frameworks (mechanisms to port)

### Pydantic-AI (~18.7k stars) — ModelRetry and typed retry budgets

Per the [Agent API docs](https://pydantic.dev/docs/ai/api/pydantic-ai/agent/): tools and `@agent.output_validator` functions raise `ModelRetry("message")`; the framework feeds the message back as a retry prompt. `retries` defaults to **1**, settable per category (`{'tools': 3, 'output': 1}`); `UsageLimits(request_limit)` caps total model requests; exhaustion raises `UnexpectedModelBehavior`. **Known pitfall** ([issue #4908](https://github.com/pydantic/pydantic-ai/issues/4908)): retries resend full history/full ValidationError, ballooning tokens — a small-model killer. **Mithril mapping:** typed retry budgets per category + a *compact-diff* retry prompt (only the failing paths of the zod error), fixing the documented pitfall by design.

### OpenAI Agents SDK (~28.1k stars) — guardrails and tripwires

Per the [guardrails docs](https://openai.github.io/openai-agents-python/guardrails/): input guardrails (first agent only; run **in parallel** with the agent by default for latency, or blocking) and output guardrails (last agent) return `GuardrailFunctionOutput` with a `tripwire_triggered` bool; tripwires raise typed exceptions and halt. Tool-level guardrails (`@tool_input_guardrail`/`@tool_output_guardrail`) can skip a call, **replace output with a message the model sees** (`.reject_content()`), or trip. Loop guard: `max_turns`. **Status: PROVEN-shipped.** Tripwire = halt is complementary to retry = correct; a harness wants both, as distinct middleware outcomes.

### smolagents (~28.5k stars) — errors as memory, prompt-level loop guard

The [building-good-agents guide](https://huggingface.co/docs/smolagents/en/tutorials/building_good_agents) shows the core pattern: tools `raise ValueError("Conversion of date_time failed, make sure to provide '%m/%d/%y %H:%M:%S'. Full trace: …")` and the trace lands in agent memory as an observation for the next step. Its default system prompt contains a **zero-cost loop guard**: "never re-do a tool call that you previously did with the exact same parameters." `planning_interval` inserts a periodic no-tool reflection step (update facts, re-plan) — useful for small models that lose the thread in multi-turn. Top guideline: reduce LLM calls; merge tools ("the best agentic systems are the simplest"). The CodeAgent "~30% fewer steps" claim is **anecdotal/benchmark-limited**. **CrewAI** (~56k stars) ships the same validate-and-feed-back loop as [task guardrails](https://docs.crewai.com/en/concepts/tasks): function- or LLM-based, `(bool, result|error)` tuples, `guardrail_max_retries`. **AutoGen/AG2** (~4.8k stars) relies on conversational error feedback plus `max_consecutive_auto_reply` (default 100 — far too loose as a default).

### DSPy (~36.3k stars) — the strongest small-model evidence

**PROVEN, small-model-specific.** [The DSPy paper](https://arxiv.org/abs/2310.03714) (ICLR 2024): compiling (bootstrapped few-shot demos + instruction search) raised llama2-13b-chat from 9%→47% and 22%→41% on two tasks, and made 770M-parameter T5 "competitive with approaches that rely on expert-written prompt chains." [LM Assertions](https://arxiv.org/abs/2312.13382): on constraint failure, retry with the **past failing output plus the feedback message injected** — up to 35.7% intrinsic / 13.3% downstream gains. Since DSPy 2.6 the runtime API is [BestOfN and dspy.Refine](https://dspy.ai/tutorials/output_refinement/best-of-n-and-refine/): run a module up to N times, score with `reward_fn`, stop at `threshold`, and auto-generate feedback used as hints on subsequent attempts. No official TS port. **Mithril mapping:** (a) a `refine(agent, { reward, n, threshold })` wrapper is trivially portable; (b) longer-term, focused local-model fixtures are the scaffolding needed for compile-style prompt/demo optimization per local model — the highest-leverage, small-model-specific investment.

## Designing errors for models: SWE-agent ACI

**PROVEN with ablations.** [SWE-agent](https://arxiv.org/abs/2405.15793) (NeurIPS 2024, [repo](https://github.com/SWE-agent/SWE-agent) ~19.9k stars) established ACI principles: simple actions with concise documentation; compact, structured post-action feedback; **guardrails that catch errors at the source** — a linter runs on every edit and *rejects* edits introducing syntax errors, showing the error and keeping state unchanged. Ablation: removing linting dropped resolve rate to 15.0% (a ~3-point drop). Even empty output is designed: "Your command ran successfully and did not produce any output" — silence is ambiguous to an LM. Malformed generations get an error response and a retry until valid. **Mithril mapping:** ship an "ACI lint" tier — validate tool *effects* (not just inputs) before committing them, reject-with-reason into the event stream, and never return empty observations.

## Guarantees for tiny local models: constrained decoding

**PROVEN for validity; caveated for tool choice.** [XGrammar](https://arxiv.org/pdf/2411.15100) ([XGrammar-2](https://blog.mlc.ai/2026/05/04/xgrammar-2-fast-customizable-structured-generation)) compiles JSON Schema/CFGs to token masks: 100% structurally valid output at near-zero overhead — for agent stacks "format fidelity often dominates prose quality," and it matters most for the smallest models. Caveat: the [Constraint Tax paper](https://arxiv.org/abs/2606.25605) documents **tool suppression** when tool-call and schema grammars are enabled simultaneously (schema satisfaction makes tool-call tokens unreachable); the fix is two-pass decoding (decide tool use unconstrained, then constrain arguments). Transformers.js lacks native grammar support, so in-browser Mithril should pair its tag-grammar parsers with validate-then-repair; a WASM grammar backend is the correct roadmap item. Scale context from [TinyLLM](https://arxiv.org/abs/2511.22138) (BFCL framework): Qwen3-4B 62.04% overall / 35.25% multi-turn; 1.7B 55.49%/16.88%; 0.6B 45.76%/**1.38%** multi-turn — sub-2B models need aggressive multi-turn scaffolding (dedup guards, planning steps, compact observations), and hybrid fine-tuning got 1–3B models to 65.74%/55.62%.

## Synthesis: the adoptable stack for Mithril

Ordered by evidence strength and cost: (1) **error-as-observation contract** — typed tool errors with actionable messages injected as observations (SWE-agent ablated; universal in production frameworks; free); (2) **deterministic → re-ask → escalate repair ladder** for tool calls (Vercel-shipped; 0–1 extra calls, on failure only); (3) **typed retry budgets** — default 1–2 per category, transient-only transport retries, `request_limit`/step cap ≈25 (Pydantic-AI/LangGraph defaults); (4) **loop/stall guards** — duplicate-call detection + progress-based idle timeout (smolagents/LangGraph; free); (5) **model fallback chains** (Mastra-shipped; TS-native); (6) **Refine/BestOfN wrapper** with reward functions (DSPy; N× cost, opt-in); (7) **guardrail tripwires** as a distinct halt outcome (OpenAI SDK); (8) **grammar-constrained argument decoding** for local models, two-pass to avoid the constraint tax.

## Sources

| Title | Type | Year | URL |
|---|---|---|---|
| AI SDK Core: Tool Calling (experimental_repairToolCall) | docs | 2025 | https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling |
| Fault Tolerance in LangGraph: Retries, Timeouts and Error Handlers | blog | 2025 | https://www.langchain.com/blog/fault-tolerance-in-langgraph |
| LangGraph GRAPH_RECURSION_LIMIT error reference | docs | 2025 | https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT |
| OpenAI Agents SDK: Guardrails | docs | 2025 | https://openai.github.io/openai-agents-python/guardrails/ |
| Pydantic-AI Agent API (retries, ModelRetry, output_validator, UsageLimits) | docs | 2026 | https://pydantic.dev/docs/ai/api/pydantic-ai/agent/ |
| Pydantic-AI issue #4908: retry context sends full history (token bloat) | repo | 2026 | https://github.com/pydantic/pydantic-ai/issues/4908 |
| Mastra: Model fallbacks — your safety net for production AI | blog | 2025 | https://mastra.ai/blog/model-fallback |
| Claude Agent SDK: Intercept and control agent behavior with hooks | docs | 2026 | https://code.claude.com/docs/en/agent-sdk/hooks |
| Anthropic Engineering: Writing effective tools for AI agents | blog | 2025 | https://www.anthropic.com/engineering/writing-tools-for-agents |
| smolagents: Building good agents (error logging, planning_interval) | docs | 2025 | https://huggingface.co/docs/smolagents/en/tutorials/building_good_agents |
| CrewAI Tasks: guardrails and guardrail_max_retries | docs | 2025 | https://docs.crewai.com/en/concepts/tasks |
| SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering (arXiv 2405.15793) | paper | 2024 | https://arxiv.org/abs/2405.15793 |
| DSPy: Compiling Declarative LM Calls into Self-Improving Pipelines (arXiv 2310.03714) | paper | 2024 | https://arxiv.org/abs/2310.03714 |
| DSPy Assertions: Computational Constraints for Self-Refining LM Pipelines (arXiv 2312.13382) | paper | 2024 | https://arxiv.org/abs/2312.13382 |
| DSPy tutorial: BestOfN and Refine (replacement for Assert/Suggest) | docs | 2025 | https://dspy.ai/tutorials/output_refinement/best-of-n-and-refine/ |
| Large Language Models Cannot Self-Correct Reasoning Yet (arXiv 2310.01798) | paper | 2024 | https://arxiv.org/abs/2310.01798 |
| Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv 2303.11366) | paper | 2023 | https://arxiv.org/abs/2303.11366 |
| TinyLLM: Evaluation and Optimization of Small Language Models for Agentic Tasks on Edge Devices (arXiv 2511.22138) | paper | 2025 | https://arxiv.org/abs/2511.22138 |
| XGrammar: Flexible and Efficient Structured Generation (arXiv 2411.15100) | paper | 2024 | https://arxiv.org/pdf/2411.15100 |
| Constraint Tax in Open-Weight LLMs: Tool Calling Suppression Under Structured Output Constraints (arXiv 2606.25605) | paper | 2026 | https://arxiv.org/abs/2606.25605 |
| Berkeley Function Calling Leaderboard (BFCL) V4 | benchmark | 2025 | https://gorilla.cs.berkeley.edu/leaderboard.html |

## Verification appendix

Fact-check verdict: **minor-issues**

Checked claims:

- **[confirmed]** arXiv 2310.01798 ('Large Language Models Cannot Self-Correct Reasoning Yet', ICLR 2024) shows intrinsic self-correction without external feedback fails and often degrades performance
- **[confirmed]** Vercel AI SDK ships an experimental_-prefixed tool-call repair hook invoked on NoSuchToolError/InvalidToolInputError, with documented re-ask and structured-output-regeneration strategies; docs state models 'fail to generate valid tool calls, especially when the input schema is complex or the model is smaller'; tool execution errors are added as tool-error content parts 'to enable automated LLM roundtrips in multi-step scenarios'; loop bounding via stopWhen
- **[wrong]** The repairToolCall hook signature includes a `system` field: ({ toolCall, tools, inputSchema, error, messages, system })
- **[confirmed]** LangGraph fault-tolerance post: per-node RetryPolicy(max_attempts, initial_interval=0.5, backoff_factor=2.0, max_interval, jitter, retry_on); default predicate retries ConnectionError/5xx but not ValueError/TypeError ('almost always programming bugs'); run_timeout is wall-clock while idle_timeout resets on progress signals (channel writes, streamed chunks); error handlers fire only after retries exhaust, are atomically committed to the checkpoint, and runs resume from node boundaries
- **[confirmed]** LangGraph recursion_limit defaults to 25 and raises GraphRecursionError; same behavior in langgraphjs (issue #1524)
- **[confirmed]** DSPy paper (arXiv 2310.03714): compiling raised llama2-13b-chat from 9% to 47% and from 22% to 41% on two tasks (GSM8K 9.4→46.9, HotPotQA 21.8→41.0), and 770M-parameter T5 was 'competitive with approaches that rely on expert-written prompt chains'
- **[confirmed]** SWE-agent (arXiv 2405.15793): removing linting dropped resolve rate to 15.0% (a 3.0-point drop from 18.0% w/ linting on SWE-bench Lite); invalid edits are discarded and the agent asked to retry; empty output is replaced with 'Your command ran successfully and did not produce any output'; malformed generations get an error response and are retried until valid
- **[confirmed]** TinyLLM (arXiv 2511.22138, BFCL framework): Qwen3-4B 62.04% overall / 35.25% multi-turn; Qwen3-1.7B 55.49% / 16.88%; Qwen3-0.6B 45.76% / 1.38%; hybrid optimization reached 65.74% overall / 55.62% multi-turn
- **[confirmed]** Constraint Tax paper (arXiv 2606.25605) exists, documents tool-calling suppression when tool-call and JSON-Schema grammars are enabled simultaneously (tool-call tokens become unreachable under grammar token masks), and recommends a two-pass strategy decoupling tool execution from schema-constrained generation
- **[confirmed]** Mastra model fallback: model: accepts an array of { model, maxRetries }; fallback triggers on 500 errors, rate limits, and timeouts; each model has an independent retry count; 'Only the last model in the chain returns error streams'
- **[confirmed]** Pydantic-AI: retries defaults to 1 and is settable per category ({'tools': 3, 'output': 1}); ModelRetry messages are fed back as retry prompts; issue #4908 documents retries resending full conversation history causing token bloat and degraded correction on smaller models
- **[confirmed]** Claude Agent SDK hooks: PreToolUse can block (permissionDecision: 'deny') or modify (updatedInput) tool calls; PostToolUse and PostToolUseFailure exist as distinct success/failure events; hooks can append additionalContext or replace tool output via updatedToolOutput before the model sees it
- **[unverifiable]** GitHub star counts (~25.7k Vercel AI SDK, ~26.4k Mastra, ~37.8k LangGraph, ~18.7k Pydantic-AI, ~28.1k OpenAI Agents SDK, ~28.5k smolagents, ~56k CrewAI, ~36.3k DSPy, ~19.9k SWE-agent, ~3.2k Reflexion) as of 2026-07-22

Corrections:

- **Claim:** experimental_repairToolCall is an async hook ({ toolCall, tools, inputSchema, error, messages, system }) => repairedCall | null
  - **Problem:** In AI SDK 7 (the version the cited live docs page now documents), the `system` option was renamed to `instructions`. The AI SDK 7.0 migration guide states: 'AI SDK 6: experimental_repairToolCall: async ({ system, messages }) / AI SDK 7: experimental_repairToolCall: async ({ instructions, messages })'. The param list in the report matches AI SDK <=6, not the currently cited page. (The 'still experimental_ prefixed' claim IS correct — the migration guide confirms the prefix was retained in v7.)
  - **Correction:** State the signature as ({ toolCall, tools, inputSchema, error, messages, instructions }) for current AI SDK 7, or note 'system in AI SDK <=6, renamed instructions in v7'. Same URL is fine: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling; migration ref: https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0
- **Claim:** recursion_limit defaults to 25 (cited to https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT)
  - **Problem:** The claim itself is true, but the specific cited page describes GRAPH_RECURSION_LIMIT without stating the default value of 25. The '25' figure is supported by the runtime error message ('Recursion limit of 25 reached without hitting a stop condition'), langgraphjs issue #1524 ('still getting limit of 25'), and other LangChain docs/issues.
  - **Correction:** Keep the claim; strengthen the citation by additionally citing the GraphRecursionError message or e.g. https://github.com/langchain-ai/langgraphjs/issues/1524 (already in the report) which explicitly shows the default of 25.
