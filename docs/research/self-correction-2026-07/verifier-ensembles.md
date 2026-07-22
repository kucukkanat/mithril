# Verifier-based and ensemble methods for making small (≤8B, in-browser) models reliable via extra test-time compute

> Research-agent report, 2026-07-22, part of the self-correction sweep (7 dimensions + adversarial fact-check). Synthesis: [../self-correction-2026-07.md](../self-correction-2026-07.md). Raw output preserved as produced; verification appendix below notes any corrections — read it before quoting numbers.

## Top takeaways

- PROVEN: search-against-a-verifier makes tiny models punch far above their weight — HuggingFace showed Llama-3.2-1B going from ~30.6% (greedy) to ~55-60% on MATH-500 with best-of-N/beam/DVTS at N=32-256, matching Llama-3.1-8B at N=32; a follow-up paper showed 0.5B>GPT-4o and 7B>o1/R1 with compute-optimal TTS — but every one of these results depends on a 7B-8B process reward model as the verifier, which cannot run in-browser.
- PROVEN: self-consistency (majority voting) is the cheapest reliable ensemble for small models (+17.9% GSM8K originally; lifts Llama-1B ~30%->45% on MATH-500 by N=64), and its cost is controllable: Early-Stopping Self-Consistency cuts sampling cost up to 80% (GSM8K) and Adaptive-Consistency up to 7.9x with <0.1% accuracy loss — this is the single most browser-viable technique.
- PROVEN NEGATIVE: intrinsic self-correction and self-verification do NOT work for small models — the generation-verification gap scales monotonically with pretraining FLOPs (Mind the Gap), LLMs degrade when self-correcting without external feedback (Huang et al., ICLR 2024), and even GPT-4 accepted only 2/100 correct graph colorings as correct (Stechly et al., ICLR 2025). Verification-generation asymmetry does NOT hold for generic small-model-judges-itself setups.
- PROVEN: the asymmetry DOES hold when the verifier is deterministic or specialized — zod schema validation, tool-execution success, and unit tests are sound verifiers at zero model cost; fine-tuned 7B judges (Prometheus 2, Qwen2.5-Math-PRM-7B) match or beat much larger LLM-as-judge baselines; Weaver showed a distilled 400M cross-encoder verifier retains 98.2% of a full weak-verifier ensemble's accuracy at 0.03% of the verification compute — a 400M-class verifier IS in-browser viable.
- PROVEN: cascades beat monoliths on cost — FrugalGPT matches GPT-4 with up to 98% cost reduction, RouteLLM (5.2k-star repo) keeps 95% of GPT-4 MT-Bench quality at 85% lower cost, and Trust-or-Escalate (ICLR 2025) gives provable human-agreement guarantees starting from a Mistral-7B judge with ~87% cost savings — the 'generate local/small, escalate to cloud on low confidence' pattern is the strongest production-grade fit for a browser-first harness.
- Tree search (ToT ~$0.74 and ~5.5k completion tokens per Game-of-24 problem, cost-equivalent to ~100-150 CoT calls; LATS 92.7% HumanEval with GPT-4) is proven on benchmarks and shipped as LangGraph/LlamaIndex add-ons, but its 10-100x token overhead and latency make it a power-user opt-in, not a harness default.
- Wall-clock reality in-browser: sampling is sequential on one WebGPU device (~15-40 tok/s for 1B q4 on typical hardware), so N-sample ensembles multiply latency by ~N; keep N<=5, use early stopping, verify with deterministic checks first, and reserve model-based verification for a cascade escalation step.
- DX template exists: DSPy's shipped BestOfN/Refine modules (reward_fn + threshold + N, feedback on retry) are the cleanest production API precedent to port into Mithril as loop middleware, with each candidate/verdict emitted as a MithrilEvent for observability.

# Verifier and ensemble methods: extra compute instead of bigger models

## 1. Test-time compute scaling: the headline results (verified)

