const TAU = Math.PI * 2;

const PARAM_RANGES = {
  lid_top: [0, 1],
  lid_bottom: [0, 1],
  upper_inner: [0, 1],
  upper_outer: [0, 1],
  lower_inner: [0, 1],
  lower_outer: [0, 1],
  tilt: [-1, 1],
  width: [0.5, 1.5],
  spacing: [0.2, 1],
  gaze_x: [-1, 1],
  gaze_y: [-1, 1],
  glow: [0, 2],
  warmth: [0, 1],
};

const COMPACT_PARAM_RANGES = {
  openness: [0, 1],
  squint: [0, 1],
  smile: [0, 1],
  roundness: [0, 1],
  slant: [-1, 1],
  asymmetry: [-1, 1],
  spacing: [0.2, 1],
  gaze_x: [-1, 1],
  gaze_y: [-1, 1],
  glow: [0, 2],
  warmth: [0, 1],
};

const DEFAULT_TRANSIENT_DURATION_SCALE = 1.28;

export const DEFAULT_IDLE_DSL = `face:
  mode: compact
  openness: 0.83 + 0.035*sin(time * 0.27) + 0.016*sin(time * 0.83 + 0.4)
  squint: 0.06 + 0.016*abs(sin(time * 0.17 + 1.2)) + 0.008*sin(time * 0.91)
  smile: 0.11 + 0.025*sin(time * 0.31 + 0.8)
  roundness: 0.15 + 0.018*sin(time * 0.19 + 2.1)
  slant: 0.02 + 0.03*sin(time * 0.13 + 1.6)
  asymmetry: 0.015*sin(time * 0.15 + 0.3) + 0.01*sin(time * 1.4)
  gaze: [0.055*sin(time * 0.23) + 0.014*sin(time * 1.27), -0.03 + 0.024*sin(time * 0.21 + 0.6)]
  glow: 0.74 + 0.04*sin(time * 0.58) + 0.02*sin(time * 1.07 + 0.4)
  warmth: 0.32`;

