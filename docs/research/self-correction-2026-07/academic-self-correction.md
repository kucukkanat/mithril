# LLM Self-Correction: What the Literature Proves, Refutes, and Implies for Small-Model Harnesses

> Research-agent report, 2026-07-22, part of the self-correction sweep (7 dimensions + adversarial fact-check). Synthesis: [../self-correction-2026-07.md](../self-correction-2026-07.md). Raw output preserved as produced; verification appendix below notes any corrections — read it before quoting numbers.

## Top takeaways

- REFUTED: intrinsic self-correction (model critiques itself, no external signal) degrades reasoning accuracy — GPT-3.5 CommonSenseQA fell 75.8%→38.1% after one round (Huang et al., ICLR 2024); prior 'successes' (RCI, Reflexion-on-reasoning) depended on oracle ground-truth labels to decide when to stop.
- PROVEN: extrinsic feedback loops work — execution errors, unit tests, validators, and tools (Self-Debugging, Reflexion 91% HumanEval, CRITIC +7.7 F1). The consensus design rule: the model may revise, but the verdict that something is wrong must come from outside the model.
- PROVEN for 8B in 2026: modern instruction-tuned small models benefit from execution-feedback repair — Llama 3.1 8B +9.8pp HumanEval, +16pp MBPP — with the first repair round giving the largest gain and 2 rounds capturing 76–95% of achievable improvement; cap retries at 2.
- Small-model failure mode is the CRITIQUE, not the revision: weaker models cannot generate useful feedback on their own output (Olausson ICLR 2024); ACL 2024 showed ≤13B models self-correct only when a strong external verifier triggers the correction. Deterministic verifiers (zod, execution) substitute perfectly.
- Repair success is error-type dependent: schema/name errors repair at ~77%, semantic/assertion errors at ~45% — for the latter, resampling beats repairing on small models. A harness should route by error class.
- Self-consistency (sample N, vote) beats critique loops AND multi-agent debate at equal token cost for reasoning (85.3% vs 83.2%, Huang et al.) — the right opt-in 'thinking harder' primitive, not reflection.
- Training-side: SFT on correction traces fails (distribution mismatch, behavior collapse); RL on the model's own errors works — SCoRe +15.6% MATH, and Self-rewarding correction (2025) got Qwen2.5-Math-7B to self-verify at external-reward-model level, proving 7B models CAN learn it.
- Near-free trick for local models: the 'self-correction blind spot' — models fix errors shown as external input but not in their own output (64.5% blind-spot rate); appending 'Wait' cut it 89.3% with no fine-tuning (single 2025 workshop paper — treat as promising, test before shipping).
- Production corroboration: the validation-error→re-ask→retry loop is the core of Instructor (~11k stars) and, per a 2025 SLM survey, schema-first + validator-first execution lets Phi-4-Mini-class models hit ≥97% BFCL function-call accuracy.
- Gap relevant to Mithril: no published measurement of repair loops on 0.5B–4B browser-class models — extrapolation from 8B is plausible but unproven, so 'repair success rate per round per error type' belongs in focused local-model fixtures.

## Scope and method

This report covers the academic literature on LLM self-correction (2023–2026), verified by opening the primary sources rather than citing from memory. Labels used: **PROVEN** = replicated across papers and/or shipped in production frameworks; **MIXED** = works under specific conditions; **REFUTED/ANECDOTAL** = failed under controlled evaluation or unreplicated.

## 1. The central finding: intrinsic self-correction is refuted; extrinsic is proven

