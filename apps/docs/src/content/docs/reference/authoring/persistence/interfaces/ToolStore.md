---
editUrl: false
next: false
prev: false
title: "ToolStore"
---

Defined in: [persistence.ts:13](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/persistence.ts#L13)

Durable storage for authored ToolDefinitions, partitioned by scope.

## Methods

### load()

```ts
load(scope): Promise<readonly ToolDefinition[]>;
```

Defined in: [persistence.ts:14](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/persistence.ts#L14)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `string` |

#### Returns

`Promise`\<readonly `ToolDefinition`[]\>

***

### remove()

```ts
remove(scope, name): Promise<void>;
```

Defined in: [persistence.ts:16](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/persistence.ts#L16)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `string` |
| `name` | `string` |

#### Returns

`Promise`\<`void`\>

***

### save()

```ts
save(scope, def): Promise<void>;
```

Defined in: [persistence.ts:15](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/authoring/src/persistence.ts#L15)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `string` |
| `def` | `ToolDefinition` |

#### Returns

`Promise`\<`void`\>
