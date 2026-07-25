import type { AnyTool, ToolDefinition, ToolProvenance, ToolRegistry, ToolSummary } from "../protocol/index.ts";
import { MithrilError } from "./registry.ts";

// The runtime half of §3.3b — see `protocol/tool-registry.ts` for the contract and the reasoning. Lives in
// `agent/` rather than `protocol/` only because its rejections are `MithrilError`s, keeping one error
// surface for anyone catching around `ctx.tools.register()`.

interface Entry<Deps> {
  readonly tool: AnyTool<Deps>;
  readonly provenance: ToolProvenance;
  readonly definition?: ToolDefinition;
}

function describe(p: ToolProvenance): string {
  switch (p.kind) {
    case "static":
      return "a statically declared tool";
    case "plugin":
      return `a tool from plugin "${p.plugin}"`;
    case "setup":
      return `a tool registered by plugin "${p.plugin}"`;
    case "runtime":
      return `a tool defined at runtime by "${p.by}"`;
  }
}

/**
 * Build a fresh {@link ToolRegistry} seeded with an agent's statically declared tools.
 *
 * @typeParam Deps - the dependency bag the registered tools require.
 * @param seed - the tools present from step 0 (`AgentConfig.tools` plus plugins' static `tools`).
 * @returns a live registry, for exactly one run.
 *
 * @remarks
 * One registry per run, never shared: a registry outliving a run would break run isolation and make
 * `replay(log)` non-reproducible.
 *
 * Seed entries get `static` provenance and are **not revocable**. Collisions within the seed itself are
 * rejected too — two tools with the same name is an agent-configuration bug, and silently keeping one
 * would make which capability the agent has depend on array order.
 *
 * @example
 * ```ts
 * import { toolRegistry } from "@mithril/core/agent";
 *
 * const registry = toolRegistry([getWeather, sendEmail]);
 * registry.list().length; // 2
 * ```
 */
export function toolRegistry<Deps>(seed: readonly AnyTool<Deps>[]): ToolRegistry<Deps> {
  const entries = new Map<string, Entry<Deps>>();
  let revision = 0;

  const registry: ToolRegistry<Deps> = {
    list: () => [...entries.values()].map((e) => e.tool),
    summaries: () =>
      [...entries.values()].map((e): ToolSummary => {
        const { name, description, version } = e.tool;
        return {
          name,
          description,
          ...(version !== undefined ? { version } : {}),
          provenance: e.provenance,
          ...(e.definition !== undefined ? { definition: e.definition } : {}),
        };
      }),
    get: (name) => entries.get(name)?.tool,
    has: (name) => entries.has(name),
    register(tool, provenance, definition) {
      const existing = entries.get(tool.name);
      if (existing !== undefined) {
        // Idempotent by digest: this is what makes replay, resume rehydration, and Tier-2 re-entry (where
        // the same execute() runs again after a suspension) safe to repeat.
        if (definition !== undefined && existing.definition?.digest === definition.digest) return;
        throw new MithrilError(
          "TOOL_NAME_TAKEN",
          `cannot register "${tool.name}": the name is already held by ${describe(existing.provenance)}. ` +
            `Names are never shadowed — revoke the existing tool first, or choose another name.`,
        );
      }
      entries.set(tool.name, { tool, provenance, ...(definition !== undefined ? { definition } : {}) });
      revision++;
    },
    revoke(name) {
      const existing = entries.get(name);
      if (existing === undefined) return false;
      if (existing.provenance.kind === "static" || existing.provenance.kind === "plugin") {
        throw new MithrilError(
          "TOOL_NOT_REVOCABLE",
          `cannot revoke "${name}": it is ${describe(existing.provenance)}, not a tool this run created.`,
        );
      }
      entries.delete(name);
      revision++;
      return true;
    },
    get revision() {
      return revision;
    },
  };

  for (const t of seed) registry.register(t, { kind: "static" });
  revision = 0; // the seed is the baseline, not a mutation
  return registry;
}
