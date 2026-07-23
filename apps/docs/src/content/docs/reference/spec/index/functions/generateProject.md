---
editUrl: false
next: false
prev: false
title: "generateProject"
---

```ts
function generateProject(spec, opts?): string;
```

Defined in: [packages/spec/src/codegen.ts:244](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/codegen.ts#L244)

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
