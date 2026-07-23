import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AgentSpec, ProjectSpec, ToolSpec } from "@mithril/spec";
import { listProjects, type ProjectListEntry } from "../lib/db.ts";
import { useProjectStore } from "../state/projectStore.ts";
import { DeclList } from "../components/DeclList.tsx";
import { AgentPanel } from "../components/AgentPanel.tsx";
import { ToolPanel } from "../components/ToolPanel.tsx";
import { CodeEditor } from "../components/CodeEditor.tsx";
import { TopBar } from "../components/TopBar.tsx";

/*
 * The designer: decl rail · structured panel for the selected decl · the two-way code view. The
 * entry agent is auto-selected on land so a newcomer never hits an empty panel; a Split view lets
 * you watch the code regenerate as you edit (⌘E). Panels freeze (dimmed) while hand-edited code has
 * diagnostics the parser can't lift.
 */

function freshId(spec: ProjectSpec, base: string): string {
  let i = 1;
  let id = `${base}${i}`;
  while (spec.decls.some((d) => d.id === id)) {
    i++;
    id = `${base}${i}`;
  }
  return id;
}

type View = "design" | "split" | "code";

export function DesignerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>("design");
  const [projects, setProjects] = useState<readonly ProjectListEntry[]>([]);

  // The project store is shared by the Design/Run views — never close it on unmount
  // (a route transition would race the next page's open and strand it on "Loading").
  useEffect(() => {
    if (id !== undefined && store.projectId !== id) void store.open(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const spec = store.spec;

  // Auto-select the entry agent (fallback: first agent, else first decl) whenever nothing valid is
  // selected — so a fresh project or a project switch lands on a populated panel, not a placeholder.
  useEffect(() => {
    if (spec === null) return;
    if (selected !== null && spec.decls.some((d) => d.id === selected)) return;
    const target = spec.decls.find((d) => d.id === spec.entry.target)?.id ?? spec.decls.find((d) => d.kind === "agent")?.id ?? spec.decls[0]?.id ?? null;
    setSelected(target);
  }, [spec, selected]);

  // ⌘E / Ctrl-E toggles the split code view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setView((v) => (v === "split" ? "design" : "split"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Refresh the switcher list whenever the project changes or its name is edited.
  const specName = spec?.name;
  useEffect(() => {
    void listProjects().then(setProjects);
  }, [id, specName]);

  const switchProject = (nextId: string): void => {
    setSelected(null);
    setView("design");
    navigate(`/p/${nextId}`);
  };

  if (store.loading || spec === null) return <div className="page-empty" data-testid="designer-loading">Loading project…</div>;

  const selectedDecl = spec.decls.find((d) => d.id === selected) ?? null;
  const frozen = store.codeDirty && store.diagnostics.some((d) => d.severity === "error");

  const addDecl = (kind: "tool" | "agent"): void => {
    let newId = "";
    store.updateSpec((s) => {
      if (kind === "tool") {
        const tid = freshId(s, "tool");
        newId = tid;
        const tool: ToolSpec = {
          kind: "tool",
          id: tid,
          name: tid,
          description: "Describe what this tool does.",
          inputSchema: { zod: `z.object({ input: z.string() })` },
          execute: { code: `async ({ input }) => ({ echoed: input })` },
        };
        return { ...s, decls: [...s.decls, tool] };
      }
      const aid = freshId(s, "agent");
      newId = aid;
      const agent: AgentSpec = {
        kind: "agent",
        id: aid,
        model: { kind: "local", model: "onnx-community/Qwen3-0.6B-ONNX" },
        instructions: "You are a helpful assistant.",
        tools: [],
      };
      return { ...s, decls: [...s.decls, agent] };
    });
    setSelected(newId); // jump straight into the thing you just added
  };

  const removeDecl = (declId: string): void => {
    const decl = spec.decls.find((d) => d.id === declId);
    if (decl?.kind === "agent" && !window.confirm(`Delete agent "${declId}"? This can't be undone.`)) return;
    store.updateSpec((s) => {
      const decls = s.decls
        .filter((d) => d.id !== declId)
        .map((d) => (d.kind === "agent" ? { ...d, tools: d.tools.filter((t) => t !== declId) } : d));
      // Repair a dangling entry: if the entry agent was removed, point it at the next agent (or clear).
      const target = s.entry.target === declId ? (decls.find((d) => d.kind === "agent")?.id ?? "") : s.entry.target;
      return { ...s, decls, entry: { ...s.entry, target } };
    });
    if (selected === declId) setSelected(null);
  };

  const replaceDecl = (next: AgentSpec | ToolSpec): void => {
    store.updateSpec((s) => ({ ...s, decls: s.decls.map((d) => (d.id === next.id ? next : d)) }));
  };

  const designContent = (
    <div className={`design-pane${frozen ? " frozen" : ""}`} data-testid="designer-design-pane">
      {frozen && (
        <p className="freeze-note">
          The code view has errors the parser can’t lift — panels reflect the last good state. Fix the code to unfreeze.
        </p>
      )}
      {selectedDecl === null && <p className="hint">Select an agent or tool on the left to edit it — or add one with + agent / + tool.</p>}
      {selectedDecl?.kind === "agent" && <AgentPanel key={selectedDecl.id} spec={spec} agent={selectedDecl} onChange={replaceDecl} />}
      {selectedDecl?.kind === "tool" && <ToolPanel key={selectedDecl.id} tool={selectedDecl} onChange={replaceDecl} />}
      {selectedDecl !== null && selectedDecl.kind !== "agent" && selectedDecl.kind !== "tool" && (
        <div className="panel" data-testid="opaque-panel">
          <h3>
            verbatim code <code>{selectedDecl.id}</code>
          </h3>
          <p className="hint">This statement isn’t structured — edit it in the Code tab. It round-trips losslessly.</p>
          <pre className="mono opaque-preview" data-testid="opaque-preview">{selectedDecl.kind === "opaque" ? selectedDecl.code : ""}</pre>
        </div>
      )}
      <section className="panel" data-testid="entry-panel">
        <h3>Entry</h3>
        <label data-testid="entry-target-field">
          Run this agent
          <select
            data-testid="entry-target"
            value={spec.entry.target}
            onChange={(e) => store.updateSpec((s) => ({ ...s, entry: { ...s.entry, target: e.target.value } }))}
          >
            {spec.decls
              .filter((d) => d.kind === "agent")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id}
                </option>
              ))}
          </select>
        </label>
        {typeof spec.entry.input === "string" && (
          <label data-testid="entry-prompt-field">
            Prompt
            <textarea
              rows={2}
              data-testid="entry-prompt"
              value={spec.entry.input}
              onChange={(e) => store.updateSpec((s) => ({ ...s, entry: { ...s.entry, input: e.target.value } }))}
            />
          </label>
        )}
        {typeof spec.entry.input !== "string" && <p className="hint">The entry input is a chat history — drive it from the Run view.</p>}
        <button className="primary run-cta" data-testid="entry-run" onClick={() => navigate(`/p/${id}/run`)}>
          Run this agent →
        </button>
      </section>
    </div>
  );

  return (
    <div className="designer" data-testid="designer-page">
      <TopBar />
      <div className="designer-body">
        <DeclList
          spec={spec}
          selected={selected}
          onSelect={(d) => { setSelected(d); if (view === "code") setView("design"); }}
          onAdd={addDecl}
          onRemove={removeDecl}
          projects={projects}
          projectId={id ?? ""}
          onSwitchProject={switchProject}
        />

        <main className="designer-main">
          <div className="tabs" data-testid="designer-tabs" role="tablist">
            <button className={view === "design" ? "tab-on" : ""} data-testid="designer-tab-design" role="tab" aria-selected={view === "design"} onClick={() => setView("design")}>
              Design
            </button>
            <button className={view === "split" ? "tab-on" : ""} data-testid="designer-tab-split" role="tab" aria-selected={view === "split"} onClick={() => setView("split")} title="Panels + live code (⌘E)">
              Split
            </button>
            <button className={view === "code" ? "tab-on" : ""} data-testid="designer-tab-code" role="tab" aria-selected={view === "code"} onClick={() => setView("code")}>
              Code
              {store.opaqueCount > 0 && <span className="pill" title="Statements kept verbatim because they aren't structured — they round-trip losslessly.">{store.opaqueCount} verbatim</span>}
              {frozen && <span className="pill pill-err">parse error</span>}
            </button>
          </div>

          {view === "design" && designContent}
          {view === "code" && <CodeEditor value={store.code} onChange={store.updateCode} diagnostics={store.diagnostics} />}
          {view === "split" && (
            <div className="designer-split" data-testid="designer-split">
              {designContent}
              <div className="split-code">
                <p className="split-hint">Live generated code — edits on the left regenerate it instantly. Edit code directly in the Code tab.</p>
                <CodeEditor value={store.code} onChange={() => undefined} diagnostics={store.diagnostics} readOnly />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
