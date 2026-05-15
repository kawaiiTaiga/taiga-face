# Device IR Draft

This document defines the next compilation step after the current validated scene/runtime layer.

## Goal

Preserve the current DSL surface while making device execution cheap:

```text
SceneSpec JSON
  -> validation
  -> normalized scene IR
  -> device target IR
  -> ESP32-class replay runtime
```

The device should not parse strings or interpret scene structure dynamically. It should only:

1. receive binding/time values
2. run compact numeric programs
3. execute a fixed draw-command list

## Stages

### 1. Normalized Scene IR

Purpose:

- remove JSON-specific concerns
- flatten `repeat`
- tokenize text templates
- assign slots to bindings, defs, clock vars, theme vars
- lower expressions into numeric programs

This IR is still target-agnostic and can be shared by:

- browser preview
- offline validation tools
- future device compilers

### 2. Device Target IR

Purpose:

- choose numeric representation, for example `q16.16`
- enforce hard limits for a device class
- choose field mode, for example `grid`
- build a fixed draw-command array
- build compact resource tables for text/icon usage

This IR should be stable enough to serialize into binary later.

## Runtime Split

Compile-time work:

- expression parsing
- dependency sorting
- repeat expansion
- template tokenization
- slot assignment
- command ordering
- limit checking

Device-time work:

- binding slot updates
- clock slot updates
- program evaluation
- draw replay

## Slot Model

All dynamic values are accessed by slot index.

Examples:

- binding slots: `temp`, `humidity`
- clock slots: `t`, `hour24`, `minute`, `second`
- theme slots: `accent_h`
- def slots: `temp_n`, `humidity_n`
- local slots: loop indices or lowered temporaries

The point is to replace:

```text
"temp_n * PI * 1.44"
```

with:

```text
load slot -> multiply -> multiply -> write output slot
```

## Programs

Expressions should lower to compact instruction lists.

Representative opcodes:

- arithmetic: `add`, `sub`, `mul`, `div`, `mod`
- compare: `lt`, `gt`, `lte`, `gte`, `eq`, `neq`
- logic: `and`, `or`, `not`
- math: `sin`, `cos`, `abs`, `sqrt`, `pow`
- helpers: `clamp`, `lerp`, `smoothstep`, `select`, `px`, `py`

Programs should be evaluated in precomputed order. There should be no recursion on device.

## Draw Command Model

After normalization, the device should replay a fixed list of commands:

- `disc`
- `arc`
- `line`
- `roundrect`
- `text`
- `icon`

Commands reference slots instead of expressions.

Example shape:

```text
arc:
  xSlot
  ySlot
  rSlot
  startSlot
  sweepSlot
  stroke color program refs
```

`group`, `stack`, and `repeat` should not survive as structural nodes in the final device IR. Their effect should already be lowered into transforms, positions, and command expansion.

## Field Strategy

`field` is the most expensive feature and should be explicitly lowered into a device mode.

Initial target modes:

- `grid`: evaluate per cell
- `radial`: specialized radial background mode
- `angular`: specialized angle-driven background mode

This keeps the DSL feature intact while giving the compiler freedom to choose a cheaper execution strategy.

## Text Strategy

Text should not be parsed on device.

Compile-time:

- tokenize template
- validate referenced bindings
- allocate a template resource id

Device-time:

- read template tokens
- format only the required binding values
- emit glyph draw calls

## ESP32-C3 Direction

For an `ESP32-C3`-class target, the likely design is:

- fixed-point scalar math, likely `q16.16`
- no dynamic allocation in frame loop
- fixed upper bounds for programs and commands
- preallocated frame buffer or partial draw path
- low-resolution or specialized field lowering

## Next Implementation Step

Practical order:

1. define the IR types
2. add a normalized-scene lowering pass from compiled scene
3. add a target profile for `esp32-c3`
4. emit a JSON debug form of the device IR
5. only then start the embedded replay runtime

Related code:

- [`src/runtime/ir.ts`](../src/runtime/ir.ts)
- [`src/runtime/compiler.ts`](../src/runtime/compiler.ts)
- [`src/runtime/validator.ts`](../src/runtime/validator.ts)
