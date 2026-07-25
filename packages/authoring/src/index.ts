/**
 * Runtime tool authoring for Mithril — the agent defines its own tools, mid-run, gated by approval.
 *
 * @remarks
 * Install {@link toolAuthoring} in an agent's `use` array and it gains three meta-tools: `define_tool`,
 * `list_tools` and `revoke_tool`. A definition is ordinary data, so the model never writes framework code:
 * it emits a name, a JSON Schema, and a **body**.
 *
 * Bodies come in tiers. Tier 1 — a {@link ToolComposition} — is a linear pipeline over tools the agent
 * *already has*. That makes it authority-preserving: it can rearrange existing capabilities but never
 * exceed them, which is why it is the default and needs no opt-in. Tier 2 (a sandboxed script) requires the
 * operator to supply a `CodeRunner`.
 *
 * A tool defined during step N becomes callable at step N+1: the loop snapshots the registry once per step
 * so the model is offered exactly the tools that will dispatch.
 *
 * @packageDocumentation
 */

import type { AnyTool, JsonSchema, JsonValue, Plugin, StandardSchemaV1, ToolDefinition, ToolSummary } from "@mithril/core/protocol";
import { withDigest, withJsonSchema } from "@mithril/core/protocol";
import { MithrilError, tool } from "@mithril/core/agent";
import { inheritsApproval, isComposition, validateComposition } from "./compose.ts";
import { buildDefinition, defineToolSchema, type DefineToolInput } from "./definition.ts";
import { materialize, type Materializers } from "./materialize.ts";
import { scriptMaterializer, type ScriptOptions } from "./script.ts";
import type { ToolStore } from "./persistence.ts";

export type { CompositionStep, ToolComposition, ValueRef } from "./compose.ts";
export { inheritsApproval, isComposition, resolveRef, validateComposition } from "./compose.ts";
export type { DefineToolInput } from "./definition.ts";
export { buildDefinition, defineToolSchema, RESERVED_NAMES, TOOL_NAME_PATTERN } from "./definition.ts";
export type { Materializers } from "./materialize.ts";
export { materialize } from "./materialize.ts";
export type { ScriptOptions, ToolScript } from "./script.ts";
export { isScript, scriptMaterializer } from "./script.ts";
export type { ToolStore, ToolStoreTestAdapter } from "./persistence.ts";
export { fsToolStore, kvToolStore, toolStoreConformance } from "./persistence.ts";

/** Options for {@link toolAuthoring}. */
export interface AuthoringOptions {
  /**
   * Require human approval before a tool is defined (default `true`).
   *
   * @remarks
   * Setting this to `false` lets an agent grant itself capabilities with no human in the loop. It is
   * supported for trusted, non-interactive pipelines; it is not a safe default and is never inferred.
   */
  readonly requireApprovalToDefine?: boolean;
  /**
   * Cap on tools this run may author (default 16).
   *
   * @remarks Every registered tool costs tokens on **every** step, so an unbounded registry silently
   * inflates the cost of the whole run. `revoke_tool` is how the agent makes room.
   */
  readonly maxTools?: number;
  /**
   * Enable Tier-2 script bodies by supplying a `CodeRunner`.
   *
   * @remarks Opt-in, because executing a model-written function body is a materially different risk from
   * composing tools the agent already has. See {@link ScriptOptions} — in particular `allowLocalRunner`.
   */
  readonly script?: ScriptOptions;
  /** Extra body-kind builders, keyed by `body.kind`, for body formats of your own. */
  readonly materializers?: Materializers;
  /**
   * Persist authored tools so the toolbox survives past one run.
   *
   * @remarks
   * A function form receives `{ deps, runId }`, which is what makes a multi-tenant host able to pick a
   * store per run. It is passed here rather than through `RunOptions` because a store is a property of
   * *this agent's authoring policy*, not of an individual run — and rather than being read off `Deps`,
   * which would force a framework-shaped field into every consumer's DI contract.
   */
  readonly store?: StoreSelector;
  /**
   * Which partition of the store this agent uses. **Required** whenever `store` is set.
   *
   * @remarks Not defaulted on purpose: a silent shared namespace across agents is a footgun. Scope per
   * agent or per tenant — never per run, which would make persistence identical to the ephemeral tier.
   */
  readonly scope?: string | ((ctx: StoreContext) => string);
}

/** What a {@link StoreSelector} is given to choose a store or scope. */
export interface StoreContext {
  readonly deps: unknown;
  readonly runId: string;
}

/** A {@link ToolStore}, or a per-run selector for one. */
export type StoreSelector = ToolStore | ((ctx: StoreContext) => ToolStore);

