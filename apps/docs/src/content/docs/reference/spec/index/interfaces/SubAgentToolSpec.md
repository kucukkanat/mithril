---
editUrl: false
next: false
prev: false
title: "SubAgentToolSpec"
---

Defined in: [packages/spec/src/types.ts:85](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L85)

A `const <id> = asTool(<agentId>, { … })` declaration — a sub-agent exposed as a parent's tool.

## Properties

### agentId

```ts
readonly agentId: string;
```

Defined in: [packages/spec/src/types.ts:89](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L89)

The child AgentSpec's decl id.

***

### description

```ts
readonly description: string;
```

Defined in: [packages/spec/src/types.ts:91](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L91)

***

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:87](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L87)

***

### input?

```ts
readonly optional input?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:93](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L93)

The `AsToolOptions.inputSchema`, when present.

***

### kind

```ts
readonly kind: "subAgentTool";
```

Defined in: [packages/spec/src/types.ts:86](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L86)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:90](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L90)
