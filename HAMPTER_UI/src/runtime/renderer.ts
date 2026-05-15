import { clamp01, hsvToRgb, rgbaToString } from "./color";
import type { CompiledColor, CompiledNode, CompiledScene } from "./compiler";
import type { CompiledFieldLayer, CompiledNodesLayer } from "./compiler";
import { renderTextTemplate } from "./text";
import { FIELD_CELL_SIZE, type ClockValues, type RuntimeData } from "./types";

export interface RenderFrameInput {
  scene: CompiledScene;
  data: RuntimeData;
  numericBindings: Record<string, number>;
  clock: ClockValues;
  time: number;
  cellSize?: number;
}

interface RenderVars extends Record<string, number> {}

interface DrawState {
  alpha: number;
}

export class CanvasRenderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(input: RenderFrameInput): void {
    const { ctx } = this;
    const canvas = ctx.canvas;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const cellSize = input.cellSize ?? FIELD_CELL_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    clipCircle(ctx, centerX, centerY, radius);

    const rootVars = {
      t: input.time,
      hour12: input.clock.hour12,
      hour24: input.clock.hour24,
      minute: input.clock.minute,
      second: input.clock.second,
      ...input.numericBindings
    };

    const themeVars: RenderVars = {
      ...rootVars
    };
    Object.entries(input.scene.theme).forEach(([key, expression]) => {
      themeVars[key] = expression.evaluate({ vars: themeVars });
    });

    input.scene.layers.forEach((layer) => {
      if (layer.kind === "field") {
        this.renderFieldLayer(layer, themeVars, centerX, centerY, radius, cellSize);
        return;
      }
      this.renderNodeLayer(layer, themeVars, input.data, centerX, centerY, radius);
    });

