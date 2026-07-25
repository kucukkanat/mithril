---
editUrl: false
next: false
prev: false
title: "ScriptOptions"
---

Defined in: script.ts:32

Configuration for Tier-2 script bodies.

## Properties

### allowLocalRunner?

```ts
readonly optional allowLocalRunner?: boolean;
```

Defined in: script.ts:57

Acknowledge that a non-`"remote"` runner is **isolation, not security**.

#### Remarks

Required for any runner whose `isolation` is not `"remote"`. Both local backends give a clean
scope, not a defence against hostile code; this flag makes accepting that a deliberate, visible choice.

***

### defaultTimeoutMs?

```ts
readonly optional defaultTimeoutMs?: number;
```

Defined in: script.ts:41

Budget for one script, when the definition names none (default 1000ms).

***

### globals?

```ts
readonly optional globals?: (ctx) => Readonly<Record<string, unknown>>;
```

Defined in: script.ts:50

Extra globals the body may read, derived per call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | `RunContext`\<`unknown`\> |

#### Returns

`Readonly`\<`Record`\<`string`, `unknown`\>\>

#### Remarks

The default world has no network. Adding `fetch` here re-opens the exfiltration channel that closed
world exists to remove — scope it (an allowlisted wrapper), don't hand over the global. Values cross a
serialization boundary, so they must be data, not functions.

***

### runner

```ts
readonly runner: CodeRunner;
```

Defined in: script.ts:34

Where scripts execute. `remoteRunner` for untrusted code; a local runner needs `allowLocalRunner`.

***

### transpile?

```ts
readonly optional transpile?: (source) => string;
```

Defined in: script.ts:39

Required to accept `language: "ts"`, e.g.
`(src) => sucrase.transform(src, { transforms: ["typescript"] }).code`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |

#### Returns

`string`
