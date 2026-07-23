/**
 * A serializable project spec for Mithril agents. The spec is a structured skeleton of
 * framework-shaped declarations — everything behavioral (tool bodies, dynamic instructions,
 * schemas) is stored as TypeScript source in verbatim {@link CodeRegion}s, because core
 * deliberately never deserializes behavior. {@link generateProject} compiles a spec to real,
 * runnable Mithril code (the ONLY execution path — there is no interpreter); `@mithril/spec/parse`
 * turns arbitrary TypeScript back into a spec, degrading unrecognized statements to lossless
 * {@link OpaqueDecl}s.
 *
 * This entry is zero-dependency (types + codegen + migration). The parser lives on the
 * `./parse` subpath and takes the TypeScript compiler as an argument, so `typescript` never
 * enters a bundle through this package.
 *
 * @packageDocumentation
 */

export {
  SPEC_VERSION,
  type AgentSpec,
  type CodeRegion,
  type EntryMessage,
  type EntrySpec,
  type ModelSpec,
  type OpaqueDecl,
  type ProjectDecl,
  type ProjectSpec,
  type SchemaSpec,
  type SpecMeta,
  type SubAgentToolSpec,
  type ToolSpec,
  type WorkflowRoute,
  type WorkflowSpec,
  type WorkflowStepSpec,
} from "./types.ts";
export { generateProject, GROQ_PROVIDER_DECL, modelExpr, providerImportEntries, providerOf, type CodegenMode, type GenerateOptions } from "./codegen.ts";
export { migrateProject, SpecFormatError } from "./migrate.ts";
