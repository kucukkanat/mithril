// Engine-level contracts shared by every mode implementation.

import type { ModeOpts } from './profiles';
import type { InkPalette } from '../ink';

export type { Dot } from './core';

/** One frame painter: draws a mode into a 2D context at CSS-px `size`. */
export type ModeDraw = (
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  palette: InkPalette,
  opts: ModeOpts
) => void;
