---
editUrl: false
next: false
prev: false
title: "ScorerEmitHelpers"
---

Defined in: packages/spec/src/scorers.ts:26

The source-emitting helpers injected into a descriptor's [ScorerDescriptor.emit](/reference/spec/index/interfaces/scorerdescriptor/#emit).

## Properties

### jsonExpr

```ts
readonly jsonExpr: (v) => string;
```

Defined in: packages/spec/src/scorers.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `unknown` |

#### Returns

`string`

***

### modelExpr

```ts
readonly modelExpr: (m) => string;
```

Defined in: packages/spec/src/scorers.ts:29

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `m` | [`ModelSpec`](/reference/spec/index/type-aliases/modelspec/) |

#### Returns

`string`

***

### str

```ts
readonly str: (s) => string;
```

Defined in: packages/spec/src/scorers.ts:27

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `s` | `string` |

#### Returns

`string`
