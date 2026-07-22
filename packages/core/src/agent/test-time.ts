import type { JsonValue, Middleware, ModelResult } from "../protocol/index.ts";

// §3.8b — opt-in test-time compute. These are model-altitude middleware you add via an agent's `use` array
// to trade extra sampling for reliability without a bigger model. They are OFF unless you add them — the
// "no magic" line: a default run never spends N× tokens. Each sample re-invokes the provider through the
// middleware chain, so every candidate is streamed and visible; the chosen candidate is what the loop then
// uses. A `custom.*` event is emitted per sample and for the final decision, so the trajectory is inspectable.

// A canonical, order-preserving vote key for a model result: its tool calls (name + args) when it called
// tools, else its trimmed text. Two results with the same key are "the same answer" for voting.
function voteKey(r: ModelResult): string {
  if (r.calls.length > 0) return JSON.stringify(r.calls.map((c) => [c.name, c.input] as const));
  return r.text.trim();
}

/** Options for {@link selfConsistency}. */
export interface SelfConsistencyOptions {
  /** How many samples to draw (N). Keep small (≤5) in-browser: samples run sequentially on one device. */
  readonly n: number;
  /** Stop early once this many samples agree on the same answer. Omit to always draw all `n`. */
  readonly earlyStopAgreement?: number;
}

/**
 * Self-consistency: sample the model `n` times and return the majority answer (Wang et al.).
 *
 * @param opts - the sample count and optional early-stop agreement threshold.
 * @returns a model-altitude {@link Middleware} to pass in an agent's `use` array.
 * @remarks Votes by canonical equality of the result's tool calls (name + validated-shape args) or, for a
 * text answer, its trimmed text — so it needs no answer-extraction heuristics. Emits `custom.selfConsistency`
 * per sample and for the winner. Cost is up to `n`× per model turn; the beats-critique-loops result makes
 * this the right "think harder" primitive, but it is opt-in because of that cost.
 * @example
 * ```ts
 * import { agent } from "@mithril/core/agent";
 * import { selfConsistency } from "@mithril/core/agent";
 *
 * const a = agent({ model, instructions, tools, use: [selfConsistency({ n: 5, earlyStopAgreement: 3 })] });
 * ```
 */
export function selfConsistency(opts: SelfConsistencyOptions): Middleware {
  return {
    name: "selfConsistency",
    async model(ctx, call, next) {
      const samples: ModelResult[] = [];
      const counts = new Map<string, number>();
      for (let i = 0; i < opts.n; i++) {
        const r = await next(call);
        samples.push(r);
        const key = voteKey(r);
        const c = (counts.get(key) ?? 0) + 1;
        counts.set(key, c);
        ctx.emit({ type: "custom.selfConsistency", payload: { sample: i, agree: c } });
        if (opts.earlyStopAgreement !== undefined && c >= opts.earlyStopAgreement) break;
      }
      let winnerKey = "";
      let winnerVotes = -1;
      for (const [key, c] of counts) {
        if (c > winnerVotes) {
          winnerVotes = c;
          winnerKey = key;
        }
      }
      const winner = samples.find((s) => voteKey(s) === winnerKey) ?? (samples[0] as ModelResult);
      ctx.emit({ type: "custom.selfConsistency", payload: { winnerVotes, samples: samples.length } satisfies JsonValue });
      return winner;
    },
  };
}

/** Options for {@link bestOfN}. */
export interface BestOfNOptions {
  /** How many candidates to draw. */
  readonly n: number;
  /** Score a candidate; higher wins. A deterministic verifier (parse/execute success) is the ideal scorer. */
  readonly score: (r: ModelResult) => number | Promise<number>;
  /** Stop early and take the first candidate scoring at least this. Omit to always draw all `n`. */
  readonly threshold?: number;
}

/**
 * Best-of-N: draw `n` candidates and keep the highest-scoring one (the T1 pattern — pair a small generator
 * with a deterministic verifier).
 *
 * @param opts - the candidate count, a `score` function, and an optional early-stop `threshold`.
 * @returns a model-altitude {@link Middleware} to pass in an agent's `use` array.
 * @remarks Prefer a *deterministic* scorer (does the output parse? does a check tool pass?) over asking a
 * small model to judge itself — the research is clear that small-model self-verification is weak. Emits
 * `custom.bestOfN` per candidate. Cost is up to `n`× per model turn; opt-in.
 */
export function bestOfN(opts: BestOfNOptions): Middleware {
  return {
    name: "bestOfN",
    async model(ctx, call, next) {
      let best: ModelResult | undefined;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < opts.n; i++) {
        const r = await next(call);
        const s = await opts.score(r);
        ctx.emit({ type: "custom.bestOfN", payload: { candidate: i, score: s } });
        if (s > bestScore) {
          bestScore = s;
          best = r;
        }
        if (opts.threshold !== undefined && s >= opts.threshold) break;
      }
      return best ?? (await next(call));
    },
  };
}