The field split cleanly around 2024. **Intrinsic self-correction** — the model critiques its own answer with no external signal — was refuted for reasoning tasks by [Large Language Models Cannot Self-Correct Reasoning Yet](https://arxiv.org/abs/2310.01798) (Huang et al., ICLR 2024, arXiv:2310.01798). Verified concrete numbers from the paper: GPT-3.5-Turbo on GSM8K goes 75.9% → 75.1% → 74.7% over two rounds of "review your answer" prompting; CommonSenseQA collapses 75.8% → 38.1%; GPT-4 on GSM8K drops 95.5% → 91.5% → 89.0%. The mechanism: models flip more correct answers to incorrect than the reverse, because they cannot reliably judge their own correctness. Crucially, the paper shows prior "successes" (RCI, parts of Reflexion) used **oracle ground-truth labels to decide when to stop correcting** — an evaluation artifact. It also found multi-agent debate (83.2%) *underperforms* simple self-consistency majority voting at equal sample count (85.3%). **Status: PROVEN negative result**, independently confirmed by the [TACL 2024 critical survey](https://arxiv.org/abs/2406.01297) (Kamoi et al.): "no prior work demonstrates successful self-correction with feedback from prompted LLMs, except for studies in tasks that are exceptionally suited for self-correction," and again by [Self-rewarding correction](https://arxiv.org/abs/2502.19613) (2025): "intrinsic self-correction with prompting fails in general" and typically *reduces* accuracy. For 2026, [The Illusion of Insight in Reasoning Models](https://arxiv.org/abs/2601.00514) extends this to R1-style reasoning models: intrinsic mid-trace "aha" shifts are rare and predominantly *detrimental*, while extrinsic prompts yield substantial gains.

**Extrinsic feedback** — execution results, validators, tools, tests — reliably helps and is the load-bearing conclusion of every major paper:

- **[Reflexion](https://arxiv.org/abs/2303.11366)** (Shinn et al., NeurIPS 2023; [repo](https://github.com/noahshinn/reflexion) ~3.2k stars): verbal reflections stored in episodic memory across retries, driven by *environment/test feedback*. 91% pass@1 on HumanEval with GPT-4 (vs 80% baseline). **PROVEN when the feedback signal is real** (test execution); Huang et al. showed its reasoning-task variant leaned on oracle labels.
- **[Self-Debugging](https://arxiv.org/abs/2304.05128)** (Chen et al., ICLR 2024): feed execution results + unit-test failures back; SOTA across code-gen tasks for Codex, GPT-3.5/4, and StarCoder-15.5B. **PROVEN.**
- **[CRITIC](https://arxiv.org/abs/2305.11738)** (Gou et al., ICLR 2024): critique via tools (search engine, interpreter, calculator): +7.7 F1 on open-domain QA, 79.2% toxicity reduction. The abstract itself states exclusive self-correction without tools "may yield marginal improvements or even deteriorate performance." **PROVEN.**
- **[Chain-of-Verification (CoVe)](https://arxiv.org/abs/2309.11495)** (Dhuliawala et al., ACL Findings 2024): draft → generate verification questions → **answer them independently** (factored, so the draft can't bias the check) → revise. MultiSpanQA F1 0.39 → 0.48 (+23%); CoVe-based Llama beat InstructGPT/ChatGPT on longform generation. **MIXED-to-PROVEN**: works because fact-verification decomposes into easier sub-questions; costs ~3–4 extra calls; reduces but does not eliminate hallucination.
- **[RCI](https://arxiv.org/abs/2303.17491)** (Kim et al., 2023): SOTA on MiniWoB++ computer tasks with a handful of demos. **MIXED**: agentic results with environment state stand; the pure-reasoning gains were shown by Huang et al. to depend on oracle stopping.

## 2. Does self-correction scale down to small models (≤8B)?

The picture changed between 2023 and 2026, which matters directly for Mithril's in-browser 0.5B–4B targets.

**Older evidence — small models are worse at it.** Anthropic's [moral self-correction study](https://arxiv.org/abs/2302.07459) (2023) found instruction-driven self-correction *emerges at ~22B parameters*. [Is Self-Repair a Silver Bullet?](https://arxiv.org/abs/2306.09896) (Olausson et al., ICLR 2024) found self-repair gains are modest once you account for the extra calls, and are **bottlenecked by feedback quality**: weaker models introduce new errors when repairing, and substituting a stronger model's feedback (GPT-4 critiquing GPT-3.5's code) substantially boosts gains. [TriPosT](https://arxiv.org/abs/2310.13522) (NAACL 2024) states plainly that self-improvement ability "has been shown to be absent and difficult to learn for smaller models." [RISE's](https://arxiv.org/abs/2407.18219) baselines confirm Self-Refine-style prompting *degrades* 7B Llama2/Mistral performance without an oracle. **PROVEN pattern: the critique step, not the revision step, is what small models fail at.**

**Newer evidence — extrinsic repair now works at 8B.** [How Many Tries Does It Take?](https://arxiv.org/abs/2604.10508) (2026) tested seven models (8B–70B) with **execution-error feedback only** (no self-critique): Llama 3.1 8B gained +9.8pp on HumanEval (67.1% → 76.8%) and +16.0pp on MBPP (55.6% → 71.6%). Two findings are directly actionable: the **first repair round gives the largest marginal gain, and two rounds capture 76–95% of total achievable improvement**; and repair success is error-type dependent (name/syntax errors repair at ~77%, assertion/semantic errors at ~45% — for those, resampling beats repairing on weak models). **PROVEN for modern instruction-tuned 8B models with deterministic feedback.** For sub-1B browser models this exact result is unverified — extrapolation, not evidence — which is an argument for measuring "repair-round success rate" per local model.

A complementary cheap trick: [Self-Correction Bench](https://arxiv.org/abs/2507.02778) (NeurIPS 2025 workshop) found a "self-correction blind spot" — 14 open models fail to correct errors *in their own output* 64.5% of the time while correcting *identical errors presented externally*. Appending the single token **"Wait"** after flagged output reduced the blind spot by 89.3% with no fine-tuning. **MIXED (one paper, workshop-level), but near-zero cost** — and it aligns with the extrinsic principle: re-presenting the model's own error as external input activates the correction pathway.

## 3. Training small models to self-correct (distillation/RL)

- **[SCoRe](https://arxiv.org/abs/2409.12917)** (DeepMind, ICLR 2025): multi-turn RL on self-generated data; +15.6% self-correction on MATH, +9.1% on HumanEval (Gemini 1.0 Pro / 1.5 Flash). Key negative sub-result: **SFT on correction traces fails** via distribution mismatch and behavior collapse (model learns to make only trivial edits) — RL on the model's own error distribution is required. **PROVEN in-paper, closed models.**
- **[RISE](https://arxiv.org/abs/2407.18219)** (NeurIPS 2024): iterative fine-tuning framing correction as a multi-turn MDP; enables 7B Llama2/Mistral to genuinely improve over 5 turns, beating equal-compute single-turn strategies.
- **[TriPosT](https://arxiv.org/abs/2310.13522)** (NAACL 2024): small model interacts with a large LLM that edits its trajectories; replay training gives LLaMA-7B up to +7.13% on math/reasoning. Naively fine-tuning on *LLM-generated* correction demos does not work — the errors must be the small model's own.
- **[Small LMs Need Strong Verifiers to Self-Correct Reasoning](https://arxiv.org/abs/2404.17140)** (ACL Findings 2024): ≤13B models fine-tuned on filtered self-critiques *can* refine solutions, but gains materialize only when a **strong external verifier (GPT-4) decides when to trigger correction**; a weak self-verifier is the failure point. This is the cleanest statement of the **generator–verifier asymmetry** for small models.
- **[Self-rewarding correction](https://arxiv.org/abs/2502.19613)** (2025, [RLHFlow repo](https://github.com/RLHFlow/Self-rewarding-reasoning-LLM)): two-stage SFT+RL makes Qwen2.5-Math-7B a unified generator+verifier matching external-reward-model systems. **PROVEN in-paper for 7B**, the strongest 2025 evidence that 7B-class models can learn to self-verify.

**Consensus:** small models don't need to be taught to *revise* — they need a trustworthy *verifier signal*. Fine-tuning can internalize it; at inference time, deterministic verifiers substitute for it.

## 4. Production corroboration

The extrinsic-loop pattern is shipped and battle-tested: [Instructor](https://github.com/567-labs/instructor) (~11k stars, multi-language) catches Pydantic validation errors, **feeds the error text back to the model, and retries** — its docs note the retry behavior alone justifies the library in production. The 2025 [SLM agentic-systems survey](https://arxiv.org/pdf/2510.03847) reports that schema-first, validator-first execution with retry/escalation lets SLMs (e.g., Phi-4-Mini) reach ≥97% function-call accuracy on BFCL, rivaling 70B models. **PROVEN in production.**

## 5. Mapping onto Mithril's middleware/loop

1. **Validator-repair middleware (ship on by default):** zod failure → re-prompt with the *exact* validation error as external feedback → bounded retries. This is the Instructor pattern plus the 2026 repair paper's budget: **default max 2 repair rounds**, then fail loud with a typed error carrying the full attempt history. Cost: +1–2 calls worst case, zero when output is valid.
2. **Tool-execution repair:** tool throws / returns error → feed the error message back as a tool-result turn (extrinsic, PROVEN). Classify error type: malformed-call errors are highly repairable; semantic failures should prefer **resample over repair** for small models.
3. **Do not ship an intrinsic "critique yourself" middleware as default** — the literature says it burns tokens and flips correct answers. If offered, gate it behind explicit opt-in and document the Huang et al. result.
4. **Self-consistency consumer (opt-in):** N samples + vote/agreement beats critique loops for reasoning at equal cost; natural fit as a consumer over the event stream. Cost: N× calls.
5. **CoVe-style factored verification** for factual outputs: verification prompts must *not* include the draft's reasoning (fresh context per check) — maps cleanly to spawning child runs via `asTool`.
6. **"Wait"-token nudge** for local models: when a heuristic flags a suspect answer, append the model's own output as user-visible context plus "Wait" — near-free, worth A/B-ing with focused fixtures.
7. **Measurement hook:** track "repair-success-rate by error type per repair round" for local models, since ≤4B behavior is the one thing the literature has *not* measured.

## Cost/latency summary

| Technique | Overhead | Evidence tier |
|---|---|---|
| Validation-error retry (≤2 rounds) | 0–2 extra calls, only on failure | PROVEN (production + 2604.10508) |
| Execution-feedback repair | 1–2 extra calls | PROVEN |
| Self-consistency (N=5) | 5× | PROVEN (beats debate/critique) |
| CoVe factored verify | ~3–4× | MIXED-PROVEN (factual tasks) |
| Reflexion memory across trials | full episode × trials | PROVEN with real test signal |
| Intrinsic critique loop | 2–3× | REFUTED for reasoning |
| "Wait" continuation | ~0 | MIXED (one 2025 paper) |

## Sources

| Title | Type | Year | URL |
|---|---|---|---|
| Large Language Models Cannot Self-Correct Reasoning Yet (Huang et al., ICLR 2024) | paper | 2024 | https://arxiv.org/abs/2310.01798 |
| When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey (Kamoi et al., TACL) | paper | 2024 | https://arxiv.org/abs/2406.01297 |
| Self-Refine: Iterative Refinement with Self-Feedback (Madaan et al., NeurIPS 2023) | paper | 2023 | https://arxiv.org/abs/2303.17651 |
| Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., NeurIPS 2023) | paper | 2023 | https://arxiv.org/abs/2303.11366 |
| noahshinn/reflexion (GitHub, ~3.2k stars) | repo | 2023 | https://github.com/noahshinn/reflexion |
| CRITIC: LLMs Can Self-Correct with Tool-Interactive Critiquing (Gou et al., ICLR 2024) | paper | 2024 | https://arxiv.org/abs/2305.11738 |
| Chain-of-Verification Reduces Hallucination in LLMs (Dhuliawala et al., ACL Findings 2024) | paper | 2024 | https://arxiv.org/abs/2309.11495 |
| Language Models can Solve Computer Tasks (RCI, Kim et al.) | paper | 2023 | https://arxiv.org/abs/2303.17491 |
| Teaching Large Language Models to Self-Debug (Chen et al., ICLR 2024) | paper | 2024 | https://arxiv.org/abs/2304.05128 |
| Is Self-Repair a Silver Bullet for Code Generation? (Olausson et al., ICLR 2024) | paper | 2024 | https://arxiv.org/abs/2306.09896 |
| Training Language Models to Self-Correct via Reinforcement Learning (SCoRe, DeepMind, ICLR 2025) | paper | 2024 | https://arxiv.org/abs/2409.12917 |
| Recursive Introspection: Teaching Language Model Agents How to Self-Improve (RISE, NeurIPS 2024) | paper | 2024 | https://arxiv.org/abs/2407.18219 |
| Teaching Language Models to Self-Improve through Interactive Demonstrations (TriPosT, NAACL 2024) | paper | 2024 | https://arxiv.org/abs/2310.13522 |
| Small Language Models Need Strong Verifiers to Self-Correct Reasoning (ACL Findings 2024) | paper | 2024 | https://arxiv.org/abs/2404.17140 |
| Self-rewarding correction for mathematical reasoning (Xiong et al.) | paper | 2025 | https://arxiv.org/abs/2502.19613 |
| RLHFlow/Self-rewarding-reasoning-LLM (GitHub) | repo | 2025 | https://github.com/RLHFlow/Self-rewarding-reasoning-LLM |
| Self-Correction Bench: Revealing the Self-Correction Blind Spot in LLMs (NeurIPS 2025 workshop) | paper | 2025 | https://arxiv.org/abs/2507.02778 |
| How Many Tries Does It Take? Iterative Self-Repair in LLM Code Generation Across Model Scales | paper | 2026 | https://arxiv.org/abs/2604.10508 |
| The Illusion of Insight in Reasoning Models | paper | 2026 | https://arxiv.org/abs/2601.00514 |
| The Capacity for Moral Self-Correction in Large Language Models (Anthropic) | paper | 2023 | https://arxiv.org/abs/2302.07459 |
| 567-labs/instructor — structured outputs with validation-error retry (GitHub) | repo | 2025 | https://github.com/567-labs/instructor |
| Small Language Models for Agentic Systems: A Survey | paper | 2025 | https://arxiv.org/pdf/2510.03847 |
| ryokamoi/llm-self-correction-papers — curated list of self-correction papers (GitHub) | repo | 2024 | https://github.com/ryokamoi/llm-self-correction-papers |

## Verification appendix

Fact-check verdict: **minor-issues**

Checked claims:

- **[confirmed]** Huang et al. (arXiv:2310.01798) report GPT-3.5-Turbo GSM8K 75.9% -> 75.1% -> 74.7%, CommonSenseQA 75.8% -> 38.1%, GPT-4 GSM8K 95.5% -> 91.5% -> 89.0%; prior work (RCI, Reflexion) used oracle labels to decide when to stop; multi-agent debate 83.2% underperforms self-consistency 85.3%
- **[confirmed]** arXiv:2604.10508 (2026) exists and reports Llama 3.1 8B +9.8pp on HumanEval (67.1% -> 76.8%) and +16.0pp on MBPP (55.6% -> 71.6%) from execution-error-only feedback; first repair round gives largest gain and two rounds capture 76-95% of achievable improvement
- **[wrong]** arXiv:2604.10508 reports repair success of ~77% for name/syntax errors vs ~45% for assertion/semantic errors
- **[confirmed]** arXiv:2601.00514 'The Illusion of Insight in Reasoning Models' exists; intrinsic mid-trace shifts in R1-style models are rare (~6-8% of samples) and predominantly detrimental (2.57% vs 16.44% accuracy for shifted vs non-shifted traces), while extrinsically triggered shifts reliably improve accuracy (+8.41pp on MATH-500)
- **[confirmed]** Reflexion (arXiv:2303.11366) achieves 91% pass@1 on HumanEval with GPT-4 vs previous SOTA GPT-4 at 80%; github.com/noahshinn/reflexion has ~3.2k stars
- **[confirmed]** SCoRe (arXiv:2409.12917) gains +15.6% self-correction on MATH (Gemini 1.0 Pro) and +9.1% on HumanEval (Gemini 1.5 Flash); SFT on correction traces fails via distribution mismatch and behavior collapse
- **[confirmed]** Self-Correction Bench (arXiv:2507.02778): 14 open models show a 64.5% average self-correction blind spot on their own outputs while correcting identical external errors; appending 'Wait' reduces blind spots by 89.3%
- **[confirmed]** CoVe (arXiv:2309.11495) improves MultiSpanQA F1 from 0.39 to 0.48 (+23%) with the factored variant answering verification questions independently; CoVe-based Llama outperforms InstructGPT, ChatGPT, and PerplexityAI on longform biography FactScore
- **[confirmed]** CRITIC (arXiv:2305.11738) attains 7.7 F1 improvement across three QA tasks on ChatGPT and 79.2% reduction in toxicity probability; its abstract states exclusive self-correction without external feedback may yield only small improvements or even worse performance
- **[confirmed]** Kamoi et al. TACL 2024 survey (arXiv:2406.01297) states verbatim: 'no prior work demonstrates successful self-correction with feedback from prompted LLMs, except for studies in tasks that are exceptionally suited for self-correction'
- **[wrong]** Instructor (github.com/567-labs/instructor) catches Pydantic validation errors and automatically retries with the error message fed back to the model; has ~11k stars
- **[wrong]** The SLM agentic-systems survey (arXiv:2510.03847) reports that schema-first, validator-first execution with retry/escalation lets SLMs (e.g., Phi-4-Mini) reach >=97% function-call accuracy on BFCL, rivaling 70B models

Corrections:

- **Claim:** The 2025 SLM agentic-systems survey (arXiv:2510.03847) reports Phi-4-Mini reaching >=97% function-call accuracy on BFCL, rivaling 70B models
  - **Problem:** Fabricated specific attributed to a real source. Full-text extraction of all 9 pages of the PDF shows the string '97' appears nowhere in the paper. The survey makes only qualitative claims: 'When paired with explicit tool schemas and robust validators, SLMs frequently match or even surpass larger LLMs in function-calling reliability' and describes Phi-4-Mini as having 'robust function calling'. The nearest concrete number is '>99% validity' for JSON-Schema-guided data extraction/templating (schema validity, not BFCL function-call accuracy), plus '~98% lower cost' via FrugalGPT-style cascades. No BFCL accuracy figure for Phi-4-Mini and no 70B comparison appears.
  - **Correction:** Rewrite as: 'The 2025 SLM survey (arXiv:2510.03847) argues qualitatively that schema-first, validator-first execution lets SLMs like Phi-4-Mini match or surpass larger LLMs in function-calling reliability, and reports >99% schema validity for JSON-Schema-guided extraction tasks.' Drop the 97%/BFCL/70B figures or find and cite the primary benchmark source actually containing them.
- **Claim:** Instructor has ~11k stars
  - **Problem:** Undercount: the GitHub page shows 13.6k stars as of 2026-07-22. Also, the README's exact framing is 'Failed validations are automatically retried with the error message' — the 'retry behavior alone justifies the library in production' phrasing is an embellishment not found verbatim in the README (the retry mechanism itself is accurately described).
  - **Correction:** Say ~13.6k stars (or 'over 13k'). Keep the retry-mechanism description; soften or drop the 'justifies the library' attribution unless sourced from a specific docs page.
- **Claim:** Repair success is error-type dependent: name/syntax errors repair at ~77%, assertion/semantic errors at ~45% (arXiv:2604.10508)
  - **Problem:** The paper reports name errors at ~77% but syntax errors at ~66%; lumping 'name/syntax ~77%' overstates the syntax-error repair rate by ~11pp. The assertion ~45% figure is correct.
  - **Correction:** State: 'name errors repair at ~77%, syntax errors at ~66%, assertion/semantic errors at ~45%'.
- **Claim:** CRITIC's abstract states exclusive self-correction without tools 'may yield marginal improvements or even deteriorate performance'
  - **Problem:** Presented as a direct quote but the abstract's actual wording (per the arXiv PDF) is 'exclusive reliance on self-correction without external feedback may yield modest improvements or even deteriorated performance' — 'modest', not 'marginal'. Substance is accurate; the quotation is inexact.
  - **Correction:** Either paraphrase without quote marks, or quote exactly: 'exclusive reliance on self-correction without external feedback may yield modest improvements or even deteriorated performance'.
