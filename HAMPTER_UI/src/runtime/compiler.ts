import { compileExpression, type CompiledExpression } from "./expressions";
import type {
  FieldLayerSpec,
  GroupNodeSpec,
  HSVColorSpec,
  LayerSpec,
  LineNodeSpec,
  NodeSpec,
  NodesLayerSpec,
  RepeatNodeSpec,
  RoundRectNodeSpec,
  RuntimeData,
  SceneSpec,
  StackNodeSpec,
  StrokeColorSpec,
  TextNodeSpec
} from "./types";
import { DEFAULT_THEME } from "./types";

export interface CompiledColor {
  h: CompiledExpression;
  s: CompiledExpression;
  v: CompiledExpression;
  a: CompiledExpression;
  w?: CompiledExpression;
}

export interface CompiledBaseNode {
  type: NodeSpec["type"];
  when?: CompiledExpression;
}

export interface CompiledDiscNode extends CompiledBaseNode {
  type: "disc";
  x: CompiledExpression;
  y: CompiledExpression;
  r: CompiledExpression;
  fill: CompiledColor;
}

export interface CompiledArcNode extends CompiledBaseNode {
  type: "arc";
  x: CompiledExpression;
  y: CompiledExpression;
  r: CompiledExpression;
  start: CompiledExpression;
  sweep: CompiledExpression;
  stroke: CompiledColor;
}

export interface CompiledLineNode extends CompiledBaseNode {
  type: "line";
  x1: CompiledExpression;
  y1: CompiledExpression;
  x2: CompiledExpression;
  y2: CompiledExpression;
  stroke: CompiledColor;
}

export interface CompiledRoundRectNode extends CompiledBaseNode {
  type: "roundrect";
  x: CompiledExpression;
  y: CompiledExpression;
  w: CompiledExpression;
  h: CompiledExpression;
  radius: CompiledExpression;
  fill: CompiledColor;
}

export interface CompiledTextNode extends CompiledBaseNode {
  type: "text";
  x: CompiledExpression;
  y: CompiledExpression;
  size: CompiledExpression;
  value: string;
  align: TextNodeSpec["align"];
  weight: string;
  fill: CompiledColor;
}

export interface CompiledIconNode extends CompiledBaseNode {
  type: "icon";
  x: CompiledExpression;
  y: CompiledExpression;
  size: CompiledExpression;
  glyph: string;
  fill: CompiledColor;
}

export interface CompiledRepeatNode extends CompiledBaseNode {
  type: "repeat";
  idx: string;
  count: number;
  children: CompiledNode[];
}

export interface CompiledStackNode extends CompiledBaseNode {
  type: "stack";
  x: CompiledExpression;
  y: CompiledExpression;
  dir: StackNodeSpec["dir"];
  gap: CompiledExpression;
  align: StackNodeSpec["align"];
  children: CompiledNode[];
}

export interface CompiledGroupNode extends CompiledBaseNode {
  type: "group";
  x: CompiledExpression;
  y: CompiledExpression;
  rotate?: CompiledExpression;
  opacity?: CompiledExpression;
  children: CompiledNode[];
}

export type CompiledNode =
  | CompiledDiscNode
  | CompiledArcNode
  | CompiledLineNode
  | CompiledRoundRectNode
  | CompiledTextNode
  | CompiledIconNode
  | CompiledRepeatNode
  | CompiledStackNode
  | CompiledGroupNode;

export interface CompiledFieldLayer {
  id: string;
  kind: "field";
  h: CompiledExpression;
  s: CompiledExpression;
  v: CompiledExpression;
  a: CompiledExpression;
}

export interface CompiledNodesLayer {
  id: string;
  kind: "nodes";
  defs: Record<string, CompiledExpression>;
  defOrder: string[];
  nodes: CompiledNode[];
}

export interface CompiledScene {
  spec: SceneSpec;
  bindings: SceneSpec["bindings"];
  theme: Record<string, CompiledExpression>;
  layers: Array<CompiledFieldLayer | CompiledNodesLayer>;
}

export function compileScene(spec: SceneSpec): CompiledScene {
  return {
    spec,
    bindings: spec.bindings ?? {},
    theme: Object.fromEntries(
      Object.entries({ ...DEFAULT_THEME, ...(spec.theme ?? {}) }).map(([key, value]) => [
        key,
        compileExpression(value)
      ])
    ),
    layers: spec.layers.map((layer) => compileLayer(layer))
  };
}

