import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateBehaviorTextAt } from "../dsl-runtime.js";

const outDir = join(process.cwd(), "artifacts");
mkdirSync(outDir, { recursive: true });

const BASE_VECTOR = {
  openness: 0.65,
  squint: 0.12,
  smile: 0.12,
  roundness: 0.22,
  slant: 0.0,
  asymmetry: 0.0,
  spacing: 0.46,
  gaze_x: 0.0,
  gaze_y: -0.02,
  glow: 1.0,
  warmth: 0.3,
};

const AXIS_SPECS = {
  openness: { values: [0.15, 0.35, 0.55, 0.75, 0.95], step: 0.08, range: [0, 1] },
  squint: { values: [0.0, 0.15, 0.35, 0.55, 0.75], step: 0.08, range: [0, 1] },
  smile: { values: [0.0, 0.2, 0.4, 0.7, 0.95], step: 0.08, range: [0, 1] },
  roundness: { values: [0.0, 0.2, 0.4, 0.7, 1.0], step: 0.08, range: [0, 1] },
  slant: { values: [-1.0, -0.5, 0.0, 0.5, 1.0], step: 0.08, range: [-1, 1] },
  asymmetry: { values: [-0.5, -0.25, 0.0, 0.25, 0.5], step: 0.05, range: [-1, 1] },
  spacing: { values: [0.2, 0.35, 0.5, 0.7, 0.95], step: 0.06, range: [0.2, 1] },
  gaze_x: { values: [-1.0, -0.5, 0.0, 0.5, 1.0], step: 0.1, range: [-1, 1] },
  gaze_y: { values: [-1.0, -0.5, 0.0, 0.5, 1.0], step: 0.1, range: [-1, 1] },
  glow: { values: [0.0, 0.5, 1.0, 1.5, 2.0], step: 0.1, range: [0, 2] },
  warmth: { values: [0.0, 0.25, 0.5, 0.75, 1.0], step: 0.1, range: [0, 1] },
};

const INTERACTION_PAIRS = [
  ["smile", "squint"],
  ["smile", "roundness"],
  ["smile", "openness"],
  ["smile", "slant"],
  ["squint", "openness"],
];

