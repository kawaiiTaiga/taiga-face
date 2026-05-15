import type { RuntimeData, RuntimeStatus, SceneSpec, ValidationResult } from "../runtime";

export interface WsBaseMessage {
  type: string;
  requestId?: string;
}

export interface WsHelloMessage extends WsBaseMessage {
  type: "hello";
  role: "browser" | "external";
}

export interface WsSpecMessage extends WsBaseMessage {
  type: "spec";
  spec: SceneSpec;
}

export interface WsDataMessage extends WsBaseMessage {
  type: "data";
  data: RuntimeData;
}

export interface WsClearMessage extends WsBaseMessage {
  type: "clear";
}

export interface WsValidationMessage extends WsBaseMessage {
  type: "validation";
  result: ValidationResult;
}

export interface WsStatusMessage extends WsBaseMessage {
  type: "status";
  status: RuntimeStatus;
}

export interface WsStatusRequestMessage extends WsBaseMessage {
  type: "status_request";
}

export interface WsStatusSnapshotMessage extends WsBaseMessage {
  type: "status_snapshot";
  connected: boolean;
  currentSpec: SceneSpec | null;
  currentData: RuntimeData;
  validation: ValidationResult | null;
  status: RuntimeStatus | null;
}

export interface WsResponseMessage extends WsBaseMessage {
  type: "response";
  ok: boolean;
  error?: string;
  validation?: ValidationResult | null;
  status?: RuntimeStatus | null;
  connected?: boolean;
  currentSpec?: SceneSpec | null;
  currentData?: RuntimeData;
}

export type HampterWsClientMessage =
  | WsHelloMessage
  | WsSpecMessage
  | WsDataMessage
  | WsClearMessage
  | WsValidationMessage
  | WsStatusMessage
  | WsStatusRequestMessage;

export type HampterWsServerMessage =
  | WsSpecMessage
  | WsDataMessage
  | WsClearMessage
  | WsStatusSnapshotMessage
  | WsResponseMessage;