    ctx.restore();
  }

  private renderFieldLayer(
    layer: CompiledFieldLayer,
    vars: RenderVars,
    centerX: number,
    centerY: number,
    radius: number,
    cellSize: number
  ): void {
    const { ctx } = this;
    const diameter = radius * 2;
    for (let py = -radius; py < radius; py += cellSize) {
      for (let px = -radius; px < radius; px += cellSize) {
        const nx = px / radius;
        const ny = py / radius;
        const r = Math.sqrt(nx * nx + ny * ny);
        if (r > 1) {
          continue;
        }
        const angle = Math.atan2(ny, nx);
        const localVars = {
          ...vars,
          x: nx,
          y: ny,
          r,
          a: angle
        };
        ctx.fillStyle = evaluateColor(layer, localVars, 1);
        ctx.fillRect(centerX + px, centerY + py, Math.min(cellSize, diameter), Math.min(cellSize, diameter));
      }
    }
  }

  private renderNodeLayer(
    layer: CompiledNodesLayer,
    vars: RenderVars,
    data: RuntimeData,
    centerX: number,
    centerY: number,
    radius: number
  ): void {
    const layerVars = { ...vars };
    layer.defOrder.forEach((name) => {
      layerVars[name] = layer.defs[name].evaluate({ vars: layerVars });
    });

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    layer.nodes.forEach((node) => {
      this.renderNode(node, layerVars, data, radius, { alpha: 1 });
    });
    this.ctx.restore();
  }

  private renderNode(
    node: CompiledNode,
    vars: RenderVars,
    data: RuntimeData,
    radius: number,
    state: DrawState
  ): void {
    if (node.when && node.when.evaluate({ vars }) <= 0) {
      return;
    }

    switch (node.type) {
      case "disc":
        this.ctx.fillStyle = evaluateColor(node.fill, vars, state.alpha);
        this.ctx.beginPath();
        this.ctx.arc(node.x.evaluate({ vars }) * radius, node.y.evaluate({ vars }) * radius, Math.abs(node.r.evaluate({ vars }) * radius), 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case "arc":
        this.ctx.strokeStyle = evaluateColor(node.stroke, vars, state.alpha);
        this.ctx.lineWidth = Math.abs((node.stroke.w?.evaluate({ vars }) ?? 0.01) * radius);
        this.ctx.beginPath();
        this.ctx.arc(
          node.x.evaluate({ vars }) * radius,
          node.y.evaluate({ vars }) * radius,
          Math.abs(node.r.evaluate({ vars }) * radius),
          node.start.evaluate({ vars }),
          node.start.evaluate({ vars }) + node.sweep.evaluate({ vars })
        );
        this.ctx.stroke();
        break;
      case "line":
        this.ctx.strokeStyle = evaluateColor(node.stroke, vars, state.alpha);
        this.ctx.lineWidth = Math.abs((node.stroke.w?.evaluate({ vars }) ?? 0.01) * radius);
        this.ctx.beginPath();
        this.ctx.moveTo(node.x1.evaluate({ vars }) * radius, node.y1.evaluate({ vars }) * radius);
        this.ctx.lineTo(node.x2.evaluate({ vars }) * radius, node.y2.evaluate({ vars }) * radius);
        this.ctx.stroke();
        break;
      case "roundrect": {
        const x = node.x.evaluate({ vars }) * radius;
        const y = node.y.evaluate({ vars }) * radius;
        const w = node.w.evaluate({ vars }) * radius;
        const h = node.h.evaluate({ vars }) * radius;
        const rr = Math.abs(node.radius.evaluate({ vars }) * radius);
        this.ctx.fillStyle = evaluateColor(node.fill, vars, state.alpha);
        this.ctx.beginPath();
        roundRectPath(this.ctx, x - w / 2, y - h / 2, w, h, rr);
        this.ctx.fill();
        break;
      }
      case "text": {
        const fontSize = Math.max(10, Math.abs(node.size.evaluate({ vars }) * radius));
        const x = node.x.evaluate({ vars }) * radius;
        const y = node.y.evaluate({ vars }) * radius;
        this.ctx.fillStyle = evaluateColor(node.fill, vars, state.alpha);
        this.ctx.font = `${node.weight} ${fontSize}px "Avenir Next", "Space Grotesk", sans-serif`;
        this.ctx.textAlign = node.align ?? "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(renderTextTemplate(node.value, data), x, y);
        break;
      }
      case "icon": {
        const size = Math.max(12, Math.abs(node.size.evaluate({ vars }) * radius));
        const x = node.x.evaluate({ vars }) * radius;
        const y = node.y.evaluate({ vars }) * radius;
        const glyph = data[node.glyph];
        this.ctx.fillStyle = evaluateColor(node.fill, vars, state.alpha);
        this.ctx.strokeStyle = evaluateColor(node.fill, vars, state.alpha);
        drawIcon(this.ctx, typeof glyph === "string" ? glyph : "?", x, y, size);
        break;
      }
      case "repeat":
        for (let index = 0; index < node.count; index += 1) {
          const repeatVars = {
            ...vars,
            [node.idx]: index
          };
          node.children.forEach((child) => {
            this.renderNode(child, repeatVars, data, radius, state);
          });
        }
        break;
      case "stack": {
        const gap = node.gap.evaluate({ vars });
        const baseOffset = calculateStackBase(node.align ?? "center", node.children.length, gap);
        this.ctx.save();
        this.ctx.translate(node.x.evaluate({ vars }) * radius, node.y.evaluate({ vars }) * radius);
        node.children.forEach((child, index) => {
          this.ctx.save();
          const offset = baseOffset + index * gap;
          if (node.dir === "x") {
            this.ctx.translate(offset * radius, 0);
          } else {
            this.ctx.translate(0, offset * radius);
          }
          this.renderNode(child, vars, data, radius, state);
          this.ctx.restore();
        });
        this.ctx.restore();
        break;
      }
      case "group": {
        const opacity = node.opacity ? clamp01(node.opacity.evaluate({ vars })) : 1;
        this.ctx.save();
        this.ctx.translate(node.x.evaluate({ vars }) * radius, node.y.evaluate({ vars }) * radius);
        if (node.rotate) {
          this.ctx.rotate(node.rotate.evaluate({ vars }));
        }
        node.children.forEach((child) => {
          this.renderNode(child, vars, data, radius, { alpha: state.alpha * opacity });
        });
        this.ctx.restore();
        break;
      }
    }
  }
}

function clipCircle(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
}

