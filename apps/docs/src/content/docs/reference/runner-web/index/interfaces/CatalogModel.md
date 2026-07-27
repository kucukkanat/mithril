---
editUrl: false
next: false
prev: false
title: "CatalogModel"
---

Defined in: [runner-web/src/catalog.ts:30](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L30)

One entry in a provider's curated model list — what the picker's fuzzy search matches against.

The list is a starting point, not a whitelist: a user may always type an id that isn't here (see
[isCustomModel](/mithril/reference/runner-web/index/functions/iscustommodel/)), and [fetchProviderModels](/mithril/reference/runner-web/index/functions/fetchprovidermodels/) can replace it with the provider's own
live list once a key is present.

## Properties

### id

```ts
readonly id: string;
```

Defined in: [runner-web/src/catalog.ts:32](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L32)

The exact id sent on the wire.

***

### label?

```ts
readonly optional label?: string;
```

Defined in: [runner-web/src/catalog.ts:34](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L34)

Short human label; falls back to [CatalogModel.id](/mithril/reference/runner-web/index/interfaces/catalogmodel/#id) when absent.

***

### note?

```ts
readonly optional note?: string;
```

Defined in: [runner-web/src/catalog.ts:36](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L36)

One-line positioning ("fastest", "best reasoning") shown beside the id.
