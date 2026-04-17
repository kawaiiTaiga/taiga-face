const PRESETS = [
  {
    id: "server-down",
    name: "Server Down",
    description:
      "문자열 매칭과 레이어 내부 char_index 리셋을 같이 보는 경고형 프리셋입니다. DOWN만 강하게 튀고 SERVER는 느리게 떠다닙니다.",
    content: "SERVER DOWN",
    theme: {
      background: "#05070b",
      vignette: "#09111a",
      fill: "#ffb199",
      glowColor: "#ff5f57",
    },
    font: {
      family: '"Arial Black", Impact, sans-serif',
      size: 132,
      weight: "900",
    },
    base: {
      tracking: 6,
      glow: 10,
      brightness: 1,
      opacity: 1,
      scale_x: 1,
      scale_y: 1,
    },
    baseline: {
      offset_y: "1.8 * sin(t * 0.9 + global_index * 0.25)",
      brightness: "1 + 0.04 * sin(t * 1.4)",
      glow: "10 + 3 * sin(t * 0.5)",
    },
    layers: [
      {
        name: "server drift",
        match: "SERVER",
        offset_x: "4 * sin(t * 1.2 + char_index * 0.28)",
        opacity: "0.9 + 0.08 * sin(t * 0.8 + char_index * 0.2)",
      },
      {
        name: "down strike",
        match: "DOWN",
        offset_y: "-18 * abs(sin(t * 4.8 + char_index * 0.58))",
        scale_y: "1 + 0.16 * abs(sin(t * 4.8 + char_index * 0.58))",
        skew_x: "0.12 * sin(t * 4.8 + char_index * 0.58)",
        glow: "20 + 18 * abs(sin(t * 7 + char_index * 0.5))",
        brightness: "1.14 + 0.2 * abs(sin(t * 6 + char_index * 0.5))",
      },
    ],
  },
  {
    id: "departure-board",
    name: "Departure Board",
    description:
      "word selector와 regex selector를 같이 씁니다. BOARDING은 미세하게 흔들리고, 숫자만 별도로 점멸합니다.",
    content: "BOARDING C23",
    theme: {
      background: "#071108",
      vignette: "#122118",
      fill: "#d8ff9a",
      glowColor: "#a1ff5f",
    },
    font: {
      family: 'Bahnschrift, "Segoe UI Variable Display", sans-serif',
      size: 128,
      weight: "700",
    },
    base: {
      tracking: 7,
      glow: 8,
      brightness: 1,
      opacity: 1,
      scale_x: 1,
      scale_y: 1,
    },
    baseline: {
      offset_y: "2 * sin(t * 0.55 + global_index * 0.15)",
      brightness: "1 + 0.05 * sin(t * 0.9)",
    },
    layers: [
      {
        name: "boarding shimmy",
        match: { word: 1 },
        offset_x: "3.5 * sin(t * 1.6 + char_index * 0.25)",
        skew_x: "0.04 * sin(t * 1.4 + char_index * 0.3)",
      },
      {
        name: "gate flash",
        match: { regex: "\\d+" },
        scale_x: "1 + 0.14 * abs(sin(t * 6.2 + char_index * 0.7))",
        scale_y: "1 - 0.08 * abs(sin(t * 6.2 + char_index * 0.7))",
        glow: "15 + 18 * abs(sin(t * 6.2 + char_index * 0.7))",
        opacity: "0.84 + 0.16 * abs(sin(t * 6.2 + char_index * 0.7))",
      },
    ],
  },
  {
    id: "welcome-home",
    name: "Welcome Home",
    description:
      "chars selector와 last_word selector를 같이 써서, 모음만 미세하게 흔들고 마지막 단어만 따뜻하게 띄우는 예시입니다.",
    content: "WELCOME HOME",
    theme: {
      background: "#120d08",
      vignette: "#231911",
      fill: "#ffe7c0",
      glowColor: "#ffbd73",
    },
    font: {
      family: '"Trebuchet MS", "Gill Sans MT", sans-serif',
      size: 126,
      weight: "700",
    },
    base: {
      tracking: 6,
      glow: 9,
      brightness: 1,
      opacity: 1,
      scale_x: 1,
      scale_y: 1,
    },
    baseline: {
      offset_y: "1.5 * sin(t * 0.8 + global_index * 0.18)",
      brightness: "1 + 0.03 * sin(t * 1.1)",
    },
    layers: [
      {
        name: "vowel shimmer",
        match: { chars: "AEIOU" },
        offset_y: "-8 * sin(t * 2.6 + char_index * 0.5)",
        glow: "12 + 8 * abs(sin(t * 2.6 + char_index * 0.5))",
      },
      {
        name: "home swell",
        match: "last_word",
        scale_x: "1 + 0.05 * sin(t * 1.4 + char_index * 0.25)",
        scale_y: "1 + 0.08 * sin(t * 1.4 + char_index * 0.25)",
        offset_y: "-10 - 3 * sin(t * 1.4 + char_index * 0.25)",
      },
    ],
  },
  {
    id: "fluffy-hamster-twitch",
    name: "Fluffy Hamster Twitch",
    description:
      "햄스터의 실룩거리는 코와 빵빵한 볼, 그리고 짤막하게 점프하는 귀여운 움직임을 형상화한 프리셋입니다.",
    content: "햄스터는 귀여워",
    theme: {
      background: "#FFF9EB",
      vignette: "#F5D6A7",
      fill: "#8B5E3C",
      glowColor: "#FFC0CB",
    },
    font: {
      family: "sans-serif",
      size: 120,
      weight: "900",
    },
    base: {
      tracking: 8,
      glow: 2,
      brightness: 1,
      opacity: 1,
      scale_x: 1,
      scale_y: 1,
    },
    baseline: {
      offset_y: "3 * sin(t * 2.5 + global_index * 0.4)",
      rotation: "0.04 * cos(t * 1.8 + global_index * 0.3)",
      scale_x: "1 + 0.03 * sin(t * 4)",
      scale_y: "1 + 0.03 * cos(t * 4)",
    },
    layers: [
      {
        name: "nose-twitch",
        match: "햄스터",
        offset_x: "1.5 * sin(t * 45 + char_index * 0.2)",
        offset_y: "-5 * abs(sin(t * 12 + char_index * 0.8))",
        scale_x: "1.1 + 0.05 * sin(t * 45)",
        scale_y: "0.9 + 0.05 * cos(t * 45)",
        glow: "4 + 2 * sin(t * 12)",
      },
      {
        name: "heart-beat-cute",
        match: "귀여워",
        scale_x: "1.2 + 0.15 * sin(t * 6)",
        scale_y: "1.2 + 0.15 * sin(t * 6)",
        glow: "10 + 8 * sin(t * 6)",
        brightness: "1.1 + 0.2 * abs(sin(t * 6))",
        offset_y: "-10 * abs(sin(t * 6 + char_index * 0.5))",
      },
      {
        name: "particle-twinkle",
        match: { chars: "는" },
        rotation: "t * 2",
        opacity: "0.7 + 0.3 * sin(t * 10)",
      },
    ],
  },
  {
    id: "breach-shear",
    name: "Breach Shear",
    description:
      "skew_x와 rotation을 더 적극적으로 쓰는 프리셋입니다. 마지막 단어에만 쏠림을 걸어 사다리꼴 느낌을 확인할 수 있습니다.",
    content: "ZONE 7 BREACH",
    theme: {
      background: "#08080e",
      vignette: "#171727",
      fill: "#d7d8ff",
      glowColor: "#7d81ff",
    },
    font: {
      family: '"Arial Black", Impact, sans-serif',
      size: 124,
      weight: "900",
    },
    base: {
      tracking: 7,
      glow: 9,
      brightness: 1,
      opacity: 1,
      scale_x: 1,
      scale_y: 1,
    },
    baseline: {
      offset_x: "1.4 * sin(t * 0.9 + global_index * 0.2)",
      brightness: "1 + 0.02 * sin(t * 1.8)",
    },
    layers: [
      {
        name: "zone tick",
        match: { word: 1 },
        rotation: "0.02 * sin(t * 3.5 + char_index * 0.4)",
      },
      {
        name: "breach shear",
        match: "last_word",
        offset_x: "6 * sin(t * 2.2 + char_index * 0.22)",
        skew_x: "0.22 * sin(t * 2.2 + char_index * 0.22)",
        rotation: "0.06 * sin(t * 2.2 + char_index * 0.22)",
        glow: "12 + 10 * abs(sin(t * 3.8 + char_index * 0.3))",
      },
    ],
  },
];

