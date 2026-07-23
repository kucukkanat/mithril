/**
 * The promptfoo custom provider that runs a prompt through the REAL Mithril agent harness against one
 * on-device Transformers.js model. promptfoo instantiates this once per model (config carries the repo
 * id + dtype from the catalog); each `callApi` builds `agent({ model: transformers(...), tools })`,
 * streams the run, and reports the final text plus the tool calls it observed so assertions can grade
 * both. Everything runs on-device on CPU (onnxruntime-node) — no network, no keys.
 */
import { agent } from "@mithril/core/agent";
import { transformers } from "@mithril/providers/transformers";
import { resolveHealing } from "./healing.ts";
import { outputSchema, outputSchemaConverter } from "./schemas.ts";
import { toolset } from "./tools.ts";

/** Provider config, supplied per-model (× healing variant) by {@link file://../promptfooconfig.ts}. */
interface ProviderConfig {
  readonly repoId: string;
  readonly dtype?: string;
  /** Named self-healing variant to run this model under (see {@link file://./healing.ts}); omitted ⇒ default. */
  readonly healingVariant?: string;
}

/** The subset of promptfoo's assertion/var context this provider reads. */
interface CallContext {
  readonly vars?: Record<string, unknown>;
}

/** One tool call the harness emitted during the run. */
interface ObservedToolCall {
  readonly name: string;
  readonly input: unknown;
}

const DEFAULT_INSTRUCTIONS = "You are a helpful, concise assistant.";

export default class MithrilLocalProvider {
  private readonly config: ProviderConfig;
  private readonly providerId: string;

  constructor(options: { readonly id?: string; readonly config: ProviderConfig }) {
    this.config = options.config;
    this.providerId = options.id ?? `mithril-local:${options.config.repoId}`;
  }

  id(): string {
    return this.providerId;
  }

  async callApi(prompt: string, context?: CallContext): Promise<{
    output: string;
    tokenUsage?: { total: number; prompt: number; completion: number };
    metadata: { toolCalls: ObservedToolCall[]; status: string; structured?: unknown };
    error?: string;
  }> {
    const vars = context?.vars ?? {};
    const { repoId, dtype } = this.config;

    const model = transformers(repoId, { device: "cpu", ...(dtype !== undefined ? { dtype } : {}) });
    const tools = toolset(vars["toolset"]);
    const instructions = typeof vars["instructions"] === "string" ? vars["instructions"] : DEFAULT_INSTRUCTIONS;
    const output = outputSchema(vars["outputSchema"]);

    const a = agent({
      model,
      instructions,
      ...(tools.length > 0 ? { tools } : {}),
      ...(output !== undefined ? { output, outputSchema: outputSchemaConverter } : {}),
      ...resolveHealing(this.config.healingVariant),
    });

    const toolCalls: ObservedToolCall[] = [];
    let text = "";
    try {
      const handle = a.stream(prompt);
      for await (const ev of handle) {
        if (ev.type === "tool.call") toolCalls.push({ name: ev.name, input: ev.input });
        else if (ev.type === "text.delta") text += ev.delta;
      }
      const result = await handle.result();

      if (result.status === "error") {
        return { output: text, metadata: { toolCalls, status: result.status }, error: result.error.message };
      }
      const structured = result.status === "completed" ? result.output : undefined;
      const outStr = structured === undefined ? text : typeof structured === "string" ? structured : JSON.stringify(structured);
      const usage = result.status === "completed" || result.status === "cancelled" ? result.usage : undefined;

      return {
        output: outStr,
        ...(usage !== undefined ? { tokenUsage: { total: usage.input + usage.output, prompt: usage.input, completion: usage.output } } : {}),
        metadata: { toolCalls, status: result.status, ...(structured !== undefined ? { structured } : {}) },
      };
    } catch (err) {
      return {
        output: text,
        metadata: { toolCalls, status: "error" },
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
