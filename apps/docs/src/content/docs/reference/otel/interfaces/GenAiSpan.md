---
editUrl: false
next: false
prev: false
title: "GenAiSpan"
---

Defined in: index.ts:25

A reconstructed OpenTelemetry GenAI span, following the `gen_ai.*` semantic conventions.

## Remarks

Spans are built by grouping events on `span.id`; `startTime`/`endTime` are the first and last event
timestamps for that span.

## Properties

### attributes

```ts
readonly attributes: Record<string, string | number | boolean>;
```

Defined in: index.ts:41

`gen_ai.*` attributes (model, tool name, output tokens, span kind, …).

***

### endTime?

```ts
optional endTime?: number;
```

Defined in: index.ts:39

End timestamp (epoch ms) — the last event seen for this span; `undefined` until the span sees a second event.

***

### kind

```ts
readonly kind: "invoke_agent" | "chat" | "execute_tool" | "workflow" | "handoff";
```

Defined in: index.ts:35

The GenAI operation this span represents.

***

### name

```ts
name: string;
```

Defined in: index.ts:33

Display name; starts as the [GenAiSpan.kind](/reference/otel/interfaces/genaispan/#kind) and becomes `execute_tool <tool>` once the tool is known.

***

### parentSpanId

```ts
readonly parentSpanId: string | null;
```

Defined in: index.ts:29

The parent span's id, or `null` for a root span.

***

### spanId

```ts
readonly spanId: string;
```

Defined in: index.ts:27

The span's own id (the source event's `span.id`).

***

### startTime

```ts
readonly startTime: number;
```

Defined in: index.ts:37

Start timestamp (epoch ms) — the first event seen for this span.

***

### traceId

```ts
readonly traceId: string;
```

Defined in: index.ts:31

The trace this span belongs to.
