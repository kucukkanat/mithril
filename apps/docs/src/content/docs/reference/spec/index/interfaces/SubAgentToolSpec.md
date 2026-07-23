---
editUrl: false
next: false
prev: false
title: "SubAgentToolSpec"
---

Defined in: [packages/spec/src/types.ts:88](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L88)

A `const <id> = asTool(<agentId>, { … })` declaration — a sub-agent exposed as a parent's tool.

## Properties

### agentId

```ts
readonly agentId: string;
```

Defined in: [packages/spec/src/types.ts:92](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L92)

The child AgentSpec's decl id.

***

### description

```ts
readonly description: string;
```

Defined in: [packages/spec/src/types.ts:94](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L94)

***

### id

```ts
readonly id: string;
```

Defined in: [packages/spec/src/types.ts:90](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L90)

***

### input?

```ts
readonly optional input?: SchemaSpec;
```

Defined in: [packages/spec/src/types.ts:96](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L96)

The `AsToolOptions.inputSchema`, when present.

***

### kind

```ts
readonly kind: "subAgentTool";
```

Defined in: [packages/spec/src/types.ts:89](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L89)

***

### name

```ts
readonly name: string;
```

Defined in: [packages/spec/src/types.ts:93](https://github.com/kucukkanat/mithril/blob/2d58065e6ea701b1045fc39d23ec8c58b315c0f7/packages/spec/src/types.ts#L93)
