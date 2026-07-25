import type { JsonSchema } from "./json-schema.ts";
import type { JsonValue } from "./primitives.ts";
import type { AnyTool } from "./tool.ts";

// §3.3b — the run's live tool set. A run's capabilities are no longer fixed at `agent()` time: a plugin's
// `setup` can contribute tools per run, and a tool's `execute` can define new ones through `ctx.tools`.
//
// This file is types + pure functions only. The implementation (`toolRegistry`) lives in `agent/` because
// its rejections are `MithrilError`s, and `protocol/` must not depend on `agent/`.
//
// The load-bearing invariant lives in the loop, not here: ONE snapshot per step. `runStep` reads
// `registry.list()` once and hands the identical array to both the model call and tool dispatch, so what
// the model is offered is exactly what will dispatch. A registration during step N lands at step N+1.

/** Where a tool in a run's registry came from. */
export type ToolProvenance =
  /** Declared on `AgentConfig.tools`. */
  | { readonly kind: "static" }
  /** Contributed by a plugin's static `tools` array. */
  | { readonly kind: "plugin"; readonly plugin: string }
  /** Registered by a plugin's `setup`, once per run, before step 0. */
  | { readonly kind: "setup"; readonly plugin: string }
  /** Defined mid-run by a tool's `execute` via `ctx.tools.register`. */
  | { readonly kind: "runtime"; readonly by: string; readonly callId: string };

/**
 * A JSON-safe, replayable description of a tool — everything needed to rebuild it.
 *
 * @remarks
 * Carried on the `tool.registered` event *and* in the suspended run's token. Both, deliberately: the event
 * is what lets `replay(log)` reconstruct the registry, and the token is what lets `resume()` work in a
 * process that never saw the log.
 *
 * `body` is opaque to core — core never interprets it. A `materialize` function (supplied by whichever
 * package defines the body format, e.g. `@mithril/authoring`) turns it back into a callable tool.
 */
export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  /** JSON Schema for the tool's input; compile it with {@link fromJsonSchema}. */
  readonly inputSchema: JsonSchema;
  readonly outputSchema?: JsonSchema;
  readonly examples?: readonly JsonValue[];
  readonly needsApproval?: boolean;
  readonly timeoutMs?: number;
  /** The tier-discriminated body. Opaque to core; interpreted by the materializer that owns its format. */
  readonly body: JsonValue;
  /** Content digest over the canonical JSON of every other field. See {@link digestOf}. */
  readonly digest: string;
}

/** A {@link ToolDefinition} before its digest is computed. */
export type UndigestedToolDefinition = Omit<ToolDefinition, "digest">;

/** The non-executable view of a registered tool — safe to hand to an observer or back to the model. */
export interface ToolSummary {
  readonly name: string;
  readonly description: string;
  readonly version?: string;
  readonly provenance: ToolProvenance;
  /** Present only for tools registered from a definition (`setup` and `runtime` provenance). */
  readonly definition?: ToolDefinition;
}

/**
 * The live, per-run set of tools the loop resolves against.
 *
 * @typeParam Deps - the dependency bag the registered tools require.
 *
 * @remarks
 * Always fresh per run — a registry shared across runs would break run isolation and make replay
 * non-reproducible. Build one with `toolRegistry(seed)` from `@mithril/core/agent`.
 *
 * Name collisions are **rejected, never shadowed**: re-registering an existing name with a different
 * digest throws rather than replacing. Allowing a runtime tool to shadow a static one would be a
 * privilege-escalation path (redefine `send_email` and the original is gone), so it is made structurally
 * impossible.
 */
export interface ToolRegistry<Deps = unknown> {
  /** Every registered tool, in registration order (static → plugin → setup → runtime). */
  list(): readonly AnyTool<Deps>[];
  summaries(): readonly ToolSummary[];
  get(name: string): AnyTool<Deps> | undefined;
  has(name: string): boolean;
  /**
   * @throws `MithrilError` `TOOL_NAME_TAKEN` when `tool.name` is held by an entry with a different digest.
   * Re-registering the identical digest is a no-op, which is what makes replay and Tier-2 re-entry safe.
   */
  register(tool: AnyTool<Deps>, provenance: ToolProvenance, definition?: ToolDefinition): void;
  /**
   * @returns `false` when no such tool is registered.
   * @throws `MithrilError` `TOOL_NOT_REVOCABLE` for `static` or `plugin` provenance — an agent may not
   * remove a capability its author declared.
   */
  revoke(name: string): boolean;
  /** Incremented on every accepted mutation. */
  readonly revision: number;
}

