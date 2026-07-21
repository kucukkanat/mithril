import type { EventOf, MithrilEvent } from "./events.ts";
import type { AnyTool, Tool, ToolInputOf } from "./tool.ts";

// §4.1 — opt-in LOCAL typed narrowing (never in the wire union). Recovers the per-tool input type at a
// call site on demand, so tsc pays instantiation cost only where asked. Works on the CONCRETE `const Tools`
// tuple (whose elements are real `Tool<N, In, …>`), not the AnyTool bound.
type ToolNameOf<T> = T extends Tool<infer N, infer _In, infer _O, infer _D> ? N : never;

/**
 * The union of name-correlated `tool.call` shapes for a concrete tool tuple.
 *
 * @typeParam Tools - A `const` tuple of concrete {@link Tool}s (not the {@link AnyTool} bound).
 *
 * @remarks
 * Each member pairs a tool's literal `name` with its precise `input` type, so a
 * `switch` on `name` narrows `input` exactly. Recovers per-tool input types only
 * where used, keeping instantiation cost local. Paired with {@link narrow}.
 */
export type ToolCallFor<Tools extends readonly AnyTool<unknown>[]> = {
  [T in Tools[number] as ToolNameOf<T> & string]: T extends Tool<infer N, infer In, infer _O, infer _D>
    ? { readonly callId: string; readonly name: N; readonly input: In }
    : never;
  // ToolNameOf is distributive (T is a naked param), unlike a bare `Tools[number] extends …` index — that
  // non-distributive form collapsed the narrowed type to `never`.
}[ToolNameOf<Tools[number]> & string];

/**
 * Type-predicate that narrows an event to a `tool.call` for one of `tools`.
 *
 * @param e - Any {@link MithrilEvent}.
 * @param tools - The concrete tool tuple to match against (pass as `const`).
 * @returns `true` when `e` is a `tool.call` whose `name` matches a tool in
 * `tools`, narrowing `e` to {@link EventOf}`<'tool.call'>` intersected with
 * {@link ToolCallFor}`<Tools>` — i.e. `input` typed per the matched tool.
 *
 * @example
 * ```ts
 * if (narrow(e, tools)) {
 *   // e.name and e.input are correlated to the matched tool
 *   switch (e.name) {  }
 * }
 * ```
 */
export function narrow<const Tools extends readonly AnyTool<unknown>[]>(
  e: MithrilEvent,
  tools: Tools,
): e is EventOf<"tool.call"> & ToolCallFor<Tools> {
  if (e.type !== "tool.call") return false;
  return tools.some((t) => t.name === e.name);
}
