/**
 * The `@mithril/core` protocol entrypoint: the typed event stream plus the pure,
 * total reducers that fold it into run state.
 *
 * @remarks
 * This layer is types and pure functions only — zero side effects, no `fetch`,
 * no provider code, no `node:` APIs. Its centre is {@link MithrilEvent} (the
 * non-exhaustive wire union) and the {@link reduce}/{@link replay} fold, so a
 * run's {@link RunState} is always a deterministic function of its event log.
 * Everything else in the framework imports this module.
 *
 * @packageDocumentation
 */

// @mithril/core/protocol — THE PRODUCT. Types + pure total functions. Zero side effects, zero fetch, zero
// provider code, no node: API. Everything imports this.

export type { StandardSchemaV1 } from "./standard-schema.ts";
export type {
  FinishReason,
  JsonSafe,
  JsonValue,
  ModelId,
  SerializedError,
  UsageDelta,
  UsageTotals,
} from "./primitives.ts";
export { addUsage, ZERO_USAGE } from "./primitives.ts";
export type { RunContext, RuntimeAdapter, Transport } from "./context.ts";
export type {
  ChatRequest,
  ModelCapabilities,
  ModelHandle,
  ModelInput,
  ModelSpec,
  Pricing,
  Provider,
  ProviderChunk,
  ProviderRegistry,
  ProviderSpec,
} from "./provider.ts";
export type { AnyTool, Tool, ToolInputOf, ToolOutputOf, ToolProgress } from "./tool.ts";
export type { JsonSchema, JsonSchemaConverter } from "./json-schema.ts";
export { PERMISSIVE_OBJECT, toJsonSchema, withJsonSchema } from "./json-schema.ts";
export type {
  ApprovalDecision,
  ApprovalRequest,
  HandoffSuspension,
  ResolutionOf,
  SchemaRegistry,
  Suspend,
  SuspensionDescriptor,
  SuspensionRequest,
} from "./suspension.ts";
export { isSuspend, schemaRegistry, SUSPEND, suspend } from "./suspension.ts";
export type { CustomEventOf, EventMeta, EventOf, EventType, MithrilEvent, SpanRef } from "./events.ts";
export type { Message, RunState, RunStatus, ToolCallRecord } from "./state.ts";
export { INITIAL, reduce, replay } from "./state.ts";
export type { ToolCallFor } from "./narrow.ts";
export { narrow } from "./narrow.ts";
export type { ContiguityResult, EventTransport } from "./transport.ts";
export { assertContiguous, inMemoryTransport } from "./transport.ts";
export { isKnownEvent, migrate, ProtocolVersionError } from "./migrate.ts";
export type { Checkpointer, CheckpointRecord, SerializedRunState, TestAdapter } from "./checkpointer.ts";
export type {
  DraftEvent,
  EventConsumer,
  InferPluginTools,
  Middleware,
  MiddlewareContext,
  ModelCall,
  ModelResult,
  Plugin,
  PluginHost,
  StepInput,
  StepOutcome,
  ToolInvocation,
  ToolOutcome,
} from "./middleware.ts";
