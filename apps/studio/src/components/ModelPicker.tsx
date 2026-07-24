import { useEffect, useState } from "react";
import { hasWebGPU, LIVE_PROVIDERS, LOCAL_MODELS, liveProvider, requiresWebGPU, type LiveProviderId } from "@mithril/runner-web";
import type { ModelSpec } from "@mithril/spec";

/*
 * The three-segment model picker for an agent: a remote BYOK provider, an on-device model, or a
 * custom expression (verbatim escape hatch). Backed by the shared @mithril/runner-web catalog.
 * Switching segments remembers each mode's last value, so a typed model id / custom expr is never lost.
 */

export interface ModelPickerProps {
  readonly value: ModelSpec;
  readonly onChange: (model: ModelSpec) => void;
}

// A few well-known model ids per provider to jog recall — free text is still allowed (it's a datalist).
const SUGGESTED: Record<LiveProviderId, readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "o4-mini"],
  anthropic: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
};

const defaultFor = (kind: ModelSpec["kind"]): ModelSpec =>
  kind === "live"
    ? { kind: "live", provider: "openai", model: liveProvider("openai").defaultModel }
    : kind === "local"
      ? { kind: "local", model: LOCAL_MODELS[0]!.id }
      : { kind: "code", expr: { code: "myModel" } };

export function ModelPicker({ value, onChange }: ModelPickerProps) {
  // Remember each mode's last value so a segment switch restores it instead of resetting to a default.
  const [stash, setStash] = useState<Partial<Record<ModelSpec["kind"], ModelSpec>>>({});
  // Probe WebGPU once: `undefined` while unknown, `false` once confirmed unsupported (disable WebGPU-only models).
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
  const switchKind = (kind: ModelSpec["kind"]): void => {
    if (kind === value.kind) return;
    setStash((s) => ({ ...s, [value.kind]: value }));
    onChange(stash[kind] ?? defaultFor(kind));
  };

  const isCustomLocal = value.kind === "local" && !LOCAL_MODELS.some((m) => m.id === value.model);
  const gpuOnlySelected = value.kind === "local" && requiresWebGPU(value.model);

  return (
    <div className="field-group" data-testid="model-picker">
      <div className="seg">
        <button className={value.kind === "live" ? "seg-on" : ""} data-testid="model-kind-live" onClick={() => switchKind("live")}>
          Cloud
        </button>
        <button className={value.kind === "local" ? "seg-on" : ""} data-testid="model-kind-local" onClick={() => switchKind("local")}>
          Local
        </button>
        <button className={value.kind === "code" ? "seg-on" : ""} data-testid="model-kind-code" onClick={() => switchKind("code")}>
          Custom
        </button>
      </div>

      {value.kind === "live" && (
        <>
          <label data-testid="model-live-provider-field">
            Provider
            <select
              data-testid="model-live-provider"
              value={value.provider}
              onChange={(e) => {
                const provider = e.target.value as LiveProviderId;
                onChange({ kind: "live", provider, model: liveProvider(provider).defaultModel });
              }}
            >
              {LIVE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label data-testid="model-live-model-field">
            Model
            <input data-testid="model-live-model" list={`models-${value.provider}`} value={value.model} onChange={(e) => onChange({ ...value, model: e.target.value })} />
            <datalist id={`models-${value.provider}`}>
              {SUGGESTED[value.provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
          <p className="hint">
            Runs with your {liveProvider(value.provider).envVar} — add it in Settings or on the Run page. Sent only to {liveProvider(value.provider).host}.
          </p>
        </>
      )}

      {value.kind === "local" && (
        <>
          <label data-testid="model-local-model-field">
            Model
            <select
              data-testid="model-local-model"
              value={isCustomLocal ? "__custom" : value.model}
              onChange={(e) => {
                const id = e.target.value;
                if (id === "__custom") {
                  onChange({ kind: "local", model: "" });
                  return;
                }
                const dtype = LOCAL_MODELS.find((m) => m.id === id)?.dtype;
                onChange({ kind: "local", model: id, ...(dtype === undefined ? {} : { dtype }) });
              }}
            >
              {LOCAL_MODELS.map((m) => {
                const gpuOnly = requiresWebGPU(m);
                const disabled = gpuOnly && webgpu === false;
                return (
                  <option key={m.id} value={m.id} disabled={disabled}>
                    {m.label} ({m.size}){gpuOnly ? (disabled ? " — needs WebGPU (unavailable)" : " — needs WebGPU") : ""}
                  </option>
                );
              })}
              <option value="__custom">Custom HF repo…</option>
            </select>
          </label>
          {gpuOnlySelected && (
            <p className="hint" data-testid="model-local-webgpu-note">
              {webgpu === false
                ? "⚠ This model runs only on WebGPU, unavailable in this browser — a run will fail with WEBGPU_REQUIRED. Pick another model or switch browsers."
                : "Requires WebGPU (ternary/2-bit build — no CPU/WASM fallback)."}
            </p>
          )}
          {isCustomLocal && (
            <label data-testid="model-local-repo-field">
              Repo id
              <input data-testid="model-local-repo" placeholder="org/model-ONNX" value={value.model} onChange={(e) => onChange({ ...value, model: e.target.value })} />
            </label>
          )}
          <p className="hint">On-device via WebGPU/WASM — no key, no network after the one-time weight download.</p>
        </>
      )}

      {value.kind === "code" && (
        <label data-testid="model-code-expr-field">
          Model expression
          <input data-testid="model-code-expr" className="mono" value={value.expr.code} onChange={(e) => onChange({ kind: "code", expr: { code: e.target.value } })} />
        </label>
      )}
    </div>
  );
}
