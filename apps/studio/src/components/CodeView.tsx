import { useEffect, useState, type CSSProperties } from "react";

/*
 * The generated-code pane for Split view: a token-rendered listing rather than an editor.
 *
 * Two things it does that a text editor cannot. It highlights the line the focused FIELD owns, so the
 * spec⇄code relationship is visible while you type. And every string literal is an input — edit it
 * here and the form on the left follows, which is the product's whole claim made touchable.
 *
 * Everything else is read-only here — so a click on any other line hands the pane over to the real
 * editor (`onEditRequest`), which is what a reader who clicks generated code actually wants. Without
 * that escape hatch the pane looks like an editor and swallows the click, which reads as broken.
 */

/** A syntax class for one token of generated code. */
export type TokenKind = "plain" | "key" | "str" | "num" | "com" | "fn";

export interface CodeLine {
  /** Tokens making up the line, in order. */
  readonly tokens: readonly { readonly kind: TokenKind; readonly text: string }[];
  /** The spec field this line belongs to, if any — drives both highlighting and editability. */
  readonly field?: string;
  /** When set, the line's single string literal is editable and writes back through this. */
  readonly edit?: { readonly value: string; readonly onChange: (next: string) => void };
}

const CLASS: Record<TokenKind, string> = {
  plain: "",
  key: "tok-key",
  str: "tok-str",
  num: "tok-num",
  com: "tok-com",
  fn: "tok-fn",
};

const KEYWORDS = new Set(["const", "let", "var", "await", "return", "async", "function", "new", "throw", "import", "from", "export", "if", "else"]);

/**
 * Split one line of generated TypeScript into coloured tokens.
 *
 * A hand-rolled scanner, not a real tokenizer: this pane only ever renders output from
 * `generateProject`, whose shape is known and narrow. The Code tab owns real syntax highlighting.
 */
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
    if (text.startsWith('"') || text.startsWith("`")) out.push({ kind: "str", text });
    else if (/^\d/.test(text)) out.push({ kind: "num", text });
    else if (KEYWORDS.has(text)) out.push({ kind: "key", text });
    else if (line[m.index + text.length] === "(") out.push({ kind: "fn", text });
    else out.push({ kind: "plain", text });
    last = m.index + text.length;
  }
  if (last < line.length) out.push({ kind: "plain", text: line.slice(last) });
  return out;
}

export interface CodeViewProps {
  readonly code: string;
  /** The focused spec field, so its generated line can be marked warm. */
  readonly focus: string | null;
  /**
   * Editable string literals, keyed by the field they belong to. A line whose sole string literal
   * matches an entry becomes an input that writes straight back to the spec.
   */
  readonly editable?: Readonly<Record<string, { readonly value: string; readonly onChange: (next: string) => void }>>;
  readonly footNote?: string;
  /**
   * Hand the pane over to the real code editor, with the caret on this 1-based line. When omitted the
   * pane is purely read-mostly; when given, every non-inline-editable line becomes a click target.
   */
  readonly onEditRequest?: (line: number) => void;
}

/** Which field a generated line belongs to, by the property it assigns. */
function fieldOf(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("instructions:")) return "job";
  if (trimmed.startsWith("model:")) return "model";
  if (trimmed.startsWith("tools:")) return "tools";
  if (trimmed.startsWith("description:")) return "description";
  if (trimmed.startsWith("inputSchema:")) return "params";
  if (trimmed.startsWith("execute:")) return "code";
  if (trimmed.startsWith("name:")) return "name";
  return null;
}

/**
 * Decode a TypeScript double-quoted string body, or `null` if it isn't valid yet.
 *
 * The pane edits the ESCAPED source, not the decoded value: an `<input>` silently drops newlines, so
 * typing into a decoded multi-line instruction would quietly destroy its formatting. Editing `\n` as
 * two visible characters is both lossless and what a code pane should show.
 */
