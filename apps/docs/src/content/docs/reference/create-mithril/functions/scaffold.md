---
editUrl: false
next: false
prev: false
title: "scaffold"
---

```ts
function scaffold(template, appName): Readonly<Record<string, string>>;
```

Defined in: [index.ts:136](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/create-mithril/src/index.ts#L136)

Generate the files for a Mithril app as an in-memory map — pure, no disk I/O.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | [`Template`](/mithril/reference/create-mithril/type-aliases/template/) | Which starter to generate. |
| `appName` | `string` | Used as the package `name` and in the generated README. |

## Returns

`Readonly`\<`Record`\<`string`, `string`\>\>

A map of relative file path to file contents.

## Remarks

Always emits `package.json`, `src/agent.ts`, and `README.md`, plus a template-specific entry: a streaming
`src/main.ts` CLI (`node-cli`), a streaming `Bun.serve` HTTP server in `src/main.ts` (`bun-server`), or a
`useRun`-wired `src/Chat.tsx` component (`react-chat`, whose `package.json` includes the React deps).
Being side-effect-free, it is trivially testable; use [createApp](/mithril/reference/create-mithril/functions/createapp/) to write the result.

## Example

```ts
const files = scaffold("bun-server", "my-agent");
Object.keys(files); // ["package.json", "src/agent.ts", "README.md", "src/main.ts"]
```