The canonical demonstration is HuggingFace's [Scaling test-time compute blog](https://huggingfaceh4-blogpost-scaling-test-time-compute.hf.space/) (Dec 2024) with the [search-and-learn repo](https://github.com/huggingface/search-and-learn) (~1.1k stars, vLLM-based). Verified numbers, fetched from the post: **Llama-3.2-1B-Instruct on MATH-500** goes from **30.6% greedy** to ~45% with majority voting (N=64), ~52-55% with PRM-weighted best-of-N, and **~56-60% with beam search / DVTS at N=64-256**. Weighted best-of-N at **N=32 matches Llama-3.1-8B**; the same recipe pushes **3B past 70B**. Beam search was ~4x more compute-efficient than best-of-N at small budgets (its N=16 matched best-of-N's N=256). Critical caveat: the verifier was **RLHFlow/Llama3.1-8B-PRM-Deepseek-Data — an 8B PRM, 8x the policy model**. This implements DeepMind's [Scaling LLM Test-Time Compute Optimally (Snell et al., arXiv:2408.03314)](https://arxiv.org/abs/2408.03314), whose core finding is that the best strategy is **difficulty-adaptive** ("compute-optimal"): parallel best-of-N wins on easy prompts, search/revision on hard ones.

[Can 1B LLM Surpass 405B LLM? (arXiv:2502.06703)](https://arxiv.org/abs/2502.06703) ([code](https://github.com/RyanLiu112/compute-optimal-tts)) extends this: with compute-optimal TTS, **a 0.5B model outperforms GPT-4o, 3B surpasses Llama-3.1-405B, and 7B beats o1 and DeepSeek-R1 on MATH-500/AIME24** — again PRM-dependent (Qwen PRMs, 7B-72B), and results vary strongly with the policy-model/PRM pairing. Status: **PROVEN on math benchmarks, replicated across two labs; unproven for open-ended agent/tool-calling tasks, and the verifier is always the heavy component.**

[s1: Simple test-time scaling (arXiv:2501.19393)](https://arxiv.org/abs/2501.19393) is the sequential-scaling counterpart: "budget forcing" (append "Wait" to extend thinking, or force-terminate) scales a fine-tuned Qwen2.5-32B from 50% to 57% on AIME24 and beats o1-preview by up to 27% on MATH/AIME. It requires a reasoning-SFT'd model and decode-loop control — irrelevant for API providers but implementable in Mithril's Transformers.js local target, where the harness owns the generation loop.

## 2. Self-consistency: the cheap ensemble, and how to cap its cost

[Self-Consistency (Wang et al., arXiv:2203.11171)](https://arxiv.org/abs/2203.11171): sample N CoT paths, majority-vote the final answer. **+17.9% GSM8K** (56.5% to 74.4% at 40 samples), +11% SVAMP, +12.2% AQuA. PROVEN, replicated everywhere; the HF data above confirms it works for a 1B model (~+15 points by N=64) — though it plateaus well below verifier-guided search. Cost is linear in N, which two proven follow-ups fix: [Early-Stopping Self-Consistency (arXiv:2401.10480)](https://arxiv.org/abs/2401.10480) samples in small windows and stops when a window agrees — **-33.8% samples on MATH, -80.1% on GSM8K with no accuracy sacrifice**; [Adaptive-Consistency (arXiv:2305.11860)](https://arxiv.org/abs/2305.11860) uses a Dirichlet stopping rule — **up to 7.9x fewer samples, <0.1% accuracy drop across 17 datasets**. For free-form outputs where vote-counting fails, [Universal Self-Consistency (arXiv:2311.17311)](https://arxiv.org/abs/2311.17311) has the LLM pick the most consistent of N candidates — matches SC on math without answer extraction (PROVEN at Google-model scale; for a 1B judge picking among its own outputs, expect degradation per Section 4).

Harness note: majority voting needs an equivalence relation over answers. Mithril already has one for structured output — **canonical-JSON equality of zod-parsed outputs** — and for tool calls (same tool + same validated args). That makes SC implementable generically as loop middleware without any answer-extraction heuristics.

## 3. Verifiers: PRMs vs outcome checks vs weak-verifier ensembles

**PRMs** score each reasoning step; outcome verification scores the final answer only. The most instructive study is Qwen's [Lessons of Developing Process Reward Models (arXiv:2501.07301)](https://arxiv.org/abs/2501.07301) / [Qwen2.5-Math-PRM-7B](https://huggingface.co/Qwen/Qwen2.5-Math-PRM-7B): MC-estimation-labeled PRMs are noisy; their consensus-filtered 7B PRM beats all open-source PRMs on [ProcessBench](https://arxiv.org/abs/2412.06559) error identification and outperforms LLM-as-judge with much larger general models — but in their comparison **no open PRM's best-of-8 beat simple majority@8**. Translation: PRMs are excellent search guides and error localizers, mediocre at final reranking at small N; majority voting is a brutally strong baseline. PRMs are also domain-narrow (math/code) and 7B+ — **not in-browser viable**.

**Weak-verifier ensembles**: [Weaver (arXiv:2506.18203)](https://arxiv.org/abs/2506.18203) (Stanford, NeurIPS 2025) combines many imperfect reward models/judges via weak supervision: Llama-3.3-70B + verifier ensemble hits **87.7% avg (o3-mini level)**, and — most relevant here — a **distilled 400M cross-encoder retains 98.2% of that accuracy while cutting verification compute 99.97%**. A 400M-class verifier is loadable in Transformers.js; this is the existence proof that a *small, distilled, task-tuned verifier* can guide a small generator. Status: PROVEN in one strong paper, not yet widely replicated.

**Deterministic verifiers are free and sound.** Mithril's zod validation of tool args and structured output, tool-execution success/failure, and user-supplied predicates form a zero-cost outcome-verification layer — exactly the "external feedback" that the negative results below say models need.

## 4. Does verification-generation asymmetry hold for small models? Mostly no — unless the verifier is special

- [LLMs Cannot Self-Correct Reasoning Yet (Huang et al., arXiv:2310.01798, ICLR 2024)](https://arxiv.org/abs/2310.01798): intrinsic self-correction (no external feedback) fails; performance often *degrades*. PROVEN, widely replicated.
- [On the Self-Verification Limitations of LLMs (Stechly, Valmeekam, Kambhampati, arXiv:2402.08115, ICLR 2025)](https://arxiv.org/abs/2402.08115): even GPT-4 is a terrible verifier in some domains — shown 100 *optimal* graph colorings, it accepted only 2; sound external verifiers, not self-critique, produced the gains. PROVEN negative.
- [Mind the Gap (arXiv:2412.02674)](https://arxiv.org/abs/2412.02674): formalizes the **generation-verification gap and shows it scales monotonically with pretraining FLOPs** — i.e., the smaller the model, the less its self-verification is worth. This directly answers the topic question: **a 0.5B-3B model judging its own free-form output is a weak signal.**
- Counterpoint at frontier scale: [Sample, Scrutinize and Scale (arXiv:2502.01839)](https://arxiv.org/abs/2502.01839) shows Gemini-1.5-Pro self-verification at large sampling budgets exceeds o1-preview, with "implicit scaling" (more samples improve verification accuracy via cross-comparison). PROVEN for Gemini-Pro-class; **no evidence it transfers to ≤8B**.
- Counterpoint for *specialized* small verifiers: [Prometheus 2 (arXiv:2405.01535)](https://arxiv.org/abs/2405.01535) — a fine-tuned 7B/8x7B judge reaching 0.6-0.7 Pearson with GPT-4 and 72-85% pairwise human agreement; plus Qwen2.5-Math-PRM-7B beating larger general judges on ProcessBench. **Asymmetry can be bought via fine-tuning, not assumed.**

Practical rule for the harness: small models should be verified by (a) deterministic checks, (b) agreement among their own samples (self-consistency — which needs no judging capability), or (c) a *different, stronger or specialized* model. Small-model self-critique loops should be off by default and labeled experimental.

## 5. Cascades and routing: generate small, verify/escalate big

- [FrugalGPT (arXiv:2305.05176)](https://arxiv.org/abs/2305.05176): sequential cascade with a learned scoring function g(q,a); **matches GPT-4 with up to 98% cost reduction** or +4% accuracy at equal cost. PROVEN in-paper; caveat — needs a trained per-task scorer (they used DistilBERT-class), rarely reproduced end-to-end in production.
- [RouteLLM (arXiv:2406.18665)](https://arxiv.org/abs/2406.18665), [repo ~5.2k stars](https://github.com/lm-sys/RouteLLM): pre-generation routing on preference data — **85% cost reduction on MT-Bench, 45% MMLU, 35% GSM8K while keeping 95% of GPT-4 performance**; shipped as an OpenAI-compatible server. PROVEN and production-shaped, but routers are trained for a model *pair* and generalize imperfectly.
- [Trust or Escalate (arXiv:2407.18370, ICLR 2025)](https://arxiv.org/abs/2407.18370): cascaded *judging* with provable human-agreement guarantees — start with Mistral-7B, escalate only on low confidence (confidence via "Simulated Annotators" sampling); **~87% cost savings, >80% guaranteed agreement** even where GPT-4 alone struggles. This is the cleanest evidence that **small-model-first with confidence-gated escalation is safe**.

This maps one-to-one onto Mithril's three run targets: local/scripted model generates; a confidence gate (sample-agreement rate from SC, logprob margin, or deterministic-verifier failures) triggers escalation to a BYOK cloud provider. Post-generation cascade (FrugalGPT-style) needs no trained router if the gate is agreement/validation based.

## 6. Tree search: proven but expensive

[Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) ([repo](https://github.com/princeton-nlp/tree-of-thought-llm)): 74% vs 4% CoT on Game of 24 (GPT-4) — but **~5.5k completion tokens/problem, ~$0.74, cost-equivalent to ~100-150 CoT calls**. [LATS (arXiv:2310.04406, ICML 2024)](https://arxiv.org/abs/2310.04406): MCTS over agent actions with LM value function + reflections; **92.7% pass@1 HumanEval (GPT-4), 75.9 WebShop**. Both are shipped in production frameworks — [LlamaIndex's llama-index-agent-lats pack](https://docs.llamaindex.ai/en/v0.12.15/examples/agent/lats_agent/) and a LangGraph tutorial — but always as opt-in add-ons, never defaults, because rollouts multiply token cost 10-100x and serialize wall-clock (each expansion depends on parent state). For agent tasks specifically, tree search also requires **environment checkpointing/rollback**, which Mithril's suspend/resume machinery partially provides. Verdict: viable as a power-user preset with hard budget caps (num_expansions, max_rollouts — LlamaIndex exposes exactly these), not as default behavior. In-browser: not viable beyond toy depth (sequential decoding at 15-40 tok/s).

## 7. In-browser viability and overhead summary

Browser throughput (anecdotal blog numbers, consistent across sources): 0.5B-3B q4 models run **40-180 tok/s on strong WebGPU hardware**, ~15-40 tok/s typical (TinyLlama-1.1B: 25-40 on discrete NVIDIA, 15-25 on Apple M2, 8-12 on integrated Intel) — see [browser LLM guides](https://pockit.tools/blog/run-llms-browser-webgpu-transformers-js-chrome-built-in-ai-guide/). One device means samples are sequential: **N-sample ensembles cost ~N x wall-clock in-browser** (server-side they parallelize to ~1x latency, N x tokens).

Overhead multipliers (tokens, relative to single greedy run): self-consistency N=5-40x, cut 3-8x by ESC/ASC; PRM-weighted best-of-N: N generations + verifier passes (verifier is 7-8B — server-only, unless Weaver-style 400M distillation); ToT/LATS 10-150x; cascades are *negative* overhead (35-98% savings) since most queries never reach the big model; budget forcing ~1.5-3x on one sequential generation.

## 8. Mapping onto Mithril

The best shipped DX precedent is [DSPy's BestOfN and Refine](https://dspy.ai/tutorials/output_refinement/best-of-n-and-refine/): wrap any module with `(N, reward_fn, threshold)`; return first candidate over threshold else best-scoring; Refine feeds failure feedback into the retry. Port as loop middleware: `bestOfN(agent, { n, reward, threshold, earlyStop })` where `reward` defaults to a deterministic stack (zod-parse success, tool-execution success, then optional sample-agreement). Emit each candidate, score, verdict, and escalation as MithrilEvents so devtools show *why* an answer won — that is the "clear errors" story. Recommended defaults: SC with ESC-style early stopping (window 2-3, cap 5) for structured output on local models; confidence-gated cascade to the live target; tree search and small-model self-critique behind explicit opt-in flags.

## Sources

| Title | Type | Year | URL |
|---|---|---|---|
| Scaling test-time compute with open models (HuggingFace H4 blog) | blog | 2024 | https://huggingfaceh4-blogpost-scaling-test-time-compute.hf.space/ |
| huggingface/search-and-learn (best-of-N, beam search, DVTS recipes) | repo | 2024 | https://github.com/huggingface/search-and-learn |
| Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters (Snell et al., arXiv:2408.03314) | paper | 2024 | https://arxiv.org/abs/2408.03314 |
| Can 1B LLM Surpass 405B LLM? Rethinking Compute-Optimal Test-Time Scaling (arXiv:2502.06703) | paper | 2025 | https://arxiv.org/abs/2502.06703 |
| s1: Simple test-time scaling (arXiv:2501.19393) | paper | 2025 | https://arxiv.org/abs/2501.19393 |
| Self-Consistency Improves Chain of Thought Reasoning in Language Models (Wang et al., arXiv:2203.11171) | paper | 2022 | https://arxiv.org/abs/2203.11171 |
| Escape Sky-high Cost: Early-stopping Self-Consistency (arXiv:2401.10480) | paper | 2024 | https://arxiv.org/abs/2401.10480 |
| Let's Sample Step by Step: Adaptive-Consistency (arXiv:2305.11860) | paper | 2023 | https://arxiv.org/abs/2305.11860 |
| Universal Self-Consistency for Large Language Model Generation (arXiv:2311.17311) | paper | 2023 | https://arxiv.org/abs/2311.17311 |
| The Lessons of Developing Process Reward Models in Mathematical Reasoning (Qwen, arXiv:2501.07301) | paper | 2025 | https://arxiv.org/abs/2501.07301 |
| Qwen2.5-Math-PRM-7B model card | benchmark | 2025 | https://huggingface.co/Qwen/Qwen2.5-Math-PRM-7B |
| Shrinking the Generation-Verification Gap with Weak Verifiers (Weaver, arXiv:2506.18203) | paper | 2025 | https://arxiv.org/abs/2506.18203 |
| Large Language Models Cannot Self-Correct Reasoning Yet (arXiv:2310.01798) | paper | 2023 | https://arxiv.org/abs/2310.01798 |
| On the Self-Verification Limitations of LLMs on Reasoning and Planning Tasks (arXiv:2402.08115) | paper | 2024 | https://arxiv.org/abs/2402.08115 |
| Mind the Gap: Examining the Self-Improvement Capabilities of LLMs (arXiv:2412.02674) | paper | 2024 | https://arxiv.org/abs/2412.02674 |
| Sample, Scrutinize and Scale: Effective Inference-Time Search by Scaling Verification (arXiv:2502.01839) | paper | 2025 | https://arxiv.org/abs/2502.01839 |
| Prometheus 2: An Open Source Language Model Specialized in Evaluating Other Language Models (arXiv:2405.01535) | paper | 2024 | https://arxiv.org/abs/2405.01535 |
| FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance (arXiv:2305.05176) | paper | 2023 | https://arxiv.org/abs/2305.05176 |
| lm-sys/RouteLLM (router framework, ~5.2k stars) | repo | 2024 | https://github.com/lm-sys/RouteLLM |
| Trust or Escalate: LLM Judges with Provable Guarantees for Human Agreement (arXiv:2407.18370) | paper | 2024 | https://arxiv.org/abs/2407.18370 |
| Tree of Thoughts: Deliberate Problem Solving with LLMs (arXiv:2305.10601) | paper | 2023 | https://arxiv.org/abs/2305.10601 |
| Language Agent Tree Search (LATS, arXiv:2310.04406) | paper | 2023 | https://arxiv.org/abs/2310.04406 |
| LlamaIndex LATS agent pack docs | docs | 2024 | https://docs.llamaindex.ai/en/v0.12.15/examples/agent/lats_agent/ |
| DSPy Output Refinement: BestOfN and Refine | docs | 2025 | https://dspy.ai/tutorials/output_refinement/best-of-n-and-refine/ |
| Running LLMs in the Browser: WebGPU, Transformers.js guide (throughput numbers) | blog | 2026 | https://pockit.tools/blog/run-llms-browser-webgpu-transformers-js-chrome-built-in-ai-guide/ |

## Verification appendix

Fact-check verdict: **major-issues**

Checked claims:

- **[confirmed]** HF blog (huggingfaceh4-blogpost-scaling-test-time-compute.hf.space): Llama-3.2-1B-Instruct on MATH-500 improves from ~30.6% greedy (Meta's reported figure) to ~45-46% with majority voting at N=64; a 3B model surpasses Llama-3.1-70B-Instruct; the verifier is RLHFlow/Llama3.1-8B-PRM-Deepseek-Data (an 8B PRM)
- **[wrong]** HF blog: 'Weighted best-of-N at N=32 matches Llama-3.1-8B' and 'beam search was ~4x more compute-efficient (its N=16 matched best-of-N's N=256)'
- **[confirmed]** arXiv:2502.06703 (Can 1B LLM Surpass 405B LLM?): with compute-optimal TTS, a 0.5B model outperforms GPT-4o, a 3B model surpasses Llama-3.1-405B, and a 7B model beats o1 and DeepSeek-R1 on MATH-500 and AIME24; results highly dependent on policy-model/PRM pairing
- **[confirmed]** Self-Consistency (arXiv:2203.11171): +17.9% absolute on GSM8K, +11.0% SVAMP, +12.2% AQuA over CoT
- **[confirmed]** Weaver (arXiv:2506.18203, Stanford, NeurIPS 2025): Llama-3.3-70B + weak-verifier ensemble reaches 87.7% average (o3-mini-level, vs o3-mini's 86.7%); a distilled 400M cross-encoder retains ~98% of accuracy while reducing verification compute by up to 99.97%
- **[confirmed]** RouteLLM (arXiv:2406.18665, github.com/lm-sys/RouteLLM): cost reductions of over 85% on MT-Bench, 45% on MMLU, 35% on GSM8K while achieving 95% of GPT-4's performance; repo has ~5.2k stars and ships an OpenAI-compatible server
- **[wrong]** arXiv:2402.08115 (Stechly, Valmeekam, Kambhampati): GPT-4 shown 100 optimal graph colorings accepted only 2; sound external verifiers, not self-critique, produced the gains; published at ICLR 2025
- **[wrong]** Qwen PRM paper (arXiv:2501.07301): 'in their comparison no open PRM's best-of-8 beat simple majority@8'
- **[confirmed]** Tree of Thoughts (arXiv:2305.10601): 74% success on Game of 24 vs 4% for GPT-4 CoT; LATS (arXiv:2310.04406): 92.7% pass@1 on HumanEval with GPT-4 and average score 75.9 on WebShop
- **[wrong]** pockit.tools browser-LLM guide reports TinyLlama-1.1B at 25-40 tok/s on discrete NVIDIA, 15-25 on Apple M2, 8-12 on integrated Intel, and 0.5B-3B q4 models at 40-180 tok/s on strong WebGPU hardware
- **[confirmed]** Early-Stopping Self-Consistency (arXiv:2401.10480): reduces samples by 33.8% on MATH and 80.1% on GSM8K with comparable accuracy
- **[confirmed]** s1 (arXiv:2501.19393): budget forcing extrapolates s1-32B from 50% to 57% on AIME24, and s1-32B exceeds o1-preview by up to 27% on competition math (MATH and AIME24)

Corrections:

- **Claim:** Weighted best-of-N at N=32 matches Llama-3.1-8B
  - **Problem:** The HF blog attributes the N=32 match to a different method. Its exact sentence is: 'beam search matches the performance of Llama 3.1 8B with just N=32 solutions per problem.' Weighted best-of-N is not credited with matching the 8B model at N=32.
  - **Correction:** Replace with: 'Beam search (PRM-guided) at N=32 matches Llama-3.1-8B.' The 3B-surpasses-70B claim is correct as stated.
- **Claim:** Beam search was ~4x more compute-efficient than best-of-N at small budgets (its N=16 matched best-of-N's N=256)
  - **Problem:** The blog's 4x claim uses different N values: 'with a test-time budget of N=4, beam search achieves the same accuracy as Best-of-N for N=16, i.e. it is 4x more compute efficient!' The N=16-vs-N=256 pairing (which would be 16x) does not appear in the source.
  - **Correction:** Replace the parenthetical with: 'beam search at N=4 matched best-of-N at N=16 — 4x more compute-efficient.' Also note the ~52-55% and ~56-60% accuracy figures for weighted BoN and beam/DVTS are chart readings, not numbers stated in the blog text.
- **Claim:** arXiv:2402.08115: shown 100 optimal graph colorings, GPT-4 accepted only 2
  - **Problem:** That statistic is from the same group's earlier paper, arXiv:2310.12397 ('GPT-4 Doesn't Know It's Wrong'), which states: 'Out of 100 optimal colorings, it only agreed that 2 were correct.' The cited paper 2402.08115 reports a different figure for graph coloring verification: false negative rate 95.8% (113/118 correct colorings rejected, i.e., only 5 accepted) in its Table 2.
  - **Correction:** Either cite arXiv:2310.12397 for the 2-of-100 statistic, or restate for 2402.08115 as: 'GPT-4 rejected 95.8% of correct colorings (113/118) as a verifier.' The rest of the claim is accurate: 2402.08115 is published at ICLR 2025 (poster, OpenReview id 4O0v4s3IzY) and concludes 'significant performance collapse with self-critique and significant performance gains with sound external verification.'
- **Claim:** In their comparison no open PRM's best-of-8 beat simple majority@8 (arXiv:2501.07301)
  - **Problem:** The paper's 'none of the PRMs achieved prm@8 scores superior to maj@8' finding applies to its preliminary MC-estimation-trained PRMs and a PRM800K-trained baseline (Table 1) — not to all open PRMs. The paper's released, open Qwen2.5-Math-PRM-7B explicitly 'outperforms maj@8 across all 7 tasks, achieving an average improvement of 1.4%' with a 7B policy model. (It is, however, inferior to maj@8 when supervising a 72B policy model.)
  - **Correction:** Restate as: 'Naive MC-estimation-trained PRMs (and a PRM800K baseline) failed to beat maj@8 at best-of-8; Qwen's consensus-filtered Qwen2.5-Math-PRM-7B does beat maj@8 on all 7 tasks, but only by +1.4% average, and it falls below maj@8 when reranking a 72B policy's outputs.' The softened takeaway — majority voting remains a very strong baseline that even good PRMs beat only modestly at small N — survives, but the sentence as written contradicts the paper.
- **Claim:** pockit.tools guide: TinyLlama-1.1B runs 25-40 tok/s on discrete NVIDIA, 15-25 on Apple M2, 8-12 on integrated Intel; 0.5B-3B q4 models run 40-180 tok/s on strong WebGPU hardware
  - **Problem:** The URL resolves, but the page contains no TinyLlama benchmarks and no 180 tok/s figure. Its actual numbers are: Qwen2.5-0.5B 85 tok/s (RTX 4070) / 45 (M3 MacBook), Llama-3.2-1B 52/28, Qwen2.5-1.5B 42/22; it also states interactive use needs >20 tok/s, limiting mainstream hardware to models of 2B parameters or less.
  - **Correction:** Replace the TinyLlama figures with the source's actual numbers (Qwen2.5-0.5B: 85 tok/s on RTX 4070, 45 on M3; Llama-3.2-1B: 52/28; Qwen2.5-1.5B: 42/22) or find and cite a source that actually benchmarks TinyLlama. Cap the 'strong hardware' upper bound at ~85 tok/s per this source, not 180.
- **Claim:** Weaver's distilled 400M cross-encoder retains 98.2% of that accuracy
  - **Problem:** Minor imprecision: the abstract's headline figure is 98.7% ('retains 98.7% of Weaver's full accuracy while reducing verification compute by up to 99.97%'); 98.2% is a per-task figure that appears in Section 6.
  - **Correction:** Use 98.7% when citing the headline abstract claim, or attribute 98.2% explicitly to the per-task breakdown. The 99.97% compute reduction, 87.7% average, o3-mini comparison, Stanford affiliation, and NeurIPS 2025 acceptance all check out.
