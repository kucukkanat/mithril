import { useEffect, useState } from "react";
import { hasWebGPU, LIVE_PROVIDERS, LOCAL_MODELS, liveProvider, requiresWebGPU, type LiveProviderId } from "../playground/providers.ts";
import type { useProviderSettings } from "../playground/useProviderSettings.ts";

/*
 * The one-line "Run against" bar — always visible in the toolbar, no ⚙ round-trip. A single grouped
 * dropdown picks the run target (scripted / a cloud provider / a local model). Cloud targets reveal an
 * inline key field; local targets auto-download and show progress (the parent triggers preload on select).
 * Styled from tokens (playground.css); both themes.
 */

type Settings = ReturnType<typeof useProviderSettings>;

interface Props {
  readonly settings: Settings;
  /** `"scripted" | "live:<providerId>" | "local:<modelId>"`. */
  readonly targetValue: string;
  readonly onSelectTarget: (value: string) => void;
  readonly onModelChange: (id: LiveProviderId, model: string) => void;
}

export function ModelBar({ settings, targetValue, onSelectTarget, onModelChange }: Props) {
  const { mode, download } = settings;
  const provider = liveProvider(settings.activeProvider);
  const key = settings.keys[settings.activeProvider] ?? "";
  const pct = Math.round(download.progress * 100);

  // Probe WebGPU once on mount: `undefined` while unknown (keep WebGPU-only models selectable + warn),
  // `false` once confirmed unsupported (disable them), `true` when available.
  const [webgpu, setWebgpu] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void hasWebGPU().then((ok) => {
      if (live) setWebgpu(ok);
    });
    return () => {
      live = false;
    };
  }, []);

  const selectedModel = targetValue.startsWith("local:") ? targetValue.slice("local:".length) : undefined;
  const gpuOnlySelected = selectedModel !== undefined && requiresWebGPU(selectedModel);

  return (
    <div className="pg-modelbar" data-testid="model-bar">
      <label className="pg-mb-label" htmlFor="pg-target">
        Run against
      </label>
      <select
        id="pg-target"
        className="pg-mb-select"
        value={targetValue}
        onChange={(e) => onSelectTarget(e.target.value)}
        data-testid="model-bar-target-select"
      >
        <option value="scripted">Scripted · offline</option>
        <optgroup label="Cloud · bring your own key">
          {LIVE_PROVIDERS.map((p) => (
            <option key={p.id} value={`live:${p.id}`}>
              {p.label} · {p.defaultModel}
            </option>
          ))}
        </optgroup>
        <optgroup label="Local · in-browser">
          {LOCAL_MODELS.map((m) => {
            const gpuOnly = requiresWebGPU(m);
            const disabled = gpuOnly && webgpu === false;
            return (
              <option key={m.id} value={`local:${m.id}`} disabled={disabled}>
                {m.label} · {m.size}
                {gpuOnly ? (disabled ? " · needs WebGPU (unavailable)" : " · needs WebGPU") : ""}
              </option>
            );
          })}
        </optgroup>
      </select>

      {mode === "scripted" && (
        <span className="pg-mb-hint" data-testid="model-bar-scripted-hint">
          Deterministic scripted turns — no key, no network.
        </span>
      )}

      {mode === "live" && (
        <div className="pg-mb-detail" data-testid="model-bar-live-detail">
          <input
            className="pg-mb-model"
            value={settings.modelFor(settings.activeProvider)}
            onChange={(e) => onModelChange(settings.activeProvider, e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label="Model id"
            data-testid="model-bar-model-input"
          />
          <input
            className="pg-mb-key"
            type="password"
            value={key}
            placeholder={`Paste ${provider.envVar}`}
            onChange={(e) => settings.setKey(settings.activeProvider, e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label={provider.envVar}
            data-testid="model-bar-key-input"
          />
          <a
            className="pg-link"
            href={provider.consoleUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="model-bar-get-key-link"
          >
            Get key ↗
          </a>
          <span className="pg-mb-hint">
            key stays in your browser → <code>{provider.host}</code>
            {key && (
              <>
                {" · "}
                <button className="pg-mb-clear" onClick={settings.clearKeys} data-testid="model-bar-clear-key-button">
                  clear
                </button>
              </>
            )}
          </span>
        </div>
      )}

      {mode === "local" && (
        <div className="pg-mb-detail" data-testid="model-bar-local-detail">
          {gpuOnlySelected && webgpu === false && (
            <span className="pg-mb-hint warn" data-testid="model-bar-webgpu-warning">
              ⚠ This model runs only on WebGPU, which isn’t available in this browser — the run will fail with a WEBGPU_REQUIRED error. Pick another model or use a WebGPU-capable browser.
            </span>
          )}
          {gpuOnlySelected && webgpu !== false && (
            <span className="pg-mb-hint warn" data-testid="model-bar-webgpu-note">
              Requires WebGPU (ternary/2-bit build — no CPU/WASM fallback).
            </span>
          )}
          {download.status === "loading" && (
            <>
              <div
                className="pg-progress pg-mb-progress"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Loading model"
                data-testid="model-bar-download-progress"
              >
                <div className="pg-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="pg-mb-hint">Loading model… {pct}%</span>
            </>
          )}
          {download.status === "ready" && <span className="pg-mb-hint ok">✓ Loaded — runs on-device, no key, no network.</span>}
          {download.status === "idle" && <span className="pg-mb-hint">Downloads once on select, then runs on-device (best-effort at tools).</span>}
          {download.status === "error" && <span className="pg-mb-hint warn">{download.error ?? "Download failed."}</span>}
        </div>
      )}
    </div>
  );
}
