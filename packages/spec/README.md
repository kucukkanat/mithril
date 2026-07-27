# @mithril/spec

A **serializable project spec** for Mithril agents: JSON in, real runnable TypeScript out — and back.

This is what makes Studio's two-way code view work. A spec is a structured skeleton of framework-shaped
declarations; everything *behavioral* — tool bodies, dynamic instructions, schemas — is stored as
TypeScript source in verbatim `CodeRegion`s, because core deliberately never deserializes behavior.

Generated code is the **only** execution path. There is no interpreter: `generateProject` emits real code
that imports the real packages, and that code is what runs.

## Usage

### Spec → code

```ts
import { generateProject, SPEC_VERSION, type ProjectSpec } from "@mithril/spec";

const spec: ProjectSpec = {
  specVersion: SPEC_VERSION,
  name: "weather-bot",
  decls: [
    {
      kind: "tool",
      id: "weather",
      name: "weather",
      description: "Current weather for a city.",
      inputSchema: { zod: `z.object({ city: z.string() })` },
      execute: { code: `async ({ city }) => ({ city, tempC: 21 })` },
    },
    {
      kind: "agent",
      id: "assistant",
      model: { kind: "live", provider: "anthropic", model: "claude-3-5-haiku-latest" },
      instructions: "You are a concise weather assistant.",
      tools: ["weather"],
    },
  ],
  entry: { target: "assistant", input: "What's the weather in Istanbul?" },
};

console.log(generateProject(spec, { mode: "export" }));
```

emits exactly:

```ts
import { agent, tool } from "mithril";
import { anthropic } from "mithril/anthropic";
import { z } from "zod";

const weather = tool({
  name: "weather",
  description: "Current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, tempC: 21 }),
});

const assistant = agent({
  model: anthropic("claude-3-5-haiku-latest"),
  instructions: "You are a concise weather assistant.",
  tools: [weather],
});

async function main() {
  const result = await assistant.run("What's the weather in Istanbul?");
  if (result.status === "completed") console.log(result.output);
  else console.error(result);
}

await main();
```

Two modes: `"export"` (above) emits a standalone `main()` for a project you download and run with Bun or
Node; `"studio"` (the default) emits `await run(entry, input)` against `@mithril/runner-web`'s injected
runner global. Codegen is **deterministic** — the same spec always yields byte-identical output.

### Code → spec

The parser lives on the `./parse` subpath and takes the TypeScript compiler **as an argument**, so
`typescript` never enters a bundle through this package:

```ts
import * as ts from "typescript";
import { parseProject } from "@mithril/spec/parse";

const { spec, diagnostics, opaqueCount } = parseProject(source, ts, prev);
```

`prev` carries what code cannot express (the project `name`, `meta`), so pass the spec you generated from.
The load-bearing invariant, covered by the test suite:

```ts
parseProject(generateProject(s), ts, s).spec  // deep-equals s
```

### Hand edits degrade losslessly

Statements the parser doesn't recognize are **not** dropped — they become opaque verbatim declarations and
survive the next codegen unchanged:

```ts
// user adds `const RETRIES = 3;` by hand, then:
const { spec, opaqueCount } = parseProject(edited, ts, prev);
// opaqueCount → 1
// spec.decls includes { kind: "opaque", id: "o1", code: "const RETRIES = 3;" }

generateProject(spec); // still contains `const RETRIES = 3;`
```

That is why the code view is safe to edit: round-tripping through the structured panels never eats your
code.

### Versioning

```ts
import { migrateProject, SpecFormatError } from "@mithril/spec";

try {
  const spec = migrateProject(JSON.parse(saved)); // validates + upgrades to SPEC_VERSION
} catch (e) {
  if (e instanceof SpecFormatError) console.error(e.reason); // "newer" | "malformed"
}
```

## API

**Codegen** (`@mithril/spec`) — `generateProject(spec, { mode? }): string` · `modelExpr` · `providerOf` ·
`providerImportEntries` · `toolDeclSource` · `GROQ_PROVIDER_DECL` · `SPEC_VERSION`
**Migration** — `migrateProject(raw): ProjectSpec` · `SpecFormatError` (`.reason`)
**Parser** (`@mithril/spec/parse`) — `parseProject(source, ts, prev?): ParseResult`
**Types** — `ProjectSpec`, `ProjectDecl`, `AgentSpec`, `ToolSpec`, `SubAgentToolSpec`, `WorkflowSpec`,
`WorkflowStepSpec`, `WorkflowRoute`, `EntrySpec`, `EntryMessage`, `ModelSpec`, `SchemaSpec`, `CodeRegion`,
`OpaqueDecl`, `SpecMeta`, `LiveProviderName`, `CodegenMode`, `GenerateOptions`, `ParseResult`,
`ParseDiagnostic`.

> This entry is zero-dependency (types + codegen + migration). Only the `./parse` subpath needs a
> TypeScript compiler, and you supply it.
