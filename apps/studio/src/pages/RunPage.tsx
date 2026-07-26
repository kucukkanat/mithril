import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import { createRunnerClient, liveProvider, localModel } from "@mithril/runner-web";
import type { MithrilEvent } from "@mithril/core/protocol";
import { generateProject, type EntryMessage } from "@mithril/spec";
import { RunInspector } from "@mithril/devtools/ui";
import { useProjectStore } from "../state/projectStore.ts";
import { useCasebookStore } from "../state/casebookStore.ts";
import { envForSpec, liveProvidersIn, usesLocalModel, useSettingsStore } from "../state/settingsStore.ts";
import { useUiStore } from "../state/uiStore.ts";
import { gradeCase, shapeOf, type Verdict } from "../lib/casebook.ts";
import { newRunId, recordRun } from "../lib/run-archive.ts";
import { TopBar } from "../components/TopBar.tsx";
import { ReplayIcon, SendIcon } from "../components/icons.tsx";

/*
 * The run view: a casebook rail, the conversation, and the devtools inspector over the live event
 * stream.
 *
 * Two modes in one screen. Pick a CASE and you get its expectation, its transcript and a verdict card
 * that says why it passed or failed — plus "actually, this is correct", which is how a baseline gets
 * set. Or use the SCRATCH chat, which is ungraded, and promote anything worth keeping into the
 * casebook. The inspector is the same for both, because the event stream is the same.
 */

const textOf = (events: readonly MithrilEvent[]): string => events.flatMap((e) => (e.type === "text.delta" ? [e.delta] : [])).join("");

const DOT: Record<Verdict, string> = {
  pass: "var(--good)",
  fail: "var(--bad)",
  stale: "var(--warn)",
  unreviewed: "var(--text-faint)",
  checking: "var(--gen)",
};