const ADDITIVE_CHANNELS = new Set([
  "offset_x",
  "offset_y",
  "rotation",
  "skew_x",
  "tracking",
  "glow",
  "blur",
]);

const MULTIPLY_CHANNELS = new Set(["scale_x", "scale_y", "opacity", "brightness"]);

const STATE_DEFAULTS = {
  offset_x: 0,
  offset_y: 0,
  scale_x: 1,
  scale_y: 1,
  rotation: 0,
  skew_x: 0,
  opacity: 1,
  tracking: 0,
  glow: 0,
  blur: 0,
  brightness: 1,
};

const TOKEN_REGEX = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.\d+|\d+\.?|\+|-|\*|\/|%|\(|\)|,)\s*/y;
const AST_CACHE = new Map();

const HELPERS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  sqrt: Math.sqrt,
  clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  },
  mix(a, b, amount) {
    return a + (b - a) * amount;
  },
  fract(value) {
    return value - Math.floor(value);
  },
  tri(value) {
    return 2 * Math.abs((value - Math.floor(value)) - 0.5) - 1;
  },
  smoothstep(edge0, edge1, x) {
    const t = HELPERS.clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
    return t * t * (3 - 2 * t);
  },
  hash(value) {
    return HELPERS.fract(Math.sin(value * 127.1) * 43758.5453123);
  },
};

