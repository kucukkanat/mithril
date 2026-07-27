import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ThinkingOrb } from "@mithril-internal/thinking-orbs";
import type { ToolSpec } from "@mithril/spec";
import { anchorStyle, type AnchorStyle } from "../lib/anchor.ts";
import { TOKEN_CLASS } from "../lib/highlight.ts";
import { pickScore, SCORING_RULES, TONE_AT, type Finding } from "../lib/pick-score.ts";
import { exampleError, exampleTemplate, paramsOf, parseExample, readNames, toZod, tokenize, type Param, type ParamType } from "../lib/tool-fields.ts";
import { CloseIcon } from "./icons.tsx";
import { ProbeCard } from "./ProbeCard.tsx";

/*
 * Structured editor for one tool decl.
 *
 * The lint card leads, because "will the model actually call this?" is the question a first tool
 * fails on and the answer is almost never in the code. Below it: the description, the inputs (as
 * fields or as raw zod), and the body — where every input name is a live link back to its field, so
 * an argument the code never reads is visible rather than inferred.
 */

export interface ToolPanelProps {
  readonly tool: ToolSpec;
  readonly onChange: (next: ToolSpec) => void;
  /** Which agent can call it — `null` means nothing can. */
  readonly owner: string | null;
  /**
   * Ask the drafting model to rewrite the description; `null` when drafting is switched off.
   *
   * Only ever offered on findings ABOUT the description. Every fixable finding used to render this button,
   * so clicking "fix" on an input finding rewrote the description instead and the finding stayed red.
   */
  readonly onFix: (() => void) | null;
  readonly drafting: boolean;
}

const scoreColor = (score: number): string => (score >= TONE_AT.good ? "var(--good)" : score >= TONE_AT.warn ? "var(--warn)" : "var(--bad)");
const TIP_ID = "pick-scoring-tip";
/** Findings the drafting model can actually resolve — it rewrites the description and nothing else. */
const DESCRIPTION_FINDINGS = new Set(["description", "restates"]);
const MARK: Record<Finding["level"], string> = { pass: "✓", warn: "!", fail: "×" };
const TONE: Record<Finding["level"], string> = { pass: "tone-good", warn: "tone-warn", fail: "tone-bad" };

