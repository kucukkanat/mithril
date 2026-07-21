import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LOCAL_MODEL, LIVE_PROVIDERS, liveProvider, localModel, type LiveProviderId, type ProviderMode } from "./providers.ts";

/*
 * Owns the ⚙ settings panel's state — run mode, the active remote provider + model, per-provider
 * keys, and the local-model download — plus its persistence. Mirrors `useRunner`'s shape (a state
 * object + action callbacks) so `Playground.tsx` consumes both the same way.
 *
 * Security: keys live in `localStorage` (the app's first app-data use of it — same key style as
 * Starlight's `starlight-theme`). Turning `remember` off keeps prefs but drops keys from storage.
 * `envForRun()` exposes ONLY the active provider's single key to a run — never the whole set.
 */

const STORAGE_KEY = "mithril-playground-settings";

type KeyMap = Partial<Record<LiveProviderId, string>>;
type ModelMap = Partial<Record<LiveProviderId, string>>;

interface Settings {
  readonly mode: ProviderMode;
  readonly activeProvider: LiveProviderId;
  readonly models: ModelMap;
  readonly localModel: string;
  readonly remember: boolean;
  readonly keys: KeyMap;
}

const DEFAULTS: Settings = {
  mode: "scripted",
  activeProvider: "openai",
  models: {},
  localModel: DEFAULT_LOCAL_MODEL,
  remember: true,
  keys: {},
};

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
      // Keys are only trusted from storage when the user opted to remember them.
      keys: p.remember !== false && typeof p.keys === "object" && p.keys !== null ? p.keys : {},
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(s: Settings): void {
  if (typeof localStorage === "undefined") return;
  const toStore: Settings = s.remember ? s : { ...s, keys: {} };
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
  const setKey = useCallback((id: LiveProviderId, key: string) => setSettings((s) => ({ ...s, keys: { ...s.keys, [id]: key } })), []);
  const setRemember = useCallback((remember: boolean) => update({ remember }), [update]);
  const clearKeys = useCallback(() => setSettings((s) => ({ ...s, keys: {} })), []);

  const modelFor = useCallback((id: LiveProviderId): string => settings.models[id] ?? liveProvider(id).defaultModel, [settings.models]);

  /** The env map a run should receive: only the active provider's key, only in Live mode. */
  const envForRun = useCallback((): Record<string, string> => {
    if (settings.mode !== "live") return {};
    const p = liveProvider(settings.activeProvider);
    const key = settings.keys[settings.activeProvider]?.trim();
    return key ? { [p.envVar]: key } : {};
  }, [settings.mode, settings.activeProvider, settings.keys]);

  /** Warm the weight cache for a local model (runs on the main thread) and drive the progress bar. */
  const preloadLocal = useCallback(async (model: string): Promise<void> => {
    setDownload({ status: "loading", progress: 0 });
    try {
      const { preload } = await import("mithril/transformers");
      // Pin the same dtype the assembled example uses, so the worker run reuses these cached weights.
      const dtype = localModel(model)?.dtype;
      await preload(model, { ...(dtype === undefined ? {} : { dtype }), onProgress: (r) => setDownload({ status: "loading", progress: r.progress }) });
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
    setRemember,
    clearKeys,
    envForRun,
    preloadLocal,
  };
}
