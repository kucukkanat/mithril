---
editUrl: false
next: false
prev: false
title: "createApp"
---

```ts
function createApp(
   template, 
   appName, 
dir): Promise<readonly string[]>;
```

Defined in: [index.ts:170](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/create-mithril/src/index.ts#L170)

Write a scaffolded template to disk under `dir`, creating parent directories as needed.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | [`Template`](/mithril/reference/create-mithril/type-aliases/template/) | Which starter to generate. |
| `appName` | `string` | Package name embedded in the generated files. |
| `dir` | `string` | Target directory the files are written under. |

## Returns

`Promise`\<readonly `string`[]\>

The relative paths written, in generation order.

## Remarks

Server-only (`node:fs/promises`). Thin I/O wrapper around [scaffold](/mithril/reference/create-mithril/functions/scaffold/).
