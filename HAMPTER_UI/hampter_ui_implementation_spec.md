# HAMPTER UI DSL — Implementation Spec

## Overview

Build three components for the HAMPTER UI DSL system:

1. **Runtime Engine** — Parses and renders a JSON scene spec on a Canvas
2. **Test Server** — Web app to preview, edit, and debug scene specs in real-time
3. **MCP Tool** — Allows an LLM (via MCP) to generate and push scene specs to the test server

---

## 1. The DSL Format

The LLM generates a **JSON scene spec**. This is not code — it is a **typed, declarative, reactive scene graph** with expression-valued attributes.

### Core Principles

- **Static topology, dynamic attributes**: What nodes exist is fixed at compile time. Only their attribute values change per frame via expressions.
- **No arbitrary control flow**: No loops (except bounded `repeat`), no mutation, no state, no user-defined functions.
- **Two layer kinds**: `field` (continuous background) and `nodes` (discrete UI objects).
- **All numeric attributes are expressions**: Using the same math expression language proven in the LED DSL.
- **Compiler validates everything**: Schema, types, bounds, expression safety.

### Top-Level Schema

```json
{
  "version": 1,
  "theme": {
    "accent_h": "0.58",
    "accent_s": "0.85",
    "accent_v": "1.0"
  },
  "bindings": {
    "temp": "num",
    "humidity": "num",
    "condition_icon": "icon"
  },
  "layers": [
    { "id": "bg", "kind": "field", ... },
    { "id": "gauges", "kind": "nodes", ... },
    { "id": "labels", "kind": "nodes", ... }
  ]
}
```

### Field Layer (Background)

For continuous background color/opacity. Extends the LED DSL from 1D to 2D circular space.

```json
{
  "id": "bg",
  "kind": "field",
  "h": "0.58 + 0.03*sin(t*0.15 + a*2)",
  "s": "0.15",
  "v": "0.08 + 0.04*(1-r)",
  "a": "1"
}
```

The expression can use spatial variables `x`, `y` (normalized -1 to 1), `r` (radial distance from center), `a` (angle in radians), plus `t` and all data bindings.

Renderer evaluates these per-pixel (or per-cell at a configurable resolution) and draws within a circular clip.

### Node Layer (UI Objects)

For discrete UI elements: gauges, hands, text, indicators.

```json
{
  "id": "hands",
  "kind": "nodes",
  "defs": {
    "ha": "TAU*((hour12 + minute/60)/12) - PI/2",
    "ma": "TAU*((minute + second/60)/60) - PI/2"
  },
  "nodes": [ ... ]
}
```

- `defs`: Named intermediate expressions. Evaluated once per frame before nodes. Usable in all child expressions.
- `nodes`: Array of primitives to render in order.

### Coordinate System

- Center = `(0, 0)`
- Visible circle = `x² + y² <= 1`
- All sizes normalized to display radius (1.0 = full radius)
- Angles in radians, `PI` and `TAU` built-in
- Polar helpers: `px(r, angle)` → `r * cos(angle)`, `py(r, angle)` → `r * sin(angle)`

### Primitive Types

#### `disc`
```json
{
  "type": "disc",
  "x": "0", "y": "0",
  "r": "0.04",
  "fill": { "h": "0.58", "s": "0.8", "v": "1", "a": "1" }
}
```

#### `arc`
```json
{
  "type": "arc",
  "x": "0", "y": "0",
  "r": "0.82",
  "start": "-PI/2",
  "sweep": "temp_n * TAU",
  "stroke": { "h": "0.08", "s": "1", "v": "1", "a": "1", "w": "0.035" }
}
```

#### `line`
```json
{
  "type": "line",
  "x1": "0", "y1": "0",
  "x2": "px(0.7, ma)", "y2": "py(0.7, ma)",
  "stroke": { "h": "0", "s": "0", "v": "1", "a": "1", "w": "0.02" }
}
```

#### `roundrect`
```json
{
  "type": "roundrect",
  "x": "-0.3", "y": "0.4",
  "w": "0.25", "h": "0.1",
  "radius": "0.02",
  "fill": { "h": "0", "s": "0", "v": "0.15", "a": "0.6" }
}
```

