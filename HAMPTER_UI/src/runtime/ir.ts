import type { BindingType, ClockValues, SceneSpec } from "./types";

export type IRScalarType = "f32" | "q16_16";
export type IROpcode =
  | "const"
  | "load_slot"
  | "neg"
  | "not"
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "mod"
  | "lt"
  | "gt"
  | "lte"
  | "gte"
  | "eq"
  | "neq"
  | "and"
  | "or"
  | "sin"
  | "cos"
  | "tan"
  | "abs"
  | "sqrt"
  | "floor"
  | "ceil"
  | "min"
  | "max"
  | "pow"
  | "clamp"
  | "lerp"
  | "smoothstep"
  | "select"
  | "px"
  | "py";

export interface SlotRef {
  index: number;
  name: string;
}

export interface IRBindingSlot extends SlotRef {
  kind: "binding";
  bindingType: BindingType;
}

export interface IRThemeSlot extends SlotRef {
  kind: "theme";
}

export interface IRClockSlot extends SlotRef {
  kind: "clock";
  clockKey: keyof ClockValues | "t";
}

export interface IRDefSlot extends SlotRef {
  kind: "def";
}

export interface IRLocalSlot extends SlotRef {
  kind: "local";
}

export type IRSlot = IRBindingSlot | IRThemeSlot | IRClockSlot | IRDefSlot | IRLocalSlot;

export interface IRInstruction {
  opcode: IROpcode;
  dest: number;
  args: number[];
  immediate?: number;
}

export interface IRProgram {
  id: string;
  outputSlot: number;
  instructions: IRInstruction[];
}

export interface IRColorProgram {
  h: string;
  s: string;
  v: string;
  a: string;
  w?: string;
}

export interface IRTextTokenLiteral {
  kind: "literal";
  value: string;
}

export interface IRTextTokenBinding {
  kind: "binding";
  binding: string;
  format?: string;
}

export type IRTextToken = IRTextTokenLiteral | IRTextTokenBinding;

export interface IRTransformRef {
  translateXSlot: number;
  translateYSlot: number;
  rotateSlot?: number;
  opacitySlot?: number;
}

export interface IRBaseDrawCommand {
  id: string;
  kind: DeviceDrawCommand["kind"];
  whenSlot?: number;
  transform?: IRTransformRef;
}

export interface IRDiscCommand extends IRBaseDrawCommand {
  kind: "disc";
  xSlot: number;
  ySlot: number;
  rSlot: number;
  fill: IRColorProgram;
}

export interface IRArcCommand extends IRBaseDrawCommand {
  kind: "arc";
  xSlot: number;
  ySlot: number;
  rSlot: number;
  startSlot: number;
  sweepSlot: number;
  stroke: IRColorProgram & { w: string };
}

export interface IRLineCommand extends IRBaseDrawCommand {
  kind: "line";
  x1Slot: number;
  y1Slot: number;
  x2Slot: number;
  y2Slot: number;
  stroke: IRColorProgram & { w: string };
}

export interface IRRoundRectCommand extends IRBaseDrawCommand {
  kind: "roundrect";
  xSlot: number;
  ySlot: number;
  wSlot: number;
  hSlot: number;
  radiusSlot: number;
  fill: IRColorProgram;
}

export interface IRTextCommand extends IRBaseDrawCommand {
  kind: "text";
  xSlot: number;
  ySlot: number;
  sizeSlot: number;
  align: "left" | "center" | "right";
  weight: string;
  tokens: IRTextToken[];
  fill: IRColorProgram;
}

export interface IRIconCommand extends IRBaseDrawCommand {
  kind: "icon";
  xSlot: number;
  ySlot: number;
  sizeSlot: number;
  glyphBinding: string;
  fill: IRColorProgram;
}

export type DeviceDrawCommand =
  | IRDiscCommand
  | IRArcCommand
  | IRLineCommand
  | IRRoundRectCommand
  | IRTextCommand
  | IRIconCommand;

export interface NormalizedFieldLayerIR {
  id: string;
  kind: "field";
  hProgram: IRProgram;
  sProgram: IRProgram;
  vProgram: IRProgram;
  aProgram: IRProgram;
}

export interface NormalizedNodeLayerIR {
  id: string;
  kind: "nodes";
  programs: IRProgram[];
  commands: DeviceDrawCommand[];
}

export interface NormalizedSceneIR {
  version: 1;
  source: SceneSpec;
  slots: IRSlot[];
  layers: Array<NormalizedFieldLayerIR | NormalizedNodeLayerIR>;
  stats: {
    layerCount: number;
    nodeCount: number;
    programCount: number;
  };
}

export interface DeviceTargetProfile {
  name: "esp32-c3";
  scalarType: IRScalarType;
  maxPrograms: number;
  maxDrawCommands: number;
  maxFieldCells: number;
  maxTextGlyphs: number;
}

export interface DeviceFieldProgram {
  id: string;
  mode: "grid" | "radial" | "angular";
  cellSize: number;
  hProgramId: string;
  sProgramId: string;
  vProgramId: string;
  aProgramId: string;
}

export interface DeviceTextTemplate {
  id: string;
  tokens: IRTextToken[];
}

export interface DeviceResourceTable {
  textTemplates: DeviceTextTemplate[];
  iconBindings: string[];
}

export interface DeviceSceneIR {
  version: 1;
  target: DeviceTargetProfile["name"];
  scalarType: IRScalarType;
  slots: IRSlot[];
  programs: IRProgram[];
  fieldPrograms: DeviceFieldProgram[];
  drawCommands: DeviceDrawCommand[];
  resources: DeviceResourceTable;
  limits: DeviceTargetProfile;
}

export const ESP32_C3_TARGET_PROFILE: DeviceTargetProfile = {
  name: "esp32-c3",
  scalarType: "q16_16",
  maxPrograms: 256,
  maxDrawCommands: 512,
  maxFieldCells: 4096,
  maxTextGlyphs: 128
};
