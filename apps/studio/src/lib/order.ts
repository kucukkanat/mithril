/*
 * Declaration ordering — the invariant that keeps generated code runnable.
 *
 * `decls` order IS statement order in the generated file (codegen is deliberately faithful), and
 * every generated declaration is a `const`. So a decl emitted before one it references is a
 * temporal-dead-zone crash at RUN time ("Cannot access 'tool1' before initialization") — not
 * something the code view's parse can flag, because the code is perfectly valid TypeScript.
 *
 * Nothing in the Designer maintains that order on its own: `addDecl` appends, and the rail groups
 * rows by owner rather than by statement order, so a tool added after its agent stays after it. This
 * restores the invariant on every spec edit instead of asking each mutation to remember.
 *
 * The sort only ever moves a decl EARLIER, to just above its first dependent, and only after its own
 * dependencies are placed. Nothing is pushed later, so a decl can never lose access to something
 * that used to precede it — which is what makes this safe to run over hand-written opaque code.
 */
import type { ProjectDecl, ProjectSpec } from "@mithril/spec";

/** Top-level bindings an opaque statement introduces — the names the rest of the file can reference. */
const BINDER = /(?:^|\n)\s*(?:export\s+)?(?:const|let|var|function\*?|async function\*?|class)\s+([A-Za-z_$][\w$]*)/g;

/** Every name a decl brings into scope: its const id, or — for opaque code — whatever it declares. */
function bindingsOf(d: ProjectDecl): readonly string[] {
  if (d.kind !== "opaque") return [d.id];
  return [...d.code.matchAll(BINDER)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]));
}

/** Ids referenced by a decl's own structure — the edges the spec states outright. */
function structuralRefs(d: ProjectDecl): readonly string[] {
  if (d.kind === "agent") return d.tools;
  if (d.kind === "subAgentTool") return [d.agentId];
  return [];
}

/**
 * The source a decl evaluates AS IT INITIALIZES.
 *
 * Function bodies are excluded on purpose: `execute`, an instructions function and a workflow step
 * all run long after the file is evaluated, so a tool whose body calls an agent declared below it is
 * legal. Treating those as dependencies would invent cycles (agent → tool → agent) out of code that
 * works fine.
 */
function eagerCode(d: ProjectDecl): readonly string[] {
  switch (d.kind) {
    case "tool":
      return [d.inputSchema.zod, ...(d.outputSchema === undefined ? [] : [d.outputSchema.zod])];
    case "agent":
      return [
        ...(d.model.kind === "code" ? [d.model.expr.code] : []),
        ...(d.output === undefined ? [] : [d.output.zod]),
        ...(d.healing === undefined || d.healing === false ? [] : d.healing.map((r) => r.code)),
        ...(d.use ?? []).map((r) => r.code),
      ];
    case "subAgentTool":
      return d.input === undefined ? [] : [d.input.zod];
    case "workflow":
      return [];
    case "opaque":
      // Unanalyzable, so the whole statement counts as eager. Over-constraining an opaque decl is
      // free here: it is never itself lifted, so its edges only ever hold its dependencies above it.
      return [d.code];
  }
}

/** A decl that declares a name, and the matcher for a standalone mention of that name. */
interface Binding {
  readonly decl: ProjectDecl;
  readonly re: RegExp;
}

/**
 * Reorder `decls` so every declaration follows the ones it needs at initialization time.
 *
 * Stable: a decl moves only when something above it references it, and then only as far up as that
 * reference. A dependency cycle (which no generated code can produce) is left in its original
 * relative order rather than throwing — a wrong order is recoverable, a crashed Designer is not.
 *
 * @returns the same spec object when the order is already correct, so a no-op edit stays a no-op.
 *
 * @example
 * ```ts
 * // agent1 lists tool1, but tool1 was appended after it — codegen would emit a TDZ crash.
 * orderDecls(spec).decls.map((d) => d.id); // ["tool1", "agent1"]
 * ```
 */
export function orderDecls(spec: ProjectSpec): ProjectSpec {
  // First declaration of an id wins, matching JS scope: a redeclaration below it is unreachable.
  const byId = new Map<string, ProjectDecl>();
  for (const d of spec.decls) if (!byId.has(d.id)) byId.set(d.id, d);
  const bindings: readonly Binding[] = spec.decls.flatMap((d) =>
    bindingsOf(d).map((name) => ({ decl: d, re: new RegExp(`(^|[^\\w$.])${name}\\b`) })),
  );

  const refsOf = (d: ProjectDecl): readonly ProjectDecl[] => {
    const refs = new Set<ProjectDecl>();
    for (const id of structuralRefs(d)) {
      const dep = byId.get(id);
      if (dep !== undefined && dep !== d) refs.add(dep);
    }
    const code = eagerCode(d).join("\n");
    if (code.length > 0) for (const b of bindings) if (b.decl !== d && b.re.test(code)) refs.add(b.decl);
    return [...refs];
  };

  const ordered: ProjectDecl[] = [];
  const placed = new Set<ProjectDecl>();

  // Depth-first, dependencies before dependents, walking the decls in their existing order — the
  // post-order emit IS the lift. Tracked by identity, not id, so a duplicated id can never make one
  // of the two decls vanish from the output. `open` guards a cycle: the member already on the stack
  // keeps its own turn in the outer loop instead of recursing forever.
  const place = (d: ProjectDecl, open: ReadonlySet<ProjectDecl>): void => {
    if (placed.has(d) || open.has(d)) return;
    const nested = new Set([...open, d]);
    for (const dep of refsOf(d)) place(dep, nested);
    placed.add(d);
    ordered.push(d);
  };

  for (const d of spec.decls) place(d, new Set());

  return spec.decls.every((d, i) => ordered[i] === d) ? spec : { ...spec, decls: ordered };
}
