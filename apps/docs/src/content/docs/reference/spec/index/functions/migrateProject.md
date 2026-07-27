---
editUrl: false
next: false
prev: false
title: "migrateProject"
---

```ts
function migrateProject(raw): ProjectSpec;
```

Defined in: [packages/spec/src/migrate.ts:27](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/migrate.ts#L27)

Validate (and, once v2+ exists, upgrade) a raw parsed-JSON value into a [ProjectSpec](/mithril/reference/spec/index/interfaces/projectspec/).
Throws [SpecFormatError](/mithril/reference/spec/index/classes/specformaterror/) on anything it cannot understand — never returns a guess.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `unknown` |

## Returns

[`ProjectSpec`](/mithril/reference/spec/index/interfaces/projectspec/)
