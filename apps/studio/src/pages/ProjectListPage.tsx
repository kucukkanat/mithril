import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, listProjects, type ProjectListEntry } from "../lib/db.ts";
import { saveCases, newCaseId } from "../lib/casebook-db.ts";
import { blankProject, TEMPLATES, templateSpec, uniqueName, type ProjectTemplate } from "../lib/defaults.ts";
import { DRAFT_DEFAULT_MODEL, draftDestination, draftToSpec } from "../lib/drafting.ts";
import type { Case } from "../lib/casebook.ts";
import { envForModel, useSettingsStore } from "../state/settingsStore.ts";
import { useDraftingStore } from "../state/draftingStore.ts";
import { TopBar } from "../components/TopBar.tsx";
import { ModelPicker } from "../components/ModelPicker.tsx";
import { BrandMark, CheckIcon, LockIcon, PlayIcon } from "../components/icons.tsx";
import { liveProvider } from "@mithril/runner-web";

/*
 * First run: the screen that turns a sentence into a working agent.
 *
 * Two routes in, deliberately. Describe the job and the examples it must handle and let the model
 * draft it; or borrow a template that arrives with its casebook already written. Both land in the
 * Designer with cases attached, because an agent with no examples has nothing to grade its next edit.
 *
 * A "pick up where you left off" strip appears above the templates once projects exist — the designed
 * screen is a first-run screen, and a returning user should not have to go looking for their work.
 */

const PLACEHOLDERS = ["What's the weather in Istanbul?", "Is it raining in Oslo right now?", "How hot will it be tomorrow?"];

/** Seed cases become a real casebook: unreviewed until the runtime says otherwise. */
const seedCases = (inputs: readonly string[]): readonly Case[] =>
  inputs
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((input) => ({ id: newCaseId(), input, baseline: null, last: null, checkedAt: null }));

export function ProjectListPage() {
  const [projects, setProjects] = useState<readonly ProjectListEntry[] | null>(null);
  const [job, setJob] = useState("");
  const [cases, setCases] = useState<readonly string[]>(["", "", ""]);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const drafting = useDraftingStore();

  useEffect(() => {
    void listProjects().then(setProjects);
  }, []);

  const existing = new Set((projects ?? []).map((p) => p.name));
  const filled = cases.filter((c) => c.trim().length > 0).length;
  const ready = job.trim().length > 0;
  const draftModel = settings.draftModel;
  // A cloud drafting model with no key stored can't draft anything — ask for the key here rather
  // than failing the run and sending the newcomer to Settings to find out why.
  const { env, missing } = envForModel(draftModel, settings.keys);
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
   * The CTA. With drafting available the model writes the spec from the job line; with it switched
   * off the job line and cases are still honoured — they seed a blank project rather than being
   * thrown away.
   */
  const draft = async (): Promise<void> => {
    setError(null);
    const seeds = seedCases(cases);
    if (draftModel === null) {
      const spec = blankProject(uniqueName(job.trim().slice(0, 40) || "Untitled agent", existing));
      await open({ ...spec, decls: spec.decls.map((d) => (d.kind === "agent" ? { ...d, instructions: job.trim() } : d)) }, seeds);
      return;
    }
    if (needsKey !== undefined) {
      setError(`Paste your ${liveProvider(needsKey).label} key above, or pick a Local model to draft on-device.`);
      return;
    }
    const outcome = await drafting.request({ kind: "spec", job: job.trim(), cases }, draftModel, settings.previewFirst, env);
    if (outcome === null) return; // the user cancelled the gate
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    if (!("spec" in outcome)) return;
    const spec = draftToSpec(outcome.spec, draftModel);
    await open({ ...spec, name: uniqueName(spec.name, existing) }, seeds);
  };

  const recents = (projects ?? []).slice(0, 6);

  return (
    <div className="designer" data-testid="project-list-page">
      <TopBar />
      <main className="first-run">
        <section className="onboard">
          <div className="onboard-hero">
            <BrandMark className="onboard-mark" />
            <h1>
              Name three things, <em>get a working agent</em>
            </h1>
            <p className="onboard-sub">
              Say what the agent is for and what it must handle. Mithril drafts the spec, writes the TypeScript, and checks itself against your examples.
            </p>
          </div>

          <div className="onboard-form">
            <div className="panel">
              <label style={{ display: "block" }}>
                <span className="eyebrow" style={{ border: "none", padding: 0 }}>What is it for?</span>
                <input
                  className="onboard-job"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Answer questions about current weather, and cite a source when asked"
                  data-testid="onboard-job"
                />
              </label>

              <div className="seed-block">
                <div className="seed-head">
                  <span className="eyebrow" style={{ border: "none", padding: 0 }}>Three things it must handle</span>
                  <span className={`seed-count${filled >= 2 ? " ready" : ""}`}>{filled} of 3 written</span>
                </div>
                <p className="hint" style={{ marginTop: "var(--mth-space-1)" }}>These become the casebook that grades every later edit.</p>
                <div className="seed-list">
                  {cases.map((c, i) => (
                    <div key={i} className={`seed-row${c.trim().length > 0 ? " filled" : ""}`}>
                      <span className="seed-n">{String(i + 1).padStart(2, "0")}</span>
                      <input
                        value={c}
                        onChange={(e) => setCases(cases.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder={PLACEHOLDERS[i] ?? "One more thing it must handle…"}
                        aria-label={`Case ${i + 1}`}
                        data-testid={`onboard-case-${i}`}
                      />
                      <button className="ghost" onClick={() => setCases(cases.filter((_, j) => j !== i))} aria-label="Remove" data-testid={`onboard-case-remove-${i}`}>
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="ghost"
                    onClick={() => setCases([...cases, ""])}
                    style={{ alignSelf: "flex-start", fontSize: "var(--mth-fs-2xs)" }}
                    data-testid="onboard-case-add"
                  >
                    ＋ another
                  </button>
                </div>
              </div>

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
                    Drafting is off — your job line seeds a blank agent instead.
                  </p>
                ) : (
                  <>
                    <ModelPicker value={draftModel} onChange={settings.setDraftModel} />
                    {needsKey !== undefined && (
                      <label className="onboard-key" data-testid="onboard-key">
                        <span className="eyebrow" style={{ border: "none", padding: 0 }}>{liveProvider(needsKey).label} key</span>
                        <input
                          type="password"
                          value={settings.keys[needsKey] ?? ""}
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
                <button className="primary" onClick={() => void draft()} disabled={drafting.running} data-testid="onboard-draft">
                  <PlayIcon /> {drafting.running ? "Drafting…" : ready ? "Draft this agent" : "Draft an agent"}
                </button>
                <span className={error !== null ? "hint onboard-error" : "hint"} data-testid="onboard-hint">
                  {error !== null
                    ? error
                    : draftModel === null
                      ? "Drafting help is off — your job line seeds a blank agent."
                      : !ready
                        ? "One line is enough to draft a tool and the TypeScript."
                        : `Goes to ${draftDestination(draftModel)}.`}
                </span>
              </div>
            </div>

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

          {recents.length > 0 && (
            <div className="recents" data-testid="recents">
              <div className="gallery-head">
                <h2>Pick up where you left off</h2>
                <p className="hint">Saved in this browser only</p>
              </div>
              <div className="recent-grid">
                {recents.map((p) => (
                  <button key={p.id} className="recent-card" onClick={() => navigate(`/p/${p.id}`)} data-testid={`recent-${p.id}`}>
                    <span className="recent-name">{p.name}</span>
                    <span className="recent-meta">{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
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
