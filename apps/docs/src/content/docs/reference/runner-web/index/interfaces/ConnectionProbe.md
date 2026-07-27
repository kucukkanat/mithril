---
editUrl: false
next: false
prev: false
title: "ConnectionProbe"
---

Defined in: [runner-web/src/connection.ts:40](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L40)

What to probe. `baseUrl` and `apiKey` are exactly what a run would use.

## Properties

### apiKey

```ts
readonly apiKey: string;
```

Defined in: [runner-web/src/connection.ts:43](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L43)

***

### baseUrl?

```ts
readonly optional baseUrl?: string;
```

Defined in: [runner-web/src/connection.ts:45](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L45)

Optional endpoint override; falls back to the provider's `defaultBaseUrl`.

***

### fetch?

```ts
readonly optional fetch?: {
  (input, init?): Promise<Response>;
  (input, init?): Promise<Response>;
  (input, init?): Promise<Response>;
};
```

Defined in: [runner-web/src/connection.ts:47](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L47)

Injected for tests; defaults to the global `fetch`.

#### Call Signature

```ts
(input, init?): Promise<Response>;
```

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `RequestInfo` \| `URL` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\<`Response`\>

#### Call Signature

```ts
(input, init?): Promise<Response>;
```

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `RequestInfo` \| `URL` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\<`Response`\>

#### Call Signature

```ts
(input, init?): Promise<Response>;
```

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` \| `Request` \| `URL` |
| `init?` | `RequestInit` |

##### Returns

`Promise`\<`Response`\>

***

### model

```ts
readonly model: string;
```

Defined in: [runner-web/src/connection.ts:42](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L42)

***

### provider

```ts
readonly provider: LiveProviderId;
```

Defined in: [runner-web/src/connection.ts:41](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L41)

***

### signal?

```ts
readonly optional signal?: AbortSignal;
```

Defined in: [runner-web/src/connection.ts:49](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/runner-web/src/connection.ts#L49)

Abort the probe (the UI wires this to unmount / a second click).
