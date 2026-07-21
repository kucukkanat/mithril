// Type-level fixture: proves the inference fixes from the validation rounds actually COMPILE (the agents
// could only reason about these by hand). tsc checks this file; it has no runtime assertions.

import type {
  AnyTool,
  EventOf,
  MithrilEvent,
  StandardSchemaV1,
  ToolInputOf,
  ToolOutputOf,
} from "../protocol/index.ts";
import { narrow } from "../protocol/index.ts";
import { tool } from "../agent/index.ts";

// Minimal typed Standard Schema value — carries the Output type for InferOutput; validate is a stub.
function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "fixture", validate: (v) => ({ value: v as T }) } };
}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Extends<A, B> = A extends B ? true : false;
type Expect<_T extends true> = true;

// (T2) `Out` INFERS from execute's return — a non-string tool must NOT collapse to `string`.
const search = tool({
  name: "search",
  description: "search the web",
  inputSchema: schema<{ query: string }>(),
  execute: async ({ query }) => ({ hits: [query] }),
});
type _OutInfers = Expect<Equal<ToolOutputOf<typeof search>, { hits: string[] }>>;
type _InInfers = Expect<Equal<ToolInputOf<typeof search>, { query: string }>>;

// Default Out = string when execute returns a string.
const echo = tool({
  name: "echo",
  description: "echo",
  inputSchema: schema<{ text: string }>(),
  execute: async ({ text }) => text,
});

// (T1) the structural AnyTool bound accepts REAL tools — this assignment is the whole point.
const tools = [search, echo] as const;
const _bound: readonly AnyTool<unknown>[] = tools;

// (narrow) the type predicate delivers name-correlated narrowing at a call site.
function inspect(e: MithrilEvent): void {
  if (narrow(e, tools)) {
    // e is now EventOf<'tool.call'> & { name: 'search' | 'echo'; input: {query} | {text} }
    type _Name = Expect<Equal<typeof e.name, "search" | "echo">>;
    // e.input intersects EventOf.input (JsonValue), so it's a SUBTYPE of the tool-input union, not
    // bit-identical — the meaningful DX guarantee is that it narrows to one of the tool inputs.
    type _Input = Expect<Extends<typeof e.input, { query: string } | { text: string }>>;
    const _isCall: EventOf<"tool.call"> = e;
    void _isCall;
  }
}

export const __fixture = { search, echo, inspect, _bound };
