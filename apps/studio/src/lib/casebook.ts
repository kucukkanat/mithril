/*
 * The casebook — examples the agent must keep handling.
 *
 * WHY IT IS A REGRESSION CASEBOOK. A case is one line of user input; there is no assertion language
 * and no judge model. What grades a case is its own accepted run: the first time you accept a run as
 * correct, its observable SHAPE becomes the baseline — which tools were called, whether it handed
 * off, whether it errored, roughly how long the reply was. A later re-check passes when the shape
 * still matches, and fails naming exactly what moved. That makes the verdict derivable from the
 * event stream alone (no key, no tokens, works against the on-device model) and makes it answer the
 * question the product actually cares about: did my edit break something that used to work.
 *
 * Everything here is pure. Running the cases is the store's job; deciding what a run MEANT is this
 * module's, so it stays testable without a worker.
 */
import type { MithrilEvent } from "@mithril/core/protocol";

/** An example the agent must handle. Stored beside the spec, never in generated code. */
export interface Case {
  readonly id: string;
  /** What a user would say. The whole authored surface of a case. */
  readonly input: string;
  /** The shape accepted as correct, or `null` while the case is still unreviewed. */
  readonly baseline: RunShape | null;
  /** The most recent run, or `null` if it has never been checked. */
  readonly last: RunShape | null;
  /** When `last` was recorded. */
  readonly checkedAt: number | null;
}

/**
 * The observable shape of one run — everything the casebook compares.
 *
 * Only facts the event stream states outright. Nothing inferred about meaning, because a heuristic
 * that guessed at meaning would be the lie this design exists to avoid.
 */
export interface RunShape {
  /** Tool names called, in order, deduplicated to a set for comparison. */
  readonly tools: readonly string[];
  /** Agent ids handed off to, in order. */
  readonly handoffs: readonly string[];
  readonly errored: boolean;
  /** Whether the run stopped for approval — a suspension is part of the shape. */
  readonly suspended: boolean;
  /** Sentence count of the assistant's reply, bucketed; exact length is noise. */
  readonly replyLength: "empty" | "one-sentence" | "short" | "long";
  /** True when structured output validated. */
  readonly producedObject: boolean;
  readonly steps: number;
  readonly ms: number;
}

export type Verdict = "pass" | "fail" | "unreviewed" | "stale" | "checking";

/** A case's verdict plus the sentence explaining it. */
export interface CaseResult {
  readonly verdict: Verdict;
  /** Why, in the product's voice — the string the card shows. */
  readonly why: string;
  /** What the accepted baseline expects, phrased for the Run view's `expects` bar. */
  readonly expects: string;
}

const SENTENCE_SPLIT = /[.!?]+\s|[.!?]+$/;

/** Bucket a reply by sentence count so trivial wording changes don't read as regressions. */
function bucketReply(text: string): RunShape["replyLength"] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return "empty";
  const sentences = trimmed.split(SENTENCE_SPLIT).filter((s) => s.trim().length > 0).length;
  if (sentences <= 1) return "one-sentence";
  return sentences <= 3 ? "short" : "long";
}

/**
 * Reduce a run's event stream to its comparable shape.
 *
 * @example
 * ```ts
 * const shape = shapeOf(run.events);
 * if (shape.tools.length === 0) console.log("answered from memory");
 * ```
 */
export function shapeOf(events: readonly MithrilEvent[]): RunShape {
  const tools: string[] = [];
  const handoffs: string[] = [];
  let errored = false;
  let suspended = false;
  let producedObject = false;
  let steps = 0;
  let reply = "";
  let firstTs: number | null = null;
  let lastTs = 0;

  for (const e of events) {
    firstTs ??= e.ts;
    lastTs = e.ts;
    switch (e.type) {
      case "tool.call":
        if (!tools.includes(e.name)) tools.push(e.name);
        break;
      case "handoff":
        if (!handoffs.includes(e.to)) handoffs.push(e.to);
        break;
      case "text.delta":
        reply += e.delta;
        break;
      case "step.start":
        steps++;
        break;
      case "object.final":
        producedObject = true;
        break;
      case "suspend":
        suspended = true;
        break;
      case "run.error":
      case "tool.error":
        errored = true;
        break;
      case "run.finish":
        if (e.reason === "error") errored = true;
        break;
      default:
        break; // the union is open by contract — unknown events add nothing to the shape
    }
  }

  return {
    tools,
    handoffs,
    errored,
    suspended,
    producedObject,
    replyLength: bucketReply(reply),
    steps,
    ms: firstTs === null ? 0 : lastTs - firstTs,
  };
}

