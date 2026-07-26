---
editUrl: false
next: false
prev: false
title: "ToolDefinition"
---

Defined in: [packages/core/src/protocol/tool-registry.ts:37](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L37)

A JSON-safe, replayable description of a tool — everything needed to rebuild it.

## Remarks

Carried on the `tool.registered` event *and* in the suspended run's token. Both, deliberately: the event
is what lets `replay(log)` reconstruct the registry, and the token is what lets `resume()` work in a
process that never saw the log.

`body` is opaque to core — core never interprets it. A `materialize` function (supplied by whichever
package defines the body format, e.g. `@mithril/authoring`) turns it back into a callable tool.

## Properties

### body

```ts
readonly body: JsonValue;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:48](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L48)

The tier-discriminated body. Opaque to core; interpreted by the materializer that owns its format.

***

### description

```ts
readonly description: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:39](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L39)

***

### digest

```ts
readonly digest: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:50](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L50)

Content digest over the canonical JSON of every other field. See [digestOf](/mithril/reference/core/protocol/functions/digestof/).

***

### examples?

```ts
readonly optional examples?: readonly JsonValue[];
```

Defined in: [packages/core/src/protocol/tool-registry.ts:44](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L44)

***

### inputSchema

```ts
readonly inputSchema: JsonValue;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:42](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L42)

JSON Schema for the tool's input; compile it with [fromJsonSchema](/mithril/reference/core/protocol/functions/fromjsonschema/).

***

### name

```ts
readonly name: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:38](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L38)

***

### needsApproval?

```ts
readonly optional needsApproval?: boolean;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:45](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L45)

***

### outputSchema?

```ts
readonly optional outputSchema?: JsonValue;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:43](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L43)

***

### timeoutMs?

```ts
readonly optional timeoutMs?: number;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:46](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L46)

***

### version?

```ts
readonly optional version?: string;
```

Defined in: [packages/core/src/protocol/tool-registry.ts:40](https://github.com/kucukkanat/mithril/blob/11fd4315ebd38aa7954d618e157fa90293105bdf/packages/core/src/protocol/tool-registry.ts#L40)