// A handful of concrete examples is the strongest prompt-side lift there is, and the loop already folds a
// tool's `examples` into its wire description (see `withExamples`), so this is free few-shot on every
// provider — no prompt engineering, no per-provider work.
const DEFINE_EXAMPLES: readonly JsonValue[] = [
  {
    name: "weather_in_f",
    description: "Look up a city's weather and convert it to Fahrenheit.",
    inputSchema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] },
    body: {
      kind: "composition",
      steps: [
        { id: "w", tool: "get_weather", args: { city: { from: "input", path: "city" } } },
        { id: "f", tool: "c_to_f", args: { celsius: { from: "step", id: "w", path: "tempC" } } },
      ],
    },
  },
  {
    name: "greet_loudly",
    description: "Greet a user in upper case.",
    inputSchema: { type: "object", properties: { user: { type: "string" } }, required: ["user"] },
    body: {
      kind: "composition",
      steps: [{ id: "s", tool: "shout", args: { text: { from: "input", path: "user" }, prefix: { value: "HELLO " } } }],
    },
  },
];

// Hand-written schemas keep this package dependency-free, the same idiom core uses for `taskSchema`.
const NO_ARGS: StandardSchemaV1<unknown, Record<string, never>> = withJsonSchema(
  { "~standard": { version: 1, vendor: "mithril-authoring", validate: () => ({ value: {} }) } },
  { type: "object", properties: {} } satisfies JsonSchema,
);

const REVOKE_ARGS: StandardSchemaV1<unknown, { name: string }> = withJsonSchema(
  {
    "~standard": {
      version: 1,
      vendor: "mithril-authoring",
      validate: (v: unknown) => {
        const name = (v as { name?: unknown } | null)?.name;
        return typeof name === "string" ? { value: { name } } : { issues: [{ message: "name: expected a string", path: [{ key: "name" }] }] };
      },
    },
  },
  { type: "object", properties: { name: { type: "string" } }, required: ["name"] } satisfies JsonSchema,
);

/**
 * The tool-authoring plugin: adds `define_tool`, `list_tools` and `revoke_tool`, and teaches the loop how
 * to rebuild authored tools when a suspended run resumes.
 *
 * @param opts - see {@link AuthoringOptions}.
 * @returns a {@link Plugin} for an agent's `use` array.
 *
 * @example
 * ```ts
 * import { agent } from "@mithril/core/agent";
 * import { toolAuthoring } from "@mithril/authoring";
 *
 * const a = agent({
 *   model: "anthropic/claude-sonnet-5",
 *   instructions: "Build the tools you need from the ones you have.",
 *   tools: [getWeather, cToF],
 *   use: [toolAuthoring()],
 * });
 * ```
 */
