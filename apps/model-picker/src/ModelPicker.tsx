/*
 * THE model picker. One component, both hosts.
 *
 * It answers one question — what runs this agent — and it keeps the consequences of that answer next
 * to the answer itself: which key it needs, where the request goes, whether anything leaves the
 * machine, and (via Test connection) whether the whole triple actually works. Before this, the
 * playground and the Studio each had their own half-answer and they drifted.
 *
 * Hosts differ only in which `kinds` they offer and how they store connection settings; everything
 * below that line is shared.
 */

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCAL_MODEL,
  hasWebGPU,
  LIVE_PROVIDERS,
  LOCAL_MODELS,
  liveProvider,
  requiresWebGPU,
  type CatalogModel,
  type LiveProviderId,
} from "@mithril/runner-web";
import { ModelCombobox } from "./ModelCombobox.tsx";
import { ProviderSetup } from "./ProviderSetup.tsx";
import type { ModelKind, ModelSelection, ProviderConnection, ProviderConnections } from "./types.ts";

export interface ModelPickerProps {
  readonly value: ModelSelection;
  readonly onChange: (value: ModelSelection) => void;
  /** Which segments this host offers, in display order. */
  readonly kinds: readonly ModelKind[];
  /** Per-provider key + base URL. Omit `onConnectionChange` to render the picker without connection fields. */
  readonly connections?: ProviderConnections;
  readonly onConnectionChange?: (provider: LiveProviderId, patch: ProviderConnection) => void;
  /** Hide the key field (a host that collects keys elsewhere) while keeping base URL + Test connection. */
  readonly showKey?: boolean;
  /**
   * What each segment falls back to the first time it is selected. Supply a host's REMEMBERED choice
   * here (the playground's last provider, say) so switching to Cloud lands on what the user last used
   * rather than on this component's opinion. Per-session switching still restores the live value.
   */
  readonly defaults?: Partial<Record<ModelKind, ModelSelection>>;
  /** Extra content rendered under the picker — the playground's local-download progress, for example. */
  readonly children?: React.ReactNode;
  readonly testId?: string;
}

const KIND_LABEL: Record<ModelKind, string> = { scripted: "Scripted", live: "Cloud", local: "Local", code: "Custom" };

const defaultFor = (kind: ModelKind): ModelSelection => {
  switch (kind) {
    case "scripted":
      return { kind: "scripted" };
    case "live":
      return { kind: "live", provider: "anthropic", model: liveProvider("anthropic").defaultModel };
    case "local":
      return { kind: "local", model: DEFAULT_LOCAL_MODEL };
    case "code":
      return { kind: "code", expr: "myModel" };
  }
};

