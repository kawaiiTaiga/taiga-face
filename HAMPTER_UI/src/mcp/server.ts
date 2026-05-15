import WebSocket from "ws";
import { EXAMPLE_SPECS } from "../examples/specs";
import type { RuntimeData, SceneSpec } from "../runtime";
import type { WsResponseMessage } from "../server/protocol";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

class HampterRemoteClient {
  constructor(
    private readonly host: string,
    private readonly port: string
  ) {}

  async pushSpec(spec: SceneSpec): Promise<WsResponseMessage> {
    return this.sendRequest({
      type: "spec",
      spec
    });
  }

  async pushData(data: RuntimeData): Promise<WsResponseMessage> {
    return this.sendRequest({
      type: "data",
      data
    });
  }

  async clear(): Promise<WsResponseMessage> {
    return this.sendRequest({
      type: "clear"
    });
  }

  async status(): Promise<WsResponseMessage> {
    return this.sendRequest({
      type: "status_request"
    });
  }

  private async sendRequest(payload: Record<string, unknown>): Promise<WsResponseMessage> {
    const url = `ws://${this.host}:${this.port}`;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return await new Promise<WsResponseMessage>((resolve, reject) => {
      const socket = new WebSocket(url);
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error("Timed out waiting for the HAMPTER WS server."));
      }, 2000);

      socket.on("open", () => {
        socket.send(JSON.stringify({ type: "hello", role: "external" }));
        socket.send(JSON.stringify({ ...payload, requestId }));
      });

      socket.on("message", (buffer) => {
        try {
          const message = JSON.parse(String(buffer)) as WsResponseMessage & { type?: string };
          if (message.type === "response" && message.requestId === requestId) {
            clearTimeout(timeout);
            socket.close();
            resolve(message);
          }
        } catch (error) {
          clearTimeout(timeout);
          socket.close();
          reject(error);
        }
      });

      socket.on("error", (error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });
    });
  }
}

const remote = new HampterRemoteClient(
  process.env.HAMPTER_UI_WS_HOST ?? "localhost",
  process.env.HAMPTER_UI_WS_PORT ?? "8090"
);

let stdinBuffer = Buffer.alloc(0);

process.stdin.on("data", async (chunk: Buffer) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
  while (true) {
    const separator = stdinBuffer.indexOf("\r\n\r\n");
    if (separator === -1) {
      return;
    }

    const header = stdinBuffer.slice(0, separator).toString("utf8");
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!lengthMatch) {
      stdinBuffer = Buffer.alloc(0);
      return;
    }

    const contentLength = Number(lengthMatch[1]);
    const frameLength = separator + 4 + contentLength;
    if (stdinBuffer.length < frameLength) {
      return;
    }

    const body = stdinBuffer.slice(separator + 4, frameLength).toString("utf8");
    stdinBuffer = stdinBuffer.slice(frameLength);

    try {
      const request = JSON.parse(body) as JsonRpcRequest;
      const response = await handleRequest(request);
      if (response) {
        writeMessage(response);
      }
    } catch (error) {
      writeMessage({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: error instanceof Error ? error.message : "Parse error."
        }
      });
    }
  }
});

async function handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  if (request.method === "notifications/initialized") {
    return null;
  }

  try {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "hampter-ui-mcp",
              version: "0.1.0"
            }
          }
        };
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: {
            tools: buildToolDefinitions()
          }
        };
      case "tools/call":
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          result: await callTool(request.params ?? {})
        };
      default:
        return {
          jsonrpc: "2.0",
          id: request.id ?? null,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
    }
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id: request.id ?? null,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown MCP error."
      }
    };
  }
}

async function callTool(params: Record<string, unknown>): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  const toolName = String(params.name ?? "");
  const args = (params.arguments as Record<string, unknown> | undefined) ?? {};

  switch (toolName) {
    case "hampter_ui_push": {
      const response = await remote.pushSpec(args.spec as SceneSpec);
      return toolResult(response, !response.ok);
    }
    case "hampter_ui_data": {
      const response = await remote.pushData(args.data as RuntimeData);
      return toolResult(response, !response.ok);
    }
    case "hampter_ui_status": {
      const response = await remote.status();
      const payload = {
        connected: response.connected ?? false,
        currentSpecId: response.status?.specId ?? null,
        fps: response.status?.fps ?? 0,
        nodeCount: response.status?.nodeCount ?? 0,
        bindings: response.status?.bindings ?? response.currentSpec?.bindings ?? {},
        errors: response.validation?.errors ?? response.status?.errors ?? []
      };
      return toolResult(payload, false);
    }
    case "hampter_ui_clear": {
      const response = await remote.clear();
      return toolResult(response, !response.ok);
    }
    case "hampter_ui_examples":
      return toolResult(
        EXAMPLE_SPECS.map((example) => ({
          name: example.name,
          description: example.description,
          spec: example.spec
        })),
        false
      );
    default:
      throw new Error(`Unknown tool "${toolName}".`);
  }
}

function buildToolDefinitions(): Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> {
  return [
    {
      name: "hampter_ui_push",
      description:
        'Generate and render a UI scene on the HAMPTER circular display. Accepts a full SceneSpec JSON object with "field" and "nodes" layers.',
      inputSchema: {
        type: "object",
        properties: {
          spec: {
            type: "object",
            description: "Full SceneSpec JSON document."
          }
        },
        required: ["spec"],
        additionalProperties: false
      }
    },
    {
      name: "hampter_ui_data",
      description: "Update numeric or icon bindings on the currently rendered scene.",
      inputSchema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            description: "Binding name/value pairs."
          }
        },
        required: ["data"],
        additionalProperties: false
      }
    },
    {
      name: "hampter_ui_status",
      description: "Return current renderer connectivity, fps, node count, bindings, and errors.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: "hampter_ui_clear",
      description: "Clear the active scene and reset binding data.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: "hampter_ui_examples",
      description: "List built-in example specs the LLM can adapt or extend.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  ];
}

function toolResult(payload: unknown, isError: boolean): {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
} {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2)
      }
    ],
    ...(isError ? { isError: true } : {})
  };
}

function writeMessage(message: JsonRpcResponse): void {
  const body = JSON.stringify(message);
  const output = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
  process.stdout.write(output);
}
