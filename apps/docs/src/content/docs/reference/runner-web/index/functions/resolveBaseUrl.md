---
editUrl: false
next: false
prev: false
title: "resolveBaseUrl"
---

```ts
function resolveBaseUrl(provider, baseUrl?): string;
```

Defined in: runner-web/src/connection.ts:64

Resolve the endpoint a probe (or a run) will actually call: the override when non-empty, else the
provider's default.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`LiveProviderId`](/mithril/reference/runner-web/index/type-aliases/liveproviderid/) |
| `baseUrl?` | `string` |

## Returns

`string`

## Example

```ts
resolveBaseUrl("openai", "  "); // "https://api.openai.com/v1" — blank override is ignored
```
