export type ExpressionNode =
  | { type: "literal"; value: number }
  | { type: "identifier"; name: string }
  | { type: "unary"; operator: string; argument: ExpressionNode }
  | { type: "binary"; operator: string; left: ExpressionNode; right: ExpressionNode }
  | {
      type: "ternary";
      condition: ExpressionNode;
      consequent: ExpressionNode;
      alternate: ExpressionNode;
    }
  | { type: "call"; callee: string; args: ExpressionNode[] };

interface Token {
  type: "number" | "identifier" | "operator" | "paren" | "comma" | "question" | "colon" | "eof";
  value: string;
}

export interface EvalContext {
  vars: Record<string, number>;
}

export interface CompiledExpression {
  source: string;
  ast: ExpressionNode;
  refs: string[];
  evaluate: (ctx: EvalContext) => number;
}

const operatorPattern =
  /^(<=|>=|==|!=|\|\||&&|[+\-*/%<>!?:(),])/;
const numberPattern = /^(?:\d+\.\d+|\d+|\.\d+)/;
const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*/;

const parseCache = new Map<string, ExpressionNode>();
const compileCache = new Map<string, CompiledExpression>();

export const BUILTIN_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  sqrt: Math.sqrt,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
  mod: (a, b) => {
    if (b === 0) {
      return 0;
    }
    return ((a % b) + b) % b;
  },
  pow: Math.pow,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (a, b, factor) => a + (b - a) * factor,
  smoothstep: (edge0, edge1, x) => {
    if (edge0 === edge1) {
      return x < edge0 ? 0 : 1;
    }
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
  select: (condition, a, b) => (condition > 0 ? a : b),
  px: (r, angle) => r * Math.cos(angle),
  py: (r, angle) => r * Math.sin(angle)
};

export const CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  TAU: Math.PI * 2
};

export function parseExpression(source: string): ExpressionNode {
  const cached = parseCache.get(source);
  if (cached) {
    return cached;
  }

  const tokens = tokenize(source);
  let index = 0;

  const peek = () => tokens[index];
  const consume = () => tokens[index++];
  const expect = (value: string) => {
    const token = consume();
    if (token.value !== value) {
      throw new Error(`Expected "${value}" but found "${token.value}"`);
    }
  };

  const parsePrimary = (): ExpressionNode => {
    const token = consume();
    if (token.type === "number") {
      return { type: "literal", value: Number(token.value) };
    }

    if (token.type === "identifier") {
      if (peek().value === "(") {
        consume();
        const args: ExpressionNode[] = [];
        if (peek().value !== ")") {
          while (true) {
            args.push(parseTernary());
            if (peek().value !== ",") {
              break;
            }
            consume();
          }
        }
        expect(")");
        return { type: "call", callee: token.value, args };
      }
      return { type: "identifier", name: token.value };
    }

    if (token.value === "(") {
      const expr = parseTernary();
      expect(")");
      return expr;
    }

    throw new Error(`Unexpected token "${token.value}"`);
  };

  const parseUnary = (): ExpressionNode => {
    const token = peek();
    if (token.value === "-" || token.value === "!" || token.value === "+") {
      consume();
      return {
        type: "unary",
        operator: token.value,
        argument: parseUnary()
      };
    }
    return parsePrimary();
  };

  const createBinaryParser = (next: () => ExpressionNode, operators: string[]) => {
    return (): ExpressionNode => {
      let node = next();
      while (operators.includes(peek().value)) {
        const operator = consume().value;
        node = {
          type: "binary",
          operator,
          left: node,
          right: next()
        };
      }
      return node;
    };
  };

  const parseFactor = createBinaryParser(parseUnary, ["*", "/", "%"]);
  const parseTerm = createBinaryParser(parseFactor, ["+", "-"]);
  const parseComparison = createBinaryParser(parseTerm, ["<", ">", "<=", ">="]);
  const parseEquality = createBinaryParser(parseComparison, ["==", "!="]);
  const parseAnd = createBinaryParser(parseEquality, ["&&"]);
  const parseOr = createBinaryParser(parseAnd, ["||"]);
  const parseTernary = (): ExpressionNode => {
    const condition = parseOr();
    if (peek().value !== "?") {
      return condition;
    }
    consume();
    const consequent = parseTernary();
    expect(":");
    const alternate = parseTernary();
    return {
      type: "ternary",
      condition,
      consequent,
      alternate
    };
  };

  const ast = parseTernary();
  if (peek().type !== "eof") {
    throw new Error(`Unexpected trailing token "${peek().value}"`);
  }

  parseCache.set(source, ast);
  return ast;
}

