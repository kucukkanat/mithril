import { ThinkingOrb } from "@mithril-internal/thinking-orbs";
import type { DownloadReport } from "@mithril/runner-web";
import type { CreatorEvent } from "../lib/creator.ts";

/*
 * The live build log: one line per definition the creator emits, as it emits them.
 *
 * A build takes tens of seconds and a spinner over that reads as a hang. Lines are `--gen` toned
 * throughout because everything here is machine-authored — `--accent` is the token that means a
 * human wrote it, and that warm/cool split is the whole spec⇄code story.
 *
 * The download bar is not optional: the default model is on-device, so a first build spends its
 * first minute fetching weights with nothing else to show.
 */

export interface BuildStreamProps {
  readonly events: readonly CreatorEvent[];
  readonly download: DownloadReport | null;
  readonly running: boolean;
  readonly onStop: () => void;
}

/** `[badge, name, detail]` for one emitted definition, or `null` for the ones with nothing to show. */
function line(e: CreatorEvent): readonly [string, string, string] | null {
  switch (e.kind) {
    case "tool":
      return ["tool", e.name, e.description];
    case "agent":
      return ["agent", e.id, e.purpose];
    case "subagent":
      return ["asTool", e.exposeName, `${e.id} — ${e.exposeDescription}`];
    case "attach":
      return ["attach", e.tool, `→ ${e.agent}`];
    case "remove":
      return ["remove", e.name, ""];
    case "finish":
      return ["done", e.name, e.summary];
  }
}

export function BuildStream({ events, download, running, onStop }: BuildStreamProps) {
  const lines = events.flatMap((e) => {
    const l = line(e);
    return l === null ? [] : [l];
  });
  const downloading = download !== null && download.progress < 1;

  return (
    <div className="panel build-stream" data-testid="build-stream">
      <div className="panel-head">
        <h3>building</h3>
        <span className="pill pill-gen">{lines.length} made</span>
        {running && (
          <button className="ghost push" onClick={onStop} data-testid="build-stop">
            Stop
          </button>
        )}
      </div>

      {downloading && (
        <div className="download" data-testid="build-download">
          <ThinkingOrb state="searching" size={20} aria-label="Downloading…" />
          <span>Downloading the on-device model… {Math.round(download.progress * 100)}%</span>
          <progress value={download.progress} max={1} />
        </div>
      )}

      <ol className="build-lines" data-testid="build-lines">
        {lines.map(([kind, name, detail], i) => (
          <li key={i} className="build-line" data-testid={`build-line-${i}`}>
            <span className={`decl-kind ${kind === "agent" ? "k-agent" : "k-tool"}`}>{kind}</span>
            <code>{name}</code>
            <span className="build-detail">{detail}</span>
          </li>
        ))}
        {running && !downloading && (
          <li className="build-line build-thinking" data-testid="build-thinking">
            {/* `shaping` — the build is literally forming the project's declarations. */}
            <ThinkingOrb state="shaping" size={20} aria-label="Building…" />
          </li>
        )}
      </ol>

      {lines.length === 0 && !running && <p className="hint">Nothing was built.</p>}
    </div>
  );
}