export const PRESETS = {
  IDLE: DEFAULT_IDLE_DSL,
  HAPPY: `face:
  mode: compact
  openness: 0.79 + 0.022*sin(time * 0.34) + 0.01*sin(time * 1.12 + 0.5)
  squint: 0.055 + 0.018*abs(sin(time * 0.26 + 1.1))
  smile: 0.46 + 0.04*sin(time * 0.39 + 0.3) + 0.014*sin(time * 1.06)
  roundness: 0.22 + 0.018*sin(time * 0.2 + 2.4)
  slant: -0.004 + 0.008*sin(time * 0.14 + 1.2)
  asymmetry: 0.012*sin(time * 0.18 + 0.4)
  gaze: [0.026*sin(time * 0.24) + 0.01*sin(time * 1.42), -0.045 + 0.014*sin(time * 0.26 + 1.3)]
  glow: 0.9 + 0.03*abs(sin(time * 0.78)) + 0.02*sin(time * 0.38)
  warmth: 0.52`,
  ANGRY: `face:
  left:
    lid_top: 0.32
    lid_bottom: 0.06
    upper_inner: 0.44
    upper_outer: 0.18
    lower_inner: 0.10
    lower_outer: 0.04
    tilt: -0.28
    width: 1.0
  right:
    lid_top: 0.32
    lid_bottom: 0.06
    upper_inner: 0.44
    upper_outer: 0.18
    lower_inner: 0.10
    lower_outer: 0.04
    tilt: 0.28
    width: 1.0
  spacing: 0.44
  gaze: [0.0, 0.02]
  glow: 0.88 + pulse(0.04, 1.8)
  warmth: 0.16`,
  SAD: `face:
  left:
    lid_top: 0.22 + drift(0.04, 0.25)
    lid_bottom: 0.06
    upper_inner: 0.18
    upper_outer: 0.30
    lower_inner: 0.09
    lower_outer: 0.14
    tilt: 0.26
    width: 0.96
  right:
    lid_top: 0.22 + drift(0.04, 0.25)
    lid_bottom: 0.06
    upper_inner: 0.18
    upper_outer: 0.30
    lower_inner: 0.09
    lower_outer: 0.14
    tilt: -0.26
    width: 0.96
  spacing: 0.52
  gaze: [0.0, -0.22]
  glow: 0.72 + breathe(0.05, 0.7)
  warmth: 0.3`,
  SURPRISED: `face:
  mode: compact
  openness: 0.985 + 0.01*sin(time * 0.47)
  squint: 0.0
  smile: 0.02 + 0.01*sin(time * 0.38 + 0.7)
  roundness: 0.94 + 0.02*abs(sin(time * 0.52))
  slant: 0.0
  asymmetry: 0.008*sin(time * 0.44 + 0.8)
  spacing: 0.4
  gaze: [0.015*sin(time * 0.73), -0.005 + 0.015*sin(time * 0.49 + 0.2)]
  glow: 1.0 + 0.08*abs(sin(time * 1.2))
  warmth: 0.24`,
  FORMULA_CURIOUS: `face:
  mode: compact
  openness: 0.77 + 0.03*sin(time * 0.26)
  squint: 0.11 + 0.02*abs(sin(time * 0.23 + 0.8))
  smile: 0.16 + 0.02*sin(time * 0.48 + 0.4)
  roundness: 0.2
  slant: -0.04 + 0.02*sin(time * 0.17 + 2.0)
  asymmetry: 0.18 + 0.03*sin(time * 0.31)
  gaze: [0.18 + 0.05*sin(time * 0.44) + 0.02*sin(time * 1.6), 0.01 + 0.03*sin(time * 0.29 + 0.7)]
  glow: 0.9 + 0.04*sin(time * 0.74)
  warmth: 0.28`,
  CARET_SMILE: `face:
  mode: compact
  openness: 0.38 + 0.014*sin(time * 0.42 + 0.3)
  squint: 0.34 + 0.02*abs(sin(time * 0.58))
  smile: 0.94 + 0.02*sin(time * 0.8 + 0.2)
  roundness: 0.52 + 0.015*sin(time * 0.34 + 1.2)
  slant: 0.0
  asymmetry: 0.006*sin(time * 0.45 + 0.5)
  gaze: [0.0, -0.04]
  glow: 0.98 + 0.04*abs(sin(time * 0.68))
  warmth: 0.58`,
  TRANSIENT_ALERT: `behavior:
  kind: transient
  duration_scale: 1.2
  attack: 0.08
  hold: 0.28
  release: 1.35
face:
  mode: compact
  openness: 0.98 + 0.03*sin(local_time * 7.0) - 0.05*decay(4.0)
  squint: 0.02 + 0.03*(1.0 - decay(6.5))
  smile: 0.03
  roundness: 0.82 + 0.08*env(0.05, 0.14, 0.9)
  slant: 0.0
  asymmetry: 0.01*sin(local_time * 11.0)
  gaze: [0.03*sin(local_time * 10.0), -0.01 + 0.015*(1.0 - decay(5.0))]
  glow: 1.1 + 0.16*env(0.05, 0.12, 0.85)
  warmth: 0.24`,
  TRANSIENT_SOFTEN: `behavior:
  kind: transient
  duration_scale: 1.2
  attack: 0.14
  hold: 0.52
  release: 1.65
face:
  mode: compact
  openness: 0.76 + 0.02*sin(local_time * 3.2)
  squint: 0.14 - 0.03*env(0.16, 0.32, 1.0)
  smile: 0.66 + 0.04*env(0.16, 0.28, 0.9) - 0.03*decay(2.6)
  roundness: 0.2 + 0.03*(1.0 - decay(3.2))
  slant: -0.03
  asymmetry: 0.015*sin(local_time * 5.5)
  gaze: [0.02*sin(local_time * 4.5), -0.08 + 0.02*(1.0 - decay(3.8))]
  glow: 0.98 + 0.08*env(0.18, 0.2, 0.8)
  warmth: 0.55`,
  SLEEPY: `face:
  left:
    lid_top: 0.74 + drift(0.05, 0.18)
    lid_bottom: 0.0
    upper_inner: 0.70
    upper_outer: 0.78
    lower_inner: 0.06
    lower_outer: 0.02
    tilt: 0.02
    width: 1.0
  right:
    lid_top: 0.78 + drift(0.04, 0.22)
    lid_bottom: 0.0
    upper_inner: 0.72
    upper_outer: 0.82
    lower_inner: 0.06
    lower_outer: 0.02
    tilt: -0.02
    width: 1.0
  spacing: 0.5
  gaze: [drift(0.08, 0.16), -0.18]
  glow: 0.3 + breathe(0.1, 0.5)
  warmth: 0.34`,
  CURIOUS: `face:
  left:
    lid_top: 0.06
    lid_bottom: 0.12
    upper_inner: 0.10
    upper_outer: 0.04
    lower_inner: 0.14
    lower_outer: 0.10
    tilt: -0.06
    width: 0.9
  right:
    lid_top: 0.0
    lid_bottom: 0.0
    upper_inner: 0.02
    upper_outer: 0.0
    lower_inner: 0.02
    lower_outer: 0.0
    tilt: -0.02
    width: 1.12 + breathe(0.03, 1.4)
  spacing: 0.5
  gaze: [0.22 + drift(0.05, 0.5), 0.03]
  glow: 1.1 + pulse(0.06, 0.9)
  warmth: 0.25`,
  REACTIVE: `face:
  left:
    lid_top: 0.12 - react(presence, 0.12, 3.5)
    lid_bottom: 0.08 + react(energy, 0.18, 2.4)
    upper_inner: 0.16
    upper_outer: 0.10
    lower_inner: 0.10
    lower_outer: 0.06
    tilt: -0.08 + react(arousal, 0.22, 3.2)
    width: 0.96 + react(energy, 0.15, 2.0)
  right:
    lid_top: 0.12 - react(presence, 0.12, 3.5)
    lid_bottom: 0.08 + react(energy, 0.18, 2.4)
    upper_inner: 0.16
    upper_outer: 0.10
    lower_inner: 0.10
    lower_outer: 0.06
    tilt: 0.08 - react(arousal, 0.22, 3.2)
    width: 0.96 + react(energy, 0.15, 2.0)
  spacing: 0.48
  gaze: [react(arousal, 0.35, 2.2), react(presence, 0.18, 2.2)]
  glow: 0.9 + react(energy, 0.5, 1.6) + pulse(0.04, 1.4)
  warmth: 0.22 + react(presence, 0.1, 3.0)`,
};

