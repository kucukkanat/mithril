// Mithril-local addition to the vendored orb (not upstream).
//
// Upstream painted a fixed grayscale ramp: black ink on light, white ink
// on dark. Mithril styles from design tokens only, so the ramp is driven
// by `--text` (ink) and `--bg` (substrate) instead — the orb inherits the
// metallic identity and follows both themes for free.
//
// The depth language is unchanged: upstream's `g = (dark ? 1 - w : w) * 255`
// is exactly `lerp(substrate, ink, 1 - w)` when the pair is black/white, so
// swapping in tokens generalizes the ramp rather than redesigning it.

/** An sRGB triple, 0–255 per channel. */
export type RGB = readonly [number, number, number];

/** The two ends of the depth ramp: full-ink dots and substrate-level dots. */
export interface InkPalette {
  /** Colour of the nearest / heaviest dots — `--orb-ink`, else `--text`. */
  readonly ink: RGB;
  /** Colour the farthest dots fade toward — `--orb-substrate`, else `--bg`. */
  readonly substrate: RGB;
}

const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

/** Upstream's fixed ramp, used pre-mount and whenever a token won't parse. */
export function fallbackPalette(dark: boolean): InkPalette {
  return dark ? { ink: WHITE, substrate: BLACK } : { ink: BLACK, substrate: WHITE };
}

/**
 * Parse a computed CSS colour. `getComputedStyle` resolves `var()` and
 * `color-mix()` down to an `rgb()`/`color()` form, so only the concrete
 * notations need handling — plus hex, which custom properties may hold
 * verbatim when read off a non-inherited declaration.
 */
export function parseColor(input: string): RGB | null {
  const s = input.trim();
  if (s === '') return null;

  const hex = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (hex) {
    const h = hex[1] ?? '';
    // #rgb / #rgba use one nibble per channel; #rrggbb / #rrggbbaa use two.
    const short = h.length === 3 || h.length === 4;
    if (!short && h.length !== 6 && h.length !== 8) return null;
    const channel = (i: number): number =>
      Number.parseInt(short ? h.slice(i, i + 1).repeat(2) : h.slice(i * 2, i * 2 + 2), 16);
    const out = [channel(0), channel(1), channel(2)] as const;
    return out.every((n) => Number.isFinite(n)) ? out : null;
  }

  // rgb(r, g, b) / rgb(r g b / a) / rgba(...) — commas and spaces both legal.
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (rgb) {
    const parts = (rgb[1] ?? '')
      .replace(/\//g, ' ')
      .split(/[\s,]+/)
      .filter((p) => p !== '')
      .map(Number);
    const [r, g, b] = parts;
    if (r !== undefined && g !== undefined && b !== undefined && Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b] as const;
    }
  }

  return null;
}

/**
 * Read the orb's ramp endpoints off the element's cascade, falling back to
 * upstream's black/white pair for any value that is absent or unparseable.
 */
export function resolveInkPalette(el: Element | null, dark: boolean): InkPalette {
  const base = fallbackPalette(dark);
  if (el === null || typeof getComputedStyle === 'undefined') return base;

  const cs = getComputedStyle(el);
  const pick = (custom: string, semantic: string, fallback: RGB): RGB =>
    parseColor(cs.getPropertyValue(custom)) ?? parseColor(cs.getPropertyValue(semantic)) ?? fallback;

  return {
    ink: pick('--orb-ink', '--text', base.ink),
    substrate: pick('--orb-substrate', '--bg', base.substrate)
  };
}
