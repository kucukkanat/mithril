import { useEffect, useMemo, useRef, useState } from "react";
import { replay, type MithrilEvent } from "@mithril/core/protocol";
// The event inspector + state/span tree are the shared @mithril/devtools/ui components (single source of
// truth); the playground keeps only its bespoke editor, runner, and HITL flow.
import { EventList, StateTree } from "@mithril/devtools/ui";
import "@mithril/devtools/ui.css";
import { CodeEditor } from "./CodeEditor.tsx";
import { ModelBar } from "./ModelBar.tsx";
import { useRunner } from "../playground/useRunner.ts";
import { useProviderSettings } from "../playground/useProviderSettings.ts";
import { DEFAULT_PRESET, PRESETS, type Preset } from "../playground/presets.ts";
import { LOCAL_MODELS, assembleExample, liveProvider, type LiveProviderId, type ProviderMode, type Target } from "../playground/providers.ts";
import { codeFromHash, presetFromHash, shareUrl } from "../playground/share.ts";
import "./playground.css";

type Tab = "events" | "output" | "state";

function approvalDetails(request: unknown): { name: string; input: unknown } {
  const r = request as { payload?: { name?: unknown; input?: unknown } } | undefined;
  return { name: String(r?.payload?.name ?? "tool"), input: r?.payload?.input };
}

function lastObjectFinal(events: readonly MithrilEvent[]): unknown {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e && e.type === "object.final") return (e as unknown as { value: unknown }).value;
  }
  return undefined;
}

function localModelLabel(id: string): string {
  return LOCAL_MODELS.find((m) => m.id === id)?.label ?? id;
}

