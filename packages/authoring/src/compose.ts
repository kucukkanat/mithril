import type { AnyTool, JsonValue, RunContext, ToolDefinition, ToolProgress } from "@mithril/core/protocol";
import { MithrilError } from "@mithril/core/agent";

// Tier 1 — a composed tool: a linear pipeline over tools that ALREADY exist in the run's registry.
//
// Deliberately not a programming language. There is no branching, no arithmetic, no string manipulation and
// no map-over-array; the moment `args` accepts `{ "$concat": [...] }` you own an interpreter and its
// security surface. When a pipeline is not enough, the answer is Tier 2 (a sandboxed script), not a richer
// JSON dialect.
//
// The security property that makes this the default tier: a composition can only reference tools already in
// the registry, so it can rearrange the agent's existing capabilities but never exceed them. Combined with
// approval inheritance (see `inheritsApproval`), wrapping a gated tool cannot launder away its gate.

/** A value a composition step can pass: the tool's own input, an earlier step's output, or a literal. */
export type ValueRef =
  | { readonly from: "input"; readonly path?: string }
  | { readonly from: "step"; readonly id: string; readonly path?: string }
  | { readonly value: JsonValue };

/** One step: call a registered tool with an object assembled from {@link ValueRef}s. */
export interface CompositionStep {
  /** Unique within the composition; later steps reference this step's output by it. */
  readonly id: string;
  /** The name of a tool that must already exist when the composition is defined. */
  readonly tool: string;
  readonly args: Readonly<Record<string, ValueRef>>;
}

/** The declarative body of a Tier-1 composed tool. */
export interface ToolComposition {
  readonly kind: "composition";
  readonly steps: readonly [CompositionStep, ...CompositionStep[]];
  /** What the composed tool returns; defaults to the last step's output. */
  readonly returns?: ValueRef;
}

/** Narrow an opaque definition `body` to a {@link ToolComposition}. */
export function isComposition(body: JsonValue): body is ToolComposition & JsonValue {
  return body !== null && typeof body === "object" && !Array.isArray(body) && (body as { kind?: unknown }).kind === "composition";
}

// Total dotted-path lookup: a miss is `undefined`, never a throw. Numeric segments index arrays.
function atPath(value: JsonValue | undefined, path: string | undefined): JsonValue | undefined {
  if (path === undefined || path === "") return value;
  let cur: JsonValue | undefined = value;
  for (const seg of path.split(".")) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur)) {
      const i = Number(seg);
      cur = Number.isInteger(i) ? cur[i] : undefined;
    } else if (typeof cur === "object") {
      cur = (cur as Record<string, JsonValue>)[seg];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Resolve one {@link ValueRef} against the composed tool's input and the outputs so far. */
export function resolveRef(ref: ValueRef, input: JsonValue, outputs: Readonly<Record<string, JsonValue>>): JsonValue | undefined {
  if ("value" in ref) return ref.value;
  if (ref.from === "input") return atPath(input, ref.path);
  return atPath(outputs[ref.id], ref.path);
}

/**
 * Validate a composition against the tools available right now.
 *
 * @param comp - the composition to check.
 * @param known - a predicate for "is this tool name registered?".
 * @throws {@link MithrilError} `COMPOSITION_INVALID` for a duplicate/unknown step id, a forward or
 * self reference, or a step naming a tool that does not exist.
 *
 * @remarks
 * Every check runs at *define* time, not call time — a broken composition is rejected while the model can
 * still read the error and try again. Because a step may only reference an earlier step and tools that
 * already exist, the composition graph is acyclic by construction.
 */
export function validateComposition(comp: ToolComposition, known: (name: string) => boolean): void {
  const seen = new Set<string>();
  for (const step of comp.steps) {
    if (seen.has(step.id)) throw new MithrilError("COMPOSITION_INVALID", `duplicate step id "${step.id}".`);
    if (!known(step.tool)) {
      throw new MithrilError("COMPOSITION_INVALID", `step "${step.id}" calls "${step.tool}", which is not a tool this agent has.`);
    }
    for (const [key, ref] of Object.entries(step.args)) {
      if ("from" in ref && ref.from === "step" && !seen.has(ref.id)) {
        throw new MithrilError(
          "COMPOSITION_INVALID",
          `step "${step.id}" argument "${key}" references step "${ref.id}", which does not run before it.`,
        );
      }
    }
    seen.add(step.id);
  }
  const ret = comp.returns;
  if (ret !== undefined && "from" in ret && ret.from === "step" && !seen.has(ret.id)) {
    throw new MithrilError("COMPOSITION_INVALID", `returns references step "${ret.id}", which does not exist.`);
  }
}

/**
 * Whether a composition must inherit an approval gate from the tools it calls.
 *
 * @param comp - the composition.
 * @param needsApproval - a lookup for a referenced tool's `needsApproval`.
 * @returns `true` when any referenced tool is gated.
 *
 * @remarks
 * Without this, composition is an approval-laundering machine: wrap `deploy` in `do_the_thing` and the gate
 * evaporates. A *predicate* counts as gated — it may return `true` for some input, and the conservative
 * reading is the only safe one.
 */
export function inheritsApproval(comp: ToolComposition, needsApproval: (name: string) => boolean | ((...a: never[]) => unknown) | undefined): boolean {
  return comp.steps.some((s) => {
    const na = needsApproval(s.tool);
    return na === true || typeof na === "function";
  });
}

/** Build the `execute` of a composed tool. */
export function composedExecute(
  def: ToolDefinition,
  comp: ToolComposition,
): (input: JsonValue, ctx: RunContext<unknown>) => AsyncGenerator<ToolProgress, JsonValue> {
  return async function* execute(input, ctx) {
    const outputs: Record<string, JsonValue> = {};
    for (const step of comp.steps) {
      const sub: AnyTool<unknown> | undefined = ctx.tools.get(step.tool);
      if (sub === undefined) {
        // Reachable when a referenced tool was revoked after this composition was defined.
        throw new MithrilError("COMPOSITION_UNRESOLVED", `"${def.name}" calls "${step.tool}", which is no longer registered.`);
      }
      const args: Record<string, JsonValue> = {};
      for (const [key, ref] of Object.entries(step.args)) {
        const v = resolveRef(ref, input, outputs);
        if (v !== undefined) args[key] = v;
      }
      const parsed = await sub.inputSchema["~standard"].validate(args);
      if (parsed.issues !== undefined) {
        throw new MithrilError(
          "INVALID_TOOL_INPUT",
          `"${def.name}" step "${step.id}" built invalid input for "${step.tool}": ${parsed.issues.map((i) => i.message).join("; ")}`,
        );
      }
      // Journaled per step so a mid-composition suspension (a sub-tool calling ctx.suspend) does not re-run
      // the steps that already succeeded. Passing the SAME ctx through is what gives composed tools HITL and
      // cancellation for free.
      const out = await ctx.journal(`compose.${def.name}.${step.id}`, async () => {
        const ret: unknown = sub.execute(parsed.value as never, ctx);
        return (await ret) as JsonValue;
      });
      outputs[step.id] = out;
      yield { payload: { step: step.id, tool: step.tool, input: args, output: out } };
    }
    const last = comp.steps[comp.steps.length - 1];
    const ret = comp.returns ?? { from: "step" as const, id: last?.id ?? "" };
    return resolveRef(ret, input, outputs) ?? null;
  };
}
