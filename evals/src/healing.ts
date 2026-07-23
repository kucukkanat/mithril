/**
 * The self-healing A/B matrix for the eval suite. Mithril's self-correction stack is pluggable
 * middleware (the `healing` field on an agent), so the suite can run the *same* prompts against several
 * healing configurations side-by-side and compare pass rates — e.g. "does arg-repair actually help this
 * model call tools?".
 *
 * A named **variant** maps to a concrete `healing` option that the provider spreads into `agent({…})`.
 * Because promptfoo serializes provider config as plain JSON (middleware are functions, not
 * serializable), the config carries only the variant *name* string; {@link resolveHealing} reconstructs
 * the real `healing` value inside the provider process.
 *
 * Select variants with `MITHRIL_EVAL_HEALING` (comma-separated, forgiving match — mirrors
 * `MITHRIL_EVAL_MODELS`), e.g. `MITHRIL_EVAL_HEALING=full,raw`. Unset ⇒ just `full` (the shipped
 * default), so a normal run's provider labels and report stay byte-identical.
 */
import { argRepair, loopGuard, outputRetry, retryBudget } from "@mithril/core/agent";
import type { Middleware } from "@mithril/core/protocol";

/** The `healing` option a variant resolves to; `undefined` ⇒ omit the field (the batteries-included default). */
type HealingOption = false | readonly Middleware[] | undefined;

/** One named healing configuration: a short description (for the banner) and the option it resolves to. */
interface HealingVariant {
  readonly name: string;
  readonly description: string;
  readonly resolve: () => HealingOption;
}

/**
 * The named healing configurations the suite can A/B. `full` is the shipped default (all behaviors on);
 * `raw` is the bare loop (all off); each `no-*` variant drops exactly one behavior so its individual
 * contribution is measurable against `full`.
 */
export const HEALING_VARIANTS: readonly HealingVariant[] = [
  { name: "full", description: "batteries-included default stack", resolve: () => undefined },
  { name: "raw", description: "raw loop — no self-correction", resolve: () => false },
  { name: "no-argrepair", description: "default minus arg coercion", resolve: () => [loopGuard(), retryBudget(), outputRetry()] },
  { name: "no-loopguard", description: "default minus loop detection", resolve: () => [argRepair(), retryBudget(), outputRetry()] },
  { name: "no-retrybudget", description: "default minus the per-tool retry budget", resolve: () => [argRepair(), loopGuard(), outputRetry()] },
  { name: "no-outputretry", description: "default minus structured-output re-ask", resolve: () => [argRepair(), loopGuard(), retryBudget()] },
];

const BY_NAME = new Map(HEALING_VARIANTS.map((v) => [v.name, v] as const));

/** Lowercase and strip everything but letters/digits, so "No-ArgRepair" ≈ "no argrepair" ≈ "noargrepair". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Forgiving match of a filter term against a variant name (case-insensitive, ignores dashes/spaces). */
function matchesVariant(term: string, variant: HealingVariant): boolean {
  const q = normalize(term);
  return q.length > 0 && normalize(variant.name).includes(q);
}

/** Parse `MITHRIL_EVAL_HEALING` into a trimmed, non-empty term list, or `undefined` when unset/blank. */
function envFilter(): readonly string[] | undefined {
  const raw = process.env["MITHRIL_EVAL_HEALING"];
  if (raw === undefined) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  return parts.length > 0 ? parts : undefined;
}

/**
 * The healing variants to run, in the order the developer listed them. Unset (or blank) ⇒ `["full"]`,
 * so a default run is a single, unsuffixed configuration. Unknown terms are warned about (surfacing
 * typos) and skipped; if nothing matches, falls back to `full` so a run is never empty.
 */
export function selectedHealingVariants(): readonly HealingVariant[] {
  const filter = envFilter();
  if (filter === undefined) return [BY_NAME.get("full") as HealingVariant];

  const unmatched = filter.filter((term) => !HEALING_VARIANTS.some((v) => matchesVariant(term, v)));
  if (unmatched.length > 0) {
    const names = HEALING_VARIANTS.map((v) => v.name).join(", ");
    console.warn(`[healing] MITHRIL_EVAL_HEALING: no variant matched ${unmatched.map((t) => JSON.stringify(t)).join(", ")} — known: ${names}.`);
  }

  // De-duplicate while preserving first-listed order (a term can only widen, never reorder, the set).
  const picked: HealingVariant[] = [];
  for (const v of HEALING_VARIANTS) {
    if (filter.some((term) => matchesVariant(term, v)) && !picked.includes(v)) picked.push(v);
  }
  return picked.length > 0 ? picked : [BY_NAME.get("full") as HealingVariant];
}

/**
 * Reconstruct the real `healing` option for a variant name (called inside the provider). Returns an
 * object to spread into `agent({…})`: `{}` for the default (`full`), else `{ healing }`. An unknown name
 * degrades to the default so a run never crashes on a stale config.
 */
export function resolveHealing(name: string | undefined): Record<string, never> | { readonly healing: false | readonly Middleware[] } {
  const variant = name === undefined ? undefined : BY_NAME.get(name);
  const option = variant?.resolve() ?? undefined;
  return option === undefined ? {} : { healing: option };
}