export default function Playground({ embedded = false }: { embedded?: boolean }) {
  const hashCode = useMemo(() => codeFromHash(), []);
  // A `#preset=<id>` deep-link (from a guide's Runnable) boots pristine so the "Run against" picker still
  // re-assembles the example; it wins over `#code=`. Fall back to the default preset when neither is present.
  const linkedPreset = useMemo(() => {
    const id = presetFromHash();
    return id ? PRESETS.find((p) => p.id === id) : undefined;
  }, []);
  const bootPreset = linkedPreset ?? (hashCode ? undefined : DEFAULT_PRESET);
  const initial = useMemo(
    () => (bootPreset ? assembleExample(bootPreset.parts, { kind: "scripted" }) : (hashCode ?? "")),
    [bootPreset, hashCode],
  );
  const [presetId, setPresetId] = useState<string>(bootPreset ? bootPreset.id : "custom");
  const [code, setCode] = useState<string>(initial);
  const [tab, setTab] = useState<Tab>("events");
  const [cursor, setCursor] = useState(0);
  const [pinned, setPinned] = useState(true);
  const [copied, setCopied] = useState(false);

  const runner = useRunner();
  const settings = useProviderSettings();
  const events = runner.events;

  // Provider/keys UI is full-page only; the embedded home demo stays a scripted showcase.
  const showProviderUI = !embedded;
  const [pendingRun, setPendingRun] = useState(false);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  // generatedRef holds the last code WE assembled (trusted). Provider switches re-assemble only while the
  // editor still matches it; hand-edited or shared code is left alone (and a live run must confirm first).
  const generatedRef = useRef<string | null>(bootPreset ? initial : null);
  const isPristine = () => generatedRef.current !== null && code === generatedRef.current;

  const applyGenerated = (next: string, id: string) => {
    setCode(next);
    generatedRef.current = next;
    setPresetId(id);
    setLiveConfirmed(false);
    setPendingRun(false); // any preset/target change dismisses a stale key-safety banner
  };

  // Follow the tail while a run streams, unless the user has scrubbed back.
  useEffect(() => {
    if (pinned) setCursor(events.length);
  }, [events.length, pinned]);

  const finalState = useMemo(() => replay([...events]), [events]);
  const text = useMemo(
    () => events.flatMap((e) => (e.type === "text.delta" ? [(e as unknown as { delta: string }).delta] : [])).join(""),
    [events],
  );
  const objectFinal = useMemo(() => lastObjectFinal(events), [events]);

  const effectiveMode: ProviderMode = showProviderUI ? settings.mode : "scripted";
  const targetFor = (mode: ProviderMode, providerId: LiveProviderId, liveModel: string, localModel: string): Target =>
    mode === "local"
      ? { kind: "local", model: localModel }
      : mode === "live"
        ? { kind: "live", provider: liveProvider(providerId), model: liveModel }
        : { kind: "scripted" };
  const target = targetFor(effectiveMode, settings.activeProvider, settings.activeModel, settings.localModel);

  // Re-assemble the CURRENT example for a new target, but only while the editor is still pristine.
  const reassemble = (t: Target, opts?: { readonly reset?: boolean }) => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p || !isPristine()) return;
    applyGenerated(assembleExample(p.parts, t), p.id);
    if (opts?.reset) {
      runner.reset();
      setCursor(0);
    }
  };

  const startRun = () => {
    setPinned(true);
    setCursor(0);
    setTab("events");
    setPendingRun(false);
    runner.run(code, { mode: effectiveMode, env: showProviderUI ? settings.envForRun() : {} });
  };
  const doRun = () => {
    // Injecting a key into edited (or shared) code could exfiltrate it — confirm once per session.
    if (effectiveMode === "live" && !isPristine() && !liveConfirmed) {
      setPendingRun(true);
      return;
    }
    startRun();
  };

  // Picking an example assembles it for the CURRENT target — so the same example runs on whatever
  // model you've picked in the "Run against" bar (scripted by default).
  const pickPreset = (p: Preset) => {
    applyGenerated(assembleExample(p.parts, target), p.id);
    setCursor(0);
    runner.reset();
  };

  // The one "Run against" dropdown: pick scripted / a cloud provider / a local model. Re-assembles the
  // current example for the new target (pristine-guarded, so edits survive); local models auto-download.
  const selectTarget = (value: string) => {
    if (value.startsWith("live:")) {
      const id = value.slice(5) as LiveProviderId;
      settings.setMode("live");
      settings.setProvider(id);
      reassemble(targetFor("live", id, settings.modelFor(id), settings.localModel), { reset: true });
    } else if (value.startsWith("local:")) {
      const m = value.slice(6);
      settings.setMode("local");
      settings.setLocalModel(m);
      reassemble(targetFor("local", settings.activeProvider, settings.activeModel, m), { reset: true });
      void settings.preloadLocal(m); // auto-load the weights the moment you pick it
    } else {
      settings.setMode("scripted");
      reassemble(targetFor("scripted", settings.activeProvider, settings.activeModel, settings.localModel), { reset: true });
    }
  };
  const onModelChange = (id: LiveProviderId, m: string) => {
    settings.setModel(id, m);
    reassemble(targetFor("live", id, m, settings.localModel));
  };

  const scrub = (c: number) => {
    setPinned(false);
    setCursor(c);
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const running = runner.status === "running";
  const approval = runner.suspended ? approvalDetails(runner.suspended.request) : null;
  const result = runner.result as { status?: string; output?: unknown } | null;
  // resume() returns the final RunResult without re-streaming events, so once the
  // worker reports "done" we trust the result's status over the replayed log.
  const displayStatus =
    runner.status === "idle"
      ? "idle"
      : runner.status === "running"
        ? "running"
        : runner.status === "suspended"
          ? "suspended"
          : runner.status === "error"
            ? "error"
            : (result?.status ?? finalState.status);
  const outputText = text || (typeof result?.output === "string" ? result.output : "");
  const modeChip =
    effectiveMode === "live"
      ? `live · ${liveProvider(settings.activeProvider).label}`
      : effectiveMode === "local"
        ? `local · ${localModelLabel(settings.localModel)}`
        : "scripted · offline";
  const activeProvider = liveProvider(settings.activeProvider);
  const targetValue =
    effectiveMode === "live" ? `live:${settings.activeProvider}` : effectiveMode === "local" ? `local:${settings.localModel}` : "scripted";

  return (
    <div className={`pg${embedded ? " pg-embedded" : ""}`} data-testid="playground">
      <div className="pg-toolbar" data-testid="playground-toolbar">
        <div className="pg-presets" role="tablist" aria-label="Examples" data-testid="playground-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`pg-preset${presetId === p.id ? " active" : ""}`}
              onClick={() => pickPreset(p)}
              title={p.blurb}
              data-testid={`playground-preset-${p.id}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="pg-actions" data-testid="playground-actions">
          {running ? (
            <button className="pg-btn pg-stop" onClick={runner.reset} data-testid="playground-stop-button">
              ■ Stop
            </button>
          ) : (
            <button className="pg-btn pg-run" onClick={doRun} data-testid="playground-run-button">
              ▶ Run <kbd>⌘↵</kbd>
            </button>
          )}
          <button className="pg-btn" onClick={share} data-testid="playground-share-button">
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {showProviderUI && (
        <ModelBar settings={settings} targetValue={targetValue} onSelectTarget={selectTarget} onModelChange={onModelChange} />
      )}

      {pendingRun && (
        <div className="pg-confirm" data-testid="playground-live-confirm">
          <div className="pg-confirm-head">
            <span className="pg-approval-badge warn">key safety</span>
            <span>You've edited this code</span>
          </div>
          <p>
            Running in Live mode injects your <code>{activeProvider.envVar}</code> into it. Edited code can send that key
            anywhere it calls — this provider normally talks to <code>{activeProvider.host}</code>. Only run code you trust.
          </p>
          <div className="pg-confirm-actions">
            <button
              className="pg-btn pg-run"
              onClick={() => {
                setLiveConfirmed(true);
                startRun();
              }}
              data-testid="playground-confirm-run-anyway-button"
            >
              Run anyway
            </button>
            <button className="pg-btn" onClick={() => setPendingRun(false)} data-testid="playground-confirm-cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="pg-body">
        <div className="pg-editor" data-testid="playground-editor-pane">
          <CodeEditor value={code} onChange={setCode} onRun={doRun} />
        </div>

        <div className="pg-panel" data-testid="playground-panel">
          <div className="pg-tabs" role="tablist" data-testid="playground-tabs">
            {(["events", "output", "state"] as const).map((t) => (
              <button
                key={t}
                className={`pg-tab${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
                data-testid={`playground-tab-${t}`}
              >
                {t === "events" ? `Events${events.length ? ` (${events.length})` : ""}` : t}
              </button>
            ))}
          </div>

          {running && runner.download && runner.download.status !== "done" && (
            <div
              className="pg-progress pg-progress-run"
              role="progressbar"
              aria-valuenow={Math.round(runner.download.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Loading local model"
              data-testid="playground-run-download-progress"
            >
              <div className="pg-progress-fill" style={{ width: `${Math.round(runner.download.progress * 100)}%` }} />
            </div>
          )}

          {approval && (
            <div className="pg-approval" data-testid="playground-approval">
              <div className="pg-approval-head">
                <span className="pg-approval-badge">approval required</span>
                <code>{approval.name}({JSON.stringify(approval.input)})</code>
              </div>
              <p>The run is suspended <em>before</em> the tool executes. Nothing side-effecting has run.</p>
              <div className="pg-approval-actions">
                <button className="pg-btn pg-run" onClick={() => runner.resume({ kind: "approve" })} data-testid="playground-approval-approve-button">
                  Approve
                </button>
                <button
                  className="pg-btn"
                  onClick={() => runner.resume({ kind: "reject", message: "Denied in playground" })}
                  data-testid="playground-approval-reject-button"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          <div className="pg-panel-body" data-testid="playground-panel-body">
            {tab === "events" && (
              <EventList events={events} cursor={cursor} onSelect={scrub} follow={pinned} />
            )}
            {tab === "state" && <StateTree events={events} cursor={cursor} />}
            {tab === "output" && (
              <div className="pg-output" data-testid="playground-output">
                {(runner.errorHint || runner.error) && (
                  <div className="pg-error" data-testid="playground-output-error">
                    {runner.errorHint ?? runner.error}
                    {runner.errorHint && runner.error && (
                      <details className="pg-error-raw">
                        <summary>Details</summary>
                        <pre>{runner.error}</pre>
                      </details>
                    )}
                  </div>
                )}
                {outputText && <p className="out-text" data-testid="playground-output-text">{outputText}</p>}
                {objectFinal !== undefined && (
                  <pre className="out-object" data-testid="playground-output-object">{JSON.stringify(objectFinal, null, 2)}</pre>
                )}
                {runner.logs.length > 0 && (
                  <div className="out-logs" data-testid="playground-output-logs">
                    {runner.logs.map((l, i) => (
                      <div key={i} className={`log-line log-${l.level}`}>
                        {l.text}
                      </div>
                    ))}
                  </div>
                )}
                {!runner.error && !runner.errorHint && !outputText && objectFinal === undefined && runner.logs.length === 0 && (
                  <div className="pg-empty" data-testid="playground-output-empty">Output, structured results, and console logs appear here.</div>
                )}
              </div>
            )}
          </div>

          {(tab === "events" || tab === "state") && events.length > 0 && (
            <div className="pg-scrubber" data-testid="playground-scrubber">
              <input
                type="range"
                min={0}
                max={events.length}
                value={cursor}
                onChange={(e) => scrub(Number(e.target.value))}
                aria-label="Time-travel cursor"
                data-testid="playground-scrubber-input"
              />
              <span className="pg-scrubber-label">
                {cursor} / {events.length}
              </span>
            </div>
          )}

          <div className="pg-status" data-testid="playground-status">
            <span className={`pg-badge s-${displayStatus}`}>{displayStatus}</span>
            {showProviderUI && <span className={`pg-mode-chip mode-${effectiveMode}`}>{modeChip}</span>}
            <span>{finalState.messages.filter((m) => m.role === "assistant").length} steps</span>
            <span>{events.length} events</span>
            <span>${(finalState.usage.costMicroUsd / 1e6).toFixed(6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
