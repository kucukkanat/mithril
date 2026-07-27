import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ModelSpec } from "@mithril/spec";
import { anchorStyle, type AnchorStyle } from "../lib/anchor.ts";
import { DRAFT_DEFAULT_MODEL, draftDestination, draftModelLabel } from "../lib/drafting.ts";
import { ModelPicker } from "./ModelPicker.tsx";

/*
 * Which model drafts — chosen where drafting is actually used.
 *
 * The setting itself lives in Settings and on the first-run form, but the decision gets made HERE,
 * at the moment an instruction is about to be sent and "on-device, or my key?" is the live question.
 * A chip that opens a picker rather than a second MODEL panel: the agent's own model is already a
 * panel on this screen, and two full pickers side by side is an invitation to change the wrong one.
 *
 * The key comes with it — picking a cloud provider here and then discovering, one failed edit later,
 * that the key is back in Settings would make the chip worse than the trip it replaces. That field
 * (plus the base URL and Test connection) now lives INSIDE the shared picker, so this component no
 * longer carries its own copy.
 *
 * Opens upward, because the bar it belongs to is pinned to the bottom of the design pane.
 */

export interface DraftModelChipProps {
  readonly model: ModelSpec | null;
  /** `null` switches drafting off entirely — the feature leaves the UI rather than sitting disabled. */
  readonly onChange: (model: ModelSpec | null) => void;
}

const POP_ID = "draft-model-pop";

export function DraftModelChip({ model, onChange }: DraftModelChipProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<AnchorStyle | undefined>(undefined);

  useLayoutEffect(() => {
    if (!open) return;
    const place = (): void => {
      const r = btnRef.current?.getBoundingClientRect();
      if (r === undefined) return;
      setStyle(anchorStyle(r, { width: window.innerWidth, height: window.innerHeight }, { prefer: "above", width: 420, minRoom: 240 }));
    };
    place();
    // `true` captures scrolls of the Designer's inner panes, which don't bubble to window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // Click-outside and Escape close it. It holds a key field, so it must not linger over the app.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (popRef.current?.contains(target) === true || btnRef.current?.contains(target) === true) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btnRef.current?.focus();
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = draftModelLabel(model);

  return (
    <span className="draft-chip-wrap">
      <button
        ref={btnRef}
        className={`draft-chip${model === null ? " is-off" : ""}`}
        aria-expanded={open}
        aria-controls={POP_ID}
        aria-label={`Model that drafts: ${label}`}
        title="Which model drafts"
        onClick={() => setOpen((v) => !v)}
        data-testid="draft-chip"
      >
        {label}
      </button>

      {open && (
        <div className="draft-pop" id={POP_ID} ref={popRef} style={style} data-testid="draft-chip-pop">
          <div className="draft-pop-head">
            <span className="eyebrow" style={{ border: "none", padding: 0 }}>Which model drafts</span>
            <label className="check" style={{ margin: "0 0 0 auto", fontSize: "var(--mth-fs-2xs)", color: "var(--text-faint)" }}>
              <input
                type="checkbox"
                checked={model !== null}
                onChange={(e) => onChange(e.target.checked ? DRAFT_DEFAULT_MODEL : null)}
                data-testid="draft-chip-enabled"
              />
              drafting on
            </label>
          </div>

          {model === null ? (
            <p className="hint">Drafting is off — no model is loaded and nothing is sent. Turn it on to change this agent by instruction.</p>
          ) : (
            <>
              <ModelPicker value={model} onChange={onChange} />
              <p className="hint draft-pop-foot">Goes to {draftDestination(model)}.</p>
            </>
          )}
        </div>
      )}
    </span>
  );
}
