---
editUrl: false
next: false
prev: false
title: "CodeRunner"
---

Defined in: [index.ts:34](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/sandbox/src/index.ts#L34)

A runtime-agnostic seam for running a snippet of code and capturing its result and logs.

## Remarks

An honest-degradation adapter (§10.3): the security guarantee depends on the backend. nodeVmRunner
isolates scope but is **not** a security boundary against hostile code; [remoteRunner](/mithril/reference/sandbox/index/functions/remoterunner/) delegates to a
trusted sandbox service. Choose the backend explicitly — this package never auto-detects one.

## Properties

### isolation?

```ts
readonly optional isolation?: "scope" | "remote";
```

Defined in: [index.ts:47](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/sandbox/src/index.ts#L47)

What kind of boundary this backend provides.

#### Remarks

`"scope"` keeps code out of the host's scope but is **not** a security boundary against hostile code —
nodeVmRunner and `workerRunner` are both `"scope"`. `"remote"` executes elsewhere, so the host
never evaluates the code at all ([remoteRunner](/mithril/reference/sandbox/index/functions/remoterunner/)).

Optional so no existing adapter breaks, and machine-readable on purpose: a caller that must refuse
local execution can check this instead of pattern-matching on which factory built the runner.

## Methods

### run()

```ts
run(code, opts?): Promise<CodeResult>;
```

Defined in: [index.ts:35](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/sandbox/src/index.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `string` |
| `opts?` | [`RunOptions`](/mithril/reference/sandbox/index/interfaces/runoptions/) |

#### Returns

`Promise`\<[`CodeResult`](/mithril/reference/sandbox/index/type-aliases/coderesult/)\>
