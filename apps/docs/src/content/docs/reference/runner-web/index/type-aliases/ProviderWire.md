---
editUrl: false
next: false
prev: false
title: "ProviderWire"
---

```ts
type ProviderWire = "openai" | "anthropic" | "google";
```

Defined in: [runner-web/src/catalog.ts:43](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/runner-web/src/catalog.ts#L43)

The wire dialect a provider speaks. Determines how a [testConnection](/mithril/reference/runner-web/index/functions/testconnection/) probe and
[fetchProviderModels](/mithril/reference/runner-web/index/functions/fetchprovidermodels/) talk to it — and which of them can accept an arbitrary `baseUrl`.
