import type { SceneSpec } from "../runtime";

export interface ExampleSpec {
  name: string;
  description: string;
  spec: SceneSpec;
}

export const EXAMPLE_SPECS: ExampleSpec[] = [
  {
    name: "Analog Clock",
    description: "Classic watch face with markers, breathing field background, and digital readout.",
    spec: {
      version: 1,
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "0.58 + 0.015*sin(t*0.2 + a*2)",
          s: "0.28",
          v: "0.08 + 0.06*(1-r) + 0.02*sin(t*0.6)",
          a: "1"
        },
        {
          id: "clock",
          kind: "nodes",
          defs: {
            ha: "TAU*((hour12 + minute/60)/12) - PI/2",
            ma: "TAU*((minute + second/60)/60) - PI/2",
            sa: "TAU*(second/60) - PI/2"
          },
          nodes: [
            {
              type: "repeat",
              idx: "k",
              count: 12,
              children: [
                {
                  type: "disc",
                  x: "px(0.82, TAU*(k/12) - PI/2)",
                  y: "py(0.82, TAU*(k/12) - PI/2)",
                  r: "select(mod(k,3)==0, 0.03, 0.017)",
                  fill: { h: "0.58", s: "0.15", v: "0.95", a: "0.9" }
                }
              ]
            },
            {
              type: "line",
              x1: "0",
              y1: "0",
              x2: "px(0.45, ha)",
              y2: "py(0.45, ha)",
              stroke: { h: "0.58", s: "0.08", v: "1", a: "1", w: "0.03" }
            },
            {
              type: "line",
              x1: "0",
              y1: "0",
              x2: "px(0.66, ma)",
              y2: "py(0.66, ma)",
              stroke: { h: "0.58", s: "0.04", v: "1", a: "1", w: "0.018" }
            },
            {
              type: "line",
              x1: "0",
              y1: "0",
              x2: "px(0.74, sa)",
              y2: "py(0.74, sa)",
              stroke: {
                h: "0.02 + 0.02*sin(t*4)",
                s: "0.9",
                v: "1",
                a: "0.95",
                w: "0.01"
              }
            },
            {
              type: "disc",
              x: "0",
              y: "0",
              r: "0.04",
              fill: { h: "0.02", s: "0.75", v: "1", a: "1" }
            },
            {
              type: "text",
              x: "0",
              y: "0.58",
              value: "{hour24:02}:{minute:02}",
              size: "0.12",
              align: "center",
              weight: "300",
              fill: { h: "0.58", s: "0.05", v: "1", a: "0.9" }
            }
          ]
        }
      ]
    }
  },
  {
    name: "Weather Dashboard",
    description: "Dual gauges for temperature and humidity with floating ambient particles.",
    spec: {
      version: 1,
      bindings: {
        temp: "num",
        humidity: "num"
      },
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "0.55 + 0.02*sin(t*0.08 + a*2)",
          s: "0.3 + 0.06*(1-r)",
          v: "0.06 + 0.025*(1-r) + 0.015*sin(t*0.35 + y*3)",
          a: "1"
        },
        {
          id: "weather",
          kind: "nodes",
          defs: {
            temp_n: "clamp((temp + 10)/55, 0, 1)",
            humidity_n: "clamp(humidity/100, 0, 1)",
            temp_h: "lerp(0.58, 0.02, temp_n)",
            dew_y: "0.016*sin(t*0.9)",
            shimmer: "0.82 + 0.18*sin(t*1.4)"
          },
          nodes: [
            {
              type: "repeat",
              idx: "k",
              count: 12,
              children: [
                {
                  type: "disc",
                  x: "px(0.54 + 0.05*sin(t*0.22 + k), TAU*(k/12) + t*0.05)",
                  y: "py(0.54 + 0.04*cos(t*0.18 + k), TAU*(k/12) - t*0.04)",
                  r: "0.006 + 0.003*abs(sin(t + k))",
                  fill: { h: "0.57", s: "0.32", v: "0.88", a: "0.24" }
                }
              ]
            },
            {
              type: "arc",
              x: "-0.36",
              y: "0.06",
              r: "0.31",
              start: "PI*0.78",
              sweep: "PI*1.44",
              stroke: {
                h: "0.58",
                s: "0.12",
                v: "0.34",
                a: "0.34",
                w: "0.045"
              }
            },
            {
              type: "arc",
              x: "-0.36",
              y: "0.06",
              r: "0.31",
              start: "PI*0.78",
              sweep: "temp_n * PI*1.44",
              stroke: {
                h: "temp_h",
                s: "0.92",
                v: "1",
                a: "1",
                w: "0.045"
              }
            },
            {
              type: "arc",
              x: "0.36",
              y: "0.06",
              r: "0.31",
              start: "PI*0.78",
              sweep: "PI*1.44",
              stroke: {
                h: "0.56",
                s: "0.12",
                v: "0.34",
                a: "0.34",
                w: "0.045"
              }
            },
            {
              type: "arc",
              x: "0.36",
              y: "0.06",
              r: "0.31",
              start: "PI*0.78",
              sweep: "humidity_n * PI*1.44",
              stroke: {
                h: "0.38",
                s: "0.75",
                v: "0.95",
                a: "1",
                w: "0.045"
              }
            },
            {
              type: "group",
              x: "0",
              y: "-0.045",
              children: [
                {
                  type: "disc",
                  x: "0",
                  y: "0",
                  r: "0.205",
                  fill: { h: "0.56", s: "0.16", v: "0.12", a: "0.92" }
                },
                {
                  type: "disc",
                  x: "0",
                  y: "0",
                  r: "0.162",
                  fill: { h: "0.55", s: "0.12", v: "0.18", a: "0.88" }
                },
                {
                  type: "arc",
                  x: "0",
                  y: "0",
                  r: "0.175",
                  start: "-PI*0.72",
                  sweep: "PI*1.44",
                  stroke: { h: "0.55", s: "0.12", v: "0.3", a: "0.34", w: "0.012" }
                },
                {
                  type: "disc",
                  x: "-0.038",
                  y: "-0.028",
                  r: "0.072",
                  fill: { h: "0.57", s: "0.42", v: "0.92", a: "0.2*shimmer" }
                },
                {
                  type: "disc",
                  x: "0.045",
                  y: "0.052",
                  r: "0.05",
                  fill: { h: "temp_h", s: "0.55", v: "0.96", a: "0.18*shimmer" }
                },
                {
                  type: "group",
                  x: "-0.028",
                  y: "-0.004 + dew_y",
                  rotate: "PI/4",
                  children: [
                    {
                      type: "roundrect",
                      x: "0",
                      y: "0",
                      w: "0.07",
                      h: "0.1",
                      radius: "0.035",
                      fill: { h: "0.56", s: "0.54", v: "0.98", a: "0.92" }
                    },
                    {
                      type: "disc",
                      x: "-0.008",
                      y: "-0.01",
                      r: "0.014",
                      fill: { h: "0.58", s: "0.18", v: "1", a: "0.28" }
                    }
                  ]
                },
                {
                  type: "group",
                  x: "0.052",
                  y: "0.018",
                  children: [
                    {
                      type: "line",
                      x1: "0",
                      y1: "-0.082",
                      x2: "0",
                      y2: "0.035",
                      stroke: { h: "0.58", s: "0.08", v: "0.82", a: "0.78", w: "0.026" }
                    },
                    {
                      type: "line",
                      x1: "0",
                      y1: "-0.056",
                      x2: "0",
                      y2: "0.035",
                      stroke: { h: "temp_h", s: "0.72", v: "1", a: "1", w: "0.013" }
                    },
                    {
                      type: "disc",
                      x: "0",
                      y: "0.05",
                      r: "0.033",
                      fill: { h: "temp_h", s: "0.82", v: "1", a: "1" }
                    },
                    {
                      type: "disc",
                      x: "0",
                      y: "-0.088",
                      r: "0.014",
                      fill: { h: "0.58", s: "0.08", v: "0.82", a: "0.72" }
                    }
                  ]
                },
                {
                  type: "text",
                  x: "0",
                  y: "0.135",
                  value: "SKY / AIR",
                  size: "0.038",
                  fill: { h: "0.57", s: "0.08", v: "0.92", a: "0.62" }
                }
              ]
            },
            {
              type: "stack",
              x: "0",
              y: "0.32",
              dir: "y",
              gap: "0.085",
              align: "center",
              children: [
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "{hour24:02}:{minute:02}",
                  size: "0.11",
                  fill: { h: "0.58", s: "0.03", v: "1", a: "0.95" }
                },
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "CURRENT WEATHER",
                  size: "0.05",
                  fill: { h: "0.58", s: "0.04", v: "0.86", a: "0.78" }
                }
              ]
            },
            {
              type: "stack",
              x: "-0.36",
              y: "0.08",
              dir: "y",
              gap: "0.08",
              align: "center",
              children: [
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "TEMP",
                  size: "0.05",
                  fill: { h: "0.58", s: "0.04", v: "0.8", a: "0.72" }
                },
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "{temp:1}C",
                  size: "0.1",
                  weight: "500",
                  fill: { h: "temp_h", s: "0.7", v: "1", a: "0.96" }
                }
              ]
            },
            {
              type: "stack",
              x: "0.36",
              y: "0.08",
              dir: "y",
              gap: "0.08",
              align: "center",
              children: [
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "HUMID",
                  size: "0.05",
                  fill: { h: "0.58", s: "0.04", v: "0.8", a: "0.72" }
                },
                {
                  type: "text",
                  x: "0",
                  y: "0",
                  value: "{humidity:0}%",
                  size: "0.1",
                  weight: "500",
                  fill: { h: "0.38", s: "0.65", v: "1", a: "0.96" }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: "Music Visualizer",
    description: "Volume-driven concentric rings and radial particles.",
    spec: {
      version: 1,
      bindings: {
        var_a: "num",
        var_b: "num",
        condition_icon: "icon"
      },
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "0.03 + 0.2*var_b",
          s: "0.45 + 0.25*(1-r)",
          v: "0.04 + 0.1*smoothstep(0, 1, var_a)*(1-r)",
          a: "1"
        },
        {
          id: "viz",
          kind: "nodes",
          defs: {
            energy: "clamp(var_a, 0, 1)",
            tone: "clamp(var_b, 0, 1)"
          },
          nodes: [
            {
              type: "repeat",
              idx: "k",
              count: 4,
              children: [
                {
                  type: "arc",
                  x: "0",
                  y: "0",
                  r: "0.22 + 0.12*k + energy*0.04*sin(t*3 + k)",
                  start: "-PI/2 + k*0.1",
                  sweep: "TAU*(0.45 + energy*0.45)",
                  stroke: {
                    h: "0.03 + tone*0.5 + k*0.04",
                    s: "0.8",
                    v: "0.95",
                    a: "0.7",
                    w: "0.015 + energy*0.02"
                  }
                }
              ]
            },
            {
              type: "repeat",
              idx: "k",
              count: 24,
              children: [
                {
                  type: "disc",
                  x: "px(0.2 + energy*0.55 + 0.08*sin(t*4 + k), TAU*(k/24) + tone*PI)",
                  y: "py(0.2 + energy*0.55 + 0.08*sin(t*4 + k), TAU*(k/24) + tone*PI)",
                  r: "0.008 + energy*0.018",
                  fill: {
                    h: "0.03 + tone*0.6",
                    s: "0.9",
                    v: "1",
                    a: "0.4 + energy*0.4"
                  }
                }
              ]
            },
            {
              type: "icon",
              x: "0",
              y: "0",
              glyph: "condition_icon",
              size: "0.18 + energy*0.05",
              fill: { h: "0.12 + tone*0.3", s: "0.7", v: "1", a: "0.95" }
            }
          ]
        }
      ]
    }
  },
  {
    name: "Minimal Clock",
    description: "Monochrome two-hand clock with only four markers.",
    spec: {
      version: 1,
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "0",
          s: "0",
          v: "0.04 + 0.02*(1-r)",
          a: "1"
        },
        {
          id: "minimal",
          kind: "nodes",
          defs: {
            ha: "TAU*((hour12 + minute/60)/12) - PI/2",
            ma: "TAU*((minute + second/60)/60) - PI/2"
          },
          nodes: [
            {
              type: "repeat",
              idx: "k",
              count: 4,
              children: [
                {
                  type: "disc",
                  x: "px(0.8, TAU*(k/4) - PI/2)",
                  y: "py(0.8, TAU*(k/4) - PI/2)",
                  r: "0.025",
                  fill: { h: "0", s: "0", v: "1", a: "0.88" }
                }
              ]
            },
            {
              type: "line",
              x1: "0",
              y1: "0",
              x2: "px(0.42, ha)",
              y2: "py(0.42, ha)",
              stroke: { h: "0", s: "0", v: "1", a: "1", w: "0.03" }
            },
            {
              type: "line",
              x1: "0",
              y1: "0",
              x2: "px(0.68, ma)",
              y2: "py(0.68, ma)",
              stroke: { h: "0", s: "0", v: "1", a: "0.92", w: "0.018" }
            }
          ]
        }
      ]
    }
  },
  {
    name: "Stock Ticker",
    description: "Price display with daily range ring and directional change indicator.",
    spec: {
      version: 1,
      bindings: {
        var_a: "num",
        var_b: "num",
        condition_icon: "icon"
      },
      layers: [
        {
          id: "bg",
          kind: "field",
          h: "select(var_b >= 0, 0.34, 0.02)",
          s: "0.28",
          v: "0.05 + 0.04*(1-r) + 0.02*sin(t*0.8)",
          a: "1"
        },
        {
          id: "stock",
          kind: "nodes",
          defs: {
            range_n: "clamp(var_a/200, 0, 1)"
          },
          nodes: [
            {
              type: "arc",
              x: "0",
              y: "0",
              r: "0.7",
              start: "-PI/2",
              sweep: "range_n * TAU",
              stroke: {
                h: "select(var_b >= 0, 0.34, 0.02)",
                s: "0.88",
                v: "1",
                a: "1",
                w: "0.05"
              }
            },
            {
              type: "icon",
              x: "0",
              y: "-0.24",
              glyph: "condition_icon",
              size: "0.16",
              fill: {
                h: "select(var_b >= 0, 0.34, 0.02)",
                s: "0.9",
                v: "1",
                a: "1"
              }
            },
            {
              type: "text",
              x: "0",
              y: "0.02",
              value: "{var_a:2}",
              size: "0.18 + 0.01*sin(t*4)",
              weight: "500",
              fill: { h: "0.12", s: "0.02", v: "1", a: "1" }
            },
            {
              type: "text",
              x: "0",
              y: "0.24",
              value: "{var_b:2}%",
              size: "0.09",
              fill: {
                h: "select(var_b >= 0, 0.34, 0.02)",
                s: "0.9",
                v: "1",
                a: "0.9"
              }
            }
          ]
        }
      ]
    }
  }
];
