---
editUrl: false
next: false
prev: false
title: "ToolSummary"
---

Defined in: [packages/core/src/protocol/tool-registry.ts:57](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L57)

The non-executable view of a registered tool — safe to hand to an observer or back to the model.

## Properties

### definition?

```ts
readonly optional definition?: ToolDefinition;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:63](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L63)

Present only for tools registered from a definition (`setup` and `runtime` provenance).

***

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:59](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L59)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:58](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L58)

***

### provenance

```ts
readonly provenance: ToolProvenance;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:61](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L61)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:60](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/tool-registry.ts#L60)
