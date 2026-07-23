import type { JsonValue } from "@mithril/core/protocol";
import { repairJson } from "@mithril/core/protocol";
import type { EngineChunk } from "./core.ts";

// Pure, dependency-free tool-call parsing for local models. Different model families emit tool calls in
// DIFFERENT grammars, so this is a small registry keyed by the sentinel a model uses, plus a streaming state
// machine that suppresses the sentinel from visible text and emits parsed calls. Everything here is testable
// with a fake token stream (no ONNX/WebGPU). Parsing is fail-soft: a malformed call degrades to no call /
// empty args and the run continues as text, never a crash.

/**
 * How one model family delimits + encodes tool calls in generated text.
 *
 * @remarks `start`/`end` are the literal sentinels the state machine watches for (`end: null` ⇒ the call runs
 * to end-of-stream). `extract` turns the raw payload between them into zero-or-more `{ name, input }` calls.
 */
export interface ToolFormat {
  readonly name: string;
  readonly start: string;
  readonly end: string | null;
  extract(payload: string): { readonly name: string; readonly input: JsonValue }[];
}

// Repair + parse a loose JSON fragment (code fences, trailing commas, unterminated strings/brackets);
// return undefined on failure. Delegates to the shared, deterministic repairJson so local tool-call
// parsing and structured-output streaming share one lenient parser.
function safeParse(s: string): JsonValue | undefined {
  return repairJson(s);
}

function asCall(v: JsonValue): { readonly name: string; readonly input: JsonValue } | undefined {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const obj = v as { readonly [k: string]: JsonValue };
  const name = obj["name"];
  if (typeof name !== "string") return undefined;
  return { name, input: obj["arguments"] ?? obj["parameters"] ?? {} };
}

// Hermes-style: <tool_call>{ "name", "arguments" }</tool_call> — object or array of them (Qwen3, Granite, …).
function extractJsonCalls(payload: string): { readonly name: string; readonly input: JsonValue }[] {
  const v = safeParse(payload);
  if (v === undefined) return [];
  const items = Array.isArray(v) ? v : [v];
  const out: { readonly name: string; readonly input: JsonValue }[] = [];
  for (const item of items) {
    const call = asCall(item);
    if (call !== undefined) out.push(call);
  }
  return out;
}

// Qwen3.5 nested-XML: <function=NAME><parameter=KEY>VALUE</parameter>…</function> (inside <tool_call>…).
function extractQwenXml(payload: string): { readonly name: string; readonly input: JsonValue }[] {
  const out: { readonly name: string; readonly input: JsonValue }[] = [];
  const fnRe = /<function=([^>]+)>([\s\S]*?)<\/function>/g;
  for (let fm = fnRe.exec(payload); fm !== null; fm = fnRe.exec(payload)) {
    const name = fm[1]?.trim();
    const body = fm[2] ?? "";
    if (name === undefined || name === "") continue;
    const params: Record<string, JsonValue> = {};
    const pRe = /<parameter=([^>]+)>([\s\S]*?)<\/parameter>/g;
    for (let pm = pRe.exec(body); pm !== null; pm = pRe.exec(body)) {
      const key = pm[1]?.trim();
      const raw = (pm[2] ?? "").trim();
      if (key !== undefined && key !== "") params[key] = safeParse(raw) ?? raw;
    }
    out.push({ name, input: params });
  }
  return out;
}

/** `<tool_call>…</tool_call>` — JSON (Hermes) or, when the payload is nested-XML, Qwen3.5 function syntax. */
export const angleToolCall: ToolFormat = {
  name: "angle-tool_call",
  start: "<tool_call>",
  end: "</tool_call>",
  extract: (payload) => (payload.includes("<function=") ? extractQwenXml(payload) : extractJsonCalls(payload)),
};

/** Gemma 4 native token `<|tool_call|>` (call runs to end-of-turn). Payload parsed as tolerant JSON. */
export const gemmaToolCall: ToolFormat = {
  name: "gemma-tool_call",
  start: "<|tool_call|>",
  end: null,
  extract: (payload) => {
    const first = payload.indexOf("{");
    const last = payload.lastIndexOf("}");
    return first === -1 || last <= first ? [] : extractJsonCalls(payload.slice(first, last + 1));
  },
};

