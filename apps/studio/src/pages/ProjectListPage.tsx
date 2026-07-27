import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, deleteProject, listProjects, type ProjectListEntry } from "../lib/db.ts";
import { filterRecents } from "../lib/recents.ts";
import { saveCases, newCaseId } from "../lib/casebook-db.ts";
import { blankProject, TEMPLATES, templateSpec, uniqueName, type ProjectTemplate } from "../lib/defaults.ts";
import { DRAFT_DEFAULT_MODEL, draftDestination } from "../lib/drafting.ts";
import type { Case } from "../lib/casebook.ts";
import { envForModel, useSettingsStore } from "../state/settingsStore.ts";
import { useDraftingStore } from "../state/draftingStore.ts";
import { useCreatorStore } from "../state/creatorStore.ts";
import { BuildStream } from "../components/BuildStream.tsx";
import { BuildReview } from "../components/BuildReview.tsx";
import { TopBar } from "../components/TopBar.tsx";
import { ModelPicker } from "../components/ModelPicker.tsx";
import { BrandMark, CheckIcon, LockIcon, PlayIcon, SearchIcon, TrashIcon } from "../components/icons.tsx";
import { liveProvider } from "@mithril/runner-web";

/*
 * First run: the screen that turns a description into a working agent.
 *
 * Two routes in, deliberately. Describe what you want and let the creator build it — agents, tools
 * and specialists; or borrow a template that arrives with its casebook already written.
 *
 * The build runs in three phases IN PLACE (prompt → live stream → review) rather than across three
 * routes: the project does not exist until you accept it, so there is no id to route to, and a route
 * swap would throw the prompt away on back-navigation.
 *
 * A "pick up where you left off" strip appears above the templates once projects exist — the designed
 * screen is a first-run screen, and a returning user should not have to go looking for their work.
 */

/** Seed cases become a real casebook: unreviewed until the runtime says otherwise. */
const seedCases = (inputs: readonly string[]): readonly Case[] =>
  inputs
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((input) => ({ id: newCaseId(), input, baseline: null, last: null, checkedAt: null }));

