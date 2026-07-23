import { useState } from "react";
import type { AgentSpec, ProjectSpec } from "@mithril/spec";
import { ModelPicker } from "./ModelPicker.tsx";

/*
 * Structured editor for one agent decl. Every change is a pure spec mutation — the store
 * regenerates the code view. Field order mirrors core's AgentConfig.
 */

export interface AgentPanelProps {
  readonly spec: ProjectSpec;
  readonly agent: AgentSpec;
  readonly onChange: (next: AgentSpec) => void;
}

function numField(
  label: string,
  value: number | undefined,
  set: (v: number | undefined) => void,
  placeholder?: string,
) {
  return (
    <label data-testid={`agent-field-${label}`}>
      {label}
      <input
        type="number"
        data-testid={`agent-input-${label}`}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </label>
  );
}

function triToggle(label: string, value: boolean | undefined, set: (v: boolean | undefined) => void, defaultLabel: string) {
  return (
    <label data-testid={`agent-field-${label}`}>
      {label}
      <select
        data-testid={`agent-select-${label}`}
        value={value === undefined ? "default" : String(value)}
        onChange={(e) => set(e.target.value === "default" ? undefined : e.target.value === "true")}
      >
        <option value="default">default ({defaultLabel})</option>
        <option value="true">on</option>
        <option value="false">off</option>
      </select>
    </label>
  );
}

export function AgentPanel({ spec, agent, onChange }: AgentPanelProps) {
  const attachable = spec.decls.filter((d) => (d.kind === "tool" || d.kind === "subAgentTool") && d.id !== agent.id);
  // `undefined` in a patch means "remove the key" (exactOptionalPropertyTypes-safe).
  const patch = (p: { [K in keyof AgentSpec]?: AgentSpec[K] | undefined }): void => {
    // exactOptionalPropertyTypes: drop keys explicitly set to undefined instead of storing them.
    const merged = { ...agent, ...p };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined));
    onChange(clean as unknown as AgentSpec);
  };

  const instructionsIsCode = typeof agent.instructions !== "string";
  const staticText = typeof agent.instructions === "string" ? agent.instructions : "";
  const dynamicCode = typeof agent.instructions === "string" ? "" : agent.instructions.code;
  // Remember the other mode's last value so toggling Static⇄Dynamic never discards typed content.
  const [stash, setStash] = useState<{ readonly static: string; readonly dynamic: string }>({ static: staticText, dynamic: dynamicCode });

  return (
    <div className="panel" data-testid="agent-panel">
      <h3>
        agent <code>{agent.id}</code>
      </h3>

      <section data-testid="agent-section-model">
        <h4>Model</h4>
        <ModelPicker value={agent.model} onChange={(model) => patch({ model })} />
      </section>

      <section data-testid="agent-section-instructions">
        <h4>Instructions</h4>
        <div className="seg">
          <button
            className={instructionsIsCode ? "" : "seg-on"}
            data-testid="agent-instructions-static"
            onClick={() => {
              if (!instructionsIsCode) return;
              setStash((s) => ({ ...s, dynamic: dynamicCode }));
              patch({ instructions: stash.static });
            }}
          >
            Static
          </button>
          <button
            className={instructionsIsCode ? "seg-on" : ""}
            data-testid="agent-instructions-dynamic"
            onClick={() => {
              if (instructionsIsCode) return;
              setStash((s) => ({ ...s, static: staticText }));
              patch({ instructions: { code: stash.dynamic.length > 0 ? stash.dynamic : `(ctx) => ${JSON.stringify(staticText)}` } });
            }}
          >
            Dynamic (ctx)
          </button>
        </div>
        <textarea
          rows={4}
          data-testid="agent-instructions-input"
          value={instructionsIsCode ? dynamicCode : staticText}
          onChange={(e) => {
            const val = e.target.value;
            setStash((s) => (instructionsIsCode ? { ...s, dynamic: val } : { ...s, static: val }));
            patch({ instructions: instructionsIsCode ? { code: val } : val });
          }}
        />
      </section>

      <section data-testid="agent-section-tools">
        <h4>Tools</h4>
        {attachable.length === 0 && <p className="hint">No tools yet. Add one with <strong>+ tool</strong> in the left rail, then check it here to attach it.</p>}
        {attachable.map((d) => (
          <label key={d.id} className="check" data-testid={`agent-tool-${d.id}`}>
            <input
              type="checkbox"
              data-testid={`agent-tool-checkbox-${d.id}`}
              checked={agent.tools.includes(d.id)}
              onChange={(e) =>
                patch({
                  tools: e.target.checked ? [...agent.tools, d.id] : agent.tools.filter((t) => t !== d.id),
                })
              }
            />
            <code>{d.id}</code>
          </label>
        ))}
      </section>

      <section data-testid="agent-section-output">
        <h4>Structured output</h4>
        <label data-testid="agent-field-output-zod">
          zod schema (empty = plain text)
          <input
            data-testid="agent-input-output-zod"
            value={agent.output?.zod ?? ""}
            placeholder="z.object({ … })"
            onChange={(e) => patch({ output: e.target.value === "" ? undefined : { zod: e.target.value } })}
          />
        </label>
        {agent.output !== undefined && numField("outputRetries", agent.outputRetries, (v) => patch({ outputRetries: v }), "2")}
      </section>

      <section data-testid="agent-section-limits">
        <h4>Limits & behavior</h4>
        {numField("maxSteps", agent.maxSteps, (v) => patch({ maxSteps: v }), "16")}
        {numField("maxTokens", agent.maxTokens, (v) => patch({ maxTokens: v }))}
        {numField("maxCostMicroUsd", agent.maxCostMicroUsd, (v) => patch({ maxCostMicroUsd: v }))}
        {numField("toolRetries", agent.toolRetries, (v) => patch({ toolRetries: v }), "2")}
        {triToggle("loopDetection", agent.loopDetection, (v) => patch({ loopDetection: v }), "on")}
        {triToggle("selfCorrection", agent.selfCorrection, (v) => patch({ selfCorrection: v }), "on")}
        {triToggle("repair", agent.repair, (v) => patch({ repair: v }), "auto")}
      </section>

      <section data-testid="agent-section-middleware">
        <h4>Middleware (use)</h4>
        {(agent.use ?? []).map((u, i) => (
          <div key={i} className="row" data-testid={`agent-middleware-row-${i}`}>
            <input
              data-testid={`agent-middleware-input-${i}`}
              value={u.code}
              onChange={(e) =>
                patch({ use: (agent.use ?? []).map((x, j) => (j === i ? { code: e.target.value } : x)) })
              }
            />
            <button data-testid={`agent-middleware-remove-${i}`} onClick={() => patch({ use: (agent.use ?? []).filter((_, j) => j !== i) })}>×</button>
          </div>
        ))}
        <button
          className="ghost"
          data-testid="agent-middleware-add"
          onClick={() => patch({ use: [...(agent.use ?? []), { code: `bestOfN({ n: 3, score: (r) => r.text.length })` }] })}
        >
          + middleware
        </button>
      </section>
    </div>
  );
}
