/**
 * promptfoo config for the local-model eval suite.
 *
 * Run via the package.json scripts (`bun run eval` / `eval:html`), which invoke
 * `bunx promptfoo eval -c promptfooconfig.ts`. promptfoo loads this `.ts` config, the custom
 * {@link file://./src/provider.ts} harness provider, and the transitive `@mithril/*` source imports
 * through its built-in TypeScript loader.
 *
 * Providers are generated from the shipped catalog ({@link selectedModels}) so the model matrix never
 * drifts. Suites are plain YAML in `suites/`; this config loads each, stamps a `category` var (its
 * display name) onto every test, and passes them inline. That `category` flows through to each
 * `_report/report.json` result (`result.vars.category`), which `src/report.ts` groups by.
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

// ── run configuration (env-driven) ───────────────────────────────────────────────────────────────
const rubricEnabled = ["1", "true", "yes"].includes((process.env["MITHRIL_EVAL_RUBRIC"] ?? "").toLowerCase());
const graderProvider = process.env["MITHRIL_EVAL_GRADER"] ?? "openai:gpt-4o-mini";

const models = selectedModels();
const healingVariants = selectedHealingVariants();

// ── providers: one custom-harness instance per model × healing variant ────────────────────────────
// Self-healing A/B runs each model once per variant. With a single variant (the default `full`) labels
// stay unsuffixed, so a normal run's report is byte-identical to before; with several, a ` · <variant>`
// suffix distinguishes the otherwise-identical model rows.
const suffixHealing = healingVariants.length > 1;

/** Build one custom-harness provider entry for a given model + healing variant. */
function makeProvider(m: (typeof models)[number], v: (typeof healingVariants)[number]) {
  return {
    id: "file://./src/provider.ts",
    label: suffixHealing ? `${m.label} · ${v.name}` : m.label,
    config: { repoId: m.repoId, ...(m.dtype !== undefined ? { dtype: m.dtype } : {}), healingVariant: v.name },
  };
}

const providers = models.flatMap((m) => healingVariants.map((v) => makeProvider(m, v)));

// ── suites: plain YAML in suites/, each stamped with a display category ────────────────────────────
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
  { file: "suites/orchestration.yaml", category: "Orchestration" },
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

// Announce what this run covers (models, suites, healing variants) before promptfoo's own output.
const sizeByRepoId = new Map(LOCAL_MODELS.map((m) => [m.id, m.size] as const));
printRunBanner(models, suites.map((s) => s.category), (repoId) => sizeByRepoId.get(repoId), healingVariants.map((v) => v.name));

export default {
  description: "Mithril on-device local models — tool-calling, instruction-following, structured output, reasoning.",
  // The user turn is passed straight through as the `input` var; the provider builds the agent around it.
  prompts: ["{{input}}"],
  providers,
  tests,
  ...(rubricEnabled ? { defaultTest: { options: { provider: graderProvider } } } : {}),
};
