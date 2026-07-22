---
editUrl: false
next: false
prev: false
title: "CodeRunner"
---

Defined in: [index.ts:34](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/sandbox/src/index.ts#L34)

A runtime-agnostic seam for running a snippet of code and capturing its result and logs.

## Remarks

An honest-degradation adapter (§10.3): the security guarantee depends on the backend. nodeVmRunner
isolates scope but is **not** a security boundary against hostile code; [remoteRunner](/reference/sandbox/index/functions/remoterunner/) delegates to a
trusted sandbox service. Choose the backend explicitly — this package never auto-detects one.

## Methods

### run()

```ts
run(code, opts?): Promise<CodeResult>;
```

Defined in: [index.ts:35](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/sandbox/src/index.ts#L35)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | `string` |
| `opts?` | [`RunOptions`](/reference/sandbox/index/interfaces/runoptions/) |

#### Returns

`Promise`\<[`CodeResult`](/reference/sandbox/index/type-aliases/coderesult/)\>
