---
editUrl: false
next: false
prev: false
title: "@mithril/otel"
---

Turn a Mithril event stream into OpenTelemetry GenAI (`gen_ai.*`) spans — dependency-free.

## Remarks

Reconstructs the `invoke_agent > chat > execute_tool` span hierarchy directly off the wire, with
no dependency on `@opentelemetry/api`. A real OTel exporter is a thin adapter over the
[SpanSink](/mithril/reference/otel/interfaces/spansink/) interface. See [toGenAiSpans](/mithril/reference/otel/functions/togenaispans/).

## Interfaces

- [GenAiSpan](/mithril/reference/otel/interfaces/genaispan/)
- [SpanSink](/mithril/reference/otel/interfaces/spansink/)

## Functions

- [otelPlugin](/mithril/reference/otel/functions/otelplugin/)
- [toGenAiSpans](/mithril/reference/otel/functions/togenaispans/)