const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d");
const stageFrame = document.querySelector(".stage-frame");
const presetSelect = document.querySelector("#presetSelect");
const textOverride = document.querySelector("#textOverride");
const speedRange = document.querySelector("#speedRange");
const togglePlayback = document.querySelector("#togglePlayback");
const resetPlayback = document.querySelector("#resetPlayback");
const presetDescription = document.querySelector("#presetDescription");
const presetCode = document.querySelector("#presetCode");
const statusBadge = document.querySelector("#statusBadge");

const playback = {
  presetId: "fluffy-hamster-twitch",
  running: true,
  speed: Number(speedRange.value),
  startStamp: 0,
  pauseStamp: 0,
};

function getCurrentPreset() {
  return PRESETS.find((preset) => preset.id === playback.presetId) ?? PRESETS[0];
}

function setCanvasSize() {
  const rect = stageFrame.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function tokenizeExpression(expression) {
  const tokens = [];
  let index = 0;

  while (index < expression.length) {
    TOKEN_REGEX.lastIndex = index;
    const match = TOKEN_REGEX.exec(expression);
    if (!match) {
      throw new Error(`Unexpected token at column ${index + 1}`);
    }

    tokens.push(match[1]);
    index = TOKEN_REGEX.lastIndex;
  }

  return tokens;
}

function parseExpression(expression) {
  if (AST_CACHE.has(expression)) {
    return AST_CACHE.get(expression);
  }

  const tokens = tokenizeExpression(expression);
  let cursor = 0;

  function peek() {
    return tokens[cursor];
  }

  function consume(expected) {
    const token = tokens[cursor];
    if (expected && token !== expected) {
      throw new Error(`Expected "${expected}" but found "${token ?? "end of input"}"`);
    }

    cursor += 1;
    return token;
  }

  function parsePrimary() {
    const token = peek();

    if (token === "(") {
      consume("(");
      const node = parseAdditive();
      consume(")");
      return node;
    }

    if (token === "+" || token === "-") {
      consume(token);
      return {
        type: "unary",
        operator: token,
        argument: parsePrimary(),
      };
    }

    if (!token) {
      throw new Error("Unexpected end of input");
    }

    if (/^\d/.test(token) || token.startsWith(".")) {
      consume();
      return {
        type: "number",
        value: Number(token),
      };
    }

    if (/^[A-Za-z_]/.test(token)) {
      consume();

      if (peek() === "(") {
        consume("(");
        const args = [];

        if (peek() !== ")") {
          while (true) {
            args.push(parseAdditive());
            if (peek() === ",") {
              consume(",");
              continue;
            }
            break;
          }
        }

        consume(")");
        return {
          type: "call",
          name: token,
          args,
        };
      }

      return {
        type: "identifier",
        name: token,
      };
    }

    throw new Error(`Unexpected token "${token}"`);
  }

  function parseMultiplicative() {
    let node = parsePrimary();

    while (["*", "/", "%"].includes(peek())) {
      const operator = consume();
      node = {
        type: "binary",
        operator,
        left: node,
        right: parsePrimary(),
      };
    }

    return node;
  }

  function parseAdditive() {
    let node = parseMultiplicative();

    while (["+", "-"].includes(peek())) {
      const operator = consume();
      node = {
        type: "binary",
        operator,
        left: node,
        right: parseMultiplicative(),
      };
    }

    return node;
  }

  const ast = parseAdditive();
  if (cursor !== tokens.length) {
    throw new Error(`Unexpected token "${peek()}"`);
  }

  AST_CACHE.set(expression, ast);
  return ast;
}

function evaluateAst(node, scope) {
  switch (node.type) {
    case "number":
      return node.value;
    case "identifier":
      if (Object.hasOwn(scope, node.name)) {
        return scope[node.name];
      }
      if (Object.hasOwn(HELPERS, node.name)) {
        return HELPERS[node.name];
      }
      throw new Error(`Unknown identifier "${node.name}"`);
    case "unary": {
      const value = evaluateAst(node.argument, scope);
      return node.operator === "-" ? -value : value;
    }
    case "binary": {
      const left = evaluateAst(node.left, scope);
      const right = evaluateAst(node.right, scope);
      switch (node.operator) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "%":
          return left % right;
        default:
          throw new Error(`Unsupported operator "${node.operator}"`);
      }
    }
    case "call": {
      const fn = HELPERS[node.name];
      if (typeof fn !== "function") {
        throw new Error(`Unknown function "${node.name}"`);
      }
      const args = node.args.map((arg) => evaluateAst(arg, scope));
      return fn(...args);
    }
    default:
      throw new Error(`Unsupported AST node "${node.type}"`);
  }
}

