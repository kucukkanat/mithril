import { liveProvider } from "@mithril/runner-web";
import { SCORER_CATALOG, scorerDescriptor, type ModelSpec, type ScorerParamField, type ScorerSpec } from "@mithril/spec";
import { ModelPicker } from "./ModelPicker.tsx";

/*
 * One scorer's form, rendered generically from its SCORER_CATALOG descriptor: a type picker plus a control
 * per declared param. The single source of truth is the catalog — add a scorer there and its form appears.
 */

export interface ScorerEditorProps {
  readonly scorer: ScorerSpec;
  readonly onChange: (next: ScorerSpec) => void;
  readonly onRemove: () => void;
  /** An inline warning to show (e.g. matchesTrajectory needs a pinned golden first). */
  readonly warning?: string | undefined;
}

/** A model param defaults to a cheap cloud judge; other params take their descriptor default. */
function defaultsFor(type: string): Record<string, unknown> {
  const d = scorerDescriptor(type);
  const params: Record<string, unknown> = {};
  for (const f of d?.params ?? []) {
    if (f.type === "model") params[f.key] = { kind: "live", provider: "openai", model: liveProvider("openai").defaultModel } satisfies ModelSpec;
    else if (f.default !== undefined) params[f.key] = f.default;
  }
  return params;
}

function ParamField({ field, value, onSet }: { field: ScorerParamField; value: unknown; onSet: (v: unknown) => void }) {
  const testId = `scorer-param-${field.key}`;
  switch (field.type) {
    case "boolean":
      return (
        <label className="check" data-testid={`${testId}-field`}>
          <input type="checkbox" data-testid={testId} checked={value === true} onChange={(e) => onSet(e.target.checked)} />
          {field.label}
        </label>
      );
    case "number":
      return (
        <label data-testid={`${testId}-field`}>
          {field.label}
          <input type="number" data-testid={testId} value={typeof value === "number" ? value : ""} onChange={(e) => onSet(e.target.value === "" ? undefined : Number(e.target.value))} />
        </label>
      );
    case "stringList": {
      const list = Array.isArray(value) ? (value as unknown[]).filter((x): x is string => typeof x === "string") : [];
      return (
        <label data-testid={`${testId}-field`}>
          {field.label} <span className="hint">(comma-separated)</span>
          <input data-testid={testId} value={list.join(", ")} onChange={(e) => onSet(e.target.value.split(",").map((s) => s.trim()).filter((s) => s.length > 0))} />
        </label>
      );
    }
    case "regex": {
      const v = (value ?? {}) as { source?: string; flags?: string };
      return (
        <div className="field-group" data-testid={`${testId}-field`}>
          <label>
            {field.label}
            <input data-testid={testId} value={v.source ?? ""} onChange={(e) => onSet({ ...v, source: e.target.value })} />
          </label>
          <label>
            Flags
            <input data-testid={`${testId}-flags`} value={v.flags ?? ""} placeholder="e.g. i" onChange={(e) => onSet({ ...v, flags: e.target.value })} />
          </label>
        </div>
      );
    }
    case "trajectoryMatchMode":
      return (
        <label data-testid={`${testId}-field`}>
          {field.label}
          <select data-testid={testId} value={typeof value === "string" ? value : "superset"} onChange={(e) => onSet(e.target.value)}>
            {["strict", "unordered", "superset", "subset"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      );
    case "toolArgsMatchMode":
      return (
        <label data-testid={`${testId}-field`}>
          {field.label}
          <select data-testid={testId} value={typeof value === "string" ? value : ""} onChange={(e) => onSet(e.target.value === "" ? undefined : e.target.value)}>
            <option value="">default (exact)</option>
            {["exact", "ignore", "subset", "superset"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      );
    case "model":
      return (
        <div data-testid={`${testId}-field`}>
          <span className="hint">{field.label}</span>
          <ModelPicker value={(value as ModelSpec | undefined) ?? { kind: "live", provider: "openai", model: liveProvider("openai").defaultModel }} onChange={onSet} />
        </div>
      );
    default:
      return (
        <label data-testid={`${testId}-field`}>
          {field.label}
          <input data-testid={testId} value={typeof value === "string" ? value : ""} onChange={(e) => onSet(e.target.value)} />
        </label>
      );
  }
}

export function ScorerEditor({ scorer, onChange, onRemove, warning }: ScorerEditorProps) {
  const descriptor = scorerDescriptor(scorer.type);
  const setParam = (key: string, v: unknown): void => onChange({ ...scorer, params: { ...scorer.params, [key]: v } });

  return (
    <div className="scorer-editor" data-testid={`scorer-${scorer.type}`}>
      <div className="scorer-head">
        <select
          data-testid="scorer-type"
          value={scorer.type}
          onChange={(e) => onChange({ type: e.target.value, params: defaultsFor(e.target.value) })}
        >
          {SCORER_CATALOG.map((d) => (
            <option key={d.type} value={d.type}>
              {d.label}
              {d.live === true ? " (live)" : ""}
            </option>
          ))}
        </select>
        <button className="ghost danger" data-testid="scorer-remove" onClick={onRemove} title="Remove scorer">✕</button>
      </div>
      {descriptor === undefined ? (
        <p className="warn">Unknown scorer type “{scorer.type}”.</p>
      ) : (
        <>
          {descriptor.summary && <p className="hint">{descriptor.summary}</p>}
          {warning !== undefined && <p className="warn" data-testid="scorer-warning">{warning}</p>}
          {descriptor.params.map((f) => (
            <div key={f.key}>
              <ParamField field={f} value={scorer.params[f.key]} onSet={(v) => setParam(f.key, v)} />
              {f.help !== undefined && <p className="hint scorer-field-help">{f.help}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
