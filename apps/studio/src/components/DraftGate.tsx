import { useDraftingStore } from "../state/draftingStore.ts";
import { draftDestination } from "../lib/drafting.ts";

/*
 * The drafting preview gate.
 *
 * It shows the request VERBATIM — the same string the run sends, not a summary of it — because a
 * paraphrased preview would make the promise ("you see it before it is sent") untrue. On-device
 * drafting still shows it: knowing what a feature would send is useful even when it sends nothing.
 */
export function DraftGate() {
  const pending = useDraftingStore((s) => s.pending);
  const confirm = useDraftingStore((s) => s.confirm);
  const cancel = useDraftingStore((s) => s.cancel);
  if (pending === null) return null;

  const local = pending.model.kind === "local";
  const destination = draftDestination(pending.model);

  return (
    <div className="sheet-backdrop" data-testid="draft-gate" onClick={cancel}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Review the drafting request" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Before it is sent</h2>
          <span className={local ? "pill pill-gen" : "pill"}>{local ? "on-device" : "your key"}</span>
        </div>
        <div className="draft-gate">
          <p className="hint" style={{ margin: 0 }}>
            This goes to {destination}. Nothing else — not your tool code, not your run transcripts.
          </p>
          <pre className="draft-preview" data-testid="draft-gate-prompt">{pending.prompt}</pre>
          <div className="draft-gate-actions">
            <button className="primary" onClick={confirm} data-testid="draft-gate-send">
              {local ? "Draft it on-device" : "Send it"}
            </button>
            <button className="ghost" onClick={cancel} data-testid="draft-gate-cancel">Cancel</button>
            <span className="hint push" style={{ margin: 0 }}>
              Turn this gate off in Settings.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
