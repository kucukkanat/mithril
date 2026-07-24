---
editUrl: false
next: false
prev: false
title: "remoteRunner"
---

```ts
function remoteRunner(opts): CodeRunner;
```

Defined in: [index.ts:52](https://github.com/kucukkanat/mithril/blob/027d627cec23402d12149767f5ba5f29d7e47052/packages/sandbox/src/index.ts#L52)

Build a [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) that proxies execution to a trusted remote sandbox service (the secure option).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | \{ `endpoint`: `string`; `fetch?`: \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}; `headers?`: `Readonly`\<`Record`\<`string`, `string`\>\>; \} | `endpoint` receives `POST { code, timeoutMs, globals }` and must reply with `{ ok, value?, error?, logs? }`. `fetch` injects the fetcher (default the global `fetch`); `headers` are sent with every request (e.g. auth). |
| `opts.endpoint` | `string` | - |
| `opts.fetch?` | \{ (`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | - |
| `opts.headers?` | `Readonly`\<`Record`\<`string`, `string`\>\> | - |

## Returns

[`CodeRunner`](/mithril/reference/sandbox/index/interfaces/coderunner/)

A [CodeRunner](/mithril/reference/sandbox/index/interfaces/coderunner/) whose safety is the remote service's responsibility.

## Remarks

This is the recommended backend for untrusted code: the browser/Node host never evaluates it.

## Example

```ts
const runner = remoteRunner({ endpoint: "https://sandbox.example.com/run", headers: { authorization: token } });
const r = await runner.run("return 1 + 1");
```
