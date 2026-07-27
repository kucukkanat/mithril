/*
 * The one hand-rolled TypeScript scanner the read-only code panes share (Split view's generated
 * listing and the tool Code field). Not a real tokenizer — both panes render narrow, known-shape
 * source, and the Code tab owns real syntax highlighting via CodeMirror.
 */

/** A syntax class for one token of code. */
export type TokenKind = "plain" | "key" | "str" | "num" | "com" | "fn";

/** The CSS class each syntax class renders with; `plain` is unstyled. */
export const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  key: "tok-key",
  str: "tok-str",
  num: "tok-num",
  com: "tok-com",
  fn: "tok-fn",
};

const KEYWORDS = new Set(["const", "let", "var", "await", "return", "async", "function", "new", "throw", "import", "from", "export", "if", "else"]);

/**
 * Scan a template literal, colouring its text as a string but its `${…}` holes as code.
 *
 * Interpolations carry the identifiers a reader cares about — a tool body is mostly
 * `` `…${city}…` `` — so swallowing them into one string token would both mis-colour them and hide
 * the input-name links the Code field draws on top.
 */
function template(text: string): { kind: TokenKind; text: string }[] {
  const out: { kind: TokenKind; text: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(/\$\{([^{}]*)\}/g)) {
    if (m.index > last) out.push({ kind: "str", text: text.slice(last, m.index) });
    out.push({ kind: "str", text: "${" });
    out.push(...highlight(m[1] ?? ""));
    out.push({ kind: "str", text: "}" });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "str", text: text.slice(last) });
  return out;
}

/** Split one line of TypeScript into coloured tokens. */
export function highlight(line: string): readonly { readonly kind: TokenKind; readonly text: string }[] {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("//")) return [{ kind: "com", text: line }];

  const out: { kind: TokenKind; text: string }[] = [];
  // Strings first — their contents must never be scanned for keywords.
  const pattern = /("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
  let last = 0;
  for (const m of line.matchAll(pattern)) {
    if (m.index > last) out.push({ kind: "plain", text: line.slice(last, m.index) });
    const text = m[0];
    if (text.startsWith("`")) out.push(...template(text));
    else if (text.startsWith('"')) out.push({ kind: "str", text });
    else if (/^\d/.test(text)) out.push({ kind: "num", text });
    else if (KEYWORDS.has(text)) out.push({ kind: "key", text });
    else if (line[m.index + text.length] === "(") out.push({ kind: "fn", text });
    else out.push({ kind: "plain", text });
    last = m.index + text.length;
  }
  if (last < line.length) out.push({ kind: "plain", text: line.slice(last) });
  return out;
}
