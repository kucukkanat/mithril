/*
 * Fuzzy matching for the model picker's search field.
 *
 * Deliberately small and dependency-free: a subsequence matcher with a handful of bonuses, which is
 * all a list of a few dozen model ids needs. The behaviour that matters for this UI is that short,
 * abbreviated queries land on the right model — `s45` → `claude-sonnet-4-5`, `4om` → `gpt-4o-mini` —
 * because that is how people actually type a model name they already know.
 *
 * A query that matches nothing is NOT an error: the picker offers it verbatim as a custom model id.
 * See {@link isCustomModel}.
 */

import { LIVE_PROVIDERS, type CatalogModel, type LiveProviderId } from "./catalog.ts";

/** A catalog model plus why it ranked where it did. */
export interface ModelMatch {
  readonly model: CatalogModel;
  /** Higher is better. Only meaningful for ordering within one query's results. */
  readonly score: number;
  /** Indices into the haystack that the query matched — for highlighting in the UI. */
  readonly positions: readonly number[];
}

/** A character adjacent to the previous match — the strongest signal that a query is a real prefix run. */
const CONSECUTIVE_BONUS = 12;
/** Matched right after a separator (`-`, `_`, `/`, `.`, or a space) — i.e. the start of a word. */
const WORD_START_BONUS = 10;
/** Matched at index 0. */
const LEADING_BONUS = 14;
/** Every char between the previous match and this one, up to a floor. */
const GAP_PENALTY = 1;
const MAX_GAP_PENALTY = 8;

const isSeparator = (c: string): boolean => c === "-" || c === "_" || c === "/" || c === "." || c === " ";

/**
 * Score `query` against `haystack` as a case-insensitive subsequence.
 *
 * @param query - what the user typed; whitespace-insensitive, and an empty query matches everything with score 0.
 * @param haystack - the string being matched (a model id, or `id + label + note`).
 * @returns the match with its positions, or `undefined` when `query` is not a subsequence of `haystack`.
 *
 * @example
 * ```ts
 * fuzzyScore("s45", "claude-sonnet-4-5")?.score; // > 0 — matches s·4·5
 * fuzzyScore("zzz", "gpt-4o-mini"); // undefined
 * ```
 */
export function fuzzyScore(query: string, haystack: string): number | undefined {
  const q = query.replace(/\s+/g, "").toLowerCase();
  if (q.length === 0) return 0;
  const h = haystack.toLowerCase();
  let score = 0;
  let hi = 0;
  let prev = -1;
  for (const ch of q) {
    const found = h.indexOf(ch, hi);
    if (found === -1) return undefined;
    if (found === 0) score += LEADING_BONUS;
    else if (found === prev + 1) score += CONSECUTIVE_BONUS;
    else if (isSeparator(h[found - 1] ?? "")) score += WORD_START_BONUS;
    if (prev !== -1) score -= Math.min((found - prev - 1) * GAP_PENALTY, MAX_GAP_PENALTY);
    prev = found;
    hi = found + 1;
  }
  // Prefer tighter haystacks: matching 3 chars of a short id beats matching 3 chars of a long one.
  return score - Math.min(h.length, 40) / 8;
}

/** Positions in `haystack` that `query` matched, for highlighting. Empty when there is no match. */
export function fuzzyPositions(query: string, haystack: string): readonly number[] {
  const q = query.replace(/\s+/g, "").toLowerCase();
  const h = haystack.toLowerCase();
  const out: number[] = [];
  let hi = 0;
  for (const ch of q) {
    const found = h.indexOf(ch, hi);
    if (found === -1) return [];
    out.push(found);
    hi = found + 1;
  }
  return out;
}

/**
 * Rank `models` against a query, best first.
 *
 * @param models - the candidate list — a provider's {@link LiveProvider.models}, or a live list from
 *   {@link fetchProviderModels}.
 * @param query - the user's search text. Empty returns the list unchanged (catalog order is curated).
 * @returns the matching models, best first. Non-matches are dropped.
 *
 * @example
 * ```ts
 * searchModels(liveProvider("anthropic").models, "haiku")[0]?.model.id; // "claude-haiku-4-5"
 * ```
 */
export function searchModels(models: readonly CatalogModel[], query: string): readonly ModelMatch[] {
  if (query.trim().length === 0) return models.map((model) => ({ model, score: 0, positions: [] }));
  const out: ModelMatch[] = [];
  for (const model of models) {
    // Score against the id alone, then against the id + prose; the id wins ties so a note can never
    // outrank a direct id hit.
    const idScore = fuzzyScore(query, model.id);
    const proseScore = fuzzyScore(query, `${model.id} ${model.label ?? ""} ${model.note ?? ""}`);
    const score = idScore !== undefined ? idScore + 6 : proseScore;
    if (score === undefined) continue;
    out.push({ model, score, positions: idScore !== undefined ? fuzzyPositions(query, model.id) : [] });
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * True when `model` is not in the provider's known list — i.e. an id the user typed themselves, which
 * is sent to the provider verbatim.
 *
 * @param provider - the provider whose list to check.
 * @param model - the model id in question.
 * @param known - override the list to check against (pass a live list from {@link fetchProviderModels}).
 *
 * @remarks A custom id is a supported path, not an error state — the picker only uses this to say so
 * out loud, so a typo is visible before a run fails.
 */
export function isCustomModel(provider: LiveProviderId, model: string, known?: readonly CatalogModel[]): boolean {
  const id = model.trim();
  if (id.length === 0) return false;
  const list = known ?? LIVE_PROVIDERS.find((p) => p.id === provider)?.models ?? [];
  return !list.some((m) => m.id === id);
}
