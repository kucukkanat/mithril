import type { JsonValue } from "@mithril/core/protocol";
import type { MithrilEvent } from "@mithril/core/protocol";
import { toolDeclSource, type ToolSpec } from "@mithril/spec";
import { paramsOf, type Param } from "./tool-fields.ts";

/*
 * The tool probe: execute a tool body offline, before any model ever calls it.
 *
 * Every other signal Studio shows about a tool is derived from its PROSE — `pickScore` reads the name,
 * description and input list, and the word `execute` appears nowhere in it. That is why a tool whose body
 * was a ReferenceError scored 90/100. This module supplies the missing signal by running the thing.
 *
 * It drives the REAL loop (`scriptedProvider` from `@mithril/core/testkit`, already registered in the
 * runner worker's module registry) rather than invoking `execute` directly, so the probe inherits input
 * validation, `outputSchema` enforcement, `timeoutMs` and `classifyToolError` exactly as a real run would.
 * A hand-rolled direct invoke would drift from the loop — which is the bug class this exists to kill.
 *
 * Two calls with DIFFERENT synthetic arguments, in one run, so "returns the same thing no matter what you
 * pass it" is observable rather than inferred.
 */

/** What executing the body actually did — the four states a developer could not previously tell apart. */
export type ProbeState = "broken" | "stub" | "empty" | "ok";

/** The verdict for one tool, with the evidence that produced it. */
export interface ProbeResult {
  readonly state: ProbeState;
  /** Two or three words for the badge. */
  readonly headline: string;
  /** The evidence: the literal error, or what the two trials returned. Shown verbatim — never paraphrased. */
  readonly detail: string;
  /** What each trial returned, in order; absent entries are trials that threw. */
  readonly outputs: readonly JsonValue[];
}

/** A capability that reaches outside the worker, and the token that revealed it. */
export interface SideEffect {
  readonly capability: string;
  readonly token: string;
}

