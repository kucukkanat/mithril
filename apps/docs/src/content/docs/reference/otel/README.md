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
[SpanSink](/reference/otel/interfaces/spansink/) interface. See [toGenAiSpans](/reference/otel/functions/togenaispans/).

## Interfaces

- [GenAiSpan](/reference/otel/interfaces/genaispan/)
- [SpanSink](/reference/otel/interfaces/spansink/)

## Functions

- [otelPlugin](/reference/otel/functions/otelplugin/)
- [toGenAiSpans](/reference/otel/functions/togenaispans/)
