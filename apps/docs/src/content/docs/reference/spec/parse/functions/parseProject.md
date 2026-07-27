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

Defined in: [packages/spec/src/parse.ts:405](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/parse.ts#L405)

Parse a whole source file into a [ProjectSpec](/mithril/reference/spec/index/interfaces/projectspec/). `prev` carries what code cannot express —
the project `name` and canvas `meta` — forward across reparses.

The round-trip invariant: for any spec `s`, `parseProject(generateProject(s), ts, s).spec`
deep-equals `s` — for tool, agent, sub-agent (`asTool`), entry and opaque decls. A workflow decl
still degrades to opaque, which is lossless in code but not yet structured.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `ts` | *typeof* `ts` |
| `prev?` | [`ProjectSpec`](/mithril/reference/spec/index/interfaces/projectspec/) |

## Returns

[`ParseResult`](/mithril/reference/spec/parse/interfaces/parseresult/)
