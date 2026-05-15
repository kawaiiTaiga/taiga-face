export type BindingType = "num" | "icon";
export type Align = "left" | "center" | "right";
export type StackDirection = "x" | "y";
export type StackAlign = "start" | "center" | "end";

export interface HSVColorSpec {
  h: string;
  s: string;
  v: string;
  a: string;
}

export interface StrokeColorSpec extends HSVColorSpec {
  w: string;
}

export interface SceneSpec {
  version: number;
  theme?: Record<string, string>;
  bindings?: Record<string, BindingType>;
  layers: LayerSpec[];
}

export interface FieldLayerSpec {
  id: string;
  kind: "field";
  h: string;
  s: string;
  v: string;
  a: string;
}

export interface NodesLayerSpec {
  id: string;
  kind: "nodes";
  defs?: Record<string, string>;
  nodes: NodeSpec[];
}

export type LayerSpec = FieldLayerSpec | NodesLayerSpec;

export interface BaseNodeSpec {
  type: NodeSpec["type"];
  when?: string;
}

export interface DiscNodeSpec extends BaseNodeSpec {
  type: "disc";
  x: string;
  y: string;
  r: string;
  fill: HSVColorSpec;
}

export interface ArcNodeSpec extends BaseNodeSpec {
  type: "arc";
  x: string;
  y: string;
  r: string;
  start: string;
  sweep: string;
  stroke: StrokeColorSpec;
}

export interface LineNodeSpec extends BaseNodeSpec {
  type: "line";
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  stroke: StrokeColorSpec;
}

export interface RoundRectNodeSpec extends BaseNodeSpec {
  type: "roundrect";
  x: string;
  y: string;
  w: string;
  h: string;
  radius: string;
  fill: HSVColorSpec;
}

export interface TextNodeSpec extends BaseNodeSpec {
  type: "text";
  x: string;
  y: string;
  value: string;
  size: string;
  align?: Align;
  weight?: string;
  fill: HSVColorSpec;
}

export interface IconNodeSpec extends BaseNodeSpec {
  type: "icon";
  x: string;
  y: string;
  glyph: string;
  size: string;
  fill: HSVColorSpec;
}

export interface RepeatNodeSpec extends BaseNodeSpec {
  type: "repeat";
  idx: string;
  count: number;
  children: NodeSpec[];
}

export interface StackNodeSpec extends BaseNodeSpec {
  type: "stack";
  x: string;
  y: string;
  dir: StackDirection;
  gap: string;
  align?: StackAlign;
  children: NodeSpec[];
}

export interface GroupNodeSpec extends BaseNodeSpec {
  type: "group";
  x: string;
  y: string;
  rotate?: string;
  opacity?: string;
  children: NodeSpec[];
}

export type NodeSpec =
  | DiscNodeSpec
  | ArcNodeSpec
  | LineNodeSpec
  | RoundRectNodeSpec
  | TextNodeSpec
  | IconNodeSpec
  | RepeatNodeSpec
  | StackNodeSpec
  | GroupNodeSpec;

export interface RuntimeData {
  [key: string]: number | string;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationStats {
  layerCount: number;
  nodeCount: number;
  expressionCount: number;
  hasFieldLayer: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  stats: ValidationStats;
}

export interface RuntimeStatus {
  fps: number;
  nodeCount: number;
  specId: string | null;
  bindings: Record<string, BindingType>;
  errors: ValidationError[];
}

export interface ClockValues {
  hour12: number;
  hour24: number;
  minute: number;
  second: number;
}

export interface ClockOverride {
  hour24?: number;
  minute?: number;
  second?: number;
}

export const KNOWN_NODE_TYPES = [
  "disc",
  "arc",
  "line",
  "roundrect",
  "text",
  "icon",
  "repeat",
  "stack",
  "group"
] as const;

export const MAX_LAYER_COUNT = 8;
export const MAX_REPEAT_COUNT = 60;
export const MAX_TOTAL_NODE_COUNT = 500;
export const MAX_NESTING_DEPTH = 5;
export const MAX_EXPRESSION_DEPTH = 20;
export const FIELD_CELL_SIZE = 4;

export const DEFAULT_THEME = {
  accent_h: "0.58",
  accent_s: "0.85",
  accent_v: "1.0"
} as const;

export interface EditorBindingConfig {
  min: number;
  max: number;
  step: number;
}