const allowedExpressionIdentifiers = new Set([
  "breathe",
  "pulse",
  "twitch",
  "drift",
  "react",
  "env",
  "decay",
  "progress",
  "clamp",
  "mix",
  "min",
  "max",
  "abs",
  "sin",
  "cos",
  "pow",
  "exp",
  "floor",
  "ceil",
  "round",
  "fract",
  "smoothstep",
  "PI",
  "time",
  "local_time",
  "energy",
  "presence",
  "arousal",
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function sampleEnvelope(localTime, attack, hold, release) {
  if (localTime <= 0) {
    return 0;
  }

  const safeAttack = Math.max(attack, 0.0001);
  const safeRelease = Math.max(release, 0.0001);

  if (localTime < safeAttack) {
    return smoothstep(0, safeAttack, localTime);
  }

  if (localTime < safeAttack + hold) {
    return 1;
  }

  if (localTime < safeAttack + hold + safeRelease) {
    const releaseProgress = clamp((localTime - safeAttack - hold) / safeRelease, 0, 1);
    const base = 1 - smoothstep(0, 1, releaseProgress);
    return Math.pow(base, 0.6);
  }

  return 0;
}

function hash1(input) {
  const x = Math.sin(input * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

function splitTopLevel(text, delimiter = ",") {
  const parts = [];
  let current = "";
  let depthParen = 0;
  let depthBracket = 0;

  for (const char of text) {
    if (char === "(") {
      depthParen += 1;
    } else if (char === ")") {
      depthParen -= 1;
    } else if (char === "[") {
      depthBracket += 1;
    } else if (char === "]") {
      depthBracket -= 1;
    }

    if (char === delimiter && depthParen === 0 && depthBracket === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function stripYamlComment(line) {
  let depthBracket = 0;
  let depthParen = 0;
  let result = "";

  for (const char of line) {
    if (char === "[") {
      depthBracket += 1;
    } else if (char === "]") {
      depthBracket -= 1;
    } else if (char === "(") {
      depthParen += 1;
    } else if (char === ")") {
      depthParen -= 1;
    }

    if (char === "#" && depthBracket === 0 && depthParen === 0) {
      break;
    }

    result += char;
  }

  return result.trimEnd();
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    return inner ? splitTopLevel(inner).map((entry) => parseScalar(entry)) : [];
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  return trimmed;
}

function parseYamlLike(text) {
  const root = {};
  const stack = [{ indent: -1, container: root }];

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) {
      continue;
    }

    const line = stripYamlComment(rawLine);
    if (!line.trim()) {
      continue;
    }

    const indent = rawLine.match(/^\s*/)[0].length;
    const trimmed = line.trim();
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid YAML line: ${trimmed}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const valuePart = trimmed.slice(separatorIndex + 1).trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].container;
    if (!valuePart) {
      const nextObject = {};
      parent[key] = nextObject;
      stack.push({ indent, container: nextObject });
      continue;
    }

    parent[key] = parseScalar(valuePart);
  }

  return root;
}

function parseBehaviorText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return parseYamlLike(text);
  }
}

function compileNumericValue(value) {
  if (typeof value === "number") {
    return () => value;
  }

  if (typeof value !== "string") {
    throw new Error(`Unsupported expression value: ${String(value)}`);
  }

  const expression = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(expression)) {
    const numeric = Number(expression);
    return () => numeric;
  }

  if (!/^[\d\s+\-*/().,_A-Za-z]+$/.test(expression)) {
    throw new Error(`Illegal character in expression: ${expression}`);
  }

  const identifiers = expression.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
  for (const identifier of identifiers) {
    if (!allowedExpressionIdentifiers.has(identifier)) {
      throw new Error(`Unknown identifier "${identifier}" in expression: ${expression}`);
    }
  }

  const compiled = new Function(
    "scope",
    `"use strict";
    const {
      breathe,
      pulse,
      twitch,
      drift,
      react,
      env,
      decay,
      progress,
      clamp,
      mix,
      min,
      max,
      abs,
      sin,
      cos,
      pow,
      exp,
      floor,
      ceil,
      round,
      fract,
      smoothstep,
      PI,
      time,
      local_time,
      energy,
      presence,
      arousal
    } = scope;
    return (${expression});`,
  );

  return (scope) => {
    const result = compiled(scope);
    if (!Number.isFinite(result)) {
      throw new Error(`Expression did not produce a finite number: ${expression}`);
    }
    return result;
  };
}

function createEvaluationScope(engineState, time, behaviorState = null) {
  const localTime = behaviorState ? Math.max(0, time - behaviorState.startTime) : time;
  const totalDuration = behaviorState
    ? behaviorState.attack + behaviorState.hold + behaviorState.release
    : 1;

  return {
    breathe: (amplitude, speed) => amplitude * Math.sin(time * speed * TAU),
    pulse: (amplitude, speed) => amplitude * Math.abs(Math.sin(time * speed * TAU)),
    twitch: (chance, amplitude) => {
      const bucket = Math.floor(time * 18);
      return hash1(bucket * 1.371 + 17.31) >= chance
        ? 0
        : (hash1(bucket * 4.173 + 1.91) - 0.5) * amplitude;
    },
    drift: (amplitude, speed) => {
      const t = time * speed;
      return amplitude * (Math.sin(t) + Math.sin(t * 1.7) * 0.5 + Math.sin(t * 0.3) * 0.3) / 1.8;
    },
    react: (input, gain, decay) =>
      gain * input * Math.exp(-Math.max(0, time - engineState.lastInputChangeTime) * decay),
    env: (attack, hold, release) => sampleEnvelope(localTime, attack, hold, release),
    decay: (rate) => Math.exp(-Math.max(0, localTime) * rate),
    progress: (duration = totalDuration) => clamp(duration <= 0 ? 1 : localTime / duration, 0, 1),
    clamp,
    mix: lerp,
    min: Math.min,
    max: Math.max,
    abs: Math.abs,
    sin: Math.sin,
    cos: Math.cos,
    pow: Math.pow,
    exp: Math.exp,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    fract: (value) => value - Math.floor(value),
    smoothstep: (edge0, edge1, x) => smoothstep(edge0, edge1, x),
    PI: Math.PI,
    time,
    local_time: localTime,
    energy: engineState.inputs.energy,
    presence: engineState.inputs.presence,
    arousal: engineState.inputs.arousal,
  };
}

function normalizeBehavior(parsed) {
  const face = parsed.face ?? parsed;
  if (!face || typeof face !== "object") {
    throw new Error("Behavior must include a face object.");
  }

  const left = face.left ?? {};
  const right = face.right ?? {};
  const gazeArray = Array.isArray(face.gaze) ? face.gaze : [0, 0];

  return {
    left: {
      lid_top: left.lid_top ?? 0,
      lid_bottom: left.lid_bottom ?? 0,
      upper_inner: left.upper_inner ?? left.lid_top ?? 0,
      upper_outer: left.upper_outer ?? left.lid_top ?? 0,
      lower_inner: left.lower_inner ?? left.lid_bottom ?? 0,
      lower_outer: left.lower_outer ?? left.lid_bottom ?? 0,
      tilt: left.tilt ?? 0,
      width: left.width ?? 1,
    },
    right: {
      lid_top: right.lid_top ?? 0,
      lid_bottom: right.lid_bottom ?? 0,
      upper_inner: right.upper_inner ?? right.lid_top ?? 0,
      upper_outer: right.upper_outer ?? right.lid_top ?? 0,
      lower_inner: right.lower_inner ?? right.lid_bottom ?? 0,
      lower_outer: right.lower_outer ?? right.lid_bottom ?? 0,
      tilt: right.tilt ?? 0,
      width: right.width ?? 1,
    },
    spacing: face.spacing ?? 0.5,
    gaze_x: gazeArray[0] ?? 0,
    gaze_y: gazeArray[1] ?? 0,
    glow: face.glow ?? 1,
    warmth: face.warmth ?? 0.2,
  };
}

function clampParam(name, value) {
  const [min, max] = PARAM_RANGES[name];
  return clamp(value, min, max);
}

function clampCompactParam(name, value) {
  const [min, max] = COMPACT_PARAM_RANGES[name];
  return clamp(value, min, max);
}

function isCompactBehavior(parsed) {
  const face = parsed.face ?? parsed;
  if (!face || typeof face !== "object") {
    return false;
  }

  if (face.mode === "compact") {
    return true;
  }

  if (face.left || face.right) {
    return false;
  }

  return ["openness", "squint", "smile", "roundness", "slant", "asymmetry"].some(
    (key) => key in face,
  );
}

function mapCompactChannelsToFace(compact) {
  function buildEye(side) {
    const open = clamp(compact.openness + compact.asymmetry * side * 0.18, 0, 1);
    const topBase = (1 - open) * 0.72 + compact.squint * 0.22;
    const upperAnger = Math.max(0, -compact.slant) * 0.24;
    const upperSadness = Math.max(0, compact.slant) * 0.22;
    const lowerBase = compact.squint * 0.07 + (1 - open) * 0.035;
    const smileEase = smoothstep(0.18, 0.78, compact.smile);
    const smileArc = smoothstep(0.48, 0.84, compact.smile);
    const smilePeak = smoothstep(0.82, 0.98, compact.smile);
    const roundSoft = compact.roundness * (1 - smilePeak * 0.72);
    const lowerSmileInner = compact.smile * 0.31 + smileEase * 0.05;
    const lowerSmileOuter = compact.smile * 0.34 + smileEase * 0.06;
    const smileUpperSoft = smileArc * (0.028 + compact.roundness * 0.012);
    const smileLift = smileArc * (0.07 + compact.roundness * 0.018);
    const smileTaper = smilePeak * (0.018 + (1 - compact.roundness) * 0.01);
    const upperInner = clamp(topBase + upperAnger * 0.95 + compact.squint * 0.08 + smileUpperSoft * 0.12, 0, 1);
    const upperOuter = clamp(topBase * 0.72 + upperSadness + compact.smile * 0.008 + smileUpperSoft * 0.16, 0, 1);
    const lowerInner = clamp(lowerBase + lowerSmileInner + roundSoft * 0.018 + smileLift * 0.8 + smileTaper * 0.06, 0, 1);
    const lowerOuter = clamp(lowerBase + lowerSmileOuter + roundSoft * 0.022 + smileLift * 0.86 + smileTaper * 0.05, 0, 1);

    return {
      lidTop: clampParam("lid_top", (upperInner + upperOuter) * 0.5),
      lidBottom: clampParam("lid_bottom", (lowerInner + lowerOuter) * 0.5),
      upperInner: clampParam("upper_inner", upperInner),
      upperOuter: clampParam("upper_outer", upperOuter),
      lowerInner: clampParam("lower_inner", lowerInner),
      lowerOuter: clampParam("lower_outer", lowerOuter),
      tilt: clampParam("tilt", compact.slant * side * 0.3),
      width: clampParam(
        "width",
        1.0
          - smileEase * 0.06
          - smilePeak * 0.10
          - compact.roundness * (0.22 - smileArc * 0.06)
          - compact.squint * 0.06
          + open * 0.015,
      ),
    };
  }

  return {
    left: buildEye(-1),
    right: buildEye(1),
    spacing: clampParam("spacing", compact.spacing),
    gaze: [
      clampParam("gaze_x", compact.gazeX),
      clampParam("gaze_y", compact.gazeY),
    ],
    glow: clampParam("glow", compact.glow),
    warmth: clampParam("warmth", compact.warmth),
  };
}

function readBehaviorMeta(parsed) {
  const behavior = parsed.behavior ?? {};
  const durationScale = Math.max(0.5, Number(behavior.duration_scale ?? DEFAULT_TRANSIENT_DURATION_SCALE));
  return {
    kind: behavior.kind === "transient" ? "transient" : "persistent",
    durationScale,
    attack: Math.max(0, Number(behavior.attack ?? 0.12)) * durationScale,
    hold: Math.max(0, Number(behavior.hold ?? 0.35)) * durationScale,
    release: Math.max(0.01, Number(behavior.release ?? 0.9)) * durationScale,
  };
}

function compileCompactBehavior(parsed, sourceText) {
  const face = parsed.face ?? parsed;
  const gazeArray = Array.isArray(face.gaze) ? face.gaze : [0, -0.02];
  const compact = {
    openness: compileNumericValue(face.openness ?? 0.82),
    squint: compileNumericValue(face.squint ?? 0.06),
    smile: compileNumericValue(face.smile ?? 0.08),
    roundness: compileNumericValue(face.roundness ?? 0.14),
    slant: compileNumericValue(face.slant ?? 0),
    asymmetry: compileNumericValue(face.asymmetry ?? 0),
    spacing: compileNumericValue(face.spacing ?? 0.46),
    gazeX: compileNumericValue(gazeArray[0] ?? 0),
    gazeY: compileNumericValue(gazeArray[1] ?? -0.02),
    glow: compileNumericValue(face.glow ?? 0.8),
    warmth: compileNumericValue(face.warmth ?? 0.3),
  };

  return {
    sourceText,
    evaluate(engineState, time, behaviorState = null) {
      const scope = createEvaluationScope(engineState, time, behaviorState);
      return mapCompactChannelsToFace({
        openness: clampCompactParam("openness", compact.openness(scope)),
        squint: clampCompactParam("squint", compact.squint(scope)),
        smile: clampCompactParam("smile", compact.smile(scope)),
        roundness: clampCompactParam("roundness", compact.roundness(scope)),
        slant: clampCompactParam("slant", compact.slant(scope)),
        asymmetry: clampCompactParam("asymmetry", compact.asymmetry(scope)),
        spacing: clampCompactParam("spacing", compact.spacing(scope)),
        gazeX: clampCompactParam("gaze_x", compact.gazeX(scope)),
        gazeY: clampCompactParam("gaze_y", compact.gazeY(scope)),
        glow: clampCompactParam("glow", compact.glow(scope)),
        warmth: clampCompactParam("warmth", compact.warmth(scope)),
      });
    },
  };
}

function compileBehavior(parsed, sourceText) {
  if (isCompactBehavior(parsed)) {
    return compileCompactBehavior(parsed, sourceText);
  }

  const normalized = normalizeBehavior(parsed);
  const left = {
    lidTop: compileNumericValue(normalized.left.lid_top),
    lidBottom: compileNumericValue(normalized.left.lid_bottom),
    upperInner: compileNumericValue(normalized.left.upper_inner),
    upperOuter: compileNumericValue(normalized.left.upper_outer),
    lowerInner: compileNumericValue(normalized.left.lower_inner),
    lowerOuter: compileNumericValue(normalized.left.lower_outer),
    tilt: compileNumericValue(normalized.left.tilt),
    width: compileNumericValue(normalized.left.width),
  };
  const right = {
    lidTop: compileNumericValue(normalized.right.lid_top),
    lidBottom: compileNumericValue(normalized.right.lid_bottom),
    upperInner: compileNumericValue(normalized.right.upper_inner),
    upperOuter: compileNumericValue(normalized.right.upper_outer),
    lowerInner: compileNumericValue(normalized.right.lower_inner),
    lowerOuter: compileNumericValue(normalized.right.lower_outer),
    tilt: compileNumericValue(normalized.right.tilt),
    width: compileNumericValue(normalized.right.width),
  };
  const common = {
    spacing: compileNumericValue(normalized.spacing),
    gazeX: compileNumericValue(normalized.gaze_x),
    gazeY: compileNumericValue(normalized.gaze_y),
    glow: compileNumericValue(normalized.glow),
    warmth: compileNumericValue(normalized.warmth),
  };

  return {
    sourceText,
    evaluate(engineState, time, behaviorState = null) {
      const scope = createEvaluationScope(engineState, time, behaviorState);
      return {
        left: {
          lidTop: clampParam("lid_top", left.lidTop(scope)),
          lidBottom: clampParam("lid_bottom", left.lidBottom(scope)),
          upperInner: clampParam("upper_inner", left.upperInner(scope)),
          upperOuter: clampParam("upper_outer", left.upperOuter(scope)),
          lowerInner: clampParam("lower_inner", left.lowerInner(scope)),
          lowerOuter: clampParam("lower_outer", left.lowerOuter(scope)),
          tilt: clampParam("tilt", left.tilt(scope)),
          width: clampParam("width", left.width(scope)),
        },
        right: {
          lidTop: clampParam("lid_top", right.lidTop(scope)),
          lidBottom: clampParam("lid_bottom", right.lidBottom(scope)),
          upperInner: clampParam("upper_inner", right.upperInner(scope)),
          upperOuter: clampParam("upper_outer", right.upperOuter(scope)),
          lowerInner: clampParam("lower_inner", right.lowerInner(scope)),
          lowerOuter: clampParam("lower_outer", right.lowerOuter(scope)),
          tilt: clampParam("tilt", right.tilt(scope)),
          width: clampParam("width", right.width(scope)),
        },
        spacing: clampParam("spacing", common.spacing(scope)),
        gaze: [
          clampParam("gaze_x", common.gazeX(scope)),
          clampParam("gaze_y", common.gazeY(scope)),
        ],
        glow: clampParam("glow", common.glow(scope)),
        warmth: clampParam("warmth", common.warmth(scope)),
      };
    },
  };
}

function makeConstantBehavior(snapshot) {
  return {
    sourceText: JSON.stringify(snapshot, null, 2),
    evaluate() {
      return structuredClone(snapshot);
    },
  };
}

function blendFaces(fromFace, toFace, t) {
  return {
    left: {
      lidTop: lerp(fromFace.left.lidTop, toFace.left.lidTop, t),
      lidBottom: lerp(fromFace.left.lidBottom, toFace.left.lidBottom, t),
      upperInner: lerp(fromFace.left.upperInner, toFace.left.upperInner, t),
      upperOuter: lerp(fromFace.left.upperOuter, toFace.left.upperOuter, t),
      lowerInner: lerp(fromFace.left.lowerInner, toFace.left.lowerInner, t),
      lowerOuter: lerp(fromFace.left.lowerOuter, toFace.left.lowerOuter, t),
      tilt: lerp(fromFace.left.tilt, toFace.left.tilt, t),
      width: lerp(fromFace.left.width, toFace.left.width, t),
    },
    right: {
      lidTop: lerp(fromFace.right.lidTop, toFace.right.lidTop, t),
      lidBottom: lerp(fromFace.right.lidBottom, toFace.right.lidBottom, t),
      upperInner: lerp(fromFace.right.upperInner, toFace.right.upperInner, t),
      upperOuter: lerp(fromFace.right.upperOuter, toFace.right.upperOuter, t),
      lowerInner: lerp(fromFace.right.lowerInner, toFace.right.lowerInner, t),
      lowerOuter: lerp(fromFace.right.lowerOuter, toFace.right.lowerOuter, t),
      tilt: lerp(fromFace.right.tilt, toFace.right.tilt, t),
      width: lerp(fromFace.right.width, toFace.right.width, t),
    },
    spacing: lerp(fromFace.spacing, toFace.spacing, t),
    gaze: [lerp(fromFace.gaze[0], toFace.gaze[0], t), lerp(fromFace.gaze[1], toFace.gaze[1], t)],
    glow: lerp(fromFace.glow, toFace.glow, t),
    warmth: lerp(fromFace.warmth, toFace.warmth, t),
  };
}

class BlinkController {
  constructor() {
    this.active = null;
    this.doubleBlinkPending = false;
    this.nextStart = 2.5;
    this.mode = "maintenance";
    this.pendingMode = null;
  }

  reset(now) {
    this.active = null;
    this.doubleBlinkPending = false;
    this.nextStart = now + this.randomInterval();
    this.mode = "maintenance";
    this.pendingMode = null;
  }

  randomInterval() {
    return lerp(2, 6, Math.random());
  }

  queue(mode) {
    if (!this.active) {
      this.pendingMode = mode;
    }
  }

  sample(time) {
    if (!this.active && this.pendingMode) {
      const duration = this.pendingMode === "shift"
        ? lerp(0.11, 0.16, Math.random())
        : this.pendingMode === "soft"
          ? lerp(0.16, 0.24, Math.random())
          : lerp(0.14, 0.22, Math.random());
      this.active = {
        start: time,
        duration,
        mode: this.pendingMode,
      };
      this.mode = this.pendingMode;
      this.pendingMode = null;
    } else if (!this.active && time >= this.nextStart) {
      this.active = { start: time, duration: lerp(0.14, 0.22, Math.random()), mode: "maintenance" };
      this.mode = "maintenance";
    }

    if (!this.active) {
      return { amount: 0, mode: this.mode };
    }

    const phase = (time - this.active.start) / this.active.duration;
    if (phase >= 1) {
      const finishedMode = this.active.mode;
      this.active = null;
      if (!this.doubleBlinkPending && Math.random() < 0.18) {
        this.doubleBlinkPending = true;
        this.nextStart = time + lerp(0.08, 0.18, Math.random());
      } else {
        this.doubleBlinkPending = false;
        this.nextStart = time + this.randomInterval();
      }
      this.mode = finishedMode;
      return { amount: 0, mode: finishedMode };
    }

    const close = phase < 0.42 ? smoothstep(0, 1, phase / 0.42) : 1;
    const hold = phase < 0.58 ? 1 : 1 - smoothstep(0, 1, (phase - 0.58) / 0.42);
    const base = Math.max(close, hold);
    const amplitude = this.active.mode === "soft" ? 0.55 : 1.0;
    return {
      amount: base * amplitude,
      mode: this.active.mode,
    };
  }
}

class GazeController {
  constructor() {
    this.current = [0, 0];
    this.target = [0, 0];
    this.start = [0, 0];
    this.overshoot = [0, 0];
    this.focus = [0, -0.02];
    this.state = "hold";
    this.timer = 0;
    this.holdDuration = 2.8;
    this.lastTime = 0;
  }

  reset(now) {
    this.current = [0.0, -0.02];
    this.start = [...this.current];
    this.target = [...this.current];
    this.overshoot = [...this.current];
    this.focus = [...this.current];
    this.state = "hold";
    this.timer = 0;
    this.holdDuration = 1.8 + Math.random() * 2.2;
    this.lastTime = now;
  }

  sample(time) {
    const dt = Math.min(Math.max(time - this.lastTime, 0), 0.1);
    this.lastTime = time;
    this.timer += dt;

    let blinkCue = null;

    if (this.state === "hold" && this.timer >= this.holdDuration) {
      this.start = [...this.current];
      this.focus = [
        (Math.random() - 0.5) * 0.34,
        -0.03 + (Math.random() - 0.5) * 0.12,
      ];
      this.overshoot = [
        this.focus[0] * 1.18,
        this.focus[1] * 1.14,
      ];
      this.state = "saccade";
      this.timer = 0;
      blinkCue = Math.random() < 0.38 ? "shift" : null;
    } else if (this.state === "saccade" && this.timer >= 0.085) {
      this.state = "settle";
      this.timer = 0;
      this.start = [...this.current];
    } else if (this.state === "settle" && this.timer >= 0.14) {
      this.state = "hold";
      this.timer = 0;
      this.current = [...this.focus];
      this.holdDuration = 1.4 + Math.random() * 2.6;
      if (Math.random() < 0.16) {
        blinkCue = "soft";
      }
    }

    if (this.state === "hold") {
      this.current[0] += (this.focus[0] - this.current[0]) * dt * 5.5;
      this.current[1] += (this.focus[1] - this.current[1]) * dt * 5.5;
    } else if (this.state === "saccade") {
      const t = clamp(this.timer / 0.085, 0, 1);
      const e = 1.0 - Math.pow(1.0 - t, 3.0);
      this.current[0] = lerp(this.start[0], this.overshoot[0], e);
      this.current[1] = lerp(this.start[1], this.overshoot[1], e);
    } else if (this.state === "settle") {
      const t = clamp(this.timer / 0.14, 0, 1);
      const e = t * t * (3 - 2 * t);
      this.current[0] = lerp(this.start[0], this.focus[0], e);
      this.current[1] = lerp(this.start[1], this.focus[1], e);
    }

    return {
      value: [...this.current],
      state: this.state,
      blinkCue,
    };
  }
}

function serializeLiveFace(face, inputs, overlay) {
  return JSON.stringify(
    {
      left: {
        lid_top: Number(face.left.lidTop.toFixed(3)),
        lid_bottom: Number(face.left.lidBottom.toFixed(3)),
        upper_inner: Number(face.left.upperInner.toFixed(3)),
        upper_outer: Number(face.left.upperOuter.toFixed(3)),
        lower_inner: Number(face.left.lowerInner.toFixed(3)),
        lower_outer: Number(face.left.lowerOuter.toFixed(3)),
        tilt: Number(face.left.tilt.toFixed(3)),
        width: Number(face.left.width.toFixed(3)),
      },
      right: {
        lid_top: Number(face.right.lidTop.toFixed(3)),
        lid_bottom: Number(face.right.lidBottom.toFixed(3)),
        upper_inner: Number(face.right.upperInner.toFixed(3)),
        upper_outer: Number(face.right.upperOuter.toFixed(3)),
        lower_inner: Number(face.right.lowerInner.toFixed(3)),
        lower_outer: Number(face.right.lowerOuter.toFixed(3)),
        tilt: Number(face.right.tilt.toFixed(3)),
        width: Number(face.right.width.toFixed(3)),
      },
      spacing: Number(face.spacing.toFixed(3)),
      gaze: face.gaze.map((value) => Number(value.toFixed(3))),
      glow: Number(face.glow.toFixed(3)),
      warmth: Number(face.warmth.toFixed(3)),
      blink: Number(face.blinkAmount.toFixed(3)),
      overlay: overlay
        ? {
            preset: overlay.presetName,
            weight: Number(overlay.weight.toFixed(3)),
            local_time: Number(overlay.localTime.toFixed(3)),
          }
        : null,
      inputs: Object.fromEntries(
        Object.entries(inputs).map(([key, value]) => [key, Number(value.toFixed(2))]),
      ),
    },
    null,
    2,
  );
}

export function createBehaviorEngine() {
  const engineState = {
    baseBehavior: null,
    baseTransition: null,
    basePreset: "IDLE",
    overlay: null,
    activePreset: "IDLE",
    inputs: { energy: 0.2, presence: 0.4, arousal: 0.25 },
    lastInputChangeTime: 0,
    lastFrameTime: 0,
    blink: new BlinkController(),
    gaze: new GazeController(),
    currentError: "",
  };

  function getBaseFaceAt(time) {
    if (!engineState.baseBehavior) {
      throw new Error("No behavior has been compiled.");
    }

    if (!engineState.baseTransition) {
      return engineState.baseBehavior.evaluate(engineState, time);
    }

    const progress = clamp((time - engineState.baseTransition.startTime) / engineState.baseTransition.duration, 0, 1);
    const fromFace = engineState.baseTransition.from.evaluate(engineState, time);
    const toFace = engineState.baseTransition.to.evaluate(engineState, time);
    if (progress >= 1) {
      engineState.baseTransition = null;
      return toFace;
    }

    return blendFaces(fromFace, toFace, easeInOutCubic(progress));
  }

  function getFaceWithOverlayAt(time) {
    const baseFace = getBaseFaceAt(time);
    if (!engineState.overlay) {
      return { face: baseFace, overlayState: null };
    }

    const overlay = engineState.overlay;
    const localTime = Math.max(0, time - overlay.startTime);
    const weight = sampleEnvelope(localTime, overlay.attack, overlay.hold, overlay.release);

    if (localTime > overlay.attack + overlay.hold + overlay.release && weight <= 0.0001) {
      engineState.overlay = null;
      engineState.activePreset = engineState.basePreset;
      return { face: baseFace, overlayState: null };
    }

    const overlayFace = overlay.behavior.evaluate(engineState, time, overlay);
    return {
      face: blendFaces(baseFace, overlayFace, weight),
      overlayState: {
        presetName: overlay.presetName,
        weight,
        localTime,
      },
    };
  }

  function getRenderFaceAt(time) {
    engineState.lastFrameTime = time;
    const composed = getFaceWithOverlayAt(time);
    const face = composed.face;
    const gazeSample = engineState.gaze.sample(time);
    if (gazeSample.blinkCue) {
      engineState.blink.queue(gazeSample.blinkCue);
    }
    const blinkSample = engineState.blink.sample(time);
    const blinkAmount = blinkSample.amount;
    const autonomousGaze = gazeSample.value;
    const topBoost = blinkAmount;
    const bottomBoost = blinkAmount * 0.16;
    const baseMotionWeight = engineState.basePreset === "IDLE" ? 1.0 : 0.42;
    const overlayWeight = composed.overlayState?.weight ?? 0;
    const motionWeight = lerp(baseMotionWeight, 0.34, overlayWeight);
    const breathe = 0.75 + 0.08 * Math.sin(time * 0.6) + 0.04 * Math.sin(time * 1.05);
    const glowLift = (breathe - 0.75) * 0.65;
    const hoverLid = Math.max(0, Math.sin(time * 0.42 + 0.8)) * 0.018 * motionWeight;
    const lowerSoft = (0.5 + 0.5 * Math.sin(time * 0.55 + 1.4)) * 0.008 * motionWeight;
    const blinkLag = blinkSample.mode === "soft" ? 0.08 : 0.14;
    const innerBias = 0.028 * motionWeight;

    return {
      left: {
        lidTop: clampParam("lid_top", face.left.lidTop + topBoost + hoverLid),
        lidBottom: clampParam("lid_bottom", face.left.lidBottom + bottomBoost + lowerSoft),
        upperInner: clampParam("upper_inner", face.left.upperInner + topBoost + hoverLid * 1.1 + innerBias),
        upperOuter: clampParam("upper_outer", face.left.upperOuter + topBoost * (0.78 + blinkLag) + hoverLid * 0.8),
        lowerInner: clampParam("lower_inner", face.left.lowerInner + bottomBoost + lowerSoft + innerBias * 0.5),
        lowerOuter: clampParam("lower_outer", face.left.lowerOuter + bottomBoost * 0.62 + lowerSoft * 0.7),
        tilt: face.left.tilt,
        width: clampParam("width", face.left.width + Math.sin(time * 0.55) * 0.008 * motionWeight),
      },
      right: {
        lidTop: clampParam("lid_top", face.right.lidTop + topBoost + hoverLid),
        lidBottom: clampParam("lid_bottom", face.right.lidBottom + bottomBoost + lowerSoft),
        upperInner: clampParam("upper_inner", face.right.upperInner + topBoost + hoverLid + innerBias),
        upperOuter: clampParam("upper_outer", face.right.upperOuter + topBoost * (0.76 + blinkLag * 0.7) + hoverLid * 0.76),
        lowerInner: clampParam("lower_inner", face.right.lowerInner + bottomBoost + lowerSoft + innerBias * 0.5),
        lowerOuter: clampParam("lower_outer", face.right.lowerOuter + bottomBoost * 0.62 + lowerSoft * 0.7),
        tilt: face.right.tilt,
        width: clampParam("width", face.right.width + Math.sin(time * 0.55 + 0.35) * 0.008 * motionWeight),
      },
      spacing: face.spacing,
      gaze: [
        clampParam("gaze_x", face.gaze[0] + autonomousGaze[0] * motionWeight),
        clampParam("gaze_y", face.gaze[1] + autonomousGaze[1] * motionWeight),
      ],
      glow: clampParam("glow", face.glow + glowLift),
      warmth: clampParam("warmth", face.warmth + 0.015 * Math.sin(time * 0.33) * motionWeight),
      blinkAmount,
      overlayState: composed.overlayState,
    };
  }

  return {
    applyText(text, { duration = 0.6, presetName = "CUSTOM" } = {}) {
      const parsed = parseBehaviorText(text);
      const meta = readBehaviorMeta(parsed);
      const compiled = compileBehavior(parsed, text);
      const now = engineState.lastFrameTime || performance.now() * 0.001;
      if (meta.kind === "transient") {
        engineState.overlay = {
          behavior: compiled,
          presetName,
          startTime: now,
          attack: meta.attack,
          hold: meta.hold,
          release: meta.release,
        };
        engineState.activePreset = presetName;
        engineState.currentError = "";
        return compiled;
      }

      const currentBase = engineState.baseBehavior ? getBaseFaceAt(now) : compiled.evaluate(engineState, now);

      engineState.baseTransition = engineState.baseBehavior && duration > 0
        ? { from: makeConstantBehavior(currentBase), to: compiled, startTime: now, duration }
        : null;
      engineState.baseBehavior = compiled;
      engineState.basePreset = presetName;
      engineState.activePreset = presetName;
      engineState.currentError = "";
      return compiled;
    },
    initialize() {
      engineState.blink.reset(0);
      engineState.gaze.reset(0);
      this.applyText(PRESETS.IDLE, { duration: 0, presetName: "IDLE" });
    },
    getRenderFaceAt,
    getTransitionGlitch(time) {
      const baseGlitch = engineState.baseTransition
        ? Math.sin((1 - clamp((time - engineState.baseTransition.startTime) / engineState.baseTransition.duration, 0, 1)) * Math.PI) * 0.85
        : 0;
      if (!engineState.overlay) {
        return baseGlitch;
      }
      const localTime = Math.max(0, time - engineState.overlay.startTime);
      const overlayGlitch = sampleEnvelope(localTime, 0.02, 0.04, 0.18) * 0.14;
      return Math.max(baseGlitch, overlayGlitch);
    },
    setInput(name, value) {
      engineState.inputs[name] = value;
      engineState.lastInputChangeTime = engineState.lastFrameTime;
    },
    resetInputs() {
      engineState.inputs.energy = 0.2;
      engineState.inputs.presence = 0.4;
      engineState.inputs.arousal = 0.25;
      engineState.lastInputChangeTime = engineState.lastFrameTime;
    },
    getInputs() {
      return { ...engineState.inputs };
    },
    getStatus() {
      return {
        activePreset: engineState.activePreset,
        basePreset: engineState.basePreset,
        overlayPreset: engineState.overlay?.presetName ?? "",
        error: engineState.currentError,
      };
    },
    getLiveOutput(face) {
      return serializeLiveFace(face, engineState.inputs, face.overlayState);
    },
  };
}

export function evaluateBehaviorTextAt(
  text,
  {
    time = 0,
    inputs = { energy: 0.2, presence: 0.4, arousal: 0.25 },
    startTime = 0,
  } = {},
) {
  const parsed = parseBehaviorText(text);
  const meta = readBehaviorMeta(parsed);
  const compiled = compileBehavior(parsed, text);
  const engineState = {
    inputs: {
      energy: inputs.energy ?? 0.2,
      presence: inputs.presence ?? 0.4,
      arousal: inputs.arousal ?? 0.25,
    },
    lastInputChangeTime: startTime,
  };
  const behaviorState = meta.kind === "transient"
    ? {
        startTime,
        attack: meta.attack,
        hold: meta.hold,
        release: meta.release,
        presetName: "ANALYSIS",
      }
    : null;

  return {
    meta,
    face: compiled.evaluate(engineState, time, behaviorState),
  };
}
