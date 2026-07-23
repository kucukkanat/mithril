# TypeScript AI Agent Harness — Market Map (July 2026)

> Produced 2026-07-20 by a 13-agent research sweep (frameworks, tooling, DX exemplars, pain points, browser/cross-runtime constraints) followed by an adversarial fact-check of the 12 load-bearing claims. Corrections from the fact-check are applied in place; see the Verification status appendix.

## The market in one picture

The TS agent space has stratified into three layers, and the money/mindshare sits at different layers than the open gaps:

1. **Model abstraction** — won. Vercel AI SDK (~17.7M weekly downloads) is the assumed base layer, the way React once was. Mastra and VoltAgent build *on* it. You will not displace it; you must compose with it (or match its provider spec shape).
2. **Agent orchestration** — contested. Mastra leads on DX and adoption (~1.23M weekly), LangGraph leads on durability depth, OpenAI Agents leads on minimalism, Claude Agent SDK leads on out-of-box capability. Every one of them has a structural weakness a newcomer can attack.
3. **The harness layer above** — open. Durable loops without platform lock-in, context engineering, trajectory replay, local-first observability, and runtime portability are all acknowledged gaps that teams currently build themselves. Multiple production teams report building sandboxing, persistence, replay, and approval UIs by hand on top of AI SDK or Claude Agent SDK.

The prevailing developer mood matters as much as the feature matrix: the winning meme is *"an agent is a while loop with an LLM call"* (fly.io, 12-factor agents at 23.5k stars), Anthropic's own guidance says use APIs directly, and LangChain is the canonical cautionary tale. Devs don't want another framework that owns their control flow. They want harness infrastructure — durable state, HITL, context management, tracing — under a loop they can read.

## Comparison table

| | Vercel AI SDK 7 | LangGraph JS | Mastra 1.x | OpenAI Agents JS | Claude Agent SDK | AgentKit (Inngest) |
|---|---|---|---|---|---|---|
| **Weekly npm** | ~17.7M | ~2.9M | ~1.23M | n/a (~3.4k stars, 0.13.x) | n/a | ~17k |
| **Layer** | Model + UI + (new) agents | Durable graph runtime | Batteries-included framework | Thin agent loop | Full harness (Claude Code) | Durable network of agents |
| **Runtime matrix** | Node 22+, edge, browser (UI); Bun untested | Node; browser/edge nominal, breaks on contact | Node >=22.13 only; browser = HTTP client | Node 22+; browser = voice only | Node + native binary; no browser/edge | Node/serverless on an Inngest server |
| **Durability** | WorkflowAgent (new, shallow) | Best-in-class checkpointing | suspend/resume workflows | Serializable RunState | Filesystem sessions | Step-checkpointed via Inngest server (self-hostable) |
| **HITL** | Tool approvals (v6+) | interrupt() (footgun-laden) | Workflow suspend gates | needsApproval + RunState string | canUseTool callback | waitForEvent |
| **Local devtools** | DevTools + Elements + TUI | Studio (LangSmith account required) | Studio (the category bar) | Hosted traces only | None | Inngest Dev Server |
| **License** | Apache-2.0 | MIT + Elastic-licensed server | Apache-2.0 + /ee | MIT | Commercial ToS, closed core | Apache-2.0 |
| **Achilles heel** | 5 majors in 3 years; Gateway steering | Python-port DX; 4 state-schema generations; CVE chain | 69MB monolith, hard to eject, no browser | OpenAI gravity; perpetual 0.x; TS trails Python launches (sandbox parity took ~2 months) | Closed subprocess binary; ~12s spawns | Durability requires operating an Inngest server; stalled cadence |

## Table stakes (non-negotiable to be credible)

