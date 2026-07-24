---
editUrl: false
next: false
prev: false
title: "LiveProvider"
---

Defined in: [runner-web/src/catalog.ts:24](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L24)

A remote provider a browser snippet can call directly with the user's own key.

## Properties

### baseUrl?

```ts
readonly optional baseUrl?: string;
```

Defined in: [runner-web/src/catalog.ts:34](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L34)

The OpenAI-wire base URL — set only for `openai-compat` providers.

***

### consoleUrl

```ts
readonly consoleUrl: string;
```

Defined in: [runner-web/src/catalog.ts:38](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L38)

Where a visitor creates a key (linked from the panel).

***

### defaultModel

```ts
readonly defaultModel: string;
```

Defined in: [runner-web/src/catalog.ts:30](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L30)

A cheap, sensible default model, prefilled in the panel.

***

### envVar

```ts
readonly envVar: string;
```

Defined in: [runner-web/src/catalog.ts:28](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L28)

The env var the BYOK fallback reads — `<PROVIDER>_API_KEY`, keyed off the model id's prefix.

***

### host

```ts
readonly host: string;
```

Defined in: [runner-web/src/catalog.ts:36](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L36)

The host the BYOK key is sent to (shown in the security-confirm gate).

***

### id

```ts
readonly id: LiveProviderId;
```

Defined in: [runner-web/src/catalog.ts:25](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L25)

***

### kind

```ts
readonly kind: "native" | "openai-compat";
```

Defined in: [runner-web/src/catalog.ts:32](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L32)

`native` adapters ship first-class; `openai-compat` reuse the OpenAI adapter + a `baseUrl`.

***

### label

```ts
readonly label: string;
```

Defined in: [runner-web/src/catalog.ts:26](https://github.com/kucukkanat/mithril/blob/2df801475cbdd25602ef403525023cdfaa912ecc/packages/runner-web/src/catalog.ts#L26)
