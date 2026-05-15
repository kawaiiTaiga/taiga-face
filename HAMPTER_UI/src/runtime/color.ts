import type { HSVColorSpec, StrokeColorSpec } from "./types";

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hsvToRgb(h: number, s: number, v: number, a = 1): RgbaColor {
  const hue = ((h % 1) + 1) % 1;
  const sector = hue * 6;
  const i = Math.floor(sector);
  const f = sector - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  const map = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q]
  ][i % 6];

  return {
    r: Math.round(map[0] * 255),
    g: Math.round(map[1] * 255),
    b: Math.round(map[2] * 255),
    a: clamp01(a)
  };
}

export function rgbaToString(color: RgbaColor): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function isColorObject(value: unknown): value is HSVColorSpec | StrokeColorSpec {
  return Boolean(
    value &&
      typeof value === "object" &&
      "h" in value &&
      "s" in value &&
      "v" in value &&
      "a" in value
  );
}
