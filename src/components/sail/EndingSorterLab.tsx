"use client";

import { useState } from "react";

// Sort real endings into terminated or truncated, using the page's one question:
// "if my simulator did not stop here, would the task still be over?"

type Card = { text: string; answer: "terminated" | "truncated"; why: string };

const CARDS: Card[] = [
  { text: "The boat comes within 10 m of the mark.", answer: "terminated", why: "The race is won. Keep simulating and there is nothing more to earn." },
  { text: "The boat crosses the 150 m edge of the race area.", answer: "terminated", why: "Leaving the course is a disqualification. No future in which it goes on to win." },
  { text: "Our boat reaches 200 s. No race we model has a time rule; the clock only stops stuck boats sailing forever.", answer: "truncated", why: "Keep simulating and the boat could still finish. The clock is a safety net, not part of the task." },
  { text: "A regatta rule: boats that have not rounded the mark after 80 s are scored as losing.", answer: "terminated", why: "At the buzzer the boat has lost — as over as a disqualification. Same clock as the card above, different task." },
  { text: "Boss fight: the player's health reaches zero.", answer: "terminated", why: "The duel is lost. Nothing that happens after this frame can change it." },
  { text: "The wildfire world calls time after 300 steps. The fire is still burning.", answer: "truncated", why: "The fire, the helicopter and the village all carry on. We stopped watching for our own convenience." },
  { text: "The simulated map ends, but in the world being modelled the water simply carries on.", answer: "truncated", why: "The edge belongs to the simulator, not the task. The agent could come back." },
];

export function EndingSorterLab() {
  const [picks, setPicks] = useState<(null | Card["answer"])[]>(CARDS.map(() => null));
  const done = picks.filter((p) => p !== null).length;
  const right = picks.filter((p, i) => p === CARDS[i].answer).length;

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <span style={head}>Label the ending</span>
        <span style={{ fontSize: 12, color: "var(--faint)", fontFamily: "ui-monospace, monospace" }}>{done ? `${right} / ${done} right` : `${CARDS.length} endings`}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
        For each, ask: <em>if the simulator did not stop here, would the task still be over?</em>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {CARDS.map((c, i) => {
          const p = picks[i];
          const ok = p === c.answer;
          return (
            <div key={i} style={{
              border: `1px solid ${p === null ? "var(--border)" : ok ? "color-mix(in srgb, var(--good) 45%, var(--border))" : "color-mix(in srgb, var(--bad) 45%, var(--border))"}`,
              borderRadius: 10, padding: "9px 12px",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, color: "var(--ink)", flex: "1 1 280px", lineHeight: 1.45 }}>{c.text}</span>
                <span style={{ display: "flex", gap: 6 }}>
                  {(["terminated", "truncated"] as const).map((opt) => (
                    <button key={opt} disabled={p !== null}
                      onClick={() => setPicks((prev) => prev.map((q, j) => (j === i ? opt : q)))}
                      style={{
                        ...btn,
                        ...(p === opt ? { borderColor: ok ? "var(--good)" : "var(--bad)", color: "var(--ink)", background: `color-mix(in srgb, ${ok ? "var(--good)" : "var(--bad)"} 12%, transparent)` } : {}),
                        ...(p !== null && p !== opt && opt === c.answer ? { borderColor: "var(--good)", color: "var(--good)" } : {}),
                        cursor: p === null ? "pointer" : "default",
                      }}>{opt}</button>
                  ))}
                </span>
              </div>
              {p !== null && (
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
                  <strong style={{ color: ok ? "var(--good)" : "var(--bad)" }}>{ok ? "Right" : `It is ${c.answer}`}.</strong> {c.why}{" "}
                  <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--faint)" }}>
                    target = {c.answer === "terminated" ? "r" : "r + γ·max Q(s′)"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {done > 0 && <button style={{ ...btn, marginTop: 10 }} onClick={() => setPicks(CARDS.map(() => null))}>start again</button>}
    </div>
  );
}

const box: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "0.4rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 999, padding: "4px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "ui-monospace, monospace" };
