---
editUrl: false
next: false
prev: false
title: "Transport"
---

```ts
type Transport = 
  | {
  apiKey: string;
  baseUrl?: string;
  headers?: HeadersInit;
  kind: "byok";
}
  | {
  baseUrl: string;
  headers?: HeadersInit;
  kind: "proxy";
}
  | {
  baseUrl: string;
  kind: "ephemeral";
  token: () => Promise<string>;
};
```

Defined in: [packages/core/src/protocol/context.ts:41](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/context.ts#L41)

How model requests reach the provider, chosen so the same agent can run in a
browser without leaking keys.

## Remarks

`'byok'` sends a caller-held API key directly; `'proxy'` routes through a
trusted backend; `'ephemeral'` fetches a short-lived token per request.
Persistence/durability is a separate concern, not carried here.
