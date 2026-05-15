import { isColorObject } from "./color";
import {
  BUILTIN_FUNCTIONS,
  collectIdentifiers,
  compileExpression,
  CONSTANTS,
  expressionDepth
} from "./expressions";
import { extractTemplateBindings, validateTextTemplate } from "./text";
import {
  DEFAULT_THEME,
  MAX_EXPRESSION_DEPTH,
  MAX_LAYER_COUNT,
  MAX_NESTING_DEPTH,
  MAX_REPEAT_COUNT,
  MAX_TOTAL_NODE_COUNT,
  type BindingType,
  type LayerSpec,
  type NodeSpec,
  type SceneSpec,
  type ValidationError,
  type ValidationResult,
  type ValidationStats
} from "./types";

const TIME_VARS = new Set(["t", "hour12", "hour24", "minute", "second"]);
const THEME_VARS = new Set(Object.keys(DEFAULT_THEME));
const FIELD_VARS = new Set(["x", "y", "r", "a"]);
const ROOT_LAYER_KEYS = new Set(["id", "kind"]);

const NODE_ATTRS: Record<string, Set<string>> = {
  disc: new Set(["type", "when", "x", "y", "r", "fill"]),
  arc: new Set(["type", "when", "x", "y", "r", "start", "sweep", "stroke"]),
  line: new Set(["type", "when", "x1", "y1", "x2", "y2", "stroke"]),
  roundrect: new Set(["type", "when", "x", "y", "w", "h", "radius", "fill"]),
  text: new Set(["type", "when", "x", "y", "value", "size", "align", "weight", "fill"]),
  icon: new Set(["type", "when", "x", "y", "glyph", "size", "fill"]),
  repeat: new Set(["type", "when", "idx", "count", "children"]),
  stack: new Set(["type", "when", "x", "y", "dir", "gap", "align", "children"]),
  group: new Set(["type", "when", "x", "y", "rotate", "opacity", "children"])
};

interface ValidationScope {
  bindings: Record<string, BindingType>;
  defs: Set<string>;
  localVars: Set<string>;
  allowFieldVars: boolean;
}

export function validateSceneSpec(spec: SceneSpec): ValidationResult {
  const errors: ValidationError[] = [];
  const stats: ValidationStats = {
    layerCount: Array.isArray(spec.layers) ? spec.layers.length : 0,
    nodeCount: 0,
    expressionCount: 0,
    hasFieldLayer: false
  };

  if (!spec || typeof spec !== "object") {
    errors.push(createError("", "Spec must be an object."));
    return result(errors, stats);
  }

  if (spec.version !== 1) {
    errors.push(createError("version", "Only version 1 is supported."));
  }

  if (!Array.isArray(spec.layers)) {
    errors.push(createError("layers", "layers must be an array."));
    return result(errors, stats);
  }

  if (spec.layers.length > MAX_LAYER_COUNT) {
    errors.push(createError("layers", `At most ${MAX_LAYER_COUNT} layers are allowed.`));
  }

  const bindings = spec.bindings ?? {};
  for (const [bindingName, bindingType] of Object.entries(bindings)) {
    if (bindingType !== "num" && bindingType !== "icon") {
      errors.push(createError(`bindings.${bindingName}`, `Unknown binding type "${bindingType}".`));
    }
  }

  for (const [themeKey, expression] of Object.entries({ ...DEFAULT_THEME, ...(spec.theme ?? {}) })) {
    validateExpression(expression, `theme.${themeKey}`, {
      bindings,
      defs: new Set(),
      localVars: new Set(),
      allowFieldVars: false
    }, errors, stats);
  }

  spec.layers.forEach((layer, layerIndex) => {
    validateLayer(layer, `layers[${layerIndex}]`, bindings, errors, stats);
  });

  if (stats.nodeCount > MAX_TOTAL_NODE_COUNT) {
    errors.push(
      createError("layers", `Expanded node count exceeds the maximum of ${MAX_TOTAL_NODE_COUNT}.`)
    );
  }

  return result(errors, stats);
}

