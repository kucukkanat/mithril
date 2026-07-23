---
editUrl: false
next: false
prev: false
title: "generateEvalRun"
---

```ts
function generateEvalRun(spec, opts): string;
```

Defined in: packages/spec/src/evalgen.ts:110

Generate a complete, runnable eval-suite script from a project spec, a suite, and a set of models.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | [`ProjectSpec`](/reference/spec/index/interfaces/projectspec/) | the project; its [EntrySpec.target](/reference/spec/index/interfaces/entryspec/#target) must be an agent (single-agent evals for now). |
| `opts` | [`GenerateEvalOptions`](/reference/spec/index/interfaces/generateevaloptions/) | [GenerateEvalOptions](/reference/spec/index/interfaces/generateevaloptions/): the `suiteId`, the `models` matrix, and the codegen `mode`. |

## Returns

`string`

TypeScript source. In `"studio"` mode it calls `runSuite(..., { onRun: (run) => emit(run) })` so a
  host collects each SuiteRun off the runner's data channel; in `"export"` mode it writes
  `evals.html` and sets a non-zero `process.exitCode` on failure.

## Throws

when the suite id is unknown, no models are given, or the entry target is not an agent.

## Example

```ts
const code = generateEvalRun(spec, { suiteId: "smoke", models: [{ kind: "live", provider: "openai", model: "gpt-4o-mini" }] });
```
