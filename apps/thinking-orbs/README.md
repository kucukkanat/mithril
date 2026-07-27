# `@mithril-internal/thinking-orbs`

The animated canvas orb Mithril shows whenever something is in flight — an agent turn, a
spec→code build, a model download, an eval probe. Private and unpublished, like
`@mithril-internal/design-tokens` and `@mithril-internal/model-picker`: **one copy**, mounted by
both the docs playground and the Studio so the two can never drift.

## Provenance

This is a **vendored copy**, not a dependency.

- **Upstream**: [`thinking-orbs`](https://github.com/Jakubantalik/thinking-orbs) by Jakub Antalik &
  Alex Brinza — <https://orbs.jakubantalik.com>
- **Vendored from**: v0.1.1
- **License**: MIT, `Copyright (c) 2026 Jakub Antalik`. The upstream notice is preserved verbatim in
  [`LICENSE`](./LICENSE) and must stay there.

It was copied rather than installed because the framework repo minimizes third-party dependencies
hard, and because the palette needed rewiring onto Mithril's design tokens (below) — a change that
is not upstreamable, since it assumes tokens that only exist here.

## Local changes

The engine, presets and per-state tuning are upstream's, untouched. Two things differ:

1. **`src/ink.ts` (new)** — resolves the dot ramp from CSS custom properties: `--orb-ink` falling
   back to `--text`, and `--orb-substrate` falling back to `--bg`.
2. **`paint()` in `src/engine/core.ts`** — ramps between those two colours instead of a hardcoded
   black/white pair, and `ModeDraw` now takes an `InkPalette` where it took a `dark: boolean`.

Upstream's ramp was `g = (dark ? 1 - w : w) * 255`, which is exactly `lerp(substrate, ink, 1 - w)`
for a black/white pair — so this **generalizes** the depth language rather than redesigning it, and
a black/white palette reproduces upstream pixel-for-pixel. That black/white pair is the fallback
whenever a token is missing, unparseable, or there is no DOM to read.

The palette is resolved **inside the painting effect**, not in a separate state hook. A hook could
only take effect from the second frame, and an orb can be shorter-lived than that — a fast scripted
run in the docs playground mounts and unmounts within a single frame, so its one and only frame
would have painted in the fallback greys.

The upshot: the orb inherits the metallic identity and follows dark/light automatically, with no
hex literal anywhere in the component (the repo's token rule).

## Usage

```tsx
import { ThinkingOrb } from '@mithril-internal/thinking-orbs';

<ThinkingOrb state="working" size={20} />;
```

Six states — `working`, `searching`, `solving`, `listening`, `composing`, `shaping` — and exactly
two sizes, `64` and `20`. **The sizes are separate hand-tuned designs, not a scale factor**, so
`size` only accepts those two; pick 20 for inline/among-text and 64 for a standalone focal point.

`speed` multiplies the baked-in rate, `paused` freezes a frame, and `theme` (`auto` by default)
pins the palette. `prefers-reduced-motion` renders one static frame, and the animation
auto-pauses while offscreen or on a hidden tab.

## Updating

Re-copy `src/` from upstream, then reapply the two local changes above — they are deliberately
small and localized to keep this cheap. Keep `LICENSE` as-is.
