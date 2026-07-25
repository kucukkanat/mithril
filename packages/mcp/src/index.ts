/**
 * Connect to an MCP server, list its tools, and expose them as Mithril tools — and, the other direction,
 * expose Mithril tools as an MCP server.
 *
 * @remarks
 * The client speaks the full MCP lifecycle: it runs the `initialize` → `notifications/initialized`
 * handshake once (lazily, on first use — you never have to call it), captures the negotiated
 * `protocolVersion` / `capabilities` / `serverInfo`, propagates the server-assigned session across
 * requests (see {@link httpTransport}), pages through `tools/list`, and **fails loud** on a tool result
 * flagged `isError`. An official Streamable-HTTP transport ships at `@mithril/mcp/http`
 * ({@link httpTransport}); you can still implement {@link McpTransport} yourself (stdio, in-memory). Pass a
 * transport to {@link mcpClient}, then wrap the tools with {@link mcpTools}. To serve your own tools over
 * MCP, use `mcpServer` from `@mithril/mcp/server`.
 *
 * @packageDocumentation
 */

import type { JsonValue, StandardSchemaV1, Tool } from "@mithril/core/protocol";
import { fromJsonSchema, withJsonSchema } from "@mithril/core/protocol";

// MCP client: connect to an MCP server over a transport, run the lifecycle handshake, list its tools, and
// expose them as Mithril tools. The transport is abstracted (HTTP/SSE or stdio) so the client is testable
// against an in-memory server with zero network.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION / TYPE INDEX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   • McpError            — typed error thrown for JSON-RPC failures and isError tool results
//   • McpTransport        — the carrier you implement (request + optional notify/close)
//   • McpClient           — a connected client (connect/listTools/callTool/ping/close + negotiated info)
//   • mcpClient()         — create a client over a transport (auto-handshake on first use)
//   • mcpTools()          — wrap a server's tools as Mithril tools
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** The MCP protocol revision this client negotiates for. Servers may downgrade in their `initialize` reply. */
export const MCP_PROTOCOL_VERSION = "2025-06-18";

/**
 * A typed MCP failure. Thrown for a JSON-RPC `error` response and for a `tools/call` result flagged
 * `isError: true` (a server-reported tool failure), so a hidden failure never masquerades as success.
 *
 * @remarks `code` carries the JSON-RPC error code when the failure came from the protocol layer;
 * `data` carries the server's `structuredContent`/text payload for an `isError` tool result. Inside an
 * agent run the loop turns a thrown `McpError` into a model-visible `tool.error`.
 */
export class McpError extends Error {
  override readonly name = "McpError";
  /** JSON-RPC error code, when the failure originated as a JSON-RPC `error`. */
  readonly code?: number;
  /** Server-supplied error payload (structured content or flattened text), when present. */
  readonly data?: JsonValue;
  constructor(message: string, opts?: { readonly code?: number; readonly data?: JsonValue }) {
    super(message);
    if (opts?.code !== undefined) this.code = opts.code;
    if (opts?.data !== undefined) this.data = opts.data;
  }
}

/**
 * The transport you implement to carry MCP JSON-RPC traffic to a server.
 *
 * @remarks
 * An official Streamable-HTTP transport ships at `@mithril/mcp/http` ({@link httpTransport}). Implement
 * this interface yourself only for other carriers — stdio, or the in-memory server the client is tested
 * against. `request` carries a call that expects a reply; `notify` (optional) carries a fire-and-forget
 * JSON-RPC notification such as `notifications/initialized` (a transport that omits it simply skips the
 * post-handshake notification). Passed to {@link mcpClient}.
 */
export interface McpTransport {
  /** Send an MCP JSON-RPC request (e.g. `"tools/list"`, `"tools/call"`) and resolve its result. */
  request(method: string, params: JsonValue): Promise<JsonValue>;
  /** Send a JSON-RPC notification (no id, no reply expected), e.g. `"notifications/initialized"`. */
  notify?(method: string, params: JsonValue): Promise<void>;
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
  /** The tool's result JSON Schema, if the server advertises one (present ⇒ expect `structuredContent`). */
  readonly outputSchema?: JsonValue;
}

/** The result of the MCP lifecycle handshake — what the server negotiated on `initialize`. */
export interface McpServerDescription {
  /** Protocol revision the server agreed to (may differ from {@link MCP_PROTOCOL_VERSION}). */
  readonly protocolVersion: string;
  /** The server's advertised capabilities (`tools`, `resources`, `prompts`, …), kept opaque. */
  readonly capabilities: JsonValue;
  /** The server's self-identification. */
  readonly serverInfo: { readonly name: string; readonly version: string };
}

