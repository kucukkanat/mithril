import { describe, expect, test } from "bun:test";
import type { ToolSpec } from "@mithril/spec";
import { hasConcern, parseInputs, pickScore, SCORING_RULES, TONE_AT, WEIGHTS, weakestReason } from "../src/lib/pick-score.ts";

const tool = (over: Partial<ToolSpec> = {}): ToolSpec => ({
  kind: "tool",
  id: "weather",
  name: "get_current_weather",
  description: "Use this to look up the current conditions for a city right now, whenever the user asks about weather.",
  inputSchema: { zod: `z.object({ city: z.string().describe("The city to look up, e.g. Istanbul") })` },
  execute: { code: `async ({ city }) => ({ tempC: 21, city })` },
  ...over,
});

const findingsById = (t: ToolSpec): Record<string, string> =>
  Object.fromEntries(pickScore(t).findings.map((f) => [f.id, f.level]));

describe("parseInputs", () => {
  test("reads field names and .describe text out of zod source", () => {
    expect(parseInputs(`z.object({ city: z.string().describe("e.g. Oslo"), days: z.number() })`)).toEqual([
      { name: "city", description: "e.g. Oslo", expr: `z.string().describe("e.g. Oslo")` },
      { name: "days", description: "", expr: "z.number()" },
    ]);
  });

  test("returns nothing for a non-object schema", () => {
    expect(parseInputs("z.string()")).toEqual([]);
  });

  test("survives half-typed source without throwing", () => {
    expect(() => parseInputs("z.object({ city: z.str")).not.toThrow();
    expect(parseInputs("z.object({ city: z.str")).toEqual([]);
  });

  test("handles single quotes and backticks in describe", () => {
    expect(parseInputs("z.object({ a: z.string().describe('one'), b: z.string().describe(`two`) })")).toEqual([
      { name: "a", description: "one", expr: "z.string().describe('one')" },
      { name: "b", description: "two", expr: "z.string().describe(`two`)" },
    ]);
  });
});

describe("pickScore", () => {
  test("a well-described tool scores good and every check passes", () => {
    const s = pickScore(tool());
    expect(s.score).toBe(100);
    expect(s.tone).toBe("good");
    expect(s.findings.every((f) => f.level === "pass")).toBe(true);
    expect(weakestReason(s)).toBeNull();
  });

  test("an empty description fails hard and is flagged fixable", () => {
    const s = pickScore(tool({ description: "" }));
    expect(s.tone).toBe("bad");
    const desc = s.findings.find((f) => f.id === "description");
    expect(desc?.level).toBe("fail");
    expect(desc?.fixable).toBe(true);
  });

  /*
   * Was: `expect(findings.find(f => f.id === "trigger")?.level).toBe("fail")`.
   * The trigger check is gone. It paid 25 points for `use|call|when|if|ask|need|want`, which meant it paid
   * FULL MARKS to "When preparing for meetings, call the calendar reader" — the description that talked a
   * real model out of calling the tool, because it read the clause as a precondition it had not met. The
   * property worth pinning is that the two framings are no longer ranked by keyword.
   */
  test("conditional call-time framing no longer outscores returns framing", () => {
    const conditional = pickScore(tool({ name: "calendar", description: "When preparing for meetings, call the calendar reader to see the day." }));
    const returns = pickScore(tool({ name: "calendar", description: "Returns the user's calendar events for today. Takes no arguments." }));
    expect(conditional.score).toBeLessThanOrEqual(returns.score);
  });

  test("a placeholder name from `+ tool` is called out", () => {
    expect(findingsById(tool({ name: "tool1" }))["name"]).toBe("fail");
    expect(findingsById(tool({ name: "untitled" }))["name"]).toBe("fail");
    expect(findingsById(tool({ name: "search_web" }))["name"]).toBe("pass");
  });

  test("a description that only restates the name is reported, not scored", () => {
    const s = pickScore(tool({ name: "get_weather", description: "get weather" }));
    expect(s.findings.find((f) => f.id === "restates")?.level).toBe("warn");
  });

  test("undescribed inputs are named individually", () => {
    const s = pickScore(tool({ inputSchema: { zod: `z.object({ city: z.string(), unit: z.string() })` } }));
    const inputs = s.findings.find((f) => f.id === "inputs");
    expect(inputs?.level).toBe("warn");
    expect(inputs?.text).toContain("`city`");
    expect(inputs?.text).toContain("`unit`");
  });

  test("partially described inputs score between none and all", () => {
    const none = pickScore(tool({ inputSchema: { zod: `z.object({ a: z.string(), b: z.string() })` } })).score;
    const half = pickScore(tool({ inputSchema: { zod: `z.object({ a: z.string().describe("e.g. x"), b: z.string() })` } })).score;
    const all = pickScore(tool({ inputSchema: { zod: `z.object({ a: z.string().describe("e.g. x"), b: z.string().describe("e.g. y") })` } })).score;
    expect(none).toBeLessThan(half);
    expect(half).toBeLessThan(all);
  });

  /*
   * Was: `expect(s.score).toBe(100)` for `z.object({})`. Handing a zero-argument tool the full input
   * weighting was 30 of the 91 scored by a tool whose body was a ReferenceError — a bonus for the single
   * riskiest shape. Zero inputs is now NOT APPLICABLE: it leaves the denominator, so it neither pays nor
   * costs, and the score still reflects the description it was actually judged on.
   */
  test("no inputs is not applicable, not free marks", () => {
    const weakDesc = pickScore(tool({ inputSchema: { zod: "z.object({})" }, description: "Weather now." }));
    const richDesc = pickScore(tool({ inputSchema: { zod: "z.object({})" }, description: "Returns the present atmospheric conditions for a named place, alongside the source it came from." }));
    expect(weakDesc.score).toBeLessThan(100);
    expect(weakDesc.score).toBeLessThan(richDesc.score);
    expect(weakDesc.findings.find((f) => f.id === "inputs")?.level).toBe("pass");
  });

  test("a zero-argument tool that never says so is flagged, and the fix needs no model", () => {
    const silent = pickScore(tool({ inputSchema: { zod: "z.object({})" }, description: "Returns the user's calendar events for today." }));
    expect(silent.findings.find((f) => f.id === "arity")?.level).toBe("warn");
    // Saying it in prose, or shipping an empty example, both settle it.
    const stated = pickScore(tool({ inputSchema: { zod: "z.object({})" }, description: "Returns today's events. Takes no arguments." }));
    expect(stated.findings.find((f) => f.id === "arity")).toBeUndefined();
    const exampled = pickScore(tool({ inputSchema: { zod: "z.object({})" }, description: "Returns the user's calendar events for today.", examples: [{}] }));
    expect(exampled.findings.find((f) => f.id === "arity")).toBeUndefined();
  });

  test("a described input with no example value is a soft warning only", () => {
    const s = pickScore(tool({ inputSchema: { zod: `z.object({ city: z.string().describe("the city") })` } }));
    expect(s.findings.find((f) => f.id === "inputs")?.level).toBe("pass");
    expect(s.findings.find((f) => f.id === "examples")?.level).toBe("warn");
  });

  test("score is always within 0..100 and tone tracks it", () => {
    const worst = pickScore(tool({ name: "tool1", description: "", inputSchema: { zod: `z.object({ a: z.string() })` } }));
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
    expect(worst.tone).toBe("bad");
    expect(pickScore(tool()).score).toBeLessThanOrEqual(100);
  });

  test("weakestReason surfaces a failure ahead of a warning", () => {
    const s = pickScore(tool({ description: "x", inputSchema: { zod: `z.object({ a: z.string() })` } }));
    expect(weakestReason(s)).toContain("too short");
  });
});

