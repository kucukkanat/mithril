---
editUrl: false
next: false
prev: false
title: "testConnection"
---

```ts
function testConnection(probe): Promise<ConnectionResult>;
```

Defined in: [runner-web/src/connection.ts:155](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L155)

Send one minimal completion to verify a provider connection end to end — key, endpoint, and model id.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `probe` | [`ConnectionProbe`](/mithril/reference/runner-web/index/interfaces/connectionprobe/) | the exact connection a run would use ([ConnectionProbe](/mithril/reference/runner-web/index/interfaces/connectionprobe/)). |

## Returns

`Promise`\<[`ConnectionResult`](/mithril/reference/runner-web/index/type-aliases/connectionresult/)\>

[ConnectionResult](/mithril/reference/runner-web/index/type-aliases/connectionresult/) — `ok` with a latency, or a fault naming which field to fix.

## Remarks

The request is a real, billable one-token completion (a fraction of a cent). It is sent
only on an explicit button press, never automatically. A blank key short-circuits without a
request, since that answer needs no network.

## Example

```ts
const r = await testConnection({ provider: "openai", model: "gpt-4o-mini", apiKey: key });
if (!r.ok) console.error(r.fault, r.message);
```
