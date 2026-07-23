---
editUrl: false
next: false
prev: false
title: "ToolErrorClass"
---

```ts
type ToolErrorClass = 
  | "unknown_tool"
  | "malformed_json"
  | "invalid_args"
  | "invalid_output"
  | "handler_error"
  | "timeout";
```

Defined in: [packages/core/src/protocol/errors.ts:16](https://github.com/kucukkanat/mithril/blob/74200bb9af74483d4d32917edef3a9be94414b04/packages/core/src/protocol/errors.ts#L16)

The canonical classes of tool-call failure — a ToolScan-style taxonomy.

## Remarks

Attached to a tool-related [SerializedError](/reference/core/protocol/interfaces/serializederror/) via its `data` field (see [classifiedError](/reference/core/protocol/functions/classifiederror/))
so self-correction can route by class: `malformed_json`/`invalid_args` are deterministically
repairable and worth re-asking; `handler_error` usually is not. Also the bucketing key for eval
metrics (repair-success-rate per class).
