---
editUrl: false
next: false
prev: false
title: "migrateProject"
---

```ts
function migrateProject(raw): ProjectSpec;
```

Defined in: [packages/spec/src/migrate.ts:27](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/migrate.ts#L27)

Validate (and, once v2+ exists, upgrade) a raw parsed-JSON value into a [ProjectSpec](/reference/spec/index/interfaces/projectspec/).
Throws [SpecFormatError](/reference/spec/index/classes/specformaterror/) on anything it cannot understand — never returns a guess.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `unknown` |

## Returns

[`ProjectSpec`](/reference/spec/index/interfaces/projectspec/)
