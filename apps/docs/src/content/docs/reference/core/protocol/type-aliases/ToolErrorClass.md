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

Defined in: [packages/core/src/protocol/errors.ts:16](https://github.com/kucukkanat/mithril/blob/8ae36b8af557d6b4f2333ababb01689a162fa6f9/packages/core/src/protocol/errors.ts#L16)

The canonical classes of tool-call failure — a ToolScan-style taxonomy.

## Remarks

Attached to a tool-related [SerializedError](/mithril/reference/core/protocol/interfaces/serializederror/) via its `data` field (see [classifiedError](/mithril/reference/core/protocol/functions/classifiederror/))
so self-correction can route by class: `malformed_json`/`invalid_args` are deterministically
repairable and worth re-asking; `handler_error` usually is not. Also a stable bucketing key for
metrics (repair-success-rate per class).
