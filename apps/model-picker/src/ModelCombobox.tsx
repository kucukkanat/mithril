/*
 * The model field: a text input that is also a fuzzy-searchable list.
 *
 * The central design point is that typing is never rejected. The list narrows as you type, but
 * whatever is in the box IS the model id — if it doesn't match anything, the box says so in one line
 * and the id is sent verbatim. That makes a brand-new model (or a gateway's own naming) a first-class
 * path rather than something to work around, while a typo is still visible before a run burns a call.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fuzzyPositions, searchModels, type CatalogModel } from "@mithril/runner-web";

export interface ModelComboboxProps {
  /** The current model id — always exactly what will be sent on the wire. */
  readonly value: string;
  readonly onChange: (model: string) => void;
  /** Candidates to search: the provider's curated list, or its live list once a key is present. */
  readonly options: readonly CatalogModel[];
  /** True when `options` came from the provider itself rather than the bundled catalog. */
  readonly optionsAreLive?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly testId?: string;
}

/** Render `text` with the fuzzy-matched characters emphasised. */
function Highlight({ text, positions }: { readonly text: string; readonly positions: readonly number[] }) {
  if (positions.length === 0) return <>{text}</>;
  const hit = new Set(positions);
  return <>{[...text].map((ch, i) => (hit.has(i) ? <mark key={i}>{ch}</mark> : <span key={i}>{ch}</span>))}</>;
}

export function ModelCombobox({
  value,
  onChange,
  options,
  optionsAreLive = false,
  placeholder,
  disabled = false,
  ariaLabel = "Model",
  testId = "model-combobox",
}: ModelComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Whether the text is being used as a SEARCH or is just the committed id sitting in the box. The box
  // commits on every keystroke, so `query === value` always holds and can't tell the two apart —
  // without this, opening the list on a chosen model would filter it down to that one model.
  const [searching, setSearching] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // The box reflects the committed value whenever it changes from outside (a provider switch, a preset
  // load). Editing sets `query` and commits on every keystroke, so the two only diverge mid-edit.
  // Track what we last pushed up, so the value echoing back through props doesn't read as an outside
  // change and cancel the in-progress search.
  const emitted = useRef(value);
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    setQuery(value);
    setSearching(false);
  }, [value]);

  const matches = useMemo(() => searchModels(options, searching ? query : ""), [options, query, searching]);
  const exact = options.some((m) => m.id === query.trim());
  const isCustom = query.trim().length > 0 && !exact;

  // Close on an outside click — a combobox that traps focus is worse than one that lets go.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (id: string): void => {
    emitted.current = id;
    setQuery(id);
    setSearching(false);
    onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (matches.length === 0 ? 0 : (a + delta + matches.length) % matches.length));
      return;
    }
    if (e.key === "Enter") {
      const pick = matches[active];
      if (open && pick !== undefined) {
        e.preventDefault();
        commit(pick.model.id);
      } else setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(value);
    }
  };

  return (
    <div className="mp-combo" ref={rootRef} data-testid={testId}>
      {/* The list anchors to THIS wrapper, not to the root — otherwise the custom-model note below
          grows the root and pushes the dropdown down past it. */}
      <div className="mp-combo-field">
        <input
          className="mp-input mp-combo-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setSearching(true);
            setActive(0);
            setOpen(true);
            // Commit as you type: the box is the source of truth, so a half-typed custom id is never lost
            // to a blur that skipped a "confirm" step.
            emitted.current = next;
            onChange(next);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          data-testid={`${testId}-input`}
        />
        <button
          type="button"
          className="mp-combo-toggle"
          aria-label={open ? "Hide model list" : "Show model list"}
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          data-testid={`${testId}-toggle`}
        >
          ▾
        </button>

        {/* An empty list is not rendered at all — the custom-model note below already says the id will
          be used as typed, and two panels saying it is noise. */}
        {open && matches.length > 0 && (
          <ul className="mp-combo-list" id={listId} role="listbox" data-testid={`${testId}-list`}>
            {matches.map((m, i) => (
              <li
                key={m.model.id}
                role="option"
                aria-selected={m.model.id === value}
                className={`mp-combo-option${i === active ? " is-active" : ""}${m.model.id === value ? " is-current" : ""}`}
                onMouseEnter={() => setActive(i)}
                // mousedown, not click: the input's blur would otherwise close the list first.
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(m.model.id);
                }}
                data-testid={`${testId}-option-${m.model.id}`}
              >
                <span className="mp-combo-id">
                  <Highlight text={m.model.id} positions={m.positions.length > 0 ? m.positions : fuzzyPositions(query, m.model.id)} />
                </span>
                {m.model.note !== undefined && <span className="mp-combo-note">{m.model.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCustom && (
        <p className="mp-note mp-note-custom" data-testid={`${testId}-custom-note`}>
          Custom model — <code>{query.trim()}</code> isn’t in {optionsAreLive ? "this account’s" : "the known"} list, so it will be sent to the
          provider exactly as typed.
        </p>
      )}
    </div>
  );
}