const listOf = (xs: readonly string[]): string => (xs.length === 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1) ?? ""}`);

const REPLY_PHRASE: Record<RunShape["replyLength"], string> = {
  empty: "says nothing",
  "one-sentence": "answers in one sentence",
  short: "answers in a few sentences",
  long: "answers at length",
};

/**
 * Phrase a baseline as the expectation it encodes — the Run view's `expects` line.
 *
 * @example
 * ```ts
 * describeShape(shape); // "calls weather, answers in one sentence"
 * ```
 */
export function describeShape(shape: RunShape): string {
  const parts: string[] = [];
  if (shape.tools.length > 0) parts.push(`calls ${listOf(shape.tools)}`);
  if (shape.handoffs.length > 0) parts.push(`hands off to ${listOf(shape.handoffs)}`);
  if (shape.suspended) parts.push("stops for approval");
  if (shape.producedObject) parts.push("returns a valid object");
  if (shape.tools.length === 0 && shape.handoffs.length === 0) parts.push("answers without a tool");
  parts.push(REPLY_PHRASE[shape.replyLength]);
  return parts.join(", ");
}

/** Every way a re-check can diverge from its baseline, most alarming first. */
function divergences(baseline: RunShape, last: RunShape): readonly string[] {
  const out: string[] = [];
  if (last.errored && !baseline.errored) out.push("it now errors");
  if (!last.errored && baseline.errored) out.push("it no longer errors");

  const dropped = baseline.tools.filter((t) => !last.tools.includes(t));
  const added = last.tools.filter((t) => !baseline.tools.includes(t));
  if (dropped.length > 0) {
    out.push(
      last.tools.length === 0
        ? `it never called ${listOf(dropped)} — it answered from memory instead`
        : `it stopped calling ${listOf(dropped)}`,
    );
  }
  if (added.length > 0) out.push(`it now also calls ${listOf(added)}`);

  const lostHandoffs = baseline.handoffs.filter((h) => !last.handoffs.includes(h));
  const newHandoffs = last.handoffs.filter((h) => !baseline.handoffs.includes(h));
  if (lostHandoffs.length > 0) out.push(`it stopped handing off to ${listOf(lostHandoffs)}`);
  if (newHandoffs.length > 0) out.push(`it now hands off to ${listOf(newHandoffs)}`);

  if (baseline.producedObject && !last.producedObject) out.push("its structured output no longer validates");
  if (baseline.suspended !== last.suspended) out.push(last.suspended ? "it now stops for approval" : "it no longer stops for approval");
  if (baseline.replyLength !== last.replyLength) out.push(`the reply went from ${REPLY_PHRASE[baseline.replyLength]} to ${REPLY_PHRASE[last.replyLength]}`);
  return out;
}

/**
 * True when a run still matches the shape accepted as correct.
 *
 * The single authority on pass/fail, so callers never re-derive it: {@link gradeCase} uses it for
 * the verdict and the store uses it to spot a case that just broke.
 */
export const matchesBaseline = (baseline: RunShape, last: RunShape): boolean => divergences(baseline, last).length === 0;

/** A run with no baseline yet, stated as plain facts — never as a pass or a fail. */
function describeUnreviewed(shape: RunShape): string {
  if (shape.errored) return "It errored. Fix that first, then accept a run as correct.";
  return `${describeShape(shape)}. Accept it as correct to make this the baseline.`;
}

/**
 * Grade one case. `specChangedAt` is when the spec was last edited: a run older than that is stale,
 * because it graded code that no longer exists.
 *
 * @example
 * ```ts
 * gradeCase(c, spec.updatedAt).verdict; // "pass" | "fail" | "stale" | "unreviewed"
 * ```
 */
export function gradeCase(c: Case, specChangedAt: number): CaseResult {
  const expects = c.baseline === null ? "not yet accepted" : describeShape(c.baseline);

  if (c.last === null || c.checkedAt === null) {
    return { verdict: "unreviewed", why: "Never run. Check it to see what the agent does.", expects };
  }
  if (c.checkedAt < specChangedAt) {
    return { verdict: "stale", why: "The spec changed after this run — re-check it.", expects };
  }
  if (c.baseline === null) {
    return { verdict: "unreviewed", why: describeUnreviewed(c.last), expects };
  }

  const diverged = divergences(c.baseline, c.last);
  if (diverged.length === 0) {
    return { verdict: "pass", why: `Still ${describeShape(c.last)}.`, expects };
  }
  // One clause reads as a cause; several read as a list. Both stay one sentence.
  const why = diverged.length === 1 ? `${diverged[0]}.` : `${diverged.slice(0, -1).join(", ")}, and ${diverged.at(-1)}.`;
  return { verdict: "fail", why: why.charAt(0).toUpperCase() + why.slice(1), expects };
}

/** Casebook health, for the topbar badge and the strip header. */
export interface Health {
  readonly pass: number;
  readonly fail: number;
  readonly unreviewed: number;
  readonly stale: number;
  readonly total: number;
  readonly label: string;
  readonly tone: "good" | "warn" | "bad" | "idle";
}

/**
 * Roll individual verdicts into the one badge the chrome shows.
 *
 * @example
 * ```ts
 * healthOf(cases, spec.updatedAt).label; // "3 of 5 pass"
 * ```
 */
export function healthOf(cases: readonly Case[], specChangedAt: number): Health {
  let pass = 0;
  let fail = 0;
  let unreviewed = 0;
  let stale = 0;
  for (const c of cases) {
    const { verdict } = gradeCase(c, specChangedAt);
    if (verdict === "pass") pass++;
    else if (verdict === "fail") fail++;
    else if (verdict === "stale") stale++;
    else unreviewed++;
  }
  const total = cases.length;
  const graded = pass + fail;
  // Report the thing that most needs attention: failures, then staleness, then unreviewed.
  const label =
    total === 0
      ? "no cases"
      : fail > 0
        ? `${pass} of ${graded} pass`
        : stale > 0
          ? `${stale} to re-check`
          : graded > 0
            ? `${pass} of ${graded} pass`
            : `${unreviewed} unreviewed`;
  const tone = total === 0 ? "idle" : fail > 0 ? "bad" : stale > 0 ? "warn" : graded > 0 ? "good" : "warn";
  return { pass, fail, unreviewed, stale, total, label, tone };
}
