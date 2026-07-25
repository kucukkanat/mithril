import type { CodeRunner } from "@mithril/sandbox";
import type { AnyTool, JsonValue, RunContext, ToolDefinition, ToolProgress } from "@mithril/core/protocol";
import { fromJsonSchema } from "@mithril/core/protocol";
import { MithrilError } from "@mithril/core/agent";

// Tier 2 — a free function body, executed through the CodeRunner seam.
//
// Two properties make this defensible rather than reckless:
//
//   1. The ambient world is CLOSED by default: the body sees `input` and `console`, nothing else. No
//      `fetch` means no exfiltration channel — a mechanical property, not a policy. An operator widens it
//      explicitly via `globals`.
//   2. Running code locally requires an explicit `allowLocalRunner: true`, because every local backend is
//      "isolation, not security". A config field you cannot set by accident is the gate.
//
// This module never transpiles. sucrase is a runtime dependency and lives in @mithril/runner-web; pulling it
// in here would break the zero-dependency posture of every package that isn't the playground. TypeScript
// bodies therefore need an injected `transpile`, and `language` defaults to "js" so most authored tools need
// no transpiler at all.

/** A free JavaScript/TypeScript function body, executed through a {@link CodeRunner}. */
export interface ToolScript {
  readonly kind: "script";
  /** Defaults to `"js"`; `"ts"` requires {@link ScriptOptions.transpile}. */
  readonly language?: "js" | "ts";
  /** The body of an async function: reads the ambient `input`, and must `return` a JSON-safe value. */
  readonly source: string;
  readonly timeoutMs?: number;
}

/** Configuration for Tier-2 script bodies. */
export interface ScriptOptions {
  /** Where scripts execute. `remoteRunner` for untrusted code; a local runner needs `allowLocalRunner`. */
  readonly runner: CodeRunner;
  /**
   * Required to accept `language: "ts"`, e.g.
   * `(src) => sucrase.transform(src, { transforms: ["typescript"] }).code`.
   */
  readonly transpile?: (source: string) => string;
  /** Budget for one script, when the definition names none (default 1000ms). */
  readonly defaultTimeoutMs?: number;
  /**
   * Extra globals the body may read, derived per call.
   *
   * @remarks
   * The default world has no network. Adding `fetch` here re-opens the exfiltration channel that closed
   * world exists to remove — scope it (an allowlisted wrapper), don't hand over the global. Values cross a
   * serialization boundary, so they must be data, not functions.
   */
  readonly globals?: (ctx: RunContext<unknown>) => Readonly<Record<string, unknown>>;
  /**
   * Acknowledge that a non-`"remote"` runner is **isolation, not security**.
   *
   * @remarks Required for any runner whose `isolation` is not `"remote"`. Both local backends give a clean
   * scope, not a defence against hostile code; this flag makes accepting that a deliberate, visible choice.
   */
  readonly allowLocalRunner?: boolean;
}

/** Narrow an opaque definition `body` to a {@link ToolScript}. */
export function isScript(body: JsonValue): body is ToolScript & JsonValue {
  return body !== null && typeof body === "object" && !Array.isArray(body) && (body as { kind?: unknown }).kind === "script";
}

// A tool result must survive the event log and the message history, so anything not JSON-safe is an error
// the model can see rather than a value that silently mutates in transit.
function jsonSafe(value: unknown, name: string): JsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as JsonValue;
  } catch {
    throw new MithrilError("INVALID_TOOL_OUTPUT", `script tool "${name}" returned a value that is not JSON-safe.`);
  }
}

/**
 * Build the `body.kind: "script"` materializer.
 *
 * @param opts - see {@link ScriptOptions}.
 * @returns a materializer to pass to {@link toolAuthoring} via `materializers`.
 * @throws {@link MithrilError} `UNSAFE_RUNNER` when a local runner is supplied without `allowLocalRunner`.
 *
 * @remarks Prefer `toolAuthoring({ script: … })`, which wires this up for you.
 */
export function scriptMaterializer(opts: ScriptOptions): (def: ToolDefinition) => AnyTool<unknown> {
  if (opts.runner.isolation !== "remote" && opts.allowLocalRunner !== true) {
    throw new MithrilError(
      "UNSAFE_RUNNER",
      "this CodeRunner executes code in the host process (isolation: \"scope\"), which is not a security " +
        "boundary against hostile code. Use remoteRunner for untrusted code, or pass allowLocalRunner: true " +
        "to accept that trade-off deliberately.",
    );
  }
  return (def) => {
    if (!isScript(def.body)) {
      throw new MithrilError("UNKNOWN_TOOL_BODY", `tool "${def.name}" does not have a script body.`);
    }
    const script = def.body;
    if ((script.language ?? "js") === "ts" && opts.transpile === undefined) {
      throw new MithrilError(
        "NO_TRANSPILER",
        `tool "${def.name}" has a TypeScript body but no transpile function is configured. Pass ` +
          `toolAuthoring({ script: { transpile: (src) => sucrase.transform(src, { transforms: ["typescript"] }).code } }), ` +
          `or emit plain JavaScript.`,
      );
    }
    return {
      name: def.name,
      description: def.description,
      ...(def.version !== undefined ? { version: def.version } : {}),
      ...(def.examples !== undefined ? { examples: def.examples } : {}),
      inputSchema: fromJsonSchema(def.inputSchema, { onUnsupported: "ignore" }),
      ...(def.outputSchema !== undefined ? { outputSchema: fromJsonSchema(def.outputSchema, { onUnsupported: "ignore" }) } : {}),
      ...(def.needsApproval !== undefined ? { needsApproval: def.needsApproval } : {}),
      ...(def.timeoutMs !== undefined ? { timeoutMs: def.timeoutMs } : {}),
      execute: scriptExecute(def, script, opts) as AnyTool<unknown>["execute"],
    };
  };
}

function scriptExecute(
  def: ToolDefinition,
  script: ToolScript,
  opts: ScriptOptions,
): (input: JsonValue, ctx: RunContext<unknown>) => AsyncGenerator<ToolProgress, JsonValue> {
  const body = (script.language ?? "js") === "ts" && opts.transpile !== undefined ? opts.transpile(script.source) : script.source;
  // The async-IIFE wrapper is what makes a bare `return` in the body work, and yields a promise every
  // backend already knows how to await.
  const code = `(async () => {\n${body}\n})()`;
  return async function* execute(input, ctx) {
    const globals = { input, ...(opts.globals?.(ctx) ?? {}) };
    const res = await opts.runner.run(code, {
      timeoutMs: script.timeoutMs ?? opts.defaultTimeoutMs ?? 1000,
      globals,
    });
    // Logs are observability, not output — surfaced as progress so they show up in devtools without
    // inventing an event type.
    if (res.logs.length > 0) yield { payload: { logs: [...res.logs] } };
    if (!res.ok) throw new MithrilError("SCRIPT_ERROR", `script tool "${def.name}" failed: ${res.error}`);
    return jsonSafe(res.value, def.name);
  };
}
