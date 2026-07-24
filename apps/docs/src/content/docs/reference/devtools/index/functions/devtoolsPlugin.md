---
editUrl: false
next: false
prev: false
title: "devtoolsPlugin"
---

```ts
function devtoolsPlugin(inspector?): Plugin<unknown, readonly AnyTool<unknown>[]> & {
  inspector: Inspector;
};
```

Defined in: [packages/devtools/src/index.ts:133](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/devtools/src/index.ts#L133)

Bundle an [Inspector](/mithril/reference/devtools/index/interfaces/inspector/) as a Plugin for an agent's `use:` array.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `inspector` | [`Inspector`](/mithril/reference/devtools/index/interfaces/inspector/) | an existing inspector; a fresh one is created (and returned on `.inspector`) if omitted. |

## Returns

`Plugin`\<`unknown`, readonly `AnyTool`\<`unknown`\>[]\> & \{
  `inspector`: [`Inspector`](/mithril/reference/devtools/index/interfaces/inspector/);
\}

a `Plugin` whose `consumers` include the inspector, with the inspector exposed on `.inspector`.

## Example

```ts
const dev = devtoolsPlugin();
const a = agent({ model, instructions: "…", use: [dev] });
await a.run("hi");
dev.inspector.latest(); // the captured run
```
