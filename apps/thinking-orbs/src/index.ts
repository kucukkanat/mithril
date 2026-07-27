export { ThinkingOrb } from './ThinkingOrb';

export type { ThinkingOrbProps, OrbState, OrbSize, OrbTheme } from './types';

// Power-user surface: the resolved presets + raw frame painters, for
// consumers driving their own canvas outside React.
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from './presets';
export { MODE_DRAWS } from './engine/registry';

// Mithril-local: the token-driven ink ramp (see ./ink.ts).
export { fallbackPalette, parseColor, resolveInkPalette, type InkPalette, type RGB } from './ink';
