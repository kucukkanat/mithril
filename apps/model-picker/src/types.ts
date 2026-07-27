/*
 * The vocabulary the shared picker speaks. Deliberately a superset of both hosts' own model types:
 * the playground needs `scripted`, the Studio needs `code`, and both need `live` + `local`. Each host
 * declares which kinds it offers (`kinds`) and adapts its own type at the boundary — see
 * `modelSpecToSelection` / `selectionToModelSpec` in the Studio, and the target mapping in the
 * playground. That keeps ONE picker without forcing either host to change its persisted shape.
 */

import type { LiveProviderId } from "@mithril/runner-web";

/** Which segment of the picker is active. */
export type ModelKind = "scripted" | "live" | "local" | "code";

/** A chosen model, in the picker's own vocabulary. */
export type ModelSelection =
  /** The offline scripted double — no key, no network. Playground only. */
  | { readonly kind: "scripted" }
  /** A remote BYOK provider + model id. */
  | { readonly kind: "live"; readonly provider: LiveProviderId; readonly model: string }
  /** An on-device Transformers.js repo id. */
  | { readonly kind: "local"; readonly model: string; readonly dtype?: string }
  /** A verbatim `ModelInput` expression. Studio only. */
  | { readonly kind: "code"; readonly expr: string };

/**
 * A provider's connection settings — the two things that travel with a key rather than with a design.
 * Stored per provider by the host (localStorage in both), never written into a spec or a share URL.
 */
export interface ProviderConnection {
  /** The BYOK key, injected per run as `<PROVIDER>_API_KEY`. */
  readonly apiKey?: string;
  /**
   * Optional endpoint override, injected per run as `<PROVIDER>_BASE_URL`. Blank/absent means the
   * provider's own `defaultBaseUrl`.
   */
  readonly baseUrl?: string;
}

/** Every provider's connection settings, keyed by provider id. */
export type ProviderConnections = Partial<Record<LiveProviderId, ProviderConnection>>;
