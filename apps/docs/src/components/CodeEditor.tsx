import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting, bracketMatching, indentOnInput } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const theme = EditorView.theme({
  "&": { color: "var(--text)", backgroundColor: "transparent", height: "100%", fontSize: "13px" },
  ".cm-scroller": { fontFamily: "var(--mth-font-mono)", lineHeight: "1.65", overflow: "auto" },
  ".cm-content": { padding: "16px 0", caretColor: "var(--cm-cursor)" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--cm-gutter)", border: "none" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 16px" },
  ".cm-activeLine": { backgroundColor: "var(--cm-active-line)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-muted)" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "var(--cm-cursor)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "var(--cm-selection)" },
  ".cm-matchingBracket": {
    backgroundColor: "color-mix(in srgb, var(--mth-accent) 18%, transparent)",
    outline: "1px solid var(--border-accent)",
  },
  "&.cm-focused": { outline: "none" },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.operatorKeyword], color: "var(--cm-keyword)" },
  { tag: [t.controlKeyword, t.moduleKeyword], color: "var(--cm-keyword)", fontWeight: "500" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--cm-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--cm-number)" },
  { tag: [t.lineComment, t.blockComment, t.comment, t.docComment], color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--cm-func)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--cm-type)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--cm-prop)" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "var(--cm-variable)" },
  { tag: [t.punctuation, t.bracket, t.separator, t.paren, t.brace, t.squareBracket], color: "var(--cm-punct)" },
  { tag: [t.operator], color: "var(--text-muted)" },
  { tag: [t.propertyName], color: "var(--cm-prop)" },
]);

interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onRun: () => void;
}

export function CodeEditor({ value, onChange, onRun }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  const onChangeRef = useRef(onChange);
  onRunRef.current = onRun;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        javascript({ typescript: true }),
        theme,
        syntaxHighlighting(highlight),
        EditorView.lineWrapping,
        keymap.of([
          {
            key: "Mod-Enter",
            preventDefault: true,
            run: () => {
              onRunRef.current();
              return true;
            },
          },
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
      ],
    });
    const v = new EditorView({ state, parent: host.current });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && value !== v.state.doc.toString()) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div className="cm-host" ref={host} data-testid="code-editor" />;
}
