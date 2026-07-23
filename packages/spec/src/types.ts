/*
 * The serializable project spec. Design principle (mirroring core's "agents are code-only;
 * nothing is deserialized into behavior"): everything BEHAVIORAL is stored as TypeScript source
 * inside a CodeRegion; the spec is a structured skeleton of framework-shaped declarations. Codegen
 * (generateProject) is the only execution path — a spec never "runs", its generated code does.
 */

/** Verbatim TypeScript preserved losslessly through spec→code→spec round-trips. */
export interface CodeRegion {
  readonly code: string;
}

/**
 * A top-level statement the parser did not recognize as a framework-shaped declaration. Kept
 * byte-identical (including leading comments) so hand-written code survives round-trips — the
 * safe default is always "preserve verbatim", never "drop or rewrite".
 */
export interface OpaqueDecl {
  readonly kind: "opaque";
  /** Stable synthetic id (`o1`, `o2`, …) — usable as a canvas node id. */
  readonly id: string;
  /** The full original statement text. */
  readonly code: string;
}

/** How an agent's `model` is produced in generated code. */
export type ModelSpec =
  /** A remote BYOK provider call, e.g. `openai("gpt-4o-mini")`. */
  | { readonly kind: "live"; readonly provider: "openai" | "anthropic" | "google" | "groq"; readonly model: string }
  /** An on-device Transformers.js model, e.g. `transformers("onnx-community/Qwen3-0.6B-ONNX")`. */
  | { readonly kind: "local"; readonly model: string; readonly dtype?: string }
  /** Escape hatch: an arbitrary `ModelInput` expression, stored verbatim. */
  | { readonly kind: "code"; readonly expr: CodeRegion };

/**
 * A schema stored as zod SOURCE (e.g. `z.object({ city: z.string() })`), not JSON Schema.
 * Rationale: core takes any Standard Schema, so zod source is exactly what generated code needs
 * (codegen is the identity); and zod→JSON-Schema conversion is lossy (`.refine`/`.transform`/
 * `.describe` chains don't map), which would break the lossless round-trip guarantee.
 */
export interface SchemaSpec {
  readonly zod: string;
}

/** A `const <id> = tool({ … })` declaration. */
export interface ToolSpec {
  readonly kind: "tool";
  /** The const identifier in generated code — also the graph-node id. */
  readonly id: string;
  /** The wire name (`ToolDef.name`). */
  readonly name: string;
  readonly description: string;
  readonly inputSchema: SchemaSpec;
  readonly outputSchema?: SchemaSpec;
  readonly examples?: readonly unknown[];
  /** `true`/`false` literal, or a predicate function stored verbatim. */
  readonly needsApproval?: boolean | CodeRegion;
  /** The `execute` function (arrow or method form), stored verbatim. */
  readonly execute: CodeRegion;
  /** Provenance id when materialized from a built-in library template. */
  readonly builtin?: string;
}

/** A `const <id> = agent({ … })` declaration. Field order mirrors core's `AgentConfig`. */
export interface AgentSpec {
  readonly kind: "agent";
  readonly id: string;
  readonly model: ModelSpec;
  /** A static string, or an instructions function of `ctx` stored verbatim. */
  readonly instructions: string | CodeRegion;
  /** Ids of ToolSpec / SubAgentToolSpec decls, in attachment order. */
  readonly tools: readonly string[];
  /** Structured output schema. */
  readonly output?: SchemaSpec;
  readonly maxSteps?: number;
  readonly maxTokens?: number;
  readonly maxCostMicroUsd?: number;
  /** Self-healing stack: `false` for a raw loop, or middleware expressions (`healing.*`) stored verbatim. */
  readonly healing?: false | readonly CodeRegion[];
  /** Middleware / plugin expressions (`use: […]`), each stored verbatim. */
  readonly use?: readonly CodeRegion[];
}

/** A `const <id> = asTool(<agentId>, { … })` declaration — a sub-agent exposed as a parent's tool. */
export interface SubAgentToolSpec {
  readonly kind: "subAgentTool";
  readonly id: string;
  /** The child AgentSpec's decl id. */
  readonly agentId: string;
  readonly name: string;
  readonly description: string;
  /** The `AsToolOptions.inputSchema`, when present. */
  readonly input?: SchemaSpec;
}

/** Where a workflow step routes next. */
export type WorkflowRoute = { readonly goto: string } | { readonly done: true };

/** One step of a `defineWorkflow` — declarative shapes compile to real `goto`/`done` code. */
export type WorkflowStepSpec =
  | {
      readonly kind: "agentStep";
      readonly name: string;
      readonly agentId: string;
      /** `(state) => run input`, stored verbatim. */
      readonly inputExpr: CodeRegion;
      /** `(state, output) => next state`, stored verbatim. */
      readonly assign: CodeRegion;
      readonly next: WorkflowRoute;
    }
  | {
      readonly kind: "branch";
      readonly name: string;
      readonly branches: readonly { readonly when: CodeRegion; readonly then: WorkflowRoute }[];
      readonly otherwise: WorkflowRoute;
    }
  /** Escape hatch: the whole step function stored verbatim. */
  | { readonly kind: "code"; readonly name: string; readonly body: CodeRegion };

/** A `const <id> = defineWorkflow({ … }, { start })` declaration. */
export interface WorkflowSpec {
  readonly kind: "workflow";
  readonly id: string;
  /** An adjacent `interface`/`type` declaration for the state shape, stored verbatim. */
  readonly stateType?: CodeRegion;
  readonly steps: readonly WorkflowStepSpec[];
  readonly start: string;
  readonly maxSteps?: number;
}

/** A chat message in an entry input. */
export interface EntryMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** What the generated file executes: `await run(<target>, <input>)`. */
export interface EntrySpec {
  /** Id of an AgentSpec (or, M3+, a WorkflowSpec). */
  readonly target: string;
  readonly input: string | readonly EntryMessage[];
  /** Initial state expression for workflow entries, stored verbatim. */
  readonly initialState?: CodeRegion;
}

/** Studio-only presentation data — codegen ignores it entirely. */
export interface SpecMeta {
  /** Canvas node positions, keyed by decl id. */
  readonly layout?: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
}

/** Any top-level declaration in a project, in statement order. */
export type ProjectDecl = ToolSpec | AgentSpec | SubAgentToolSpec | WorkflowSpec | OpaqueDecl;

/** The current spec format version — bump with a migration step in `migrateProject`. */
export const SPEC_VERSION = 1;

/**
 * A whole serializable project: an ordered list of declarations plus the entry to run.
 * Statement order in the generated file equals `decls` order, which is what makes
 * spec→code→spec round-trips lossless.
 */
export interface ProjectSpec {
  readonly specVersion: typeof SPEC_VERSION;
  readonly name: string;
  readonly decls: readonly ProjectDecl[];
  readonly entry: EntrySpec;
  readonly meta?: SpecMeta;
}
