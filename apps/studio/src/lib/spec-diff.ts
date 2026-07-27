/*
 * What an AI edit would actually do to the project, as structure rather than text.
 *
 * A textual diff of generated code is the wrong abstraction here: `orderDecls` moves declarations
 * around whenever references change, so a line diff would show churn the user did not ask for and
 * cannot act on. Matching decls by id and comparing named fields shows the change the user made,
 * not the regeneration that followed it — which is why pure reordering registers as no change at all.
 */
import type { ProjectDecl, ProjectSpec } from "@mithril/spec";

/** One field that differs, rendered as `before → after`. */
export interface FieldChange {
  readonly field: string;
  readonly before: string;
  readonly after: string;
}

export type SpecChange =
  | { readonly kind: "add"; readonly id: string; readonly declKind: ProjectDecl["kind"]; readonly label: string }
  | { readonly kind: "remove"; readonly id: string; readonly declKind: ProjectDecl["kind"]; readonly label: string }
  | { readonly kind: "update"; readonly id: string; readonly declKind: ProjectDecl["kind"]; readonly fields: readonly FieldChange[] }
  | { readonly kind: "entry"; readonly before: string; readonly after: string };

/** A one-line description of a decl, for add/remove rows. */
function label(d: ProjectDecl): string {
  if (d.kind === "tool") return d.description;
  if (d.kind === "agent") return typeof d.instructions === "string" ? d.instructions : "(instructions are code)";
  if (d.kind === "subAgentTool") return `delegates to ${d.agentId} — ${d.description}`;
  if (d.kind === "workflow") return `${d.steps.length} steps`;
  return d.code;
}

/** The comparable fields of a decl, keyed by the name shown in the plan. */
function fieldsOf(d: ProjectDecl): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  if (d.kind === "tool") {
    out.set("name", d.name);
    out.set("description", d.description);
    out.set("inputs", d.inputSchema.zod);
    out.set("body", d.execute.code);
    if (d.outputSchema !== undefined) out.set("output", d.outputSchema.zod);
    if (d.needsApproval !== undefined) out.set("approval", typeof d.needsApproval === "boolean" ? String(d.needsApproval) : d.needsApproval.code);
  } else if (d.kind === "agent") {
    out.set("model", JSON.stringify(d.model));
    out.set("instructions", typeof d.instructions === "string" ? d.instructions : d.instructions.code);
    // Order within `tools` is attachment order, not meaning — a reshuffle is not a change.
    out.set("tools", [...d.tools].sort().join(", "));
    if (d.output !== undefined) out.set("output", d.output.zod);
  } else if (d.kind === "subAgentTool") {
    out.set("name", d.name);
    out.set("description", d.description);
    out.set("delegates to", d.agentId);
    if (d.input !== undefined) out.set("input", d.input.zod);
  } else if (d.kind === "opaque") {
    out.set("code", d.code);
  } else {
    out.set("steps", d.steps.map((s) => s.name).join(", "));
    out.set("start", d.start);
  }
  return out;
}

/**
 * Compare two specs and describe the difference.
 *
 * @returns the changes, most structural first (adds, removes, updates, then the entry point). An
 * empty array means the two specs are equivalent — including when their decls are merely in a
 * different order.
 *
 * @example
 * ```ts
 * planChanges(before, after); // [{ kind: "add", id: "refund_order", declKind: "tool", label: "…" }]
 * ```
 */
export function planChanges(before: ProjectSpec, after: ProjectSpec): readonly SpecChange[] {
  const was = new Map(before.decls.map((d) => [d.id, d]));
  const now = new Map(after.decls.map((d) => [d.id, d]));

  const added: SpecChange[] = after.decls.filter((d) => !was.has(d.id)).map((d) => ({ kind: "add", id: d.id, declKind: d.kind, label: label(d) }));
  const removed: SpecChange[] = before.decls.filter((d) => !now.has(d.id)).map((d) => ({ kind: "remove", id: d.id, declKind: d.kind, label: label(d) }));

  const updated: SpecChange[] = [];
  for (const [id, next] of now) {
    const prev = was.get(id);
    if (prev === undefined) continue;
    // A decl whose kind changed reads as a replacement, which is what the two rows will say.
    if (prev.kind !== next.kind) {
      removed.push({ kind: "remove", id, declKind: prev.kind, label: label(prev) });
      added.push({ kind: "add", id, declKind: next.kind, label: label(next) });
      continue;
    }
    const a = fieldsOf(prev);
    const b = fieldsOf(next);
    const fields = [...new Set([...a.keys(), ...b.keys()])].flatMap((field) => {
      const beforeValue = a.get(field) ?? "";
      const afterValue = b.get(field) ?? "";
      return beforeValue === afterValue ? [] : [{ field, before: beforeValue, after: afterValue }];
    });
    if (fields.length > 0) updated.push({ kind: "update", id, declKind: next.kind, fields });
  }

  const entry: SpecChange[] =
    before.entry.target === after.entry.target ? [] : [{ kind: "entry", before: before.entry.target, after: after.entry.target }];

  return [...added, ...removed, ...updated, ...entry];
}

/** A short human sentence for one change — the plan's row heading. */
export function describeChange(c: SpecChange): string {
  if (c.kind === "add") return `Add ${c.declKind === "subAgentTool" ? "sub-agent" : c.declKind} ${c.id}`;
  if (c.kind === "remove") return `Remove ${c.declKind === "subAgentTool" ? "sub-agent" : c.declKind} ${c.id}`;
  if (c.kind === "entry") return `The run starts at ${c.after} instead of ${c.before}`;
  return `Change ${c.id} — ${c.fields.map((f) => f.field).join(", ")}`;
}