export function ProjectListPage() {
  const [projects, setProjects] = useState<readonly ProjectListEntry[] | null>(null);
  const [job, setJob] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [query, setQuery] = useState("");
  // Deleting a project takes its casebook and run archive with it, so the second click is the
  // confirmation — held per-card rather than in a modal that would hide which one you aimed at.
  const [confirming, setConfirming] = useState<string | null>(null);
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const drafting = useDraftingStore();
  const creator = useCreatorStore();

  useEffect(() => {
    void listProjects().then(setProjects);
  }, []);

  const existing = new Set((projects ?? []).map((p) => p.name));
  const ready = job.trim().length > 0;
  const draftModel = settings.draftModel;
  // A cloud drafting model with no key stored can't draft anything — ask for the key here rather
  // than failing the run and sending the newcomer to Settings to find out why.
  const { env, missing } = envForModel(draftModel, settings.connections);
  const needsKey = missing[0];

  /** Create a project, attach its casebook, and open it. */
  const open = async (spec: Parameters<typeof createProject>[0], seeds: readonly Case[]): Promise<void> => {
    const id = await createProject(spec);
    if (seeds.length > 0) await saveCases(id, seeds);
    navigate(`/p/${id}`);
  };

  const fromTemplate = (t: ProjectTemplate): void => {
    void open(templateSpec(t, existing), seedCases(t.cases.map((c) => c.text)));
  };

  /**
   * The CTA. The creator builds the whole project — agents, tools and specialists — from the prompt.
   * With drafting switched off there is no model to build with, so the prompt still seeds a blank
   * agent rather than being thrown away.
   */
  const build = async (): Promise<void> => {
    setError(null);
    if (draftModel === null) {
      const spec = blankProject(uniqueName(job.trim().slice(0, 40) || "Untitled agent", existing));
      await open({ ...spec, decls: spec.decls.map((d) => (d.kind === "agent" ? { ...d, instructions: job.trim() } : d)) }, []);
      return;
    }
    if (needsKey !== undefined) {
      setError(`Paste your ${liveProvider(needsKey).label} key above, or pick a Local model to build on-device.`);
      return;
    }
    await creator.start({ kind: "create", job: job.trim() }, draftModel, settings.previewFirst, env);
  };

  /** Persist what the review card shows, and go edit it. */
  const accept = async (): Promise<void> => {
    const built = creator.outcome;
    if (built === null) return;
    setAccepting(true);
    await open({ ...built.spec, name: uniqueName(built.spec.name, existing) }, []);
    creator.reset();
  };

  const all = projects ?? [];
  const recents = filterRecents(all, query);

  const remove = async (id: string): Promise<void> => {
    await deleteProject(id);
    setConfirming(null);
    setProjects(await listProjects());
  };

  return (
    <div className="designer" data-testid="project-list-page">
      <TopBar />
      <main className="first-run">
        <section className="onboard">
          <div className="onboard-hero">
            <BrandMark className="onboard-mark" />
            <h1>
              Describe it, <em>get a working agent</em>
            </h1>
            <p className="onboard-sub">
              Say what you want. Mithril builds the agents, the tools and any specialists they hand off to — then writes the TypeScript you can edit.
            </p>
          </div>

          <div className="onboard-form">
            {creator.phase === "building" && <BuildStream events={creator.events} download={creator.download} running={creator.running} onStop={creator.stop} />}

            {creator.phase === "review" && creator.outcome !== null && (
              <BuildReview
                outcome={creator.outcome}
                accepting={accepting}
                onAccept={() => void accept()}
                onRetry={() => void build()}
                onTweak={creator.reset}
              />
            )}

            {creator.phase === "idle" && (
            <div className="panel">
              <label style={{ display: "block" }}>
                <span className="eyebrow" style={{ border: "none", padding: 0 }}>What should it do?</span>
                {/* A description of a whole system is paragraphs, not a name — the single-line input
                    this replaced hid everything past the first few words of a real one. */}
                <textarea
                  className="onboard-job"
                  rows={4}
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Handle customer refund requests: look up the order, check it against our policy, and hand anything over £100 to a billing specialist."
                  data-testid="onboard-job"
                />
              </label>
              <p className="hint" style={{ marginTop: "var(--mth-space-1)" }}>
                Name the jobs it must do. Distinct roles become separate agents that hand off to each other.
              </p>

              <div className="seed-block" data-testid="onboard-model-block">
                <div className="seed-head">
                  <span className="eyebrow" style={{ border: "none", padding: 0 }}>Which model writes the draft</span>
                  <label className="check" style={{ margin: 0, fontSize: "var(--mth-fs-2xs)", color: "var(--text-faint)" }}>
                    <input
                      type="checkbox"
                      checked={draftModel !== null}
                      onChange={(e) => settings.setDraftModel(e.target.checked ? DRAFT_DEFAULT_MODEL : null)}
                      data-testid="onboard-draft-enabled"
                    />
                    drafting on
                  </label>
                </div>
                {draftModel === null ? (
                  <p className="hint" style={{ marginTop: "var(--mth-space-1)" }}>
                    Drafting is off — your description seeds a blank agent instead.
                  </p>
                ) : (
                  <>
                    <ModelPicker value={draftModel} onChange={settings.setDraftModel} />
                    {needsKey !== undefined && (
                      <label className="onboard-key" data-testid="onboard-key">
                        <span className="eyebrow" style={{ border: "none", padding: 0 }}>{liveProvider(needsKey).label} key</span>
                        <input
                          type="password"
                          value={settings.connections[needsKey]?.apiKey ?? ""}
                          onChange={(e) => settings.setKey(needsKey, e.target.value)}
                          placeholder={liveProvider(needsKey).envVar}
                          aria-label={`${liveProvider(needsKey).label} key`}
                          data-testid="onboard-key-input"
                        />
                        <span className="hint">
                          Stays in this browser&rsquo;s localStorage. Sent only to {liveProvider(needsKey).host}.
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>

              <div className="onboard-cta">
                <button className="primary" onClick={() => void build()} disabled={creator.running || drafting.running} data-testid="onboard-draft">
                  <PlayIcon /> {ready ? "Build this agent" : "Build an agent"}
                </button>
                <span className={error !== null ? "hint onboard-error" : "hint"} data-testid="onboard-hint">
                  {error !== null
                    ? error
                    : draftModel === null
                      ? "Drafting help is off — your description seeds a blank agent."
                      : !ready
                        ? "A sentence is enough. You can edit everything afterwards."
                        : `Goes to ${draftDestination(draftModel)}.`}
                </span>
              </div>
            </div>
            )}

            <div className="onboard-assure onboard-assure-center">
              <span className="assure">
                <LockIcon /> no account
              </span>
              <span className="assure">
                <CheckIcon /> no server
              </span>
              {/* The "0 bytes" claim is only true while drafting is off or on-device — it has to
                  follow the picker rather than sit there as decoration. */}
              {draftModel !== null && draftModel.kind === "live" ? (
                <span className="assure" data-testid="onboard-assure-cloud">
                  <CheckIcon /> only your prompt leaves, straight to {liveProvider(draftModel.provider).host}
                </span>
              ) : draftModel !== null && draftModel.kind === "code" ? (
                <span className="assure">
                  <CheckIcon /> your own model expression
                </span>
              ) : (
                <>
                  <span className="assure">
                    <CheckIcon /> runs offline
                  </span>
                  <span className="assure">
                    <CheckIcon /> 0 bytes sent
                  </span>
                </>
              )}
            </div>
          </div>

          {all.length > 0 && (
            <div className="recents" data-testid="recents">
              <div className="gallery-head">
                <h2>Pick up where you left off</h2>
                <p className="hint">Saved in this browser only</p>
              </div>
              <label className="recent-search">
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${all.length} agent${all.length === 1 ? "" : "s"}`}
                  aria-label="Search your agents"
                  data-testid="recent-search"
                />
              </label>
              {recents.length === 0 ? (
                <p className="hint" data-testid="recent-empty">
                  No agent matches &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                <div className="recent-grid">
                  {recents.map((p) => (
                    <div key={p.id} className={confirming === p.id ? "recent-card confirming" : "recent-card"}>
                      <button className="recent-open" onClick={() => navigate(`/p/${p.id}`)} data-testid={`recent-${p.id}`}>
                        <span className="recent-name">{p.name}</span>
                        <span className="recent-meta">{new Date(p.updatedAt).toLocaleDateString()}</span>
                      </button>
                      {confirming === p.id ? (
                        <span className="recent-confirm">
                          {/* Name what goes with it — the casebook and run archive are deleted too. */}
                          <span className="hint">Delete this agent, its cases and its runs?</span>
                          <span className="recent-confirm-actions">
                            <button className="ghost recent-danger" onClick={() => void remove(p.id)} data-testid={`recent-delete-confirm-${p.id}`}>
                              Delete
                            </button>
                            <button className="ghost" onClick={() => setConfirming(null)} data-testid={`recent-delete-cancel-${p.id}`}>
                              Cancel
                            </button>
                          </span>
                        </span>
                      ) : (
                        <button
                          className="recent-delete"
                          onClick={() => setConfirming(p.id)}
                          aria-label={`Delete ${p.name}`}
                          title={`Delete ${p.name}`}
                          data-testid={`recent-delete-${p.id}`}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="gallery-head">
            <h2>Or borrow someone&rsquo;s casebook</h2>
            <p className="hint">Each arrives with its examples already written</p>
          </div>
          <div className="template-grid" data-testid="template-grid">
            {TEMPLATES.map((t) => {
              const Glyph = t.glyph;
              return (
                <button
                  key={t.id}
                  className={`template-card${t.featured === true ? " tpl-featured" : ""}${picked === t.id ? " sel" : ""}`}
                  onMouseEnter={() => setPicked(t.id)}
                  onMouseLeave={() => setPicked(null)}
                  onClick={() => fromTemplate(t)}
                  data-testid={`template-${t.id}`}
                >
                  {t.featured === true && <span className="tpl-flag">start here</span>}
                  <span className="tpl-body">
                    <Glyph />
                    <span className="tpl-name">{t.name}</span>
                    <span className="tpl-desc">{t.description}</span>
                    <span className="tpl-cases">
                      {t.cases.map((c) => (
                        <span key={c.text} className="tpl-case">
                          <span className="tpl-case-dot" style={{ background: c.expectFail ? "var(--warn)" : "var(--text-faint)" }} />
                          <span className="tpl-case-text">{c.text}</span>
                        </span>
                      ))}
                    </span>
                    <span className="tpl-tags">
                      {t.tags.map((tag) => (
                        <span key={tag} className="tpl-tag">
                          {tag}
                        </span>
                      ))}
                      {t.needsKey === true && <span className="tpl-tag tpl-key">needs key</span>}
                    </span>
                  </span>
                  {t.featured === true && t.peek !== undefined && <span className="tpl-peek">{t.peek}</span>}
                </button>
              );
            })}
          </div>

          <div className="onboard-foot">
            <button
              className="ghost"
              onClick={() => void open(blankProject(uniqueName("Untitled agent", existing)), [])}
              data-testid="start-blank"
              style={{ color: "var(--text-muted)" }}
            >
              Start blank instead
            </button>
            <span>Everything you make is saved in this browser only.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
