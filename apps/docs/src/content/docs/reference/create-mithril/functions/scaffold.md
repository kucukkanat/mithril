---
editUrl: false
next: false
prev: false
title: "scaffold"
---

```ts
function scaffold(template, appName): Readonly<Record<string, string>>;
```

Defined in: index.ts:54

Generate the files for a Mithril app as an in-memory map — pure, no disk I/O.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | [`Template`](/reference/create-mithril/type-aliases/template/) | Which starter to generate. |
| `appName` | `string` | Used as the package `name` and in the generated README. |

## Returns

`Readonly`\<`Record`\<`string`, `string`\>\>

A map of relative file path to file contents.

## Remarks

Always emits `package.json`, `src/agent.ts`, `README.md`, and a `src/main.ts` whose contents depend
on `template`. Being side-effect-free, it is trivially testable; use [createApp](/reference/create-mithril/functions/createapp/) to write the result.

## Example

```ts
const files = scaffold("node-cli", "my-agent");
Object.keys(files); // ["package.json", "src/agent.ts", "README.md", "src/main.ts"]
```
