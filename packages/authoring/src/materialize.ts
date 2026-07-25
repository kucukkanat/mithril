import type { AnyTool, ToolDefinition } from "@mithril/core/protocol";
import { fromJsonSchema } from "@mithril/core/protocol";
import { MithrilError } from "@mithril/core/agent";
import { composedExecute, isComposition, type ToolComposition } from "./compose.ts";

// The SINGLE ToolDefinition → AnyTool path. `define_tool`, resume rehydration and (later) store hydration
// all come through here, so a tool built at definition time and the same tool rebuilt after a resume cannot
// diverge — a divergence would be invisible until the rebuilt tool behaved differently.

/** Optional hooks for body kinds beyond Tier-1 composition (Tier-2 scripts register through this). */
export interface Materializers {
  readonly [kind: string]: ((def: ToolDefinition) => AnyTool<unknown>) | undefined;
}

/**
 * Rebuild a callable tool from its replayable definition.
 *
 * @param def - the definition.
 * @param extra - materializers for additional `body.kind`s.
 * @returns the tool, ready to register.
 * @throws {@link MithrilError} `UNKNOWN_TOOL_BODY` when nothing can interpret the body.
 *
 * @remarks
 * `needsApproval` is read off the definition rather than recomputed, so an inherited gate (see
 * `inheritsApproval`) survives a resume — the alternative would quietly ungate a composed tool the moment
 * a run was suspended and continued.
 */
export function materialize(def: ToolDefinition, extra: Materializers = {}): AnyTool<unknown> {
  const body = def.body;
  if (isComposition(body)) return composedTool(def, body);
  const kind = body !== null && typeof body === "object" && !Array.isArray(body) ? (body as { kind?: unknown }).kind : undefined;
  const custom = typeof kind === "string" ? extra[kind] : undefined;
  if (custom !== undefined) return custom(def);
  throw new MithrilError(
    "UNKNOWN_TOOL_BODY",
    `tool "${def.name}" has a body of kind ${JSON.stringify(kind)}, which nothing in this agent can build. ` +
      `Composition bodies work everywhere; a script body needs the authoring plugin configured with a CodeRunner.`,
  );
}

function composedTool(def: ToolDefinition, comp: ToolComposition): AnyTool<unknown> {
  return {
    name: def.name,
    description: def.description,
    ...(def.version !== undefined ? { version: def.version } : {}),
    ...(def.examples !== undefined ? { examples: def.examples } : {}),
    inputSchema: fromJsonSchema(def.inputSchema, { onUnsupported: "ignore" }),
    ...(def.outputSchema !== undefined ? { outputSchema: fromJsonSchema(def.outputSchema, { onUnsupported: "ignore" }) } : {}),
    ...(def.needsApproval !== undefined ? { needsApproval: def.needsApproval } : {}),
    ...(def.timeoutMs !== undefined ? { timeoutMs: def.timeoutMs } : {}),
    execute: composedExecute(def, comp) as AnyTool<unknown>["execute"],
  };
}
