const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_glitch;

uniform float u_left_lid_top;
uniform float u_left_lid_bottom;
uniform float u_left_upper_inner;
uniform float u_left_upper_outer;
uniform float u_left_lower_inner;
uniform float u_left_lower_outer;
uniform float u_left_tilt;
uniform float u_left_width;
uniform float u_right_lid_top;
uniform float u_right_lid_bottom;
uniform float u_right_upper_inner;
uniform float u_right_upper_outer;
uniform float u_right_lower_inner;
uniform float u_right_lower_outer;
uniform float u_right_tilt;
uniform float u_right_width;

uniform float u_spacing;
uniform vec2 u_gaze;
uniform float u_glow;
uniform float u_warmth;

struct EyeRender {
  float mask;
  float glow;
  float fill;
  float core;
};

mat2 rot(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec3 evePalette(float warmth) {
  return vec3(1.0);
}

EyeRender renderEye(
  vec2 uv,
  float eyeCenterX,
  float side,
  float lidTop,
  float lidBottom,
  float upperInner,
  float upperOuter,
  float lowerInner,
  float lowerOuter,
  float tilt,
  float width,
  vec2 gaze
) {
  vec2 p = uv - vec2(side * eyeCenterX, 0.0);
  p = rot(-tilt * 0.52) * p;

  float rw = 0.104 * width;
  float rh = 0.068;
  vec2 q = p / vec2(rw, rh);
  q.y *= 1.0 - 0.06 * smoothstep(0.0, 1.0, abs(q.x));
  q.x *= 1.0 + 0.02 * smoothstep(0.0, 1.0, abs(q.y));

  float eDist = length(q) - 1.0;

  float gazeX = gaze.x * 0.20 - side * 0.08;
  float gazeY = gaze.y * 0.09 - 0.015;
  vec2 gazeOffset = vec2(gazeX, gazeY);

  float innerMix = smoothstep(-0.72, 0.72, q.x * (-side));
  float upperClosure = mix(clamp(upperOuter, 0.0, 1.0), clamp(upperInner, 0.0, 1.0), innerMix);
  float lowerClosure = mix(clamp(lowerOuter, 0.0, 1.0), clamp(lowerInner, 0.0, 1.0), innerMix);
  float meanUpperClosure = 0.5 * (clamp(upperInner, 0.0, 1.0) + clamp(upperOuter, 0.0, 1.0));
  float meanLowerClosure = 0.5 * (clamp(lowerInner, 0.0, 1.0) + clamp(lowerOuter, 0.0, 1.0));
  float smileCarrier = clamp((meanLowerClosure - meanUpperClosure * 0.16 - 0.02) * 2.6, 0.0, 1.0);
  float smileBlend = smoothstep(0.18, 0.56, smileCarrier);
  upperClosure = mix(upperClosure, meanUpperClosure, smileBlend * 0.68);
  lowerClosure = mix(lowerClosure, meanLowerClosure, smileBlend * 0.68);
  float localSmileSignal = lowerClosure - upperClosure * 0.22 + (1.0 - abs(q.x)) * 0.04;
  float globalSmileSignal = meanLowerClosure - meanUpperClosure * 0.18 + (1.0 - abs(q.x)) * 0.055;
  float smileSignal = mix(localSmileSignal, globalSmileSignal, smileBlend * 0.72);
  float smileBias = max(smoothstep(0.26, 0.48, smileSignal), smileBlend * 0.52);

  float browTilt = tilt * q.x * 0.42;
  float topArc = mix(1.26, -0.84, upperClosure)
    + pow(abs(q.x), 1.85) * 0.08
    + browTilt;
  float bottomArc = mix(-1.24, 0.82, lowerClosure)
    - pow(abs(q.x), 1.85) * 0.06
    + browTilt * 0.18;
  float smileSpan = mix(1.0, 0.82, smileBias);
  float smileX = q.x / smileSpan;
  float x2 = smileX * smileX;
  float smileCore = max(0.0, 1.0 - x2);
  float smileCap = pow(smileCore, 0.72);
  float smileBelly = pow(smileCore, 1.24);
  float smileCurve = 0.046
    + smileCap * 0.062
    - x2 * 0.084
    - x2 * x2 * 0.115
    + browTilt * 0.010;
  float smileThickness = mix(0.166, 0.108, smileBias) * (0.16 + smileBelly * 0.84);
  float smileTop = smileCurve + smileThickness * 0.84 + smileCap * 0.004;
  float smileBottom = smileCurve - smileThickness * 0.58 - smileBias * 0.014 - smileBelly * 0.006;
  topArc = mix(topArc, smileTop, smileBias);
  bottomArc = mix(bottomArc, smileBottom, smileBias);

  float topMask = 1.0 - smoothstep(topArc - 0.045, topArc + 0.045, q.y);
  float bottomMask = smoothstep(bottomArc - 0.045, bottomArc + 0.045, q.y);
  float lidMask = topMask * bottomMask;

  float baseShape = 1.0 - smoothstep(-0.04, 0.04, eDist);
  float baseVisibleMask = baseShape * lidMask;
  float baseInterior = smoothstep(0.018, -0.040, eDist) * lidMask;
  float baseEdgeBand = smoothstep(0.024, -0.004, eDist) - smoothstep(-0.010, -0.050, eDist);

  float smileBandDist = abs(q.y - smileCurve) - smileThickness;
  float smileDomain = 1.0 - smoothstep(0.94, 1.04, abs(smileX));
  float smileMask = (1.0 - smoothstep(-0.004, 0.020, smileBandDist)) * smileDomain;
  float smileInterior = smoothstep(0.010, -0.018, smileBandDist) * smileDomain;
  float smileEdgeBand = smoothstep(0.014, 0.000, smileBandDist) - smoothstep(-0.004, -0.022, smileBandDist);
  float smileShapeBlend = smoothstep(0.5, 0.84, smileBias);

  float shape = mix(baseShape, smileMask, smileShapeBlend);
  float visibleMask = mix(baseVisibleMask, smileMask, smileShapeBlend);
  float interior = mix(baseInterior, smileInterior, smileShapeBlend);
  float edgeBand = mix(baseEdgeBand, smileEdgeBand, smileShapeBlend);
  float surfaceDist = mix(eDist, smileBandDist, smileShapeBlend);

  float centerBright = exp(-1.2 * dot(q - gazeOffset, q - gazeOffset));
  float focus = exp(-7.5 * dot((q - gazeOffset * 1.12) * vec2(1.0, 1.35), (q - gazeOffset * 1.12) * vec2(1.0, 1.35)));
  float edgeFade = smoothstep(1.0, 0.26, length(q));
  float rim = exp(-14.0 * abs(surfaceDist));
  float lcdBands = 0.975 + 0.025 * sin((q.y + 1.0) * 34.0);
  float lcdCols = 0.988 + 0.012 * sin((q.x + 1.2) * 28.0);
  float innerBias = 1.0 - smoothstep(0.02, 1.05, abs(q.x + side * 0.24));
  float lowerLift = 1.0 - smoothstep(0.02, 0.82, abs(q.y + 0.26));
  float soulBias = 0.84 + innerBias * 0.10 + lowerLift * 0.10;
  float innerReflect = exp(-120.0 * pow(q.y + 0.18, 2.0)) * exp(-2.5 * pow(q.x + side * 0.10, 2.0));
  float glassEdge = exp(-28.0 * abs(surfaceDist + 0.01)) * mix(lidMask, 1.0, smileShapeBlend);

  float fillField = interior * (0.58 + centerBright * 0.18 + rim * 0.10) * edgeFade * lcdBands * lcdCols * soulBias;
  float coreField = visibleMask * (focus * 0.88 + centerBright * 0.10) * soulBias;
  float outerGlow = exp(-5.2 * max(eDist, 0.0)) * lidMask * (0.14 + centerBright * 0.12);

  EyeRender eye;
  eye.mask = visibleMask;
  eye.glow = outerGlow + glassEdge * 0.05;
  eye.fill = fillField + edgeBand * 0.12 + innerReflect * 0.04 * visibleMask;
  eye.core = coreField + glassEdge * 0.05;
  return eye;
}

vec3 renderScene(vec2 uv) {
  vec3 color = vec3(0.0);

  float spacingT = clamp((u_spacing - 0.2) / 0.8, 0.0, 1.0);
  float eyeCenterX = mix(0.10, 0.18, spacingT);
  vec3 eyeColor = evePalette(u_warmth);

  EyeRender leftEye = renderEye(
    uv,
    eyeCenterX,
    -1.0,
    u_left_lid_top,
    u_left_lid_bottom,
    u_left_upper_inner,
    u_left_upper_outer,
    u_left_lower_inner,
    u_left_lower_outer,
    u_left_tilt,
    u_left_width,
    u_gaze
  );
  EyeRender rightEye = renderEye(
    uv,
    eyeCenterX,
    1.0,
    u_right_lid_top,
    u_right_lid_bottom,
    u_right_upper_inner,
    u_right_upper_outer,
    u_right_lower_inner,
    u_right_lower_outer,
    u_right_tilt,
    u_right_width,
    u_gaze
  );

  float glow = (leftEye.glow + rightEye.glow) * (0.16 + u_glow * 0.22);
  float fill = (leftEye.fill + rightEye.fill) * (0.62 + u_glow * 0.22);
  float core = (leftEye.core + rightEye.core) * (0.38 + u_glow * 0.18);
  float shell = (leftEye.mask + rightEye.mask) * 0.010 * u_glow;
  float eyeInk = max(fill * 0.95 + core * 0.8 + shell * 0.5, max(leftEye.mask, rightEye.mask) * 0.22);
  float bw = step(0.18, eyeInk + glow * 0.02);
  return vec3(bw);
}

void main() {
  vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float split = u_glitch * 0.028;

  vec3 color;
  color.r = renderScene(centered + vec2(split, 0.0)).r;
  color.g = renderScene(centered).g;
  color.b = renderScene(centered - vec2(split, 0.0)).b;

  float glitchBand = step(0.18, 1.0 - smoothstep(0.0, 0.42, abs(fract(centered.y * 3.0 + u_time * 2.6) - 0.5)));
  float bw = step(0.5, max(max(color.r, color.g), color.b) + u_glitch * glitchBand * 0.5);
  outColor = vec4(vec3(bw), 1.0);
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Shader compilation failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Program link failed.");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

export function createRenderer(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
  if (!gl) {
    throw new Error("WebGL2 is required for this demo.");
  }

  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    glitch: gl.getUniformLocation(program, "u_glitch"),
    leftLidTop: gl.getUniformLocation(program, "u_left_lid_top"),
    leftLidBottom: gl.getUniformLocation(program, "u_left_lid_bottom"),
    leftUpperInner: gl.getUniformLocation(program, "u_left_upper_inner"),
    leftUpperOuter: gl.getUniformLocation(program, "u_left_upper_outer"),
    leftLowerInner: gl.getUniformLocation(program, "u_left_lower_inner"),
    leftLowerOuter: gl.getUniformLocation(program, "u_left_lower_outer"),
    leftTilt: gl.getUniformLocation(program, "u_left_tilt"),
    leftWidth: gl.getUniformLocation(program, "u_left_width"),
    rightLidTop: gl.getUniformLocation(program, "u_right_lid_top"),
    rightLidBottom: gl.getUniformLocation(program, "u_right_lid_bottom"),
    rightUpperInner: gl.getUniformLocation(program, "u_right_upper_inner"),
    rightUpperOuter: gl.getUniformLocation(program, "u_right_upper_outer"),
    rightLowerInner: gl.getUniformLocation(program, "u_right_lower_inner"),
    rightLowerOuter: gl.getUniformLocation(program, "u_right_lower_outer"),
    rightTilt: gl.getUniformLocation(program, "u_right_tilt"),
    rightWidth: gl.getUniformLocation(program, "u_right_width"),
    spacing: gl.getUniformLocation(program, "u_spacing"),
    gaze: gl.getUniformLocation(program, "u_gaze"),
    glow: gl.getUniformLocation(program, "u_glow"),
    warmth: gl.getUniformLocation(program, "u_warmth"),
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  return {
    render(face, time, glitch) {
      resize();

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.glitch, glitch);

      gl.uniform1f(uniforms.leftLidTop, face.left.lidTop);
      gl.uniform1f(uniforms.leftLidBottom, face.left.lidBottom);
      gl.uniform1f(uniforms.leftUpperInner, face.left.upperInner);
      gl.uniform1f(uniforms.leftUpperOuter, face.left.upperOuter);
      gl.uniform1f(uniforms.leftLowerInner, face.left.lowerInner);
      gl.uniform1f(uniforms.leftLowerOuter, face.left.lowerOuter);
      gl.uniform1f(uniforms.leftTilt, face.left.tilt);
      gl.uniform1f(uniforms.leftWidth, face.left.width);

      gl.uniform1f(uniforms.rightLidTop, face.right.lidTop);
      gl.uniform1f(uniforms.rightLidBottom, face.right.lidBottom);
      gl.uniform1f(uniforms.rightUpperInner, face.right.upperInner);
      gl.uniform1f(uniforms.rightUpperOuter, face.right.upperOuter);
      gl.uniform1f(uniforms.rightLowerInner, face.right.lowerInner);
      gl.uniform1f(uniforms.rightLowerOuter, face.right.lowerOuter);
      gl.uniform1f(uniforms.rightTilt, face.right.tilt);
      gl.uniform1f(uniforms.rightWidth, face.right.width);

      gl.uniform1f(uniforms.spacing, face.spacing);
      gl.uniform2f(uniforms.gaze, face.gaze[0], face.gaze[1]);
      gl.uniform1f(uniforms.glow, face.glow);
      gl.uniform1f(uniforms.warmth, face.warmth);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
  };
}