#### `text`
```json
{
  "type": "text",
  "x": "0", "y": "0.55",
  "value": "{hour12:02}:{minute:02}",
  "size": "0.15",
  "align": "center",
  "weight": "300",
  "fill": { "h": "0", "s": "0", "v": "1", "a": "0.9" }
}
```

Text `value` uses a restricted template syntax:
- `{binding_name:format}` — e.g. `{temp:0}°`, `{humidity:0}%`, `{hour24:02}:{minute:02}`
- Format is number of decimal places for numbers, or pad width for integers
- Plain strings allowed: `"TEMP"`, `"H {humidity:0}%"`
- Single line only, no wrapping, no rich text

#### `icon`
```json
{
  "type": "icon",
  "x": "0", "y": "-0.2",
  "glyph": "condition_icon",
  "size": "0.18",
  "fill": { "h": "0.13", "s": "0.8", "v": "1", "a": "1" }
}
```

`glyph` references a binding of type `icon`. The renderer maps this to an icon set (implementation-defined).

#### `repeat`
```json
{
  "type": "repeat",
  "idx": "k",
  "count": 12,
  "children": [ ... ]
}
```

- `count` must be a compile-time constant integer (not an expression). Max 60.
- `idx` variable name is available inside children expressions.
- Children are rendered `count` times with `idx` set to 0, 1, 2, ...

#### `stack`
```json
{
  "type": "stack",
  "x": "0", "y": "0",
  "dir": "y",
  "gap": "0.05",
  "align": "center",
  "children": [ ... ]
}
```

Simple vertical or horizontal stacking. No flexbox, no constraints.

#### `group`
```json
{
  "type": "group",
  "x": "0.3", "y": "0",
  "rotate": "t * 0.1",
  "opacity": "0.8",
  "children": [ ... ]
}
```

Groups apply a transform (translate + rotate) and opacity to all children.

### The `when` Attribute

Every primitive can have an optional `when` expression:

```json
{
  "type": "disc",
  "when": "unread > 0",
  "x": "0.6", "y": "-0.6",
  "r": "0.04",
  "fill": { "h": "0", "s": "0.9", "v": "1", "a": "1" }
}
```

- `when` is an **attribute**, not a control structure.
- The scene graph remains static — `when` = false means "don't draw", not "doesn't exist".
- `when` and `opacity` are orthogonal: `when` controls existence, `opacity` controls visual appearance.
- Evaluated as an expression every frame. Truthy (> 0) = draw, falsy (0) = skip.

### Color Model

All colors are HSV with alpha:

```json
{ "h": "expr", "s": "expr", "v": "expr", "a": "expr" }
```

- `h`: Hue, 0–1 (wraps)
- `s`: Saturation, 0–1
- `v`: Value/brightness, 0–1
- `a`: Alpha, 0–1

### Expression Language

Pure, side-effect-free math expressions.

**Constants:** `PI`, `TAU`

**Time:** `t` (seconds since start, float)

**Time-of-day:** `hour12`, `hour24`, `minute`, `second` (second includes fractional milliseconds)

**Data bindings:** As declared in `bindings` — `temp`, `humidity`, etc.

**Def references:** As declared in layer `defs` — `temp_n`, `ha`, etc.

**Repeat index:** `k` (inside repeat children only)

**Spatial (field layer only):** `x`, `y`, `r`, `a`

**Theme:** `accent_h`, `accent_s`, `accent_v`

**Math functions:**
| Function | Description |
|----------|-------------|
| `sin(x)`, `cos(x)`, `tan(x)` | Trigonometric |
| `abs(x)` | Absolute value |
| `sqrt(x)` | Square root |
| `floor(x)`, `ceil(x)` | Rounding |
| `min(a, b)`, `max(a, b)` | Min/max |
| `mod(a, b)` | Float modulo (always positive) |
| `pow(a, b)` | Power |
| `clamp(v, lo, hi)` | Clamp to range |
| `lerp(a, b, f)` | Linear interpolation |
| `smoothstep(e0, e1, x)` | Smooth interpolation |
| `select(cond, a, b)` | If cond > 0 then a else b |
| `px(r, angle)` | `r * cos(angle)` — polar to X |
| `py(r, angle)` | `r * sin(angle)` — polar to Y |

