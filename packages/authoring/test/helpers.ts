import type { JsonValue, MithrilEvent, StandardSchemaV1 } from "@mithril/core/protocol";
import { agent, tool } from "@mithril/core/agent";
import { scriptedProvider, testModel, ZERO_DELTA } from "@mithril/core/testkit";
import { toolAuthoring, type AuthoringOptions } from "../src/index.ts";

export function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}

export const getWeather = tool({
  name: "get_weather",
  description: "weather for a city",
  inputSchema: schema<{ city: string }>(),
  execute: async ({ city }) => ({ city, tempC: 20 }),
});

export const cToF = tool({
  name: "c_to_f",
  description: "celsius to fahrenheit",
  inputSchema: schema<{ celsius: number }>(),
  execute: async ({ celsius }) => ({ f: celsius * 1.8 + 32 }),
});

export const shout = tool({
  name: "shout",
  description: "upper-cases text with an optional prefix",
  inputSchema: schema<{ text: string; prefix?: string }>(),
  execute: async ({ text, prefix }) => `${prefix ?? ""}${text.toUpperCase()}`,
});

export const deploy = tool({
  name: "deploy",
  description: "deploys to an environment",
  inputSchema: schema<{ env: string }>(),
  needsApproval: true,
  execute: async ({ env }) => `deployed to ${env}`,
});

/** A turn in which the model calls one tool. */
export function call(name: string, input: JsonValue, callId = "c1"): readonly ProviderChunkLike[] {
  return [
    { type: "tool.call", callId, name, input },
    { type: "message.end", usage: ZERO_DELTA, finishReason: "tool_calls" },
  ] as readonly ProviderChunkLike[];
}
type ProviderChunkLike = Parameters<typeof scriptedProvider>[0][number][number];

export function say(text: string): readonly ProviderChunkLike[] {
  return [
    { type: "text.delta", delta: text },
    { type: "message.end", usage: ZERO_DELTA, finishReason: "stop" },
  ] as readonly ProviderChunkLike[];
}

export interface HarnessOptions extends AuthoringOptions {
  readonly tools?: readonly unknown[];
}

export function harness(turns: readonly (readonly ProviderChunkLike[])[], opts: HarnessOptions = {}) {
  const { tools = [getWeather, cToF, shout], ...authoring } = opts;
  return agent({
    model: testModel(scriptedProvider(turns as Parameters<typeof scriptedProvider>[0])),
    instructions: "build what you need",
    tools: tools as never,
    use: [toolAuthoring(authoring)],
  });
}

export async function collect(h: { [Symbol.asyncIterator](): AsyncIterator<MithrilEvent> }): Promise<MithrilEvent[]> {
  const out: MithrilEvent[] = [];
  for await (const e of h) out.push(e);
  return out;
}

export const results = (events: readonly MithrilEvent[]): unknown[] =>
  events.filter((e): e is MithrilEvent & { type: "tool.result" } => e.type === "tool.result").map((e) => e.output);

export const errors = (events: readonly MithrilEvent[]): string[] =>
  events.filter((e): e is MithrilEvent & { type: "tool.error" } => e.type === "tool.error").map((e) => e.error.message);

export const progress = (events: readonly MithrilEvent[]): JsonValue[] =>
  events.filter((e): e is MithrilEvent & { type: "tool.progress" } => e.type === "tool.progress").map((e) => e.payload);

/** A composition body over `get_weather` + `c_to_f`, the running example. */
export const WEATHER_F_BODY: JsonValue = {
  kind: "composition",
  steps: [
    { id: "w", tool: "get_weather", args: { city: { from: "input", path: "city" } } },
    { id: "f", tool: "c_to_f", args: { celsius: { from: "step", id: "w", path: "tempC" } } },
  ],
};

export const WEATHER_F_DEF: JsonValue = {
  name: "weather_f",
  description: "weather in fahrenheit",
  inputSchema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] },
  body: WEATHER_F_BODY,
};
