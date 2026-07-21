# @mithril/mcp

Two directions:

- **Client** — connect to an MCP (Model Context Protocol) server and expose its tools as Mithril tools, so
  any MCP server becomes tools your agent can call.
- **Server** — expose your own Mithril tools *as* an MCP server, so any MCP client can call them.

## Client

```ts
import { mcpClient, mcpTools } from "@mithril/mcp";
import { httpTransport } from "@mithril/mcp/http";
import { agent } from "mithril";

const client = mcpClient(httpTransport({ url: "http://localhost:8000/mcp", headers: { authorization: token } }));
const tools = await mcpTools(client); // MCP server tools → Mithril tools

const assistant = agent({ model, instructions: "Use the available tools.", tools });
await assistant.run("…"); // tool calls are routed to the MCP server
```

`httpTransport` speaks MCP Streamable HTTP (handles a plain JSON or a `text/event-stream` reply) and takes an
injectable `fetch`. You can still implement `McpTransport` yourself for stdio or an in-memory server.

## Server

```ts
import { mcpServer } from "@mithril/mcp/server";

const server = mcpServer([weatherTool, searchTool], { name: "my-tools", version: "1.0.0" });

// mount on any HTTP framework — `serve` is a fetch handler:
Bun.serve({ port: 8787, fetch: (req) => server.serve(req) });
```

`mcpServer` implements `initialize`, `tools/list` (advertising each tool's real JSON-Schema params via
`toJsonSchema`), and `tools/call`. Any Mithril tool works — including one wrapping a sub-agent via `asTool`.

## API

- `mcpClient(transport)` → `{ listTools(), callTool(name, args), close() }`.
- `mcpTools(client)` → `readonly Tool[]` — each wraps `client.callTool`.
- `httpTransport({ url, fetch?, headers?, sessionId? })` → `McpTransport` (from `@mithril/mcp/http`).
- `mcpServer(tools, info?, { deps?, toolSchema?, runtime? })` → `{ handle(request), serve(request) }` (from `@mithril/mcp/server`).
- `McpTransport` = `{ request(method, params): Promise<JsonValue>; close?() }` — implement it over any JSON-RPC channel.

MCP `tools/call` text content is JSON-parsed when possible, else returned as a string.
