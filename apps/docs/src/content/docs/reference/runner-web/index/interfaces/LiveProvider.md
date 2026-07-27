---
editUrl: false
next: false
prev: false
title: "LiveProvider"
---

Defined in: [runner-web/src/catalog.ts:46](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L46)

A remote provider a browser snippet can call directly with the user's own key.

## Properties

### baseUrlEnvVar

```ts
readonly baseUrlEnvVar: string;
```

Defined in: [runner-web/src/catalog.ts:57](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L57)

The env var an optional endpoint override is passed through as — `<PROVIDER>_BASE_URL`, read by
core's `resolveTransport` alongside [LiveProvider.envVar](/mithril/reference/runner-web/index/interfaces/liveprovider/#envvar). Kept symmetric with the key on
purpose: an endpoint is connection config, so it travels with the key rather than being baked
into a project spec or a share URL.

***

### consoleUrl

```ts
readonly consoleUrl: string;
```

Defined in: [runner-web/src/catalog.ts:79](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L79)

Where a visitor creates a key (linked from the panel).

***

### defaultBaseUrl

```ts
readonly defaultBaseUrl: string;
```

Defined in: [runner-web/src/catalog.ts:67](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L67)

The endpoint requests go to when nothing overrides it. Every provider declares one (it is what the
baseUrl field is prefilled/placeheld with); for `openai-compat` providers it is also the `baseUrl`
their generated `openaiProvider({ … })` call pins.

***

### defaultModel

```ts
readonly defaultModel: string;
```

Defined in: [runner-web/src/catalog.ts:59](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L59)

A cheap, sensible default model, prefilled in the panel.

***

### envVar

```ts
readonly envVar: string;
```

Defined in: [runner-web/src/catalog.ts:50](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L50)

The env var the BYOK fallback reads — `<PROVIDER>_API_KEY`, keyed off the model id's prefix.

***

### host

```ts
readonly host: string;
```

Defined in: [runner-web/src/catalog.ts:77](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L77)

The host the BYOK key is sent to (shown in the security-confirm gate).

***

### id

```ts
readonly id: LiveProviderId;
```

Defined in: [runner-web/src/catalog.ts:47](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L47)

***

### kind

```ts
readonly kind: "native" | "openai-compat";
```

Defined in: [runner-web/src/catalog.ts:61](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L61)

`native` adapters ship first-class; `openai-compat` reuse the OpenAI adapter + a `baseUrl`.

***

### label

```ts
readonly label: string;
```

Defined in: [runner-web/src/catalog.ts:48](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L48)

***

### models

```ts
readonly models: readonly CatalogModel[];
```

Defined in: [runner-web/src/catalog.ts:81](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L81)

Well-known current models, newest/most capable first. Free text is always still allowed.

***

### supportsBaseUrl

```ts
readonly supportsBaseUrl: boolean;
```

Defined in: [runner-web/src/catalog.ts:73](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L73)

True when pointing this provider at a different, wire-compatible endpoint is supported — an
OpenAI-compatible gateway, an Anthropic-compatible proxy, a local server. False for providers
whose adapter hard-codes its own URL shape.

***

### wire

```ts
readonly wire: ProviderWire;
```

Defined in: [runner-web/src/catalog.ts:75](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/catalog.ts#L75)

The wire dialect, used by the connection probe and live model listing.
