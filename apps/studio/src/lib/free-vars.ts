/*
 * Which identifiers a generated tool body reads but nothing gives it.
 *
 * This is the check that would have caught the original bug from the other side: a body calling
 * `await notes.write(…)` when no `notes` exists generates a file that compiles and then throws
 * "notes is not defined" on the first call. The spec has no type system to lean on, so the host
 * looks for the failure directly.
 *
 * It only ever produces a WARNING. The body is kept: a reference one setup line short of correct is
 * far more valuable than the placeholder that would replace it, and the Designer is where you fix
 * it. That is the same call `creatorToSpec` already makes for a tool name an agent asked for but
 * never created — say it plainly, keep going.
 *
 * Deliberately biased toward silence. Every ambiguous construct is resolved as "bound", so the scan
 * under-reports rather than crying wolf on correct code — a false warning on a working body would
 * teach you to ignore the notes, which costs more than the miss.
 */

/** Globals a tool body may use without declaring: the JS standard library, plus what the runner injects. */
const AMBIENT: ReadonlySet<string> = new Set([
  // Injected by the runner's snippet harness.
  "emit",
  "usage",
  "process",
  "console",
  "z",
  // Values and constructors.
  "globalThis",
  "undefined",
  "NaN",
  "Infinity",
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Symbol",
  "BigInt",
  "Math",
  "JSON",
  "Date",
  "RegExp",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Proxy",
  "Reflect",
  "Intl",
  "Error",
  "TypeError",
  "RangeError",
  "AggregateError",
  "Uint8Array",
  "Int8Array",
  "Uint16Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "ArrayBuffer",
  "DataView",
  // Web platform surface the worker actually has.
  "fetch",
  "Request",
  "Response",
  "Headers",
  "FormData",
  "Blob",
  "File",
  "URL",
  "URLSearchParams",
  "AbortController",
  "AbortSignal",
  "TextEncoder",
  "TextDecoder",
  "crypto",
  "structuredClone",
  "queueMicrotask",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "atob",
  "btoa",
  "isNaN",
  "isFinite",
  "parseInt",
  "parseFloat",
  "encodeURIComponent",
  "decodeURIComponent",
  "encodeURI",
  "decodeURI",
]);

/** Keywords and type-position words that are never a value reference. */
const KEYWORDS: ReadonlySet<string> = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
  "false", "finally", "for", "function", "get", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "set", "static", "super",
  "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield",
  // Type positions — a body may be annotated, and an annotation is not a reference.
  "any", "as", "boolean", "interface", "is", "keyof", "never", "number", "readonly", "satisfies", "string", "type", "unknown", "unless",
]);

/** One identifier occurrence, with just enough context to classify it. */
interface Occurrence {
  readonly name: string;
  /** Immediately preceded by `.` or `?.` — a property, not a reference. */
  readonly property: boolean;
  /** Immediately followed by `:` — an object key or a label, not a reference. */
  readonly key: boolean;
  /** Offset of the first character, so declaration keywords can be read behind it. */
  readonly at: number;
}

/** Walk `code`, yielding identifiers that are real code — never inside a string, template text, or comment. */
function occurrences(code: string): readonly Occurrence[] {
  const out: Occurrence[] = [];
  let i = 0;
  // Template literals nest code inside `${…}`; depth tracks how many holes we are inside.
  const stack: ("`" | "'" | '"')[] = [];
  while (i < code.length) {
    const c = code[i] ?? "";
    const next = code[i + 1] ?? "";
    const inTemplateText = stack[stack.length - 1] === "`";
    if (stack.length > 0 && !inTemplateText) {
      // Inside a plain string: skip to its close.
      if (c === "\\") i += 2;
      else if (c === stack[stack.length - 1]) {
        stack.pop();
        i++;
      } else i++;
      continue;
    }
    if (inTemplateText) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "`") {
        stack.pop();
        i++;
        continue;
      }
      if (c === "$" && next === "{") {
        // Enter the hole: its contents are scanned as code until the matching `}`.
        const end = matchBrace(code, i + 1);
        for (const o of occurrences(code.slice(i + 2, end))) out.push({ ...o, at: o.at + i + 2 });
        i = end + 1;
        continue;
      }
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      const nl = code.indexOf("\n", i);
      i = nl === -1 ? code.length : nl;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = code.indexOf("*/", i);
      i = end === -1 ? code.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      stack.push(c);
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j] ?? "")) j++;
      const before = code.slice(0, i).trimEnd();
      const after = code.slice(j).trimStart();
      out.push({
        name: code.slice(i, j),
        property: before.endsWith(".") && !before.endsWith(".."),
        key: after.startsWith(":"),
        at: i,
      });
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

/** Offset of the `}` matching the `{` at `open`, or the end of the string. */
function matchBrace(code: string, open: number): number {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return code.length;
}

/**
 * Names the body itself brings into scope.
 *
 * Over-collects on purpose — everything inside any parameter list, any destructuring pattern, and
 * anything following a declaration keyword counts as bound, without tracking block scope. A name
 * wrongly counted as bound costs one missed warning; a name wrongly counted as free accuses working
 * code, so the asymmetry is resolved the quiet way every time.
 */
function boundNames(code: string): ReadonlySet<string> {
  const bound = new Set<string>();
  const add = (s: string | undefined): void => {
    for (const m of (s ?? "").matchAll(/[A-Za-z_$][\w$]*/g)) if (!KEYWORDS.has(m[0])) bound.add(m[0]);
  };
  // Declarations: const/let/var/function/class/catch, including destructured patterns.
  for (const m of code.matchAll(/\b(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s*(\{[^}]*\}|\[[^\]]*\])/g)) add(m[1]);
  for (const m of code.matchAll(/\bcatch\s*\(([^)]*)\)/g)) add(m[1]);
  // Every parameter list: `(…)` that is followed by `=>` or preceded by `function`.
  for (const m of code.matchAll(/\(([^()]*)\)\s*(?::[^=]*)?=>/g)) add(m[1]);
  for (const m of code.matchAll(/\bfunction\*?\s*[A-Za-z_$][\w$]*?\s*\(([^)]*)\)/g)) add(m[1]);
  // A single-identifier arrow parameter: `x => …`.
  for (const m of code.matchAll(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*=>/g)) add(m[1]);
  // `for (const x of …)` is covered by the declaration rules above; labelled loops are not scanned.
  return bound;
}

/**
 * Identifiers `code` reads that nothing in scope provides.
 *
 * @param code - a tool body (a complete function expression).
 * @param provided - names the generated file puts in scope: capability bindings, other decl ids.
 * @returns each unresolved name once, in first-appearance order.
 *
 * @example
 * ```ts
 * freeIdentifiers("async ({ note }) => notes.write(note)", new Set());        // → ["notes"]
 * freeIdentifiers("async ({ note }) => notes.write(note)", new Set(["notes"])); // → []
 * ```
 */
export function freeIdentifiers(code: string, provided: ReadonlySet<string>): readonly string[] {
  const bound = boundNames(code);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of occurrences(code)) {
    if (o.property || o.key) continue;
    const { name } = o;
    if (KEYWORDS.has(name) || AMBIENT.has(name) || bound.has(name) || provided.has(name) || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}
