import type { JsonValue, UsageDelta, UsageTotals } from "./primitives.ts";
import type { ProviderRegistry } from "./provider.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";
import type { ResolutionOf, SuspensionRequest } from "./suspension.ts";
import type { RunToolRegistry } from "./tool-registry.ts";

// §3.2 — the only ambient-capability seam. Built from globalThis by default; injectable for deterministic
// replay and workerd safety. `subtle` is OPTIONAL: getRandomValues is available in insecure browser
// contexts, subtle is not — so ids derive from getRandomValues and subtle is demanded only by seal()/open().
/**
 * The single ambient-capability seam: every non-deterministic or platform
 * primitive an agent needs, injectable for deterministic replay.
 *
 * @remarks
 * Built from `globalThis` by default. `subtle` is optional because
 * `getRandomValues` is available in insecure browser contexts while
 * `SubtleCrypto` is not — ids derive from `getRandomValues`, and `subtle` is
 * demanded only by seal/open.
 */
export interface RuntimeAdapter {
  readonly fetch: typeof fetch;
  /** Current epoch time in milliseconds; the source of every event's `ts`. */
  readonly now: () => number;
  readonly randomUUID: () => string;
  readonly getRandomValues: <T extends ArrayBufferView | null>(array: T) => T;
  /** Optional; required only by seal/open, absent in insecure browser contexts. */
  readonly subtle?: SubtleCrypto;
}

// §3.2 — the seam that lets the SAME agent run in a browser without leaking keys. (Persistence/durability
// is a separate concern, not yet wired in this slice.)
/**
 * How model requests reach the provider, chosen so the same agent can run in a
 * browser without leaking keys.
 *
 * @remarks
 * `'byok'` sends a caller-held API key directly; `'proxy'` routes through a
 * trusted backend; `'ephemeral'` fetches a short-lived token per request.
 * Persistence/durability is a separate concern, not carried here.
 */
export type Transport =
  | { readonly kind: "byok"; readonly apiKey: string; readonly baseUrl?: string; readonly headers?: HeadersInit }
  | { readonly kind: "proxy"; readonly baseUrl: string; readonly headers?: HeadersInit }
  | { readonly kind: "ephemeral"; readonly baseUrl: string; readonly token: () => Promise<string> };

// §3.3 — typed DI threaded into tools and dynamic instructions. No globals. `deps` are re-injected every
// run/resume and are NEVER serialized.
/**
 * The typed dependency-injection context threaded into tools and dynamic
 * instructions.
 *
 * @typeParam Deps - The caller-defined dependency bag.
 *
 * @remarks
 * No globals: `deps` are re-injected every run/resume and are never serialized.
 */
export interface RunContext<Deps> {
  readonly deps: Deps;
  readonly runId: string;
  readonly step: number;
  readonly signal: AbortSignal;
  /**
   * The run's live tool set — inspect it, and (inside `execute`) define new tools.
   *
   * @remarks
   * Mutations are **deferred**: they land when this call commits, so a call that throws or suspends
   * registers nothing, and concurrent calls in one step commit in call order. A tool registered during
   * step N becomes callable at step N+1 — the loop snapshots the registry once per step so the model is
   * offered exactly the tools that will dispatch.
   *
   * `register`/`revoke` are available only inside a tool's `execute`; on the contexts used for dynamic
   * instructions and `needsApproval` predicates they reject with `NOT_IMPLEMENTED`, as `suspend` does.
   */
  readonly tools: RunToolRegistry<Deps>;
  readonly usage: Readonly<UsageTotals>;
  /**
   * Charge tokens/cost spent *inside* a tool to the run that called it.
   *
   * @param delta - the usage to add to the run's running totals.
   *
   * @remarks Without this, spend that does not flow through the loop's own model call is invisible: a tool
   * that runs a sub-agent (see {@link asTool}), calls a provider directly, or proxies an LLM over MCP would
   * report zero. That matters beyond reporting — `maxTokens`/`maxCostMicroUsd` are checked against these
   * totals, so unreported spend is spend no budget can stop. Emits a `usage` event so the run's event log
   * and any consumer see it too.
   *
   * @example
   * ```ts
   * const res = await child.run(task, opts);
   * ctx.reportUsage(res.usage); // the delegated tokens now count against the parent's budget
   * ```
   */
  reportUsage(delta: UsageDelta): void;
  readonly runtime: RuntimeAdapter;
  /**
   * The run's resolved {@link Transport} (after the env-BYOK default is applied). Present so a sub-agent
   * launched from a tool (see {@link asTool}) automatically inherits the parent's credentials/endpoint.
   */
  readonly transport?: Transport;
  /**
   * The run's {@link ProviderRegistry}, if one was supplied. Present so a sub-agent launched from a tool
   * automatically inherits it and can resolve bare-string model ids.
   */
  readonly providers?: ProviderRegistry;
  /** Push a first-class `custom.*` event into the stream. */
  emit(payload: JsonValue, type?: `custom.${string}`): void;
  /**
   * Tier-2 HITL: suspend mid-tool execution and resume with the resolution as the return value.
   *
   * @remarks
   * Calling this pauses the run with `req` as the pending {@link SuspensionRequest}; the effect is
   * journaled so the surrounding `execute` is not re-run on resume. Resume via
   * `resume(token, { kind: "resolve", value })`, and `value` becomes this call's return.
   */
  suspend<Req extends SuspensionRequest>(req: Req): Promise<ResolutionOf<Req>>;
  /** Journaled, exactly-once effect. Memoized into the log; skipped on Tier-2 replay. */
  journal<T>(key: string, fn: () => Promise<T>, schema?: StandardSchemaV1<unknown, T>): Promise<T>;
}
