---
editUrl: false
next: false
prev: false
title: "WorkflowStepSpec"
---

```ts
type WorkflowStepSpec = 
  | {
  agentId: string;
  assign: CodeRegion;
  inputExpr: CodeRegion;
  kind: "agentStep";
  name: string;
  next: WorkflowRoute;
}
  | {
  branches: readonly {
     then: WorkflowRoute;
     when: CodeRegion;
  }[];
  kind: "branch";
  name: string;
  otherwise: WorkflowRoute;
}
  | {
  body: CodeRegion;
  kind: "code";
  name: string;
};
```

Defined in: [packages/spec/src/types.ts:100](https://github.com/kucukkanat/mithril/blob/55ab1949bb0acd328508323b9e426a08a538cc79/packages/spec/src/types.ts#L100)

One step of a `defineWorkflow` — declarative shapes compile to real `goto`/`done` code.

## Union Members

### Type Literal

```ts
{
  agentId: string;
  assign: CodeRegion;
  inputExpr: CodeRegion;
  kind: "agentStep";
  name: string;
  next: WorkflowRoute;
}
```

#### agentId

```ts
readonly agentId: string;
```

#### assign

```ts
readonly assign: CodeRegion;
```

`(state, output) => next state`, stored verbatim.

#### inputExpr

```ts
readonly inputExpr: CodeRegion;
```

`(state) => run input`, stored verbatim.

#### kind

```ts
readonly kind: "agentStep";
```

#### name

```ts
readonly name: string;
```

#### next

```ts
readonly next: WorkflowRoute;
```

***

### Type Literal

```ts
{
  branches: readonly {
     then: WorkflowRoute;
     when: CodeRegion;
  }[];
  kind: "branch";
  name: string;
  otherwise: WorkflowRoute;
}
```

***

### Type Literal

```ts
{
  body: CodeRegion;
  kind: "code";
  name: string;
}
```

Escape hatch: the whole step function stored verbatim.