/** Identifies this client to a server on `initialize`. */
export interface McpClientInfo {
  readonly name: string;
  readonly version: string;
}

/** A connected MCP client over an {@link McpTransport}. Create one with {@link mcpClient}. */
export interface McpClient {
  /**
   * Run the lifecycle handshake (`initialize` → `notifications/initialized`) and return the negotiated
   * {@link McpServerDescription}. Idempotent and concurrency-safe: called automatically before the first
   * {@link McpClient.listTools}/{@link McpClient.callTool}, and only ever executes once per client.
   */
  connect(): Promise<McpServerDescription>;
  /** The negotiated server info once {@link McpClient.connect} has completed, else `undefined`. */
  readonly server: McpServerDescription | undefined;
  /** List the server's advertised tools, following `nextCursor` pagination to completion. */
  listTools(): Promise<readonly McpToolDef[]>;
  /**
   * Invoke a tool by name. Prefers the result's `structuredContent`; otherwise flattens text content
   * (JSON-parsed when possible). **Throws {@link McpError} when the result is flagged `isError`.**
   */
  callTool(name: string, args: JsonValue): Promise<JsonValue>;
  /** Liveness check — resolves when the server answers an MCP `ping`. */
  ping(): Promise<void>;
  /** Close the underlying transport (if it defines {@link McpTransport.close}). */
  close(): Promise<void>;
}

/** The client capabilities and identity advertised on `initialize`. */
export interface McpClientOptions {
  /** Client identity sent on `initialize` (default `{ name: "mithril", version: "0.0.0" }`). */
  readonly clientInfo?: McpClientInfo;
  /** Client capabilities advertised on `initialize` (default `{}`). */
  readonly capabilities?: JsonValue;
}

const DEFAULT_CLIENT_INFO: McpClientInfo = { name: "mithril", version: "0.0.0" };

// Flatten an MCP content array's text parts into one string (image/audio/resource parts are ignored here).
function flattenText(content: readonly { readonly type: string; readonly text?: string }[] | undefined): string {
  if (content === undefined) return "";
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("");
}

/**
 * Create an {@link McpClient} over a caller-supplied {@link McpTransport}.
 *
 * @param transport - Your transport implementation (HTTP/SSE via {@link httpTransport}, stdio, or in-memory).
 * @param opts - Optional client identity/capabilities advertised during the handshake (see {@link McpClientOptions}).
 * @returns A client that runs the MCP lifecycle on first use, then lists and calls the server's tools.
 * @remarks The handshake is lazy and runs exactly once — you never call {@link McpClient.connect} yourself
 *   unless you want the negotiated {@link McpServerDescription} up front.
 * @example
 * ```ts
 * import { mcpClient, mcpTools } from "@mithril/mcp";
 * import { httpTransport } from "@mithril/mcp/http";
 *
 * // Use the official Streamable-HTTP transport (or implement McpTransport for stdio/in-memory).
 * const client = mcpClient(httpTransport({ url: "https://example.com/mcp" }));
 * const tools = await mcpTools(client); // handshake runs here, then hand these to an agent
 * ```
 */
