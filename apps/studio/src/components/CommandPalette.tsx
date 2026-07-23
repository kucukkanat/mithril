import { useEffect, useMemo, useState } from "react";
import type { createHashRouter } from "react-router-dom";
import { listProjects, type ProjectListEntry } from "../lib/db.ts";
import { useUiStore } from "../state/uiStore.ts";
import { useSettingsStore } from "../state/settingsStore.ts";
import { currentProjectId } from "../lib/shortcuts.ts";

/*
 * The ⌘K command palette: one fuzzy box that collapses the whole nav tree — jump between workspaces,
 * run the agent, switch/create a project, open Settings, toggle theme, and show the shortcut sheet.
 * Each command shows its shortcut inline, so the palette doubles as a shortcut trainer.
 */

type Router = ReturnType<typeof createHashRouter>;

interface Command {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly run: () => void;
}

/** A command matches when the query is a subsequence of its label (case-insensitive). */
function matches(query: string, label: string): boolean {
  if (query === "") return true;
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  let i = 0;
  for (const ch of l) if (ch === q[i]) i++;
  return i === q.length;
}

export function CommandPalette({ router }: { readonly router: Router }) {
  const open = useUiStore((s) => s.paletteOpen);
  const setPalette = useUiStore((s) => s.setPalette);
  const requestRun = useUiStore((s) => s.requestRun);
  const setCheatsheet = useUiStore((s) => s.setCheatsheet);
  const resetCoach = useUiStore((s) => s.resetCoach);
  const settings = useSettingsStore();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [projects, setProjects] = useState<readonly ProjectListEntry[]>([]);
  // The palette lives outside the route tree, so it doesn't re-render on navigation on its own; subscribe so
  // `pid` (read from router.state) never goes stale under an open palette (e.g. browser back/forward).
  const [, bumpNav] = useState(0);
  useEffect(() => router.subscribe(() => bumpNav((n) => n + 1)), [router]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSel(0);
    void listProjects().then(setProjects);
  }, [open]);

  const pid = currentProjectId(router.state.location.pathname);
  const nav = (path: string): void => {
    void router.navigate(path);
    setPalette(false);
  };

  const commands = useMemo<readonly Command[]>(() => {
    const inProject: Command[] = pid === null ? [] : [
      { id: "run", label: "Run the agent", hint: "⌘↵", run: () => { requestRun(); nav(`/p/${pid}/run`); } },
      { id: "design", label: "Go to Design", hint: "⌘1", run: () => nav(`/p/${pid}`) },
      { id: "runview", label: "Go to Run", hint: "⌘2", run: () => nav(`/p/${pid}/run`) },
    ];
    return [
      ...inProject,
      { id: "new", label: "New project", run: () => nav("/") },
      { id: "settings", label: "Settings & API keys", run: () => nav("/settings") },
      { id: "theme", label: `Switch to ${settings.theme === "dark" ? "light" : "dark"} theme`, run: () => { settings.setTheme(settings.theme === "dark" ? "light" : "dark"); setPalette(false); } },
      { id: "shortcuts", label: "Keyboard shortcuts", hint: "?", run: () => setCheatsheet(true) },
      { id: "coach", label: "Show onboarding tips again", run: () => { resetCoach(); setPalette(false); } },
      ...projects.filter((p) => p.id !== pid).map((p): Command => ({ id: `p-${p.id}`, label: `Open ${p.name}`, hint: "project", run: () => nav(`/p/${p.id}`) })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, projects, settings.theme]);

  const filtered = commands.filter((c) => matches(query, c.label));
  const active = filtered[Math.min(sel, Math.max(0, filtered.length - 1))];

  if (!open) return null;

  return (
    <div className="palette-backdrop" data-testid="command-palette" onClick={() => setPalette(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <input
          className="palette-input"
          data-testid="palette-input"
          autoFocus
          placeholder="Type a command…  (Esc to close)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); active?.run(); }
          }}
        />
        <ul className="palette-list" data-testid="palette-list">
          {filtered.length === 0 && <li className="palette-empty">No matching commands.</li>}
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                className={`palette-item${c === active ? " on" : ""}`}
                data-testid={`palette-item-${c.id}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => c.run()}
              >
                <span>{c.label}</span>
                {c.hint !== undefined && <kbd className="palette-hint">{c.hint}</kbd>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