function evaluateValue(value, scope) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    const ast = parseExpression(value);
    return evaluateAst(ast, scope);
  } catch (error) {
    console.warn("Expression error:", value, error);
    return 0;
  }
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized
        .split("")
        .map((part) => part + part)
        .join("")
    : normalized;

  const int = Number.parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToString({ r, g, b }) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function applyBrightness(hex, brightness) {
  const rgb = hexToRgb(hex);
  return rgbToString({
    r: Math.max(0, Math.min(255, rgb.r * brightness)),
    g: Math.max(0, Math.min(255, rgb.g * brightness)),
    b: Math.max(0, Math.min(255, rgb.b * brightness)),
  });
}

function buildWordSpans(text) {
  const spans = [];
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return spans;
}

function spansFromMatch(text, selector, wordSpans) {
  if (!selector || selector === "all") {
    return [{ start: 0, end: text.length }];
  }

  if (selector === "last_word") {
    return wordSpans.length ? [wordSpans[wordSpans.length - 1]] : [];
  }

  if (typeof selector === "string") {
    const spans = [];
    let cursor = 0;

    while (cursor < text.length) {
      const index = text.indexOf(selector, cursor);
      if (index === -1) {
        break;
      }

      spans.push({ start: index, end: index + selector.length });
      cursor = index + selector.length;
    }

    return spans;
  }

  if (selector.word) {
    const span = wordSpans[selector.word - 1];
    return span ? [span] : [];
  }

  if (selector.chars) {
    const allowed = new Set(selector.chars.split(""));
    const spans = [];

    for (let index = 0; index < text.length; index += 1) {
      if (allowed.has(text[index])) {
        spans.push({ start: index, end: index + 1 });
      }
    }

    return spans;
  }

  if (selector.regex) {
    const regex = new RegExp(selector.regex, "g");
    const spans = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      spans.push({ start: match.index, end: match.index + match[0].length });
    }

    return spans;
  }

  return [];
}

