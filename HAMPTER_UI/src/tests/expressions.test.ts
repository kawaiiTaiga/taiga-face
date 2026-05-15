import { describe, expect, it } from "vitest";
import { compileExpression } from "../runtime/expressions";

describe("expressions", () => {
  it("evaluates arithmetic and function calls", () => {
    const expression = compileExpression("clamp(sin(t) + px(1, 0), 0, 2)");
    const result = expression.evaluate({
      vars: { t: 0 }
    });

    expect(result).toBe(1);
  });

  it("supports ternary branching", () => {
    const expression = compileExpression("temp > 20 ? 1 : 0");
    expect(expression.evaluate({ vars: { temp: 18 } })).toBe(0);
    expect(expression.evaluate({ vars: { temp: 22 } })).toBe(1);
  });
});
