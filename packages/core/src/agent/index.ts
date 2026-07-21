/**
 * The `@mithril/core` agent layer — the one producer of the protocol.
 *
 * @remarks Ships the {@link tool}/{@link agent}/{@link createHarness} factories, the streaming
 * {@link agentLoop}, model/provider resolution, and sealed-token helpers ({@link seal}/{@link open}).
 * Some capabilities are staged: {@link RunHandle}'s `cancel()` is a no-op (cancel via
 * {@link RunOptions.signal}), {@link Agent.resume} returns the final {@link RunResult} without
 * re-streaming, and the deeper HITL tiers (a tool returning `suspend(...)`, or `ctx.suspend()`) are not
 * yet wired and reject/throw {@link MithrilError} `NOT_IMPLEMENTED`.
 *
 * @packageDocumentation
 */

// @mithril/core/agent — the ONE producer of the protocol. This slice ships the tool()/agent()/
// createHarness() factories and the streaming loop (agentLoop). Structured output, HITL suspension,
// middleware/plugins, persistence, iterate()/resume()/asTool() land in later slices.

export type { AsToolOptions, ToolDef, ToolFactory } from "./factory.ts";
export { agent, asTool, createHarness, plugin, tool } from "./factory.ts";
export type { LoopOptions, PendingKind, PendingSuspension, ResumeState, ResumeValue, RunTokenV2 } from "./loop.ts";
export { agentLoop } from "./loop.ts";
export { defaultRuntime } from "./runtime.ts";
export { globalConsumers, registerGlobalConsumer } from "./global-consumers.ts";
export { MithrilError, providerRegistry, resolveModel, resolveTransport } from "./registry.ts";
export type {
  Agent,
  AgentConfig,
  AgentFactory,
  Input,
  InputMessage,
  RunArgs,
  RunHandle,
  RunOptions,
  RunResult,
  StepSnapshot,
} from "./agent-types.ts";
export { inputToJson, toSerializedError } from "./agent-types.ts";
export { makeRunHandle } from "./handle.ts";
export type { Keyring, SealCodec } from "./seal.ts";
export {
  aesGcmCodec,
  generateEncryptionKey,
  generateStateKey,
  hmacCodec,
  open,
  seal,
  singleKeyring,
  StateIntegrityError,
} from "./seal.ts";
