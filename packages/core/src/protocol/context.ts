import type { JsonValue, UsageTotals } from "./primitives.ts";
import type { StandardSchemaV1 } from "./standard-schema.ts";
import type { ResolutionOf, SuspensionRequest } from "./suspension.ts";

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
  readonly usage: Readonly<UsageTotals>;
  readonly runtime: RuntimeAdapter;
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