- **Provider/model string routing** over a tiny published provider spec. One-line model swaps are the most-praised feature in three separate frameworks.
- **Standard Schema tool typing** with inferred handler args. Hard-coupling to one validator is a liability — even OpenAI's five-week zod peerDependency range-pin (3.25.40–3.25.67, mid-2025; relaxed since, zod 4 supported since Oct 2025) generated lasting co-install resentment.
- **Structured output with automatic validate→retry**, shipped at v0.1. Pydantic AI's most-praised feature; smolagents' most-upvoted gap defined that project.
- **One tool-loop primitive scaling into an Agent class** without redefining tools (AI SDK's best structural decision).
- **Serializable, typed HITL** — a paused run is a string in a DB, approvable days later (OpenAI's RunState is the benchmark).
- **MCP client** targeting the 2026-07-28 stateless spec; do not build on deprecated Sampling/Roots/Logging.
- **Native OTel gen_ai.\* emission** — after Langfuse (ClickHouse), Helicone (Mintlify, maintenance mode), and promptfoo (OpenAI) were all acquired within three months, "works with any OTLP backend" is a trust feature.
- **ESM-only, web-standards core**, zero-config local devtools, semver + codemods, MIT/Apache with no commercial default steering, and a scaffolding CLI. Reviews literally measure hours-to-first-production-agent (18h Mastra vs 41h LangChain).

## The gaps nobody fills

**1. Browser as a real runtime.** Nothing runs a full agent loop client-side today. Mastra can't (server-coupled storage), Claude Agent SDK can't (native binary), LangGraph's nominal support fails on contact (AsyncLocalStorage and checkpointer deps; its v1.0 alpha shipped a `node:async_hooks` import that broke browser builds), and LangChain.js's 2023-era "browser environments" support never made agents a first-class browser target. Meanwhile the substrate is ready: WebGPU in all three major engines — and thus all four major browsers — since Sept 2025 (Chrome/Edge 113 in May 2023, Firefox 141 on Windows July 2025, Safari 26 Sept 2025), and transformers.js v4 runs the same code on browser/Node/Bun. Direct browser API calls are viable, via different mechanisms per vendor: OpenAI serves `Access-Control-Allow-Origin: *` unconditionally (its `dangerouslyAllowBrowser` flag is purely an SDK-side guard), while Anthropic serves CORS only behind the explicit `anthropic-dangerous-direct-browser-access: true` opt-in header. The only genuine framework attempt (KaibanJS) sits at ~203 weekly downloads because it bundled the idea with a LangChain dependency and a Kanban metaphor.

**2. Bun as a contract.** Every framework "works on Bun" by accident; none CI-tests it. Mastra's build CLI reportedly hangs under Bun. For a Bun-first audience this is a cheap, honest differentiator: web-standard APIs in core, `bun test` in the matrix, say so in the README. *(Directional — this specific claim went unverified; see appendix.)*

**3. Durability without a landlord.** Every durability story ships with an operational string attached: LangGraph's production server is Elastic-licensed, AgentKit's checkpointing requires running an Inngest server (open-source and self-hostable, to be fair — but an orchestrator you operate, not a library interface), Temporal/DBOS are platforms. Nobody ships a `Checkpointer` interface with memory/SQLite/Postgres/IndexedDB adapters *and a conformance test suite* (LangGraph users couldn't write custom savers for lack of a spec — langgraphjs#545). LangChain's own report ties >60% of production incidents to state management. Also: treat persisted state as hostile — LangGraph's savers shipped a SQL-injection→RCE chain (CVE-2025-67644/CVE-2026-28277).

**4. Trajectory-level replay and observability.** Final-output checks miss the per-step behavior — tool selection, arguments, retries, and multi-turn state — where most failure modes hide. A harness that owns the loop can emit structured trajectories natively instead of reverse-engineering traces from outside.

**5. The laptop dev loop for observability.** Langfuse self-host is a six-component cluster; LangSmith is cloud-only with resented per-trace pricing; Braintrust wants 150k-IOPS NVMe. A single-process SQLite trace viewer launched by `bunx mithril dev`, graduating to OTLP export, serves a need every incumbent skips.

**6. Context economics.** Tool-definition bloat is *the* MCP pain of 2026 (~1K tokens/tool; 58 tools ≈ 55K tokens). Anthropic's mitigations — tool search (85% reduction), programmatic tool calling (98.7%) — live in blog posts, not frameworks. Compaction, token budgets, and a visible context meter are where DIY loops die and where a harness earns its keep.

## Winning DX patterns to steal

- **Inference over codegen** (tRPC/Hono/Drizzle): define agents/tools once in TS; export a type the client and UI consume with zero build steps.
- **Layered ramp** (AI SDK): the loop primitive *is* the agent class config.
- **Typed DI context** (Pydantic AI's RunContext, AI SDK v7's contextSchema): kills globals, makes agents testable.
- **Handoff-as-synthetic-tool** (Swarm lineage): delegation rides existing tool-calling; survived three product generations unchanged.
- **Command + Send** (LangGraph): two concepts cover routing, handoffs, fan-out.
- **Deterministic code router over typed state** (AgentKit): the most-praised primitive in the emerging cohort.
- **Local studio bound to the dev server** (Mastra): its actual moat.
- **Model-call caching in watch mode**: "a game changer."
- **Two-altitude runner** (Anthropic toolRunner): `await runner` for 90%, iterate/mutate/inject for 10%.
- **Web-standards core + explicit runtime subpaths** (Hono): the proven portability recipe.
- **Performance receipts** (Zod 4, Vite 8): benchmark tables, not adjectives.
- **Codemods + agent-readable migration skills** with every break.

## Anti-patterns that made devs leave

- **Rename-heavy majors and the experimental_ treadmill** (AI SDK): every rename invalidates docs, Stack Overflow, and LLM training data — uniquely expensive when coding agents write the integration.
- **Commercial defaults** (AI Gateway as implicit provider) and **license bait-and-switch** (MIT framework, Elastic server).
- **Exception-based interrupts with replay-from-start** (LangGraph): try/catch swallows suspension; pre-interrupt side effects run twice.
- **Four state-schema generations** (LangGraph): pick one, never add a second.
- **The hard-to-eject monolith + custom build CLI** (Mastra): 69MB core, Rollup magic, Bun hangs.
- **Closed subprocess core** (Claude Agent SDK): open-agent-sdk exists purely as a protest.
- **Two-tier model support and perpetual 0.x** (OpenAI Agents).
- **Persona templates and YAML split-brain** (CrewAI): measured at ~$1,088 vs $390 in test spend against Pydantic AI.
- **Visual authoring as a second source of truth**: Agent Builder lived eight months.
- **Nominal runtime support that fails on contact**: worse than honest non-support.
- **Trusting persisted state**: the LangGraph checkpointer CVE chain; also giant package counts as supply-chain surface (Mastra's 144-package npm compromise, June 2026).

## Positioning thesis

The defensible wedge is not a better framework — it's the harness the community keeps saying it wants and keeps building by hand: a ~100-line readable loop you could copy out, over a tiny web-standards core that runs identically on Node, Bun, and browsers, with durable typed suspension, trajectory replay, context engineering, and a free local studio as peer packages. Message against the rewrite cliff, not against DIY. Sign a stability contract in the README and enforce tsc-latency budgets in CI (the tRPC/Hono failure mode is type-instantiation collapse at scale). MIT everything; monetize hosted durability/collaboration later, never correctness or debugging.

## What the research did not cover

- **Firebase Genkit and Effect-TS's AI packages** — both credible TS players absent from the corpus; Genkit especially has Google distribution.
- **Cloudflare's Agents SDK / Durable Objects agent runtime** — directly relevant to the durability-without-lock-in story; only workerd compat was covered.
- **Temporal's TypeScript SDK as an agent substrate** — mentioned in passing, never analyzed.
- **Memory frameworks as a category** (mem0, Zep, LangMem) — memory is treated as a feature of each framework, not mapped as a market.
- **Windows developer experience** — entirely unexamined; native-binary and better-sqlite3 pain skews worse there.
- **Quantitative sentiment** — no survey data on agent frameworks; all sentiment is HN/Reddit/GitHub proxy, which overweights early adopters.
- **Realtime/voice beyond OpenAI** — no competitive comparison (LiveKit, Pipecat's JS story).
- **Enterprise procurement** (SOC 2, air-gapped deployment, data residency) — matters for any future paid layer.
- **A2A protocol adoption** — named in Mastra's exports, never assessed.
- **Actual cost benchmarks** — token overhead per framework exists for Python only; no TS framework overhead comparison.
- **Security of tool execution/sandboxing in TS** (isolates, QuickJS/WASM, workers) — flagged as an opportunity but the TS sandbox landscape itself was not researched.

## Appendix: verification status

The 12 load-bearing claims were independently and adversarially fact-checked on 2026-07-20. **Eight held. Three were corrected** (corrections already applied above):

1. **OpenAI Agents SDK** — pre-1.0-after-13-months holds, but the zod issue was a ~five-week peerDependency *range* pin (Jul–Aug 2025), not a months-long exact pin, and zod 4 has been supported since Oct 2025. The April 2026 sandbox/Manifest launch was Python-first, but TypeScript reached parity in roughly two months — "TS second-class" is now a lag pattern, not a permanent state.
2. **Inngest AgentKit** — durability requires the Inngest orchestration layer, but that server is open source and self-hostable (SQLite/Postgres/Redis state stores). The lock-in is operational (you run an orchestrator), not proprietary. The stalled cadence holds: latest stable 0.13.2 (Nov 2025), only an alpha since.
3. **Browser viability** — WebGPU counting corrected (three engines, four browsers); CORS mechanics differ per vendor: OpenAI unconditional, Anthropic behind an opt-in header. "No incumbent serves browser agents" softened to "browser agents are a second-class, breaks-on-contact target for incumbents."

**One claim went unverified** (the fact-check agent hit a usage limit): "no major TS agent framework CI-tests Bun; Mastra's build hangs under Bun." Treat as directional until confirmed.
