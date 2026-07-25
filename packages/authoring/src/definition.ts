import type { JsonSchema, JsonValue, StandardSchemaV1, ToolDefinition, UndigestedToolDefinition } from "@mithril/core/protocol";
import { fromJsonSchema, withDigest, withJsonSchema } from "@mithril/core/protocol";
import { MithrilError } from "@mithril/core/agent";

// Validation and construction of a tool definition from what a model emitted. Everything here runs at
// DEFINE time so a malformed definition becomes an actionable tool error the model can read and retry
// against — never a mystery failure at call time.

/** Wire-name rule for an authored tool: lowercase, snake-ish, and short enough to stay readable. */
export const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

/** Names the authoring plugin owns; an authored tool may never take one. */
export const RESERVED_NAMES: ReadonlySet<string> = new Set(["define_tool", "list_tools", "revoke_tool"]);

/** The arguments `define_tool` accepts — the shape a model fills in. */
export interface DefineToolInput {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly outputSchema?: JsonSchema;
  readonly examples?: readonly JsonValue[];
  readonly needsApproval?: boolean;
  readonly body: JsonValue;
}

// Hand-written rather than pulled from a validator: core ships zero runtime dependencies, and this is the
// established idiom (see `taskSchema` in core's factory, `passthroughSchema` in @mithril/mcp). The attached
// JSON Schema is what the model actually sees, so it doubles as the format specification.
const DEFINE_TOOL_JSON_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Wire name: lowercase letters, digits and underscores, e.g. weather_in_f." },
    description: { type: "string", description: "What the tool does, written for whoever calls it next." },
    inputSchema: { type: "object", description: "JSON Schema for the tool's arguments." },
    outputSchema: { type: "object", description: "Optional JSON Schema the tool's result must satisfy." },
    needsApproval: { type: "boolean", description: "Require human approval before each call of the new tool." },
    body: {
      type: "object",
      description:
        'How the tool works. Composition (preferred): {"kind":"composition","steps":[{"id":"s1","tool":"<existing tool>",' +
        '"args":{"<arg>":{"from":"input","path":"<field>"}}}]}. An arg value is {"from":"input","path":…}, ' +
        '{"from":"step","id":"<earlier step id>","path":…}, or {"value":<literal>}.',
    },
  },
  required: ["name", "description", "inputSchema", "body"],
};

/** The Standard Schema for `define_tool`'s input, self-describing so the model sees the real shape. */
export function defineToolSchema(): StandardSchemaV1<unknown, DefineToolInput> {
  const validate = (v: unknown): StandardSchemaV1.Result<DefineToolInput> => {
    const issues: StandardSchemaV1.Issue[] = [];
    if (v === null || typeof v !== "object" || Array.isArray(v)) return { issues: [{ message: "expected an object" }] };
    const o = v as Record<string, unknown>;
    if (typeof o["name"] !== "string") issues.push({ message: "name: expected a string", path: [{ key: "name" }] });
    if (typeof o["description"] !== "string") issues.push({ message: "description: expected a string", path: [{ key: "description" }] });
    if (o["inputSchema"] === null || typeof o["inputSchema"] !== "object") {
      issues.push({ message: "inputSchema: expected a JSON Schema object", path: [{ key: "inputSchema" }] });
    }
    if (o["body"] === undefined) issues.push({ message: "body: required", path: [{ key: "body" }] });
    return issues.length > 0 ? { issues } : { value: v as DefineToolInput };
  };
  return withJsonSchema<unknown, DefineToolInput>({ "~standard": { version: 1, vendor: "mithril-authoring", validate } }, DEFINE_TOOL_JSON_SCHEMA);
}

/**
 * Turn `define_tool` arguments into a validated {@link ToolDefinition}.
 *
 * @param input - the model-supplied definition.
 * @param ctx - `has` reports whether a name is already registered; `maxTools`/`current` enforce the cap.
 * @returns the definition, with its digest attached.
 * @throws {@link MithrilError} `INVALID_TOOL_DEFINITION` with a message written for the model to act on.
 */
export function buildDefinition(
  input: DefineToolInput,
  ctx: { readonly has: (name: string) => boolean; readonly maxTools: number; readonly current: number },
): ToolDefinition {
  const reject = (message: string): never => {
    throw new MithrilError("INVALID_TOOL_DEFINITION", message);
  };
  if (!TOOL_NAME_PATTERN.test(input.name)) {
    reject(`"${input.name}" is not a valid tool name: use lowercase letters, digits and underscores, starting with a letter.`);
  }
  if (RESERVED_NAMES.has(input.name)) reject(`"${input.name}" is reserved by the tool-authoring plugin; choose another name.`);
  if (ctx.has(input.name)) reject(`a tool named "${input.name}" already exists; revoke it first or choose another name.`);
  if (ctx.current >= ctx.maxTools) {
    // Every tool costs tokens on every step, forever — an unbounded registry silently doubles the cost of a
    // run. Revoking is the way forward, so say so.
    reject(`this run already has ${ctx.current} authored tools (the limit is ${ctx.maxTools}); revoke one before defining another.`);
  }
  // Compiling here is the point: an unusable schema is rejected while the model can still fix it.
  try {
    fromJsonSchema(input.inputSchema);
  } catch (e) {
    reject(`inputSchema is not usable: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (input.outputSchema !== undefined) {
    try {
      fromJsonSchema(input.outputSchema);
    } catch (e) {
      reject(`outputSchema is not usable: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const undigested: UndigestedToolDefinition = {
    name: input.name,
    description: input.description,
    inputSchema: input.inputSchema,
    ...(input.outputSchema !== undefined ? { outputSchema: input.outputSchema } : {}),
    ...(input.examples !== undefined ? { examples: input.examples } : {}),
    ...(input.needsApproval !== undefined ? { needsApproval: input.needsApproval } : {}),
    body: input.body,
  };
  return withDigest(undigested);
}