function validateLayer(
  layer: LayerSpec,
  path: string,
  bindings: Record<string, BindingType>,
  errors: ValidationError[],
  stats: ValidationStats
): void {
  if (!layer || typeof layer !== "object") {
    errors.push(createError(path, "Layer must be an object."));
    return;
  }

  if (typeof layer.id !== "string" || layer.id.length === 0) {
    errors.push(createError(`${path}.id`, "Layer id must be a non-empty string."));
  }

  if (layer.kind === "field") {
    stats.hasFieldLayer = true;
    for (const key of ["h", "s", "v", "a"] as const) {
      validateExpression(layer[key], `${path}.${key}`, {
        bindings,
        defs: new Set(),
        localVars: new Set(),
        allowFieldVars: true
      }, errors, stats);
    }
    validateUnknownKeys(layer as unknown as Record<string, unknown>, new Set([...ROOT_LAYER_KEYS, "h", "s", "v", "a"]), path, errors);
    return;
  }

  if (layer.kind !== "nodes") {
    errors.push(createError(`${path}.kind`, `Unknown layer kind "${(layer as { kind?: string }).kind}".`));
    return;
  }

  validateUnknownKeys(layer as unknown as Record<string, unknown>, new Set([...ROOT_LAYER_KEYS, "defs", "nodes"]), path, errors);

  const defs = layer.defs ?? {};
  if (layer.defs && typeof layer.defs !== "object") {
    errors.push(createError(`${path}.defs`, "defs must be an object."));
  }

  const defNames = new Set(Object.keys(defs));
  const defGraph = new Map<string, string[]>();
  for (const [name, expression] of Object.entries(defs)) {
    validateExpression(expression, `${path}.defs.${name}`, {
      bindings,
      defs: defNames,
      localVars: new Set(),
      allowFieldVars: false
    }, errors, stats);

    const refs = compileExpression(expression).refs.filter((ref) => defNames.has(ref));
    defGraph.set(name, refs);
  }
  validateDefCycles(defGraph, `${path}.defs`, errors);

  if (!Array.isArray(layer.nodes)) {
    errors.push(createError(`${path}.nodes`, "nodes must be an array."));
    return;
  }

  const scope: ValidationScope = {
    bindings,
    defs: defNames,
    localVars: new Set(),
    allowFieldVars: false
  };

  layer.nodes.forEach((node, index) => {
    validateNode(node, `${path}.nodes[${index}]`, scope, errors, stats, 1, 1);
  });
}

function validateNode(
  node: NodeSpec,
  path: string,
  scope: ValidationScope,
  errors: ValidationError[],
  stats: ValidationStats,
  depth: number,
  multiplier: number
): void {
  if (!node || typeof node !== "object") {
    errors.push(createError(path, "Node must be an object."));
    return;
  }

  if (depth > MAX_NESTING_DEPTH) {
    errors.push(createError(path, `Node nesting depth exceeds ${MAX_NESTING_DEPTH}.`));
  }

  const allowedKeys = NODE_ATTRS[node.type];
  if (!allowedKeys) {
    errors.push(createError(`${path}.type`, `Unknown node type "${(node as { type?: string }).type}".`));
    return;
  }

  stats.nodeCount += multiplier;
  validateUnknownKeys(node as unknown as Record<string, unknown>, allowedKeys, path, errors);

  if (node.when) {
    validateExpression(node.when, `${path}.when`, scope, errors, stats);
  }

  switch (node.type) {
    case "disc":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.r, `${path}.r`, scope, errors, stats);
      validateColor(node.fill, `${path}.fill`, scope, errors, stats, false);
      break;
    case "arc":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.r, `${path}.r`, scope, errors, stats);
      validateExpression(node.start, `${path}.start`, scope, errors, stats);
      validateExpression(node.sweep, `${path}.sweep`, scope, errors, stats);
      validateColor(node.stroke, `${path}.stroke`, scope, errors, stats, true);
      break;
    case "line":
      validateExpression(node.x1, `${path}.x1`, scope, errors, stats);
      validateExpression(node.y1, `${path}.y1`, scope, errors, stats);
      validateExpression(node.x2, `${path}.x2`, scope, errors, stats);
      validateExpression(node.y2, `${path}.y2`, scope, errors, stats);
      validateColor(node.stroke, `${path}.stroke`, scope, errors, stats, true);
      break;
    case "roundrect":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.w, `${path}.w`, scope, errors, stats);
      validateExpression(node.h, `${path}.h`, scope, errors, stats);
      validateExpression(node.radius, `${path}.radius`, scope, errors, stats);
      validateColor(node.fill, `${path}.fill`, scope, errors, stats, false);
      break;
    case "text":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.size, `${path}.size`, scope, errors, stats);
      validateColor(node.fill, `${path}.fill`, scope, errors, stats, false);
      if (!validateTextTemplate(node.value)) {
        errors.push(createError(`${path}.value`, "Text value contains an invalid template pattern."));
      }
      extractTemplateBindings(node.value).forEach((binding) => {
        if (!(binding in scope.bindings) && !TIME_VARS.has(binding)) {
          errors.push(createError(`${path}.value`, `Unknown text binding "${binding}".`));
        }
      });
      break;
    case "icon":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.size, `${path}.size`, scope, errors, stats);
      validateColor(node.fill, `${path}.fill`, scope, errors, stats, false);
      if (scope.bindings[node.glyph] !== "icon") {
        errors.push(createError(`${path}.glyph`, `Icon glyph "${node.glyph}" must reference an icon binding.`));
      }
      break;
    case "repeat": {
      if (!Number.isInteger(node.count)) {
        errors.push(createError(`${path}.count`, "repeat.count must be a literal integer."));
      }
      if (node.count > MAX_REPEAT_COUNT) {
        errors.push(createError(`${path}.count`, `repeat.count cannot exceed ${MAX_REPEAT_COUNT}.`));
      }
      if (node.count < 0) {
        errors.push(createError(`${path}.count`, "repeat.count cannot be negative."));
      }
      const childScope: ValidationScope = {
        ...scope,
        localVars: new Set([...scope.localVars, node.idx])
      };
      node.children.forEach((child, index) => {
        validateNode(
          child,
          `${path}.children[${index}]`,
          childScope,
          errors,
          stats,
          depth + 1,
          multiplier * Math.max(0, node.count)
        );
      });
      break;
    }
    case "stack":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      validateExpression(node.gap, `${path}.gap`, scope, errors, stats);
      node.children.forEach((child, index) => {
        validateNode(child, `${path}.children[${index}]`, scope, errors, stats, depth + 1, multiplier);
      });
      break;
    case "group":
      validateExpression(node.x, `${path}.x`, scope, errors, stats);
      validateExpression(node.y, `${path}.y`, scope, errors, stats);
      if (node.rotate) {
        validateExpression(node.rotate, `${path}.rotate`, scope, errors, stats);
      }
      if (node.opacity) {
        validateExpression(node.opacity, `${path}.opacity`, scope, errors, stats);
      }
      node.children.forEach((child, index) => {
        validateNode(child, `${path}.children[${index}]`, scope, errors, stats, depth + 1, multiplier);
      });
      break;
  }
}

