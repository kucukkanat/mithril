---
editUrl: false
next: false
prev: false
title: "LiveProviderName"
---

```ts
type LiveProviderName = "openai" | "anthropic" | "google" | "groq" | "deepseek" | "openrouter";
```

Defined in: [packages/spec/src/types.ts:30](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/spec/src/types.ts#L30)

The remote providers a `live` [ModelSpec](/mithril/reference/spec/index/type-aliases/modelspec/) can name. Mirrors `LiveProviderId` in
`@mithril/runner-web` (the two packages are independent by design, so the union is stated in both).
