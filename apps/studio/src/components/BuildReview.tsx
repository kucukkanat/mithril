import type { ProjectSpec } from "@mithril/spec";
import { paramsOf } from "../lib/tool-fields.ts";
import { CAPABILITIES } from "../lib/capabilities.ts";
import { reachesOutside } from "../lib/probe.ts";
import type { BuildOutcome } from "../state/creatorStore.ts";

/*
 * What was built, before anything is saved.
 *
 * The project does not exist until Accept, so a bad generation costs a click rather than a project
 * you have to go and delete.
 *
 * The "reaches the network" chip is the honest half of letting the model write real bodies: it uses
 * the SAME detector that already gates the tool probe behind an explicit click (probe.ts's
 * OUTSIDE_WORLD), so a guessed endpoint is visible before the code is anywhere near a run.
 */

export interface BuildReviewProps {
  readonly outcome: BuildOutcome;
  readonly onAccept: () => void;
  readonly onRetry: () => void;
  readonly onTweak: () => void;
  readonly accepting: boolean;
}

/** The chips describing one tool: its inputs, and what its body does. */
function toolChips(code: string, zod: string): readonly { readonly text: string; readonly tone: "plain" | "warn" | "gen" }[] {
  const params = paramsOf(zod);
  const outside = reachesOutside(code);
  const stub = /TODO: call your real/i.test(code);
  return [
    { text: params.length === 0 ? "no inputs" : params.map((p) => `${p.name}: ${p.type}`).join(", "), tone: "plain" },
    stub ? { text: "placeholder body", tone: "warn" } : { text: "real body", tone: "gen" },
    ...(outside === null ? [] : [{ text: outside.capability, tone: "warn" as const }]),
  ];
}

/** Read a capability setup line back into its binding and backend, or null for any other opaque code. */
function describeStorage(code: string): { readonly binding: string; readonly summary: string; readonly persistent: boolean } | null {
  const m = /^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\(\)/.exec(code);
  const cap = m === null ? undefined : CAPABILITIES.find((c) => c.factory === m[2]);
  return cap === undefined || m?.[1] === undefined ? null : { binding: m[1], summary: cap.summary, persistent: cap.persistent };
}

export function BuildReview({ outcome, onAccept, onRetry, onTweak, accepting }: BuildReviewProps) {
  const { spec, notes, summary, stoppedEarly, error } = outcome;
  const empty = spec.decls.length === 0;

  const rows = spec.decls.flatMap((d) => {
    if (d.kind === "tool") return [{ kind: "tool", id: d.id, purpose: d.description, chips: toolChips(d.execute.code, d.inputSchema.zod) }];
    if (d.kind === "agent") {
      const chips = [
        { text: d.tools.length === 0 ? "no tools" : `${d.tools.length} tool${d.tools.length === 1 ? "" : "s"}`, tone: "plain" as const },
        ...(spec.entry.target === d.id ? [{ text: "starts here", tone: "gen" as const }] : []),
      ];
      return [{ kind: "agent", id: d.id, purpose: typeof d.instructions === "string" ? d.instructions : "(instructions are code)", chips }];
    }
    if (d.kind === "subAgentTool") {
      return [{ kind: "asTool", id: d.id, purpose: d.description, chips: [{ text: `delegates to ${d.agentId}`, tone: "plain" as const }] }];
    }
    // Storage is the one opaque decl the build produces itself, and it is the whole reason a body
    // can persist anything — showing only the tools would hide where the data actually goes.
    if (d.kind === "opaque") {
      const cap = describeStorage(d.code);
      return cap === null ? [] : [{ kind: "storage", id: cap.binding, purpose: cap.summary, chips: [{ text: cap.persistent ? "persists across runs" : "in-memory only", tone: cap.persistent ? ("gen" as const) : ("warn" as const) }] }];
    }
    return [];
  });

  return (
    <div className="panel build-review" data-testid="build-review">
      <div className="panel-head">
        <h3>{empty ? "nothing to review" : "what it built"}</h3>
        <span className="pill pill-gen">{spec.name}</span>
      </div>

      {summary !== null && <p className="build-summary" data-testid="build-summary">{summary}</p>}

      {error !== null && (
        <p className="freeze-note" data-testid="build-error">
          {error}
        </p>
      )}
      {error === null && stoppedEarly && !empty && (
        <p className="freeze-note" data-testid="build-early">
          The model stopped before saying it was finished. Here is what it built — check it before accepting.
        </p>
      )}
      {error === null && empty && (
        // The commonest failure by far, and it has a specific cause worth naming: building an agent
        // takes tool calls, and a small on-device model often replies in prose instead of making any.
        <p className="freeze-note" data-testid="build-empty">
          The model answered in prose instead of calling the tools that create things, so nothing was built. Larger models are much better at this — try
          again, or pick a bigger model above.
        </p>
      )}

      {notes.length > 0 && (
        <ul className="build-notes" data-testid="build-notes">
          {notes.map((n, i) => (
            <li key={i} className={n.tone === "warn" ? "note-warn" : "note-info"}>
              {n.text}
            </li>
          ))}
        </ul>
      )}

      <ol className="review-rows">
        {rows.map((r) => (
          <li key={r.id} className="review-row" data-testid={`review-row-${r.id}`}>
            <span className={`decl-kind ${r.kind === "agent" ? "k-agent" : r.kind === "storage" ? "k-opaque" : "k-tool"}`}>{r.kind}</span>
            <code>{r.id}</code>
            <span className="review-purpose">{r.purpose}</span>
            <span className="review-chips">
              {r.chips.map((c, i) => (
                <span key={i} className={`chip chip-${c.tone}`}>
                  {c.text}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>

      <div className="onboard-cta">
        {!empty && (
          <button className="primary" onClick={onAccept} disabled={accepting} data-testid="build-accept">
            {accepting ? "Opening…" : "Accept and open"}
          </button>
        )}
        <button className="ghost" onClick={onRetry} data-testid="build-retry">
          Try again
        </button>
        <button className="ghost" onClick={onTweak} data-testid="build-tweak">
          Change the prompt
        </button>
      </div>
    </div>
  );
}