describe("SCORING_RULES — the explainer the tooltip renders", () => {
  test("every rule names a check pickScore actually reports", () => {
    const ids = new Set(pickScore({
      kind: "tool",
      id: "t",
      name: "t",
      description: "",
      inputSchema: { zod: "z.object({ city: z.string() })" },
      execute: { code: "async () => ({})" },
    }).findings.map((f) => f.id));
    for (const rule of SCORING_RULES) expect(ids.has(rule.id)).toBe(true);
  });

  test("the points it advertises ARE the weights, and they total 100", () => {
    expect(SCORING_RULES.map((r) => r.points)).toEqual(Object.values(WEIGHTS));
    expect(SCORING_RULES.reduce((n, r) => n + r.points, 0)).toBe(100);
  });

  test("a perfect tool reaches exactly the advertised total", () => {
    const perfect: ToolSpec = {
      kind: "tool",
      id: "get_weather",
      name: "get_weather",
      description: "Use this whenever the user asks about the current weather in a named place, and cite the source.",
      inputSchema: { zod: 'z.object({ city: z.string().describe("e.g. Istanbul") })' },
      execute: { code: "async ({ city }) => ({ city })" },
    };
    expect(pickScore(perfect).score).toBe(100);
  });

  test("the tone thresholds it quotes are the ones toneOf uses", () => {
    const at = (description: string): ToolSpec => ({
      kind: "tool",
      id: "get_weather",
      name: "get_weather",
      description,
      inputSchema: { zod: "z.object({})" },
      execute: { code: "async () => ({})" },
    });
    expect(pickScore(at("Use this whenever the user asks about the current weather in a named place, and cite it.")).tone).toBe("good");
    // one point under the green threshold is amber, and one under that is red
    expect(pickScore(at("Weather now")).tone).toBe("warn");
    expect(pickScore(at("")).tone).toBe("bad");
  });

  /*
   * Was: a test asserting that a tool failing one check "lands exactly on the green threshold" and that
   * "the card reads green" — the collision characterized as intended. That is the bug: a live finding was
   * invisible because a number said 75+. Nothing may read clean while a finding is open, at ANY score.
   */
  test("a live finding is never invisible, however high the score", () => {
    const score = pickScore({
      kind: "tool",
      id: "get_weather",
      name: "get_weather",
      description: "Returns the present atmospheric conditions for a named place, alongside the source it came from.",
      inputSchema: { zod: "z.object({})" },
      execute: { code: "async () => ({})" },
    });
    expect(score.score).toBeGreaterThanOrEqual(TONE_AT.good);
    expect(hasConcern(score)).toBe(true); // the arity finding is open …
    expect(weakestReason(score)).not.toBeNull(); // … and it has a reason to show, score notwithstanding
  });
});