function buildLayerMetadata(text, layers) {
  const wordSpans = buildWordSpans(text);
  const wordMap = Array(text.length).fill(0);

  wordSpans.forEach((span, index) => {
    for (let charIndex = span.start; charIndex < span.end; charIndex += 1) {
      wordMap[charIndex] = index + 1;
    }
  });

  const layerMaps = layers.map((layer) => {
    const spans = spansFromMatch(text, layer.match, wordSpans);
    const matchMap = new Map();

    spans.forEach((span, spanIndex) => {
      let visibleIndex = 0;
      let visibleLength = 0;

      for (let index = span.start; index < span.end; index += 1) {
        if (text[index] !== " ") {
          visibleLength += 1;
        }
      }

      for (let index = span.start; index < span.end; index += 1) {
        if (text[index] === " ") {
          continue;
        }

        matchMap.set(index, {
          char_index: visibleIndex,
          length: visibleLength,
          match_index: spanIndex,
        });

        visibleIndex += 1;
      }
    });

    return {
      layer,
      matchMap,
    };
  });

  return {
    wordSpans,
    wordMap,
    layerMaps,
  };
}

function applyChannelBlock(target, block, scope) {
  if (!block) {
    return;
  }

  for (const [key, rawValue] of Object.entries(block)) {
    if (key === "name" || key === "match") {
      continue;
    }

    if (key === "fill" || key === "glowColor") {
      target[key] = rawValue;
      continue;
    }

    const value = evaluateValue(rawValue, scope);

    if (ADDITIVE_CHANNELS.has(key)) {
      target[key] += value;
    } else if (MULTIPLY_CHANNELS.has(key)) {
      target[key] *= value;
    } else {
      target[key] = value;
    }
  }
}

function createCharState(preset, text, index, t, metadata) {
  const char = text[index];
  const baseScope = {
    t,
    time: t,
    char,
    global_index: index,
    global_length: text.length,
    word_index: metadata.wordMap[index] || 0,
    word_count: metadata.wordSpans.length,
    is_space: char === " " ? 1 : 0,
  };

  const state = {
    ...STATE_DEFAULTS,
    ...preset.base,
    fill: preset.theme.fill,
    glowColor: preset.theme.glowColor,
  };

  applyChannelBlock(state, preset.baseline, {
    ...baseScope,
    char_index: baseScope.global_index,
    length: text.length,
    match_index: 0,
  });

  metadata.layerMaps.forEach(({ layer, matchMap }) => {
    const matchInfo = matchMap.get(index);
    if (!matchInfo) {
      return;
    }

    applyChannelBlock(state, layer, {
      ...baseScope,
      ...matchInfo,
    });
  });

  state.opacity = HELPERS.clamp(state.opacity, 0, 1);
  state.blur = Math.max(0, state.blur);
  state.glow = Math.max(0, state.glow);
  state.scale_x = Math.max(0.2, state.scale_x);
  state.scale_y = Math.max(0.2, state.scale_y);
  return state;
}

function measureGlyphs(text, fontFamily, fontWeight, fontSize) {
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const glyphs = [...text].map((char) => ({
    char,
    width: ctx.measureText(char).width,
  }));
  ctx.restore();
  return glyphs;
}

function drawBackdrop(preset, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, preset.theme.background);
  gradient.addColorStop(1, preset.theme.vignette);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const halo = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    0,
    width * 0.5,
    height * 0.42,
    width * 0.55,
  );
  halo.addColorStop(0, "rgba(255,255,255,0.08)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";
    ctx.fillRect(0, y, width, 1);
  }
  ctx.restore();
}