export function ModelPicker({
  value,
  onChange,
  kinds,
  connections = {},
  onConnectionChange,
  showKey = true,
  defaults = {},
  children,
  testId = "model-picker",
}: ModelPickerProps) {
  // Remember each segment's last value so switching away and back doesn't discard a typed model id.
  const [stash, setStash] = useState<Partial<Record<ModelKind, ModelSelection>>>({});
  // Model ids fetched from a provider itself, once a successful connection test proves the key works.
  const [liveModels, setLiveModels] = useState<Partial<Record<LiveProviderId, readonly string[]>>>({});
  const [webgpu, setWebgpu] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void hasWebGPU().then((ok) => {
      if (alive) setWebgpu(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const switchKind = (kind: ModelKind): void => {
    if (kind === value.kind) return;
    setStash((s) => ({ ...s, [value.kind]: value }));
    onChange(stash[kind] ?? defaults[kind] ?? defaultFor(kind));
  };

  const provider = value.kind === "live" ? liveProvider(value.provider) : undefined;
  const fetched = value.kind === "live" ? liveModels[value.provider] : undefined;
  const options: readonly CatalogModel[] = useMemo(
    () => (fetched !== undefined ? fetched.map((id) => ({ id })) : (provider?.models ?? [])),
    [fetched, provider],
  );

  const isCustomLocal = value.kind === "local" && !LOCAL_MODELS.some((m) => m.id === value.model);
  const gpuOnly = value.kind === "local" && requiresWebGPU(value.model);

  return (
    <div className="mp-root" data-testid={testId}>
      {kinds.length > 1 && (
        <div className="mp-seg" role="tablist" aria-label="Model source">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={value.kind === k}
              className={value.kind === k ? "is-on" : ""}
              onClick={() => switchKind(k)}
              data-testid={`${testId}-kind-${k}`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {value.kind === "scripted" && (
        <p className="mp-note" data-testid={`${testId}-scripted-hint`}>
          Deterministic scripted turns — no key, no network, nothing leaves the page.
        </p>
      )}

      {value.kind === "live" && provider !== undefined && (
        <>
          <div className="mp-row">
            <select
              className="mp-select"
              aria-label="Provider"
              value={value.provider}
              onChange={(e) => {
                const id = e.target.value as LiveProviderId;
                onChange({ kind: "live", provider: id, model: liveProvider(id).defaultModel });
              }}
              data-testid={`${testId}-provider`}
            >
              {LIVE_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <ModelCombobox
              value={value.model}
              onChange={(model) => onChange({ kind: "live", provider: value.provider, model })}
              options={options}
              optionsAreLive={fetched !== undefined}
              placeholder={provider.defaultModel}
              testId={`${testId}-model`}
            />
          </div>

          {onConnectionChange !== undefined && (
            <ProviderSetup
              provider={value.provider}
              model={value.model}
              connection={connections[value.provider] ?? {}}
              onConnectionChange={(patch) => onConnectionChange(value.provider, patch)}
              onLiveModels={(id, ids) => setLiveModels((m) => ({ ...m, [id]: ids }))}
              showKey={showKey}
              testId={`${testId}-setup`}
            />
          )}

          <p className="mp-note" data-testid={`${testId}-live-hint`}>
            Prompts leave this machine, straight to the endpoint above. Your {provider.envVar} is stored only in this browser.
          </p>
        </>
      )}

      {value.kind === "local" && (
        <>
          <div className="mp-row">
            <select
              className="mp-select mp-grow"
              aria-label="On-device model"
              title={value.model}
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
              data-testid={`${testId}-local-model`}
            >
              {LOCAL_MODELS.map((m) => {
                const needsGpu = requiresWebGPU(m);
                return (
                  <option key={m.id} value={m.id} disabled={needsGpu && webgpu === false}>
                    {m.label} ({m.size}){needsGpu ? (webgpu === false ? " — needs WebGPU (unavailable)" : " — needs WebGPU") : ""}
                  </option>
                );
              })}
              <option value="__custom">Custom HF repo…</option>
            </select>
          </div>
          {isCustomLocal && (
            <input
              className="mp-input mp-mono"
              aria-label="Hugging Face repo id"
              placeholder="org/model-ONNX"
              value={value.model}
              spellCheck={false}
              onChange={(e) => onChange({ kind: "local", model: e.target.value })}
              data-testid={`${testId}-local-repo`}
            />
          )}
          <p className="mp-note" data-testid={`${testId}-local-hint`}>
            On-device. No key needed, and nothing leaves the browser after the one-time weight download.
          </p>
          {gpuOnly && (
            <p className="mp-note mp-warn" data-testid={`${testId}-webgpu-note`}>
              {webgpu === false
                ? "This model runs only on WebGPU, which isn’t available here — a run will fail with WEBGPU_REQUIRED. Pick another model or switch browsers."
                : "Requires WebGPU (ternary/2-bit build — no CPU/WASM fallback)."}
            </p>
          )}
        </>
      )}

      {value.kind === "code" && (
        <>
          <input
            className="mp-input mp-mono"
            aria-label="Model expression"
            value={value.expr}
            spellCheck={false}
            onChange={(e) => onChange({ kind: "code", expr: e.target.value })}
            data-testid={`${testId}-code-expr`}
          />
          <p className="mp-note">Any ModelInput expression you supply yourself — kept verbatim in the generated code.</p>
        </>
      )}

      {children}
    </div>
  );
}
