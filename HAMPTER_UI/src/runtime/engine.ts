import { compileScene, getNumericBindings, type CompiledScene } from "./compiler";
import { CanvasRenderer } from "./renderer";
import { validateSceneSpec } from "./validator";
import type {
  BindingType,
  ClockOverride,
  ClockValues,
  NodeSpec,
  RuntimeData,
  RuntimeStatus,
  SceneSpec,
  ValidationError,
  ValidationResult
} from "./types";

export class HampterUIRuntime {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderer: CanvasRenderer;
  private compiledScene: CompiledScene | null = null;
  private data: RuntimeData = {};
  private errors: ValidationError[] = [];
  private frameHandle: number | null = null;
  private startedAt = 0;
  private specId: string | null = null;
  private fps = 0;
  private frameCounter = 0;
  private fpsWindowStart = 0;
  private clockOverride: ClockOverride | null = null;
  private statusListener?: (status: RuntimeStatus) => void;
  private cellSize = 4;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }
    this.ctx = context;
    this.renderer = new CanvasRenderer(context);
  }

  load(spec: SceneSpec): ValidationResult {
    const validation = validateSceneSpec(spec);
    this.errors = validation.errors;

    if (!validation.valid) {
      this.compiledScene = null;
      this.emitStatus();
      return validation;
    }

    this.compiledScene = compileScene(spec);
    this.specId = `spec-${Date.now()}`;
    this.renderFrame();
    this.emitStatus();
    return validation;
  }

  setData(data: RuntimeData): void {
    this.data = {
      ...this.data,
      ...data
    };
    if (!this.frameHandle) {
      this.renderFrame();
    }
    this.emitStatus();
  }

  setClockOverride(override: ClockOverride | null): void {
    this.clockOverride = override;
    this.renderFrame();
  }

  start(): void {
    if (this.frameHandle) {
      return;
    }
    this.startedAt = performance.now();
    this.fpsWindowStart = this.startedAt;
    const tick = () => {
      this.renderFrame();
      this.frameHandle = window.requestAnimationFrame(tick);
    };
    this.frameHandle = window.requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  renderFrame(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.compiledScene) {
      return;
    }

    const now = performance.now();
    const time = this.startedAt ? (now - this.startedAt) / 1000 : 0;
    const clock = getClockValues(new Date(), this.clockOverride);
    const numericBindings = getNumericBindings(this.compiledScene.bindings, this.data);

    this.renderer.render({
      scene: this.compiledScene,
      data: this.data,
      numericBindings,
      clock,
      time,
      cellSize: this.cellSize
    });

    this.trackFps(now);
    this.emitStatus();
  }

  clear(): void {
    this.compiledScene = null;
    this.errors = [];
    this.specId = null;
    this.data = {};
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.emitStatus();
  }

  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  getBindings(): Record<string, BindingType> {
    return { ...(this.compiledScene?.bindings ?? {}) };
  }

  getStatus(): RuntimeStatus {
    return {
      fps: this.fps,
      nodeCount: this.countNodes(),
      specId: this.specId,
      bindings: this.getBindings(),
      errors: this.getErrors()
    };
  }

  onStatus(listener: (status: RuntimeStatus) => void): void {
    this.statusListener = listener;
  }

  setCellSize(cellSize: number): void {
    this.cellSize = Math.max(1, Math.floor(cellSize));
  }

  private trackFps(now: number): void {
    this.frameCounter += 1;
    const elapsed = now - this.fpsWindowStart;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCounter / elapsed) * 1000);
      this.frameCounter = 0;
      this.fpsWindowStart = now;
    }
  }

  private emitStatus(): void {
    this.statusListener?.(this.getStatus());
  }

  private countNodes(): number {
    if (!this.compiledScene) {
      return 0;
    }
    return this.compiledScene.spec.layers.reduce((total, layer) => {
      if (layer.kind !== "nodes") {
        return total;
      }
      return total + countSourceNodes(layer.nodes);
    }, 0);
  }
}

function countSourceNodes(nodes: NodeSpec[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "repeat") {
      return total + node.count * countSourceNodes(node.children);
    }
    if (node.type === "group" || node.type === "stack") {
      return total + 1 + countSourceNodes(node.children);
    }
    return total + 1;
  }, 0);
}

function getClockValues(date: Date, override: ClockOverride | null): ClockValues {
  const milliseconds = date.getMilliseconds() / 1000;
  const second = override?.second ?? date.getSeconds() + milliseconds;
  const minute = override?.minute ?? date.getMinutes();
  const hour24 = override?.hour24 ?? date.getHours();
  const hour12Raw = hour24 % 12;
  return {
    hour12: hour12Raw === 0 ? 12 : hour12Raw,
    hour24,
    minute,
    second
  };
}
