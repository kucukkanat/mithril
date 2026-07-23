---
editUrl: false
next: false
prev: false
title: "generateProject"
---

```ts
function generateProject(spec, opts?): string;
```

Defined in: packages/spec/src/codegen.ts:245

Generate the complete TypeScript source for a project. Deterministic: the same spec always
yields byte-identical output, and [parseProject](https://mithril.dev) recognizes exactly
this shape (plus arbitrary hand edits, which degrade losslessly to opaque regions).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`ProjectSpec`](/reference/spec/index/interfaces/projectspec/) |
| `opts?` | [`GenerateOptions`](/reference/spec/index/interfaces/generateoptions/) |

## Returns

`string`
