"use client";

import { useState } from "react";
import { N } from "./heliSim";
import { BUGS, RULES, EPISODES, huntBugs, onMap, type Bug, type Result } from "./bugHunt";
import { MapCells, HeliGlyph } from "./HelicopterLab";

// Plant a bug in the lab world's step, run 200 episodes with the invariants on, and see which rules catch it — and
// which bugs no rule can see. The engine lives in bugHunt.ts.

const CELL = 14, PAD = 3, SIZE = N * CELL + PAD * 2;

export function BugHuntLab() {
  const [bug, setBug] = useState<Bug>("none");
  const [res, setRes] = useState<Result | null>(null);
  const [ranFor, setRanFor] = useState<Bug | null>(null);

  const run = () => { setRes(huntBugs(bug)); setRanFor(bug); };
  const f = res?.first;
  const label = (k: Bug) => BUGS.find((b) => b.k === k)!.label;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={head}>Plant a bug, then let the invariants hunt it</span>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{EPISODES} episodes · half guard chief, half random · random time limits</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>the bug in step</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {BUGS.map(({ k, label: l }) => (
          <button key={k} onClick={() => setBug(k)} aria-pressed={bug === k}
            style={{ ...btn, padding: "4px 9px", ...(bug === k ? { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" } : {}) }}>
            {l}
          </button>
        ))}
      </div>
      <button style={{ ...btn, ...primary }} onClick={run}>▶ Run {EPISODES} episodes with the invariants on</button>

      {res && ranFor && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 300px", minWidth: 260 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink)", marginBottom: 6 }}>
              <strong>{label(ranFor)}</strong>: {res.steps.toLocaleString()} steps checked · {res.drops} drops · {res.fills} fills ·
              fire out {res.fireOut} · time called {res.timeCalled}
            </div>
            {RULES.map((rule) => {
              const e = res.broken.get(rule);
              return (
                <div key={rule} style={{ display: "flex", gap: 8, alignItems: "baseline", borderTop: "1px solid var(--border)", padding: "3px 0", fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 9, flex: "0 0 auto", background: e ? "var(--bad)" : "var(--good)", display: "inline-block" }} />
                  <span style={{ flex: 1, color: e ? "var(--ink)" : "var(--muted)" }}>{rule}</span>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11.5, color: e ? "var(--bad)" : "var(--faint)" }}>
                    {e ? `broken ${e.count}× · first ep ${e.ep}, step ${e.step}` : "held"}
                  </span>
                </div>
              );
            })}
            <div style={{ marginTop: 8, fontSize: 12.5, color: res.broken.size ? "var(--bad)" : ranFor === "none" ? "var(--good)" : "var(--ink)" }}>
              {res.broken.size
                ? `Caught: ${res.broken.size} rule${res.broken.size > 1 ? "s" : ""} broken.`
                : ranFor === "none"
                  ? "Every rule held at every step."
                  : "Not caught. Every rule held at every step — and the bug is still there."}
            </div>
          </div>
          {f && (
            <div style={{ flex: "0 1 240px", minWidth: 200 }}>
              <div style={{ fontSize: 12, color: "var(--ink)", marginBottom: 4 }}>first broken: episode {f.ep}, step {f.step}</div>
              <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 4 }}>{f.rule}{f.cells.length ? " · the cells involved are outlined" : ""}</div>
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", height: "auto", display: "block", borderRadius: 6, border: "1px solid var(--border)" }}
                role="img" aria-label={`The world right after the first broken rule: ${f.rule}`}>
                <rect width={SIZE} height={SIZE} fill="var(--surface)" />
                <MapCells world={f.world} cell={CELL} pad={PAD} />
                {f.cells.map((i) => (
                  <rect key={i} x={PAD + (i % N) * CELL - 1} y={PAD + Math.floor(i / N) * CELL - 1} width={CELL + 2} height={CELL + 2}
                    fill="none" stroke="var(--ink)" strokeWidth={2.2} />
                ))}
                {onMap(f.world.pos) && <HeliGlyph world={f.world} cell={CELL} pad={PAD} />}
              </svg>
              {!onMap(f.world.pos) && <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 4 }}>the helicopter is at row {f.world.pos[0]}, column {f.world.pos[1]} — off the map</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const primary: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 15%, transparent)", color: "var(--ink)" };