**Operators:** `+`, `-`, `*`, `/`, `%`, `<`, `>`, `<=`, `>=`, `==`, `!=`, `&&`, `||`, `!`

**Ternary:** `cond ? a : b` (equivalent to `select`)

---

## 2. Runtime Engine

### Purpose
Parse a JSON scene spec and render it to an HTML Canvas at 60fps.

### Architecture

```
JSON Scene Spec (string)
  ↓
Schema Validator
  ↓  rejects invalid specs with diagnostics
Compiler
  ↓  parses all expression strings into cached functions
  ↓  resolves defs dependency order
  ↓  flattens repeats (count is known)
  ↓  builds render tree
Runtime Renderer
  ↓  per frame:
  ↓    1. update time variables (t, hour, minute, second)
  ↓    2. evaluate defs
  ↓    3. for each layer:
  ↓       - field: evaluate h/s/v/a per pixel cell
  ↓       - nodes: walk tree, evaluate attributes, draw primitives
  ↓    4. composite to canvas
Canvas Output
```

### Implementation Requirements

- Language: **TypeScript**
- Rendering: **HTML Canvas 2D API**
- Expression compiler: Compile expression strings to JS functions once, call per frame. Cache aggressively.
- Field rendering: Use configurable cell size (default 4px). Only render within circular clip.
- HSV to RGB: Built-in conversion function.
- Circular clip: All rendering clipped to the circular display area.
- Performance target: 60fps for specs with up to 200 nodes and 1 field layer at 400x400px.

### Schema Validation Rules

The validator must enforce:

- Only known node types: `disc`, `arc`, `line`, `roundrect`, `text`, `icon`, `repeat`, `stack`, `group`
- Only known attributes per node type
- `repeat.count` must be a literal integer, max 60
- Max layer count: 8
- Max total node count (after repeat expansion): 500
- Max nesting depth: 5
- Max expression AST depth: 20
- Text `value` must only contain allowed template patterns
- All color objects must have h, s, v, a fields
- Bindings must be declared before use
- Defs must not have circular references

### Exported API

```typescript
interface SceneSpec {
  version: number;
  theme?: Record<string, string>;
  bindings?: Record<string, "num" | "icon">;
  layers: Layer[];
}

interface RuntimeData {
  [key: string]: number | string;  // binding values
}

class HampterUIRuntime {
  constructor(canvas: HTMLCanvasElement);
  
  // Load and compile a scene spec. Throws on validation error.
  load(spec: SceneSpec): ValidationResult;
  
  // Update binding data (e.g. temperature, humidity)
  setData(data: RuntimeData): void;
  
  // Start/stop render loop
  start(): void;
  stop(): void;
  
  // Single frame render (for testing)
  renderFrame(): void;
  
  // Get current validation errors
  getErrors(): ValidationError[];
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  stats: {
    layerCount: number;
    nodeCount: number;  // after repeat expansion
    expressionCount: number;
    hasFieldLayer: boolean;
  };
}

interface ValidationError {
  path: string;      // e.g. "layers[1].nodes[2].x"
  message: string;
  severity: "error" | "warning";
}
```

### File Structure

