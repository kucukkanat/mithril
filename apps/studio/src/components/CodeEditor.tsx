/*
 * CodeMirror 6 wrapper for the two-way code view: TypeScript highlighting, parser diagnostics in
 * the gutter (via @codemirror/lint's setDiagnostics — no async lint pass, the store pushes them),
 * and token-driven theming.
 */
import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, HighlightStyle, bracketMatching } from "@codemirror/language";
import { setDiagnostics, lintGutter, type Diagnostic } from "@codemirror/lint";
import { tags } from "@lezer/highlight";
import type { ParseDiagnostic } from "@mithril/spec/parse";

const highlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: "var(--accent)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--mth-mint)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--mth-amber)" },
  { tag: [tags.comment], color: "var(--text-faint)", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--mth-violet)" },
  { tag: [tags.propertyName], color: "var(--text)" },
  { tag: [tags.typeName, tags.className], color: "var(--mth-silver-300)" },
  { tag: [tags.operator, tags.punctuation], color: "var(--text-muted)" },
]);

const theme = EditorView.theme({
  "&": { backgroundColor: "var(--code-bg)", color: "var(--text)", fontSize: "var(--mth-fs-sm)", height: "100%" },
  ".cm-content": { fontFamily: "var(--mth-font-mono)", caretColor: "var(--accent)" },
  ".cm-gutters": { backgroundColor: "var(--code-bg)", color: "var(--text-faint)", border: "none" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-muted)" },
  "&.cm-focused": { outline: "none" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--accent) 22%, transparent) !important",
  },
});

export interface CodeEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly diagnostics?: readonly ParseDiagnostic[];
  readonly readOnly?: boolean;
}

export function CodeEditor({ value, onChange, diagnostics, readOnly }: CodeEditorProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  useEffect(() => {
    if (host.current === null) return undefined;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          bracketMatching(),
          lintGutter(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          javascript({ typescript: true }),
          syntaxHighlighting(highlight),
          theme,
          EditorView.editable.of(readOnly !== true),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) latestOnChange.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor owns the document after mount; `value` sync happens in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // External value changes (spec-driven regeneration) replace the doc — but only when it differs,
  // so typing is never clobbered by its own echo.
  useEffect(() => {
    const v = view.current;
    if (v === null) return;
    const current = v.state.doc.toString();
    if (current !== value) {
      v.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const v = view.current;
    if (v === null) return;
    const docLength = v.state.doc.length;
    const mapped: Diagnostic[] = (diagnostics ?? []).map((d) => ({
      from: Math.min(d.start, docLength),
      to: Math.min(d.start + Math.max(d.length, 1), docLength),
      severity: d.severity,
      message: d.message,
    }));
    v.dispatch(setDiagnostics(v.state, mapped));
  }, [diagnostics]);

  return <div ref={host} className="studio-editor" data-testid="code-editor" />;
}
