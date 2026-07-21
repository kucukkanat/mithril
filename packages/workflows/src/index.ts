/**
 * Deterministic, code-first routing over a shared typed state — cheap branching BEFORE (and
 * around) LLM calls. Sits ABOVE core: a step may run an agent, but the routing itself is plain,
 * inspectable code. There is no hidden LLM routing unless you write it.
 *
 * @packageDocumentation
 */

/**
 * What a {@link WorkflowStep} returns: either route to another step (`goto`) or finish (`done`),
 * carrying the (possibly updated) state forward. Build these with {@link goto} / {@link done}.
 */
export type StepResult<S> = { readonly goto: string; readonly state: S } | { readonly done: true; readonly state: S };

/**
 * A single workflow step: a pure-ish function of the current state that decides where to go next.
 * It may be async (e.g. it awaits an agent run) and returns a {@link StepResult}.
 */
export type WorkflowStep<S> = (state: S) => StepResult<S> | Promise<StepResult<S>>;

/** Thrown when a step routes to an unknown name, or the run exceeds `maxSteps` (a cycle guard). */
export class WorkflowError extends Error {}

/** A compiled workflow. Call {@link Workflow.run} with an initial state to execute it. */
export interface Workflow<S> {
  /** Run from the configured `start` step until a step returns `done`. Resolves with the final
   * state and the ordered `path` of visited step names. */
  run(initial: S): Promise<{ readonly state: S; readonly path: readonly string[] }>;
}

/**
 * Define a workflow: a map of named steps plus a `start` step. Each step returns {@link goto} to
 * continue or {@link done} to finish. Routing is deterministic and network-free — the ideal place
 * for branching that shouldn't cost an LLM call.
 *
 * @param steps - named steps; each is a {@link WorkflowStep}.
 * @param opts - `start` (the first step) and optional `maxSteps` (default `100`, a cycle guard).
 * @returns a {@link Workflow} you can `run`.
 * @throws {@link WorkflowError} if a step routes to an unknown name or `maxSteps` is exceeded.
 *
 * @example
 * ```ts
 * import { defineWorkflow, goto, done } from "@mithril/workflows";
 *
 * interface S { amount: number; decision: string }
 *
 * const refund = defineWorkflow<S>(
 *   {
 *     triage: (s) => (s.amount > 100 ? goto("review", s) : goto("approve", s)),
 *     review: async (s) => done({ ...s, decision: await humanReview(s) }),
 *     approve: (s) => done({ ...s, decision: "auto-approved" }),
 *   },
 *   { start: "triage" },
 * );
 *
 * const { state, path } = await refund.run({ amount: 500, decision: "" });
 * ```
 */
export function defineWorkflow<S>(
  steps: Readonly<Record<string, WorkflowStep<S>>>,
  opts: { readonly start: string; readonly maxSteps?: number },
): Workflow<S> {
  const maxSteps = opts.maxSteps ?? 100;
  return {
    async run(initial) {
      let state = initial;
      let cursor: string = opts.start;
      const path: string[] = [];
      for (let i = 0; i < maxSteps; i++) {
        const step = steps[cursor];
        if (step === undefined) throw new WorkflowError(`no step "${cursor}"`);
        path.push(cursor);
        const r = await step(state);
        state = r.state;
        if ("done" in r) return { state, path };
        cursor = r.goto;
      }
      throw new WorkflowError(`workflow exceeded ${maxSteps} steps (cycle?)`);
    },
  };
}

/**
 * Build a {@link StepResult} that routes to another step, carrying `state` forward.
 * @param next - the name of the step to run next.
 */
export function goto<S>(next: string, state: S): StepResult<S> {
  return { goto: next, state };
}

/** Build a {@link StepResult} that finishes the workflow with the given final `state`. */
export function done<S>(state: S): StepResult<S> {
  return { done: true, state };
}
