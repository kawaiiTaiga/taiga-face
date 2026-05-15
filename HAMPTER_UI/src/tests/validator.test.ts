import { describe, expect, it } from "vitest";
import { validateSceneSpec } from "../runtime/validator";
import type { SceneSpec } from "../runtime/types";

describe("validator", () => {
  it("accepts a minimal valid scene", () => {
    const spec: SceneSpec = {
      version: 1,
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "0.5",
          s: "0.2",
          v: "0.1",
          a: "1"
        }
      ]
    };

    const result = validateSceneSpec(spec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects icon bindings inside numeric expressions", () => {
    const spec: SceneSpec = {
      version: 1,
      bindings: {
        condition_icon: "icon"
      },
      layers: [
        {
          id: "nodes",
          kind: "nodes",
          nodes: [
            {
              type: "disc",
              x: "condition_icon",
              y: "0",
              r: "0.1",
              fill: {
                h: "0",
                s: "0",
                v: "1",
                a: "1"
              }
            }
          ]
        }
      ]
    };

    const result = validateSceneSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toContain("Icon binding");
  });
});
