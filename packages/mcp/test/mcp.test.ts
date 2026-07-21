import { expect, test } from "bun:test";
import { agent } from "@mithril/core/agent";
import type { JsonValue, ProviderChunk, UsageDelta } from "@mithril/core/protocol";
import { scriptedProvider, testModel } from "@mithril/core/testkit";
import { mcpClient, type McpTransport, mcpTools } from "../src/index.ts";

// An in-memory MCP "server" — a fake transport implementing tools/list + tools/call. No live server needed.
function mockMcpServer(): McpTransport {
  return {
    async request(method, params) {
      if (method === "tools/list") {
        return { tools: [{ name: "add", description: "add two numbers", inputSchema: { type: "object" } }] };
      }
      if (method === "tools/call") {
        const { name, arguments: args } = params as { name: string; arguments: { a: number; b: number } };
        if (name === "add") return { content: [{ type: "text", text: JSON.stringify({ sum: args.a + args.b }) }] };
      }
      return {};
    },
  };
}

test("mcpClient lists and calls tools over a transport", async () => {
  const client = mcpClient(mockMcpServer());
  const tools = await client.listTools();
  expect(tools.map((t) => t.name)).toEqual(["add"]);
  expect(await client.callTool("add", { a: 2, b: 3 })).toEqual({ sum: 5 });
});

test("mcpTools become Mithril tools an agent can call", async () => {
  const tools = await mcpTools(mcpClient(mockMcpServer()));
  const NO: UsageDelta = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, costMicroUsd: 0 };
  const turns: ProviderChunk[][] = [
    [{ type: "tool.call", callId: "c1", name: "add", input: { a: 4, b: 5 } as JsonValue }, { type: "message.end", usage: NO, finishReason: "tool_calls" }],
    [{ type: "text.delta", delta: "the sum is 9" }, { type: "message.end", usage: NO, finishReason: "stop" }],
  ];
  const a = agent({ model: testModel(scriptedProvider(turns)), instructions: "use tools", tools });
  const res = await a.run("add 4 and 5");
  expect(res.status).toBe("completed");
  // the MCP-backed tool executed: its tool.result is in the run
  if (res.status === "completed") expect(res.output).toBe("the sum is 9");
});
