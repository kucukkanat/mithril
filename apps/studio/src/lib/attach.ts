/*
 * Pure spec mutations behind the rail's drag-and-drop and the Designer's add/remove.
 *
 * They live here rather than inside the components so the rules that matter — a tool has exactly one
 * owner, the entry agent can never dangle — are testable without rendering anything.
 */
import type { AgentSpec, ProjectSpec, ToolSpec } from "@mithril/spec";
import { stubBody } from "./tool-fields.ts";

/**
 * The dataTransfer type carrying a dragged tool's decl id.
 *
 * The payload rides on the drag event rather than in React state so any drop target can read it —
 * the rail and the agent panel don't share a component tree, and a shared "which id is in flight"
 * store would be a second source of truth for something the browser already carries.
 */
export const TOOL_DRAG_TYPE = "application/x-mithril-tool";

/** Which agent owns a tool, or `null` when no agent can call it. */
export function ownerOf(spec: ProjectSpec, toolId: string): string | null {
  return spec.decls.find((d) => d.kind === "agent" && d.tools.includes(toolId))?.id ?? null;
}

/**
 * Move a tool to `agentId`, or detach it entirely when `agentId` is `null`.
 *
 * A tool has exactly one owner, so this always removes it from every other agent first — dragging is
 * a move, not a copy. Attaching to the agent that already owns it is a no-op rather than a duplicate.
 *
 * @example
 * ```ts
 * attachTool(spec, "weather", "assistant"); // moves it, wherever it was
 * attachTool(spec, "weather", null);        // detaches it
 * ```
 */
export function attachTool(spec: ProjectSpec, toolId: string, agentId: string | null): ProjectSpec {
  const tool = spec.decls.find((d) => d.id === toolId);
  if (tool === undefined || (tool.kind !== "tool" && tool.kind !== "subAgentTool")) return spec;
  if (agentId !== null && !spec.decls.some((d) => d.kind === "agent" && d.id === agentId)) return spec;
  // An asTool wrapper attached to the agent it wraps would call itself.
  if (agentId !== null && tool.kind === "subAgentTool" && tool.agentId === agentId) return spec;

  return {
    ...spec,
    decls: spec.decls.map((d) => {
      if (d.kind !== "agent") return d;
      const without = d.tools.filter((t) => t !== toolId);
      return d.id === agentId ? { ...d, tools: [...without, toolId] } : { ...d, tools: without };
    }),
  };
}

/** `base1`, `base2`, … — the first id not already taken. */
export function freshId(spec: ProjectSpec, base: string): string {
  let i = 1;
  while (spec.decls.some((d) => d.id === `${base}${i}`)) i++;
  return `${base}${i}`;
}

/** A new tool, pre-shaped so the lint has something concrete to complain about. */
export function newTool(spec: ProjectSpec): ToolSpec {
  const id = freshId(spec, "tool");
  return {
    kind: "tool",
    id,
    name: id,
    description: "",
    // No inputs to begin with: seeding a phantom `input` field and an echo body is what taught the
    // `{ input }` parameter pattern that later outlived the schema it was supposed to match.
    inputSchema: { zod: "z.object({})" },
    execute: { code: stubBody([]) },
  };
}

/** A new agent on the on-device model, so it runs with no key. */
export function newAgent(spec: ProjectSpec): AgentSpec {
  return {
    kind: "agent",
    id: freshId(spec, "agent"),
    model: { kind: "local", model: "onnx-community/Qwen3-0.6B-ONNX" },
    instructions: "",
    tools: [],
  };
}

/**
 * Remove a declaration, and repair everything that referenced it.
 *
 * Repairs, in order: drop it from every agent's tool list; drop any asTool wrapper around a deleted
 * agent (it would reference a decl that no longer exists); and re-point the entry if it was the
 * entry, so a project can never be left un-runnable by a delete.
 */
export function removeDecl(spec: ProjectSpec, id: string): ProjectSpec {
  const doomed = new Set([id]);
  const target = spec.decls.find((d) => d.id === id);
  if (target?.kind === "agent") {
    for (const d of spec.decls) if (d.kind === "subAgentTool" && d.agentId === id) doomed.add(d.id);
  }

  const decls = spec.decls
    .filter((d) => !doomed.has(d.id))
    .map((d) => (d.kind === "agent" ? { ...d, tools: d.tools.filter((t) => !doomed.has(t)) } : d));

  const entryGone = doomed.has(spec.entry.target);
  const nextTarget = entryGone ? (decls.find((d) => d.kind === "agent")?.id ?? "") : spec.entry.target;
  return { ...spec, decls, entry: { ...spec.entry, target: nextTarget } };
}

/** Make `agentId` the entry point. A no-op unless it names an agent. */
export function makeEntry(spec: ProjectSpec, agentId: string): ProjectSpec {
  if (!spec.decls.some((d) => d.kind === "agent" && d.id === agentId)) return spec;
  return { ...spec, entry: { ...spec.entry, target: agentId } };
}
