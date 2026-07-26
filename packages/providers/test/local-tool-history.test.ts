import { describe, expect, test } from "bun:test";
import { angleToolCall, formatForModel, gemmaToolCall, liquidToolCall, toTemplateMessages } from "../src/transformers/tool-formats.ts";

/*
 * Local models see ONLY `{ role, content }` — a chat template has nowhere to put structured tool calls. So
 * the assistant turn that made a call must be re-rendered in the model's own grammar, or step 2 arrives as
 * "here is a result, you have no idea what asked for it" and small models answer by inventing.
 *
 * The load-bearing property is round-tripping: render(calls) must parse back to calls through the SAME
 * format's extract, for every family — that is what makes the replayed turn indistinguishable from output
 * the model itself generated.
 */

const CALLS = [{ name: "weather", input: { city: "NYC", days: 3, exact: true, note: null } }];

describe("render ∘ extract round-trips per family", () => {
  for (const fmt of [angleToolCall, gemmaToolCall, liquidToolCall]) {
    test(fmt.name, () => {
      const rendered = fmt.render(CALLS);
      expect(rendered).toContain(fmt.start);
      // Strip the sentinels the state machine would have consumed, then parse the payload back.
      const body = rendered.slice(rendered.indexOf(fmt.start) + fmt.start.length);
      const payload = fmt.end === null ? body : body.slice(0, body.indexOf(fmt.end));
      expect(fmt.extract(payload)).toEqual(CALLS);
    });
  }
});

test("liquid renders Python kwargs, not JSON", () => {
  expect(liquidToolCall.render([{ name: "weather", input: { city: "NYC", exact: true } }])).toBe(
    '<|tool_call_start|>[weather(city="NYC", exact=True)]<|tool_call_end|>',
  );
});

test("parallel calls in one turn survive the round trip", () => {
  const two = [
    { name: "weather", input: { city: "NYC" } },
    { name: "notes", input: { person: "Tolga" } },
  ];
  for (const fmt of [angleToolCall, liquidToolCall]) {
    const rendered = fmt.render(two);
    const found = rendered.split(fmt.start).flatMap((chunk) => {
      const payload = fmt.end === null ? chunk : chunk.slice(0, chunk.indexOf(fmt.end));
      return payload === "" ? [] : fmt.extract(payload);
    });
    expect(found).toEqual(two);
  }
});

test("a tool-calling assistant turn is re-stated in the model's grammar", () => {
  const out = toTemplateMessages(
    "be helpful",
    [
      { role: "user", content: "weather?", toolCalls: [] },
      { role: "assistant", content: "", toolCalls: [{ name: "weather", input: { city: "NYC" } }] },
      { role: "tool", content: '{"tempC":21}', toolCalls: [] },
    ],
    formatForModel("LiquidAI/LFM2.5-1.2B-Instruct-ONNX"),
  );
  expect(out).toEqual([
    { role: "system", content: "be helpful" },
    { role: "user", content: "weather?" },
    { role: "assistant", content: '<|tool_call_start|>[weather(city="NYC")]<|tool_call_end|>' },
    { role: "tool", content: '{"tempC":21}' },
  ]);
});

test("visible text is kept alongside the re-stated call", () => {
  const out = toTemplateMessages(
    "",
    [{ role: "assistant", content: "Let me check.", toolCalls: [{ name: "weather", input: {} }] }],
    angleToolCall,
  );
  expect(out[0]?.content).toBe('Let me check.\n<tool_call>\n{"name":"weather","arguments":{}}\n</tool_call>');
});

test("no tools declared ⇒ history passes through untouched, no system turn when empty", () => {
  const out = toTemplateMessages("", [{ role: "assistant", content: "hi", toolCalls: [{ name: "x", input: {} }] }], undefined);
  expect(out).toEqual([{ role: "assistant", content: "hi" }]);
});
