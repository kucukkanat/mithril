import { expect, test } from "bun:test";
import { agent, tool } from "@mithril/core/agent";
import type { JsonValue, ProviderChunk, StandardSchemaV1, UsageDelta } from "@mithril/core/protocol";
import { withJsonSchema } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { mcpClient, type McpTransport, mcpTools } from "../src/index.ts";
import { httpTransport } from "../src/http.ts";
import { mcpServer } from "../src/server.ts";

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "test", validate: (v) => ({ value: v as T }) } };
}
const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

function makeServer() {
  const add = tool({
    name: "add",
    description: "add two numbers",
    inputSchema: withJsonSchema(schema<{ a: number; b: number }>(), {
      type: "object",
      properties: { a: { type: "number" }, b: { type: "number" } },
      required: ["a", "b"],
    }),
    execute: async ({ a, b }) => ({ sum: a + b }),
  });
  return mcpServer([add], { name: "calc", version: "1.0.0" });
}

// Bridge an mcpServer.handle directly into an McpTransport (no HTTP at all).
function directTransport(): McpTransport {
  const server = makeServer();
  return {
    async request(method, params) {
      const res = (await server.handle({ jsonrpc: "2.0", id: 1, method, params })) as { result?: JsonValue };
      return res.result ?? null;
    },
  };
}

test("mcpServer advertises real JSON-Schema parameters via tools/list", async () => {
  const client = mcpClient(directTransport());
  const [add] = await client.listTools();
  expect(add?.name).toBe("add");
  expect(add?.inputSchema).toEqual({ type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"] });
});

test("round trip: mcpServer → transport → mcpClient → agent runs the tool", async () => {
  const tools = await mcpTools(mcpClient(directTransport()));
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "add", input: { a: 4, b: 5 } as JsonValue }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "9" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
  const res = await agent({ model: testModel(scriptedProvider(turns)), instructions: "use tools", tools }).run("add 4 and 5");
  expect(res.status).toBe("completed");
});

test("httpTransport POSTs JSON-RPC and reads the server's reply (injected fetch → serve)", async () => {
  const server = makeServer();
  const fakeFetch = (async (_url: string, init?: { body?: string }) =>
    server.serve(new Request("https://mcp.test/", { method: "POST", body: init?.body, headers: { "content-type": "application/json" } }))) as unknown as typeof fetch;

  const client = mcpClient(httpTransport({ url: "https://mcp.test/", fetch: fakeFetch }));
  expect((await client.listTools()).map((t) => t.name)).toEqual(["add"]);
  expect(await client.callTool("add", { a: 2, b: 40 })).toEqual({ sum: 42 });
});

test("httpTransport parses a text/event-stream framed response", async () => {
  const fakeFetch = (async () => {
    const rpc = { jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text: JSON.stringify("pong") }] } };
    const body = `event: message\ndata: ${JSON.stringify(rpc)}\n\n`;
    return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
  }) as unknown as typeof fetch;
  const client = mcpClient(httpTransport({ url: "https://mcp.test/", fetch: fakeFetch }));
  expect(await client.callTool("ping", {})).toBe("pong");
});

test("mcpServer reports an unknown tool as a JSON-RPC error", async () => {
  const res = (await makeServer().handle({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "nope", arguments: {} } })) as {
    error?: { code: number };
  };
  expect(res.error?.code).toBe(-32602);
});