export function compileExpression(source: string): CompiledExpression {
  const cached = compileCache.get(source);
  if (cached) {
    return cached;
  }

  const ast = parseExpression(source);
  const refs = [...collectIdentifiers(ast)];
  const compiled: CompiledExpression = {
    source,
    ast,
    refs,
    evaluate: (ctx) => evaluateNode(ast, ctx.vars)
  };
  compileCache.set(source, compiled);
  return compiled;
}

export function expressionDepth(node: ExpressionNode): number {
  switch (node.type) {
    case "literal":
    case "identifier":
      return 1;
    case "unary":
      return 1 + expressionDepth(node.argument);
    case "binary":
      return 1 + Math.max(expressionDepth(node.left), expressionDepth(node.right));
    case "ternary":
      return (
        1 +
        Math.max(
          expressionDepth(node.condition),
          expressionDepth(node.consequent),
          expressionDepth(node.alternate)
        )
      );
    case "call":
      return 1 + Math.max(0, ...node.args.map(expressionDepth));
  }
}

export function collectIdentifiers(node: ExpressionNode): Set<string> {
  const refs = new Set<string>();

  const visit = (current: ExpressionNode) => {
    switch (current.type) {
      case "identifier":
        refs.add(current.name);
        break;
      case "unary":
        visit(current.argument);
        break;
      case "binary":
        visit(current.left);
        visit(current.right);
        break;
      case "ternary":
        visit(current.condition);
        visit(current.consequent);
        visit(current.alternate);
        break;
      case "call":
        current.args.forEach(visit);
        break;
      default:
        break;
    }
  };

  visit(node);
  return refs;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let rest = source.trim();

  while (rest.length > 0) {
    const whitespaceMatch = rest.match(/^\s+/);
    if (whitespaceMatch) {
      rest = rest.slice(whitespaceMatch[0].length);
      continue;
    }

    const numberMatch = rest.match(numberPattern);
    if (numberMatch) {
      tokens.push({ type: "number", value: numberMatch[0] });
      rest = rest.slice(numberMatch[0].length);
      continue;
    }

    const identifierMatch = rest.match(identifierPattern);
    if (identifierMatch) {
      tokens.push({ type: "identifier", value: identifierMatch[0] });
      rest = rest.slice(identifierMatch[0].length);
      continue;
    }

    const operatorMatch = rest.match(operatorPattern);
    if (operatorMatch) {
      const value = operatorMatch[0];
      tokens.push({
        type:
          value === "(" || value === ")"
            ? "paren"
            : value === ","
              ? "comma"
              : value === "?"
                ? "question"
                : value === ":"
                  ? "colon"
                  : "operator",
        value
      });
      rest = rest.slice(value.length);
      continue;
    }

    throw new Error(`Unknown token near "${rest.slice(0, 10)}"`);
  }

  tokens.push({ type: "eof", value: "<eof>" });
  return tokens;
}

function evaluateNode(node: ExpressionNode, vars: Record<string, number>): number {
  switch (node.type) {
    case "literal":
      return node.value;
    case "identifier":
      if (node.name in CONSTANTS) {
        return CONSTANTS[node.name];
      }
      return vars[node.name] ?? 0;
    case "unary": {
      const value = evaluateNode(node.argument, vars);
      if (node.operator === "-") {
        return -value;
      }
      if (node.operator === "!") {
        return value > 0 ? 0 : 1;
      }
      return value;
    }
    case "binary":
      return evaluateBinary(node.operator, evaluateNode(node.left, vars), evaluateNode(node.right, vars));
    case "ternary":
      return evaluateNode(node.condition, vars) > 0
        ? evaluateNode(node.consequent, vars)
        : evaluateNode(node.alternate, vars);
    case "call": {
      const fn = BUILTIN_FUNCTIONS[node.callee];
      if (!fn) {
        throw new Error(`Unknown function "${node.callee}"`);
      }
      return fn(...node.args.map((arg) => evaluateNode(arg, vars)));
    }
  }
}

function evaluateBinary(operator: string, left: number, right: number): number {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? 0 : left / right;
    case "%":
      return right === 0 ? 0 : left % right;
    case "<":
      return left < right ? 1 : 0;
    case ">":
      return left > right ? 1 : 0;
    case "<=":
      return left <= right ? 1 : 0;
    case ">=":
      return left >= right ? 1 : 0;
    case "==":
      return left === right ? 1 : 0;
    case "!=":
      return left !== right ? 1 : 0;
    case "&&":
      return left > 0 && right > 0 ? 1 : 0;
    case "||":
      return left > 0 || right > 0 ? 1 : 0;
    default:
      throw new Error(`Unsupported operator "${operator}"`);
  }
}