export function getNumericBindings(bindings: SceneSpec["bindings"] | undefined, data: RuntimeData): Record<string, number> {
  const numeric: Record<string, number> = {};
  Object.entries(bindings ?? {}).forEach(([name, type]) => {
    if (type !== "num") {
      return;
    }
    const value = data[name];
    numeric[name] = typeof value === "number" ? value : 0;
  });
  return numeric;
}

function compileLayer(layer: LayerSpec): CompiledFieldLayer | CompiledNodesLayer {
  if (layer.kind === "field") {
    return compileFieldLayer(layer);
  }
  return compileNodesLayer(layer);
}

function compileFieldLayer(layer: FieldLayerSpec): CompiledFieldLayer {
  return {
    id: layer.id,
    kind: "field",
    h: compileExpression(layer.h),
    s: compileExpression(layer.s),
    v: compileExpression(layer.v),
    a: compileExpression(layer.a)
  };
}

function compileNodesLayer(layer: NodesLayerSpec): CompiledNodesLayer {
  const defs = Object.fromEntries(
    Object.entries(layer.defs ?? {}).map(([key, value]) => [key, compileExpression(value)])
  );
  const defOrder = resolveDefOrder(layer.defs ?? {});
  return {
    id: layer.id,
    kind: "nodes",
    defs,
    defOrder,
    nodes: layer.nodes.map((node) => compileNode(node))
  };
}

function compileNode(node: NodeSpec): CompiledNode {
  const when = node.when ? compileExpression(node.when) : undefined;
  switch (node.type) {
    case "disc":
      return {
        type: "disc",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        r: compileExpression(node.r),
        fill: compileColor(node.fill)
      };
    case "arc":
      return {
        type: "arc",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        r: compileExpression(node.r),
        start: compileExpression(node.start),
        sweep: compileExpression(node.sweep),
        stroke: compileColor(node.stroke)
      };
    case "line":
      return {
        type: "line",
        when,
        x1: compileExpression(node.x1),
        y1: compileExpression(node.y1),
        x2: compileExpression(node.x2),
        y2: compileExpression(node.y2),
        stroke: compileColor(node.stroke)
      };
    case "roundrect":
      return {
        type: "roundrect",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        w: compileExpression(node.w),
        h: compileExpression(node.h),
        radius: compileExpression(node.radius),
        fill: compileColor(node.fill)
      };
    case "text":
      return {
        type: "text",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        size: compileExpression(node.size),
        value: node.value,
        align: node.align ?? "center",
        weight: node.weight ?? "400",
        fill: compileColor(node.fill)
      };
    case "icon":
      return {
        type: "icon",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        size: compileExpression(node.size),
        glyph: node.glyph,
        fill: compileColor(node.fill)
      };
    case "repeat":
      return compileRepeatNode(node, when);
    case "stack":
      return {
        type: "stack",
        when,
        x: compileExpression(node.x),
        y: compileExpression(node.y),
        dir: node.dir,
        gap: compileExpression(node.gap),
        align: node.align ?? "center",
        children: node.children.map((child) => compileNode(child))
      };
    case "group":
      return compileGroupNode(node, when);
  }
}

function compileRepeatNode(node: RepeatNodeSpec, when?: CompiledExpression): CompiledRepeatNode {
  return {
    type: "repeat",
    when,
    idx: node.idx,
    count: node.count,
    children: node.children.map((child) => compileNode(child))
  };
}

function compileGroupNode(node: GroupNodeSpec, when?: CompiledExpression): CompiledGroupNode {
  return {
    type: "group",
    when,
    x: compileExpression(node.x),
    y: compileExpression(node.y),
    rotate: node.rotate ? compileExpression(node.rotate) : undefined,
    opacity: node.opacity ? compileExpression(node.opacity) : undefined,
    children: node.children.map((child) => compileNode(child))
  };
}

function compileColor(color: HSVColorSpec | StrokeColorSpec): CompiledColor {
  const width = (color as StrokeColorSpec).w;
  return {
    h: compileExpression(color.h),
    s: compileExpression(color.s),
    v: compileExpression(color.v),
    a: compileExpression(color.a),
    ...(typeof width === "string" ? { w: compileExpression(width) } : {})
  };
}

function resolveDefOrder(defs: Record<string, string>): string[] {
  const names = new Set(Object.keys(defs));
  const order: string[] = [];
  const visited = new Set<string>();

  const visit = (name: string) => {
    if (visited.has(name)) {
      return;
    }
    visited.add(name);
    const refs = compileExpression(defs[name]).refs.filter((ref) => names.has(ref));
    refs.forEach(visit);
    order.push(name);
  };

  Object.keys(defs).forEach(visit);
  return order;
}
