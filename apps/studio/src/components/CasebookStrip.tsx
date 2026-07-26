import { useState } from "react";
import { Link } from "react-router-dom";
import { gradeCase, healthOf, type Case, type Verdict } from "../lib/casebook.ts";
import { CloseIcon, PencilIcon } from "./icons.tsx";

/*
 * The casebook strip under the Designer: the examples this agent must keep handling.
 *
 * Re-checking is explicit. Each check is a real run, so a spec edit only marks verdicts STALE — the
 * strip says so and waits, rather than quietly spending tokens on every keystroke.
 */

export interface CasebookStripProps {
  readonly cases: readonly Case[];
  /** When the spec last changed; anything checked before this is stale. */
  readonly specChangedAt: number;
  readonly checking: readonly string[];
  readonly broke: readonly string[];
  readonly deleted: { readonly value: Case } | null;
  readonly runId: string;
  readonly onAdd: (input: string) => void;
  readonly onEdit: (id: string, input: string) => void;
  readonly onRemove: (id: string) => void;
  readonly onUndoRemove: () => void;
  readonly onCheckAll: () => void;
  readonly onCheck: (id: string) => void;
  readonly busy: boolean;
}

const DOT: Record<Verdict, string> = {
  pass: "var(--good)",
  fail: "var(--bad)",
  stale: "var(--warn)",
  unreviewed: "var(--text-faint)",
  checking: "var(--gen)",
};

const LABEL: Record<Verdict, string> = { pass: "pass", fail: "fail", stale: "stale", unreviewed: "unreviewed", checking: "checking" };

export function CasebookStrip({
  cases,
  specChangedAt,
  checking,
  broke,
  deleted,
  runId,
  onAdd,
  onEdit,
  onRemove,
  onUndoRemove,
  onCheckAll,
  onCheck,
  busy,
}: CasebookStripProps) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const health = healthOf([...cases], specChangedAt);

  const submit = (): void => {
    const text = draft.trim();
    if (text.length === 0) return;
    setDraft("");
    onAdd(text);
  };

  return (
    <section className="casebook" data-testid="casebook">
      <div className="pane-head">
        <span className="pane-dot pane-dot-authored" /> Casebook — <b>what it must handle</b>
        <span className="pane-meta">
          {cases.length > 0 && (
            <span className={`status status-${health.tone === "good" ? "done" : health.tone === "bad" ? "error" : "suspended"}`} data-testid="casebook-health">
              {health.label}
            </span>
          )}
          {broke.length > 0 && (
            <span className="mono" style={{ color: "var(--bad)" }} data-testid="casebook-broke">
              {broke.length} just broke
            </span>
          )}
          {deleted !== null && (
            <>
              <span className="mono" style={{ fontSize: "var(--mth-fs-2xs)", color: "var(--warn)" }}>
                deleted a case
              </span>
              <button className="ghost" onClick={onUndoRemove} data-testid="casebook-undo">Undo</button>
            </>
          )}
          <button className="ghost" onClick={onCheckAll} disabled={busy || cases.length === 0} data-testid="casebook-recheck">
            {busy ? "Checking…" : "Re-check all"}
          </button>
          <Link to={`/p/${runId}/run`} data-testid="casebook-open-run">Open in Run ↗</Link>
        </span>
      </div>

      <div className="case-strip">
        {cases.map((c) => {
          const isChecking = checking.includes(c.id);
          const result = gradeCase(c, specChangedAt);
          const verdict: Verdict = isChecking ? "checking" : result.verdict;
          if (editing === c.id) {
            return (
              <div key={c.id} className="case-card" data-testid={`case-${c.id}`}>
                <div className="case-editing">
                  <span className="eyebrow" style={{ border: "none", padding: 0 }}>Edit case</span>
                  <textarea
                    rows={2}
                    value={editDraft}
                    autoFocus
                    aria-label="Edit case"
                    data-testid="case-edit-input"
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditing(null);
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        onEdit(c.id, editDraft.trim());
                        setEditing(null);
                      }
                    }}
                  />
                  <span className="case-editing-actions">
                    <button
                      className="primary"
                      data-testid="case-edit-save"
                      onClick={() => {
                        onEdit(c.id, editDraft.trim());
                        setEditing(null);
                      }}
                    >
                      Save
                    </button>
                    <button className="ghost" onClick={() => setEditing(null)} data-testid="case-edit-cancel">Cancel</button>
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div key={c.id} className="case-card" data-testid={`case-${c.id}`}>
              <button
                className={`case-open ${verdict}${broke.includes(c.id) ? " broke" : ""}`}
                onClick={() => onCheck(c.id)}
                title={busy ? "A check is already running" : "Re-check just this case"}
                disabled={busy}
                data-testid={`case-check-${c.id}`}
              >
                <span className="case-top">
                  <span className="case-dot" style={{ background: DOT[verdict] }} />
                  <span className="case-verdict" style={{ color: DOT[verdict] }}>{LABEL[verdict]}</span>
                  <span className="case-meta">{c.last !== null ? `${(c.last.ms / 1000).toFixed(1)}s` : ""}</span>
                </span>
                <span className="case-input">{c.input}</span>
                <span className="case-why" style={{ color: verdict === "fail" ? "var(--bad)" : "var(--text-faint)" }}>
                  {isChecking ? "running…" : result.why}
                </span>
              </button>
              <button
                className="ghost icon-btn case-edit"
                onClick={() => {
                  setEditing(c.id);
                  setEditDraft(c.input);
                }}
                title="Edit this case"
                aria-label="Edit this case"
                data-testid={`case-edit-${c.id}`}
              >
                <PencilIcon />
              </button>
              <button className="ghost icon-btn case-del" onClick={() => onRemove(c.id)} title="Delete this case" aria-label="Delete this case" data-testid={`case-remove-${c.id}`}>
                <CloseIcon />
              </button>
            </div>
          );
        })}

        <div className="case-add">
          <span className="eyebrow" style={{ border: "none", padding: 0 }}>Add a case</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="What a user would ask…"
            aria-label="New case"
            data-testid="casebook-draft"
          />
          <button className="primary" onClick={submit} disabled={draft.trim().length === 0} data-testid="casebook-add">
            Add &amp; check it
          </button>
        </div>
      </div>
    </section>
  );
}