export function decodeLiteral(body: string): string | null {
  try {
    const v: unknown = JSON.parse(`"${body}"`);
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}

/** The three pieces of a generated line whose lone string literal is editable in place. */
export interface LiteralSlot {
  readonly field: string;
  readonly prefix: string;
  readonly body: string;
  readonly tail: string;
  readonly onChange: (next: string) => void;
}

/**
 * The inline-editable slot in one generated line, or `null` when the line is read-only here.
 *
 * Only offers a slot when the literal decodes to exactly the value we'd write back; otherwise an edit
 * would silently disagree with the code around it. Comparing DECODED values (rather than a hand-rolled
 * re-escape) is what makes multi-line instructions and anything containing a backslash editable at all.
 */
export function literalSlot(line: string, editable: CodeViewProps["editable"] = {}): LiteralSlot | null {
  const field = fieldOf(line);
  if (field === null) return null;
  const edit = editable[field];
  if (edit === undefined) return null;
  const m = /^(\s*[A-Za-z_$][\w$]*:\s*)"((?:[^"\\]|\\.)*)"(,?)\s*$/.exec(line);
  const [, prefix = "", body = "", tail = ""] = m ?? [];
  if (m === null || decodeLiteral(body) !== edit.value) return null;
  return { field, prefix, body, tail, onChange: edit.onChange };
}

/** One editable string literal inside a generated line. */
function LiteralInput({ body, field, onChange }: { readonly body: string; readonly field: string; readonly onChange: (next: string) => void }) {
  // Mid-typing a lone backslash is not decodable, so the raw text is held locally and only committed
  // once it parses. Without this the caret would jump back on every escape the user starts.
  const [raw, setRaw] = useState(body);
  useEffect(() => setRaw(body), [body]);
  const valid = decodeLiteral(raw) !== null;
  return (
    <input
      className={valid ? "code-edit" : "code-edit code-edit-bad"}
      style={{ "--ch": `${Math.max(raw.length, 1)}ch` } as CSSProperties}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const decoded = decodeLiteral(e.target.value);
        if (decoded !== null) onChange(decoded);
      }}
      spellCheck={false}
      title="Edit here and the form follows"
      aria-label="Edit this value"
      data-testid={`code-edit-${field}`}
    />
  );
}

export function CodeView({ code, focus, editable = {}, footNote, onEditRequest }: CodeViewProps) {
  const lines = code.split("\n");
  const cls = (...names: readonly (string | false)[]): string => names.filter((n) => n !== false).join(" ");
  return (
    <div className="split-pane pane-generated" data-testid="code-view">
      <div className="pane-head">
        <span className="pane-dot pane-dot-generated" /> TypeScript — <b>Mithril writes this</b>
        <span className="pane-meta">
          {onEditRequest !== undefined && (
            <button className="ghost" onClick={() => onEditRequest(1)} data-testid="code-view-edit" title="Edit the generated code directly">
              edit code
            </button>
          )}
          <code className="mono">agent.ts</code>
        </span>
      </div>
      <ol className="code">
        {lines.map((line, i) => {
          const field = fieldOf(line);
          const warm = field !== null && field === focus;
          const slot = literalSlot(line, editable);
          if (slot !== null) {
            return (
              <li key={i} className={cls("editable", warm && "warm")}>
                <code>
                  {highlight(slot.prefix).map((t, j) => (
                    <span key={j} className={CLASS[t.kind]}>{t.text}</span>
                  ))}
                  <span className="tok-str">&quot;</span>
                  <LiteralInput body={slot.body} field={slot.field} onChange={slot.onChange} />
                  <span className="tok-str">&quot;</span>
                  <span>{slot.tail}</span>
                </code>
              </li>
            );
          }
          return (
            <li
              key={i}
              className={cls(warm && "warm", onEditRequest !== undefined && "openable")}
              onMouseDown={onEditRequest === undefined ? undefined : () => onEditRequest(i + 1)}
              title={onEditRequest === undefined ? undefined : "Click to edit this line"}
            >
              <code>
                {highlight(line).map((t, j) => (
                  <span key={j} className={CLASS[t.kind]}>{t.text}</span>
                ))}
              </code>
            </li>
          );
        })}
      </ol>
      <div className="code-foot">
        <span>typescript · {lines.length} lines</span>
        <span className="spacer">{footNote ?? "regenerated on every edit"}</span>
      </div>
    </div>
  );
}
