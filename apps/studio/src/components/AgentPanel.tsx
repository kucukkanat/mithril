import { useState, type CSSProperties } from "react";
import type { AgentSpec, ProjectSpec, ToolSpec } from "@mithril/spec";
import { hasConcern, pickScore, weakestReason } from "../lib/pick-score.ts";
import { ModelPicker } from "./ModelPicker.tsx";
import { TOOL_DRAG_TYPE } from "../lib/attach.ts";

/*
 * Structured editor for one agent decl: the job it does, the model it runs on, and the tools it can
 * call. Every change is a pure spec mutation — the store regenerates the code view.
 *
 * Three fields, deliberately. The spec supports budgets and middleware, but they are not what makes
 * a first agent work or fail; the Code tab is the honest place for them until they earn a panel.
 */

export interface AgentPanelProps {
  readonly spec: ProjectSpec;
  readonly agent: AgentSpec;
  readonly onChange: (next: AgentSpec) => void;
  /** Rename the decl (its const identifier), which the parent must apply across references. */
  readonly onRename: (nextId: string) => void;
  readonly onMakeEntry: () => void;
  readonly onOpenTool: (toolId: string) => void;
  readonly onDetachTool: (toolId: string) => void;
  /** Attach the tool dropped onto this agent. */
  readonly onDropTool: (toolId: string) => void;
  readonly dragging: boolean;
  /** Ask the drafting model to rewrite a tool's description. */
  readonly onFixTool: ((tool: ToolSpec) => void) | null;
  /** Which field the cursor is in, so the generated pane can highlight its line. */
  readonly focus: string | null;
  readonly onFocus: (field: string) => void;
}

const scoreColor = (score: number): string => (score >= 75 ? "var(--good)" : score >= 45 ? "var(--warn)" : "var(--bad)");

export function AgentPanel({
  spec,
  agent,
  onChange,
  onRename,
  onMakeEntry,
  onOpenTool,
  onDetachTool,
  onDropTool,
  dragging,
  onFixTool,
  focus,
  onFocus,
}: AgentPanelProps) {
  const [over, setOver] = useState(false);
  const isEntry = spec.entry.target === agent.id;
  const instructions = typeof agent.instructions === "string" ? agent.instructions : null;
  const tools = agent.tools.flatMap((id) => {
    const d = spec.decls.find((x) => x.id === id);
    return d !== undefined && (d.kind === "tool" || d.kind === "subAgentTool") ? [d] : [];
  });

  return (
    <div className="panel" data-testid="agent-panel">
      <div className="panel-head">
        <h3>agent</h3>
        <input
          className="name-input"
          value={agent.id}
          onChange={(e) => onRename(e.target.value)}
          spellCheck={false}
          aria-label="Agent name"
          data-testid="agent-name"
        />
        {isEntry ? (
          <span className="pill push">entry point</span>
        ) : (
          <button className="ghost push" onClick={onMakeEntry} title="The run starts here instead" style={{ fontSize: "var(--mth-fs-2xs)" }} data-testid="agent-make-entry">
            Make entry point
          </button>
        )}
      </div>

      <div className="panel-grid">
        <div className={`field${focus === "job" ? " field-linked" : ""}`} onClick={() => onFocus("job")}>
          <h4 style={{ marginTop: 0 }}>Job</h4>
          {instructions === null ? (
            <p className="hint" data-testid="agent-job-code">
              These instructions are a function of <code>ctx</code>, not a static string — edit them in the Code tab.
            </p>
          ) : (
            <>
              {/* A system prompt is paragraphs, not a name — a single-line input hid all but the
                  first few words of every real one. */}
              <textarea
                className="agent-job"
                rows={Math.min(14, Math.max(4, instructions.split("\n").length + 1))}
                value={instructions}
                onChange={(e) => onChange({ ...agent, instructions: e.target.value })}
                onFocus={() => onFocus("job")}
                placeholder="Answer questions about current weather, and cite sources when asked"
                data-testid="agent-job"
              />
              <p className="hint">Becomes the agent&rsquo;s instructions, verbatim.</p>
            </>
          )}
        </div>

        <div className={`field${focus === "model" ? " field-linked" : ""}`} onClick={() => onFocus("model")}>
          <h4 style={{ marginTop: 0 }}>Model</h4>
          <ModelPicker value={agent.model} onChange={(model) => onChange({ ...agent, model })} />
        </div>

        <div className="field span-all">
          <div className="field-head">
            <h4>Tools</h4>
            <span className="count">{tools.length}</span>
          </div>
          <div
            // The empty state has its own dropzone; outlining the container too would double it up.
            className={`tool-rows${dragging && tools.length > 0 ? " droppable" : ""}${over ? " over" : ""}`}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              const toolId = e.dataTransfer.getData(TOOL_DRAG_TYPE) || e.dataTransfer.getData("text/plain");
              if (toolId.length > 0) onDropTool(toolId);
            }}
            data-testid="agent-tool-rows"
          >
            {tools.map((t) => {
              // An asTool wrapper has no description of its own to lint — the child agent is the thing.
              const score = t.kind === "tool" ? pickScore(t) : null;
              // Flagged by whether anything is actually wrong, NOT by the number. A tool at 90 with a live
              // finding used to render clean, which is exactly how a broken tool read as fine.
              const weak = score !== null && hasConcern(score);
              return (
                <div key={t.id} className={`tool-row${weak ? " weak" : ""}`} data-testid={`agent-tool-${t.id}`}>
                  <div className="tool-row-top">
                    <button className="ghost tool-row-name" onClick={() => onOpenTool(t.id)} data-testid={`agent-tool-open-${t.id}`}>
                      {t.name}
                    </button>
                    <span className={t.kind === "tool" ? "decl-kind k-tool" : "decl-kind k-workflow"}>{t.kind === "tool" ? "tool" : "asTool"}</span>
                    <span className="tool-row-right">
                      {score !== null && (
                        <>
                          <span className="meter" style={{ "--pct": `${score.score}%`, "--tone": scoreColor(score.score) } as CSSProperties}>
                            <i />
                          </span>
                          <span className="meter-label" style={{ color: scoreColor(score.score) }}>
                            {score.score} / 100
                          </span>
                        </>
                      )}
                      <button className="ghost detach" onClick={() => onDetachTool(t.id)} data-testid={`agent-tool-detach-${t.id}`}>
                        Detach
                      </button>
                    </span>
                  </div>
                  {score !== null && weak && (
                    <div className="tool-row-why">
                      <span className="hint">{weakestReason(score) ?? "Could be sharper."}</span>
                      {onFixTool !== null && t.kind === "tool" && (
                        <button className="primary" onClick={() => onFixTool(t)} data-testid={`agent-tool-fix-${t.id}`}>
                          Fix the description
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {tools.length === 0 && (
              <div className={`dropzone${dragging ? " over" : ""}`} data-testid="agent-tools-empty">
                <span className="hint">Drag a tool here from the rail.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
