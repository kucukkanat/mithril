import { Link, useLocation, useParams } from "react-router-dom";
import { useProjectStore } from "../state/projectStore.ts";
import { useSettingsStore } from "../state/settingsStore.ts";
import { useUiStore } from "../state/uiStore.ts";

/** Persistent header: project name (editable), autosave state, section nav, ⌘K, theme toggle. */
export function TopBar() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const store = useProjectStore();
  const settings = useSettingsStore();
  const setPalette = useUiStore((s) => s.setPalette);
  const spec = store.spec;

  // Fall back to the store's open project so the nav stays put on /settings (no dead-end).
  const projectId = id ?? store.projectId ?? undefined;
  const section = pathname === "/settings" ? "settings" : pathname.endsWith("/run") ? "run" : "design";

  return (
    <header className="topbar" data-testid="topbar">
      <Link to="/" className="brand" data-testid="topbar-brand">
        ⛏ Mithril <span>Studio</span>
      </Link>
      {spec !== null && projectId !== undefined && (
        <>
          <input
            className="project-name"
            data-testid="topbar-project-name"
            title="Rename this project"
            value={spec.name}
            onChange={(e) => store.updateSpec((s) => ({ ...s, name: e.target.value }))}
          />
          <span className="save-state" data-testid="topbar-save-state" aria-live="polite">
            {store.saving ? "Saving…" : store.savedAt !== null ? "Saved" : ""}
          </span>
          <nav className="topbar-nav" data-testid="topbar-nav">
            <Link className={section === "design" ? "on" : ""} to={`/p/${projectId}`} data-testid="topbar-nav-design">Design</Link>
            <Link className={section === "run" ? "on" : ""} to={`/p/${projectId}/run`} data-testid="topbar-nav-run">Run</Link>
          </nav>
        </>
      )}
      <div className="topbar-right" data-testid="topbar-right">
        <button className="ghost palette-trigger" data-testid="topbar-palette" title="Command palette (⌘K)" onClick={() => setPalette(true)}>
          ⌘K
        </button>
        <Link className={section === "settings" ? "on" : ""} to="/settings" data-testid="topbar-settings-link">Settings</Link>
        <button
          className="ghost"
          data-testid="topbar-theme-toggle"
          title="Toggle theme"
          onClick={() => settings.setTheme(settings.theme === "dark" ? "light" : "dark")}
        >
          {settings.theme === "dark" ? "☾" : "☀"}
        </button>
      </div>
    </header>
  );
}
