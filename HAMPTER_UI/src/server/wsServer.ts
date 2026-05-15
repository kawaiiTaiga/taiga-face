import { WebSocketServer, type WebSocket } from "ws";
import { validateSceneSpec } from "../runtime";
import type { RuntimeData, RuntimeStatus, SceneSpec, ValidationResult } from "../runtime";
import type {
  HampterWsClientMessage,
  HampterWsServerMessage,
  WsResponseMessage,
  WsStatusSnapshotMessage
} from "./protocol";

interface ServerState {
  currentSpec: SceneSpec | null;
  lastValidSpec: SceneSpec | null;
  currentData: RuntimeData;
  validation: ValidationResult | null;
  status: RuntimeStatus | null;
}

interface ClientMeta {
  role: "browser" | "external";
}

const port = Number(process.env.HAMPTER_UI_WS_PORT ?? "8090");
const wss = new WebSocketServer({ port });
const clients = new Map<WebSocket, ClientMeta>();
const state: ServerState = {
  currentSpec: null,
  lastValidSpec: null,
  currentData: {},
  validation: null,
  status: null
};

wss.on("connection", (socket) => {
  clients.set(socket, { role: "external" });
  send(socket, buildSnapshot());

  socket.on("message", (buffer) => {
    try {
      const message = JSON.parse(String(buffer)) as HampterWsClientMessage;
      handleMessage(socket, message);
    } catch (error) {
      send(socket, {
        type: "response",
        ok: false,
        error: error instanceof Error ? error.message : "Invalid message."
      });
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
  });
});

console.log(`HAMPTER WS server listening on ws://localhost:${port}`);

function handleMessage(socket: WebSocket, message: HampterWsClientMessage): void {
  switch (message.type) {
    case "hello":
      clients.set(socket, { role: message.role });
      send(socket, buildSnapshot());
      break;
    case "spec":
      state.currentSpec = message.spec;
      state.validation = validateSceneSpec(message.spec);
      if (state.validation.valid) {
        state.lastValidSpec = message.spec;
        state.currentData = filterDataForBindings(state.currentData, message.spec.bindings ?? {});
      }
      broadcastToBrowsers({
        type: "spec",
        spec: message.spec
      });
      respond(socket, message.requestId, {
        ok: state.validation.valid,
        validation: state.validation,
        status: state.status,
        currentSpec: state.currentSpec,
        currentData: state.currentData
      });
      break;
    case "data": {
      const dataResult = validateDataUpdate(message.data, state.lastValidSpec);
      if (!dataResult.ok) {
        respond(socket, message.requestId, {
          ok: false,
          error: dataResult.error,
          validation: state.validation,
          status: state.status,
          currentSpec: state.currentSpec,
          currentData: state.currentData
        });
        return;
      }
      state.currentData = {
        ...state.currentData,
        ...message.data
      };
      broadcastToBrowsers({
        type: "data",
        data: state.currentData
      });
      respond(socket, message.requestId, {
        ok: true,
        validation: state.validation,
        status: state.status,
        currentSpec: state.currentSpec,
        currentData: state.currentData
      });
      break;
    }
    case "clear":
      state.currentSpec = null;
      state.lastValidSpec = null;
      state.currentData = {};
      state.validation = null;
      broadcastToBrowsers({ type: "clear" });
      respond(socket, message.requestId, {
        ok: true,
        validation: null,
        status: state.status,
        currentSpec: null,
        currentData: {}
      });
      break;
    case "validation":
      state.validation = message.result;
      break;
    case "status":
      state.status = message.status;
      break;
    case "status_request":
      respond(socket, message.requestId, {
        ok: true,
        connected: hasBrowserClient(),
        validation: state.validation,
        status: state.status,
        currentSpec: state.currentSpec,
        currentData: state.currentData
      });
      break;
  }
}

function hasBrowserClient(): boolean {
  return [...clients.values()].some((client) => client.role === "browser");
}

function broadcastToBrowsers(message: HampterWsServerMessage): void {
  for (const [socket, meta] of clients.entries()) {
    if (meta.role === "browser" && socket.readyState === 1) {
      send(socket, message);
    }
  }
}

function send(socket: WebSocket, message: HampterWsServerMessage): void {
  socket.send(JSON.stringify(message));
}

function respond(
  socket: WebSocket,
  requestId: string | undefined,
  payload: Omit<WsResponseMessage, "type" | "requestId">
): void {
  if (!requestId) {
    return;
  }
  send(socket, {
    type: "response",
    requestId,
    ...payload
  });
}

function buildSnapshot(): WsStatusSnapshotMessage {
  return {
    type: "status_snapshot",
    connected: hasBrowserClient(),
    currentSpec: state.currentSpec,
    currentData: state.currentData,
    validation: state.validation,
    status: state.status
  };
}

function filterDataForBindings(
  data: RuntimeData,
  bindings: Record<string, "num" | "icon">
): RuntimeData {
  return Object.fromEntries(Object.entries(data).filter(([key]) => key in bindings));
}

function validateDataUpdate(
  data: RuntimeData,
  spec: SceneSpec | null
): { ok: true } | { ok: false; error: string } {
  if (!spec) {
    return {
      ok: false,
      error: "No valid spec is loaded."
    };
  }

  const bindings = spec.bindings ?? {};
  for (const [key, value] of Object.entries(data)) {
    const bindingType = bindings[key];
    if (!bindingType) {
      return {
        ok: false,
        error: `Unknown binding "${key}".`
      };
    }
    if (bindingType === "num" && typeof value !== "number") {
      return {
        ok: false,
        error: `Binding "${key}" expects a numeric value.`
      };
    }
    if (bindingType === "icon" && typeof value !== "string") {
      return {
        ok: false,
        error: `Binding "${key}" expects an icon string.`
      };
    }
  }

  return { ok: true };
}
