/*
 * "Will the model pick it?" — a static lint over a ToolSpec.
 *
 * A tool the model never calls is the single most common reason a first agent looks broken, and the
 * cause is almost always the description rather than the code. This scores the things a model
 * actually reads when choosing a tool — the name, the description, and each input's description —
 * and names what to fix. It is a heuristic, deliberately: it runs on every keystroke with no model,
 * no network and no key, which is what makes it useful while you are still typing.
 *
 * Studio-local on purpose. It encodes prompt-authoring taste, not a framework contract, so it does
 * not belong in @mithril/spec's public API.
 */
import type { ToolSpec } from "@mithril/spec";

/** How confident the lint is that a model would reach for this tool. */
export type PickTone = "good" | "warn" | "bad";

/** One thing the lint checked, and whether it held. */
export interface Finding {
  /** Stable id — the Designer keys its "fix" buttons off this. */
  readonly id: string;
  /** `pass` reads as a tick, `warn`/`fail` as the thing to go fix. */
  readonly level: "pass" | "warn" | "fail";
  readonly text: string;
  /** True when a drafting model could rewrite the offending text for you. */
  readonly fixable: boolean;
}

export interface PickScore {
  /** 0–100. Not a probability — a weighted sum of the checks below. */
  readonly score: number;
  readonly tone: PickTone;
  /** One line on what the score means, in the product's voice. */
  readonly verdict: string;
  readonly findings: readonly Finding[];
}

/** Below this a tool reads as under-described rather than merely terse. */
const MIN_DESCRIPTION = 25;
/** A description this long says when to use the tool, not just what it is. */
const RICH_DESCRIPTION = 60;

/*
 * Arity, stated in prose. Narrow ON PURPOSE: this only suppresses the zero-argument warning when the
 * description already tells the model there is nothing to supply. It awards nothing.
 *
 * There used to be a TRIGGER_WORDS check here paying 25 points for `use|call|when|if|ask|need|want`.
 * It was deleted rather than tightened: it paid full marks to "When preparing for meetings, call the
 * calendar reader" — a description that talked a model OUT of calling the tool, because it read the
 * clause as a precondition it had not met. A keyword cannot tell the two apart, so a smarter keyword
 * would be the same mistake in different words. Whether a model picks a tool is measured, not guessed.
 */
const ARITY_STATED = /\b(no|zero|without)\s+(arg|args|argument|arguments|input|inputs|parameter|parameters)\b/i;
// A placeholder identifier from `+ tool`, not a name anyone chose.
const PLACEHOLDER_NAME = /^(tool|my_?tool|untitled|new_?tool)\d*$/i;
// A concrete value in an input description — "e.g. Istanbul" teaches the model the shape.
const HAS_EXAMPLE = /\be\.?g\.?\b|\bfor example\b|\bsuch as\b|"[^"]+"|'[^']+'/i;

/** What each check contributes to the 0–100 total. */
export const WEIGHTS = { name: 15, length: 40, inputsDescribed: 30, inputsExemplified: 15 } as const;

/** Score at or above which a tool reads `good`, and above which it reads `warn`. */
export const TONE_AT = { good: 75, warn: 45 } as const;

/** One row of the scoring explainer. */
export interface ScoringRule {
  /** Matches the {@link Finding} id it governs, so a row can be tied to the check it explains. */
  readonly id: string;
  readonly label: string;
  readonly points: number;
  /** How the points are actually earned — the rule, not a paraphrase of it. */
  readonly how: string;
}

/**
 * The rubric, in the UI's words.
 *
 * Exported from the lint rather than written into the panel so the explanation and the arithmetic
 * can never disagree: `points` reads straight out of {@link WEIGHTS}, and every `how` states the
 * literal test the code runs — including where that test is only a proxy.
 */
export const SCORING_RULES: readonly ScoringRule[] = [
  { id: "name", label: "Name", points: WEIGHTS.name, how: "At least 3 characters and not a leftover placeholder like `tool1`." },
  {
    id: "description",
    label: "Description length",
    points: WEIGHTS.length,
    how: `Banded: under ${MIN_DESCRIPTION} characters earns 30% of the points, under ${RICH_DESCRIPTION} earns 70%, longer earns all of it.`,
  },
  { id: "inputs", label: "Inputs described", points: WEIGHTS.inputsDescribed, how: "Prorated by how many inputs carry a `.describe(…)`. A tool with no inputs is scored without this rule, not given it." },
  {
    id: "examples",
    label: "Inputs show an example",
    points: WEIGHTS.inputsExemplified,
    how: "Prorated by how many descriptions contain `e.g.`, `for example`, `such as`, or a quoted value.",
  },
];

