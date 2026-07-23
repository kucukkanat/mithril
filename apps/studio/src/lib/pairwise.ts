/*
 * The A/B pairwise-judge script generator (studio glue). Given per-case trajectory pairs, a judge model,
 * and a rubric, emit a worker script that runs `pairwiseJudge` over each pair and streams the verdict via
 * the injected `emit()`. Reuses @mithril/spec's modelExpr / provider-import primitives so the judge model
 * is expressed exactly as project code would express it.
 */
import { GROQ_PROVIDER_DECL, modelExpr, providerImportEntries, providerOf, type ModelSpec } from "@mithril/spec";
import type { Trajectory } from "@mithril/evals";

export interface PairwisePair {
  readonly name: string;
  readonly a: Trajectory;
  readonly b: Trajectory;
}

/** One pairwise verdict streamed back on the data channel. */
export interface PairwiseVerdict {
  readonly kind: "pairwise";
  readonly case: string;
  readonly value: number; // 1 → A wins, 0 → B wins, 0.5 → tie
  readonly rationale?: string;
}

export function pairwiseScript(pairs: readonly PairwisePair[], judge: ModelSpec, rubric: string): string {
  const providers = new Set<string>();
  const p = providerOf(judge);
  if (p !== undefined) providers.add(p);
  const imports = [
    `import { pairwiseJudge } from "@mithril/evals";`,
    ...[...providerImportEntries(providers)].map(([mod, names]) => `import { ${names.join(", ")} } from ${JSON.stringify(mod)};`),
  ];
  const groq = judge.kind === "live" && judge.provider === "groq" ? `${GROQ_PROVIDER_DECL}\n` : "";
  return [
    imports.join("\n"),
    "",
    groq + `const judge = pairwiseJudge({ model: ${modelExpr(judge)}, rubric: ${JSON.stringify(rubric)} });`,
    `const pairs = ${JSON.stringify(pairs)};`,
    `for (const p of pairs) {`,
    `  const s = await judge(p.a, p.b);`,
    `  emit({ kind: "pairwise", case: p.name, value: s.value, rationale: s.rationale });`,
    `}`,
  ].join("\n");
}
