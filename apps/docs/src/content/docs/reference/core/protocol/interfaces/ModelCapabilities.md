---
editUrl: false
next: false
prev: false
title: "ModelCapabilities"
---

Defined in: [packages/core/src/protocol/provider.ts:11](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L11)

The feature flags a model supports, used for capability-gated routing.

## Properties

### browserSafe

```ts
readonly browserSafe: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:18](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L18)

Whether the model is safe to call directly from a browser (BYOK) context.

***

### constrainedDecoding?

```ts
readonly optional constrainedDecoding?: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:31](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L31)

Whether the provider supports native grammar/JSON-Schema constrained decoding of the final output
(as opposed to prompt-and-validate JSON mode). See the roadmap for the in-browser story — Transformers.js
has no grammar support today; WebLLM/XGrammar is the path. Absent ⇒ unknown/unsupported.

***

### promptCaching

```ts
readonly promptCaching: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:15](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L15)

***

### reasoning

```ts
readonly reasoning: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:14](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L14)

***

### strictTools?

```ts
readonly optional strictTools?: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:25](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L25)

Whether the provider can enforce a strict JSON-Schema on tool-call arguments (e.g. OpenAI's
`strict: true` function tools, Anthropic strict tool use). Advisory today — the loop's parse-repair and
bounded re-ask are the shipped guarantee; a provider that populates this lets request-shaping opt into
native constrained decoding where available. Absent ⇒ unknown/unsupported.

***

### structuredOutput

```ts
readonly structuredOutput: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:13](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L13)

***

### tools

```ts
readonly tools: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:12](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L12)

***

### vision

```ts
readonly vision: boolean;
```

Defined in: [packages/core/src/protocol/provider.ts:16](https://github.com/kucukkanat/mithril/blob/d1861b6ac415e85aae11c46fc6fdce8be5dded6a/packages/core/src/protocol/provider.ts#L16)
