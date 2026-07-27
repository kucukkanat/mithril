---
editUrl: false
next: false
prev: false
title: "generateProject"
---

```ts
function generateProject(spec, opts?): string;
```

Defined in: [packages/spec/src/codegen.ts:265](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/spec/src/codegen.ts#L265)

Generate the complete TypeScript source for a project. Deterministic: the same spec always
yields byte-identical output, and [parseProject](https://mithril.dev) recognizes exactly
this shape (plus arbitrary hand edits, which degrade losslessly to opaque regions).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`ProjectSpec`](/mithril/reference/spec/index/interfaces/projectspec/) |
| `opts?` | [`GenerateOptions`](/mithril/reference/spec/index/interfaces/generateoptions/) |

## Returns

`string`
