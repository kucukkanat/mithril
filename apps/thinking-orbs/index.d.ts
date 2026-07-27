// The typed public boundary of the vendored orb.
//
// Consumers resolve types HERE rather than through `src/`, which keeps the
// vendored engine out of their type-check. That matters because the engine is
// upstream's hand-tuned numeric code and does not satisfy this repo's
// `noUncheckedIndexedAccess` / `noPropertyAccessFromIndexSignature` (see
// tsconfig.json and README "Provenance"); without this file every consumer
// would have to relax those flags too, which is exactly backwards.
//
// Runtime resolution still points at `src/index.ts` — Vite bundles the real
// source. Keep this in sync with it; the surface is frozen by vendoring, so
// it only changes when we re-copy from upstream.

import type { CSSProperties, CanvasHTMLAttributes } from 'react';

/** The six shipped states, each a hand-tuned animation. */
export type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'composing' | 'shaping';

/**
 * Rendered size in CSS pixels. The two presets are separate designs with their
 * own dot count, dot size and speed — not a scale factor.
 */
export type OrbSize = 64 | 20;

/** `auto` follows an ancestor `data-theme`/`.dark`/`.light`, else the OS setting. */
export type OrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'style'> {
  /** Which animation to show. @default 'working' */
  state?: OrbState;
  /** Tuned size preset — 64 or 20 CSS px. @default 64 */
  size?: OrbSize;
  /** Theme mode; `auto` detects from the host project. @default 'auto' */
  theme?: OrbTheme;
  /** Multiplier on top of the preset's baked speed. @default 1 */
  speed?: number;
  /** Freeze the animation on the current frame. @default false */
  paused?: boolean;
  style?: CSSProperties;
}

/**
 * The in-flight indicator. Paints itself from `--orb-ink`/`--text` and
 * `--orb-substrate`/`--bg`, follows theme changes live, renders one static
 * frame under `prefers-reduced-motion`, and auto-pauses while offscreen or
 * on a hidden tab.
 */
export declare function ThinkingOrb(props: ThinkingOrbProps): JSX.Element;

/** An sRGB triple, 0–255 per channel. */
export type RGB = readonly [number, number, number];

/** The two ends of the depth ramp. */
export interface InkPalette {
  readonly ink: RGB;
  readonly substrate: RGB;
}

/** Upstream's fixed black/white ramp — the pre-mount and unparseable-token fallback. */
export declare function fallbackPalette(dark: boolean): InkPalette;

/** Parse a computed CSS colour (hex or `rgb()`/`rgba()`); `null` if unrecognized. */
export declare function parseColor(input: string): RGB | null;

/** Read the ramp endpoints off an element's cascade. */
export declare function resolveInkPalette(el: Element | null, dark: boolean): InkPalette;
