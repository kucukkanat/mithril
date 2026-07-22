import type { JsonValue, SerializedError } from "./primitives.ts";

// §3.1b — the tool-failure taxonomy. A ToolScan-style set of canonical classes, carried on
// SerializedError.data so the loop can route repair, targeted re-ask prompts, and eval buckets off a
// stable machine-readable class rather than parsing message text. Pure: types + total functions only.

/**
 * The canonical classes of tool-call failure — a ToolScan-style taxonomy.
 *
 * @remarks
 * Attached to a tool-related {@link SerializedError} via its `data` field (see {@link classifiedError})
 * so self-correction can route by class: `malformed_json`/`invalid_args` are deterministically
 * repairable and worth re-asking; `handler_error` usually is not. Also the bucketing key for eval
 * metrics (repair-success-rate per class).
 */
export type ToolErrorClass =
  | "unknown_tool" // the model named a tool that does not exist
  | "malformed_json" // the tool-call arguments could not be parsed as JSON
  | "invalid_args" // arguments parsed but failed the tool's input schema
  | "invalid_output" // the tool's output failed its declared output schema
  | "handler_error" // the tool's execute() threw
  | "timeout"; // the tool exceeded its time budget

/**
 * Read the {@link ToolErrorClass} attached to a {@link SerializedError}, if any.
 *
 * @param err - a serialized error, typically from a `tool.error` event.
 * @returns the attached class, or `undefined` when the error carries none.
 */
export function toolErrorClass(err: SerializedError): ToolErrorClass | undefined {
  const data = err.data;
  if (data !== null && typeof data === "object" && !Array.isArray(data) && "class" in data) {
    const c = (data as { readonly class?: unknown }).class;
    return typeof c === "string" ? (c as ToolErrorClass) : undefined;
  }
  return undefined;
}

/**
 * Build a classified {@link SerializedError} for a tool failure.
 *
 * @param name - the error `name` (e.g. the originating error's name, or `"UnknownTool"`).
 * @param message - a human- and model-readable message.
 * @param cls - the {@link ToolErrorClass} to attach under `data.class`.
 * @param opts - optional `retryable` flag and originating `code` (carried under `data.code`).
 * @returns a JSON-safe `SerializedError` discriminable by {@link toolErrorClass}.
 */
export function classifiedError(
  name: string,
  message: string,
  cls: ToolErrorClass,
  opts?: { readonly retryable?: boolean; readonly code?: string },
): SerializedError {
  const data: JsonValue = opts?.code !== undefined ? { class: cls, code: opts.code } : { class: cls };
  return {
    name,
    message,
    ...(opts?.retryable !== undefined ? { retryable: opts.retryable } : {}),
    data,
  };
}