export function RunPage() {
  const { id } = useParams<{ id: string }>();
  const store = useProjectStore();
  const casebook = useCasebookStore();
  const settings = useSettingsStore();
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmedLive, setConfirmedLive] = useState(false);
  const lastStatus = useRef<string>("idle");
  /** What the in-flight run was given, so an archived run can be identified in a list. */
  const lastInput = useRef<string>("");

  useEffect(() => {
    if (id === undefined) return;
    if (store.projectId !== id) void store.open(id);
    if (casebook.projectId !== id) void casebook.open(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const client = useMemo(
    () => createRunnerClient(() => new Worker(new URL("../runner/worker-entry.ts", import.meta.url), { type: "module" })),
    [],
  );
  useEffect(() => () => client.stop(), [client]);
  const run = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);

  const spec = store.spec;

  // ⌘↵ / palette "Run the agent" sets a one-shot intent; consume it here and route through start() so
  // the keyboard path reuses the SAME missing-key + hand-edited-live consent gates as the buttons.
  const runRequested = useUiStore((s) => s.runRequested);
  const consumeRun = useUiStore((s) => s.consumeRun);
  const coachDismissed = useUiStore((s) => s.coachDismissed);
  const dismissCoach = useUiStore((s) => s.dismissCoach);
  const startRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!runRequested || store.spec === null) return;
    consumeRun();
    startRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runRequested, store.spec]);

  // When a scratch run finishes, fold the reply into the persisted chat history so the next send
  // carries the whole conversation. Case runs never touch history — a case is one turn, by definition.
  useEffect(() => {
    if (run.status === lastStatus.current) return;
    lastStatus.current = run.status;
    // Archive EVERY finished run, scratch or case, before anything reduces it away — a run you cannot
    // re-read is a run you cannot diagnose.
    if ((run.status === "done" || run.status === "error") && id !== undefined && run.events.length > 0) {
      void recordRun(id, {
        id: newRunId(),
        at: Date.now(),
        caseId: selected,
        input: lastInput.current,
        status: run.status === "error" ? "error" : "done",
        events: run.events,
      });
    }
    if (run.status !== "done" || spec === null || selected !== null) return;
    const reply = textOf(run.events);
    if (reply.length === 0) return;
    store.updateSpec((s) => {
      const history: EntryMessage[] = typeof s.entry.input === "string" ? [{ role: "user", content: s.entry.input }] : [...s.entry.input];
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
  // A fresh project's entry input is "", which must not render as an empty user bubble.
  const messages: readonly EntryMessage[] = (typeof spec.entry.input === "string" ? [{ role: "user" as const, content: spec.entry.input }] : spec.entry.input).filter(
    (m) => m.content.trim().length > 0,
  );

  const blockedByKey = missing.length > 0;
  const running = run.status === "running" || run.status === "suspended";
  const streamText = textOf(run.events);
  const activeCase = casebook.cases.find((c) => c.id === selected) ?? null;
  const specChangedAt = store.savedAt ?? 0;

  /** Consent gate shared by every path that starts a run. */
  const consent = (): boolean => {
    if (blockedByKey) return false;
    if (liveIds.length > 0 && store.handEdited && !confirmedLive) {
      const hosts = liveIds.map((p) => liveProvider(p).host).join(", ");
      if (!window.confirm(`This project's code was hand-edited this session. Running live sends your API key(s) with requests to: ${hosts}. Continue?`)) return false;
      setConfirmedLive(true);
    }
    return true;
  };

  const start = (input: string | readonly EntryMessage[]): void => {
    if (!consent()) return;
    lastInput.current = typeof input === "string" ? input : (input[input.length - 1]?.content ?? "");
    client.run(generateProject({ ...spec, entry: { ...spec.entry, input: typeof input === "string" ? input : [...input] } }), {
      env,
      idleTimeoutMs: local ? null : 120_000,
      timeoutMessage: "Run timed out — the provider took too long to respond.",
    });
  };
  startRef.current = () => start(activeCase !== null ? activeCase.input : messages);

  const send = (): void => {
    const content = draft.trim();
    if (content.length === 0 || blockedByKey) return;
    setDraft("");
    setSelected(null); // typing is a scratch turn, not a case
    const history: EntryMessage[] = typeof spec.entry.input === "string" && spec.entry.input === "" ? [] : [...messages];
    const nextInput = [...history, { role: "user", content } as EntryMessage];
    store.updateSpec((s) => ({ ...s, entry: { ...s.entry, input: nextInput } }));
    start(nextInput);
  };

  /** Run a case here, interactively, and record its shape in the casebook. */
  const replayCase = (caseId: string): void => {
    const target = casebook.cases.find((c) => c.id === caseId);
    if (target === undefined || !consent()) return;
    setSelected(caseId);
    void casebook.check(caseId, { spec, env, local });
    start(target.input);
  };

  // The verdict card reads the LIVE run when one just finished for the selected case, so it reflects
  // what is on screen rather than a stored result from a previous check.
  const liveShape = run.status === "done" || run.status === "error" ? shapeOf(run.events) : null;
  const graded = activeCase === null ? null : gradeCase(activeCase, specChangedAt);
  const showVerdict = activeCase !== null && graded !== null && (liveShape !== null || activeCase.last !== null);

  return (
    <div className="designer" data-testid="run-page">
      <TopBar />
      <div className="run-body">
        <nav className="decl-list" data-testid="run-casebook-rail">
          <div>
            <div className="case-rail-head">
              <h4>Casebook</h4>
              <button
                className="ghost"
                onClick={() => void casebook.checkAll({ spec, env, local })}
                disabled={casebook.checking.length > 0 || casebook.cases.length === 0 || blockedByKey}
                data-testid="run-check-all"
              >
                Run all
              </button>
            </div>
            {casebook.cases.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                No cases yet. Add them on the <Link to={`/p/${id}`}>Design</Link> view, or promote a scratch chat below.
              </p>
            ) : (
              <ul>
                {casebook.cases.map((c) => {
                  const isChecking = casebook.checking.includes(c.id);
                  const verdict: Verdict = isChecking ? "checking" : gradeCase(c, specChangedAt).verdict;
                  return (
                    <li key={c.id} className={selected === c.id ? "sel" : ""}>
                      <button className="decl decl-stack" onClick={() => setSelected(c.id)} data-testid={`run-case-${c.id}`}>
                        <span className="decl-top">
                          <span className="case-dot" style={{ background: DOT[verdict] }} />
                          <span className="case-verdict" style={{ color: DOT[verdict] }}>{verdict}</span>
                          <span className="case-meta">{c.last !== null ? `${(c.last.ms / 1000).toFixed(1)}s` : ""}</span>
                        </span>
                        <span className="case-input">{c.input}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h4>Loose ends</h4>
            <ul>
              <li className={selected === null ? "sel" : ""}>
                <button className="decl" onClick={() => setSelected(null)} data-testid="run-scratch">
                  <span className="decl-kind k-workflow">chat</span>
                  <code>scratch</code>
                </button>
              </li>
            </ul>
            <p className="hint">Promote anything here into the casebook.</p>
          </div>
        </nav>

        <section className="chat-pane" data-testid="run-chat-pane">
          <div className="pane-head">
            <span className="pane-dot pane-dot-authored" /> {activeCase !== null ? "Case" : "Scratch chat"} —{" "}
            <b>{activeCase !== null ? activeCase.input : "not graded"}</b>
            <span className="pane-meta">
              <code className="mono">{spec.entry.target}</code> · {local ? "local" : liveIds.join(", ") || "custom"}
            </span>
          </div>

          {activeCase !== null && graded !== null && (
            <div className="expects-bar" data-testid="run-expects">
              <span className="eyebrow" style={{ border: "none", padding: 0 }}>expects</span>
              <span className="expects-text">{graded.expects}</span>
              <span className={`status status-${graded.verdict === "pass" ? "done" : graded.verdict === "fail" ? "error" : "suspended"}`}>{graded.verdict}</span>
            </div>
          )}

          {blockedByKey && (
            <div className="keygate" data-testid="run-keygate">
              {missing.map((pid) => {
                const p = liveProvider(pid);
                return (
                  <div key={pid} className="keygate-row" data-testid={`run-keygate-${pid}`}>
                    <p>
                      This agent runs on <strong>{p.label}</strong>, but no API key is set. Paste one to run — it stays in this browser.{" "}
                      <a href={p.consoleUrl} target="_blank" rel="noreferrer" data-testid={`run-key-link-${pid}`}>
                        Get a key ↗
                      </a>
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
              <span>
                Downloading the on-device model{localSize !== undefined ? ` (${localSize})` : ""}… {Math.round(run.download.progress * 100)}%
              </span>
              <progress value={run.download.progress} max={1} />
            </div>
          )}

          <div className="chat-scroll">
            <ol className="chat" data-testid="run-chat">
              {(activeCase !== null ? [{ role: "user" as const, content: activeCase.input }] : messages).map((m, i) => (
                <li key={i} className={`msg msg-${m.role}`} data-testid={`run-message-${i}`}>
                  <span className="msg-role">{m.role === "user" ? "you" : m.role}</span>
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
                  <p className="thinking">
                    <span />
                    <span />
                    <span />
                  </p>
                </li>
              )}
              {run.status === "suspended" && (
                <li className="msg msg-assistant msg-approval" data-testid="run-approval-cue">
                  <span className="msg-role">approval</span>
                  <p>Waiting for your approval — approve or reject it in the inspector on the right →</p>
                </li>
              )}

              {showVerdict && activeCase !== null && graded !== null && (
                <li className={`verdict ${graded.verdict === "pass" ? "pass" : graded.verdict === "fail" ? "fail" : ""}`} data-testid="run-verdict">
                  <div className="verdict-top">
                    <span className="verdict-label" style={{ color: DOT[graded.verdict] }}>
                      {graded.verdict === "pass" ? "case passed" : graded.verdict === "fail" ? "case failed" : graded.verdict}
                    </span>
                    <span className="verdict-meta">
                      {activeCase.last !== null
                        ? `${activeCase.last.steps} step${activeCase.last.steps === 1 ? "" : "s"} · ${activeCase.last.tools.length} tool call${activeCase.last.tools.length === 1 ? "" : "s"} · ${(activeCase.last.ms / 1000).toFixed(1)}s`
                        : ""}
                    </span>
                  </div>
                  <p className="verdict-why">{graded.why}</p>
                  <div className="verdict-actions">
                    {graded.verdict === "fail" && (
                      <>
                        <Link className="primary" to={`/p/${id}`} style={{ textDecoration: "none", fontSize: "var(--mth-fs-sm)" }} data-testid="run-fix-tool">
                          Fix the tool description ↗
                        </Link>
                        <Link to={`/p/${id}`} style={{ fontSize: "var(--mth-fs-sm)" }} data-testid="run-fix-job">
                          Sharpen the job line ↗
                        </Link>
                      </>
                    )}
                    {activeCase.last !== null && (
                      <button className="ghost push" onClick={() => casebook.accept(activeCase.id)} data-testid="run-accept">
                        {activeCase.baseline === null ? "This is correct — set the baseline" : "Actually, this is correct"}
                      </button>
                    )}
                  </div>
                </li>
              )}
            </ol>
          </div>

          {run.error !== null && (
            <div className="error-box" data-testid="run-error">
              {run.errorHint !== null && <p>{run.errorHint}</p>}
              <details>
                <summary>Raw error</summary>
                <pre>{run.error}</pre>
              </details>
            </div>
          )}

          <div className="composer">
            <div className="composer-inner">
              <div className="chat-input">
                <textarea
                  rows={2}
                  data-testid="run-draft-input"
                  value={draft}
                  placeholder={blockedByKey ? "Add an API key above to run…" : "Message the agent…  (⌘⏎ to send)"}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                  }}
                />
                {running ? (
                  <button data-testid="run-stop" onClick={() => client.stop()}>
                    Stop
                  </button>
                ) : (
                  <button className="primary" data-testid="run-send" onClick={send} disabled={draft.trim().length === 0 || blockedByKey}>
                    <SendIcon /> Send
                  </button>
                )}
              </div>
              <div className="run-actions">
                {activeCase !== null ? (
                  <button className="primary" onClick={() => replayCase(activeCase.id)} disabled={running || blockedByKey} data-testid="run-replay">
                    <ReplayIcon /> Replay this case
                  </button>
                ) : (
                  <button className="primary" onClick={() => start(messages)} disabled={running || blockedByKey} data-testid="run-rerun">
                    <ReplayIcon /> {local && run.events.length === 0 ? "Download & run" : "Run"}
                  </button>
                )}
                {activeCase === null && (
                  <button
                    onClick={() => {
                      const last = [...messages].reverse().find((m) => m.role === "user");
                      if (last !== undefined) setSelected(casebook.add(last.content));
                    }}
                    disabled={!messages.some((m) => m.role === "user" && m.content.trim().length > 0)}
                    data-testid="run-promote"
                  >
                    Promote to casebook
                  </button>
                )}
                <button
                  className="ghost"
                  data-testid="run-clear-chat"
                  onClick={() => {
                    client.reset();
                    setSelected(null);
                    store.updateSpec((s) => ({ ...s, entry: { ...s.entry, input: [] } }));
                  }}
                >
                  Clear chat
                </button>
                <span className={`status status-${run.status}`} data-testid="run-status">
                  {run.status}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="split-seam" />

        <aside className="inspector-pane" data-testid="run-inspector-pane">
          <div className="pane-head">
            <span className="pane-dot pane-dot-generated" /> Inspector — <b>what the runtime emitted</b>
            <span className="pane-meta">
              <code className="mono">@mithril/devtools</code>
            </span>
          </div>
          <div className="inspector-body">
            {run.status === "done" && !coachDismissed && (
              <div className="coachmark" data-testid="run-coachmark">
                <p>Every case keeps its last run, so a fix that breaks something else cannot hide. Drag the scrubber to time-travel through this one.</p>
                <button className="ghost" data-testid="coachmark-dismiss" onClick={() => dismissCoach()}>
                  Got it
                </button>
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
          </div>
        </aside>
      </div>
    </div>
  );
}
