import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const outDir = join(process.cwd(), "artifacts", "smile-sweep");
mkdirSync(outDir, { recursive: true });

const BASE_VECTOR = {
  openness: 0.65,
  squint: 0.12,
  roundness: 0.22,
  slant: 0.0,
  asymmetry: 0.0,
  spacing: 0.46,
  gaze_x: 0.0,
  gaze_y: -0.02,
  glow: 1.0,
  warmth: 0.3,
};

const SMILE_VALUES = [0.0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.82, 0.88, 0.94];

function buildHappyPathVector(progress) {
  return {
    ...BASE_VECTOR,
    openness: 0.74 - 0.18 * Math.pow(progress, 1.08),
    squint: 0.06 + 0.035 * Math.pow(progress, 1.2),
    smile: 0.06 + 0.86 * progress,
    roundness: 0.17 + 0.09 * progress * (1.0 - 0.45 * progress),
    gaze_y: -0.02 - 0.02 * progress,
    glow: 0.95 + 0.12 * progress,
    warmth: 0.28 + 0.24 * progress,
  };
}

const HAPPY_PATH_VALUES = [0.0, 0.12, 0.24, 0.38, 0.52, 0.66, 0.78, 0.9, 1.0];

function buildDsl(vector) {
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

function buildSweepCards(frames) {
  return frames.map((frame) => {
    return `<figure class="card"><img src="./${frame.filename}" alt="${frame.caption}" /><figcaption>${frame.caption}</figcaption></figure>`;
  }).join("\n");
}

function buildSweepPage(axisFrames, pathFrames) {
  const axisCards = buildSweepCards(axisFrames);
  const pathCards = buildSweepCards(pathFrames);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Smile Sweep</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #070707;
        --panel: #101010;
        --line: #222;
        --text: #f3f3f3;
        --muted: #9a9a9a;
      }
      body {
        margin: 0;
        padding: 24px;
        background: radial-gradient(circle at top, #121212, var(--bg) 58%);
        color: var(--text);
        font: 14px/1.4 Consolas, "SFMono-Regular", monospace;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 18px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 15px;
      }
      p {
        margin: 0 0 20px;
        color: var(--muted);
      }
      section {
        margin-bottom: 28px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .card {
        margin: 0;
        border: 1px solid var(--line);
        background: linear-gradient(180deg, #121212, var(--panel));
        padding: 10px;
      }
      img {
        width: 100%;
        display: block;
        background: #000;
      }
      figcaption {
        margin-top: 8px;
        color: var(--muted);
        text-align: center;
      }
    </style>
  </head>
  <body>
    <h1>Smile Sweep</h1>
    <section>
      <h2>Raw smile axis</h2>
      <p>Only <code>smile</code> changes. Everything else stays fixed at the baseline vector.</p>
      <div class="grid">
        ${axisCards}
      </div>
    </section>
    <section>
      <h2>Happy path through compact space</h2>
      <p><code>smile</code>, <code>openness</code>, <code>roundness</code>, <code>warmth</code>, and a small amount of <code>squint</code> move together along one trajectory.</p>
      <div class="grid">
        ${pathCards}
      </div>
    </section>
  </body>
</html>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 520, height: 360 }, deviceScaleFactor: 2 });

await page.goto("http://127.0.0.1:4173/?panel=0&preset=IDLE", { waitUntil: "networkidle" });
await page.waitForTimeout(250);

const axisFrames = [];
for (const value of SMILE_VALUES) {
  const filename = `axis-smile-${value.toFixed(2).replace(".", "_")}.png`;
  const dsl = buildDsl({ ...BASE_VECTOR, smile: value });
  const params = new URLSearchParams({
    panel: "0",
    dsl,
  });
  await page.goto(`http://127.0.0.1:4173/?${params.toString()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  await page.locator("#eve-canvas").screenshot({
    path: join(outDir, filename),
  });
  axisFrames.push({ filename, caption: `smile=${value.toFixed(2)}` });
}

const pathFrames = [];
for (const value of HAPPY_PATH_VALUES) {
  const filename = `path-smile-${value.toFixed(2).replace(".", "_")}.png`;
  const dsl = buildDsl(buildHappyPathVector(value));
  const params = new URLSearchParams({
    panel: "0",
    dsl,
  });
  await page.goto(`http://127.0.0.1:4173/?${params.toString()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(150);
  await page.locator("#eve-canvas").screenshot({
    path: join(outDir, filename),
  });
  pathFrames.push({ filename, caption: `progress=${value.toFixed(2)}` });
}

writeFileSync(join(outDir, "index.html"), buildSweepPage(axisFrames, pathFrames));

await page.setViewportSize({ width: 1240, height: 1180 });
await page.goto("http://127.0.0.1:4173/artifacts/smile-sweep/index.html", { waitUntil: "networkidle" });
await page.locator("img").first().waitFor({ state: "visible" });
await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
await page.screenshot({ path: join(process.cwd(), "artifacts", "smile-sweep-strip.png"), fullPage: true });

await browser.close();
console.log("Wrote smile sweep images and strip.");
