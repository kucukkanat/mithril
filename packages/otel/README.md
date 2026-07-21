# @mithril/otel

Fold a Mithril event stream into OpenTelemetry `gen_ai.*` spans — the standard `invoke_agent > chat >
execute_tool` hierarchy, built directly off the wire. Dependency-free shape; a real `@opentelemetry/api`
exporter is a thin adapter over the sink.

```ts
import { toGenAiSpans } from "@mithril/otel";

const log = [];
for await (const e of assistant.stream("weather in NYC?").events) log.push(e);

const spans = toGenAiSpans(log, {
  onSpan: (s) => exporter.export(s), // emit each span as it closes
});
// spans: [{ name: "invoke_agent" }, { name: "chat" }, { name: "execute_tool weather", parentSpanId, … }]
```

## API

- `toGenAiSpans(events, sink?, { captureContent? })` → `GenAiSpan[]`.
- `GenAiSpan` = `{ spanId, parentSpanId, traceId, name, kind, startTime, endTime?, attributes }`.
- Attributes include `gen_ai.request.model`, `gen_ai.tool.name`, `gen_ai.usage.output_tokens`.

Metadata is on by default; prompts/outputs (`captureContent: true`) are opt-in.
