---
editUrl: false
next: false
prev: false
title: "SubAgentToolSpec"
---

Defined in: packages/spec/src/types.ts:88

A `const <id> = asTool(<agentId>, { … })` declaration — a sub-agent exposed as a parent's tool.

## Properties

### agentId

```ts
readonly agentId: string;
```

Defined in: packages/spec/src/types.ts:92

The child AgentSpec's decl id.

***

### description

```ts
readonly description: string;
```

Defined in: packages/spec/src/types.ts:94

***

### id

```ts
readonly id: string;
```

Defined in: packages/spec/src/types.ts:90

***

### input?

```ts
readonly optional input?: SchemaSpec;
```

Defined in: packages/spec/src/types.ts:96

The `AsToolOptions.inputSchema`, when present.

***

### kind

```ts
readonly kind: "subAgentTool";
```

Defined in: packages/spec/src/types.ts:89

***

### name

```ts
readonly name: string;
```

Defined in: packages/spec/src/types.ts:93
