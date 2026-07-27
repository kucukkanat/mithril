---
editUrl: false
next: false
prev: false
title: "fetchProviderModels"
---

```ts
function fetchProviderModels(probe): Promise<readonly string[] | undefined>;
```

Defined in: [runner-web/src/connection.ts:211](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L211)

Fetch the provider's own current model list, so the picker searches what the account can actually
call rather than a list baked in at release time.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `probe` | `Omit`\<[`ConnectionProbe`](/mithril/reference/runner-web/index/interfaces/connectionprobe/), `"model"`\> | provider + key (+ optional endpoint). `model` is ignored. |

## Returns

`Promise`\<readonly `string`[] \| `undefined`\>

the live ids, or `undefined` when the provider exposes no listing endpoint or the call fails —
  callers fall back to the curated [LiveProvider.models](/mithril/reference/runner-web/index/interfaces/liveprovider/#models).

## Remarks

Never throws: a failed listing is a non-event (the curated list still works), so it must
not surface as an error next to a key field.
