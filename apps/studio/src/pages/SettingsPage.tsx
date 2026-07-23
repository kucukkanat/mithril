import { LIVE_PROVIDERS, useSettingsStore } from "../state/settingsStore.ts";
import { TopBar } from "../components/TopBar.tsx";

export function SettingsPage() {
  const s = useSettingsStore();

  return (
    <div className="designer" data-testid="settings-page">
      <TopBar />
      <main className="settings">
        <h1>Settings</h1>
        <section className="panel">
          <h3>API keys (BYOK)</h3>
          <p className="hint">
            Keys stay in this browser's localStorage and are sent only to the provider you run against — never to any
            Mithril server (there isn't one).
          </p>
          {LIVE_PROVIDERS.map((p) => (
            <label key={p.id} data-testid={`settings-key-field-${p.id}`}>
              {p.label} <a href={p.consoleUrl} data-testid={`settings-key-link-${p.id}`}>get a key ↗</a>
              <input
                type="password"
                data-testid={`settings-key-input-${p.id}`}
                value={s.keys[p.id] ?? ""}
                placeholder={p.envVar}
                onChange={(e) => s.setKey(p.id, e.target.value)}
              />
            </label>
          ))}
          <label className="check" data-testid="settings-remember-field">
            <input type="checkbox" data-testid="settings-remember" checked={s.remember} onChange={(e) => s.setRemember(e.target.checked)} />
            Remember keys in this browser
          </label>
          <button className="ghost danger" data-testid="settings-clear-keys" onClick={() => s.clearKeys()}>
            Clear all keys
          </button>
        </section>
      </main>
    </div>
  );
}
