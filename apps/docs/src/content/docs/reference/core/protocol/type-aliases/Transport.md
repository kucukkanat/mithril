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

Defined in: [packages/core/src/protocol/context.ts:39](https://github.com/kucukkanat/mithril/blob/3e93b53558d82d0c9f009d0bc9676d68bfb30a88/packages/core/src/protocol/context.ts#L39)

How model requests reach the provider, chosen so the same agent can run in a
browser without leaking keys.

## Remarks

`'byok'` sends a caller-held API key directly; `'proxy'` routes through a
trusted backend; `'ephemeral'` fetches a short-lived token per request.
Persistence/durability is a separate concern, not carried here.
