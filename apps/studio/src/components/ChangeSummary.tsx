import { describeChange, type SpecChange } from "../lib/spec-diff.ts";

/*
 * What an AI edit will do, shown before it does it.
 *
 * Structure, not a text diff: see lib/spec-diff.ts for why. Long values (a rewritten tool body) go
 * behind a <details> so the plan stays scannable — the question this answers is "is this the change
 * I asked for", and twenty lines of body text buries it.
 *
 * All-or-nothing on purpose. Cherry-picking individual changes is a much larger design and a worse
 * first version than a plan you can read and reject whole.
 */

export interface ChangeSummaryProps {
  readonly changes: readonly SpecChange[];
  readonly instruction: string;
  readonly onApply: () => void;
  readonly onDiscard: () => void;
}

const LONG = 80;

export function ChangeSummary({ changes, instruction, onApply, onDiscard }: ChangeSummaryProps) {
  return (
    <div className="sheet-backdrop" onClick={onDiscard} data-testid="change-summary">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Review the change">
        <div className="sheet-head">
          <h3>Before it changes anything</h3>
          <span className="pill pill-gen">{changes.length === 0 ? "no changes" : `${changes.length} change${changes.length === 1 ? "" : "s"}`}</span>
        </div>

        <p className="hint">
          You asked: <em>{instruction}</em>
        </p>

        {changes.length === 0 ? (
          <p className="freeze-note" data-testid="change-none">
            The model didn&rsquo;t change anything. Try naming the tool or agent you want changed.
          </p>
        ) : (
          <ul className="change-rows" data-testid="change-rows">
            {changes.map((c, i) => (
              <li key={i} className={`change-row change-${c.kind}`} data-testid={`change-row-${i}`}>
                <span className="change-verb">{c.kind === "add" ? "+" : c.kind === "remove" ? "−" : "~"}</span>
                <div className="change-body">
                  <strong>{describeChange(c)}</strong>
                  {(c.kind === "add" || c.kind === "remove") && c.label.length > 0 && <p className="hint">{c.label}</p>}
                  {c.kind === "update" &&
                    c.fields.map((f) => (
                      <div key={f.field} className="change-field">
                        {f.before.length + f.after.length > LONG ? (
                          <details>
                            <summary>{f.field}</summary>
                            <pre className="draft-preview">{f.before || "(nothing)"}</pre>
                            <pre className="draft-preview">{f.after || "(nothing)"}</pre>
                          </details>
                        ) : (
                          <span>
                            <span className="change-field-name">{f.field}</span> <s>{f.before || "(nothing)"}</s> → {f.after || "(nothing)"}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="draft-gate-actions">
          {changes.length > 0 && (
            <button className="primary" onClick={onApply} data-testid="change-apply">
              Apply
            </button>
          )}
          <button className="ghost" onClick={onDiscard} data-testid="change-discard">
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
