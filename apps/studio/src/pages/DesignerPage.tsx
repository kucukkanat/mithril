import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { liveProvider } from "@mithril/runner-web";
import type { AgentSpec, ProjectSpec, ToolSpec } from "@mithril/spec";
import { useProjectStore } from "../state/projectStore.ts";
import { useCasebookStore } from "../state/casebookStore.ts";
import { useSettingsStore, envForModel, envForSpec, usesLocalModel } from "../state/settingsStore.ts";
import { useDraftingStore } from "../state/draftingStore.ts";
import { useCreatorStore } from "../state/creatorStore.ts";
import { attachTool, makeEntry, newAgent, newTool, ownerOf, removeDecl } from "../lib/attach.ts";
import { describeChange, planChanges, type SpecChange } from "../lib/spec-diff.ts";
import { paramsOf } from "../lib/tool-fields.ts";
import { InstructionBar } from "../components/InstructionBar.tsx";
import { DraftModelChip } from "../components/DraftModelChip.tsx";
import { ChangeSummary } from "../components/ChangeSummary.tsx";
import { DeclList } from "../components/DeclList.tsx";
import { AgentPanel } from "../components/AgentPanel.tsx";
import { ToolPanel } from "../components/ToolPanel.tsx";
import { SubAgentPanel } from "../components/SubAgentPanel.tsx";
import { CasebookStrip } from "../components/CasebookStrip.tsx";
import { CodeEditor } from "../components/CodeEditor.tsx";
import { CodeView } from "../components/CodeView.tsx";
import { TopBar } from "../components/TopBar.tsx";

/*
 * The designer: the rail, the structured panel for the selected decl, the generated code, and the
 * casebook underneath.
 *
 * Split is the default view, because the product's claim is that the spec and the code are one
 * thing — and you only believe that by watching the right side change as you type on the left.
 */

type View = "design" | "split" | "code";