/**
 * The narrowed registry view handed to a tool's `execute` as `ctx.tools`.
 *
 * @typeParam Deps - the dependency bag the registered tools require.
 *
 * @remarks
 * **Deferred commit.** `register` and `revoke` do not mutate the run's registry immediately: they queue
 * the mutation and its event, both applied when the *call* commits. So a call that throws or suspends
 * registers nothing, and concurrent calls in one step commit in strict call order — the live registry and
 * `replay(log)` therefore agree by construction.
 *
 * Available only inside `execute`. On the contexts used for dynamic instructions and `needsApproval`
 * predicates, `register`/`revoke` reject with `NOT_IMPLEMENTED`, mirroring `ctx.suspend`.
 *
 * There is deliberately no way to add middleware here. Middleware wraps *every* tool call and can rewrite
 * inputs and outputs — far more authority than a tool, with no per-call approval surface.
 */
export interface RunToolRegistry<Deps = unknown> {
  summaries(): readonly ToolSummary[];
  has(name: string): boolean;
  /**
   * The executable tool, so a composing tool can call another.
   *
   * @remarks
   * Returns the `unknown`-erased bound rather than `AnyTool<Deps>`, for two reasons. Practically, the
   * registry holds tools from heterogeneous sources — a runtime-defined tool typically closes over its own
   * data and ignores `deps` entirely — so claiming they all share this run's `Deps` would be a fiction.
   * Structurally, `AnyTool<Deps>` here would put `Deps` in a covariant position inside `RunContext<Deps>`
   * while `register` puts it in a contravariant one, making `RunContext` invariant — which would break the
   * everyday assignment of a `tool()`-defined (`Deps = unknown`) tool into a no-deps (`Deps = void`) agent.
   *
   * Calling the result still typechecks: `RunContext<Deps>` is assignable to `RunContext<unknown>`.
   */
  get(name: string): AnyTool<unknown> | undefined;
  register(tool: AnyTool<Deps>, definition: ToolDefinition): void;
  revoke(name: string): boolean;
}

// Stable serialization: object keys sorted, so two structurally equal definitions always digest equally
// regardless of the order their properties happened to be built in.
function canonical(v: JsonValue | undefined): string {
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const o = v as Record<string, JsonValue>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(",")}}`;
}

/**
 * Canonical JSON for a {@link JsonValue} — object keys sorted, so structurally equal values stringify
 * identically.
 *
 * @param v - any JSON value.
 * @returns a deterministic string form, suitable for hashing or equality.
 */
export function canonicalJson(v: JsonValue): string {
  return canonical(v);
}

/**
 * Content digest of a tool definition — its identity, used to make re-registration idempotent.
 *
 * @param def - the definition, without its `digest` field.
 * @returns an 8-character hex FNV-1a hash of the definition's canonical JSON.
 *
 * @remarks
 * **Identity, not integrity.** FNV-1a is a fast non-cryptographic hash: it answers "is this the same
 * definition?", not "was this definition tampered with". If definitions cross a trust boundary, sign the
 * carrier (that is what `Persistence.seal` is for) rather than trusting this value.
 */
export function digestOf(def: UndigestedToolDefinition): string {
  const canonicalForm = canonical({
    name: def.name,
    description: def.description,
    ...(def.version !== undefined ? { version: def.version } : {}),
    inputSchema: def.inputSchema,
    ...(def.outputSchema !== undefined ? { outputSchema: def.outputSchema } : {}),
    ...(def.examples !== undefined ? { examples: [...def.examples] } : {}),
    ...(def.needsApproval !== undefined ? { needsApproval: def.needsApproval } : {}),
    ...(def.timeoutMs !== undefined ? { timeoutMs: def.timeoutMs } : {}),
    body: def.body,
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < canonicalForm.length; i++) {
    h ^= canonicalForm.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Attach the computed {@link digestOf} to a definition. */
export function withDigest(def: UndigestedToolDefinition): ToolDefinition {
  return { ...def, digest: digestOf(def) };
}
