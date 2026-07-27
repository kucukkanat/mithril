import { ModelPicker, type ModelSelection } from "@mithril-internal/model-picker";
import type { useProviderSettings } from "../playground/useProviderSettings.ts";

/*
 * The playground's "Run against" bar — now a thin wrapper over the SHARED model picker, the same
 * component the Studio mounts. Everything the visitor interacts with (the segments, the fuzzy model
 * search, the optional base URL, Test connection) lives there; this file supplies only the two
 * playground-specific things: the `scripted` run target, and the on-device download progress that
 * the playground — not the Studio — drives from the main thread.
 */

type Settings = ReturnType<typeof useProviderSettings>;

interface Props {
  readonly settings: Settings;
  readonly selection: ModelSelection;
  readonly onSelectionChange: (selection: ModelSelection) => void;
}

/** The playground's segments, in the order the run targets escalate: offline → on-device → network. */
const KINDS = ["scripted", "local", "live"] as const;

export function ModelBar({ settings, selection, onSelectionChange }: Props) {
  const { download } = settings;
  const pct = Math.round(download.progress * 100);

  return (
    <div className="pg-modelbar" data-testid="model-bar">
      <span className="pg-mb-label">Run against</span>
      <ModelPicker
        value={selection}
        onChange={onSelectionChange}
        kinds={KINDS}
        connections={settings.connections}
        onConnectionChange={settings.setConnection}
        // Switching to Cloud/Local should land on what this visitor last used (restored from
        // localStorage), not on the component's own opinion of a good default.
        defaults={{
          live: { kind: "live", provider: settings.activeProvider, model: settings.activeModel },
          local: { kind: "local", model: settings.localModel },
        }}
      >
        {selection.kind === "local" && download.status !== "idle" && (
          <div className="pg-mb-detail" data-testid="model-bar-local-detail">
            {download.status === "loading" && (
              <>
                <div
                  className="pg-progress pg-mb-progress"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Loading model"
                  data-testid="model-bar-download-progress"
                >
                  <div className="pg-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="pg-mb-hint">Loading model… {pct}%</span>
              </>
            )}
            {download.status === "ready" && <span className="pg-mb-hint ok">✓ Loaded — runs on-device, no key, no network.</span>}
            {download.status === "error" && <span className="pg-mb-hint warn">{download.error ?? "Download failed."}</span>}
          </div>
        )}
      </ModelPicker>
    </div>
  );
}