const EXTREME_SMILE_VECTOR = {
  ...BASE_VECTOR,
  smile: 0.88,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function buildCompactDsl(vector) {
  return `face:
  mode: compact
  openness: ${vector.openness}
  squint: ${vector.squint}
  smile: ${vector.smile}
  roundness: ${vector.roundness}
  slant: ${vector.slant}
  asymmetry: ${vector.asymmetry}
  spacing: ${vector.spacing}
  gaze: [${vector.gaze_x}, ${vector.gaze_y}]
  glow: ${vector.glow}
  warmth: ${vector.warmth}`;
}

function evaluateVector(vector) {
  const dsl = buildCompactDsl(vector);
  const { face } = evaluateBehaviorTextAt(dsl, { time: 0 });
  return {
    vector: structuredClone(vector),
    face,
    metrics: analyzeFace(face),
  };
}

function analyzeEye(eye, side) {
  const samples = [];
  const count = 81;

  for (let index = 0; index < count; index += 1) {
    const x = -0.94 + (1.88 * index) / (count - 1);
    const innerMix = smoothstep(-0.72, 0.72, x * (-side));
    let upperClosure = mix(eye.upperOuter, eye.upperInner, innerMix);
    let lowerClosure = mix(eye.lowerOuter, eye.lowerInner, innerMix);
    const meanUpperClosure = 0.5 * (eye.upperInner + eye.upperOuter);
    const meanLowerClosure = 0.5 * (eye.lowerInner + eye.lowerOuter);
    const smileCarrier = clamp((meanLowerClosure - meanUpperClosure * 0.16 - 0.02) * 2.6, 0, 1);
    const smileBlend = smoothstep(0.18, 0.56, smileCarrier);
    upperClosure = mix(upperClosure, meanUpperClosure, smileBlend * 0.68);
    lowerClosure = mix(lowerClosure, meanLowerClosure, smileBlend * 0.68);
    const localSmileSignal = lowerClosure - upperClosure * 0.22 + (1.0 - Math.abs(x)) * 0.04;
    const globalSmileSignal = meanLowerClosure - meanUpperClosure * 0.18 + (1.0 - Math.abs(x)) * 0.055;
    const smileSignal = mix(localSmileSignal, globalSmileSignal, smileBlend * 0.72);
    const smileBias = Math.max(smoothstep(0.26, 0.48, smileSignal), smileBlend * 0.52);
    const browTilt = eye.tilt * x * 0.42;

    let topArc = mix(1.26, -0.84, upperClosure) + Math.pow(Math.abs(x), 1.85) * 0.08 + browTilt;
    let bottomArc = mix(-1.24, 0.82, lowerClosure) - Math.pow(Math.abs(x), 1.85) * 0.06 + browTilt * 0.18;

    const smileCurve = 0.16 - Math.pow(Math.abs(x), 0.95) * 0.30 + browTilt * 0.016;
    const smileThickness = mix(0.205, 0.145, smileBias) * Math.pow(1.0 - smoothstep(0.28, 0.92, Math.abs(x)), 1.35);
    const smileTop = smileCurve + smileThickness * 0.88;
    const smileBottom = smileCurve - smileThickness * 0.42 - smileBias * 0.008;

    topArc = mix(topArc, smileTop, smileBias);
    bottomArc = mix(bottomArc, smileBottom, smileBias);

    const thickness = Math.max(0, topArc - bottomArc);
    const centerline = (topArc + bottomArc) * 0.5;

    samples.push({
      x,
      upperClosure,
      lowerClosure,
      smileBias,
      thickness,
      centerline,
    });
  }

  const centerSample = samples[Math.floor(samples.length / 2)];
  const edgeSamples = samples.filter((sample) => Math.abs(sample.x) >= 0.7 && Math.abs(sample.x) <= 0.9);
  const innerSide = samples.filter((sample) => sample.x < -0.15);
  const outerSide = samples.filter((sample) => sample.x > 0.15);
  const dx = 1.88 / (count - 1);

  const areaApprox = samples.reduce((sum, sample) => sum + sample.thickness * dx, 0);
  const meanThickness = average(samples.map((sample) => sample.thickness));
  const edgeThickness = average(edgeSamples.map((sample) => sample.thickness));
  const meanUpperClosure = average(samples.map((sample) => sample.upperClosure));
  const meanLowerClosure = average(samples.map((sample) => sample.lowerClosure));
  const meanSmileBias = average(samples.map((sample) => sample.smileBias));
  const meanCenterline = average(samples.map((sample) => sample.centerline));
  const innerThickness = average(innerSide.map((sample) => sample.thickness));
  const outerThickness = average(outerSide.map((sample) => sample.thickness));
  const innerCenterline = average(innerSide.map((sample) => sample.centerline));
  const outerCenterline = average(outerSide.map((sample) => sample.centerline));

  return {
    areaApprox,
    meanThickness,
    centerThickness: centerSample.thickness,
    edgeThickness,
    taperRatio: centerSample.thickness > 0 ? edgeThickness / centerSample.thickness : 0,
    meanUpperClosure,
    meanLowerClosure,
    lowerDominance: meanLowerClosure - meanUpperClosure,
    meanSmileBias,
    meanCenterline,
    intraThicknessAsymmetry: Math.abs(innerThickness - outerThickness),
    intraCenterlineAsymmetry: Math.abs(innerCenterline - outerCenterline),
  };
}

function analyzeFace(face) {
  const left = analyzeEye(face.left, -1);
  const right = analyzeEye(face.right, 1);

  return {
    areaApprox: average([left.areaApprox, right.areaApprox]),
    meanThickness: average([left.meanThickness, right.meanThickness]),
    centerThickness: average([left.centerThickness, right.centerThickness]),
    edgeThickness: average([left.edgeThickness, right.edgeThickness]),
    taperRatio: average([left.taperRatio, right.taperRatio]),
    meanUpperClosure: average([left.meanUpperClosure, right.meanUpperClosure]),
    meanLowerClosure: average([left.meanLowerClosure, right.meanLowerClosure]),
    lowerDominance: average([left.lowerDominance, right.lowerDominance]),
    meanSmileBias: average([left.meanSmileBias, right.meanSmileBias]),
    meanCenterline: average([left.meanCenterline, right.meanCenterline]),
    intraThicknessAsymmetry: average([left.intraThicknessAsymmetry, right.intraThicknessAsymmetry]),
    intraCenterlineAsymmetry: average([left.intraCenterlineAsymmetry, right.intraCenterlineAsymmetry]),
    interEyeAreaDiff: Math.abs(left.areaApprox - right.areaApprox),
    interEyeThicknessDiff: Math.abs(left.meanThickness - right.meanThickness),
    interEyeCenterlineDiff: Math.abs(left.meanCenterline - right.meanCenterline),
    interEyeLowerDominanceDiff: Math.abs(left.lowerDominance - right.lowerDominance),
    signedInterEyeArea: left.areaApprox - right.areaApprox,
    signedInterEyeThickness: left.meanThickness - right.meanThickness,
    signedInterEyeCenterline: left.meanCenterline - right.meanCenterline,
    signedInterEyeLowerDominance: left.lowerDominance - right.lowerDominance,
  };
}

function metricSubset(result) {
  const { metrics } = result;
  return {
    areaApprox: round(metrics.areaApprox),
    meanThickness: round(metrics.meanThickness),
    centerThickness: round(metrics.centerThickness),
    edgeThickness: round(metrics.edgeThickness),
    taperRatio: round(metrics.taperRatio),
    lowerDominance: round(metrics.lowerDominance),
    meanSmileBias: round(metrics.meanSmileBias),
    meanCenterline: round(metrics.meanCenterline),
    intraThicknessAsymmetry: round(metrics.intraThicknessAsymmetry),
    interEyeAreaDiff: round(metrics.interEyeAreaDiff),
    interEyeThicknessDiff: round(metrics.interEyeThicknessDiff),
    interEyeCenterlineDiff: round(metrics.interEyeCenterlineDiff),
    interEyeLowerDominanceDiff: round(metrics.interEyeLowerDominanceDiff),
    signedInterEyeArea: round(metrics.signedInterEyeArea),
    signedInterEyeThickness: round(metrics.signedInterEyeThickness),
    signedInterEyeCenterline: round(metrics.signedInterEyeCenterline),
    signedInterEyeLowerDominance: round(metrics.signedInterEyeLowerDominance),
  };
}

function lowLevelSubset(result) {
  const { face } = result;
  return {
    left: {
      lidTop: round(face.left.lidTop),
      lidBottom: round(face.left.lidBottom),
      upperInner: round(face.left.upperInner),
      upperOuter: round(face.left.upperOuter),
      lowerInner: round(face.left.lowerInner),
      lowerOuter: round(face.left.lowerOuter),
      tilt: round(face.left.tilt),
      width: round(face.left.width),
    },
    right: {
      lidTop: round(face.right.lidTop),
      lidBottom: round(face.right.lidBottom),
      upperInner: round(face.right.upperInner),
      upperOuter: round(face.right.upperOuter),
      lowerInner: round(face.right.lowerInner),
      lowerOuter: round(face.right.lowerOuter),
      tilt: round(face.right.tilt),
      width: round(face.right.width),
    },
    spacing: round(face.spacing),
    gaze: face.gaze.map((value) => round(value)),
    glow: round(face.glow),
    warmth: round(face.warmth),
  };
}

function withAxis(vector, axis, value) {
  return { ...vector, [axis]: value };
}

function centralDifference(axis, metricName) {
  return centralDifferenceAt(BASE_VECTOR, axis, metricName);
}

function centralDifferenceAt(anchorVector, axis, metricName) {
  const spec = AXIS_SPECS[axis];
  const epsilon = spec.step;
  const [min, max] = spec.range;
  const plus = withAxis(anchorVector, axis, clamp(anchorVector[axis] + epsilon, min, max));
  const minus = withAxis(anchorVector, axis, clamp(anchorVector[axis] - epsilon, min, max));
  const plusResult = evaluateVector(plus);
  const minusResult = evaluateVector(minus);

  return {
    metric: round((plusResult.metrics[metricName] - minusResult.metrics[metricName]) / (2 * epsilon)),
    lowLevel: {
      leftLidTop: round((plusResult.face.left.lidTop - minusResult.face.left.lidTop) / (2 * epsilon)),
      leftLidBottom: round((plusResult.face.left.lidBottom - minusResult.face.left.lidBottom) / (2 * epsilon)),
      leftWidth: round((plusResult.face.left.width - minusResult.face.left.width) / (2 * epsilon)),
    },
  };
}

function interactionMetric(axisA, axisB, metricName) {
  const specA = AXIS_SPECS[axisA];
  const specB = AXIS_SPECS[axisB];
  const da = specA.step;
  const db = specB.step;

  const base = BASE_VECTOR;
  const pp = evaluateVector({
    ...base,
    [axisA]: clamp(base[axisA] + da, specA.range[0], specA.range[1]),
    [axisB]: clamp(base[axisB] + db, specB.range[0], specB.range[1]),
  });
  const pm = evaluateVector({
    ...base,
    [axisA]: clamp(base[axisA] + da, specA.range[0], specA.range[1]),
    [axisB]: clamp(base[axisB] - db, specB.range[0], specB.range[1]),
  });
  const mp = evaluateVector({
    ...base,
    [axisA]: clamp(base[axisA] - da, specA.range[0], specA.range[1]),
    [axisB]: clamp(base[axisB] + db, specB.range[0], specB.range[1]),
  });
  const mm = evaluateVector({
    ...base,
    [axisA]: clamp(base[axisA] - da, specA.range[0], specA.range[1]),
    [axisB]: clamp(base[axisB] - db, specB.range[0], specB.range[1]),
  });

  return round((pp.metrics[metricName] - pm.metrics[metricName] - mp.metrics[metricName] + mm.metrics[metricName]) / (4 * da * db));
}

function denseSweep(axis, step = 0.02) {
  const spec = AXIS_SPECS[axis];
  const rows = [];

  for (let value = spec.range[0]; value <= spec.range[1] + 1e-9; value += step) {
    const result = evaluateVector(withAxis(BASE_VECTOR, axis, clamp(value, spec.range[0], spec.range[1])));
    rows.push({
      value: round(clamp(value, spec.range[0], spec.range[1]), 3),
      areaApprox: round(result.metrics.areaApprox),
      centerThickness: round(result.metrics.centerThickness),
      taperRatio: round(result.metrics.taperRatio),
      lowerDominance: round(result.metrics.lowerDominance),
      meanSmileBias: round(result.metrics.meanSmileBias),
      interEyeThicknessDiff: round(result.metrics.interEyeThicknessDiff),
    });
  }

  return rows;
}

function summarizeSmileRegime(rows) {
  let steepestCenterThicknessDrop = {
    delta: 0,
    from: rows[0].value,
    to: rows[0].value,
  };

  for (let index = 1; index < rows.length; index += 1) {
    const delta = rows[index].centerThickness - rows[index - 1].centerThickness;
    if (delta < steepestCenterThicknessDrop.delta) {
      steepestCenterThicknessDrop = {
        delta: round(delta),
        from: rows[index - 1].value,
        to: rows[index].value,
      };
    }
  }

  return {
    firstLowerDominantSmile: rows.find((row) => row.lowerDominance > 0)?.value ?? null,
    firstShaderSmileBandActivation: rows.find((row) => row.meanSmileBias > 0.01)?.value ?? null,
    firstHighTaperSmile: rows.find((row) => row.taperRatio > 1.1)?.value ?? null,
    steepestCenterThicknessDrop,
  };
}

function buildAxisClassification() {
  return {
    openness: "primary aperture axis",
    squint: "tension and compression axis",
    smile: "lower-driven narrowing axis with nonlinear extreme regime",
    roundness: "secondary width and softness axis",
    slant: "directional inner-vs-outer redistribution axis",
    asymmetry: "inter-eye balance axis",
    spacing: "layout-only axis",
    gaze_x: "appearance-only gaze axis",
    gaze_y: "appearance-only gaze axis",
    glow: "appearance-only emissive axis",
    warmth: "appearance-only color axis",
  };
}

function renderSweepTable(axis, rows) {
  const lines = [
    `### ${axis}`,
    "",
    "| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.value} | ${row.metrics.areaApprox} | ${row.metrics.centerThickness} | ${row.metrics.taperRatio} | ${row.metrics.lowerDominance} | ${row.metrics.meanSmileBias} | ${row.metrics.intraThicknessAsymmetry} | ${row.metrics.interEyeThicknessDiff} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

function renderDenseSweepTable(rows) {
  const lines = [
    "## Smile Dense Sweep",
    "",
    "| smile | area | centerThick | taper | lowerDom | smileBias | interEyeDiff |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const row of rows) {
    lines.push(
      `| ${row.value} | ${row.areaApprox} | ${row.centerThickness} | ${row.taperRatio} | ${row.lowerDominance} | ${row.meanSmileBias} | ${row.interEyeThicknessDiff} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

const baseline = evaluateVector(BASE_VECTOR);

const axisSweeps = Object.fromEntries(
  Object.entries(AXIS_SPECS).map(([axis, spec]) => [
    axis,
    spec.values.map((value) => {
      const result = evaluateVector(withAxis(BASE_VECTOR, axis, value));
      return {
        value,
        metrics: metricSubset(result),
        lowLevel: lowLevelSubset(result),
      };
    }),
  ]),
);

const sensitivities = Object.fromEntries(
  Object.keys(AXIS_SPECS).map((axis) => [
    axis,
    {
      areaApprox: centralDifference(axis, "areaApprox"),
      meanThickness: centralDifference(axis, "meanThickness"),
      lowerDominance: centralDifference(axis, "lowerDominance"),
      meanSmileBias: centralDifference(axis, "meanSmileBias"),
      intraThicknessAsymmetry: centralDifference(axis, "intraThicknessAsymmetry"),
      signedInterEyeThickness: centralDifference(axis, "signedInterEyeThickness"),
    },
  ]),
);

const interactions = Object.fromEntries(
  INTERACTION_PAIRS.map(([axisA, axisB]) => [
    `${axisA}__${axisB}`,
    {
      areaApprox: interactionMetric(axisA, axisB, "areaApprox"),
      meanThickness: interactionMetric(axisA, axisB, "meanThickness"),
      lowerDominance: interactionMetric(axisA, axisB, "lowerDominance"),
      meanSmileBias: interactionMetric(axisA, axisB, "meanSmileBias"),
      intraThicknessAsymmetry: interactionMetric(axisA, axisB, "intraThicknessAsymmetry"),
      signedInterEyeThickness: interactionMetric(axisA, axisB, "signedInterEyeThickness"),
    },
  ]),
);

const denseSmileSweep = denseSweep("smile");
const smileRegime = summarizeSmileRegime(denseSmileSweep);
const axisClassification = buildAxisClassification();
const extremeSmileAnchor = {
  vector: EXTREME_SMILE_VECTOR,
  metrics: metricSubset(evaluateVector(EXTREME_SMILE_VECTOR)),
  sensitivities: {
    openness: {
      areaApprox: centralDifferenceAt(EXTREME_SMILE_VECTOR, "openness", "areaApprox"),
      centerThickness: centralDifferenceAt(EXTREME_SMILE_VECTOR, "openness", "centerThickness"),
      taperRatio: centralDifferenceAt(EXTREME_SMILE_VECTOR, "openness", "taperRatio"),
      lowerDominance: centralDifferenceAt(EXTREME_SMILE_VECTOR, "openness", "lowerDominance"),
      meanSmileBias: centralDifferenceAt(EXTREME_SMILE_VECTOR, "openness", "meanSmileBias"),
    },
    squint: {
      areaApprox: centralDifferenceAt(EXTREME_SMILE_VECTOR, "squint", "areaApprox"),
      centerThickness: centralDifferenceAt(EXTREME_SMILE_VECTOR, "squint", "centerThickness"),
      taperRatio: centralDifferenceAt(EXTREME_SMILE_VECTOR, "squint", "taperRatio"),
      lowerDominance: centralDifferenceAt(EXTREME_SMILE_VECTOR, "squint", "lowerDominance"),
      meanSmileBias: centralDifferenceAt(EXTREME_SMILE_VECTOR, "squint", "meanSmileBias"),
    },
    roundness: {
      areaApprox: centralDifferenceAt(EXTREME_SMILE_VECTOR, "roundness", "areaApprox"),
      centerThickness: centralDifferenceAt(EXTREME_SMILE_VECTOR, "roundness", "centerThickness"),
      taperRatio: centralDifferenceAt(EXTREME_SMILE_VECTOR, "roundness", "taperRatio"),
      lowerDominance: centralDifferenceAt(EXTREME_SMILE_VECTOR, "roundness", "lowerDominance"),
      meanSmileBias: centralDifferenceAt(EXTREME_SMILE_VECTOR, "roundness", "meanSmileBias"),
    },
  },
};

const report = {
  baseline: {
    vector: BASE_VECTOR,
    metrics: metricSubset(baseline),
    lowLevel: lowLevelSubset(baseline),
  },
  axisSweeps,
  sensitivities,
  interactions,
  denseSmileSweep,
  smileRegime,
  axisClassification,
  extremeSmileAnchor,
};

writeFileSync(join(outDir, "compact-axis-analysis.json"), JSON.stringify(report, null, 2));

const markdown = [
  "# Compact Axis Analysis",
  "",
  "This document decomposes the current compact face coordinate system into measurable geometric effects.",
  "",
  "Method:",
  "- Hold one baseline compact vector fixed and sweep one axis at a time.",
  "- Evaluate the pure compact DSL with no blink and no autonomous overlay.",
  "- Recompute the shader eye-boundary equations in JavaScript and measure silhouette metrics from the resulting eye band.",
  "",
  "Key metrics:",
  "- `areaApprox`: integrated eye-band area.",
  "- `centerThickness`: band thickness at the center sample.",
  "- `taperRatio`: edge thickness divided by center thickness.",
  "- `lowerDominance`: mean lower closure minus mean upper closure.",
  "- `meanSmileBias`: average shader smile-band activation.",
  "- `intraThicknessAsymmetry`: inner-vs-outer thickness imbalance inside one eye.",
  "- `interEyeThicknessDiff`: left-vs-right thickness difference between eyes.",
  "",
  "## Axis Classification",
  "",
  "| axis | role |",
  "| --- | --- |",
  ...Object.entries(axisClassification).map(([axis, role]) => `| ${axis} | ${role} |`),
  "",
  "## Key Findings",
  "",
  `- Baseline compact state is not in the smile-band regime. Baseline lower dominance is ${report.baseline.metrics.lowerDominance} and mean smile bias is ${report.baseline.metrics.meanSmileBias}.`,
  `- \`openness\` is the dominant aperture axis. Around the baseline, d(area)/d(openness) = ${sensitivities.openness.areaApprox.metric}, mostly through upper-lid release (${sensitivities.openness.areaApprox.lowLevel.leftLidTop}) with only weak lower-lid change (${sensitivities.openness.areaApprox.lowLevel.leftLidBottom}).`,
  `- \`squint\` is a tension axis. It narrows the eye with d(area)/d(squint) = ${sensitivities.squint.areaApprox.metric}, pushes the upper lid strongly (${sensitivities.squint.areaApprox.lowLevel.leftLidTop}), pushes the lower lid less (${sensitivities.squint.areaApprox.lowLevel.leftLidBottom}), and reduces width (${sensitivities.squint.areaApprox.lowLevel.leftWidth}).`,
  `- \`smile\` is locally lower-driven, not upper-driven. Around the baseline, d(lowerDominance)/d(smile) = ${sensitivities.smile.lowerDominance.metric}, d(lidBottom)/d(smile) = ${sensitivities.smile.areaApprox.lowLevel.leftLidBottom}, and d(lidTop)/d(smile) = ${sensitivities.smile.areaApprox.lowLevel.leftLidTop}.`,
  "- The smile failure is not a local cross-term problem near the baseline. All measured local pairwise interactions at the baseline are zero, so the instability is dominated by a nonlinear regime change rather than by first-order coupling.",
  `- The nonlinear smile regime starts late. First lower-dominant smile occurs at ${smileRegime.firstLowerDominantSmile}, first visible shader smile-band activation occurs at ${smileRegime.firstShaderSmileBandActivation}, and taper exceeds 1.1 at ${smileRegime.firstHighTaperSmile}.`,
  `- The steepest smile collapse occurs between smile=${smileRegime.steepestCenterThicknessDrop.from} and smile=${smileRegime.steepestCenterThicknessDrop.to}, where center thickness changes by ${smileRegime.steepestCenterThicknessDrop.delta} per dense sweep step. This is the strongest candidate for the awkward grin-to-frown transition.`,
  `- Inside the extreme-smile regime at smile=${EXTREME_SMILE_VECTOR.smile}, \`openness\` is the only clean recovery axis: d(centerThickness)/d(openness) = ${extremeSmileAnchor.sensitivities.openness.centerThickness.metric}. By contrast, d(centerThickness)/d(squint) = ${extremeSmileAnchor.sensitivities.squint.centerThickness.metric} and d(centerThickness)/d(roundness) = ${extremeSmileAnchor.sensitivities.roundness.centerThickness.metric}.`,
  `- Inside the same regime, \`roundness\` stops behaving like a harmless softness control. It now increases smile-band activation with d(meanSmileBias)/d(roundness) = ${extremeSmileAnchor.sensitivities.roundness.meanSmileBias.metric} and increases taper with d(taperRatio)/d(roundness) = ${extremeSmileAnchor.sensitivities.roundness.taperRatio.metric}.`,
  `- \`roundness\` is underpowered as a silhouette axis. It mostly changes width (${sensitivities.roundness.areaApprox.lowLevel.leftWidth}) but only weakly changes area (${sensitivities.roundness.areaApprox.metric}).`,
  `- \`slant\` is mostly a redistribution axis. Near the baseline it barely changes area (${sensitivities.slant.areaApprox.metric}) but strongly changes inner-vs-outer imbalance (${sensitivities.slant.intraThicknessAsymmetry.metric}).`,
  `- \`asymmetry\` is not dead. Its average shape metrics stay flat, but its signed inter-eye sensitivity is d(signedInterEyeThickness)/d(asymmetry) = ${sensitivities.asymmetry.signedInterEyeThickness.metric}. This axis must be judged with signed inter-eye metrics, not single-eye averages.`,
  "",
  renderDenseSweepTable(denseSmileSweep),
  "## Extreme Smile Anchor",
  "",
  "```json",
  JSON.stringify(extremeSmileAnchor, null, 2),
  "```",
  "",
  "## Baseline",
  "",
  "```json",
  JSON.stringify(report.baseline, null, 2),
  "```",
  "",
  "## Axis Sweeps",
  "",
  ...Object.entries(axisSweeps).flatMap(([axis, rows]) => [renderSweepTable(axis, rows)]),
  "## Local Sensitivities",
  "",
  "```json",
  JSON.stringify(sensitivities, null, 2),
  "```",
  "",
  "## Pairwise Interactions",
  "",
  "```json",
  JSON.stringify(interactions, null, 2),
  "```",
  "",
].join("\n");

writeFileSync(join(process.cwd(), "FACE_COORDINATE_ANALYSIS.md"), markdown);

console.log("Wrote artifacts/compact-axis-analysis.json");
console.log("Wrote FACE_COORDINATE_ANALYSIS.md");
