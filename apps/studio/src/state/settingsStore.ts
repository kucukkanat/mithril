/*
 * BYOK connection settings + preferences. A provider's key AND its optional base URL live ONLY in
 * localStorage on this device (persisted just while `remember` is on) and are injected per-run into
 * the worker's process.env — never serialized into a project spec, share URL, or export.
 *
 * The base URL sits beside the key on purpose: which endpoint you call is connection config, like the
 * credential, not a design decision belonging to the agent. That keeps an exported project portable —
 * it names a model, and the environment decides where that model is served from.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LIVE_PROVIDERS, liveProvider, type LiveProviderId } from "@mithril/runner-web";
import { connectionEnv, type ProviderConnection, type ProviderConnections } from "@mithril-internal/model-picker";
import type { ModelSpec, ProjectSpec } from "@mithril/spec";
import { DRAFT_DEFAULT_MODEL } from "../lib/drafting.ts";

interface SettingsState {
  /** Per-provider key + optional endpoint override. */
  readonly connections: ProviderConnections;
  readonly remember: boolean;
  readonly theme: "dark" | "light";
  /**
   * The model drafting help runs on, or `null` to remove the feature from the UI entirely.
   * Defaults to on-device so a first run costs nothing and sends nothing.
   */
  readonly draftModel: ModelSpec | null;
  /** Show the exact request before sending it. On by default — the gate is the feature. */
  readonly previewFirst: boolean;
  setKey(id: LiveProviderId, key: string): void;
  /** Merge a partial connection update (key and/or base URL) for one provider. */
  setConnection(id: LiveProviderId, patch: ProviderConnection): void;
  clearKeys(): void;
  setRemember(remember: boolean): void;
  setTheme(theme: "dark" | "light"): void;
  setDraftModel(model: ModelSpec | null): void;
  setPreviewFirst(previewFirst: boolean): void;
}

/** The pre-v3 shape: a flat `{ [provider]: key }` map with nowhere to put an endpoint. Exported for tests. */
export const keysToConnections = (keys: unknown): ProviderConnections =>
  typeof keys !== "object" || keys === null
    ? {}
    : (Object.fromEntries(Object.entries(keys as Record<string, unknown>).filter(([, v]) => typeof v === "string").map(([id, apiKey]) => [id, { apiKey }])) as ProviderConnections);

/** Drop credentials but keep endpoints — what gets persisted when `remember` is off. Exported for tests. */
export const stripKeys = (connections: ProviderConnections): ProviderConnections =>
  Object.fromEntries(Object.entries(connections).map(([id, c]) => [id, { ...c, apiKey: "" }])) as ProviderConnections;

/** The pre-v2 shape, when drafting was a three-way mode rather than a model. */
const migrateDraftMode = (mode: unknown): ModelSpec | null =>
  mode === "off" ? null : mode === "key" ? { kind: "live", provider: "anthropic", model: liveProvider("anthropic").defaultModel } : DRAFT_DEFAULT_MODEL;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      connections: {},
      remember: true,
      theme: "dark",
      draftModel: DRAFT_DEFAULT_MODEL,
      previewFirst: true,
      setKey: (id, apiKey) => set((s) => ({ connections: { ...s.connections, [id]: { ...s.connections[id], apiKey } } })),
      setConnection: (id, patch) => set((s) => ({ connections: { ...s.connections, [id]: { ...s.connections[id], ...patch } } })),
      // Clears credentials only — a base URL is not a secret, and losing a configured gateway on
      // "clear keys" would be a surprise.
      clearKeys: () =>
        set((s) => ({
          connections: Object.fromEntries(Object.entries(s.connections).map(([id, c]) => [id, { ...c, apiKey: "" }])) as ProviderConnections,
        })),
      setRemember: (remember) => set({ remember }),
      setTheme: (theme) => {
        document.documentElement.dataset["theme"] = theme;
        set({ theme });
      },
      setDraftModel: (draftModel) => set({ draftModel }),
      setPreviewFirst: (previewFirst) => set({ previewFirst }),
    }),
    {
      name: "mithril-studio-settings",
      version: 3,
      migrate: (state, version) => {
        const s = (state ?? {}) as Record<string, unknown>;
        const draft = version >= 2 ? s["draftModel"] : migrateDraftMode(s["draftMode"]);
        // v3 folded the flat `keys` map into `connections`, so a base URL can travel with its key.
        const connections = version >= 3 ? (s["connections"] ?? {}) : keysToConnections(s["keys"]);
        return { ...s, draftModel: draft, connections } as SettingsState;
      },
      // Keys are only written to storage while `remember` is on; base URLs and prefs always persist.
      partialize: (s) => ({
        connections: s.remember ? s.connections : stripKeys(s.connections),
        remember: s.remember,
        theme: s.theme,
        draftModel: s.draftModel,
        previewFirst: s.previewFirst,
      }),
      onRehydrateStorage: () => (s) => {
        if (s !== undefined) document.documentElement.dataset["theme"] = s.theme;
      },
    },
  ),
);

/** Every live provider referenced by an agent in the spec. */
export function liveProvidersIn(spec: ProjectSpec): readonly LiveProviderId[] {
  const out = new Set<LiveProviderId>();
  for (const d of spec.decls) {
    if (d.kind === "agent" && d.model.kind === "live") out.add(d.model.provider);
  }
  return [...out];
}

/** True if any agent in the spec runs on-device. */
export function usesLocalModel(spec: ProjectSpec): boolean {
  return spec.decls.some((d) => d.kind === "agent" && d.model.kind === "local");
}

/**
 * The env map a run should receive: `<PROVIDER>_API_KEY` (and `<PROVIDER>_BASE_URL`, when an endpoint
 * override is configured) per live provider the spec uses. Returns the map plus any providers still
 * missing a key.
 */
export function envForSpec(
  spec: ProjectSpec,
  connections: ProviderConnections,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  return envForProviders(liveProvidersIn(spec), connections);
}

/**
 * The env map a single model needs — used by drafting, which runs one agent on one picked model
 * rather than a whole spec.
 */
export function envForModel(
  model: ModelSpec | null,
  connections: ProviderConnections,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  return envForProviders(model !== null && model.kind === "live" ? [model.provider] : [], connections);
}

function envForProviders(
  ids: readonly LiveProviderId[],
  connections: ProviderConnections,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  const env: Record<string, string> = {};
  const missing: LiveProviderId[] = [];
  for (const id of ids) {
    const vars = connectionEnv(id, connections[id]);
    Object.assign(env, vars);
    if (vars[liveProvider(id).envVar] === undefined) missing.push(id);
  }
  return { env, missing };
}

export { LIVE_PROVIDERS };