/** Input names and descriptions, read out of the tool's zod source. */
export interface ParsedInput {
  readonly name: string;
  readonly description: string;
  /** The field's raw zod expression, so callers can classify its type without re-scanning. */
  readonly expr: string;
}

const ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r" };

/**
 * Decode the escapes in a JS string literal's body.
 *
 * The field editor writes descriptions with `JSON.stringify`, so a description containing a quote
 * comes back as `\"`. Without this the Fields ⇄ zod round trip would gain a backslash every time the
 * user typed a quotation mark.
 */
const unescapeLiteral = (raw: string): string => raw.replace(/\\(.)/g, (_, ch: string) => ESCAPES[ch] ?? ch);

/**
 * Pull `name: z.type().describe("…")` pairs out of a zod object source.
 *
 * Deliberately a regex and not a parser: the lint only needs the field names and any `.describe`
 * text, it must survive half-typed source without throwing, and the authoritative schema is the zod
 * source itself — this never feeds codegen.
 */
export function parseInputs(zod: string): readonly ParsedInput[] {
  const body = /z\s*\.\s*object\s*\(\s*\{([\s\S]*)\}\s*\)/.exec(zod);
  if (body === null) return [];
  const out: ParsedInput[] = [];
  // Each field starts at `name:` and runs to the next top-level field or the end. The parenthesised
  // branch must come FIRST: a `.describe("a, b")` contains commas, and a leading `[^,{}]` branch
  // would consume the opening paren one char at a time and stop dead on the inner comma.
  const field = /([A-Za-z_$][\w$]*)\s*:\s*((?:\([^()]*\)|[^,{}])*)/g;
  for (const m of body[1]?.matchAll(field) ?? []) {
    const [, name = "", expr = ""] = m;
    const described = /\.\s*describe\s*\(\s*(["'`])([\s\S]*?)\1\s*\)/.exec(expr);
    out.push({ name, description: unescapeLiteral(described?.[2] ?? ""), expr: expr.trim() });
  }
  return out;
}

const toneOf = (score: number): PickTone => (score >= TONE_AT.good ? "good" : score >= TONE_AT.warn ? "warn" : "bad");

const VERDICTS: Record<PickTone, string> = {
  good: "A model reading this knows what it does and when to reach for it.",
  warn: "It might get picked. The gaps below are what a model would hesitate over.",
  bad: "A model will probably answer from memory instead of calling this.",
};

/**
 * Score a tool on how likely a model is to call it, and say what to fix.
 *
 * @example
 * ```ts
 * const { score, findings } = pickScore(tool);
 * if (score < 45) console.log(findings.filter((f) => f.level !== "pass"));
 * ```
 */
export function pickScore(tool: ToolSpec): PickScore {
  const description = tool.description.trim();
  const inputs = parseInputs(tool.inputSchema.zod);
  const findings: Finding[] = [];
  let score = 0;

  // ── the name ──
  const namedWell = tool.name.trim().length >= 3 && !PLACEHOLDER_NAME.test(tool.name.trim());
  if (namedWell) {
    score += WEIGHTS.name;
    findings.push({ id: "name", level: "pass", text: `Named \`${tool.name}\` — reads as an action.`, fixable: false });
  } else {
    findings.push({
      id: "name",
      level: "fail",
      text: `\`${tool.name}\` is a placeholder name — rename it after what it does.`,
      fixable: true,
    });
  }

  // ── the description: the only thing the model reads before deciding ──
  if (description.length === 0) {
    findings.push({ id: "description", level: "fail", text: "No description at all — the model is guessing.", fixable: true });
  } else if (description.length < MIN_DESCRIPTION) {
    score += Math.round(WEIGHTS.length * 0.3);
    findings.push({
      id: "description",
      level: "fail",
      text: `Description is ${description.length} characters — too short to choose on.`,
      fixable: true,
    });
  } else if (description.length < RICH_DESCRIPTION) {
    score += Math.round(WEIGHTS.length * 0.7);
    findings.push({ id: "description", level: "warn", text: "Description is brief — one more clause would earn the call.", fixable: true });
  } else {
    score += WEIGHTS.length;
    findings.push({ id: "description", level: "pass", text: "Description has enough to choose on.", fixable: false });
  }

  // Reported, never scored: this is a fact about two strings, not a prediction about behaviour.
  const restatesName = description.length > 0 && description.replace(/[^a-z]/gi, "").toLowerCase() === tool.name.replace(/[^a-z]/gi, "").toLowerCase();
  if (restatesName) {
    findings.push({ id: "restates", level: "warn", text: "The description only restates the name — it adds nothing to choose on.", fixable: true });
  }

  // A zero-argument tool whose description never says so is the shape that makes a model decide it must
  // be missing information and ask the user instead of calling. No points: the fix is deterministic
  // (`examples: [{}]` puts a literal empty call in front of the model), and a reward here would be one
  // more number standing in for evidence.
  if (inputs.length === 0 && !ARITY_STATED.test(description) && tool.examples === undefined) {
    findings.push({
      id: "arity",
      level: "warn",
      text: "Takes no arguments, but never says so — models often ask the user for input instead of calling.",
      fixable: true,
    });
  }

  // ── the inputs ──
  if (inputs.length === 0) {
    // NOT APPLICABLE, not free marks. Awarding the input points to a tool with no inputs contributed 30 of
    // the 91 scored by a tool whose body was a ReferenceError — a bonus for the single riskiest shape.
    // The weights leave the denominator instead (see `applicable`), so arity neither pays nor costs.
    findings.push({ id: "inputs", level: "pass", text: "No inputs to describe.", fixable: false });
  } else {
    const undescribed = inputs.filter((i) => i.description.trim().length === 0);
    if (undescribed.length === 0) {
      score += WEIGHTS.inputsDescribed;
      findings.push({ id: "inputs", level: "pass", text: `All ${inputs.length} input${inputs.length === 1 ? "" : "s"} described.`, fixable: false });
    } else {
      score += Math.round((WEIGHTS.inputsDescribed * (inputs.length - undescribed.length)) / inputs.length);
      findings.push({
        id: "inputs",
        level: "warn",
        text: `${undescribed.map((i) => `\`${i.name}\``).join(", ")} ${undescribed.length === 1 ? "has" : "have"} no description.`,
        fixable: true,
      });
    }

    const exemplified = inputs.filter((i) => HAS_EXAMPLE.test(i.description));
    if (exemplified.length === inputs.length) {
      score += WEIGHTS.inputsExemplified;
      findings.push({ id: "examples", level: "pass", text: "Every input shows what a good value looks like.", fixable: false });
    } else {
      score += Math.round((WEIGHTS.inputsExemplified * exemplified.length) / inputs.length);
      findings.push({
        id: "examples",
        level: "warn",
        text: "No input shows an example value — models copy examples.",
        fixable: true,
      });
    }
  }

  // A percentage of what APPLIES: a tool with no inputs is judged on its name and description alone,
  // out of 100, rather than handed points for rules it can neither earn nor fail.
  const applicable = WEIGHTS.name + WEIGHTS.length + (inputs.length === 0 ? 0 : WEIGHTS.inputsDescribed + WEIGHTS.inputsExemplified);
  const pct = Math.round((score / applicable) * 100);
  // A missing description is disqualifying on its own: the description is the only thing the model
  // reads before choosing, so well-described inputs must not be able to lift it out of the red.
  const capped = description.length === 0 ? Math.min(pct, 20) : pct;
  const clamped = Math.max(0, Math.min(100, capped));
  const tone = toneOf(clamped);
  return { score: clamped, tone, verdict: VERDICTS[tone], findings };
}

/**
 * The one-line reason a tool is flagged, or `null` when nothing is wrong.
 *
 * @remarks Independent of the score, and must stay that way. Gating this on `score < 75` is what let a
 * tool sitting at 90 with a live finding render no reason at all — the literal mechanism of the
 * "everything looked fine" report. Use {@link hasConcern} to decide whether to show it.
 */
export function weakestReason(s: PickScore): string | null {
  const worst = s.findings.find((f) => f.level === "fail") ?? s.findings.find((f) => f.level === "warn");
  return worst === undefined ? null : worst.text;
}

/** Whether anything on this tool warrants attention — regardless of what the number says. */
export function hasConcern(s: PickScore): boolean {
  return s.findings.some((f) => f.level !== "pass");
}
