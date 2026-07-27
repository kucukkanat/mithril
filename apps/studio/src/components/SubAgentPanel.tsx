import type { ProjectSpec, SubAgentToolSpec } from "@mithril/spec";

/*
 * Structured editor for one `asTool` decl — a whole agent exposed as another agent's tool.
 *
 * It exists because the parser now recognizes `asTool` (see packages/spec/src/parse.ts): before that
 * a sub-agent round-tripped as verbatim code and this panel could only point at the Code tab. A
 * sub-agent the AI creates but the user cannot edit would be worse than one it never created.
 *
 * Three fields, matching AgentPanel's restraint: the name and description the PARENT model reads
 * before delegating, and which agent it delegates to. The optional `inputSchema` stays in the Code
 * tab — it is absent from every sub-agent Studio can currently produce, and a schema editor that
 * usually renders empty is worse than an honest pointer.
 */

export interface SubAgentPanelProps {
  readonly spec: ProjectSpec;
  readonly sub: SubAgentToolSpec;
  readonly onChange: (next: SubAgentToolSpec) => void;
  /** Rename the decl (its const identifier), which the parent must apply across references. */
  readonly onRename: (nextId: string) => void;
  /** Which agent can call it — `null` means nothing can. */
  readonly owner: string | null;
}

export function SubAgentPanel({ spec, sub, onChange, onRename, owner }: SubAgentPanelProps) {
  // An asTool attached to the agent it wraps would call itself, so its owner is never a valid target.
  const targets = spec.decls.filter((d) => d.kind === "agent" && d.id !== owner);

  return (
    <div className="panel" data-testid="subagent-panel">
      <div className="panel-head">
        <h3>asTool</h3>
        <input
          className="name-input name-input-wide"
          value={sub.name}
          onChange={(e) => onChange({ ...sub, name: e.target.value })}
          spellCheck={false}
          aria-label="Sub-agent tool name"
          data-testid="subagent-name"
        />
        <span className="owner-note" style={{ color: owner === null ? "var(--warn)" : "var(--text-faint)" }} data-testid="subagent-owner">
          {owner === null ? "no agent can call it" : `called by ${owner}`}
        </span>
      </div>

      <div className="panel-grid">
        <div className="field span-all">
          <h4 style={{ marginTop: 0 }}>Delegates to</h4>
          <select
            value={sub.agentId}
            onChange={(e) => onChange({ ...sub, agentId: e.target.value })}
            aria-label="Agent this delegates to"
            data-testid="subagent-target"
          >
            {/* A dangling agentId (the wrapped agent was deleted or renamed in the Code tab) must stay
                selectable, or the panel would silently repoint it to whatever happens to be first. */}
            {targets.every((t) => t.id !== sub.agentId) && <option value={sub.agentId}>{sub.agentId} — missing</option>}
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}
              </option>
            ))}
          </select>
          <p className="hint">
            The whole <code>{sub.agentId}</code> agent runs when this is called, and its reply comes back as the tool result.
          </p>
        </div>

        <div className="field span-all">
          <h4 style={{ marginTop: 0 }}>When to delegate</h4>
          <textarea
            rows={3}
            value={sub.description}
            onChange={(e) => onChange({ ...sub, description: e.target.value })}
            placeholder="Use this when the user asks about charges, invoices, refunds or their plan."
            data-testid="subagent-description"
          />
          <p className="hint">
            This is all the calling model reads before handing over. Say <em>when</em> to use it, not what the other agent is.
          </p>
        </div>

        <div className="field span-all">
          <h4 style={{ marginTop: 0 }}>Identifier</h4>
          <input
            className="name-input name-input-wide"
            value={sub.id}
            onChange={(e) => onRename(e.target.value)}
            spellCheck={false}
            aria-label="Sub-agent tool identifier"
            data-testid="subagent-id"
          />
          <p className="hint">The const name in generated code. Renaming repoints every agent that lists it.</p>
        </div>

        {sub.input !== undefined && (
          <div className="field span-all">
            <h4 style={{ marginTop: 0 }}>Input schema</h4>
            <pre className="mono opaque-preview" data-testid="subagent-input">{sub.input.zod}</pre>
            <p className="hint">Edit this in the Code tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}