export function ToolPanel({ tool, onChange, owner, onFix, drafting }: ToolPanelProps) {
  const [schemaMode, setSchemaMode] = useState<"fields" | "zod">("fields");
  const [editingCode, setEditingCode] = useState(false);
  const [hoverParam, setHoverParam] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  /** Clicked open, so it survives the pointer leaving — the rubric is longer than a hover reads for. */
  const [pinned, setPinned] = useState(false);
  const helpRef = useRef<HTMLButtonElement>(null);
  const [tipStyle, setTipStyle] = useState<AnchorStyle | undefined>(undefined);

  /*
   * The rubric is positioned FIXED against the "?" rather than absolutely inside it — see
   * lib/anchor.ts for why. It opens downward only while there is room for a useful share of the
   * rubric, which is most of a screen; below that it flips above the "?".
   */
  useLayoutEffect(() => {
    if (!tipOpen) return;
    const place = (): void => {
      const r = helpRef.current?.getBoundingClientRect();
      if (r === undefined) return;
      setTipStyle(anchorStyle(r, { width: window.innerWidth, height: window.innerHeight }, { prefer: "below", width: 480, minRoom: 320 }));
    };
    place();
    // `true` captures scrolls of the Designer's inner panes, which don't bubble to window.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [tipOpen]);
  const [removed, setRemoved] = useState<{ readonly index: number; readonly param: Param } | null>(null);
  /** By position, not name — a name is edited live, so it can't identify the field holding it. */
  const fieldRefs = useRef(new Map<number, HTMLInputElement>());

  const score = pickScore(tool);
  const params = paramsOf(tool.inputSchema.zod);
  const names = params.map((p) => p.name);
  const use = readNames(tool.execute.code, names);
  const examples = tool.examples ?? [];
  const bodyLines = tool.execute.code.split("\n");

  const writeParams = (next: readonly Param[]): void => onChange({ ...tool, inputSchema: { zod: toZod(next) } });
  const patchParam = (i: number, patch: Partial<Param>): void => writeParams(params.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <div className="panel" data-testid="tool-panel">
      <div className="panel-head">
        <h3>tool</h3>
        <input
          className="name-input name-input-wide"
          value={tool.name}
          onChange={(e) => onChange({ ...tool, name: e.target.value })}
          spellCheck={false}
          aria-label="Tool name"
          data-testid="tool-name"
        />
        <span className="owner-note" style={{ color: owner === null ? "var(--warn)" : "var(--text-faint)" }} data-testid="tool-owner">
          {owner === null ? "no agent can call it" : `called by ${owner}`}
        </span>
      </div>

      <div className="panel-grid">
        {/* Executed evidence first, prose heuristics second — when they disagree, the execution is right. */}
        <ProbeCard tool={tool} />
        <div className={`pick tone-${score.tone}`} data-testid="tool-pick">
          <div className="pick-top">
            <span className="eyebrow" style={{ border: "none", padding: 0 }}>How the description reads</span>
            {/* Hover OR focus opens it, click pins it — a score nobody can see the rubric for reads as
                a verdict rather than a checklist, and this one is only a heuristic. */}
            <span
              className="pick-help"
              onMouseEnter={() => setTipOpen(true)}
              onMouseLeave={() => setTipOpen(pinned)}
            >
              <button
                ref={helpRef}
                className="ghost icon-btn pick-help-btn"
                aria-label="How this score is calculated"
                aria-expanded={tipOpen}
                aria-controls={TIP_ID}
                onClick={() => {
                  // Pinning is the only thing a click changes; hover already opened it.
                  const next = !pinned;
                  setPinned(next);
                  setTipOpen(next);
                }}
                onFocus={() => setTipOpen(true)}
                onBlur={() => setTipOpen(pinned)}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") return;
                  setPinned(false);
                  setTipOpen(false);
                }}
                data-testid="tool-pick-help"
              >
                ?
              </button>
              {tipOpen && (
                <div className="pick-tip" id={TIP_ID} role="tooltip" style={tipStyle} data-testid="tool-pick-tip">
                  <p className="pick-tip-lede">
                    An <b>unmeasured heuristic</b> about wording. It runs on every keystroke with no network and no key, and it reads only three
                    strings: the name, the description, and each input&rsquo;s description. It never reads the body, so it cannot tell you whether the
                    tool works &mdash; that is what &ldquo;Does it actually work?&rdquo; above is for, and that card wins when the two disagree.
                  </p>
                  <ul className="pick-tip-rules">
                    {SCORING_RULES.map((r) => (
                      <li key={r.id} data-testid={`tool-pick-rule-${r.id}`}>
                        <span className="pick-tip-pts">+{r.points}</span>
                        <span>
                          <b>{r.label}</b> — {r.how}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="pick-tip-foot">
                    {TONE_AT.good}+ reads green, {TONE_AT.warn}–{TONE_AT.good - 1} amber, below {TONE_AT.warn} red. An empty description caps the whole
                    score at 20 — well-described inputs must not rescue a tool the model has nothing to choose on.
                  </p>
                  <p className="pick-tip-foot pick-tip-caveat">
                    It measures the <em>shape</em> of a description, not whether it is true. A good description phrased without a trigger word will be
                    marked down, and a vague one containing “when” will not.
                  </p>
                </div>
              )}
            </span>
            <span className="pick-score" style={{ color: scoreColor(score.score) }} data-testid="tool-pick-score">
              {score.score}
            </span>
          </div>
          <span className="meter meter-lg" style={{ "--pct": `${score.score}%`, "--tone": scoreColor(score.score) } as CSSProperties}>
            <i />
          </span>
          <p className="hint" style={{ margin: "0 0 var(--mth-space-3)" }}>{score.verdict}</p>
          <div className="findings">
            {score.findings.map((f) => (
              <div key={f.id} className={`finding ${TONE[f.level]}`} data-testid={`tool-finding-${f.id}`}>
                <span className="finding-mark">{MARK[f.level]}</span>
                <span className="finding-text">{f.text}</span>
                {/* Arity is fixable without a model: an empty example IS the statement that there is
                    nothing to supply, and it reaches the model through the wire description. */}
                {f.id === "arity" && f.level !== "pass" && (
                  <button
                    className="ghost"
                    onClick={() => onChange({ ...tool, examples: [{}] })}
                    title="Add an empty example, so the model sees a call with no arguments"
                    data-testid="tool-fix-arity"
                  >
                    fix
                  </button>
                )}
                {/* The drafting model only rewrites the DESCRIPTION, so it is only offered on findings
                    about the description. A name is the user's to choose; inputs are edited in Fields. */}
                {DESCRIPTION_FINDINGS.has(f.id) && f.level !== "pass" && f.fixable && onFix !== null && (
                  <button className="ghost" onClick={onFix} disabled={drafting} data-testid={`tool-fix-${f.id}`}>
                    {/* `composing` — the drafting model is writing prose. */}
                    {drafting ? <ThinkingOrb state="composing" size={20} aria-label="Drafting…" /> : "fix"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <h4 style={{ marginTop: 0 }}>Description</h4>
          <p className="hint" style={{ marginTop: 0 }}>All the model reads before deciding to call it.</p>
          <textarea
            rows={3}
            value={tool.description}
            onChange={(e) => onChange({ ...tool, description: e.target.value })}
            placeholder="Use this whenever the user asks about … — say when to call it, not just what it is."
            data-testid="tool-description"
          />
        </div>

        <div className="field span-all">
          <div className="field-head">
            <h4>Inputs</h4>
            <span className="count">{params.length}</span>
            <div className="seg">
              <button className={schemaMode === "fields" ? "seg-on" : ""} onClick={() => setSchemaMode("fields")} data-testid="tool-schema-fields">
                Fields
              </button>
              <button className={schemaMode === "zod" ? "seg-on" : ""} onClick={() => setSchemaMode("zod")} data-testid="tool-schema-zod">
                zod
              </button>
            </div>
          </div>

          {schemaMode === "zod" ? (
            <textarea
              className="mono"
              rows={4}
              value={tool.inputSchema.zod}
              onChange={(e) => onChange({ ...tool, inputSchema: { zod: e.target.value } })}
              data-testid="tool-zod"
            />
          ) : (
            <div className="field-group">
              <div className="arg-grid">
                {params.map((p, i) => (
                  <div
                    // Keyed by position, NOT by name: the name is the value of an input in this very
                    // card, so a name-derived key changes on every keystroke and remounts the field
                    // mid-type, dropping focus. Cards are only ever added/removed, so position is identity.
                    key={i}
                    className={`arg-card${hoverParam === p.name ? " on" : ""}`}
                    onMouseEnter={() => setHoverParam(p.name)}
                    onMouseLeave={() => setHoverParam(null)}
                    data-testid={`tool-arg-${p.name}`}
                  >
                    <div className="arg-row">
                      <input
                        ref={(el) => {
                          if (el === null) fieldRefs.current.delete(i);
                          else fieldRefs.current.set(i, el);
                        }}
                        className="arg-name"
                        value={p.name}
                        onChange={(e) => patchParam(i, { name: e.target.value })}
                        spellCheck={false}
                        aria-label="Input name"
                        data-testid={`tool-arg-name-${i}`}
                      />
                      <select
                        className="arg-type"
                        value={p.type}
                        onChange={(e) => patchParam(i, { type: e.target.value as ParamType })}
                        aria-label="Input type"
                        data-testid={`tool-arg-type-${i}`}
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      <button
                        className="ghost icon-btn"
                        onClick={() => {
                          setRemoved({ index: i, param: p });
                          writeParams(params.filter((_, j) => j !== i));
                        }}
                        title="Remove this input"
                        aria-label="Remove this input"
                        data-testid={`tool-arg-remove-${p.name}`}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <input
                      className="arg-desc"
                      value={p.description}
                      onChange={(e) => patchParam(i, { description: e.target.value })}
                      placeholder="e.g. Istanbul — say what a good value looks like"
                      aria-label="Input description"
                      data-testid={`tool-arg-desc-${i}`}
                    />
                    {/* Three states, not two. "Referenced but never bound" is a ReferenceError waiting to
                        happen, and it used to render as the reassuring "read by the code". */}
                    <span
                      className={`arg-use${use.unbound.has(p.name) ? " unbound" : use.read.has(p.name) ? " on" : " unused"}`}
                      title={
                        use.unbound.has(p.name)
                          ? "The code uses this name but never binds it — the call throws"
                          : use.read.has(p.name)
                            ? "The code below reads this input"
                            : "The code never reads this input"
                      }
                      data-testid={`tool-arg-use-${p.name}`}
                    >
                      {use.unbound.has(p.name) ? "never bound — throws" : use.read.has(p.name) ? "read by the code" : "never read"}
                    </span>
                  </div>
                ))}
              </div>

              {params.length === 0 && (
                <div className="empty-row" data-testid="tool-args-empty">
                  <span className="hint">No inputs. The model calls this tool with no arguments.</span>
                  <button className="ghost" onClick={() => writeParams([{ name: "input", type: "text", description: "" }])} data-testid="tool-arg-add-first">
                    ＋ input
                  </button>
                </div>
              )}

              {removed !== null && (
                <div className="undo-strip" data-testid="tool-arg-undo">
                  <span className="undo-note">Removed {removed.param.name}</span>
                  <button
                    className="ghost"
                    data-testid="tool-arg-undo-button"
                    onClick={() => {
                      const next = [...params];
                      next.splice(Math.min(removed.index, next.length), 0, removed.param);
                      writeParams(next);
                      setRemoved(null);
                    }}
                  >
                    Undo
                  </button>
                  <button className="ghost icon-btn" onClick={() => setRemoved(null)} title="Dismiss" aria-label="Dismiss" data-testid="tool-arg-undo-dismiss">
                    <CloseIcon />
                  </button>
                </div>
              )}

              {params.length > 0 && (
                <button
                  className="ghost add-arg"
                  onClick={() => writeParams([...params, { name: `input${params.length + 1}`, type: "text", description: "" }])}
                  data-testid="tool-arg-add"
                >
                  ＋ input
                </button>
              )}
            </div>
          )}
        </div>

        {/* `examples` was fully plumbed end to end — spec type, codegen, parser, and `withExamples` folds it
            verbatim into the wire description for EVERY provider — with no way to enter one. For a zero-arg
            tool a literal `{}` example is often the entire fix. */}
        <div className="field span-all">
          <div className="field-head">
            <h4>Examples</h4>
            <span className="count">{examples.length === 0 ? "none" : `${examples.length} shown to the model`}</span>
            <button
              className="ghost"
              style={{ marginLeft: "auto", fontSize: "var(--mth-fs-2xs)" }}
              onClick={() => onChange({ ...tool, examples: [...examples, exampleTemplate(params)] })}
              data-testid="tool-example-add"
            >
              ＋ example
            </button>
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            Example calls, folded into the description the model reads. The strongest prompt-side lift for small models — and for a tool with no
            inputs, an empty <code className="mono">{"{}"}</code> is what tells the model it can just call it.
          </p>
          {examples.map((ex, i) => {
            const raw = JSON.stringify(ex);
            const bad = exampleError(raw, names);
            return (
              <div key={i} className="arg-row">
                <input
                  className={`mono${bad === null ? "" : " code-edit-bad"}`}
                  defaultValue={raw}
                  spellCheck={false}
                  aria-label={`Example ${i + 1}`}
                  onBlur={(e) => {
                    // Committed on blur, and only when it parses: a half-typed object must not be written
                    // into the spec and regenerate the code as invalid.
                    const parsed = parseExample(e.target.value);
                    if (parsed === undefined) return;
                    onChange({ ...tool, examples: examples.map((q, j) => (j === i ? parsed : q)) });
                  }}
                  data-testid={`tool-example-${i}`}
                />
                <button
                  className="ghost icon-btn"
                  title="Remove this example"
                  aria-label="Remove this example"
                  onClick={() => {
                    const next = examples.filter((_, j) => j !== i);
                    // Under exactOptionalPropertyTypes the key must be ABSENT, not undefined — otherwise
                    // codegen would emit `examples: undefined` into the generated source.
                    const { examples: _dropped, ...withoutExamples } = tool;
                    onChange(next.length === 0 ? withoutExamples : { ...tool, examples: next });
                  }}
                  data-testid={`tool-example-remove-${i}`}
                >
                  <CloseIcon />
                </button>
                {bad !== null && <span className="arg-use unbound" data-testid={`tool-example-bad-${i}`}>{bad}</span>}
              </div>
            );
          })}
        </div>

        <div className="field span-all">
          <div className="field-head">
            <h4>Code</h4>
            <span className={`count${use.unbound.size > 0 ? " count-bad" : ""}`}>
              {use.unbound.size > 0
                ? `${[...use.unbound].map((n) => `\`${n}\``).join(", ")} never bound — this throws`
                : names.length === 0
                  ? "no arguments"
                  : `${use.read.size} of ${names.length} input${names.length === 1 ? "" : "s"} read`}
            </span>
            <button className="ghost" onClick={() => setEditingCode((v) => !v)} style={{ marginLeft: "auto", fontSize: "var(--mth-fs-2xs)" }} data-testid="tool-code-toggle">
              {editingCode ? "Done" : "Edit"}
            </button>
          </div>
          {editingCode ? (
            <textarea
              className="mono"
              rows={5}
              value={tool.execute.code}
              onChange={(e) => onChange({ ...tool, execute: { code: e.target.value } })}
              data-testid="tool-code"
            />
          ) : (
            <ol className="code" data-testid="tool-code-read">
              {bodyLines.map((line, i) => (
                <li key={i}>
                  <code>
                    {tokenize(line, names).map((t, j) =>
                      t.name === null ? (
                        <span key={j} className={TOKEN_CLASS[t.kind]}>{t.text}</span>
                      ) : (
                        <span
                          key={j}
                          className={`arg-tok${hoverParam === t.name ? " on" : ""}`}
                          title={`Jump to the ${t.name} field`}
                          onMouseEnter={() => setHoverParam(t.name)}
                          onMouseLeave={() => setHoverParam(null)}
                          onClick={() => fieldRefs.current.get(names.indexOf(t.name ?? ""))?.focus()}
                        >
                          {t.text}
                        </span>
                      ),
                    )}
                  </code>
                </li>
              ))}
            </ol>
          )}
          <p className="hint" style={{ marginBottom: 0 }}>
            Runs in a sandboxed worker. Input names are links — click one to jump to its field.
          </p>
        </div>
      </div>
    </div>
  );
}