```
hampter-ui/
├── src/
│   ├── runtime/
│   │   ├── engine.ts          # HampterUIRuntime main class
│   │   ├── validator.ts       # Schema validation
│   │   ├── compiler.ts        # Expression string → JS function compiler
│   │   ├── renderer.ts        # Canvas rendering (field + nodes)
│   │   ├── expressions.ts     # Expression parser, built-in functions
│   │   ├── color.ts           # HSV → RGB conversion
│   │   └── types.ts           # TypeScript type definitions for the spec
│   ├── server/                # Test server (see section 3)
│   └── mcp/                   # MCP tool (see section 4)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Test Server

### Purpose
A web app for previewing and debugging scene specs in real-time. Acts as the render target for the MCP tool.

### Features

#### 3.1 Live Preview
- Circular canvas (400x400) rendering the current scene spec at 60fps
- Dark background, centered display
- Shows current FPS counter

#### 3.2 Spec Editor
- JSON editor panel (left side) with syntax highlighting
- Edit the scene spec directly; changes apply in real-time (with debounce)
- Validation errors shown inline

#### 3.3 Data Controls
- Auto-generated sliders/inputs for each declared binding
- `num` bindings → slider with configurable min/max/step
- `icon` bindings → dropdown from available icon set
- Time-of-day overrides (or use real clock)

#### 3.4 WebSocket API
- The test server runs a WebSocket endpoint
- External tools (like the MCP tool) can push scene specs and data updates
- This is how the LLM controls the display in real-time

#### 3.5 Spec Library
- Sidebar with example specs: clock, weather dashboard, music visualizer, notification panel
- Click to load
- "New blank" option

### Architecture

```
┌──────────────────────────────────────────────┐
│  Browser (Test Server Web App)               │
│                                              │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │  JSON   │  │  Canvas  │  │   Data     │  │
│  │  Editor │  │  Preview │  │  Controls  │  │
│  └────┬────┘  └────▲─────┘  └─────┬──────┘  │
│       │            │               │         │
│       └────────────┼───────────────┘         │
│                    │                         │
│            ┌───────┴────────┐                │
│            │ HampterUI      │                │
│            │ Runtime Engine  │                │
│            └───────▲────────┘                │
│                    │                         │
│            ┌───────┴────────┐                │
│            │   WebSocket    │                │
│            │   Client       │                │
│            └───────▲────────┘                │
└────────────────────┼─────────────────────────┘
                     │
              ┌──────┴──────┐
              │  WebSocket  │
              │  Server     │
              │  (Node.js)  │
              └──────▲──────┘
                     │
              ┌──────┴──────┐
              │  MCP Tool   │
              └─────────────┘
```

### WebSocket Protocol

#### Server → Client

```json
// Push a new scene spec
{
  "type": "spec",
  "spec": { ... }  // full SceneSpec JSON
}

// Update binding data
{
  "type": "data",
  "data": { "temp": 23.5, "humidity": 62 }
}

// Clear display
{
  "type": "clear"
}
```

#### Client → Server

```json
// Report validation result
{
  "type": "validation",
  "result": { ... }  // ValidationResult
}

// Report current state
{
  "type": "status",
  "fps": 60,
  "nodeCount": 45,
  "specId": "..."
}
```

### Tech Stack
- **Frontend**: React + TypeScript, Vite
- **Backend**: Node.js, `ws` library for WebSocket
- **Port**: `8090` (WebSocket), `8091` (HTTP for serving the web app)

---

## 4. MCP Tool

### Purpose
Expose the UI DSL as an MCP tool so an LLM (via Claude Desktop, Claude Code, etc.) can generate and push scene specs to the test server.

### MCP Tools

#### `hampter_ui_push`

Push a scene spec to the test server for rendering.

**Arguments:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `spec` | object | Yes | Full SceneSpec JSON |

**Returns:** Validation result from the runtime engine.

**Example call:**
```json
{
  "name": "hampter_ui_push",
  "arguments": {
    "spec": {
      "version": 1,
      "layers": [
        {
          "id": "bg",
          "kind": "field",
          "h": "0.58",
          "s": "0.1",
          "v": "0.05 + 0.03*(1-r)",
          "a": "1"
        }
      ]
    }
  }
}
```

#### `hampter_ui_data`

Update binding data on the currently rendered spec.

**Arguments:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `data` | object | Yes | Key-value pairs matching declared bindings |

**Returns:** Confirmation or error if binding names don't match spec.

**Example call:**
```json
{
  "name": "hampter_ui_data",
  "arguments": {
    "data": { "temp": 28.3, "humidity": 71 }
  }
}
```

#### `hampter_ui_status`

Get current renderer status.

**Arguments:** None

**Returns:**
```json
{
  "connected": true,
  "currentSpecId": "...",
  "fps": 60,
  "nodeCount": 87,
  "bindings": { "temp": "num", "humidity": "num" },
  "errors": []
}
```

#### `hampter_ui_clear`

Clear the display.

**Arguments:** None

**Returns:** Confirmation.

#### `hampter_ui_examples`

Return a list of example scene specs the LLM can reference or modify.

**Arguments:** None

**Returns:** Array of `{ name, description, spec }` objects.

### MCP Server Configuration

The MCP tool connects to the test server's WebSocket to push specs and data.

**Environment variables:**
- `HAMPTER_UI_WS_HOST`: WebSocket host (default: `localhost`)
- `HAMPTER_UI_WS_PORT`: WebSocket port (default: `8090`)

### MCP Tool Description (for LLM)

The tool description seen by the LLM should include:

```
hampter_ui_push: Generate and render a UI scene on the HAMPTER circular display.

