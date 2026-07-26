import { Link, useLocation, useParams } from "react-router-dom";
import { useProjectStore } from "../state/projectStore.ts";
import { useSettingsStore } from "../state/settingsStore.ts";
import { useUiStore } from "../state/uiStore.ts";
import { useCasebookStore } from "../state/casebookStore.ts";
import { healthOf } from "../lib/casebook.ts";
import { BrandMark, MoonIcon, SunIcon } from "./icons.tsx";

/**
 * Persistent header: brand, editable project name, autosave state, section nav, casebook health,
 * ⌘K, Settings, theme toggle.
 *
 * The health badge lives here rather than only on the Designer because it is the one number that
 * should follow you around — a fix that broke a case should be visible from the Run view too.
 */
export function TopBar() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const store = useProjectStore();
  const settings = useSettingsStore();
  const setPalette = useUiStore((s) => s.setPalette);
  const cases = useCasebookStore((s) => s.cases);
  const spec = store.spec;

  // Fall back to the store's open project so the nav stays put on /settings (no dead-end).
  const projectId = id ?? store.projectId ?? undefined;
  const section = pathname === "/settings" ? "settings" : pathname.endsWith("/run") ? "run" : "design";
  const health = healthOf([...cases], store.savedAt ?? 0);
  const dark = settings.theme === "dark";

  return (
    <header className="topbar" data-testid="topbar">
      <Link to="/" className="brand" data-testid="topbar-brand">
        <BrandMark /> Mithril <span>Studio</span>
      </Link>
      {spec !== null && projectId !== undefined && (
        <>
          <input
            className="project-name"
            data-testid="topbar-project-name"
            title="Rename this project"
            aria-label="Project name"
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
        {health.total > 0 && (
          <span className={`status status-${health.tone === "good" ? "done" : health.tone === "bad" ? "error" : "suspended"}`} title="Casebook health" data-testid="topbar-health">
            {health.label}
          </span>
        )}
        <button className="ghost palette-trigger" data-testid="topbar-palette" title="Command palette (⌘K)" onClick={() => setPalette(true)}>
          ⌘K
        </button>
        <Link className={section === "settings" ? "on" : ""} to="/settings" data-testid="topbar-settings-link">Settings</Link>
        <button
          className="ghost icon-btn"
          data-testid="topbar-theme-toggle"
          title={`Switch to ${dark ? "light" : "dark"} theme`}
          aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
          onClick={() => settings.setTheme(dark ? "light" : "dark")}
        >
          {dark ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}
