---
editUrl: false
next: false
prev: false
title: "LiveProvider"
---

Defined in: runner-web/src/catalog.ts:14

A remote provider a browser snippet can call directly with the user's own key.

## Properties

### baseUrl?

```ts
readonly optional baseUrl?: string;
```

Defined in: runner-web/src/catalog.ts:24

The OpenAI-wire base URL — set only for `openai-compat` providers.

***

### consoleUrl

```ts
readonly consoleUrl: string;
```

Defined in: runner-web/src/catalog.ts:28

Where a visitor creates a key (linked from the panel).

***

### defaultModel

```ts
readonly defaultModel: string;
```

Defined in: runner-web/src/catalog.ts:20

A cheap, sensible default model, prefilled in the panel.

***

### envVar

```ts
readonly envVar: string;
```

Defined in: runner-web/src/catalog.ts:18

The env var the BYOK fallback reads — `<PROVIDER>_API_KEY`, keyed off the model id's prefix.

***

### host

```ts
readonly host: string;
```

Defined in: runner-web/src/catalog.ts:26

The host the BYOK key is sent to (shown in the security-confirm gate).

***

### id

```ts
readonly id: LiveProviderId;
```

Defined in: runner-web/src/catalog.ts:15

***

### kind

```ts
readonly kind: "native" | "openai-compat";
```

Defined in: runner-web/src/catalog.ts:22

`native` adapters ship first-class; `openai-compat` reuse the OpenAI adapter + a `baseUrl`.

***

### label

```ts
readonly label: string;
```

Defined in: runner-web/src/catalog.ts:16
