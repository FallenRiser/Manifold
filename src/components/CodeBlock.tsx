"use client";

import { useState, useRef } from "react";
import { highlight } from "sugar-high";

declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface CodeBlockProps {
  fromScratch: string;
  withLibrary: string;
  language?: string;
}

const TABS = ["From scratch", "With a library"] as const;

export function CodeBlock({
  fromScratch,
  withLibrary,
  language = "Python",
}: CodeBlockProps) {
  const [tab, setTab] = useState<0 | 1>(0);
  const [copied, setCopied] = useState(false);
  
  // Pyodide Execution State
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyodideStatus, setPyodideStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const preRef = useRef<HTMLPreElement>(null);

  // Determine current display code
  const code = tab === 0 ? fromScratch : withLibrary;
  const highlighted = highlight(code);
  const lineCount = Math.max(1, code.split("\n").length);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    
    try {
      let py = pyodide;
      if (!py) {
        setPyodideStatus('loading');
        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Pyodide script"));
            document.body.appendChild(script);
          });
        }
        py = await window.loadPyodide({
          stdout: (msg: string) => setOutput((prev) => prev + msg + '\n'),
          stderr: (msg: string) => setOutput((prev) => prev + msg + '\n')
        });
        await py.loadPackage("micropip");
        setPyodide(py);
        setPyodideStatus('ready');
      }

      setOutput(""); // clear previous
      await py.loadPackagesFromImports(code);
      await py.runPythonAsync(code);
    } catch (err: any) {
      setOutput((prev) => prev + err.toString() + '\n');
      setPyodideStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  }

  // Responsive Glassmorphism styling
  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--surface) 70%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid color-mix(in srgb, var(--border-strong) 60%, transparent)",
        borderRadius: 14,
        overflow: "hidden",
        margin: "1.8rem 0",
        fontSize: 13.5,
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", 
      }}
    >
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: "1px solid color-mix(in srgb, var(--border-strong) 60%, transparent)",
          background: "color-mix(in srgb, var(--canvas) 50%, transparent)", 
          gap: 0,
        }}
      >
        {/* Tabs */}
        {TABS.map((label, i) => (
          <button
            key={label}
            id={`code-tab-${i}`}
            onClick={() => setTab(i as 0 | 1)}
            style={{
              background: "none",
              border: "none",
              borderBottom:
                tab === i
                  ? "2px solid var(--brand)"
                  : "2px solid transparent",
              cursor: "pointer",
              padding: "9px 18px 8px",
              fontSize: 13,
              fontWeight: tab === i ? 600 : 400,
              color: tab === i ? "var(--brand)" : "var(--muted)", 
              fontFamily: "var(--font-sans, sans-serif)",
              transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}

        {/* Spacer + right-side controls */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
          }}
        >
          {language.toLowerCase() === "python" && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              style={{
                background: isRunning ? "color-mix(in srgb, var(--muted) 50%, transparent)" : "color-mix(in srgb, var(--good) 85%, transparent)",
                border: "1px solid color-mix(in srgb, var(--good) 20%, transparent)",
                borderRadius: 7,
                cursor: isRunning ? "not-allowed" : "pointer",
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--surface)",
                fontFamily: "var(--font-sans, sans-serif)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
              }}
            >
              {isRunning ? "Running..." : pyodideStatus === 'loading' ? "Loading Python..." : "▶ Run Code"}
            </button>
          )}

          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: "var(--faint)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginLeft: 8,
            }}
          >
            {language}
          </span>
          <button
            id="code-copy-btn"
            onClick={handleCopy}
            style={{
              background: copied ? "color-mix(in srgb, var(--good) 15%, transparent)" : "color-mix(in srgb, var(--surface) 40%, transparent)",
              border: copied ? "1px solid var(--good)" : "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
              borderRadius: 7,
              cursor: "pointer",
              padding: "4px 11px",
              fontSize: 12,
              fontWeight: 500,
              color: copied ? "var(--good)" : "var(--muted)",
              fontFamily: "var(--font-sans, sans-serif)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── Code body ───────────────────────────────────────────────── */}
      <div style={{ position: "relative", display: "flex", overflow: "hidden", minHeight: 100 }}>
        {/* Line numbers */}
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            userSelect: "none",
            textAlign: "right",
            padding: "16px 10px 16px 16px",
            fontSize: 13.5,
            lineHeight: "1.72",
            color: "var(--faint)",
            fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
            borderRight: "1px solid color-mix(in srgb, var(--border) 60%, transparent)", 
            background: "transparent",
            zIndex: 1,
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code & Editor Container */}
        <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
          {/* Highlighted code (underneath) */}
          <pre
            ref={preRef}
            style={{
              margin: 0,
              padding: "16px 20px 16px 14px",
              fontSize: 13.5,
              lineHeight: "1.72",
              fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
              color: "var(--ink)",
              flex: 1,
              overflow: "auto",
              width: "100%",
              background: "transparent",
              tabSize: 2,
            }}
          >
            <code
              className="sh-block"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      </div>

      {/* ── Terminal Output (Only show if output exists or error occurred) */}
      {(output || pyodideStatus === 'error') && (
        <div style={{
          background: "color-mix(in srgb, var(--surface) 80%, transparent)", 
          borderTop: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
          padding: "14px 16px",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12.5,
          color: "var(--muted)",
          maxHeight: "250px",
          overflowY: "auto",
        }}>
          <div style={{ color: "var(--faint)", marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between" }}>
            <span>Terminal Output</span>
            <button 
              onClick={() => { setOutput(''); setPyodideStatus('ready'); }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 10 }}
            >
              Clear
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--ink)" }}>
            {output}
            {pyodideStatus === 'error' && <span style={{color: "var(--bad)"}}>Error initializing or running Python environment.</span>}
          </pre>
        </div>
      )}
    </div>
  );
}
