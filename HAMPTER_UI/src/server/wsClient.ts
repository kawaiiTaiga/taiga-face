import type { ValidationResult, RuntimeStatus } from "../runtime";
import type {
  HampterWsClientMessage,
  HampterWsServerMessage,
  WsStatusSnapshotMessage
} from "./protocol";
import type { RuntimeData, SceneSpec } from "../runtime";

type ConnectionListener = (connected: boolean) => void;
type MessageListener = (message: HampterWsServerMessage) => void;

export class HampterWsClient {
  private socket: WebSocket | null = null;
  private reconnectHandle: number | null = null;
  private connectionListener?: ConnectionListener;
  private messageListener?: MessageListener;

  constructor(private readonly url: string) {}

  connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("open", () => {
      this.send({
        type: "hello",
        role: "browser"
      });
      this.connectionListener?.(true);
    });
    this.socket.addEventListener("close", () => {
      this.connectionListener?.(false);
      this.scheduleReconnect();
    });
    this.socket.addEventListener("error", () => {
      this.connectionListener?.(false);
    });
    this.socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as HampterWsServerMessage;
        this.messageListener?.(payload);
      } catch {
        this.messageListener?.({
          type: "status_snapshot",
          connected: false,
          currentSpec: null,
          currentData: {},
          validation: null,
          status: null
        } satisfies WsStatusSnapshotMessage);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectHandle) {
      window.clearTimeout(this.reconnectHandle);
      this.reconnectHandle = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  onConnection(listener: ConnectionListener): void {
    this.connectionListener = listener;
  }

  onMessage(listener: MessageListener): void {
    this.messageListener = listener;
  }

  sendValidation(result: ValidationResult): void {
    this.send({
      type: "validation",
      result
    });
  }

  sendSpec(spec: SceneSpec): void {
    this.send({
      type: "spec",
      spec
    });
  }

  sendData(data: RuntimeData): void {
    this.send({
      type: "data",
      data
    });
  }

  sendClear(): void {
    this.send({
      type: "clear"
    });
  }

  sendStatus(status: RuntimeStatus): void {
    this.send({
      type: "status",
      status
    });
  }

  private send(message: HampterWsClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  private scheduleReconnect(): void {
    if (this.reconnectHandle) {
      return;
    }
    this.reconnectHandle = window.setTimeout(() => {
      this.reconnectHandle = null;
      this.connect();
    }, 2000);
  }
}
