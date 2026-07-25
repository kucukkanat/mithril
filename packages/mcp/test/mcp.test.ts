import { expect, test } from "bun:test";
import { agent } from "@mithril/core/agent";
import type { JsonValue, ProviderChunk, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { McpError, mcpClient, type McpTransport, mcpTools } from "../src/index.ts";

const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };

// An in-memory MCP "server": a fake transport implementing initialize + tools/list + tools/call. It records
// every method it sees (requests and notifications) so tests can assert the lifecycle order. No live server.
function mockMcpServer(over?: {
  readonly toolsCall?: (name: string, args: JsonValue) => JsonValue;
  readonly toolsList?: JsonValue;
}): McpTransport & { readonly log: readonly string[] } {
  const log: string[] = [];
  return {
    log,
    async request(method, params) {
      log.push(method);
      if (method === "initialize") {
        return { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "mock", version: "1.0.0" } };
      }
      if (method === "tools/list") {
        return over?.toolsList ?? { tools: [{ name: "add", description: "add two numbers", inputSchema: { type: "object" } }] };
      }
      if (method === "tools/call") {
        const { name, arguments: args } = params as { name: string; arguments: JsonValue };
        if (over?.toolsCall !== undefined) return over.toolsCall(name, args);
        const a = args as { a: number; b: number };
        if (name === "add") return { content: [{ type: "text", text: JSON.stringify({ sum: a.a + a.b }) }] };
      }
      if (method === "ping") return {};
      return {};
    },
    async notify(method) {
      log.push(`notify:${method}`);
    },
  };
}

test("mcpClient runs the initialize → initialized handshake before any tools call", async () => {
  const server = mockMcpServer();
  const client = mcpClient(server);
  const tools = await client.listTools();
  expect(tools.map((t) => t.name)).toEqual(["add"]);
  // The handshake must precede tools/list, and the initialized notification must follow initialize.
  expect(server.log).toEqual(["initialize", "notify:notifications/initialized", "tools/list"]);
  expect(client.server?.serverInfo.name).toBe("mock");
  expect(client.server?.protocolVersion).toBe("2025-06-18");
});

test("connect() is idempotent and concurrency-safe (initialize runs exactly once)", async () => {
  const server = mockMcpServer();
  const client = mcpClient(server);
  await Promise.all([client.connect(), client.listTools(), client.callTool("add", { a: 1, b: 1 }), client.connect()]);
  expect(server.log.filter((m) => m === "initialize")).toHaveLength(1);
  expect(server.log.filter((m) => m === "notify:notifications/initialized")).toHaveLength(1);
});

test("mcpClient lists and calls tools over a transport", async () => {
  const client = mcpClient(mockMcpServer());
  expect((await client.listTools()).map((t) => t.name)).toEqual(["add"]);
  expect(await client.callTool("add", { a: 2, b: 3 })).toEqual({ sum: 5 });
});

test("callTool throws McpError (fail-loud) when the result is flagged isError", async () => {
  const client = mcpClient(
    mockMcpServer({ toolsCall: () => ({ content: [{ type: "text", text: "boom: upstream 500" }], isError: true }) }),
  );
  await expect(client.callTool("add", { a: 1, b: 2 })).rejects.toBeInstanceOf(McpError);
  await expect(client.callTool("add", { a: 1, b: 2 })).rejects.toThrow(/reported an error: boom/);
});

test("callTool prefers structuredContent when the tool advertises an outputSchema", async () => {
  const client = mcpClient(
    mockMcpServer({ toolsCall: () => ({ content: [{ type: "text", text: "{\"sum\":9}" }], structuredContent: { sum: 9, precise: true } }) }),
  );
  expect(await client.callTool("add", { a: 4, b: 5 })).toEqual({ sum: 9, precise: true });
});

test("listTools follows nextCursor pagination to completion", async () => {
  let page = 0;
  const paged: McpTransport = {
    async request(method) {
      if (method === "initialize") return { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "p", version: "1" } };
      if (method === "tools/list") {
        page += 1;
        if (page === 1) return { tools: [{ name: "a" }], nextCursor: "c2" };
        return { tools: [{ name: "b" }] };
      }
      return {};
    },
  };
  const names = (await mcpClient(paged).listTools()).map((t) => t.name);
  expect(names).toEqual(["a", "b"]);
});

test("a server that does not implement initialize still connects leniently", async () => {
  const bare: McpTransport = {
    async request(method) {
      if (method === "tools/list") return { tools: [{ name: "x" }] };
      return {}; // initialize returns {} → client fills defaults rather than throwing
    },
  };
  const client = mcpClient(bare);
  expect((await client.listTools()).map((t) => t.name)).toEqual(["x"]);
  expect(client.server?.serverInfo.name).toBe("unknown");
});

test("mcpTools become Mithril tools an agent can call", async () => {
  const tools = await mcpTools(mcpClient(mockMcpServer()));
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "add", input: { a: 4, b: 5 } as JsonValue }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "the sum is 9" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "use tools", tools });
  const res = await a.run("add 4 and 5");
  expect(res.status).toBe("completed");
  if (res.status === "completed") expect(res.output).toBe("the sum is 9");
});

test("an MCP tool's isError surfaces to the agent as a model-visible tool.error", async () => {
  const tools = await mcpTools(mcpClient(mockMcpServer({ toolsCall: () => ({ content: [{ type: "text", text: "denied" }], isError: true }) })));
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "add", input: { a: 1, b: 1 } as JsonValue }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "the tool failed" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
  const events: string[] = [];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "use tools", tools });
  for await (const e of a.stream("go")) events.push(e.type);
  // The failure is not swallowed: the loop emits a tool.error (not a plain tool.result).
  expect(events).toContain("tool.error");
});
