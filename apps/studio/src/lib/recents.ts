/*
 * The "pick up where you left off" strip, as pure functions.
 *
 * Once a browser holds more than a handful of projects the strip stops being a shortcut and starts
 * being a haystack, so it filters. Matching is a case-insensitive substring on the name — the user
 * is looking for something they themselves named minutes ago, not exploring a catalogue, so fuzzy
 * matching would only widen the result set past what they typed.
 */
import type { ProjectListEntry } from "./db.ts";

/** How many projects the strip shows when nothing is typed. */
export const RECENTS_LIMIT = 6;

/**
 * Projects to show for a query. An empty query keeps the strip short; a real one searches every
 * project (a match hidden by the six-item cap would read as "it's gone").
 */
export function filterRecents(projects: readonly ProjectListEntry[], query: string): readonly ProjectListEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return projects.slice(0, RECENTS_LIMIT);
  return projects.filter((p) => p.name.toLowerCase().includes(q));
}
