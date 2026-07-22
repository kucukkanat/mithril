import type { JsonValue } from "./primitives.ts";

// §10.6 — best-effort JSON repair for small-model output. Pure and deterministic. The single measured
// highest-leverage reliability lift for tiny models is a lenient parse layer: fix the common syntactic
// slips (code fences, trailing commas, unterminated strings/brackets) instead of discarding the call. It
// is lossless for already-valid JSON — it only ever turns unparseable text into parseable, never rewrites
// a valid value — so it is safe to run before schema validation.

/**
 * Best-effort repair of not-quite-JSON text into a {@link JsonValue}.
 *
 * @param s - raw text, e.g. a small model's tool-call arguments.
 * @returns the parsed value, or `undefined` when even the repaired text will not parse.
 * @remarks Strips a leading/trailing markdown code fence, removes trailing commas, and closes any
 * unterminated string/object/array, then parses. Already-valid JSON parses on the fast path unchanged.
 */
export function repairJson(s: string): JsonValue | undefined {
  const stripped = s
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  if (stripped === "") return undefined;
  const direct = tryParse(stripped);
  if (direct !== undefined) return direct;
  const closed = closeOpen(stripped.replace(/,\s*([}\]])/g, "$1"));
  return tryParse(closed);
}

function tryParse(s: string): JsonValue | undefined {
  try {
    return JSON.parse(s) as JsonValue;
  } catch {
    return undefined;
  }
}

// Close any strings/objects/arrays the text left open, and drop a dangling trailing comma. Mirrors the
// structured-output partial-JSON closer, applied here to whole tool-call payloads.
function closeOpen(s: string): string {
  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = inStr ? `${s}"` : s;
  out = out.replace(/,\s*$/, "");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  return out;
}