function evaluateColor(color: CompiledColor | CompiledFieldLayer, vars: RenderVars, alpha: number): string {
  const rgba = hsvToRgb(
    color.h.evaluate({ vars }),
    clamp01(color.s.evaluate({ vars })),
    clamp01(color.v.evaluate({ vars })),
    clamp01(color.a.evaluate({ vars }) * alpha)
  );
  return rgbaToString(rgba);
}

function calculateStackBase(align: "start" | "center" | "end", count: number, gap: number): number {
  if (align === "start") {
    return 0;
  }
  if (align === "end") {
    return -(count - 1) * gap;
  }
  return -((count - 1) * gap) / 2;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const clamped = Math.min(Math.abs(radius), Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.moveTo(x + clamped, y);
  ctx.lineTo(x + width - clamped, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + clamped);
  ctx.lineTo(x + width, y + height - clamped);
  ctx.quadraticCurveTo(x + width, y + height, x + width - clamped, y + height);
  ctx.lineTo(x + clamped, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - clamped);
  ctx.lineTo(x, y + clamped);
  ctx.quadraticCurveTo(x, y, x + clamped, y);
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  size: number
): void {
  const key = glyph.toLowerCase();
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (key) {
    case "sun":
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * size * 0.32, Math.sin(angle) * size * 0.32);
        ctx.lineTo(Math.cos(angle) * size * 0.46, Math.sin(angle) * size * 0.46);
        ctx.stroke();
      }
      break;
    case "cloud":
      ctx.beginPath();
      ctx.arc(-size * 0.16, 0, size * 0.18, Math.PI, 0);
      ctx.arc(size * 0.03, -size * 0.07, size * 0.22, Math.PI, 0);
      ctx.arc(size * 0.23, 0, size * 0.18, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case "rain":
      drawIcon(ctx, "cloud", 0, 0, size);
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * size * 0.16, size * 0.12);
        ctx.lineTo(i * size * 0.12, size * 0.34);
        ctx.stroke();
      }
      break;
    case "music":
      ctx.beginPath();
      ctx.moveTo(size * 0.08, -size * 0.36);
      ctx.lineTo(size * 0.08, size * 0.12);
      ctx.lineTo(size * 0.34, size * 0.02);
      ctx.lineTo(size * 0.34, -size * 0.26);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, size * 0.22, size * 0.12, 0, Math.PI * 2);
      ctx.arc(size * 0.26, size * 0.12, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bell":
      ctx.beginPath();
      ctx.moveTo(-size * 0.24, size * 0.14);
      ctx.quadraticCurveTo(0, -size * 0.34, size * 0.24, size * 0.14);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, size * 0.24, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "up":
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.34);
      ctx.lineTo(size * 0.28, size * 0.18);
      ctx.lineTo(-size * 0.28, size * 0.18);
      ctx.closePath();
      ctx.fill();
      break;
    case "down":
      ctx.beginPath();
      ctx.moveTo(0, size * 0.34);
      ctx.lineTo(size * 0.28, -size * 0.18);
      ctx.lineTo(-size * 0.28, -size * 0.18);
      ctx.closePath();
      ctx.fill();
      break;
    case "play":
      ctx.beginPath();
      ctx.moveTo(-size * 0.18, -size * 0.28);
      ctx.lineTo(size * 0.28, 0);
      ctx.lineTo(-size * 0.18, size * 0.28);
      ctx.closePath();
      ctx.fill();
      break;
    case "pause":
      ctx.fillRect(-size * 0.18, -size * 0.28, size * 0.12, size * 0.56);
      ctx.fillRect(size * 0.06, -size * 0.28, size * 0.12, size * 0.56);
      break;
    case "warning":
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.34);
      ctx.lineTo(size * 0.3, size * 0.24);
      ctx.lineTo(-size * 0.3, size * 0.24);
      ctx.closePath();
      ctx.stroke();
      ctx.fillRect(-size * 0.04, -size * 0.12, size * 0.08, size * 0.22);
      ctx.fillRect(-size * 0.04, size * 0.16, size * 0.08, size * 0.08);
      break;
    default:
      ctx.font = `${Math.max(12, size * 0.7)}px "Avenir Next", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph.slice(0, 1).toUpperCase(), 0, 0);
      break;
  }

  ctx.restore();
}
