---
editUrl: false
next: false
prev: false
title: "Tool"
---

Defined in: [packages/core/src/protocol/tool.ts:27](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L27)

A typed tool: Standard Schema in/out plus typed dependency injection.

## Remarks

`In`/`Out` are the already-resolved type parameters; the `tool()` factory
recovers them from the schema and `execute` signature. `execute` may return a
promise or an AsyncGenerator that yields [ToolProgress](/mithril/reference/core/protocol/interfaces/toolprogress/) and
returns the final output.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Name` *extends* `string` | The tool's literal name. |
| `In` | The validated input type (recovered from `inputSchema`). |
| `Out` | The output type (recovered from `execute`/`outputSchema`). |
| `Deps` | The dependencies injected via [RunContext](/mithril/reference/core/protocol/interfaces/runcontext/). |

## Properties

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/protocol/tool.ts:29](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L29)

***

### examples?

```ts
readonly optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/protocol/tool.ts:42](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L42)

Optional few-shot example inputs, surfaced into the tool's wire description. A handful of concrete
example calls is the single strongest prompt-side lift for small models' tool-call reliability.

***

### inputSchema

```ts
readonly inputSchema: StandardSchemaV1<unknown, In>;
```

Defined in: [packages/core/src/protocol/tool.ts:43](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L43)

***

### name

```ts
readonly name: Name;
```

Defined in: [packages/core/src/protocol/tool.ts:28](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L28)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean | ((input, ctx) => boolean | Promise<boolean>);
```

Defined in: [packages/core/src/protocol/tool.ts:46](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L46)

Whether the call requires human approval; a predicate can decide per-input.

***

### outputSchema?

```ts
readonly optional outputSchema?: StandardSchemaV1<unknown, JsonSafe<Out>>;
```

Defined in: [packages/core/src/protocol/tool.ts:44](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L44)

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: [packages/core/src/protocol/tool.ts:58](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L58)

Wall-clock budget for a single `execute`, in milliseconds. Exceeding it produces a `tool.error`
classified `"timeout"`.

#### Remarks

Bounds `execute` only — not the surrounding tool middleware — so a middleware that retries gets a
fresh budget per attempt. While it runs, `ctx.signal` is a *per-call* signal that aborts on expiry
(and still forwards the run's own abort), so a well-behaved tool can unwind cooperatively. The loop
can stop **waiting** on a tool but cannot force one to stop: a tool that ignores `ctx.signal` keeps
running detached, it merely no longer affects the run. Omit for no budget.

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool.ts:37](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L37)

Optional version, stamped onto every `tool.call` event this tool produces.

#### Remarks

Recorded for observability only — the loop does not compare it against anything, so a stored
run resumed after a tool changed will NOT report drift. Consuming the stamped value to detect that is
left to the caller.

## Methods

### execute()

```ts
execute(input, ctx): 
  | Promise<
  | JsonSafe<Out>
  | Suspend<JsonSafe<Out>>>
  | AsyncGenerator<ToolProgress, 
  | JsonSafe<Out>
| Suspend<JsonSafe<Out>>, any>;
```

Defined in: [packages/core/src/protocol/tool.ts:59](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool.ts#L59)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `In` |
| `ctx` | [`RunContext`](/mithril/reference/core/protocol/interfaces/runcontext/)\<`Deps`\> |

#### Returns

  \| `Promise`\<
  \| [`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>\>
  \| `AsyncGenerator`\<[`ToolProgress`](/mithril/reference/core/protocol/interfaces/toolprogress/), 
  \| [`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>
  \| [`Suspend`](/mithril/reference/core/protocol/interfaces/suspend/)\<[`JsonSafe`](/mithril/reference/core/protocol/type-aliases/jsonsafe/)\<`Out`\>\>, `any`\>
