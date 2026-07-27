import { useCallback, useEffect, useRef, useState } from "react";
import { connectionEnv, type ProviderConnection, type ProviderConnections } from "@mithril-internal/model-picker";
import { DEFAULT_LOCAL_MODEL, LIVE_PROVIDERS, liveProvider, localModel, type LiveProviderId, type ProviderMode } from "./providers.ts";

/*
 * Owns the Run against bar's state — run mode, the active remote provider + model, per-provider
 * keys, and the local-model download — plus its persistence. Mirrors `useRunner`'s shape (a state
 * object + action callbacks) so `Playground.tsx` consumes both the same way.
 *
 * Security: keys live in `localStorage` (the app's first app-data use of it — same key style as
 * Starlight's `starlight-theme`). Turning `remember` off keeps prefs but drops keys from storage.
 * `envForRun()` exposes ONLY the active provider's single key to a run — never the whole set.
 */

const STORAGE_KEY = "mithril-playground-settings";

type ModelMap = Partial<Record<LiveProviderId, string>>;

interface Settings {
  readonly mode: ProviderMode;
  readonly activeProvider: LiveProviderId;
  readonly models: ModelMap;
  readonly localModel: string;
  readonly remember: boolean;
  /** Per-provider key + optional endpoint override — the same shape the Studio stores. */
  readonly connections: ProviderConnections;
}

const DEFAULTS: Settings = {
  mode: "scripted",
  activeProvider: "openai",
  models: {},
  localModel: DEFAULT_LOCAL_MODEL,
  remember: true,
  connections: {},
};

/** The pre-unification shape: a flat `{ [provider]: key }` map with nowhere to put an endpoint. */
const keysToConnections = (keys: unknown): ProviderConnections =>
  typeof keys !== "object" || keys === null
    ? {}
    : (Object.fromEntries(
        Object.entries(keys as Record<string, unknown>)
          .filter(([, v]) => typeof v === "string")
          .map(([id, apiKey]) => [id, { apiKey }]),
      ) as ProviderConnections);

/** Drop credentials but keep endpoints — what gets persisted when `remember` is off. */
const stripKeys = (connections: ProviderConnections): ProviderConnections =>
  Object.fromEntries(Object.entries(connections).map(([id, c]) => [id, { ...c, apiKey: "" }])) as ProviderConnections;

export interface DownloadState {
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly progress: number;
  readonly error?: string;
}

const isProviderId = (p: unknown): p is LiveProviderId => LIVE_PROVIDERS.some((x) => x.id === p);

function loadSettings(): Settings {
  if (typeof localStorage === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      // Mode is deliberately NOT restored — every session starts on the scripted default (matching
      // the default preset), so a returning user never lands on a live/local chip over scripted code.
      mode: DEFAULTS.mode,
      activeProvider: isProviderId(p.activeProvider) ? p.activeProvider : DEFAULTS.activeProvider,
      models: typeof p.models === "object" && p.models !== null ? p.models : {},
      localModel: typeof p.localModel === "string" ? p.localModel : DEFAULTS.localModel,
      remember: p.remember !== false,
      // Keys are only trusted from storage when the user opted to remember them; endpoints are not
      // secrets, so a configured gateway survives `remember: false`.
      connections: readConnections(p, p.remember !== false),
    };
  } catch {
    return DEFAULTS;
  }
}

/** Read connections from a stored blob, migrating the pre-unification `keys` map when present. */
function readConnections(p: Partial<Settings> & { readonly keys?: unknown }, trustKeys: boolean): ProviderConnections {
  const stored = typeof p.connections === "object" && p.connections !== null ? p.connections : keysToConnections(p.keys);
  return trustKeys ? stored : stripKeys(stored);
}

function persist(s: Settings): void {
  if (typeof localStorage === "undefined") return;
  const toStore: Settings = s.remember ? s : { ...s, connections: stripKeys(s.connections) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    /* storage full or blocked — ignore, keys simply won't persist */
  }
}

export function useProviderSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [download, setDownload] = useState<DownloadState>({ status: "idle", progress: 0 });
  const firstPersist = useRef(true);

  // Hydrate after mount (the island is client:only, but guard for safety), then persist on change.
  useEffect(() => setSettings(loadSettings()), []);
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    persist(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const setMode = useCallback((mode: ProviderMode) => update({ mode }), [update]);
  const setProvider = useCallback((activeProvider: LiveProviderId) => update({ activeProvider }), [update]);
  const setModel = useCallback((id: LiveProviderId, model: string) => setSettings((s) => ({ ...s, models: { ...s.models, [id]: model } })), []);
  const setLocalModel = useCallback((localModel: string) => update({ localModel }), [update]);
  const setKey = useCallback(
    (id: LiveProviderId, apiKey: string) => setSettings((s) => ({ ...s, connections: { ...s.connections, [id]: { ...s.connections[id], apiKey } } })),
    [],
  );
  const setConnection = useCallback(
    (id: LiveProviderId, patch: ProviderConnection) => setSettings((s) => ({ ...s, connections: { ...s.connections, [id]: { ...s.connections[id], ...patch } } })),
    [],
  );
  const setRemember = useCallback((remember: boolean) => update({ remember }), [update]);
  // Clears credentials only — a base URL is not a secret, and losing a configured gateway to a
  // "clear key" button would be a surprise.
  const clearKeys = useCallback(() => setSettings((s) => ({ ...s, connections: stripKeys(s.connections) })), []);

  const modelFor = useCallback((id: LiveProviderId): string => settings.models[id] ?? liveProvider(id).defaultModel, [settings.models]);

  /**
   * The env map a run should receive: only the ACTIVE provider's connection, and only in Live mode.
   * That is the key plus, when configured, `<PROVIDER>_BASE_URL` — which is how an endpoint override
   * reaches the real request without the example code having to mention it.
   */
  const envForRun = useCallback((): Record<string, string> => {
    if (settings.mode !== "live") return {};
    return connectionEnv(settings.activeProvider, settings.connections[settings.activeProvider]);
  }, [settings.mode, settings.activeProvider, settings.connections]);

  /** Warm the weight cache for a local model (runs on the main thread) and drive the progress bar. */
  const preloadLocal = useCallback(async (model: string): Promise<void> => {
    setDownload({ status: "loading", progress: 0 });
    try {
      const { preload } = await import("mithril/transformers");
      // Pin the same dtype the assembled example uses, so the worker run reuses these cached weights, and pass
      // the catalog's `backends` so a WebGPU-only model throws a clear WEBGPU_REQUIRED error *before* a big download.
      const m = localModel(model);
      await preload(model, {
        ...(m?.dtype === undefined ? {} : { dtype: m.dtype }),
        ...(m?.backends === undefined ? {} : { backends: m.backends }),
        onProgress: (r) => setDownload({ status: "loading", progress: r.progress }),
      });
      setDownload({ status: "ready", progress: 1 });
    } catch (e) {
      setDownload({ status: "error", progress: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  return {
    ...settings,
    download,
    activeModel: modelFor(settings.activeProvider),
    modelFor,
    setMode,
    setProvider,
    setModel,
    setLocalModel,
    setKey,
    setConnection,
    setRemember,
    clearKeys,
    envForRun,
    preloadLocal,
  };
}
