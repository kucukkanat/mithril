import { expect, test } from "bun:test";
import type { MithrilEvent, StandardSchemaV1 } from "../src/protocol/index.ts";
import { agent, agentLoop, bestOfN, selfConsistency, tool } from "../src/agent/index.ts";
import { scriptedProvider, testModel, textTurn, toolCallTurn } from "../src/testkit/index.ts";

function passSchema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
async function collect<R>(gen: AsyncGenerator<MithrilEvent, R>): Promise<{ readonly events: readonly MithrilEvent[]; readonly result: R }> {
  const events: MithrilEvent[] = [];
  for (;;) {
    const r = await gen.next();
    if (r.done) return { events, result: r.value };
    events.push(r.value);
  }
}

test("selfConsistency samples N and takes the majority tool call", async () => {
  let executedCity = "";
  const weather = tool({
    name: "weather",
    description: "",
    inputSchema: passSchema<{ city: string }>(),
    execute: async ({ city }) => {
      executedCity = city;
      return { ok: true };
    },
  });
  // step 0 draws 3 samples: A, A, B → majority A. step 1 draws 3 identical "done" → completes.
  const provider = scriptedProvider([
    toolCallTurn("weather", { city: "A" }),
    toolCallTurn("weather", { city: "A" }),
    toolCallTurn("weather", { city: "B" }),
    textTurn("done"),
    textTurn("done"),
    textTurn("done"),
  ]);
  const res = await agent({
    model: testModel(provider),
    instructions: "hi",
    tools: [weather],
    use: [selfConsistency({ n: 3 })],
  }).run("go");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("done");
  expect(executedCity).toBe("A"); // the majority answer won, not the odd-one-out "B"
});

test("selfConsistency emits a custom event trail for its samples and decision", async () => {
  const provider = scriptedProvider([textTurn("x"), textTurn("x"), textTurn("y")]);
  const { events } = await collect(
    agentLoop({
      model: testModel(provider),
      instructions: "hi",
      tools: [],
      input: "go",
      deps: undefined,
      middlewares: [selfConsistency({ n: 3 })],
    }),
  );
  const sc = events.filter((e) => e.type === "custom.selfConsistency");
  expect(sc.length).toBeGreaterThanOrEqual(3); // one per sample + the decision
});

test("bestOfN keeps the highest-scoring candidate", async () => {
  const provider = scriptedProvider([textTurn("a"), textTurn("bb"), textTurn("ccc")]);
  const res = await agent({
    model: testModel(provider),
    instructions: "hi",
    use: [bestOfN({ n: 3, score: (r) => r.text.length })],
  }).run("go");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("ccc"); // longest wins
});

test("bestOfN stops early once a candidate clears the threshold", async () => {
  let calls = 0;
  const provider = scriptedProvider([textTurn("short"), textTurn("this-one-is-long-enough"), textTurn("never-reached")]);
  const res = await agent({
    model: testModel(provider),
    instructions: "hi",
    use: [
      bestOfN({
        n: 3,
        threshold: 10,
        score: (r) => {
          calls += 1;
          return r.text.length;
        },
      }),
    ],
  }).run("go");
  expect(res.status).toBe("completed");
  expect(calls).toBe(2); // stopped after the 2nd candidate cleared the threshold
});
