---
editUrl: false
next: false
prev: false
title: "narrow"
---

```ts
function narrow<Tools>(e, tools): e is EventMeta & { callId: string; input: JsonValue; name: string; type: "tool.call"; version?: string } & ToolCallFor<Tools>;
```

Defined in: packages/core/src/protocol/narrow.ts:44

Type-predicate that narrows an event to a `tool.call` for one of `tools`.

## Type Parameters

| Type Parameter |
| ------ |
| `Tools` *extends* readonly [`AnyTool`](/reference/core/protocol/type-aliases/anytool/)\<`unknown`\>[] |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `e` | [`MithrilEvent`](/reference/core/protocol/type-aliases/mithrilevent/) | Any [MithrilEvent](/reference/core/protocol/type-aliases/mithrilevent/). |
| `tools` | `Tools` | The concrete tool tuple to match against (pass as `const`). |

## Returns

`e is EventMeta & { callId: string; input: JsonValue; name: string; type: "tool.call"; version?: string } & ToolCallFor<Tools>`

`true` when `e` is a `tool.call` whose `name` matches a tool in
`tools`, narrowing `e` to [EventOf](/reference/core/protocol/type-aliases/eventof/)`<'tool.call'>` intersected with
[ToolCallFor](/reference/core/protocol/type-aliases/toolcallfor/)`<Tools>` — i.e. `input` typed per the matched tool.

## Example

```ts
if (narrow(e, tools)) {
  // e.name and e.input are correlated to the matched tool
  switch (e.name) {  }
}
```
