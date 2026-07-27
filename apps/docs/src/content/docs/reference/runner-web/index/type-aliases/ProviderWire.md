---
editUrl: false
next: false
prev: false
title: "ProviderWire"
---

```ts
type ProviderWire = "openai" | "anthropic" | "google";
```

Defined in: [runner-web/src/catalog.ts:43](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L43)

The wire dialect a provider speaks. Determines how a [testConnection](/mithril/reference/runner-web/index/functions/testconnection/) probe and
[fetchProviderModels](/mithril/reference/runner-web/index/functions/fetchprovidermodels/) talk to it — and which of them can accept an arbitrary `baseUrl`.
