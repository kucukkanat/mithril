---
editUrl: false
next: false
prev: false
title: "Props"
---

Defined in: [packages/core/src/protocol/standard-schema.ts:25](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L25)

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

Defined in: [packages/core/src/protocol/standard-schema.ts:31](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L31)

***

### validate

```ts
readonly validate: (value) => 
  | Result<Output>
| Promise<Result<Output>>;
```

Defined in: [packages/core/src/protocol/standard-schema.ts:28](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L28)

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

Defined in: [packages/core/src/protocol/standard-schema.ts:27](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L27)

***

### version

```ts
readonly version: 1;
```

Defined in: [packages/core/src/protocol/standard-schema.ts:26](https://github.com/kucukkanat/mithril/blob/b369293fee6fb2b6a3c4741f04afddc58ea11193/packages/core/src/protocol/standard-schema.ts#L26)