export function toolAuthoring(opts: AuthoringOptions = {}): Plugin<unknown> {
  const maxTools = opts.maxTools ?? 16;
  // Built eagerly so an unsafe runner is rejected when the agent is constructed, not on the first
  // define_tool call deep inside a run.
  const materializers: Materializers = {
    ...(opts.script !== undefined ? { script: scriptMaterializer(opts.script) } : {}),
    ...opts.materializers,
  };
  const build = (def: ToolDefinition): AnyTool<unknown> => materialize(def, materializers);
  const authored = (summaries: readonly ToolSummary[]): readonly ToolSummary[] => summaries.filter((s) => s.definition !== undefined);

  // Resolved per call from whatever context is at hand, so nothing is cached on the plugin instance — a
  // plugin is shared across runs, and a per-run store cached there would leak between concurrent runs.
  const storeFor = (ctx: StoreContext): { readonly store: ToolStore; readonly scope: string } | undefined => {
    if (opts.store === undefined) return undefined;
    const store = typeof opts.store === "function" ? opts.store(ctx) : opts.store;
    const scope = typeof opts.scope === "function" ? opts.scope(ctx) : opts.scope;
    if (scope === undefined) {
      throw new MithrilError("MISSING_SCOPE", "toolAuthoring({ store }) also requires `scope`; a shared default namespace across agents is a footgun.");
    }
    return { store, scope };
  };

  const defineTool = tool({
    name: "define_tool",
    description:
      "Define a new tool for the rest of this run, built from the tools you already have. " +
      "It becomes callable on your NEXT turn, not this one.",
    inputSchema: defineToolSchema(),
    examples: DEFINE_EXAMPLES,
    // The single human checkpoint: the approver sees the name, the schema and the whole body before the
    // capability exists. Reuses the loop's Tier-1 approval path unchanged.
    needsApproval: opts.requireApprovalToDefine ?? true,
    execute: async (input: DefineToolInput, ctx) => {
      const def = buildDefinition(input, {
        has: (n) => ctx.tools.has(n),
        maxTools,
        current: authored(ctx.tools.summaries()).length,
      });

      let finalDef = def;
      if (isComposition(def.body)) {
        validateComposition(def.body, (n) => ctx.tools.has(n));
        // Approval inheritance. Without it, composition launders gates: wrap `deploy` in `do_the_thing` and
        // the gate evaporates. Re-digested rather than patched, so the digest stays a true content hash —
        // idempotent re-registration depends on it.
        if (inheritsApproval(def.body, (n) => ctx.tools.get(n)?.needsApproval) && def.needsApproval !== true) {
          const { digest: _stale, ...rest } = def;
          finalDef = withDigest({ ...rest, needsApproval: true });
        }
      }

      ctx.tools.register(build(finalDef), finalDef);
      // Persisted after the registration is accepted, so a rejected definition is never written. The write
      // itself is journaled: a later suspension in this same call must not save it twice.
      const persisted = storeFor(ctx);
      if (persisted !== undefined) {
        await ctx.journal(`authoring.save.${finalDef.name}`, async () => {
          await persisted.store.save(persisted.scope, finalDef);
          return null;
        });
      }
      return {
        name: finalDef.name,
        digest: finalDef.digest,
        needsApproval: finalDef.needsApproval === true,
        availableFromStep: ctx.step + 1,
        note: "Defined. You can call it from your next turn onward.",
      };
    },
  });

  const listTools = tool({
    name: "list_tools",
    description: "List the tools defined during this run, so you do not redefine one you already have.",
    inputSchema: NO_ARGS,
    execute: async (_input, ctx) =>
      // Authored tools only: the statically declared ones are already in the tool list the model can see,
      // so echoing them back would only burn tokens.
      authored(ctx.tools.summaries()).map((s) => ({
        name: s.name,
        description: s.description,
        needsApproval: s.definition?.needsApproval === true,
      })),
  });

  const revokeTool = tool({
    name: "revoke_tool",
    description: "Remove a tool you defined earlier in this run, freeing room to define another.",
    inputSchema: REVOKE_ARGS,
    // Removing a capability is not an escalation, so it needs no gate.
    execute: async ({ name }, ctx) => {
      if (!ctx.tools.has(name)) return { revoked: false, reason: `no tool named "${name}"` };
      try {
        const revoked = ctx.tools.revoke(name);
        const persisted = storeFor(ctx);
        // Revoking removes it for good, not just for this run — otherwise the next run's setup would
        // reload the tool the agent just decided it did not want.
        if (revoked && persisted !== undefined) {
          await ctx.journal(`authoring.remove.${name}`, async () => {
            await persisted.store.remove(persisted.scope, name);
            return null;
          });
        }
        return { revoked };
      } catch (e) {
        // A refusal (revoking an author-declared tool) is information for the model, not a crash.
        if (e instanceof MithrilError) return { revoked: false, reason: e.message };
        throw e;
      }
    },
  });

  return {
    name: "@mithril/authoring",
    tools: [defineTool, listTools, revokeTool] as readonly AnyTool<unknown>[],
    materialize: build,
    ...(opts.store !== undefined
      ? {
          // Runs once per run before step 0, so a persisted tool is advertised from the very first model
          // call. It also runs again on every resume — idempotent by construction, and in any case the
          // token replaces the runtime tool set afterwards, so a tool revoked mid-run stays revoked.
          setup: async (host) => {
            const persisted = storeFor({ deps: host.deps, runId: host.runId });
            if (persisted === undefined) return;
            for (const def of await persisted.store.load(persisted.scope)) {
              try {
                // References are re-checked here, not just at build time: `materialize` has no registry to
                // check against, so without this a composition whose target tool was removed between
                // deploys would be advertised and then fail on first use. Better to not offer it at all.
                // Stored tools load in index order, so one may reference another only if it was stored first.
                if (isComposition(def.body)) validateComposition(def.body, (n) => host.tools.has(n));
                host.tools.register(build(def), { kind: "setup", plugin: "@mithril/authoring" }, def);
              } catch (err) {
                // A stored tool that no longer builds — typically a composition whose target tool was
                // removed from the agent between deploys — is skipped and reported, never fatal. A stale
                // cache entry must not be able to stop a run from starting.
                //
                // Reported as a custom event, NOT `tool.revoked`: the tool never entered the registry, and
                // a revocation event for it would make `replay(log).tools` disagree with the live registry.
                host.emit({
                  type: "custom.mithril.authoring.skipped",
                  payload: { name: def.name, reason: err instanceof Error ? err.message : String(err) },
                });
              }
            }
          },
        }
      : {}),
  };
}
