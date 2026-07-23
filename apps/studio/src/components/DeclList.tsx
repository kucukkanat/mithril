import type { ProjectDecl, ProjectSpec } from "@mithril/spec";
import type { ProjectListEntry } from "../lib/db.ts";

/*
 * The left rail: a project switcher, then every top-level declaration in file order.
 * Add/select/remove; the entry agent is badged. Opaque decls are selectable too — they open the
 * code view.
 */

export interface DeclListProps {
  readonly spec: ProjectSpec;
  readonly selected: string | null;
  readonly onSelect: (id: string) => void;
  readonly onAdd: (kind: "tool" | "agent") => void;
  readonly onRemove: (id: string) => void;
  /** All projects in this browser, for the switcher. */
  readonly projects: readonly ProjectListEntry[];
  /** The currently-open project's id (the switcher's selected value). */
  readonly projectId: string;
  /** Navigate to another project's designer. */
  readonly onSwitchProject: (id: string) => void;
}

const KIND_LABEL: Record<ProjectDecl["kind"], string> = {
  tool: "tool",
  agent: "agent",
  subAgentTool: "sub-agent",
  workflow: "workflow",
  opaque: "code",
};

export function DeclList({ spec, selected, onSelect, onAdd, onRemove, projects, projectId, onSwitchProject }: DeclListProps) {
  return (
    <nav className="decl-list" data-testid="decl-list">
      <select
        className="project-switcher"
        data-testid="project-switcher"
        value={projectId}
        onChange={(e) => e.target.value !== projectId && onSwitchProject(e.target.value)}
      >
        {/* The open project may not be in the (async-loaded) list yet — keep it selectable. */}
        {projects.every((p) => p.id !== projectId) && (
          <option value={projectId}>{spec.name}</option>
        )}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="decl-actions" data-testid="decl-actions">
        <button className="ghost" data-testid="decl-add-agent" onClick={() => onAdd("agent")}>
          + agent
        </button>
        <button className="ghost" data-testid="decl-add-tool" onClick={() => onAdd("tool")}>
          + tool
        </button>
      </div>
      <ul>
        {spec.decls.map((d) => (
          <li key={d.id} className={selected === d.id ? "sel" : ""} data-testid={`decl-item-${d.id}`}>
            <button className="decl" data-testid={`decl-select-${d.id}`} onClick={() => onSelect(d.id)}>
              <span className={`decl-kind k-${d.kind}`}>{KIND_LABEL[d.kind]}</span>
              <code>{d.id}</code>
              {spec.entry.target === d.id && <span className="entry-badge" data-testid={`decl-entry-badge-${d.id}`}>entry</span>}
            </button>
            <button className="decl-del" data-testid={`decl-remove-${d.id}`} title="Remove" onClick={() => onRemove(d.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
