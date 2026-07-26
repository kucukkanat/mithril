/*
 * BYOK keys + preferences. Keys live ONLY in localStorage on this device (persisted just while
 * `remember` is on) and are injected per-run into the worker's process.env — never serialized into
 * a project spec, share URL, or export.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LIVE_PROVIDERS, liveProvider, type LiveProviderId } from "@mithril/runner-web";
import type { ModelSpec, ProjectSpec } from "@mithril/spec";
import { DRAFT_DEFAULT_MODEL } from "../lib/drafting.ts";

interface SettingsState {
  readonly keys: Partial<Record<LiveProviderId, string>>;
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
  clearKeys(): void;
  setRemember(remember: boolean): void;
  setTheme(theme: "dark" | "light"): void;
  setDraftModel(model: ModelSpec | null): void;
  setPreviewFirst(previewFirst: boolean): void;
}

/** The pre-v2 shape, when drafting was a three-way mode rather than a model. */
const migrateDraftMode = (mode: unknown): ModelSpec | null =>
  mode === "off" ? null : mode === "key" ? { kind: "live", provider: "anthropic", model: liveProvider("anthropic").defaultModel } : DRAFT_DEFAULT_MODEL;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      keys: {},
      remember: true,
      theme: "dark",
      draftModel: DRAFT_DEFAULT_MODEL,
      previewFirst: true,
      setKey: (id, key) => set((s) => ({ keys: { ...s.keys, [id]: key } })),
      clearKeys: () => set({ keys: {} }),
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
      version: 2,
      migrate: (state, version) => {
        if (version >= 2) return state as SettingsState;
        const s = (state ?? {}) as Record<string, unknown>;
        return { ...s, draftModel: migrateDraftMode(s["draftMode"]) } as SettingsState;
      },
      // Keys are only written to storage while `remember` is on; prefs always persist.
      partialize: (s) => ({
        keys: s.remember ? s.keys : {},
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
 * The env map a single model needs — used by drafting, which runs one agent on one picked model
 * rather than a whole spec.
 */
export function envForModel(
  model: ModelSpec | null,
  keys: Partial<Record<LiveProviderId, string>>,
): { readonly env: Record<string, string>; readonly missing: readonly LiveProviderId[] } {
  return envForProviders(model !== null && model.kind === "live" ? [model.provider] : [], keys);
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
