/*
 * Connection settings → the env a run receives.
 *
 * Both hosts inject `process.env` into the runner worker, and core's `resolveTransport` reads
 * `<PROVIDER>_API_KEY` and `<PROVIDER>_BASE_URL` from it. Putting the mapping here means the
 * endpoint override reaches a real request by exactly the same route the key does — no special
 * casing in either host, and generated/exported code stays portable because neither value is baked
 * into it.
 */

import { liveProvider, type LiveProviderId } from "@mithril/runner-web";
import type { ModelSelection, ProviderConnection, ProviderConnections } from "./types.ts";

/**
 * The env vars one provider's connection contributes. Blank values are omitted entirely so an empty
 * base-URL field falls through to the provider's default rather than overriding it with `""`.
 *
 * @example
 * ```ts
 * connectionEnv("openai", { apiKey: "sk-…", baseUrl: "https://gw.internal/v1" });
 * // { OPENAI_API_KEY: "sk-…", OPENAI_BASE_URL: "https://gw.internal/v1" }
 * ```
 */
export function connectionEnv(provider: LiveProviderId, connection: ProviderConnection | undefined): Record<string, string> {
  const p = liveProvider(provider);
  const key = connection?.apiKey?.trim() ?? "";
  const base = connection?.baseUrl?.trim() ?? "";
  return {
    ...(key.length > 0 ? { [p.envVar]: key } : {}),
    ...(base.length > 0 ? { [p.baseUrlEnvVar]: base } : {}),
  };
}

/**
 * The env for a set of providers, plus which of them still have no key — the check a host shows
 * before a run rather than after a 401.
 *
 * @param providers - the providers a run will touch.
 * @param connections - the stored settings for all providers.
 *
 * @remarks Only the named providers' settings are exposed to a run; the rest of the user's keys never
 * enter the worker.
 */
export function selectionEnv(
  providers: readonly LiveProviderId[],
  connections: ProviderConnections,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  const env: Record<string, string> = {};
  const missing: LiveProviderId[] = [];
  for (const id of providers) {
    const vars = connectionEnv(id, connections[id]);
    Object.assign(env, vars);
    if (vars[liveProvider(id).envVar] === undefined) missing.push(id);
  }
  return { env, missing };
}

/** The live providers a single {@link ModelSelection} needs a key for (none, for scripted/local/code). */
export function providersOf(selection: ModelSelection): readonly LiveProviderId[] {
  return selection.kind === "live" ? [selection.provider] : [];
}
