import { useEffect, useRef, useState } from "react";
import type { ProjectDecl, ProjectSpec } from "@mithril/spec";
import { pickScore } from "../lib/pick-score.ts";
import { ownerOf, TOOL_DRAG_TYPE } from "../lib/attach.ts";
import { AgentIcon, CloseIcon, PlusIcon, ToolIcon } from "./icons.tsx";

/*
 * The declaration rail.
 *
 * Attachment is DRAG-ONLY by design: a tool belongs to whichever agent lists it, and the way to
 * change that is to drag the tool onto an agent — or into "Not attached" to detach it. No checkbox
 * grid, because the rail is already the picture of the structure and a second representation of the
 * same fact would be one more thing to keep in sync.
 */

const isToolLike = (d: ProjectDecl): boolean => d.kind === "tool" || d.kind === "subAgentTool";

/** A one-line note under each row: what this decl is, or what is wrong with it. */
function noteFor(spec: ProjectSpec, decl: ProjectDecl): { readonly text: string; readonly tone: "faint" | "warn" | "bad" } {
  if (decl.kind === "agent") {
    const n = decl.tools.length;
    return { text: n === 0 ? "no tools" : `${n} tool${n === 1 ? "" : "s"}`, tone: "faint" };
  }
  if (decl.kind === "tool") {
    if (ownerOf(spec, decl.id) === null) return { text: "no agent can call it", tone: "warn" };
    const { score } = pickScore(decl);
    if (score < 45) return { text: `weak description · ${score}`, tone: "bad" };
    if (score < 75) return { text: `could be sharper · ${score}`, tone: "warn" };
    return { text: `reads well · ${score}`, tone: "faint" };
  }
  if (decl.kind === "subAgentTool") return { text: `wraps ${decl.agentId}`, tone: "faint" };
  return { text: "verbatim code", tone: "warn" };
}

const TONE_VAR = { faint: "var(--text-faint)", warn: "var(--warn)", bad: "var(--bad)" } as const;

const KIND_CLASS: Record<string, string> = {
  agent: "decl-kind k-agent",
  tool: "decl-kind k-tool",
  subAgentTool: "decl-kind k-workflow",
  opaque: "decl-kind k-opaque",
  workflow: "decl-kind k-workflow",
};

const KIND_LABEL: Record<string, string> = { agent: "agent", tool: "tool", subAgentTool: "asTool", opaque: "code", workflow: "flow" };

export interface DeclListProps {
  readonly spec: ProjectSpec;
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  readonly onAdd: (kind: "tool" | "agent") => void;
  readonly onRemove: (id: string) => void;
  /** Move a tool to an agent, or detach it when `agentId` is null. */
  readonly onAttach: (toolId: string, agentId: string | null) => void;
  /** The last deletion, for the undo strip. */
  readonly deleted: { readonly label: string } | null;
  readonly onUndoDelete: () => void;
  readonly onDismissDeleted: () => void;
}

const RAIL_DEFAULT = 248;
const RAIL_MIN = 200;
const RAIL_MAX = 460;

