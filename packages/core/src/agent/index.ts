/**
 * The `@mithril/core` agent layer — the one producer of the protocol.
 *
 * @remarks Ships the {@link tool}/{@link agent}/{@link createHarness} factories, the streaming
 * {@link agentLoop}, model/provider resolution, and sealed-token helpers ({@link seal}/{@link open}).
 * {@link RunHandle}'s `cancel()` aborts the run at the next step boundary (equivalent to aborting
 * {@link RunOptions.signal}); {@link Agent.resume} drains a suspension to its final {@link RunResult}
 * while {@link Agent.resumeStream} is its streaming form; and all three HITL tiers are wired — Tier-1
 * approval, a tool returning `suspend(...)` (Tier-1b), and `ctx.suspend()` (Tier-2), including
 * first-class nested `asTool` resume through the parent's own token.
 *
 * @packageDocumentation
 */

// @mithril/core/agent — the ONE producer of the protocol. Ships the tool()/agent()/createHarness()
// factories and the streaming loop (agentLoop), structured output, all three HITL suspension tiers,
// middleware/plugins, iterate()/resume()/resumeStream()/asTool(), and sealed-token helpers. Durable
// persistence wiring into run() is not yet shipped — see the roadmap.

// ── Tool & Agent Factories ─────────────────────────────────────────────────────────────────────
export type { ToolDef, ToolFactory, AsToolOptions } from "./factory.ts";
export { tool, plugin, agent, createHarness, asTool } from "./factory.ts";

// ── Loop & Streaming ───────────────────────────────────────────────────────────────────────────
export type {
  LoopOptions,
  PendingKind,
  PendingSuspension,
  ResumeState,
  ResumeValue,
  RunTokenV2,
} from "./loop.ts";
export { agentLoop } from "./loop.ts";

// ── Agent Types & Config ───────────────────────────────────────────────────────────────────────
export type {
  Agent,
  AgentConfig,
  AgentFactory,
  DepsOption,
  Input,
  InputMessage,
  RunArgs,
  RunHandle,
  RunOptions,
  RunOptionsBase,
  RunResult,
  StepSnapshot,
} from "./agent-types.ts";
export { inputToJson, toSerializedError } from "./agent-types.ts";

// ── Self-Healing Middleware ────────────────────────────────────────────────────────────────────
export type { LoopGuardOptions, OutputRetryOptions, RetryBudgetOptions } from "./healing.ts";
export { argRepair, harmonyRepair, retryBudget, loopGuard, outputRetry, defaults, healing } from "./healing.ts";

// ── Suspension & HITL Resume ───────────────────────────────────────────────────────────────────
export type { Keyring, SealCodec } from "./seal.ts";
export {
  seal,
  open,
  aesGcmCodec,
  hmacCodec,
  singleKeyring,
  generateEncryptionKey,
  generateStateKey,
  StateIntegrityError,
} from "./seal.ts";

// ── Test-Time Sampling & Consistency ───────────────────────────────────────────────────────────
export type { BestOfNOptions, SelfConsistencyOptions } from "./test-time.ts";
export { bestOfN, selfConsistency } from "./test-time.ts";

// ── Run Handle & Control ───────────────────────────────────────────────────────────────────────
export { makeRunHandle } from "./handle.ts";

// ── Registry & Resolution ──────────────────────────────────────────────────────────────────────
export { MithrilError, providerRegistry, resolveModel, resolveTransport } from "./registry.ts";

// ── Runtime & Global Observability ────────────────────────────────────────────────────────────
export { defaultRuntime } from "./runtime.ts";
export { registerGlobalConsumer, globalConsumers } from "./global-consumers.ts";
