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

Defined in: [packages/spec/src/parse.ts:358](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/spec/src/parse.ts#L358)

Parse a whole source file into a [ProjectSpec](/mithril/reference/spec/index/interfaces/projectspec/). `prev` carries what code cannot express —
the project `name` and canvas `meta` — forward across reparses.

The round-trip invariant: for any spec `s`, `parseProject(generateProject(s), ts, s).spec`
deep-equals `s` (M1: for tool/agent/entry/opaque decls).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `ts` | *typeof* `ts` |
| `prev?` | [`ProjectSpec`](/mithril/reference/spec/index/interfaces/projectspec/) |

## Returns

[`ParseResult`](/mithril/reference/spec/parse/interfaces/parseresult/)