export function DeclList({ spec, selected, onSelect, onAdd, onRemove, onAttach, deleted, onUndoDelete, onDismissDeleted }: DeclListProps) {
  const [width, setWidth] = useState(RAIL_DEFAULT);
  const [resizing, setResizing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<string | null>(null);
  const startX = useRef(0);
  const startW = useRef(RAIL_DEFAULT);

  // Resizing tracks the pointer on the window, not the handle: a fast drag outruns a 5px handle and
  // would otherwise drop the gesture mid-motion.
  useEffect(() => {
    if (!resizing) return;
    const move = (e: MouseEvent): void => setWidth(Math.max(RAIL_MIN, Math.min(RAIL_MAX, startW.current + (e.clientX - startX.current))));
    const up = (): void => setResizing(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [resizing]);

  const agents = spec.decls.filter((d) => d.kind === "agent");
  const attached = spec.decls.filter((d) => isToolLike(d) && ownerOf(spec, d.id) !== null);
  const loose = spec.decls.filter((d) => isToolLike(d) && ownerOf(spec, d.id) === null);
  const others = spec.decls.filter((d) => d.kind !== "agent" && !isToolLike(d));
  // Agents first, each followed by its own tools — the rail reads as the structure, not a flat list.
  const thisAgent = [...agents.flatMap((a) => [a, ...attached.filter((t) => ownerOf(spec, t.id) === a.id)]), ...others];

  const canDrop = (targetId: string): boolean => dragId !== null && dragId !== targetId && spec.decls.some((d) => d.id === dragId && isToolLike(d));

  const row = (decl: ProjectDecl, indent: boolean) => {
    const note = noteFor(spec, decl);
    const isEntry = decl.kind === "agent" && spec.entry.target === decl.id;
    const dropping = dropOn === decl.id && decl.kind === "agent";
    const dot = note.tone === "bad" ? "var(--bad)" : note.tone === "warn" ? "var(--warn)" : decl.kind === "agent" ? "var(--accent)" : "var(--gen)";
    return (
      <li
        key={decl.id}
        className={`${selected === decl.id ? "sel" : ""}${dragId === decl.id ? " dragging" : ""}${dropping ? " drop-on" : ""}`}
        style={indent ? { marginLeft: "var(--mth-space-3)" } : undefined}
        data-testid={`decl-row-${decl.id}`}
        draggable={isToolLike(decl)}
        onDragStart={(e) => {
          e.dataTransfer.setData(TOOL_DRAG_TYPE, decl.id);
          e.dataTransfer.setData("text/plain", decl.id);
          e.dataTransfer.effectAllowed = "move";
          setDragId(decl.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setDropOn(null);
        }}
        onDragOver={(e) => {
          if (decl.kind !== "agent" || !canDrop(decl.id)) return;
          e.preventDefault();
          setDropOn(decl.id);
        }}
        onDragLeave={() => setDropOn((cur) => (cur === decl.id ? null : cur))}
        onDrop={(e) => {
          if (decl.kind !== "agent" || dragId === null) return;
          e.preventDefault();
          onAttach(dragId, decl.id);
          setDragId(null);
          setDropOn(null);
        }}
      >
        <button className="decl decl-stack" onClick={() => onSelect(decl.id)} data-testid={`decl-select-${decl.id}`}>
          <span className="decl-top">
            <span className={KIND_CLASS[decl.kind] ?? "decl-kind"}>{KIND_LABEL[decl.kind] ?? decl.kind}</span>
            {isEntry && <span className="entry-badge">entry</span>}
            <span className="decl-dot" style={{ background: dot }} />
          </span>
          <code>{decl.kind === "tool" || decl.kind === "subAgentTool" ? decl.name : decl.id}</code>
          <span className="decl-note" style={{ color: TONE_VAR[note.tone] }}>{note.text}</span>
        </button>
        {isEntry ? (
          <span className="decl-note" title="The entry agent cannot be deleted" style={{ color: "var(--text-faint)", paddingRight: "var(--mth-space-1)" }}>
            entry
          </span>
        ) : (
          <button
            className="ghost icon-btn decl-del decl-del-sm"
            onClick={() => onRemove(decl.id)}
            title={`Delete ${decl.id}`}
            aria-label={`Delete ${decl.id}`}
            data-testid={`decl-delete-${decl.id}`}
          >
            <CloseIcon />
          </button>
        )}
      </li>
    );
  };

  // The run shape: what a run will actually do, read straight off the spec.
  const entryAgent = agents.find((a) => a.id === spec.entry.target);
  const flow =
    entryAgent === undefined
      ? [{ id: "none", label: "no entry agent", gen: false }]
      : [
          { id: "__start", label: "▸ run starts", gen: false },
          { id: entryAgent.id, label: `  ${entryAgent.id}`, gen: false },
          ...entryAgent.tools.map((t) => {
            const d = spec.decls.find((x) => x.id === t);
            const name = d !== undefined && (d.kind === "tool" || d.kind === "subAgentTool") ? d.name : t;
            return { id: t, label: `    ↳ ${name}`, gen: true };
          }),
        ];

  return (
    <>
      <nav className="decl-list" style={{ flex: `0 0 ${width}px`, width: `${width}px` }} data-testid="decl-list">
        <div className="decl-actions">
          <button className="decl-add" onClick={() => onAdd("agent")} title="Add an agent" data-testid="decl-add-agent">
            <span className="decl-add-glyph">
              <AgentIcon />
              <PlusIcon className="icon decl-add-plus" />
            </span>
            agent
          </button>
          <button className="decl-add" onClick={() => onAdd("tool")} title="Add a tool" data-testid="decl-add-tool">
            <span className="decl-add-glyph">
              <ToolIcon />
              <PlusIcon className="icon decl-add-plus" />
            </span>
            tool
          </button>
        </div>

        <div>
          <div className="decl-group-head">
            <h4>This agent</h4>
            <span className="decl-count">{thisAgent.length}</span>
          </div>
          <ul>{thisAgent.map((d) => row(d, isToolLike(d)))}</ul>
          <p className="hint" style={{ marginBottom: 0 }}>
            {loose.length > 0 ? "Drag a tool onto an agent to attach it." : "Drag a tool to move it between agents."}
          </p>
          {deleted !== null && (
            <div className="undo-strip" data-testid="decl-undo">
              <span className="undo-note">Deleted {deleted.label}</span>
              <button className="ghost" onClick={onUndoDelete} data-testid="decl-undo-button">Undo</button>
              <button className="ghost icon-btn" onClick={onDismissDeleted} title="Dismiss" aria-label="Dismiss" data-testid="decl-undo-dismiss">
                <CloseIcon />
              </button>
            </div>
          )}
        </div>

        <div
          className={`rail-loose${dropOn === "__loose" ? " drop-on" : ""}`}
          data-testid="decl-loose"
          onDragOver={(e) => {
            if (dragId === null) return;
            e.preventDefault();
            setDropOn("__loose");
          }}
          onDragLeave={() => setDropOn((cur) => (cur === "__loose" ? null : cur))}
          onDrop={(e) => {
            if (dragId === null) return;
            e.preventDefault();
            onAttach(dragId, null);
            setDragId(null);
            setDropOn(null);
          }}
        >
          <h4 style={{ marginTop: 0 }}>Not attached</h4>
          {loose.length > 0 ? (
            <ul>{loose.map((d) => row(d, false))}</ul>
          ) : (
            <p className="hint" style={{ margin: 0 }}>Drag a tool here to detach it from its agent.</p>
          )}
        </div>

        <div>
          <h4>Run shape</h4>
          <div className="dataflow dataflow-col">
            {flow.map((f) => (
              <button
                key={f.id}
                className={`flow-step${f.gen ? " flow-gen" : ""}${selected === f.id ? " on" : ""}`}
                onClick={() => {
                  if (spec.decls.some((d) => d.id === f.id)) onSelect(f.id);
                }}
                data-testid={`flow-step-${f.id}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div
        className={`rail-resize${resizing ? " on" : ""}`}
        title="Drag to resize · double-click to reset"
        onMouseDown={(e) => {
          startX.current = e.clientX;
          startW.current = width;
          setResizing(true);
        }}
        onDoubleClick={() => setWidth(RAIL_DEFAULT)}
        data-testid="rail-resize"
      />
    </>
  );
}