// Executing a body is not free: the runner worker does NOT sandbox the network, so a body that calls a real
// API really calls it. Anything that can reach outside the worker turns the probe into an explicit,
// click-to-run action instead of something Studio does on its own. Matching is deliberately broad — a false
// "needs your confirmation" costs a click, a false "safe to auto-run" could charge a credit card.
const OUTSIDE_WORLD: readonly { readonly re: RegExp; readonly capability: string }[] = [
  { re: /\bfetch\s*\(/, capability: "makes a network request" },
  { re: /\bXMLHttpRequest\b/, capability: "makes a network request" },
  { re: /\bWebSocket\b/, capability: "opens a socket" },
  { re: /\bEventSource\b/, capability: "opens a stream" },
  { re: /\bsendBeacon\b/, capability: "makes a network request" },
  { re: /\bimport\s*\(/, capability: "loads code dynamically" },
  { re: /\brequire\s*\(/, capability: "loads code dynamically" },
  { re: /\blocalStorage\b/, capability: "writes browser storage" },
  { re: /\bsessionStorage\b/, capability: "writes browser storage" },
  { re: /\bindexedDB\b/, capability: "writes browser storage" },
  { re: /\bcaches\b/, capability: "writes browser storage" },
  { re: /\bpostMessage\s*\(/, capability: "messages another context" },
  { re: /\bnavigator\b/, capability: "reads device APIs" },
  { re: /\bprocess\b/, capability: "reads the environment" },
];

/**
 * Detect whether a tool body can reach outside the worker.
 *
 * @param code - the body source (`ToolSpec.execute.code`).
 * @returns the first capability found, or `null` when the body is self-contained.
 *
 * @remarks Drives consent, not correctness: a self-contained body — which every generated scaffold is — can
 * be probed automatically because running it cannot touch anything. A body that can call out is only ever
 * probed when the developer asks, because the probe would perform the call for real.
 * @example
 * ```ts
 * reachesOutside("async () => ({ ok: true })");            // → null, safe to auto-probe
 * reachesOutside("async () => (await fetch(url)).json()"); // → { capability: "makes a network request", … }
 * ```
 */
export function reachesOutside(code: string): SideEffect | null {
  for (const { re, capability } of OUTSIDE_WORLD) {
    const m = re.exec(code);
    if (m !== null) return { capability, token: m[0].replace(/\s*\($/, "") };
  }
  return null;
}

// The scaffolds Studio itself generates carry this marker. Its presence is proof the body was never edited —
// a zero-false-positive "still a stub", unlike guessing from the shape of the return value.
const SCAFFOLD_MARKER = /TODO: call your real/i;

const VALUES: Record<Param["type"], readonly [JsonValue, JsonValue]> = {
  text: ["probe-alpha", "probe-beta"],
  number: [1, 2],
  boolean: [true, false],
};

/**
 * Build two synthetic argument objects for a tool's input schema.
 *
 * @param zod - the tool's `inputSchema.zod` source.
 * @returns a pair of argument objects whose every field differs between them.
 *
 * @remarks The two must differ in every field, because the only way to observe "this body ignores its
 * input" is to vary the input and watch the output stay put. A schema with no fields yields two empty
 * objects, and the resulting verdict simply does not claim anything about variation.
 * @example
 * ```ts
 * syntheticInputs('z.object({ city: z.string() })');
 * // → [{ city: "probe-alpha" }, { city: "probe-beta" }]
 * ```
 */
export function syntheticInputs(zod: string): readonly [JsonValue, JsonValue] {
  const params = paramsOf(zod);
  const build = (which: 0 | 1): JsonValue =>
    Object.fromEntries(params.map((p) => [p.name, VALUES[p.type][which]])) as JsonValue;
  return [build(0), build(1)];
}

/**
 * Build the program that executes one tool body twice, offline.
 *
 * @param tool - the tool to probe.
 * @returns runnable source for the Studio runner worker — no provider, no key, no network.
 *
 * @remarks The tool declaration comes from {@link toolDeclSource}, so the probe compiles the identical
 * source a real run does. `needsApproval` is dropped: a probe that inherited it would suspend on a decision
 * no probe UI is there to make. `maxSteps` bounds the loop at exactly the two scripted calls plus the reply.
 * @example
 * ```ts
 * client.run(probeProgram(tool));
 * ```
 */
export function probeProgram(tool: ToolSpec): string {
  const [a, b] = syntheticInputs(tool.inputSchema.zod);
  return [
    `import { agent, tool } from "mithril";`,
    `import { scriptedProvider, testModel, textTurn, toolCallTurn } from "@mithril/core/testkit";`,
    `import { z } from "zod";`,
    ``,
    toolDeclSource(tool, true),
    ``,
    `const __probe = agent({`,
    `  model: testModel(scriptedProvider([`,
    `    toolCallTurn(${JSON.stringify(tool.name)}, ${JSON.stringify(a)}, "probe-a"),`,
    `    toolCallTurn(${JSON.stringify(tool.name)}, ${JSON.stringify(b)}, "probe-b"),`,
    `    textTurn(""),`,
    `  ])),`,
    `  instructions: "",`,
    `  tools: [${tool.id}],`,
    `  maxSteps: 4,`,
    `});`,
    ``,
    `await run(__probe, "probe");`,
  ].join("\n");
}

const isEmptyish = (v: JsonValue | undefined): boolean =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

const preview = (v: JsonValue | undefined): string => {
  const s = JSON.stringify(v ?? null);
  return s.length > 160 ? `${s.slice(0, 157)}…` : s;
};

/**
 * Classify what a probe run observed.
 *
 * @param tool - the probed tool (its body is read for the scaffold marker).
 * @param events - the run's event stream.
 * @returns the verdict plus the literal evidence behind it.
 *
 * @remarks Ordered by how load-bearing the evidence is. A throw is a fact, so it outranks everything. The
 * scaffold marker is a fact about the source. "Same output for different inputs" is only a signal — it is
 * reported as one, and never claimed for a schema with no fields to vary.
 * @example
 * ```ts
 * classifyProbe(tool, events); // → { state: "broken", detail: "ReferenceError: personName is not defined" }
 * ```
 */
export function classifyProbe(tool: ToolSpec, events: readonly MithrilEvent[]): ProbeResult {
  const errors = events.flatMap((e) => (e.type === "tool.error" ? [e.error] : []));
  const outputs = events.flatMap((e) => (e.type === "tool.result" ? [e.output] : []));

  if (errors.length > 0) {
    const first = errors[0];
    return {
      state: "broken",
      headline: "broken",
      // The literal message, attributed to the tool — this is the line that ends the whole investigation.
      detail: `${tool.name} threw: ${first?.message ?? "unknown error"}`,
      outputs,
    };
  }

  if (outputs.length === 0) {
    return { state: "broken", headline: "never ran", detail: `${tool.name} produced no result and no error — the call never reached the body.`, outputs };
  }

  if (SCAFFOLD_MARKER.test(tool.execute.code)) {
    return { state: "stub", headline: "still a stub", detail: `The generated scaffold is unedited — it returns ${preview(outputs[0])} without calling anything real.`, outputs };
  }

  if (outputs.every(isEmptyish)) {
    return { state: "empty", headline: "returns nothing", detail: `${tool.name} ran cleanly but returned ${preview(outputs[0])} for both trials — the model gets no data from it.`, outputs };
  }

  const varied = paramsOf(tool.inputSchema.zod).length > 0;
  if (varied && outputs.length > 1 && JSON.stringify(outputs[0]) === JSON.stringify(outputs[1])) {
    return {
      state: "stub",
      headline: "ignores its input",
      detail: `Two different inputs both returned ${preview(outputs[0])}. If that is not intentional, the body is not reading its arguments.`,
      outputs,
    };
  }

  return { state: "ok", headline: "runs", detail: `Returned ${preview(outputs[0])}.`, outputs };
}

/**
 * A stable cache key for a probe result.
 *
 * @param tool - the tool to key.
 * @returns a hash covering only the inputs that can change a probe's outcome.
 *
 * @remarks Deliberately narrow: renaming a tool or rewriting its description cannot change what the body
 * does, so those must not invalidate a result and send the developer back to a spinner.
 */
export function probeKey(tool: ToolSpec): string {
  const src = `${tool.inputSchema.zod} ${tool.execute.code} ${tool.outputSchema?.zod ?? ""}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
