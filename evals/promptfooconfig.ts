/**
 * promptfoo config for the local-model eval suite. Providers are generated from the shipped catalog
 * (via {@link selectedModels}) so the model matrix never drifts and a subset is one env var away. Each
 * model becomes one instance of the custom {@link file://./src/provider.ts} harness provider.
 *
 * Run via the package.json scripts (`bun run eval` / `eval:html`), which invoke promptfoo. promptfoo
 * loads this `.ts` config, the custom provider, and the transitive `@mithril/*` source-`.ts` imports
 * through its built-in TypeScript loader:
 *   bunx promptfoo eval -c promptfooconfig.ts --output _report/report.html
 *
 * Suites are plain YAML in `suites/` — edit or add one there. This config loads each suite, stamps a
 * `category` var (the suite's display name) onto every test, and passes them as inline tests. That
 * `category` flows through to each `_report/report.json` result (`result.vars.category`), which is what the
 * compact comparison overview in `src/report.ts` groups by (per-model × per-suite pass rate). Suites
 * stay clean YAML — the category lives only here.
 *
 * LLM-rubric grading is opt-in and offline by default: set MITHRIL_EVAL_RUBRIC=1 (and a grader key,
 * default OPENAI_API_KEY) to include the rubric-graded reasoning suite.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { LOCAL_MODELS } from "@mithril/runner-web";
import { selectedModels } from "./src/models.ts";
import { selectedHealingVariants } from "./src/healing.ts";
import { printRunBanner } from "./src/banner.ts";

const rubricEnabled = ["1", "true", "yes"].includes((process.env["MITHRIL_EVAL_RUBRIC"] ?? "").toLowerCase());
const graderProvider = process.env["MITHRIL_EVAL_GRADER"] ?? "openai:gpt-4o-mini";

const selected = selectedModels();
// Self-healing A/B: each model runs once per selected healing variant. With a single variant (the
// default `full`), labels stay unsuffixed so a normal run's report is byte-identical to before; with
// several, a ` · <variant>` suffix distinguishes the otherwise-identical model rows in the report.
const healingVariants = selectedHealingVariants();
const suffixHealing = healingVariants.length > 1;
const providers = selected.flatMap((m) =>
  healingVariants.map((v) => ({
    id: "file://./src/provider.ts",
    label: suffixHealing ? `${m.label} · ${v.name}` : m.label,
    config: { repoId: m.repoId, ...(m.dtype !== undefined ? { dtype: m.dtype } : {}), healingVariant: v.name },
  })),
);

/** One suite file paired with the human-readable category stamped onto its tests (drives the overview). */
interface Suite {
  readonly file: string;
  readonly category: string;
}

const suites: readonly Suite[] = [
  { file: "suites/tool-calling.yaml", category: "Tool calling" },
  { file: "suites/instruction-following.yaml", category: "Instruction following" },
  { file: "suites/structured-output.yaml", category: "Structured output" },
  { file: "suites/reasoning-qa.yaml", category: "Reasoning / QA" },
  ...(rubricEnabled ? [{ file: "suites/reasoning-rubric.yaml", category: "Reasoning (rubric)" }] : []),
];

/** A single promptfoo test as authored in a suite YAML (only the fields we touch are typed). */
interface SuiteTest {
  readonly vars?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

/** Load a suite's YAML and stamp `category` onto every test's vars so results can be grouped by suite. */
function loadSuite({ file, category }: Suite): SuiteTest[] {
  const raw = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
  const tests = YAML.parse(raw) as SuiteTest[];
  return tests.map((test) => ({ ...test, vars: { ...(test.vars ?? {}), category } }));
}

const tests = suites.flatMap(loadSuite);

// Tell the developer up front what this run covers — which models (label/size/dtype/repo id), which
// suites, and which self-healing variants — before promptfoo's own progress output begins.
const sizeByRepoId = new Map(LOCAL_MODELS.map((m) => [m.id, m.size] as const));
printRunBanner(selected, suites.map((s) => s.category), (repoId) => sizeByRepoId.get(repoId), healingVariants.map((v) => v.name));

export default {
  description: "Mithril on-device local models — tool-calling, instruction-following, structured output, reasoning.",
  // The user turn is passed straight through as the `input` var; the provider builds the agent around it.
  prompts: ["{{input}}"],
  providers,
  tests,
  ...(rubricEnabled ? { defaultTest: { options: { provider: graderProvider } } } : {}),
};
