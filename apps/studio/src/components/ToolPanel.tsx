import { useState } from "react";
import type { ToolSpec } from "@mithril/spec";

/*
 * Structured editor for one tool decl. Schema and execute are code cells (zod source / TS source)
 * — the spec stores them verbatim, codegen slots them straight in.
 */

export interface ToolPanelProps {
  readonly tool: ToolSpec;
  readonly onChange: (next: ToolSpec) => void;
}

export function ToolPanel({ tool, onChange }: ToolPanelProps) {
  // `undefined` in a patch means "remove the key" (exactOptionalPropertyTypes-safe).
  const patch = (p: { [K in keyof ToolSpec]?: ToolSpec[K] | undefined }): void => {
    const merged = { ...tool, ...p };
    const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined));
    onChange(clean as unknown as ToolSpec);
  };

  const approvalMode = tool.needsApproval === undefined ? "off" : typeof tool.needsApproval === "boolean" ? (tool.needsApproval ? "always" : "off") : "custom";
  // Remember the last predicate so Off/Always → Predicate restores it instead of resetting.
  const [lastPredicate, setLastPredicate] = useState<string>(typeof tool.needsApproval === "object" ? tool.needsApproval.code : "(input) => true");

  return (
    <div className="panel" data-testid="tool-panel">
      <h3>
        tool <code>{tool.id}</code>
      </h3>

      <label data-testid="tool-field-name">
        Name (wire name)
        <input data-testid="tool-input-name" value={tool.name} onChange={(e) => patch({ name: e.target.value })} />
      </label>
      <label data-testid="tool-field-description">
        Description
        <textarea rows={2} data-testid="tool-input-description" value={tool.description} onChange={(e) => patch({ description: e.target.value })} />
      </label>
      <label data-testid="tool-field-input-schema">
        Input schema (zod)
        <textarea rows={3} className="mono" data-testid="tool-input-input-schema" value={tool.inputSchema.zod} onChange={(e) => patch({ inputSchema: { zod: e.target.value } })} />
      </label>
      <label data-testid="tool-field-output-schema">
        Output schema (zod, optional)
        <textarea
          rows={2}
          className="mono"
          data-testid="tool-input-output-schema"
          value={tool.outputSchema?.zod ?? ""}
          placeholder="z.object({ … })"
          onChange={(e) => patch({ outputSchema: e.target.value === "" ? undefined : { zod: e.target.value } })}
        />
      </label>
      <label data-testid="tool-field-execute">
        Execute (async function)
        <textarea rows={6} className="mono" data-testid="tool-input-execute" value={tool.execute.code} onChange={(e) => patch({ execute: { code: e.target.value } })} />
      </label>

      <section data-testid="tool-section-hitl">
        <h4>Human-in-the-loop</h4>
        <div className="seg">
          <button className={approvalMode === "off" ? "seg-on" : ""} data-testid="tool-approval-off" onClick={() => patch({ needsApproval: undefined })}>
            Off
          </button>
          <button className={approvalMode === "always" ? "seg-on" : ""} data-testid="tool-approval-always" onClick={() => patch({ needsApproval: true })}>
            Always
          </button>
          <button
            className={approvalMode === "custom" ? "seg-on" : ""}
            data-testid="tool-approval-custom"
            onClick={() => patch({ needsApproval: { code: lastPredicate } })}
          >
            Predicate
          </button>
        </div>
        {approvalMode === "custom" && typeof tool.needsApproval === "object" && (
          <label data-testid="tool-field-predicate">
            Predicate
            <input
              className="mono"
              data-testid="tool-input-predicate"
              value={tool.needsApproval.code}
              onChange={(e) => {
                setLastPredicate(e.target.value);
                patch({ needsApproval: { code: e.target.value } });
              }}
            />
          </label>
        )}
        {approvalMode !== "off" && <p className="hint">The run suspends before this tool executes; approve or reject it in the run view.</p>}
      </section>
    </div>
  );
}
