import { LIVE_PROVIDERS, useSettingsStore } from "../state/settingsStore.ts";
import { useDraftingStore } from "../state/draftingStore.ts";
import { DRAFT_DEFAULT_MODEL, draftDestination } from "../lib/drafting.ts";
import { TopBar } from "../components/TopBar.tsx";
import { ModelPicker } from "../components/ModelPicker.tsx";
import { CheckIcon, CloudIcon, CrossIcon, DeviceIcon, ShareIcon, ShieldIcon } from "../components/icons.tsx";

/*
 * Settings — and, mostly, the privacy story SHOWN rather than asserted.
 *
 * The dataflow panel is the point: three columns naming exactly what stays on the device, what leaves
 * when you run a cloud model, and what leaves when you ask for drafting help. The third column
 * re-renders as the drafting setting changes, so the claim always describes the CURRENT configuration
 * rather than a generic promise.
 */
export function SettingsPage() {
  const s = useSettingsStore();
  const draftCount = useDraftingStore((d) => d.count);
  const model = s.draftModel;
  const sendsOut = model !== null && model.kind !== "local";

  const draftFlowNote =
    model === null
      ? "nothing — drafting is switched off"
      : model.kind === "local"
        ? "nothing — the on-device model does the drafting"
        : `one short request → ${draftDestination(model)}`;
  // Only what the picker's own hint doesn't already say — two stacked lines saying "on-device" is noise.
  const draftHint =
    model === null
      ? "The fix buttons disappear from the tool lint, and the first-run form seeds a blank agent instead."
      : model.kind === "local"
        ? "A sub-1B model is blunt — if a draft comes back unusable, pick a larger one."
        : "Uses the matching key below. You still see the exact request before it is sent.";

  return (
    <div className="designer" data-testid="settings-page">
      <TopBar />
      <main className="settings">
        <h1>Settings</h1>

        <div className="trust">
          <div className="trust-hero">
            <ShieldIcon className="trust-mark" />
            <h2>There is no Mithril server to send anything to.</h2>
            <p>
              Your projects, keys and runs live in this browser. The only network traffic Mithril ever makes is the request <em>you</em> trigger, straight to the
              model provider you chose.
            </p>
          </div>
          <div className="dataflow">
            <div className="flow-node flow-here">
              <h5>
                <DeviceIcon /> Stays on this device
              </h5>
              <ul>
                <li>
                  <CheckIcon /> projects &amp; declarations — IndexedDB
                </li>
                <li>
                  <CheckIcon /> casebooks &amp; their last runs — IndexedDB
                </li>
                <li>
                  <CheckIcon /> API keys — localStorage
                </li>
                <li>
                  <CheckIcon /> downloaded model weights
                </li>
              </ul>
            </div>
            <div className="flow-node flow-out">
              <h5>
                <CloudIcon /> Leaves only when you run a cloud model
              </h5>
              <ul>
                <li>
                  <CheckIcon /> your prompt → the provider you picked
                </li>
                <li>
                  <CheckIcon /> your key, as the auth header
                </li>
                <li className="flow-never">
                  <CrossIcon /> never: telemetry, analytics, crash reports
                </li>
                <li className="flow-never">
                  <CrossIcon /> never: your project or its code
                </li>
              </ul>
            </div>
            <div className={`flow-node ${sendsOut ? "flow-out" : "flow-never"}`} data-testid="settings-draft-flow">
              <h5>
                <ShareIcon /> Leaves when you ask for drafting help
              </h5>
              <ul>
                <li>
                  <CheckIcon /> the job line and the tool description
                </li>
                <li>
                  <CheckIcon /> {draftFlowNote}
                </li>
                <li className="flow-never">
                  <CrossIcon /> never: your tool code or run transcripts
                </li>
                <li className="flow-never">
                  <CrossIcon /> never: without a button press and a preview
                </li>
              </ul>
            </div>
          </div>
          <div className="trust-facts">
            <div className="fact">
              <b>0</b>
              <span>accounts, ever</span>
            </div>
            <div className="fact">
              <b>0</b>
              <span>bytes of telemetry</span>
            </div>
            <div className="fact">
              <b>local</b>
              <span>inference by default — no key needed</span>
            </div>
          </div>
        </div>

        <section className="panel settings-section" data-testid="settings-drafting">
          <div className="panel-head">
            <h3>Drafting help</h3>
            <span className="pill">{model === null ? "disabled" : model.kind === "local" ? "on-device" : "your key"}</span>
          </div>
          <p className="hint" style={{ marginTop: 0, marginBottom: "var(--mth-space-4)" }}>
            Mithril can rewrite a tool description the model keeps ignoring, and draft a whole agent from one line. Never on its own — you press a button, and by
            default you see the request first.
          </p>
          <div className="field">
            <div className="field-head">
              <h4 style={{ marginTop: 0 }}>Which model drafts</h4>
              <label className="check" style={{ margin: "0 0 0 auto", fontSize: "var(--mth-fs-2xs)", color: "var(--text-faint)" }}>
                <input
                  type="checkbox"
                  checked={model !== null}
                  onChange={(e) => s.setDraftModel(e.target.checked ? DRAFT_DEFAULT_MODEL : null)}
                  data-testid="draft-enabled"
                />
                offer drafting help
              </label>
            </div>
            {model !== null && <ModelPicker value={model} onChange={s.setDraftModel} />}
            <p className="hint" style={{ marginBottom: 0 }}>{draftHint}</p>
          </div>
          <div className="settings-foot">
            <label className="check">
              <input type="checkbox" checked={s.previewFirst} onChange={(e) => s.setPreviewFirst(e.target.checked)} data-testid="draft-preview-first" /> Always
              show me the request before it is sent
            </label>
            <span className="mono" style={{ marginLeft: "auto", fontSize: "var(--mth-fs-2xs)", color: "var(--text-faint)" }}>
              {draftCount} draft{draftCount === 1 ? "" : "s"} requested this session
            </span>
          </div>
        </section>

        <section className="panel" data-testid="settings-keys">
          <div className="panel-head">
            <h3>API keys</h3>
            <span className="pill">bring your own</span>
          </div>
          <p className="hint" style={{ marginTop: 0, marginBottom: "var(--mth-space-5)" }}>
            Stored in this browser&rsquo;s localStorage, sent only to the provider you run against. Clearing site data removes them.
          </p>
          <div className="key-list">
            {LIVE_PROVIDERS.map((p) => {
              const value = s.keys[p.id] ?? "";
              return (
                <div key={p.id} className="key-row" data-testid={`settings-key-field-${p.id}`}>
                  <span className="key-name">{p.label}</span>
                  <input
                    type="password"
                    value={value}
                    placeholder={p.envVar}
                    onChange={(e) => s.setKey(p.id, e.target.value)}
                    aria-label={`${p.label} key`}
                    data-testid={`settings-key-input-${p.id}`}
                  />
                  <span className={`key-state${value.length > 0 ? " is-set" : ""}`}>{value.length > 0 ? "set · local" : "not set"}</span>
                </div>
              );
            })}
          </div>
          <div className="settings-foot">
            <label className="check" data-testid="settings-remember-field">
              <input type="checkbox" checked={s.remember} onChange={(e) => s.setRemember(e.target.checked)} data-testid="settings-remember" /> Remember keys in
              this browser
            </label>
            <button className="ghost danger" onClick={() => s.clearKeys()} data-testid="settings-clear-keys">
              Clear all keys
            </button>
          </div>
        </section>

        <p className="hint" style={{ marginTop: "var(--mth-space-5)" }}>
          Need a key?{" "}
          {LIVE_PROVIDERS.map((p, i) => (
            <span key={p.id}>
              {i > 0 && " · "}
              <a href={p.consoleUrl} target="_blank" rel="noreferrer" data-testid={`settings-key-link-${p.id}`}>
                {p.label} ↗
              </a>
            </span>
          ))}
        </p>
      </main>
    </div>
  );
}
