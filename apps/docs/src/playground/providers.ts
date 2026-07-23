/*
 * The example assembler behind the playground's Run against bar. The provider + local-model
 * CATALOG lives in @mithril/runner-web (shared with the Studio, so the lists never drift) and is
 * re-exported here; this module keeps the docs-only part — assembling a preset's provider-agnostic
 * parts into a complete runnable example for a chosen target.
 *
 * Accuracy first: every assembled example is REAL, portable @mithril/* code. The only thing the
 * playground adds is the API key, injected into the worker as `process.env.<PROVIDER>_API_KEY` —
 * exactly how BYOK resolves on Node/Bun (see `resolveTransport`). So live examples omit `transport`
 * and let that environment fallback supply the key; nothing here is playground magic. Picking a
 * provider re-assembles the current example (same body, only the model line changes) — see
 * `assembleExample`, which is what removes the need for separate "live" / "local" examples.
 */

import { localModel, type LiveProvider, type LiveProviderId } from "@mithril/runner-web";

export {
  DEFAULT_LOCAL_MODEL,
  LIVE_PROVIDERS,
  liveProvider,
  LOCAL_MODELS,
  localModel,
  type LiveProvider,
  type LiveProviderId,
  type LocalModel,
  type ProviderMode,
} from "@mithril/runner-web";

interface NativeParts {
  readonly imp: string;
  readonly expr: string;
}

function nativeParts(id: LiveProviderId, model: string): NativeParts {
  const m = JSON.stringify(model);
  switch (id) {
    case "openai":
      return { imp: `import { openai } from "mithril/openai";`, expr: `openai(${m})` };
    case "anthropic":
      return { imp: `import { anthropic } from "mithril/anthropic";`, expr: `anthropic(${m})` };
    case "google":
      return { imp: `import { google } from "@mithril/providers/google";`, expr: `google(${m})` };
    case "groq":
      // openai-compat — handled by modelBlock's openai-compat branch, so nativeParts never sees it.
      return { imp: `import { openai } from "mithril/openai";`, expr: `openai(${m})` };
  }
}

/** What to run an example against: the offline scripted double, a remote provider, or a local model. */
export type Target =
  | { readonly kind: "scripted" }
  | { readonly kind: "live"; readonly provider: LiveProvider; readonly model: string }
  | { readonly kind: "local"; readonly model: string };

/**
 * The provider-agnostic parts of an example. The model is NOT here — {@link assembleExample} slots in the
 * chosen provider's model line, so the same tools/agent/run body runs against any {@link Target}.
 */
export interface ExampleParts {
  /** Imports the body needs — `agent`/`tool` from `mithril`, `z` from `zod`, etc. (no provider import). */
  readonly bodyImports: string;
  /** The turns array literal passed to `scriptedProvider(...)` — the deterministic offline default. */
  readonly scriptedTurns: string;
  /** Everything after the model declaration: tools, `agent({ model, … })`, and the `run(…)` call. */
  readonly body: string;
}

/** The provider import + `const model = …` block for a target — the only part that varies by provider. */
function modelBlock(target: Target, scriptedTurns: string): { readonly imp: string; readonly decl: string } {
  if (target.kind === "scripted") {
    return {
      imp: `import { scriptedProvider, testModel } from "@mithril/core/testkit";`,
      decl: `// Offline default: the scripted provider replays these turns (zero network). Pick a real provider
// or a local model in the Run against bar to run this exact example against it instead.
const model = testModel(scriptedProvider(${scriptedTurns}));`,
    };
  }
  if (target.kind === "local") {
    const dtype = localModel(target.model)?.dtype;
    const opts = dtype === undefined ? "" : `, { dtype: ${JSON.stringify(dtype)} }`;
    const note = dtype === undefined ? "" : `\n// Pinned to dtype "${dtype}" — the default q4f16 is numerically unstable for this model on WebGPU.`;
    return {
      imp: `import { transformers } from "mithril/transformers";`,
      decl: `// Runs on-device in your browser tab (WebGPU → WASM). No key, no network after the one-time download.${note}
const model = transformers(${JSON.stringify(target.model)}${opts});`,
    };
  }
  const p = target.provider;
  if (p.kind === "openai-compat") {
    return {
      imp: `import { openaiProvider } from "mithril/openai";`,
      decl: `// ${p.label} speaks the OpenAI wire format; ${p.envVar} (set in the Run against bar) is injected as process.env.
const ${p.id} = openaiProvider({ baseUrl: ${JSON.stringify(p.baseUrl)} });
const model = { id: ${JSON.stringify(`${p.id}/${target.model}`)}, provider: ${p.id} };`,
    };
  }
  const { imp, expr } = nativeParts(p.id, target.model);
  return {
    imp,
    decl: `// ${p.envVar} (set in the Run against bar) is injected as process.env — omit \`transport\`, BYOK resolves from env.
const model = ${expr};`,
  };
}

/**
 * Assemble a complete, runnable example for a {@link Target}: the body's imports, the provider-specific
 * model block, then the shared body. Switching provider re-runs this with a new target — the tools, agent,
 * and prompt stay identical; only the model line changes.
 */
export function assembleExample(parts: ExampleParts, target: Target): string {
  const { imp, decl } = modelBlock(target, parts.scriptedTurns);
  return `${parts.bodyImports}\n${imp}\n\n${decl}\n\n${parts.body}\n`;
}
