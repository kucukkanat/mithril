---
editUrl: false
next: false
prev: false
title: "Props"
---

Defined in: packages/core/src/protocol/standard-schema.ts:25

## Type Parameters

| Type Parameter |
| ------ |
| `Input` |
| `Output` |

## Properties

### types?

```ts
readonly optional types?: Types<Input, Output>;
```

Defined in: packages/core/src/protocol/standard-schema.ts:29

***

### validate

```ts
readonly validate: (value) => 
  | Result<Output>
| Promise<Result<Output>>;
```

Defined in: packages/core/src/protocol/standard-schema.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

  \| [`Result`](/reference/core/protocol/namespaces/standardschemav1/type-aliases/result/)\<`Output`\>
  \| `Promise`\<[`Result`](/reference/core/protocol/namespaces/standardschemav1/type-aliases/result/)\<`Output`\>\>

***

### vendor

```ts
readonly vendor: string;
```

Defined in: packages/core/src/protocol/standard-schema.ts:27

***

### version

```ts
readonly version: 1;
```

Defined in: packages/core/src/protocol/standard-schema.ts:26
