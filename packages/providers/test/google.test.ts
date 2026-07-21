import { expect, test } from "bun:test";
import { agent, defaultRuntime, tool } from "@mithril/core/agent";
import type { RuntimeAdapter, StandardSchemaV1, Transport } from "@mithril/core/protocol";
import { google, googleProvider } from "../src/google/index.ts";

function sse(objs: readonly unknown[]): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const o of objs) c.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}
function rtWith(fetchImpl: typeof fetch): RuntimeAdapter {
  return { ...defaultRuntime(), fetch: fetchImpl };
}
function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "t", validate: (v) => ({ value: v as T }) } };
}
const TRANSPORT: Transport = { kind: "byok", apiKey: "k" };

test("parses Gemini streaming text + function calls, and drives the loop", async () => {
  let seen = "";
  const weather = tool({ name: "weather", description: "", inputSchema: schema<{ city: string }>(), execute: async ({ city }) => { seen = city; return { city }; } });
  const rt = rtWith(
    (() => {
      let i = 0;
      const responses = [
        () => sse([{ candidates: [{ content: { parts: [{ functionCall: { name: "weather", args: { city: "NYC" } } }] }, finishReason: "STOP" }] }]),
        () => sse([{ candidates: [{ content: { parts: [{ text: "Sunny" }] }, finishReason: "STOP" }], usageMetadata: { candidatesTokenCount: 1 } }]),
      ];
      return async () => (responses[i++] ?? responses[1])?.() ?? new Response(null, { status: 500 });
    })() as typeof fetch,
  );
  const a = agent({ model: google("gemini-2.0-flash"), instructions: "x", tools: [weather] });
  const res = await a.run("weather?", { deps: undefined, runtime: rt, transport: TRANSPORT });
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("Sunny");
  expect(seen).toBe("NYC");
  expect(googleProvider().spec.id).toBe("google");
});
