import { PRESETS, createBehaviorEngine } from "./dsl-runtime.js";
import { createRenderer } from "./renderer.js";

const canvas = document.querySelector("#eve-canvas");
const panel = document.querySelector("#control-panel");
const showPanelButton = document.querySelector("#show-panel");
const togglePanelButton = document.querySelector("#toggle-panel");
const presetGrid = document.querySelector("#preset-grid");
const dslInput = document.querySelector("#dsl-input");
const applyBehaviorButton = document.querySelector("#apply-behavior");
const restoreIdleButton = document.querySelector("#restore-idle");
const parseMessage = document.querySelector("#parse-message");
const runtimeStatus = document.querySelector("#runtime-status");
const liveOutput = document.querySelector("#live-output");
const resetInputsButton = document.querySelector("#reset-inputs");
const promptBlock = document.querySelector("#llm-prompt");
const promptStatus = document.querySelector("#prompt-status");
const copyPromptButton = document.querySelector("#copy-prompt");

const sliderElements = {
  energy: document.querySelector("#energy-input"),
  presence: document.querySelector("#presence-input"),
  arousal: document.querySelector("#arousal-input"),
};

const sliderOutputs = {
  energy: document.querySelector("#energy-output"),
  presence: document.querySelector("#presence-output"),
  arousal: document.querySelector("#arousal-output"),
};

const engine = createBehaviorEngine();
const renderer = createRenderer(canvas);
let canonicalPromptText = "";

function setParseMessage(message, isError = false) {
  parseMessage.textContent = message;
  parseMessage.classList.toggle("error", isError);
}

function setPromptStatus(message, isError = false) {
  promptStatus.textContent = message;
  promptStatus.classList.toggle("error", isError);
}

function setActivePreset(name) {
  for (const button of presetGrid.querySelectorAll(".preset-button")) {
    button.classList.toggle("active", button.dataset.preset === name);
  }
}

function updateRuntimeStatus() {
  const status = engine.getStatus();
  runtimeStatus.textContent = status.error
    ? "Parse Error"
    : status.overlayPreset
      ? `${status.overlayPreset} -> ${status.basePreset}`
      : status.activePreset === "CUSTOM"
        ? "Running"
        : `${status.activePreset} Active`;
}

function updateSliderOutputs() {
  const inputs = engine.getInputs();
  for (const [name, output] of Object.entries(sliderOutputs)) {
    output.value = inputs[name].toFixed(2);
    sliderElements[name].value = inputs[name].toFixed(2);
  }
}

function applyBehavior(text, options = {}) {
  try {
    engine.applyText(text, options);
    dslInput.value = text;
    setParseMessage("Behavior compiled. Use `time`, `local_time`, trig, and transient envelopes.");
    setActivePreset(options.presetName ?? "CUSTOM");
  } catch (error) {
    setParseMessage(error.message, true);
  }
  updateRuntimeStatus();
}

function buildPresetButtons() {
  const fragment = document.createDocumentFragment();

  for (const [name, text] of Object.entries(PRESETS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.dataset.preset = name;
    button.textContent = name;
    button.addEventListener("click", () => applyBehavior(text, { presetName: name }));
    fragment.append(button);
  }

  presetGrid.append(fragment);
}

function bindUi() {
  applyBehaviorButton.addEventListener("click", () => {
    applyBehavior(dslInput.value, { presetName: "CUSTOM" });
  });

  restoreIdleButton.addEventListener("click", () => {
    applyBehavior(PRESETS.IDLE, { presetName: "IDLE" });
  });

  togglePanelButton.addEventListener("click", () => {
    panel.classList.add("hidden");
    showPanelButton.classList.remove("hidden");
  });

  showPanelButton.addEventListener("click", () => {
    panel.classList.remove("hidden");
    showPanelButton.classList.add("hidden");
  });

  resetInputsButton.addEventListener("click", () => {
    engine.resetInputs();
    updateSliderOutputs();
  });

  copyPromptButton.addEventListener("click", async () => {
    if (!canonicalPromptText) {
      setPromptStatus("Prompt not loaded yet.", true);
      return;
    }

    try {
      await navigator.clipboard.writeText(canonicalPromptText);
      setPromptStatus("Prompt copied. Ask the LLM for YAML, then paste it below.");
    } catch (error) {
      setPromptStatus("Copy failed. Select the prompt text manually.", true);
    }
  });

  for (const [name, input] of Object.entries(sliderElements)) {
    input.addEventListener("input", () => {
      engine.setInput(name, Number(input.value));
      updateSliderOutputs();
    });
  }
}

async function loadCanonicalPrompt() {
  try {
    const response = await fetch("./transient-dsl-prompt.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Prompt file missing.");
    }

    canonicalPromptText = await response.text();
    promptBlock.textContent = canonicalPromptText;
    setPromptStatus("Copy this prompt into an LLM, then append your expression request.");
  } catch (error) {
    canonicalPromptText = "";
    promptBlock.textContent = "Prompt file could not be loaded.";
    setPromptStatus("Prompt file could not be loaded.", true);
  }
}

function start() {
  buildPresetButtons();
  bindUi();
  engine.initialize();
  dslInput.value = PRESETS.IDLE;
  loadCanonicalPrompt();

  const params = new URLSearchParams(window.location.search);
  const presetParam = params.get("preset");
  const dslParam = params.get("dsl");
  const hidePanel = params.get("panel") === "0";
  const inputParams = ["energy", "presence", "arousal"];

  for (const name of inputParams) {
    const rawValue = params.get(name);
    if (rawValue !== null) {
      const numeric = Number(rawValue);
      if (Number.isFinite(numeric)) {
        engine.setInput(name, Math.min(1, Math.max(0, numeric)));
      }
    }
  }

  if (dslParam) {
    applyBehavior(dslParam, { presetName: "CUSTOM" });
  } else if (presetParam && PRESETS[presetParam]) {
    applyBehavior(PRESETS[presetParam], { presetName: presetParam });
  }

  if (hidePanel) {
    panel.classList.add("hidden");
    showPanelButton.classList.add("hidden");
  }

  updateRuntimeStatus();
  updateSliderOutputs();
  setActivePreset(engine.getStatus().activePreset);

  let lastUiTime = -1;
  const frame = (timeMs) => {
    const time = timeMs * 0.001;
    const face = engine.getRenderFaceAt(time);
    renderer.render(face, time, engine.getTransitionGlitch(time));

    if (time - lastUiTime > 0.1) {
      liveOutput.textContent = engine.getLiveOutput(face);
      lastUiTime = time;
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

start();