export function mcpClient(transport: McpTransport, opts?: McpClientOptions): McpClient {
  const clientInfo = opts?.clientInfo ?? DEFAULT_CLIENT_INFO;
  const clientCapabilities = opts?.capabilities ?? {};
  let server: McpServerDescription | undefined;
  let handshake: Promise<McpServerDescription> | undefined; // shared so concurrent first-callers connect once

  async function doConnect(): Promise<McpServerDescription> {
    const raw = await transport.request("initialize", {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: clientCapabilities,
      clientInfo: { name: clientInfo.name, version: clientInfo.version },
    });
    const r = (raw ?? {}) as {
      readonly protocolVersion?: string;
      readonly capabilities?: JsonValue;
      readonly serverInfo?: { readonly name?: string; readonly version?: string };
    };
    const negotiated: McpServerDescription = {
      protocolVersion: r.protocolVersion ?? MCP_PROTOCOL_VERSION,
      capabilities: r.capabilities ?? {},
      serverInfo: { name: r.serverInfo?.name ?? "unknown", version: r.serverInfo?.version ?? "0.0.0" },
    };
    // Per the spec the client MUST send `notifications/initialized` once it has processed the reply; a
    // transport without `notify` (a bare in-memory bridge) simply skips it.
    await transport.notify?.("notifications/initialized", {});
    server = negotiated;
    return negotiated;
  }

  function ensureConnected(): Promise<McpServerDescription> {
    return (handshake ??= doConnect());
  }

  return {
    connect: ensureConnected,
    get server() {
      return server;
    },
    async listTools() {
      await ensureConnected();
      const out: McpToolDef[] = [];
      let cursor: string | undefined;
      do {
        const r = (await transport.request("tools/list", cursor !== undefined ? { cursor } : {})) as {
          readonly tools?: readonly McpToolDef[];
          readonly nextCursor?: string;
        };
        if (r.tools !== undefined) out.push(...r.tools);
        cursor = r.nextCursor;
      } while (cursor !== undefined && cursor !== "");
      return out;
    },
    async callTool(name, args) {
      await ensureConnected();
      const r = (await transport.request("tools/call", { name, arguments: args })) as {
        readonly content?: readonly { readonly type: string; readonly text?: string }[];
        readonly structuredContent?: JsonValue;
        readonly isError?: boolean;
      };
      const text = flattenText(r.content);
      // Fail loud: a server-reported tool error must surface, never pass as a normal successful result.
      if (r.isError === true) {
        throw new McpError(`MCP tool "${name}" reported an error: ${text !== "" ? text : "(no message)"}`, {
          data: r.structuredContent ?? (text !== "" ? text : null),
        });
      }
      // Prefer a typed structuredContent payload (present when the tool advertises an outputSchema).
      if (r.structuredContent !== undefined) return r.structuredContent;
      if (r.content !== undefined) {
        // All-text content: flatten and JSON-parse when possible, else the raw string. Non-text content
        // (images/resources) is preserved by returning the content array unchanged.
        const allText = r.content.every((c) => c.type === "text");
        if (allText) {
          try {
            return JSON.parse(text) as JsonValue;
          } catch {
            return text;
          }
        }
        return r.content as JsonValue;
      }
      return (r ?? null) as JsonValue;
    },
    async ping() {
      await ensureConnected();
      await transport.request("ping", {});
    },
    async close() {
      await transport.close?.();
    },
  };
}

// A permissive Standard Schema, used when the server advertises no schema or one we cannot compile.
function passthroughSchema(): StandardSchemaV1<unknown, JsonValue> {
  return { "~standard": { version: 1, vendor: "mcp", validate: (v) => ({ value: v as JsonValue }) } };
}

// Compile the server's JSON Schema when we can, fall back to passthrough when we cannot.
//
// Two deliberate choices. `onUnsupported: "ignore"` rather than "throw", and a try/catch around it:
// real-world MCP servers ship schemas using `$ref`/`oneOf`, and refusing to connect to a server over a
// keyword we merely cannot *enforce* would trade a working integration for a purity point. Whatever we can
// check, we check; the rest passes through, exactly as before.
//
// The win is twofold: the model now sees the server's real parameter shape instead of a permissive
// `{ type: "object" }`, and obviously-wrong arguments fail locally with a specific message the loop's
// self-correction can act on, instead of costing a network round-trip to be rejected server-side.
function schemaFor(doc: JsonValue | undefined): StandardSchemaV1<unknown, JsonValue> {
  if (doc === undefined || doc === null) return passthroughSchema();
  try {
    return fromJsonSchema(doc, { onUnsupported: "ignore" });
  } catch {
    return withJsonSchema(passthroughSchema(), doc);
  }
}

/**
 * Fetch an MCP server's tools and wrap each as a Mithril {@link Tool} that calls it.
 *
 * @remarks
 * Runs the lifecycle handshake (via {@link McpClient.listTools}) if it has not happened yet. Execution
 * routes through {@link McpClient.callTool}, so a server-reported `isError` result throws {@link McpError}
 * and the agent loop surfaces it as a `tool.error`.
 *
 * The server's `inputSchema` is compiled with `fromJsonSchema` where possible, so the model is offered the
 * tool's **real** parameters and obviously-invalid arguments fail locally instead of costing a round-trip.
 * Compilation is lenient: keywords outside the supported subset (`$ref`, `oneOf`, …) are dropped rather
 * than enforced, and a schema that cannot be compiled at all falls back to passthrough — so a server is
 * never unusable merely because of a keyword we cannot check. What is *not* validated is simply forwarded,
 * as before.
 *
 * @param client - A connected {@link McpClient} (see {@link mcpClient}).
 * @returns One Mithril tool per advertised MCP tool, ready to hand to an agent.
 */
export async function mcpTools(client: McpClient): Promise<readonly Tool<string, JsonValue, JsonValue, unknown>[]> {
  const defs = await client.listTools();
  return defs.map((def) => ({
    name: def.name,
    description: def.description ?? def.name,
    inputSchema: schemaFor(def.inputSchema),
    execute: (input: JsonValue) => client.callTool(def.name, input),
  }));
}
