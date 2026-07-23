import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import { createRunnerClient, liveProvider, localModel } from "@mithril/runner-web";
import type { MithrilEvent } from "@mithril/core/protocol";
import { generateProject, type EntryMessage } from "@mithril/spec";
import { RunInspector } from "@mithril/devtools/ui";
import { useProjectStore } from "../state/projectStore.ts";
import { envForSpec, liveProvidersIn, usesLocalModel, useSettingsStore } from "../state/settingsStore.ts";
import { useUiStore } from "../state/uiStore.ts";
import { TopBar } from "../components/TopBar.tsx";

/*
 * The run view: a chat pane driving the entry input, and the devtools RunInspector over the live
 * event stream (meters, time-travel, span tree, suspension card — approve/reject/edit/resolve all
 * flow through onResolve → client.resume). A missing live-provider key is fixed inline (no Settings
 * detour); the local-model download is announced before the first run.
 */

const textOf = (events: readonly MithrilEvent[]): string =>
  events.flatMap((e) => (e.type === "text.delta" ? [e.delta] : [])).join("");

export function RunPage() {
  const { id } = useParams<{ id: string }>();
  const store = useProjectStore();
  const settings = useSettingsStore();
  const [draft, setDraft] = useState("");
  const [confirmedLive, setConfirmedLive] = useState(false);
  const lastStatus = useRef<string>("idle");

  useEffect(() => {
    if (id !== undefined && store.projectId !== id) void store.open(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const client = useMemo(
    () =>
      createRunnerClient(
        () => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" }),
      ),
    [],
  );
  useEffect(() => () => client.stop(), [client]);
  const run = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);

  const spec = store.spec;

  // ⌘↵ / palette "Run the agent" sets a one-shot intent; consume it here and route through start() so the
  // keyboard path reuses the SAME missing-key + hand-edited-live consent gates as the buttons (never bypass).
  const runRequested = useUiStore((s) => s.runRequested);
  const consumeRun = useUiStore((s) => s.consumeRun);
  const coachDismissed = useUiStore((s) => s.coachDismissed);
  const dismissCoach = useUiStore((s) => s.dismissCoach);
  // start() is declared after the early return; hold the latest in a ref so this pre-return effect can call it.
  const startRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!runRequested) return;
    if (store.spec === null) return; // spec still loading — the effect re-fires when it loads (spec is a dep)
    consumeRun();
    startRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runRequested, store.spec]);

  // When a run finishes, fold the assistant's reply into the persisted chat history so the next
  // send carries the full conversation.
  useEffect(() => {
    if (run.status === lastStatus.current) return;
    lastStatus.current = run.status;
    if (run.status !== "done" || spec === null) return;
    const reply = textOf(run.events);
    if (reply.length === 0) return;
    store.updateSpec((s) => {
      const history: EntryMessage[] =
        typeof s.entry.input === "string" ? [{ role: "user", content: s.entry.input }] : [...s.entry.input];
      return { ...s, entry: { ...s.entry, input: [...history, { role: "assistant", content: reply }] } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.status]);

  if (spec === null) return <div className="page-empty" data-testid="run-loading">Loading project…</div>;

  const { env, missing } = envForSpec(spec, settings.keys);
  const liveIds = liveProvidersIn(spec);
  const local = usesLocalModel(spec);
  const entryAgent = spec.decls.find((d) => d.kind === "agent" && d.id === spec.entry.target);
  const localSize = entryAgent?.kind === "agent" && entryAgent.model.kind === "local" ? localModel(entryAgent.model.model)?.size : undefined;
  const messages: readonly EntryMessage[] =
    typeof spec.entry.input === "string" ? [{ role: "user", content: spec.entry.input }] : spec.entry.input;

  const blockedByKey = missing.length > 0;
  const running = run.status === "running" || run.status === "suspended";
  const hasRun = run.events.length > 0 || run.status === "done" || run.status === "error";
  const streamText = textOf(run.events);

  const start = (nextSpec = spec): void => {
    if (blockedByKey) return;
    if (liveIds.length > 0 && store.handEdited && !confirmedLive) {
      const hosts = liveIds.map((p) => liveProvider(p).host).join(", ");
      const ok = window.confirm(
        `This project's code was hand-edited this session. Running live sends your API key(s) with requests to: ${hosts}. Continue?`,
      );
      if (!ok) return;
      setConfirmedLive(true);
    }
    client.run(generateProject(nextSpec), {
      env,
      idleTimeoutMs: local ? null : 120_000,
      timeoutMessage: "Run timed out — the provider took too long to respond.",
    });
  };
  startRef.current = start; // keep the ⌘↵ effect calling the latest start() (with its consent gates)

  const send = (): void => {
    const content = draft.trim();
    if (content.length === 0 || spec === null || blockedByKey) return;
    setDraft("");
    const history: EntryMessage[] =
      typeof spec.entry.input === "string" && messages.length === 1 && spec.entry.input === ""
        ? []
        : [...messages];
    const nextInput = [...history, { role: "user", content } as EntryMessage];
    let nextSpec = spec;
    store.updateSpec((s) => {
      nextSpec = { ...s, entry: { ...s.entry, input: nextInput } };
      return nextSpec;
    });
    start(nextSpec);
  };

  // The single obvious action: primary when the composer is empty (first-run seeded prompt), and
  // labeled for what it actually does — "Download & run" for a not-yet-cached local model, "Run"
  // before anything has run, "Re-run" after.
  const runLabel = local && !hasRun ? "⬇ Download & run" : hasRun ? "↻ Re-run" : "▶ Run";
  const runPrimary = draft.trim().length === 0 && !running;

  return (
    <div className="designer" data-testid="run-page">
      <TopBar />
      <div className="run-body">
        <section className="chat-pane" data-testid="run-chat-pane">
          {blockedByKey && (
            <div className="keygate" data-testid="run-keygate">
              {missing.map((pid) => {
                const p = liveProvider(pid);
                return (
                  <div key={pid} className="keygate-row" data-testid={`run-keygate-${pid}`}>
                    <p>
                      This agent runs on <strong>{p.label}</strong>, but no API key is set. Paste one to run — it stays in this browser.{" "}
                      <a href={p.consoleUrl} target="_blank" rel="noreferrer" data-testid={`run-key-link-${pid}`}>Get a key ↗</a>
                    </p>
                    <input
                      type="password"
                      data-testid={`run-key-input-${pid}`}
                      placeholder={p.envVar}
                      value={settings.keys[pid] ?? ""}
                      onChange={(e) => settings.setKey(pid, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {local && run.download !== null && run.download.progress < 1 && (
            <div className="download" data-testid="run-download">
              <span>Downloading the on-device model{localSize !== undefined ? ` (${localSize})` : ""}… {Math.round(run.download.progress * 100)}%</span>
              <progress value={run.download.progress} max={1} />
            </div>
          )}
          <ol className="chat" data-testid="run-chat">
            {messages.map((m, i) => (
              <li key={i} className={`msg msg-${m.role}`} data-testid={`run-message-${i}`}>
                <span className="msg-role">{m.role}</span>
                <p>{m.content}</p>
              </li>
            ))}
            {running && streamText.length > 0 && (
              <li className="msg msg-assistant msg-streaming" data-testid="run-message-streaming">
                <span className="msg-role">assistant</span>
                <p>{streamText}</p>
              </li>
            )}
            {run.status === "running" && streamText.length === 0 && (run.download === null || run.download.progress >= 1) && (
              <li className="msg msg-assistant msg-thinking" data-testid="run-thinking">
                <span className="msg-role">assistant</span>
                <p className="thinking"><span /><span /><span /></p>
              </li>
            )}
            {run.status === "suspended" && (
              <li className="msg msg-assistant msg-approval" data-testid="run-approval-cue">
                <span className="msg-role">approval</span>
                <p>⏸ Waiting for your approval — approve or reject it in the inspector on the right →</p>
              </li>
            )}
          </ol>
          {run.error !== null && (
            <div className="error-box" data-testid="run-error">
              {run.errorHint !== null && <p>{run.errorHint}</p>}
              <details>
                <summary>Raw error</summary>
                <pre>{run.error}</pre>
              </details>
            </div>
          )}
          {local && !hasRun && localSize !== undefined && (
            <p className="hint" data-testid="run-local-note">
              On-device model — the first run downloads {localSize} once, then runs offline with no API key.
            </p>
          )}
          <div className="chat-input">
            <textarea
              rows={2}
              data-testid="run-draft-input"
              value={draft}
              placeholder={blockedByKey ? "Add an API key above to run…" : "Message the agent… (⌘⏎ to send)"}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
              }}
            />
            {running ? (
              <button data-testid="run-stop" onClick={() => client.stop()}>Stop</button>
            ) : (
              <button
                className="primary"
                data-testid="run-send"
                onClick={send}
                disabled={draft.trim().length === 0 || blockedByKey}
                title={blockedByKey ? "Add an API key to run" : undefined}
              >
                Send
              </button>
            )}
          </div>
          <div className="run-actions">
            <button
              className={runPrimary ? "primary" : "ghost"}
              data-testid="run-rerun"
              onClick={() => start()}
              disabled={running || blockedByKey}
              title={blockedByKey ? "Add an API key to run" : undefined}
            >
              {runLabel}
            </button>
            <button
              className="ghost"
              data-testid="run-clear-chat"
              onClick={() => {
                client.reset();
                store.updateSpec((s) => ({ ...s, entry: { ...s.entry, input: [] } }));
              }}
            >
              Clear chat
            </button>
            <span className={`status status-${run.status}`} data-testid="run-status">{run.status}</span>
          </div>
        </section>

        <section className="inspector-pane" data-testid="run-inspector-pane">
          {run.status === "done" && !coachDismissed && (
            <div className="coachmark" data-testid="run-coachmark">
              <p>☝ This is the real event stream, tool calls, cost, and latency for that run — drag the scrubber to time-travel through it.</p>
              <button className="ghost" data-testid="coachmark-dismiss" onClick={() => dismissCoach()}>Got it</button>
            </div>
          )}
          <RunInspector events={run.events} {...(run.status === "suspended" ? { onResolve: (resolution) => client.resume(resolution) } : {})} />
          {run.logs.length > 0 && (
            <details className="logs" open data-testid="run-logs">
              <summary>console ({run.logs.length})</summary>
              <ol>
                {run.logs.map((l, i) => (
                  <li key={i} className={`log-${l.level}`} data-testid={`run-log-${i}`}>
                    {l.text}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
