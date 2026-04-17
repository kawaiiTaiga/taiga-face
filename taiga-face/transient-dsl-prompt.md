# Face Transient DSL Prompt

You are generating a temporary facial behavior for a stylized robot-eye renderer.

Output only YAML. Do not explain anything.

Rules:
- Use `behavior.kind: transient`.
- Always include `attack`, `hold`, and `release` in seconds.
- Optional: include `duration_scale` when you want the whole reaction stretched longer or shorter. Values above `1.0` make the full transient last longer.
- The runtime automatically blends this transient over the always-running idle face and then returns to idle after release.
- Write a single temporary reaction, not a storyboard and not multiple sequential shots.
- Keep the face stable and readable. Prefer `face.mode: compact`.
- Use compact channels unless there is a strong reason not to.

Compact channels:
- `openness`: how open the eyes feel. Higher = more open and alert.
- `squint`: upper/lower compression. Higher = narrower, tighter, more intense.
- `smile`: lower-lid warmth. Higher = softer, happier, more affectionate.
- `roundness`: makes the eye silhouette rounder and more childlike/surprised.
- `slant`: negative = sharper / more intense, positive = softer / sadder.
- `asymmetry`: left/right difference. Small values feel alive. Large values feel skeptical or curious.
- `spacing`: optional. Eye spacing.
- `gaze`: `[x, y]`, both in `[-1, 1]`.
- `glow`: optional brightness.
- `warmth`: optional temperature.

Available expression symbols:
- Global time: `time`
- Local time since this transient started: `local_time`
- Math: `sin`, `cos`, `abs`, `pow`, `min`, `max`, `clamp`, `mix`, `smoothstep`, `floor`, `ceil`, `round`, `fract`, `exp`, `PI`
- Motion helpers: `breathe(a, speed)`, `pulse(a, speed)`, `drift(a, speed)`, `twitch(chance, amplitude)`
- Input response: `react(input, gain, decay)`
- Transient helpers:
  - `env(attack, hold, release)` -> attack/hold/release envelope based on `local_time`
  - `decay(rate)` -> `exp(-local_time * rate)`
  - `progress(duration)` -> 0..1 progress over local time

Constraints:
- Use values that remain visually stable.
- Favor one strong idea plus one small follow-through.
- Usually keep `asymmetry` subtle unless the emotion is skeptical/curious/wry.
- For happy/warm reactions, lower-lid energy (`smile`) matters more than just opening the eyes.
- For alert/surprised reactions, `openness` and `roundness` should rise quickly, then settle.
- For suspicious or skeptical reactions, use asymmetry, squint, and a small gaze bias.

Target format:

```yaml
behavior:
  kind: transient
  duration_scale: 1.2
  attack: 0.10
  hold: 0.40
  release: 1.40
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
```
