import { useEffect } from "react";
import type { ToolSpec } from "@mithril/spec";
import type { ProbeState } from "../lib/probe.ts";
import { useProbeStore } from "../state/probeStore.ts";

/*
 * "Does it actually work?" — the headline for a tool.
 *
 * This card outranks the lint below it, and that ordering is the whole point. Every other signal on this
 * panel is read off the tool's PROSE; this one is read off running the body. When a heuristic and an
 * execution disagree, the execution is right — so the executable answer goes first and the lint is labelled
 * for what it is.
 */

const TONE: Record<ProbeState, string> = { broken: "tone-bad", stub: "tone-warn", empty: "tone-warn", ok: "tone-good" };
const COLOR: Record<ProbeState, string> = { broken: "var(--bad)", stub: "var(--warn)", empty: "var(--warn)", ok: "var(--good)" };
const MARK: Record<ProbeState, string> = { broken: "×", stub: "!", empty: "!", ok: "✓" };

export interface ProbeCardProps {
  readonly tool: ToolSpec;
}

export function ProbeCard({ tool }: ProbeCardProps) {
  const entry = useProbeStore((s) => s.entry(tool));
  const probe = useProbeStore((s) => s.probe);

  // Self-contained bodies probe themselves; one that can reach outside resolves to `needs-consent` here and
  // waits for the button. Keyed on the body, so this fires once per distinct version of the code.
  useEffect(() => {
    void probe(tool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.execute.code, tool.inputSchema.zod]);

  return (
    <div className={`field probe probe-${entry.status === "done" ? entry.result.state : entry.status}`} data-testid="tool-probe">
      <div className="probe-top">
        <span className="eyebrow" style={{ border: "none", padding: 0 }}>Does it actually work?</span>
        {entry.status === "done" && (
          <button
            className="ghost"
            onClick={() => void probe(tool, { force: true })}
            title="Run the body again"
            data-testid="tool-probe-rerun"
          >
            re-run
          </button>
        )}
      </div>

      {entry.status === "running" && (
        <p className="hint" style={{ margin: 0 }} data-testid="tool-probe-running">
          Running the body twice…
        </p>
      )}

      {entry.status === "unprobed" && (
        <p className="hint" style={{ margin: 0 }}>
          Not run yet.
        </p>
      )}

      {entry.status === "needs-consent" && (
        <>
          <p className="hint" style={{ margin: "0 0 var(--mth-space-2)" }} data-testid="tool-probe-consent">
            This body <b>{entry.effect.capability}</b> (<code className="mono">{entry.effect.token}</code>), so running it here would do that for
            real. Studio will not do that on its own.
          </p>
          <button className="ghost" onClick={() => void probe(tool, { force: true })} data-testid="tool-probe-run">
            Run it anyway
          </button>
        </>
      )}

      {entry.status === "done" && (
        <>
          <div className="probe-verdict">
            <span className="probe-mark" style={{ color: COLOR[entry.result.state] }}>{MARK[entry.result.state]}</span>
            <span className="probe-headline" style={{ color: COLOR[entry.result.state] }} data-testid="tool-probe-state">
              {entry.result.headline}
            </span>
          </div>
          {/* The literal evidence. In the session this was built for, this line is the whole investigation. */}
          <p className={`finding-text probe-detail ${TONE[entry.result.state]}`} data-testid="tool-probe-detail">
            {entry.result.detail}
          </p>
        </>
      )}
    </div>
  );
}
