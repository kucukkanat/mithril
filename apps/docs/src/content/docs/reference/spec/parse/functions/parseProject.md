---
editUrl: false
next: false
prev: false
title: "parseProject"
---

```ts
function parseProject(
   source, 
   ts, 
   prev?): ParseResult;
```

Defined in: packages/spec/src/parse.ts:360

Parse a whole source file into a [ProjectSpec](/reference/spec/index/interfaces/projectspec/). `prev` carries what code cannot express —
the project `name`, `evals`, and canvas `meta` — forward across reparses.

The round-trip invariant: for any spec `s`, `parseProject(generateProject(s), ts, s).spec`
deep-equals `s` (M1: for tool/agent/entry/opaque decls).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `ts` | *typeof* `ts` |
| `prev?` | [`ProjectSpec`](/reference/spec/index/interfaces/projectspec/) |

## Returns

[`ParseResult`](/reference/spec/parse/interfaces/parseresult/)
