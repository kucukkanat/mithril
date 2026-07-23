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

// §10.6 (cont.) — structured-output extraction. A model's FINAL text often wraps its JSON in more than the
// syntactic slips repairJson fixes: reasoning models prepend a `<think>…</think>` block, and chatty models
// surround the object with prose ("Here is the JSON: { … }. Hope that helps!"). These helpers peel that
// packaging off — for the structured-output path ONLY — before repairJson + schema validation. Reasoning is
// stripped here for PARSING alone; it is never removed from the event stream (text.delta still carries every
// `<think>` token for the UI). Everything below is pure, deterministic, and lossless for already-valid JSON.

// Remove closed reasoning blocks (`<think>…</think>`, `<thinking>…</thinking>`). Non-greedy so multiple
// blocks are each removed; case-insensitive; spans newlines. Unclosed blocks are left untouched (see
// hasUnclosedReasoning, which the streaming path uses to hold back until the block closes).
function stripReasoning(s: string): string {
  return s.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
}

// True while a reasoning block is open but not yet closed — the streaming partial-parse must wait, since any
// `{` inside the still-forming thought is reasoning, not the answer.
function hasUnclosedReasoning(s: string): boolean {
  const opens = s.match(/<think(?:ing)?>/gi)?.length ?? 0;
  const closes = s.match(/<\/think(?:ing)?>/gi)?.length ?? 0;
  return opens > closes;
}

// Index of the first JSON container opener (`{` or `[`), or -1 if neither appears.
function firstOpenerIndex(s: string): number {
  const obj = s.indexOf("{");
  const arr = s.indexOf("[");
  if (obj === -1) return arr;
  if (arr === -1) return obj;
  return Math.min(obj, arr);
}

// The first balanced top-level JSON container substring (string-aware brace matching), so trailing prose
// after the object is dropped. When the container never closes, returns opener-to-end for repairJson to
// close. `undefined` when there is no opener at all.
function firstJsonSpan(s: string): string | undefined {
  const start = firstOpenerIndex(s);
  if (start === -1) return undefined;
  const open = s[start] as "{" | "[";
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return s.slice(start);
}

/**
 * Extract and parse the JSON value from a model's FINAL structured-output text.
 *
 * @param s - the model's complete final text (may include a `<think>…</think>` preamble and/or surrounding prose).
 * @returns the parsed {@link JsonValue}, or `undefined` when no JSON can be recovered.
 * @remarks Strips reasoning blocks and prose, then delegates to {@link repairJson} (code fences, trailing
 * commas, unterminated containers). Structured-output ONLY — it never alters the event stream, so reasoning
 * tokens still reach the UI via `text.delta`. Lossless for already-valid JSON (fast path). See
 * {@link repairPartialJson} for the streaming counterpart.
 */
export function extractJson(s: string): JsonValue | undefined {
  const t = stripReasoning(s);
  const direct = repairJson(t);
  if (direct !== undefined) return direct;
  const span = firstJsonSpan(t);
  return span === undefined ? undefined : repairJson(span);
}

/**
 * Best-effort parse of an IN-PROGRESS structured-output stream into a deep-partial {@link JsonValue}, for
 * `object.delta` streaming.
 *
 * @param s - the structured-output text accumulated so far.
 * @returns the partial value, or `undefined` when nothing parseable has formed yet.
 * @remarks Holds back entirely while a `<think>` block is still open (reasoning is not the answer), then skips
 * any preamble and closes the open strings/objects/arrays formed so far. Reasoning is never removed from the
 * event stream — this only governs the partial value. See {@link extractJson} for the terminal counterpart.
 */
export function repairPartialJson(s: string): JsonValue | undefined {
  if (hasUnclosedReasoning(s)) return undefined;
  const t = stripReasoning(s);
  const start = firstOpenerIndex(t);
  if (start === -1) return undefined;
  return tryParse(closePartial(t.slice(start)));
}

// Close any open string/objects/arrays and fill a dangling `key:` with null, so a mid-stream fragment parses
// into a deep-partial object. Distinct from closeOpen only in the trailing dangling-key handling.
function closePartial(s: string): string {
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
  out = out.replace(/,\s*$/, "").replace(/:\s*$/, ": null");
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i];
  return out;
}
