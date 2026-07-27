---
editUrl: false
next: false
prev: false
title: "FromJsonSchemaOptions"
---

Defined in: [packages/core/src/protocol/json-schema.ts:161](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/json-schema.ts#L161)

Options for [fromJsonSchema](/mithril/reference/core/protocol/functions/fromjsonschema/).

## Properties

### onUnsupported?

```ts
readonly optional onUnsupported?: "throw" | "ignore";
```

Defined in: [packages/core/src/protocol/json-schema.ts:166](https://github.com/kucukkanat/mithril/blob/5498dd8fb6fe9570c15d14599fdc470b5197e9d5/packages/core/src/protocol/json-schema.ts#L166)

How to handle a keyword outside the supported subset. `"throw"` (default) rejects at construction;
`"ignore"` drops the keyword and validates everything else.
