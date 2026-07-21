/**
 * Connect to an MCP server, list its tools, and expose them as Mithril tools — and, the other direction,
 * expose Mithril tools as an MCP server.
 *
 * @remarks
 * An official Streamable-HTTP transport ships at `@mithril/mcp/http` ({@link httpTransport}); you can still
 * implement {@link McpTransport} yourself (stdio, in-memory). Pass a transport to {@link mcpClient}, then
 * wrap the tools with {@link mcpTools}. To serve your own tools over MCP, use `mcpServer` from
 * `@mithril/mcp/server`.
 *
 * @packageDocumentation
 */

import type { JsonValue, StandardSchemaV1, Tool } from "@mithril/core/protocol";

// MCP client: connect to an MCP server over a transport, list its tools, and expose them as Mithril tools.
// The transport is abstracted (HTTP/SSE or stdio) so the client is testable against an in-memory server.

/**
 * The transport you implement to carry MCP JSON-RPC calls to a server.
 *
 * @remarks
 * This package provides no concrete transport — implement this interface over HTTP/SSE, stdio, or an
 * in-memory server (which is how the client is tested). Passed to {@link mcpClient}.
 */
export interface McpTransport {
  /** Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result. */
  request(method: string, params: JsonValue): Promise<JsonValue>;
  /** Optional teardown, invoked by {@link McpClient.close}. */
  close?(): Promise<void>;
}

/** An MCP server's description of one tool, as returned by `tools/list`. */
export interface McpToolDef {
  /** The tool's unique name, used when calling it. */
  readonly name: string;
  /** Human-readable description, if the server provides one. */
  readonly description?: string;
  /** The tool's JSON Schema, kept opaque here (not validated against). */
  readonly inputSchema?: JsonValue; // JSON Schema (opaque here)
}

/** A connected MCP client over an {@link McpTransport}. Create one with {@link mcpClient}. */
export interface McpClient {
  /** List the server's advertised tools. */
  listTools(): Promise<readonly McpToolDef[]>;
  /** Invoke a tool by name; text content is flattened and JSON-parsed when possible, else returned raw. */
  callTool(name: string, args: JsonValue): Promise<JsonValue>;
  /** Close the underlying transport (if it defines {@link McpTransport.close}). */
  close(): Promise<void>;
}

/**
 * Create an {@link McpClient} over a caller-supplied {@link McpTransport}.
 *
 * @param transport - Your transport implementation (HTTP/SSE, stdio, or in-memory).
 * @returns A client that can list and call the server's tools.
 * @example
 * ```ts
 * import { mcpClient, mcpTools, type McpTransport } from "@mithril/mcp";
 *
 * // You implement the transport — this package ships none.
 * const transport: McpTransport = {
 *   request: (method, params) => rpc.send(method, params),
 * };
 *
 * const client = mcpClient(transport);
 * const tools = await mcpTools(client); // hand these to an agent
 * ```
 */
export function mcpClient(transport: McpTransport): McpClient {
  return {
    async listTools() {
      const r = await transport.request("tools/list", {});
      const tools = (r as { readonly tools?: readonly McpToolDef[] }).tools;
      return tools ?? [];
    },
    async callTool(name, args) {
      const r = await transport.request("tools/call", { name, arguments: args });
      // MCP returns { content: [{ type: "text", text }] }; flatten text content, else pass the raw result.
      const content = (r as { readonly content?: readonly { readonly type: string; readonly text?: string }[] }).content;
      if (content !== undefined) {
        const text = content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
        try {
          return JSON.parse(text) as JsonValue;
        } catch {
          return text;
        }
      }
      return r;
    },
    async close() {
      await transport.close?.();
    },
  };
}

// A permissive Standard Schema (MCP tools carry a JSON Schema we don't validate against here — a real
// JSON-Schema→Standard-Schema bridge is a follow-up, same gap as provider tool params).
function passthroughSchema(): StandardSchemaV1<unknown, JsonValue> {
  return { "~standard": { version: 1, vendor: "mcp", validate: (v) => ({ value: v as JsonValue }) } };
}

/**
 * Fetch an MCP server's tools and wrap each as a Mithril {@link Tool} that calls it.
 *
 * @remarks
 * Each wrapped tool uses a **passthrough, non-validating** schema: the server's JSON Schema is not
 * enforced client-side, so inputs are forwarded to the server as-is. Execution routes through
 * {@link McpClient.callTool}.
 *
 * @param client - A connected {@link McpClient} (see {@link mcpClient}).
 * @returns One Mithril tool per advertised MCP tool, ready to hand to an agent.
 */
export async function mcpTools(client: McpClient): Promise<readonly Tool<string, JsonValue, JsonValue, unknown>[]> {
  const defs = await client.listTools();
  return defs.map((def) => ({
    name: def.name,
    description: def.description ?? def.name,
    inputSchema: passthroughSchema(),
    execute: (input: JsonValue) => client.callTool(def.name, input),
  }));
}
