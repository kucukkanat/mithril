/*
 * BYOK keys + preferences. Keys live ONLY in localStorage on this device (persisted just while
 * `remember` is on) and are injected per-run into the worker's process.env — never serialized into
 * a project spec, share URL, or export.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LIVE_PROVIDERS, liveProvider, type LiveProviderId } from "@mithril/runner-web";
import type { ModelSpec, ProjectSpec } from "@mithril/spec";

interface SettingsState {
  readonly keys: Partial<Record<LiveProviderId, string>>;
  readonly remember: boolean;
  readonly theme: "dark" | "light";
  setKey(id: LiveProviderId, key: string): void;
  clearKeys(): void;
  setRemember(remember: boolean): void;
  setTheme(theme: "dark" | "light"): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      keys: {},
      remember: true,
      theme: "dark",
      setKey: (id, key) => set((s) => ({ keys: { ...s.keys, [id]: key } })),
      clearKeys: () => set({ keys: {} }),
      setRemember: (remember) => set({ remember }),
      setTheme: (theme) => {
        document.documentElement.dataset["theme"] = theme;
        set({ theme });
      },
    }),
    {
      name: "mithril-studio-settings",
      // Keys are only written to storage while `remember` is on; prefs always persist.
      partialize: (s) => ({ keys: s.remember ? s.keys : {}, remember: s.remember, theme: s.theme }),
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
 * The env map a run should receive: one `<PROVIDER>_API_KEY` per live provider the spec uses,
 * for those with a stored key. Returns the map plus any providers still missing a key.
 */
export function envForSpec(
  spec: ProjectSpec,
  keys: Partial<Record<LiveProviderId, string>>,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  return envForProviders(liveProvidersIn(spec), keys);
}

/**
 * Like {@link envForSpec}, but over an explicit set of models (an eval matrix + its judge models) rather
 * than a spec's agents — every live provider among them needs its `<PROVIDER>_API_KEY` in the run env.
 */
export function envForModels(
  models: readonly ModelSpec[],
  keys: Partial<Record<LiveProviderId, string>>,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  const providers = new Set<LiveProviderId>();
  for (const m of models) if (m.kind === "live") providers.add(m.provider);
  return envForProviders([...providers], keys);
}

function envForProviders(
  ids: readonly LiveProviderId[],
  keys: Partial<Record<LiveProviderId, string>>,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  const env: Record<string, string> = {};
  const missing: LiveProviderId[] = [];
  for (const id of ids) {
    const key = keys[id]?.trim();
    if (key !== undefined && key.length > 0) env[liveProvider(id).envVar] = key;
    else missing.push(id);
  }
  return { env, missing };
}

export { LIVE_PROVIDERS };
