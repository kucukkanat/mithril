/*
 * Provider setup: the key, the optional endpoint, and the one button that proves they work.
 *
 * The three fields are shown together because they fail together — a 401 could be any of them, and
 * asking the user to guess is the failure this component exists to remove. "Test connection" sends
 * one real one-token completion through the exact path a run takes, then marks WHICH field to fix.
 *
 * The endpoint is optional everywhere it appears: blank means the provider's own API, and the
 * placeholder shows that default so nobody has to remember it to restore it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchProviderModels,
  liveProvider,
  resolveBaseUrl,
  testConnection,
  type ConnectionFault,
  type ConnectionResult,
  type LiveProviderId,
} from "@mithril/runner-web";
import type { ProviderConnection } from "./types.ts";

export interface ProviderSetupProps {
  readonly provider: LiveProviderId;
  readonly model: string;
  readonly connection: ProviderConnection;
  /** Receives a PARTIAL update (just the field that changed) — the host merges it into its own store. */
  readonly onConnectionChange: (patch: ProviderConnection) => void;
  /** Called with the provider's own model ids once a listing succeeds, so the combobox can search them. */
  readonly onLiveModels?: (provider: LiveProviderId, ids: readonly string[]) => void;
  /** Render the key field. Off in hosts that own the key elsewhere (the Studio's Settings page). */
  readonly showKey?: boolean;
  readonly testId?: string;
}

type TestState = { readonly status: "idle" } | { readonly status: "testing" } | { readonly status: "done"; readonly result: ConnectionResult };

export function ProviderSetup({
  provider,
  model,
  connection,
  onConnectionChange,
  onLiveModels,
  showKey = true,
  testId = "provider-setup",
}: ProviderSetupProps) {
  const p = liveProvider(provider);
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const abort = useRef<AbortController | null>(null);

  const key = connection.apiKey ?? "";
  const baseUrl = connection.baseUrl ?? "";
  const effective = resolveBaseUrl(provider, baseUrl);
  const overridden = baseUrl.trim().length > 0 && effective !== p.defaultBaseUrl;

  // A result describes one exact (key, endpoint, model) triple — as soon as any of them changes it is
  // stale, and a stale green tick is worse than no tick.
  useEffect(() => setTest({ status: "idle" }), [provider, model, key, baseUrl]);
  useEffect(() => () => abort.current?.abort(), []);

  const runTest = useCallback(async (): Promise<void> => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setTest({ status: "testing" });
    const result = await testConnection({ provider, model, apiKey: key, baseUrl, signal: controller.signal });
    if (controller.signal.aborted) return;
    setTest({ status: "done", result });
    // A working connection is also the moment the real model list becomes available — fetch it now so
    // the combobox searches what this account can actually call.
    if (result.ok && onLiveModels !== undefined) {
      const ids = await fetchProviderModels({ provider, apiKey: key, baseUrl, signal: controller.signal });
      if (ids !== undefined && !controller.signal.aborted) onLiveModels(provider, ids);
    }
  }, [provider, model, key, baseUrl, onLiveModels]);

  return (
    <div className="mp-setup" data-testid={testId}>
      {showKey && (
        <label className="mp-field">
          <span className="mp-label">
            API key
            <a className="mp-link" href={p.consoleUrl} target="_blank" rel="noreferrer" data-testid={`${testId}-console-link`}>
              get one ↗
            </a>
          </span>
          <input
            className="mp-input"
            type="password"
            value={key}
            placeholder={p.envVar}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${p.label} API key`}
            onChange={(e) => onConnectionChange({ apiKey: e.target.value })}
            data-testid={`${testId}-key`}
          />
        </label>
      )}

      {p.supportsBaseUrl && (
        <label className="mp-field">
          <span className="mp-label">
            Base URL <span className="mp-optional">optional</span>
          </span>
          <input
            className="mp-input mp-mono"
            type="url"
            value={baseUrl}
            placeholder={p.defaultBaseUrl}
            spellCheck={false}
            autoComplete="off"
            aria-label={`${p.label} base URL`}
            onChange={(e) => onConnectionChange({ baseUrl: e.target.value })}
            data-testid={`${testId}-base-url`}
          />
        </label>
      )}

      <div className="mp-setup-foot">
        <button
          type="button"
          className="mp-test-button"
          onClick={() => void runTest()}
          disabled={test.status === "testing"}
          data-testid={`${testId}-test`}
        >
          {test.status === "testing" ? "Testing…" : "Test connection"}
        </button>

        {test.status === "idle" && (
          <span className="mp-note" data-testid={`${testId}-target`}>
            {overridden ? (
              <>
                Requests go to <code>{effective}</code> instead of {p.label}’s default.
              </>
            ) : (
              <>
                Sends one tiny request to <code>{effective}</code> to check the key, endpoint and model.
              </>
            )}
          </span>
        )}

        {test.status === "done" && test.result.ok && (
          <span className="mp-note mp-ok" role="status" data-testid={`${testId}-result-ok`}>
            ✓ Connected — <code>{model}</code> answered from <code>{test.result.endpoint}</code> in {test.result.latencyMs} ms.
          </span>
        )}

        {test.status === "done" && !test.result.ok && (
          <span className="mp-note mp-bad" role="alert" data-testid={`${testId}-result-error`} data-fault={test.result.fault}>
            ✕ {FAULT_LABEL[test.result.fault]} — {test.result.message}
          </span>
        )}
      </div>
    </div>
  );
}

/** The one-word headline per fault, so the fix is obvious before the detail is read. */
const FAULT_LABEL: Record<ConnectionFault, string> = {
  key: "Key rejected",
  baseUrl: "Endpoint unreachable",
  model: "Model not available",
  network: "Provider error",
  unknown: "Failed",
};
