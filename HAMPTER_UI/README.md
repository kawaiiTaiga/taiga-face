# HAMPTER UI DSL

LLM-friendly scene DSL, live preview server, and MCP bridge for circular displays.

## Overview

This project has 3 parts:

- `runtime`: validates, compiles, and renders a scene spec to canvas
- `server`: React/Vite test app plus a `ws` backend for live updates
- `mcp`: stdio MCP server that pushes specs/data into the test server

Main source folders:

- [`src/runtime`](src/runtime)
- [`src/server`](src/server)
- [`src/mcp`](src/mcp)
- [`src/examples/specs.ts`](src/examples/specs.ts)

## Repository Scope

This repository is the CIRCLE UI runtime, browser preview, example specs, and MCP bridge.

Keep only these parts in the public repo:

- `src/`
- `docs/`
- `index.html`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `hampter_ui_implementation_spec.md`
- `README.md`

Local origin experiments, device/server workspaces, build output, and dependencies are intentionally excluded by `.gitignore`.

## Requirements

- Node.js `22+`
- npm `10+`

## Quick Start

Install dependencies:

```bash
npm install
```

Start the WebSocket backend:

```bash
npm run dev:ws
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:8091/
```

In the UI:

1. Click an example on the left, for example `Weather Dashboard`
2. Edit the JSON in the middle panel
3. Watch the circular preview update on the right
4. Adjust bindings with the generated sliders/dropdowns

## Run Order

If you just want the local preview app:

1. `npm install`
2. `npm run dev:ws`
3. `npm run dev`
4. Open `http://localhost:8091/`

If you want MCP as well:

1. `npm install`
2. `npm run dev:ws`
3. `npm run dev`
4. In another terminal, run `npm run dev:mcp`

## Scripts

```bash
npm run dev       # frontend on http://localhost:8091
npm run dev:ws    # websocket server on ws://localhost:8090
npm run dev:mcp   # MCP stdio server
npm test          # Vitest
npm run build     # type-check + production build
```

## Ports

- HTTP frontend: `8091`
- WebSocket backend: `8090`

You can change the WebSocket target with:

```bash
HAMPTER_UI_WS_HOST=localhost
HAMPTER_UI_WS_PORT=8090
```

The frontend connects to:

```text
ws://<current-host>:8090
```

## What The Server Does

The test server is the main manual workflow:

- left panel: built-in example library
- center panel: JSON scene editor with validation feedback
- right panel: circular live preview, FPS, bindings, time override

When the spec changes:

1. the browser validates it
2. the runtime recompiles it
3. the preview re-renders it
4. the browser reports validation/status back over WebSocket

## MCP

The MCP server lives in [`src/mcp/server.ts`](src/mcp/server.ts) and exposes:

- `hampter_ui_push`
- `hampter_ui_data`
- `hampter_ui_status`
- `hampter_ui_clear`
- `hampter_ui_examples`

Important:

- MCP does not serve the UI
- MCP sends commands into the WebSocket backend
- the frontend should already be running if you want to see live preview

### Example MCP Client Setup

Example `Claude Desktop` style config:

```json
{
  "mcpServers": {
    "hampter-ui": {
      "command": "npm",
      "args": ["run", "dev:mcp"],
      "cwd": "/path/to/HAMPTER_UI",
      "env": {
        "HAMPTER_UI_WS_HOST": "localhost",
        "HAMPTER_UI_WS_PORT": "8090"
      }
    }
  }
}
```

Expected local run order when using MCP:

1. `npm run dev:ws`
2. `npm run dev`
3. start the MCP client with the config above

Once connected, the client can call:

- `hampter_ui_examples`
- `hampter_ui_push`
- `hampter_ui_data`
- `hampter_ui_status`
- `hampter_ui_clear`

## Project Layout

```text
src/
  runtime/   types, validator, compiler, renderer, runtime API
  server/    React app, websocket protocol, websocket server
  mcp/       MCP stdio server
  examples/  built-in example specs
  tests/     expression and validation tests
```

## Verification

These commands currently pass in this workspace:

```bash
npm test
npm run build
```

## Notes

- Rendering is clipped to a circular display area
- Field layers use a cell renderer, default `4px`
- `icon` bindings use a small built-in glyph set with fallback text rendering
- The current implementation targets browser preview first, with the DSL structured so it can later compile into a smaller device-oriented IR

## Next Step: IR

The next implementation step is the device-oriented IR layer.

- IR types: [`src/runtime/ir.ts`](src/runtime/ir.ts)
- design draft: [`docs/device-ir.md`](docs/device-ir.md)

The intended path is:

```text
SceneSpec -> validation -> normalized IR -> device target IR -> embedded replay runtime
```
