/*
 * Fixed-position geometry for a popover anchored to its trigger.
 *
 * Popovers here open inside the Designer's own scroll panes, so an absolutely positioned one taller
 * than the remaining pane height is clipped by that ancestor's overflow. Fixed escapes the clip; the
 * trade is that the anchor has to be measured, and re-measured whenever the page moves under it.
 *
 * Pure — measuring the trigger and listening for scroll/resize is the component's job.
 */

/** The trigger's viewport rect — the subset of `DOMRect` placement reads. */
export interface AnchorRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface AnchorOptions {
  /** The side to open on while it has `minRoom`; the opposite side once it doesn't. */
  readonly prefer: "above" | "below";
  /** Ideal width, clamped to the viewport. */
  readonly width: number;
  /** How much room, in px, the preferred side must have before it is used. */
  readonly minRoom: number;
}

interface AnchorBase {
  readonly position: "fixed";
  readonly left: number;
  readonly width: number;
  readonly maxHeight: number;
}
/** Opened downward: pinned under the trigger. */
export interface AnchorBelow extends AnchorBase {
  readonly top: number;
}
/** Opened upward: pinned above the trigger, so it grows away from it. */
export interface AnchorAbove extends AnchorBase {
  readonly bottom: number;
}
export type AnchorStyle = AnchorBelow | AnchorAbove;

/** Distance from the trigger. */
const GAP = 8;
/** Breathing room kept at the left/right viewport edges. */
const EDGE = 16;
/** Breathing room kept at the top/bottom edges, and so excluded from the usable room. */
const MARGIN = 24;

/**
 * Place a popover against its trigger: horizontally centred and clamped inside the viewport,
 * vertically on `prefer` while that side has room and flipped to the other side once it doesn't.
 *
 * `maxHeight` is always the room actually available on the chosen side, so a popover longer than the
 * space scrolls rather than running off-screen.
 */
export function anchorStyle(rect: AnchorRect, viewport: Viewport, opts: AnchorOptions): AnchorStyle {
  const width = Math.min(opts.width, viewport.width - EDGE * 2);
  const centred = rect.left + rect.width / 2 - width / 2;
  const left = Math.max(EDGE, Math.min(centred, viewport.width - width - EDGE));
  const below = Math.max(0, viewport.height - rect.bottom - MARGIN);
  const above = Math.max(0, rect.top - MARGIN);

  const flip = (opts.prefer === "below" ? below : above) <= opts.minRoom;
  const openBelow = opts.prefer === "below" ? !flip : flip;

  return openBelow
    ? { position: "fixed", top: rect.bottom + GAP, left, width, maxHeight: below }
    : { position: "fixed", bottom: viewport.height - rect.top + GAP, left, width, maxHeight: above };
}
