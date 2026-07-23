import { useUiStore } from "../state/uiStore.ts";

/** The "?" shortcut cheat-sheet — the discovery half of the keyboard system. */
const GROUPS: readonly { readonly title: string; readonly items: readonly (readonly [string, string])[] }[] = [
  { title: "Global", items: [["⌘K", "Command palette"], ["?", "This cheat sheet"], ["Esc", "Close overlays"]] },
  { title: "Navigate", items: [["⌘1  ·  g d", "Design"], ["⌘2  ·  g r", "Run"]] },
  { title: "Act", items: [["⌘↵", "Run the agent"], ["⌘E", "Toggle split code view (Design)"], ["⌘⏎", "Send message (in the composer)"]] },
];

export function ShortcutCheatsheet() {
  const open = useUiStore((s) => s.cheatsheetOpen);
  const setCheatsheet = useUiStore((s) => s.setCheatsheet);
  if (!open) return null;

  return (
    <div className="palette-backdrop" data-testid="shortcut-cheatsheet" onClick={() => setCheatsheet(false)}>
      <div className="cheatsheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Keyboard shortcuts</h2>
          <button className="ghost" autoFocus data-testid="cheatsheet-close" onClick={() => setCheatsheet(false)}>✕</button>
        </div>
        <div className="cheatsheet-groups">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h4>{g.title}</h4>
              {g.items.map(([key, label]) => (
                <div key={label} className="cheat-row">
                  <kbd>{key}</kbd>
                  <span>{label}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