// Split on top-level commas, respecting (), [], {} nesting and "…"/'…' string quotes — so commas inside a
// call's arguments or a quoted value don't split a call/pair. Used for both the call list and each kwarg list.
function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (quote !== null) {
      cur += c;
      if (c === quote && s[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") parts.push(cur);
  return parts;
}

// A single Python literal argument value → JsonValue (quoted string, number, bool, None, else raw/JSON).
function parsePyValue(raw: string): JsonValue {
  const v = raw.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) return v.slice(1, -1);
  if (v === "True" || v === "true") return true;
  if (v === "False" || v === "false") return false;
  if (v === "None" || v === "null") return null;
  if (v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return safeParse(v) ?? v;
}

// Liquid LFM2: <|tool_call_start|>[ name(k=v, …), name2(…) ]<|tool_call_end|> — a Python list of keyword-arg
// calls (parallel calls in one turn), NOT JSON. Fail-soft: a call missing `name(` or `)` is skipped.
function extractLiquidCalls(payload: string): { readonly name: string; readonly input: JsonValue }[] {
  let s = payload.trim();
  if (s.startsWith("[")) s = s.slice(1);
  if (s.endsWith("]")) s = s.slice(0, -1);
  const out: { readonly name: string; readonly input: JsonValue }[] = [];
  for (const raw of splitTopLevel(s)) {
    const call = raw.trim();
    const open = call.indexOf("(");
    if (open <= 0 || !call.endsWith(")")) continue;
    const name = call.slice(0, open).trim();
    if (!/^[A-Za-z_]\w*$/.test(name)) continue;
    const input: Record<string, JsonValue> = {};
    for (const pair of splitTopLevel(call.slice(open + 1, -1))) {
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      const key = pair.slice(0, eq).trim();
      if (key !== "") input[key] = parsePyValue(pair.slice(eq + 1));
    }
    out.push({ name, input });
  }
  return out;
}

/** Liquid LFM2 `<|tool_call_start|>[ name(k=v, …), … ]<|tool_call_end|>` — a Python-style list of calls. */
export const liquidToolCall: ToolFormat = {
  name: "liquid-tool_call",
  start: "<|tool_call_start|>",
  end: "<|tool_call_end|>",
  extract: extractLiquidCalls,
};

/**
 * Pick the {@link ToolFormat} for a model repo id: Gemma → native tokens, LFM2/Liquid → its Python-call
 * grammar, everything else → the `<tool_call>` grammar shared by Qwen/Granite.
 *
 * @param modelId - the HF repo id (case-insensitive substring match).
 * @returns the format, defaulting to {@link angleToolCall}.
 */
export function formatForModel(modelId: string): ToolFormat {
  if (/gemma/i.test(modelId)) return gemmaToolCall;
  if (/lfm|liquid/i.test(modelId)) return liquidToolCall;
  return angleToolCall;
}

/**
 * How a model family delimits a chain-of-thought / reasoning block in its generated text.
 *
 * @remarks Provider-local dialect, mirroring {@link ToolFormat}: the harness contract is the generic
 * `reasoning.delta` channel, and each provider translates its own markers into it. `start`/`end` are the
 * literal sentinels the {@link splitToolCalls} state machine watches for.
 */
export interface ReasoningFormat {
  readonly start: string;
  readonly end: string;
}

/** The de-facto `<think>…</think>` reasoning block used by Qwen3 and most open reasoning models. */
export const thinkReasoning: ReasoningFormat = { start: "<think>", end: "</think>" };

/**
 * Pick the {@link ReasoningFormat} for a model repo id.
 *
 * @param _modelId - the HF repo id (reserved for future family-specific markers).
 * @returns {@link thinkReasoning} — the shared `<think>` grammar. It is inert for models that never emit the
 * sentinel, so applying it universally is safe.
 */
export function reasoningForModel(_modelId: string): ReasoningFormat {
  return thinkReasoning;
}

/**
 * Transform a raw token stream into {@link EngineChunk}s, suppressing tool-call and reasoning sentinels from
 * visible text.
 *
 * @param tokens - the model's decoded token stream (whole-word chunks from `TextStreamer`).
 * @param fmt - the tool grammar; `undefined` disables tool detection.
 * @param reasoning - the reasoning grammar; `undefined` disables reasoning detection (so `<think>` content,
 * if any, stays in the visible text — the exact legacy behavior). When set, a `<think>…</think>` block is
 * routed to `reasoning` chunks (→ the generic `reasoning.delta` channel) instead of leaking into the answer.
 * @returns an async stream of `token` chunks (answer text), `reasoning` chunks, and parsed `toolCall` chunks.
 * @remarks Single pass. Holds back up to the longest active sentinel's `length - 1` trailing chars while
 * scanning so a sentinel split across two tokens never leaks. Fail-soft: an unterminated or malformed block
 * yields no crash. Assumes reasoning precedes tool calls within one generation (true for open models).
 */
export async function* splitToolCalls(
  tokens: AsyncIterable<string>,
  fmt: ToolFormat | undefined,
  reasoning?: ReasoningFormat,
): AsyncGenerator<EngineChunk> {
  if (fmt === undefined && reasoning === undefined) {
    for await (const t of tokens) if (t !== "") yield { kind: "token", text: t };
    return;
  }
  // Longest opener we must not leak a partial of while in text mode.
  const maxOpen = Math.max(fmt !== undefined ? fmt.start.length : 0, reasoning !== undefined ? reasoning.start.length : 0);
  let buf = "";
  let mode: "text" | "call" | "reason" = "text";
  for await (const tok of tokens) {
    buf += tok;
    for (;;) {
      if (mode === "text") {
        const tIdx = fmt !== undefined ? buf.indexOf(fmt.start) : -1;
        const rIdx = reasoning !== undefined ? buf.indexOf(reasoning.start) : -1;
        // Enter whichever block opens first; on a tie, tool-call wins (a `<tool_call>` is never reasoning).
        let enter: "call" | "reason" | null = null;
        let idx = -1;
        if (tIdx !== -1 && (rIdx === -1 || tIdx <= rIdx)) {
          enter = "call";
          idx = tIdx;
        } else if (rIdx !== -1) {
          enter = "reason";
          idx = rIdx;
        }
        if (enter === null) {
          const keep = Math.min(buf.length, maxOpen - 1);
          const safe = buf.slice(0, buf.length - keep);
          if (safe !== "") yield { kind: "token", text: safe };
          buf = buf.slice(safe.length);
          break;
        }
        if (idx > 0) yield { kind: "token", text: buf.slice(0, idx) };
        if (enter === "call") {
          buf = buf.slice(idx + (fmt as ToolFormat).start.length);
          mode = "call";
        } else {
          buf = buf.slice(idx + (reasoning as ReasoningFormat).start.length);
          mode = "reason";
        }
      } else if (mode === "reason") {
        const end = (reasoning as ReasoningFormat).end;
        const idx = buf.indexOf(end);
        if (idx === -1) {
          // Stream reasoning live, holding back a possible partial closing sentinel at the tail.
          const keep = Math.min(buf.length, end.length - 1);
          const safe = buf.slice(0, buf.length - keep);
          if (safe !== "") yield { kind: "reasoning", text: safe };
          buf = buf.slice(safe.length);
          break;
        }
        if (idx > 0) yield { kind: "reasoning", text: buf.slice(0, idx) };
        buf = buf.slice(idx + end.length);
        mode = "text";
      } else {
        // mode === "call"
        if ((fmt as ToolFormat).end === null) break; // runs to EOS — keep buffering
        const idx = buf.indexOf((fmt as ToolFormat).end as string);
        if (idx === -1) break; // wait for the closing sentinel
        for (const c of (fmt as ToolFormat).extract(buf.slice(0, idx))) yield { kind: "toolCall", name: c.name, input: c.input };
        buf = buf.slice(idx + ((fmt as ToolFormat).end as string).length);
        mode = "text";
      }
    }
  }
  // Flush at end of stream.
  if (mode === "call") {
    for (const c of (fmt as ToolFormat).extract(buf)) yield { kind: "toolCall", name: c.name, input: c.input };
  } else if (mode === "reason") {
    if (buf !== "") yield { kind: "reasoning", text: buf };
  } else if (buf !== "") {
    yield { kind: "token", text: buf };
  }
}
