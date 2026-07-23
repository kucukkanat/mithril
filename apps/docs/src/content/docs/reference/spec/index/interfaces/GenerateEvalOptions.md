---
editUrl: false
next: false
prev: false
title: "GenerateEvalOptions"
---

Defined in: packages/spec/src/evalgen.ts:14

Options for [generateEvalRun](/reference/spec/index/functions/generateevalrun/).

## Properties

### mode?

```ts
readonly optional mode?: CodegenMode;
```

Defined in: packages/spec/src/evalgen.ts:20

`"studio"` (default) streams results via `emit()`; `"export"` writes an htmlReport + sets `process.exitCode`.

***

### models

```ts
readonly models: readonly ModelSpec[];
```

Defined in: packages/spec/src/evalgen.ts:18

The matrix axis — each model becomes one suite entry with the entry agent's model swapped in.

***

### suiteId

```ts
readonly suiteId: string;
```

Defined in: packages/spec/src/evalgen.ts:16

The [EvalSuiteSpec.id](/reference/spec/index/interfaces/evalsuitespec/#id) to run.
