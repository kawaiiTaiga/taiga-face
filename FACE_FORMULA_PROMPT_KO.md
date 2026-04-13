# EVE-Lite Face Formula Prompt (KO)

아래 프롬프트 블록을 다른 모델에 그대로 넣고, 마지막 `사용자 요청`만 바꿔서 쓰면 된다.

```text
You are generating behavior DSL for EVE-Lite, a stylized robot-eye renderer.

Output only YAML.
Do not explain.
Do not output Markdown fences.
Do not output multiple options.

This system is not keyframe animation.
Each numeric field may be a formula that is evaluated every frame.
The runtime already has a living idle face.
If the requested expression is a temporary reaction, use `behavior.kind: transient` so it rises, holds, and returns to idle automatically.

Prefer `face.mode: compact` unless there is a strong reason not to.

Compact coordinate system:
- `openness`: how open the eyes feel. Higher = more open, alert, innocent.
- `squint`: compression/tightening. Higher = narrower and more intense.
- `smile`: lower-lid warmth. Higher = warmer, happier, more affectionate.
- `roundness`: makes the silhouette rounder and softer.
- `slant`: negative = sharper / more intense, positive = softer / sadder.
- `asymmetry`: left/right difference. Keep subtle unless the intent is skeptical, curious, or wry.
- `spacing`: optional eye spacing.
- `gaze`: `[x, y]` in `[-1, 1]`.
- `glow`: brightness.
- `warmth`: color temperature / emotional warmth.

Important visual semantics:
- Do not think in terms of human-readable emotion words only. Think in terms of shape coordinates.
- The renderer already handles most expressions well.
- The difficult case is smiling.
- A strong smile is not a sharp `^^` caret. It is closer to two rounded parentheses rotated 90 degrees, like soft crescent bands.
- Normal `HAPPY` should stay in a softer range. It should not look like a sneer, joker grin, or extreme crescent smile.
- Very high `smile` values create the rounded crescent-band regime. Use that only when the request is explicitly a very strong smile or closed-eye smile.
- Avoid the “joker” look:
  - do not combine high `smile` with strong negative `slant`
  - do not combine high `smile` with high `squint` unless the request is an extreme closed-eye smile
  - keep `asymmetry` very small for warm happy expressions
- For ordinary warm happy expressions, prefer:
  - medium `smile`
  - low `squint`
  - medium-high `openness`
  - mild `roundness`
  - near-zero `slant`
- For strong crescent smiles, prefer:
  - high `smile`
  - low or moderate `squint`
  - lower `openness`
  - moderate `roundness`
  - near-zero `slant`
  - near-zero `asymmetry`

Useful safe ranges:
- `openness`: usually `0.45 .. 0.95`
- `squint`: usually `0.0 .. 0.20`, stronger only if intentional
- `smile`: usually `0.10 .. 0.65`, use `0.80+` only for strong crescent smiles
- `roundness`: usually `0.12 .. 0.35`
- `slant`: usually `-0.06 .. 0.06`
- `asymmetry`: usually `-0.03 .. 0.03`
- `glow`: usually `0.8 .. 1.1`
- `warmth`: usually `0.25 .. 0.65`

Available expression symbols:
- Global time: `time`
- Local time since this transient started: `local_time`
- Math: `sin`, `cos`, `abs`, `pow`, `min`, `max`, `clamp`, `mix`, `smoothstep`, `floor`, `ceil`, `round`, `fract`, `exp`, `PI`
- Motion helpers: `breathe(a, speed)`, `pulse(a, speed)`, `drift(a, speed)`, `twitch(chance, amplitude)`
- Input response: `react(input, gain, decay)`
- Transient helpers:
  - `env(attack, hold, release)`
  - `decay(rate)`
  - `progress(duration)`

Behavior rules:
- If the request is a temporary reaction, include:
  - `behavior.kind: transient`
  - `attack`
  - `hold`
  - `release`
  - optional `duration_scale`
- If the request is a stable ongoing face, omit `behavior` and output only `face:`.
- Favor one strong idea plus one small follow-through.
- Keep formulas stable and visually readable.
- Do not generate frame-by-frame sequences.
- Do not generate prose, rationale, or comments.

Good patterns:
- Warm happy:
  - `smile` carries the emotion
  - `squint` stays modest
  - `slant` stays near zero
- Surprise:
  - raise `openness`
  - raise `roundness`
  - keep `smile` low
- Skeptical / curious:
  - use asymmetry and gaze bias
  - avoid high warmth unless explicitly requested

Output shape:
- Return one YAML object only.
- Prefer this format for temporary reactions:

behavior:
  kind: transient
  attack: 0.10
  hold: 0.35
  release: 1.10
face:
  mode: compact
  openness: ...
  squint: ...
  smile: ...
  roundness: ...
  slant: ...
  asymmetry: ...
  gaze: [ ..., ... ]
  glow: ...
  warmth: ...

User request:
{{사용자 요청을 여기에 넣어라}}
```

권장 사용법:

- 임시 반응이 필요하면 `사용자 요청`에 `temporary reaction` 또는 `returns to idle`를 명시한다.
- 일반 happy를 원하면 `soft happy`, `warm happy`, `not an extreme crescent smile`, `not joker-like`를 같이 넣는다.
- 강한 눈웃음을 원하면 `strong crescent smile`, `rounded parenthesis-like closed-eye smile`를 같이 넣는다.
