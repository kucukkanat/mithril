import { useMemo } from "react";
import { agent, asTool, tool } from "@mithril/core/agent";
import type { ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { RunInspector } from "@mithril/devtools/ui";
import "@mithril/devtools/ui.css";

// A self-contained, deterministic demo of the visual devtools UI: a scripted multi-step run (a tool call, a
// delegated sub-agent, then a text answer) streamed into <RunInspector>. Zero network, zero keys — the same
// component you would point at a live RunHandle in your own app.

const NO: UsageDelta = { input: 40, output: 12, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 220 };
function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "demo", validate: (v) => ({ value: v as T }) } };
}

function buildRun() {
  const child = agent({
    model: testModel(scriptedProvider([[{ type: "text.delta", delta: "Historically mild; ~22°C in spring." }, { type: "message.end", finishReason: "stop", usage: NO }]])),
    instructions: "Research the question.",
  });
  const research = asTool(child, { name: "research", description: "Deep-dive a question." });
  const weather = tool({
    name: "get_weather",
    description: "Current weather for a city.",
    inputSchema: schema<{ city: string }>(),
    execute: async ({ city }) => ({ city, tempC: 22, sky: "clear" }),
  });
  const assistant = agent({
    model: testModel(
      scriptedProvider([
        [{ type: "tool.call", callId: "c1", name: "get_weather", input: { city: "Paris" } }, { type: "message.end", finishReason: "tool_calls", usage: NO }],
        [{ type: "tool.call", callId: "c2", name: "research", input: { task: "Paris spring climate" } }, { type: "message.end", finishReason: "tool_calls", usage: NO }],
        [{ type: "text.delta", delta: "Paris is clear and ~22°C — typical for spring." }, { type: "message.end", finishReason: "stop", usage: NO }] as ProviderChunk[],
      ]),
    ),
    instructions: "Answer using the tools.",
    tools: [weather, research],
  });
  return assistant.stream("What's the weather in Paris?");
}

export default function DevtoolsDemo() {
  const handle = useMemo(() => buildRun(), []);
  return <RunInspector source={handle} contextWindow={200_000} />;
}
