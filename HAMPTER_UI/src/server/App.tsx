import { useEffect, useMemo, useRef, useState } from "react";
import { EXAMPLE_SPECS } from "../examples/specs";
import {
  HampterUIRuntime,
  type BindingType,
  type ClockOverride,
  type RuntimeData,
  type RuntimeStatus,
  type SceneSpec,
  type ValidationResult
} from "../runtime";
import { HampterWsClient } from "./wsClient";

const WS_URL = `ws://${window.location.hostname || "localhost"}:${import.meta.env.VITE_HAMPTER_WS_PORT ?? "8090"}`;
const ICON_OPTIONS = ["sun", "cloud", "rain", "music", "bell", "up", "down", "play", "pause", "warning"];
const BLANK_SPEC: SceneSpec = {
  version: 1,
  layers: [
    {
      id: "bg",
      kind: "field",
      h: "0.58",
      s: "0.18",
      v: "0.06 + 0.02*(1-r)",
      a: "1"
    }
  ]
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<HampterUIRuntime | null>(null);
  const wsClientRef = useRef<HampterWsClient | null>(null);
  const hydratedFromRemote = useRef(false);
  const latestValidation = useRef<ValidationResult | null>(null);
  const lastAppliedSpecTextRef = useRef("");

  const [editorText, setEditorText] = useState(() => JSON.stringify(EXAMPLE_SPECS[0].spec, null, 2));
  const [loadedSpec, setLoadedSpec] = useState<SceneSpec>(EXAMPLE_SPECS[0].spec);
  const [data, setData] = useState<RuntimeData>(() => deriveDefaultData(EXAMPLE_SPECS[0].spec, {}));
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState<RuntimeStatus>({
    fps: 0,
    nodeCount: 0,
    specId: null,
    bindings: {},
    errors: []
  });
  const [connected, setConnected] = useState(false);
  const [useRealClock, setUseRealClock] = useState(true);
  const [selectedExampleName, setSelectedExampleName] = useState<string | null>(EXAMPLE_SPECS[0]?.name ?? null);
  const [clockOverride, setClockOverride] = useState<ClockOverride>({
    hour24: 12,
    minute: 0,
    second: 0
  });
  const selectedExample = useMemo(
    () => EXAMPLE_SPECS.find((example) => example.name === selectedExampleName) ?? null,
    [selectedExampleName]
  );
  const selectedExampleText = useMemo(
    () => (selectedExample ? JSON.stringify(selectedExample.spec, null, 2) : ""),
    [selectedExample]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const runtime = new HampterUIRuntime(canvasRef.current);
    runtime.setCellSize(4);
    runtime.start();
    runtimeRef.current = runtime;

    const wsClient = new HampterWsClient(WS_URL);
    wsClient.onConnection(setConnected);
    wsClient.onMessage((message) => {
      if (message.type === "status_snapshot") {
        if (!hydratedFromRemote.current && message.currentSpec) {
          hydratedFromRemote.current = true;
          const specText = JSON.stringify(message.currentSpec, null, 2);
          lastAppliedSpecTextRef.current = specText;
          setSelectedExampleName(null);
          setEditorText(specText);
          setLoadedSpec(message.currentSpec);
          setData((current) => deriveDefaultData(message.currentSpec ?? BLANK_SPEC, message.currentData ?? current));
        }
        return;
      }
      if (message.type === "spec") {
        const specText = JSON.stringify(message.spec, null, 2);
        if (specText !== lastAppliedSpecTextRef.current) {
          lastAppliedSpecTextRef.current = specText;
          setSelectedExampleName(null);
          setEditorText(specText);
        }
        return;
      }
      if (message.type === "data") {
        setData((current) => ({ ...current, ...message.data }));
        runtimeRef.current?.setData(message.data);
        return;
      }
      if (message.type === "clear") {
        setSelectedExampleName(null);
        setEditorText(JSON.stringify(BLANK_SPEC, null, 2));
        setLoadedSpec(BLANK_SPEC);
        setData({});
        runtimeRef.current?.clear();
        setValidation(null);
      }
    });
    wsClient.connect();
    wsClientRef.current = wsClient;

    return () => {
      runtime.stop();
      wsClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedExample || !selectedExampleText) {
      return;
    }
    if (selectedExampleText === lastAppliedSpecTextRef.current) {
      return;
    }
    lastAppliedSpecTextRef.current = selectedExampleText;
    setEditorText(selectedExampleText);
  }, [selectedExample, selectedExampleText]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      let parsed: SceneSpec;
      try {
        parsed = JSON.parse(editorText) as SceneSpec;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON.";
        setValidation({
          valid: false,
          errors: [{ path: "editor", message, severity: "error" }],
          stats: { layerCount: 0, nodeCount: 0, expressionCount: 0, hasFieldLayer: false }
        });
        return;
      }

      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }

      const nextValidation = runtime.load(parsed);
      latestValidation.current = nextValidation;
      setValidation(nextValidation);
      setLoadedSpec(parsed);
      lastAppliedSpecTextRef.current = editorText;
      setData((current) => {
        const nextData = deriveDefaultData(parsed, current);
        runtime.setData(nextData);
        wsClientRef.current?.sendData(nextData);
        return nextData;
      });
      wsClientRef.current?.sendSpec(parsed);
      wsClientRef.current?.sendValidation(nextValidation);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [editorText]);

  useEffect(() => {
    runtimeRef.current?.setData(data);
    wsClientRef.current?.sendData(data);
  }, [data]);

  useEffect(() => {
    runtimeRef.current?.setClockOverride(useRealClock ? null : clockOverride);
  }, [useRealClock, clockOverride]);

  useEffect(() => {
    const handle = window.setInterval(() => {
      const runtime = runtimeRef.current;
      if (!runtime) {
        return;
      }
      const nextStatus = runtime.getStatus();
      setStatus(nextStatus);
      wsClientRef.current?.sendStatus(nextStatus);
    }, 500);

    return () => window.clearInterval(handle);
  }, []);

  const bindings = useMemo(() => loadedSpec.bindings ?? {}, [loadedSpec]);
  const highlightedJson = useMemo(() => highlightJson(editorText), [editorText]);

  return (
    <div className="app-shell">
      <aside className="library-panel panel">
        <div className="panel-label">Library</div>
        <h1>HAMPTER UI DSL</h1>
        <p className="panel-copy">
          Runtime preview, validation, binding controls, and remote push target in one surface.
        </p>
        <button
          className="example-button blank"
          onClick={() => {
            setSelectedExampleName(null);
            const specText = JSON.stringify(BLANK_SPEC, null, 2);
            lastAppliedSpecTextRef.current = specText;
            setEditorText(specText);
          }}
        >
          New blank
        </button>
        <div className="example-list">
          {EXAMPLE_SPECS.map((example) => (
            <button
              key={example.name}
              className="example-button"
              onClick={() => {
                setSelectedExampleName(example.name);
                const specText = JSON.stringify(example.spec, null, 2);
                lastAppliedSpecTextRef.current = specText;
                setEditorText(specText);
              }}
            >
              <strong>{example.name}</strong>
              <span>{example.description}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="editor-panel panel">
        <div className="panel-head">
          <div>
            <div className="panel-label">Spec Editor</div>
            <h2>Scene Spec</h2>
          </div>
          <div className={`status-pill ${validation?.valid ? "valid" : "invalid"}`}>
            {validation?.valid ? "VALID" : "CHECK"}
          </div>
        </div>

        <div className="editor-shell">
          <pre className="editor-highlight" aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlightedJson }} />
          <textarea
            className="editor-input"
            spellCheck={false}
            value={editorText}
            onChange={(event) => {
              setSelectedExampleName(null);
              setEditorText(event.target.value);
            }}
          />
        </div>

        <div className="error-list">
          {(validation?.errors.length ?? 0) === 0 ? (
            <div className="empty-state">No validation errors.</div>
          ) : (
            validation?.errors.map((error, index) => (
              <div className="error-row" key={`${error.path}-${index}`}>
                <code>{error.path || "spec"}</code>
                <span>{error.message}</span>
              </div>
            ))
          )}
        </div>
      </main>

      <section className="preview-panel panel">
        <div className="panel-head">
          <div>
            <div className="panel-label">Preview</div>
            <h2>Runtime Display</h2>
          </div>
          <div className={`status-dot ${connected ? "online" : "offline"}`}>{connected ? "WS ON" : "WS OFF"}</div>
        </div>

        <div className="preview-stack">
          <div className="preview-stage">
            <div className="hud">
              <span>{status.fps} FPS</span>
              <span>{status.nodeCount} nodes</span>
            </div>
            <canvas ref={canvasRef} width={400} height={400} className="preview-canvas" />
          </div>

          <div className="control-card">
            <div className="control-title">Bindings</div>
            {Object.entries(bindings).length === 0 ? (
              <div className="empty-state">No bindings in the current spec.</div>
            ) : (
              Object.entries(bindings).map(([name, type]) =>
                type === "num" ? (
                  <NumericBindingControl
                    key={name}
                    name={name}
                    value={typeof data[name] === "number" ? (data[name] as number) : 0}
                    onChange={(value) => setData((current) => ({ ...current, [name]: value }))}
                  />
                ) : (
                  <label className="control-row" key={name}>
                    <span>{name}</span>
                    <select
                      value={typeof data[name] === "string" ? String(data[name]) : "sun"}
                      onChange={(event) =>
                        setData((current) => ({
                          ...current,
                          [name]: event.target.value
                        }))
                      }
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              )
            )}
          </div>

          <div className="control-card">
            <div className="control-title">Time Override</div>
            <label className="toggle-row">
              <input type="checkbox" checked={useRealClock} onChange={() => setUseRealClock((value) => !value)} />
              <span>Use real clock</span>
            </label>
            {!useRealClock && (
              <div className="time-grid">
                <TimeInput
                  label="Hour"
                  value={clockOverride.hour24 ?? 12}
                  onChange={(value) => setClockOverride((current) => ({ ...current, hour24: value }))}
                />
                <TimeInput
                  label="Minute"
                  value={clockOverride.minute ?? 0}
                  onChange={(value) => setClockOverride((current) => ({ ...current, minute: value }))}
                />
                <TimeInput
                  label="Second"
                  value={clockOverride.second ?? 0}
                  onChange={(value) => setClockOverride((current) => ({ ...current, second: value }))}
                />
              </div>
            )}
          </div>

          <div className="control-card">
            <div className="control-title">Runtime Status</div>
            <div className="status-grid">
              <span>Spec ID</span>
              <code>{status.specId ?? "none"}</code>
              <span>Bindings</span>
              <code>{Object.keys(bindings).length}</code>
              <span>Validation</span>
              <code>{validation?.valid ? "valid" : "error"}</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NumericBindingControl(props: {
  name: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const config = getBindingConfig(props.name);
  return (
    <label className="control-row">
      <div className="control-row-head">
        <span>{props.name}</span>
        <strong>{props.value.toFixed(config.step < 1 ? 1 : 0)}</strong>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
      <input
        type="number"
        min={config.min}
        max={config.max}
        step={config.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function TimeInput(props: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="control-row">
      <span>{props.label}</span>
      <input
        type="number"
        value={props.value}
        min={0}
        max={props.label === "Hour" ? 23 : 59}
        step={1}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function deriveDefaultData(spec: SceneSpec, current: RuntimeData): RuntimeData {
  const bindings = spec.bindings ?? {};
  return Object.fromEntries(
    Object.entries(bindings).map(([name, type]) => {
      const existing = current[name];
      if (type === "num") {
        if (typeof existing === "number") {
          return [name, existing];
        }
        return [name, getBindingDefault(name)];
      }
      if (typeof existing === "string") {
        return [name, existing];
      }
      return [name, "sun"];
    })
  );
}

function getBindingDefault(name: string): number {
  const key = name.toLowerCase();
  if (key.includes("temp")) {
    return 22;
  }
  if (key.includes("humid")) {
    return 58;
  }
  if (key === "var_a") {
    return 0.64;
  }
  if (key === "var_b") {
    return 0.32;
  }
  return 0;
}

function getBindingConfig(name: string): { min: number; max: number; step: number } {
  const key = name.toLowerCase();
  if (key.includes("temp")) {
    return { min: -10, max: 45, step: 0.5 };
  }
  if (key.includes("humid")) {
    return { min: 0, max: 100, step: 1 };
  }
  if (key.includes("change")) {
    return { min: -25, max: 25, step: 0.1 };
  }
  if (name === "var_a" || name === "var_b") {
    return { min: 0, max: 1, step: 0.01 };
  }
  return { min: -100, max: 100, step: 0.1 };
}

function highlightJson(input: string): string {
  const escaped = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?)/g,
    (token) => {
      let className = "token-number";
      if (/^"/.test(token)) {
        className = /:$/.test(token) ? "token-key" : "token-string";
      } else if (/true|false/.test(token)) {
        className = "token-boolean";
      } else if (/null/.test(token)) {
        className = "token-null";
      }
      return `<span class="${className}">${token}</span>`;
    }
  );
}