function renderFrame(t) {
  const preset = getCurrentPreset();
  const text = textOverride.value.trim() || preset.content;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const metadata = buildLayerMetadata(text, preset.layers);

  drawBackdrop(preset, width, height);

  const initialGlyphs = measureGlyphs(text, preset.font.family, preset.font.weight, preset.font.size);
  const initialWidth = initialGlyphs.reduce((sum, glyph) => sum + glyph.width, 0);
  const fitScale = Math.min(1, (width * 0.84) / Math.max(initialWidth, 1));
  const fontSize = Math.max(48, preset.font.size * fitScale);
  const glyphs = measureGlyphs(text, preset.font.family, preset.font.weight, fontSize);

  const states = glyphs.map((glyph, index) => createCharState(preset, text, index, t, metadata));
  const totalWidth = glyphs.reduce((sum, glyph, index) => sum + glyph.width + states[index].tracking, 0);
  let cursorX = (width - totalWidth) * 0.5;
  const baselineY = height * 0.56;

  glyphs.forEach((glyph, index) => {
    const state = states[index];
    const anchorX = cursorX + glyph.width * 0.5;
    cursorX += glyph.width + state.tracking;

    if (glyph.char === " ") {
      return;
    }

    ctx.save();
    ctx.translate(anchorX + state.offset_x, baselineY + state.offset_y);
    ctx.rotate(state.rotation);
    ctx.transform(1, 0, Math.tan(state.skew_x), 1, 0, 0);
    ctx.scale(state.scale_x, state.scale_y);
    ctx.globalAlpha = state.opacity;
    ctx.font = `${preset.font.weight} ${fontSize}px ${preset.font.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.filter = state.blur > 0 ? `blur(${state.blur}px)` : "none";
    ctx.shadowColor = applyBrightness(state.glowColor, Math.max(0.8, state.brightness));
    ctx.shadowBlur = state.glow;
    ctx.fillStyle = applyBrightness(state.fill, state.brightness);
    ctx.fillText(glyph.char, 0, 0);
    ctx.restore();
  });

  ctx.save();
  ctx.font = '600 14px "Cascadia Code", monospace';
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.fillText(`t=${t.toFixed(2)}s`, 22, 28);
  ctx.restore();
}

function animationLoop(timestamp) {
  if (!playback.startStamp) {
    playback.startStamp = timestamp;
  }

  if (playback.running) {
    playback.pauseStamp = timestamp;
  }

  const elapsed = ((playback.pauseStamp - playback.startStamp) / 1000) * playback.speed;
  renderFrame(elapsed);
  requestAnimationFrame(animationLoop);
}

function refreshInspector() {
  const preset = getCurrentPreset();
  presetDescription.textContent = preset.description;
  presetCode.textContent = JSON.stringify(preset, null, 2);
  textOverride.placeholder = preset.content;
}

function setPreset(presetId) {
  playback.presetId = presetId;
  presetSelect.value = presetId;
  refreshInspector();
}

function populatePresetSelect() {
  PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.append(option);
  });
}

function toggleRunning() {
  playback.running = !playback.running;

  if (playback.running) {
    const now = performance.now();
    const pausedDuration = now - playback.pauseStamp;
    playback.startStamp += pausedDuration;
  }

  togglePlayback.textContent = playback.running ? "Pause" : "Resume";
  statusBadge.textContent = playback.running ? "Running" : "Paused";
}

function resetTime() {
  const now = performance.now();
  playback.startStamp = now;
  playback.pauseStamp = now;
}

presetSelect.addEventListener("change", (event) => {
  setPreset(event.target.value);
  resetTime();
});

speedRange.addEventListener("input", (event) => {
  playback.speed = Number(event.target.value);
});

togglePlayback.addEventListener("click", toggleRunning);
resetPlayback.addEventListener("click", resetTime);
window.addEventListener("resize", setCanvasSize);

populatePresetSelect();
setPreset(playback.presetId);
setCanvasSize();
requestAnimationFrame(animationLoop);