function validateExpression(
  expression: string,
  path: string,
  scope: ValidationScope,
  errors: ValidationError[],
  stats: ValidationStats
): void {
  if (typeof expression !== "string") {
    errors.push(createError(path, "Expression must be a string."));
    return;
  }

  try {
    const compiled = compileExpression(expression);
    stats.expressionCount += 1;
    if (expressionDepth(compiled.ast) > MAX_EXPRESSION_DEPTH) {
      errors.push(createError(path, `Expression depth cannot exceed ${MAX_EXPRESSION_DEPTH}.`));
    }

    compiled.refs.forEach((ref) => {
      if (ref in CONSTANTS || TIME_VARS.has(ref) || THEME_VARS.has(ref) || scope.defs.has(ref) || scope.localVars.has(ref)) {
        return;
      }
      if (scope.allowFieldVars && FIELD_VARS.has(ref)) {
        return;
      }
      if (scope.bindings[ref] === "num") {
        return;
      }
      if (scope.bindings[ref] === "icon") {
        errors.push(createError(path, `Icon binding "${ref}" cannot be used in numeric expressions.`));
        return;
      }
      errors.push(createError(path, `Unknown identifier "${ref}".`));
    });

    validateBuiltinCalls(compiled.ast, path, errors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown expression error.";
    errors.push(createError(path, message));
  }
}

function validateBuiltinCalls(node: ReturnType<typeof compileExpression>["ast"], path: string, errors: ValidationError[]): void {
  if (node.type === "call" && !(node.callee in BUILTIN_FUNCTIONS)) {
    errors.push(createError(path, `Unknown function "${node.callee}".`));
  }

  switch (node.type) {
    case "unary":
      validateBuiltinCalls(node.argument, path, errors);
      break;
    case "binary":
      validateBuiltinCalls(node.left, path, errors);
      validateBuiltinCalls(node.right, path, errors);
      break;
    case "ternary":
      validateBuiltinCalls(node.condition, path, errors);
      validateBuiltinCalls(node.consequent, path, errors);
      validateBuiltinCalls(node.alternate, path, errors);
      break;
    case "call":
      node.args.forEach((arg) => validateBuiltinCalls(arg, path, errors));
      break;
    default:
      break;
  }
}

function validateColor(
  color: unknown,
  path: string,
  scope: ValidationScope,
  errors: ValidationError[],
  stats: ValidationStats,
  requireWidth: boolean
): void {
  if (!isColorObject(color)) {
    errors.push(createError(path, "Color objects must include h, s, v, a."));
    return;
  }

  validateExpression(color.h, `${path}.h`, scope, errors, stats);
  validateExpression(color.s, `${path}.s`, scope, errors, stats);
  validateExpression(color.v, `${path}.v`, scope, errors, stats);
  validateExpression(color.a, `${path}.a`, scope, errors, stats);

  if (requireWidth) {
    const width = (color as { w?: unknown }).w;
    if (typeof width !== "string") {
      errors.push(createError(`${path}.w`, "Stroke color must include width expression w."));
      return;
    }
    validateExpression(width, `${path}.w`, scope, errors, stats);
  }
}

function validateUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
  errors: ValidationError[]
): void {
  Object.keys(value).forEach((key) => {
    if (!allowed.has(key)) {
      errors.push(createError(`${path}.${key}`, `Unknown attribute "${key}".`));
    }
  });
}

function validateDefCycles(graph: Map<string, string[]>, path: string, errors: ValidationError[]): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (node: string) => {
    if (visited.has(node)) {
      return;
    }
    if (visiting.has(node)) {
      errors.push(createError(path, `Circular def reference detected at "${node}".`));
      return;
    }

    visiting.add(node);
    for (const dependency of graph.get(node) ?? []) {
      visit(dependency);
    }
    visiting.delete(node);
    visited.add(node);
  };

  graph.forEach((_, node) => visit(node));
}

function createError(path: string, message: string): ValidationError {
  return {
    path,
    message,
    severity: "error"
  };
}

function result(errors: ValidationError[], stats: ValidationStats): ValidationResult {
  return {
    valid: errors.every((error) => error.severity !== "error"),
    errors,
    stats
  };
}
