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

Defined in: [index.ts:170](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/create-mithril/src/index.ts#L170)

Write a scaffolded template to disk under `dir`, creating parent directories as needed.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | [`Template`](/reference/create-mithril/type-aliases/template/) | Which starter to generate. |
| `appName` | `string` | Package name embedded in the generated files. |
| `dir` | `string` | Target directory the files are written under. |

## Returns

`Promise`\<readonly `string`[]\>

The relative paths written, in generation order.

## Remarks

Server-only (`node:fs/promises`). Thin I/O wrapper around [scaffold](/reference/create-mithril/functions/scaffold/).