The scene spec is a JSON document describing a layered circular UI.
Two layer types:
- "field": continuous background rendered per-pixel with HSV expressions (like LED DSL but 2D)
- "nodes": discrete UI primitives (disc, arc, line, text, etc.) with expression-valued attributes

All numeric attributes accept math expressions using:
- Time: t (seconds), hour12, hour24, minute, second
- Data: any declared binding (temp, humidity, etc.)
- Math: sin, cos, abs, sqrt, min, max, clamp, lerp, smoothstep, mod, pow
- Polar: px(r, angle), py(r, angle)
- Constants: PI, TAU
- Conditional: select(cond, a, b) or ternary (cond ? a : b)

Colors are always HSV: { h, s, v, a } where h=0-1, s=0-1, v=0-1, a=0-1.
Coordinate space: center=(0,0), radius=1.0.
```

---

## 5. Example Scene Specs

Include these as built-in examples in the test server and available via `hampter_ui_examples`.

### 5.1 Analog Clock

A classic watch face with hour markers, three hands (hour, minute, second), and a digital time readout. The second hand should have a subtle pulse on its color. Background should subtly breathe.

### 5.2 Weather Dashboard

Left gauge for temperature (-10 to 45°C), right gauge for humidity (0-100%). Each gauge is an arc that fills proportionally. Temperature arc color shifts from blue (cold) to red (hot). Center shows current time. Ambient particles float slowly in the background.

### 5.3 Music Visualizer

Uses `var_a` (volume) and `var_b` (frequency) bindings. Concentric rings that pulse with volume. Color shifts with frequency. Radial particles that explode outward on beats.

### 5.4 Minimal Clock

Extremely minimal — just two lines (hour, minute) and four dots at 12/3/6/9. No text. Monochrome. Elegant.

### 5.5 Stock Ticker

Shows `var_a` (price) and `var_b` (change %). A ring gauge shows daily range. Center displays price. Change percentage shown below with color indicating up (green) or down (red). Subtle glow animation on price changes.

---

## 6. Development Priorities

### Phase 1: Runtime Engine
1. Type definitions for the full spec schema
2. Expression compiler (string → cached JS function)
3. Schema validator
4. Canvas renderer (field layer + all node primitives)
5. Main `HampterUIRuntime` class
6. Unit tests for expression evaluation and validation

### Phase 2: Test Server
1. Basic web app with canvas preview
2. JSON editor with live reload
3. Auto-generated data controls from bindings
4. WebSocket server for external connections
5. Example spec library

### Phase 3: MCP Tool
1. MCP server with 5 tools
2. WebSocket client connecting to test server
3. Tool descriptions optimized for LLM understanding
4. Integration test: LLM generates spec → MCP pushes → test server renders

---

## 7. Design Constraints Recap

Things to **include**:
- Static scene graph with expression-valued attributes
- `field` and `nodes` layer types
- 9 primitive types: `disc`, `arc`, `line`, `roundrect`, `text`, `icon`, `repeat`, `stack`, `group`
- `when` attribute on all primitives (existence as attribute, not control flow)
- `defs` for named intermediate expressions
- HSV color model throughout
- Bounded `repeat` (compile-time constant count)
- Restricted text templates
- Polar coordinate helpers

Things to **NOT include** (v1):
- Arbitrary paths / Bézier curves
- Images / bitmaps
- CSS / flexbox / constraint layout
- Event handlers / interactivity
- Mutable state
- Unbounded loops
- User-defined functions
- Multiline text / wrapping
- Gradients as a primitive (use field layer for this)
- Shadows / blur effects
- Animations / transitions system (use `t` and `smoothstep` directly)
