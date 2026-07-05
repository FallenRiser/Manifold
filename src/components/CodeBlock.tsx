"use client";

import { useState } from "react";
import { highlight } from "sugar-high";

declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface CodeBlockProps {
  fromScratch: string;
  /** Optional. When omitted or identical to `fromScratch`, the block renders as a
   *  single pane with no tab switcher. Provide a different value to show both tabs. */
  withLibrary?: string;
  /** Optional hidden preamble (declares X, y, …). When provided, a Run button appears
   *  and executes `setup + code` in-browser via Pyodide. Omit it to hide Run entirely. */
  setup?: string;
  language?: string;
}

const TABS = ["From scratch", "With a library"] as const;

let pyodidePromise: Promise<any> | null = null;

export function CodeBlock({
  fromScratch,
  withLibrary,
  setup,
  language = "Python",
}: CodeBlockProps) {
  const hasTwo = withLibrary != null && withLibrary.trim() !== fromScratch.trim();
  const canRun = setup != null && language.toLowerCase() === "python";

  const [tab, setTab] = useState<0 | 1>(0);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "error" | "done">("idle");
  // every sample is a playground (PROJECT.md §10.3): learner edits are kept
  // per tab, Run executes the edited code, Reset restores the original
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<[string | null, string | null]>([null, null]);

  const original = hasTwo && tab === 1 ? (withLibrary as string) : fromScratch;
  const code = drafts[tab] ?? original;
  const dirty = drafts[tab] != null && drafts[tab] !== original;
  const highlighted = highlight(code);
  const lineCount = Math.max(1, code.split("\n").length);
  const running = status === "loading" || status === "running";

  function setDraft(value: string) {
    setDrafts((prev) => {
      const next = [...prev] as [string | null, string | null];
      next[tab] = value === original ? null : value;
      return next;
    });
  }

  async function handleRun() {
    if (running) return;
    setOutput("");
    try {
      let chunks = "";
      const onOut = (msg: string) => { chunks += msg + "\n"; setOutput(chunks); };
      setStatus("loading");
      if (!pyodidePromise) {
        pyodidePromise = (async () => {
          if (!window.loadPyodide) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement("script");
              s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
              s.onload = () => resolve();
              s.onerror = () => reject(new Error("Failed to load Pyodide"));
              document.body.appendChild(s);
            });
          }
          return window.loadPyodide();
        })();
      }
      const py = await pyodidePromise;
      py.setStdout({ batched: onOut });
      py.setStderr({ batched: onOut });
      const full = `${setup}\n${code}`;
      await py.loadPackagesFromImports(full);
      setStatus("running");
      await py.runPythonAsync(full);
      setStatus("done");
    } catch (err: any) {
      setOutput((prev) => prev + String(err?.message ?? err) + "\n");
      setStatus("error");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  }

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
        {hasTwo ? (
          TABS.map((label, i) => (
            <button
              key={label}
              id={`code-tab-${i}`}
              onClick={() => setTab(i as 0 | 1)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === i ? "2px solid var(--brand)" : "2px solid transparent",
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
          ))
        ) : (
          <span
            style={{
              padding: "9px 18px 8px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--muted)",
              fontFamily: "var(--font-sans, sans-serif)",
              whiteSpace: "nowrap",
            }}
          >
            Example
          </span>
        )}

        {/* Spacer + right-side controls */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
          {dirty && !editing && (
            <button
              onClick={() => setDraft(original)}
              title="Restore the original code"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11.5,
                color: "var(--faint)",
                fontFamily: "var(--font-sans, sans-serif)",
                whiteSpace: "nowrap",
                padding: 0,
              }}
            >
              Reset code
            </button>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            style={{
              background: editing ? "color-mix(in srgb, var(--brand) 12%, transparent)" : "color-mix(in srgb, var(--surface) 40%, transparent)",
              border: editing ? "1px solid color-mix(in srgb, var(--brand) 45%, transparent)" : "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
              borderRadius: 7,
              cursor: "pointer",
              padding: "4px 11px",
              fontSize: 12,
              fontWeight: 500,
              color: editing ? "var(--brand)" : "var(--muted)",
              fontFamily: "var(--font-sans, sans-serif)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
          {canRun && (
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                background: running ? "color-mix(in srgb, var(--muted) 50%, transparent)" : "color-mix(in srgb, var(--good) 85%, transparent)",
                border: "1px solid color-mix(in srgb, var(--good) 20%, transparent)",
                borderRadius: 7,
                cursor: running ? "not-allowed" : "pointer",
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--surface)",
                fontFamily: "var(--font-sans, sans-serif)",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {status === "loading" ? "Loading Python…" : status === "running" ? "Running…" : "▶ Run"}
            </button>
          )}

          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              color: "var(--faint)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
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

        <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
          {editing ? (
            <textarea
              value={code}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              spellCheck={false}
              aria-label="Edit code"
              style={{
                margin: 0,
                padding: "16px 20px 16px 14px",
                fontSize: 13.5,
                lineHeight: "1.72",
                fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
                color: "var(--ink)",
                flex: 1,
                width: "100%",
                minHeight: `${lineCount * 1.72 + 2.5}em`,
                background: "color-mix(in srgb, var(--brand) 3%, transparent)",
                border: "none",
                outline: "none",
                resize: "vertical",
                tabSize: 2,
                whiteSpace: "pre",
              }}
            />
          ) : (
            <pre
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
              <code className="sh-block" dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
          )}
        </div>
      </div>

      {/* ── Output panel (only after a run) ─────────────────────────── */}
      {(output || status === "error") && (
        <div
          style={{
            background: "color-mix(in srgb, var(--canvas) 70%, transparent)",
            borderTop: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
            padding: "11px 14px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12.5,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-display, sans-serif)", letterSpacing: "0.02em" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: status === "error" ? "var(--bad)" : "var(--good)" }} />
              output
            </span>
            <button onClick={() => { setOutput(""); setStatus("idle"); }} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", fontSize: 10 }}>
              Clear
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: status === "error" ? "var(--bad)" : "var(--ink)" }}>
            {output || (status === "error" ? "Error running code." : "")}
          </pre>
        </div>
      )}
    </div>
  );
}