export function DesignerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();
  const casebook = useCasebookStore();
  const settings = useSettingsStore();
  const drafting = useDraftingStore();
  const creator = useCreatorStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>("split");
  const [focus, setFocus] = useState<string | null>(null);
  // Split's generated pane, handed over to the real editor: the 1-based line the caret should land on,
  // or null while it's the annotated listing.
  const [splitEditLine, setSplitEditLine] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deleted, setDeleted] = useState<{ readonly index: number; readonly value: ProjectSpec["decls"][number] } | null>(null);
  /** A proposed AI edit awaiting accept/discard — never applied until the user says so. */
  const [proposal, setProposal] = useState<{ readonly instruction: string; readonly spec: ProjectSpec; readonly changes: readonly SpecChange[] } | null>(null);
  /** The last applied AI edit, so it can be reverted in one click. */
  const [applied, setApplied] = useState<{ readonly summary: string; readonly previous: ProjectSpec } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // The project store is shared by the Design/Run views — never close it on unmount (a route
  // transition would race the next page's open and strand it on "Loading").
  useEffect(() => {
    if (id === undefined) return;
    if (store.projectId !== id) void store.open(id);
    if (casebook.projectId !== id) void casebook.open(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const spec = store.spec;

  // Auto-select the entry agent (fallback: first agent, else first decl) whenever nothing valid is
  // selected — so a fresh project or a project switch lands on a populated panel.
  useEffect(() => {
    if (spec === null) return;
    if (selected !== null && spec.decls.some((d) => d.id === selected)) return;
    setSelected(spec.decls.find((d) => d.id === spec.entry.target)?.id ?? spec.decls.find((d) => d.kind === "agent")?.id ?? spec.decls[0]?.id ?? null);
  }, [spec, selected]);

  // ⌘E cycles Design → Split → Code, matching the tab row's own affordance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setView((v) => (v === "design" ? "split" : v === "split" ? "code" : "design"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Split always re-opens as the annotated listing — watching the code follow the spec is the tab's point.
  useEffect(() => setSplitEditLine(null), [view]);

  // Track a drag anywhere in the page so the agent panel's dropzone can light up.
  useEffect(() => {
    const start = (): void => setDragging(true);
    const end = (): void => setDragging(false);
    window.addEventListener("dragstart", start);
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => {
      window.removeEventListener("dragstart", start);
      window.removeEventListener("dragend", end);
      window.removeEventListener("drop", end);
    };
  }, []);

  if (store.loading || spec === null) return <div className="page-empty" data-testid="designer-loading">Loading project…</div>;

  const selectedDecl = spec.decls.find((d) => d.id === selected) ?? null;
  const frozen = store.codeDirty && store.diagnostics.some((d) => d.severity === "error");
  const draftModel = settings.draftModel;
  const { env } = envForSpec(spec, settings.connections);
  // The drafting model's own key situation, which is not the spec's: an agent can run on-device
  // while the model drafting it is a cloud one, and vice versa.
  const draft = envForModel(draftModel, settings.connections);
  const draftNeedsKey = draft.missing[0] ?? null;
  /** Drafting is offerable only when it would actually reach a model — off or keyless, it can't. */
  const canDraft = draftModel !== null && draftNeedsKey === null;

  const mutate = (fn: (s: ProjectSpec) => ProjectSpec): void => store.updateSpec(fn);

  const addDecl = (kind: "tool" | "agent"): void => {
    let newId = "";
    mutate((s) => {
      const decl = kind === "tool" ? newTool(s) : newAgent(s);
      newId = decl.id;
      return { ...s, decls: [...s.decls, decl] };
    });
    setSelected(newId); // jump straight into the thing you just added
  };

  const remove = (declId: string): void => {
    const index = spec.decls.findIndex((d) => d.id === declId);
    const value = spec.decls[index];
    if (value === undefined) return;
    setDeleted({ index, value });
    mutate((s) => removeDecl(s, declId));
    if (selected === declId) setSelected(null);
  };

  const undoDelete = (): void => {
    if (deleted === null) return;
    const { index, value } = deleted;
    setDeleted(null);
    mutate((s) => {
      const decls = [...s.decls];
      decls.splice(Math.min(index, decls.length), 0, value);
      return { ...s, decls };
    });
    setSelected(value.id);
  };

  /** Rename a decl's const identifier, repointing every reference to it. */
  const rename = (from: string, to: string): void => {
    const next = to.trim();
    if (next.length === 0 || next === from || spec.decls.some((d) => d.id === next)) return;
    mutate((s) => ({
      ...s,
      decls: s.decls.map((d) => {
        const renamed = d.id === from ? { ...d, id: next } : d;
        if (renamed.kind === "agent") return { ...renamed, tools: renamed.tools.map((t) => (t === from ? next : t)) };
        if (renamed.kind === "subAgentTool" && renamed.agentId === from) return { ...renamed, agentId: next };
        return renamed;
      }),
      entry: { ...s.entry, target: s.entry.target === from ? next : s.entry.target },
    }));
    setSelected(next);
  };

  /**
   * Edit the whole project by instruction. The result is never applied here — it becomes a change
   * plan the user accepts or discards, so an AI edit can't quietly rewrite something hand-written.
   */
  const editWithAi = async (instruction: string): Promise<void> => {
    if (draftModel === null) return;
    setEditError(null);
    const outcome = await creator.edit(instruction, spec, draftModel, settings.previewFirst, draft.env);
    if (outcome === null) return; // cancelled at the gate
    if (outcome.error !== null) {
      setEditError(outcome.error);
      return;
    }
    setProposal({ instruction, spec: outcome.result.spec, changes: planChanges(spec, outcome.result.spec) });
  };

  /** Ask the drafting model to rewrite a tool's description, then apply it. */
  const fixDescription = async (tool: ToolSpec): Promise<void> => {
    if (draftModel === null) return;
    const owner = ownerOf(spec, tool.id);
    const ownerAgent = spec.decls.find((d) => d.kind === "agent" && d.id === owner);
    const job = ownerAgent?.kind === "agent" && typeof ownerAgent.instructions === "string" ? ownerAgent.instructions : "";
    const outcome = await drafting.request(
      { kind: "description", toolName: tool.name, current: tool.description, job, inputNames: paramsOf(tool.inputSchema.zod).map((p) => p.name) },
      draftModel,
      settings.previewFirst,
      draft.env,
    );
    if (outcome === null || !outcome.ok || !("description" in outcome)) return;
    mutate((s) => ({
      ...s,
      decls: s.decls.map((d) => (d.id === tool.id && d.kind === "tool" ? { ...d, description: outcome.description.description } : d)),
    }));
  };

  const checkContext = { spec, env, local: usesLocalModel(spec) };
  const busy = casebook.checking.length > 0;

  const instructionBar = (
    <InstructionBar
      onSubmit={(instruction) => void editWithAi(instruction)}
      running={creator.running}
      modelChip={<DraftModelChip model={draftModel} onChange={settings.setDraftModel} />}
      disabledReason={
        draftModel === null
          ? "Drafting is off — turn it on in the model chip to edit with AI"
          : draftNeedsKey !== null
            ? `Add your ${liveProvider(draftNeedsKey).label} key in the model chip to edit with AI`
            : frozen
              ? "Fix the code errors first — the spec is out of sync with what you're editing"
              : null
      }
      applied={
        applied === null
          ? null
          : {
              summary: applied.summary,
              onUndo: () => {
                const previous = applied.previous;
                mutate(() => previous);
                setApplied(null);
              },
            }
      }
      error={editError}
    />
  );

  const designPane = (
    <div className={`design-pane${frozen ? " frozen" : ""}`} data-testid="designer-design-pane">
      {frozen && (
        <p className="freeze-note" data-testid="designer-freeze-note">
          The code view has errors the parser can&rsquo;t lift — panels reflect the last good state. Fix the code to unfreeze.
        </p>
      )}
      {selectedDecl === null && <p className="hint">Select an agent or tool on the left — or add one with + agent / + tool.</p>}
      {selectedDecl?.kind === "agent" && (
        <AgentPanel
          key={selectedDecl.id}
          spec={spec}
          agent={selectedDecl}
          onChange={(next) => mutate((s) => ({ ...s, decls: s.decls.map((d) => (d.id === next.id ? next : d)) }))}
          onRename={(to) => rename(selectedDecl.id, to)}
          onMakeEntry={() => mutate((s) => makeEntry(s, selectedDecl.id))}
          onOpenTool={setSelected}
          onDetachTool={(toolId) => mutate((s) => attachTool(s, toolId, null))}
          onDropTool={(toolId) => mutate((s) => attachTool(s, toolId, selectedDecl.id))}
          dragging={dragging}
          onFixTool={canDraft ? (t) => void fixDescription(t) : null}
          focus={focus}
          onFocus={setFocus}
        />
      )}
      {selectedDecl?.kind === "tool" && (
        <ToolPanel
          key={selectedDecl.id}
          tool={selectedDecl}
          onChange={(next) => mutate((s) => ({ ...s, decls: s.decls.map((d) => (d.id === next.id ? next : d)) }))}
          owner={ownerOf(spec, selectedDecl.id)}
          onFix={canDraft ? () => void fixDescription(selectedDecl) : null}
          drafting={drafting.running}
        />
      )}
      {selectedDecl?.kind === "subAgentTool" && (
        <SubAgentPanel
          key={selectedDecl.id}
          spec={spec}
          sub={selectedDecl}
          onChange={(next) => mutate((s) => ({ ...s, decls: s.decls.map((d) => (d.id === next.id ? next : d)) }))}
          onRename={(to) => rename(selectedDecl.id, to)}
          owner={ownerOf(spec, selectedDecl.id)}
        />
      )}
      {selectedDecl?.kind === "opaque" && (
        <div className="panel" data-testid="opaque-panel">
          <div className="panel-head">
            <h3>verbatim code</h3>
            <code>{selectedDecl.id}</code>
          </div>
          <p className="hint">This statement isn&rsquo;t structured — edit it in the Code tab. It round-trips losslessly.</p>
          <pre className="mono opaque-preview" data-testid="opaque-preview">{selectedDecl.code}</pre>
        </div>
      )}
    </div>
  );

  /** Rewrite one property of the selected decl, whichever kind it is. */
  const patchSelected = (patch: (d: ProjectSpec["decls"][number]) => ProjectSpec["decls"][number]) =>
    mutate((s) => ({ ...s, decls: s.decls.map((d) => (d.id === selectedDecl?.id ? patch(d) : d)) }));

  // Which generated string literals are editable, and what they write back to. Every string the
  // structured panel owns is listed here — anything missing is a line the reader can see but not
  // touch, which is exactly the frustration the pane exists to remove.
  const editable: Record<string, { readonly value: string; readonly onChange: (next: string) => void }> =
    selectedDecl === null
      ? {}
      : selectedDecl.kind === "agent"
        ? {
            ...(typeof selectedDecl.instructions === "string"
              ? {
                  job: {
                    value: selectedDecl.instructions,
                    onChange: (next: string) => patchSelected((d) => (d.kind === "agent" ? { ...d, instructions: next } : d)),
                  },
                }
              : {}),
          }
        : selectedDecl.kind === "tool"
          ? {
              description: {
                value: selectedDecl.description,
                onChange: (next: string) => patchSelected((d) => (d.kind === "tool" ? { ...d, description: next } : d)),
              },
              name: {
                value: selectedDecl.name,
                onChange: (next: string) => patchSelected((d) => (d.kind === "tool" ? { ...d, name: next } : d)),
              },
            }
          : selectedDecl.kind === "subAgentTool"
            ? {
                description: {
                  value: selectedDecl.description,
                  onChange: (next: string) => patchSelected((d) => (d.kind === "subAgentTool" ? { ...d, description: next } : d)),
                },
                name: {
                  value: selectedDecl.name,
                  onChange: (next: string) => patchSelected((d) => (d.kind === "subAgentTool" ? { ...d, name: next } : d)),
                },
              }
            : {};

  return (
    <div className="designer" data-testid="designer-page">
      <TopBar />
      <div className="designer-body">
        <DeclList
          spec={spec}
          selected={selected}
          onSelect={(d) => {
            setSelected(d);
            if (view === "code") setView("split");
          }}
          onAdd={addDecl}
          onRemove={remove}
          onAttach={(toolId, agentId) => mutate((s) => attachTool(s, toolId, agentId))}
          deleted={deleted === null ? null : { label: deleted.value.id }}
          onUndoDelete={undoDelete}
          onDismissDeleted={() => setDeleted(null)}
        />

        <main className="designer-main">
          <div className="tabs" data-testid="designer-tabs" role="tablist">
            <button className={view === "design" ? "tab-on" : ""} data-testid="designer-tab-design" role="tab" aria-selected={view === "design"} onClick={() => setView("design")}>
              Design
            </button>
            <button className={view === "split" ? "tab-on" : ""} data-testid="designer-tab-split" role="tab" aria-selected={view === "split"} onClick={() => setView("split")} title="Panels + live code (⌘E)">
              <span className="tab-duo">
                <i />
                <i />
              </span>{" "}
              Split
            </button>
            <button className={view === "code" ? "tab-on" : ""} data-testid="designer-tab-code" role="tab" aria-selected={view === "code"} onClick={() => setView("code")}>
              Code <span className="pill">ts</span>
              {store.opaqueCount > 0 && (
                <span className="pill" title="Statements kept verbatim because they aren't structured — they round-trip losslessly.">
                  {store.opaqueCount} verbatim
                </span>
              )}
              {frozen && <span className="pill pill-err">parse error</span>}
            </button>
            <div className="tabs-right">
              <span className={frozen ? "mono" : "mono sync-live"} style={frozen ? { color: "var(--warn)" } : undefined} data-testid="designer-sync">
                {frozen ? "out of sync" : store.saving ? "regenerating…" : "in sync"}
              </span>
              <kbd>⌘E</kbd>
            </div>
          </div>

          {view === "design" && designPane}
          {view === "code" && <CodeEditor value={store.code} onChange={store.updateCode} diagnostics={store.diagnostics} />}
          {view === "split" && (
            <div className="designer-split" data-testid="designer-split">
              <div className="split-pane split-pane-spec pane-authored">
                <div className="pane-head">
                  <span className="pane-dot pane-dot-authored" /> Spec — <b>you author this</b>
                  <span className="pane-meta">
                    <code className="mono" style={{ color: "var(--accent)" }}>{selectedDecl?.id ?? "—"}</code>
                  </span>
                </div>
                <div className="design-scroll">{designPane}</div>
              </div>
              <div className="split-seam">
                <span className="seam-chip">
                  <span className="seam-pulse" /> generated
                </span>
              </div>
              {splitEditLine === null ? (
                <CodeView code={store.code} focus={focus} editable={editable} onEditRequest={setSplitEditLine} />
              ) : (
                <div className="split-pane pane-generated" data-testid="split-editor">
                  <div className="pane-head">
                    <span className="pane-dot pane-dot-generated" /> TypeScript — <b>you edit this</b>
                    <span className="pane-meta">
                      <button className="ghost" onClick={() => setSplitEditLine(null)} data-testid="split-editor-done" title="Back to the annotated listing">
                        done
                      </button>
                      <code className="mono">agent.ts</code>
                    </span>
                  </div>
                  <CodeEditor value={store.code} onChange={store.updateCode} diagnostics={store.diagnostics} focusLine={splitEditLine} />
                </div>
              )}
            </div>
          )}

          {/* Above the casebook: both act on the whole project, not the selected decl. Hidden in the
              Code view — hand-editing TypeScript while asking the AI to rewrite the spec is a
              conflict with no good resolution. */}
          {view !== "code" && instructionBar}

          <CasebookStrip
            cases={casebook.cases}
            specChangedAt={store.savedAt ?? 0}
            checking={casebook.checking}
            broke={casebook.broke}
            deleted={casebook.deleted}
            runId={id ?? ""}
            onAdd={(input) => {
              const caseId = casebook.add(input);
              void casebook.check(caseId, checkContext);
            }}
            onEdit={casebook.edit}
            onRemove={casebook.remove}
            onUndoRemove={casebook.undoRemove}
            onCheckAll={() => void casebook.checkAll(checkContext)}
            onCheck={(caseId) => void casebook.check(caseId, checkContext)}
            busy={busy}
          />
        </main>
      </div>

      {proposal !== null && (
        <ChangeSummary
          changes={proposal.changes}
          instruction={proposal.instruction}
          onDiscard={() => setProposal(null)}
          onApply={() => {
            const { changes, spec: next } = proposal;
            const previous = spec;
            // One updateSpec call, so this is ONE undo unit — and it flows through orderDecls and
            // the autosave (which is what makes every casebook verdict go stale) for free.
            mutate(() => next);
            setApplied({ summary: changes.map(describeChange).join(" · "), previous });
            setProposal(null);
          }}
        />
      )}
    </div>
  );
}
