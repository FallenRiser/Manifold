"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HYPOTHESES, ESTIMATES, type Verdict } from "@/lib/routingRegister";

// The prediction register for the message-routing capstone: each hypothesis with the decision it
// feeds, the reasoning, and the result that would prove it wrong. The reader bets on each one.
// Bets live in this browser only (localStorage); the page renders the same without them.

const KEY = "manifold-routing-bets";
type Bet = "agree" | "against";

const mono: React.CSSProperties = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };
const POST = "var(--c-post)";

const STATUS: Record<Verdict | "open", { label: string; colour: string }> = {
  open: { label: "open", colour: "var(--faint)" },
  confirmed: { label: "confirmed", colour: "var(--good)" },
  wrong: { label: "wrong", colour: "var(--bad)" },
  "not settled": { label: "not settled", colour: "var(--warn)" },
};

function load(): Record<string, Bet> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function PredictionRegister() {
  const [bets, setBets] = useState<Record<string, Bet>>({});
  useEffect(() => setBets(load()), []);

  const place = (id: string, b: Bet) =>
    setBets((prev) => {
      const next = { ...prev };
      if (next[id] === b) delete next[id];
      else next[id] = b;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // storage blocked: the bet still shows for this visit
      }
      return next;
    });
  const placed = HYPOTHESES.filter((h) => bets[h.id]).length;

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 14px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "4px 12px", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ ...mono, fontSize: 11.5, color: "var(--faint)" }}>the register · written before act 2</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
          your bets: <strong style={{ ...mono, color: "var(--ink)" }}>{placed}</strong> of {HYPOTHESES.length}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {HYPOTHESES.map((h) => {
          const st = STATUS[h.verdict ?? "open"];
          return (
            <section key={h.id} aria-labelledby={`reg-${h.id}`} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 10px 10px 0", padding: "10px 13px 11px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", alignItems: "baseline" }}>
                <span id={`reg-${h.id}`} style={{ ...mono, fontSize: 13, fontWeight: 700, color: POST }}>{h.id}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", flex: "1 1 200px" }}>decides: {h.decides.toLowerCase()}</span>
                <span style={{ ...mono, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: st.colour }}>{st.label}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink)", fontWeight: 500 }}>{h.claim}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>Why: </span>{h.why}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>Wrong if </span>{h.wrongIf}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center", marginTop: 9 }}>
                <span style={{ ...mono, fontSize: 11, color: "var(--faint)" }}>
                  settled in act {h.act} ·{" "}
                  {h.settled ? <Link href={h.settled} style={{ color: POST }}>{h.page}</Link> : h.page}
                </span>
                <span role="radiogroup" aria-label={`your bet on ${h.id}`} style={{ display: "inline-flex", gap: 4 }}>
                  {(["agree", "against"] as const).map((b) => {
                    const on = bets[h.id] === b;
                    return (
                      <button
                        key={b}
                        role="radio"
                        aria-checked={on}
                        onClick={() => place(h.id, b)}
                        style={{
                          fontSize: 12, padding: "4px 10px", borderRadius: 7, cursor: "pointer",
                          border: `1px solid ${on ? POST : "var(--border-strong)"}`,
                          background: on ? POST : "transparent",
                          color: on ? "var(--surface)" : "var(--muted)",
                          fontWeight: on ? 600 : 400,
                        }}
                      >
                        {b === "agree" ? "I agree" : "I'd bet against it"}
                      </button>
                    );
                  })}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div style={{ marginTop: 10, padding: "9px 13px", border: "1px dashed var(--border-strong)", borderRadius: 10 }}>
        {ESTIMATES.map((e) => (
          <div key={e.id} style={{ fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
            <span style={{ ...mono, fontWeight: 700, color: "var(--ink)", marginRight: 8 }}>{e.id}</span>
            {e.question}{" "}
            <span style={{ ...mono, fontSize: 11, color: "var(--faint)", whiteSpace: "nowrap" }}>
              measured in act {e.act} · {e.measured ? <Link href={e.measured} style={{ color: POST }}>{e.page}</Link> : e.page}
            </span>
          </div>
        ))}
      </div>

      <figcaption style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        Each entry is settled on the page named under it, which marks it confirmed, wrong or not settled and
        leaves the wording as it is here. Your bets are kept in this browser only.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * Settled: a settling page's verdict on one register entry. The claim
 * and the test are printed as they were frozen; the page supplies the
 * evidence; the reader's bet from the register page is answered.
 * ------------------------------------------------------------------ */
const REGISTER_HREF = "/learn/message-routing-capstone/research-questions";

function answer(bet: Bet | null, v: Verdict): React.ReactNode {
  if (!bet) return <>You did not bet on this one. The register and your other bets are on the <Link href={REGISTER_HREF} style={{ color: POST }}>research questions</Link> page.</>;
  if (v === "not settled") return <>You {bet === "agree" ? "agreed with it" : "bet against it"}. Neither side wins: the posts cannot settle it.</>;
  const held = v === "confirmed";
  if (bet === "agree") return held ? <>You agreed with it, and it held.</> : <>You agreed with it. It did not hold.</>;
  return held ? <>You bet against it. It held.</> : <>You bet against it, and you were right.</>;
}

export function Settled({ id, children }: { id: string; children: React.ReactNode }) {
  const h = HYPOTHESES.find((x) => x.id === id);
  // undefined until the browser has been read, so the server and the first render agree
  const [bet, setBet] = useState<Bet | null | undefined>(undefined);
  useEffect(() => setBet(load()[id] ?? null), [id]);
  if (!h || !h.verdict) throw new Error(`register entry ${id} has no verdict yet`);
  const st = STATUS[h.verdict];

  return (
    <figure aria-labelledby={`settled-${id}`} style={{ margin: "22px 0 6px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 12px 12px 0", padding: "12px 15px 13px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", alignItems: "baseline" }}>
        <span id={`settled-${id}`} style={{ ...mono, fontSize: 13, fontWeight: 700, color: POST }}>{h.id}</span>
        <span style={{ fontSize: 12, color: "var(--muted)", flex: "1 1 200px" }}>decides: {h.decides.toLowerCase()}</span>
        <span style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: st.colour, border: `1px solid ${st.colour}`, borderRadius: 5, padding: "1px 6px" }}>{st.label}</span>
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink)", fontWeight: 500 }}>{h.claim}</p>
      <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>Wrong if </span>{h.wrongIf}
      </p>
      <div style={{ margin: "10px 0 0", paddingTop: 9, borderTop: "1px solid var(--border)", fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
        {children}
      </div>
      <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.55, color: "var(--ink)", minHeight: "1.55em" }}>
        {bet !== undefined && (
          <>
            <span style={{ ...mono, fontSize: 11, color: "var(--faint)", marginRight: 8 }}>your bet</span>
            {answer(bet, h.verdict)}
          </>
        )}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * Measured: the page that measures one of the register's estimates.
 * There was no prediction, so there is no bet to answer.
 * ------------------------------------------------------------------ */
export function Measured({ id, children }: { id: string; children: React.ReactNode }) {
  const e = ESTIMATES.find((x) => x.id === id);
  if (!e || !e.measured) throw new Error(`register estimate ${id} has not been measured yet`);

  return (
    <figure aria-labelledby={`measured-${id}`} style={{ margin: "22px 0 6px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${POST}`, borderRadius: "0 12px 12px 0", padding: "12px 15px 13px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", alignItems: "baseline" }}>
        <span id={`measured-${id}`} style={{ ...mono, fontSize: 13, fontWeight: 700, color: POST }}>{e.id}</span>
        <span style={{ fontSize: 12, color: "var(--muted)", flex: "1 1 200px" }}>an estimate: the register made no prediction</span>
        <span style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: POST, border: `1px solid ${POST}`, borderRadius: 5, padding: "1px 6px" }}>measured</span>
      </div>
      <p style={{ margin: "7px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink)", fontWeight: 500 }}>{e.question}</p>
      <div style={{ margin: "10px 0 0", paddingTop: 9, borderTop: "1px solid var(--border)", fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
        {children}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * Scorecard: the whole register once every entry is settled, each with
 * what its page measured and how the reader's bet came out.
 * ------------------------------------------------------------------ */
function outcome(bet: Bet | undefined, v: Verdict): { text: string; colour: string } {
  if (!bet) return { text: "no bet", colour: "var(--faint)" };
  const said = bet === "agree" ? "agreed" : "bet against";
  if (v === "not settled") return { text: `${said} · neither side wins`, colour: "var(--muted)" };
  const won = (bet === "agree") === (v === "confirmed");
  return { text: `${said} · ${won ? "right" : "wrong"}`, colour: won ? "var(--good)" : "var(--bad)" };
}

export function Scorecard() {
  // undefined until the browser has been read, so the server and the first render agree
  const [bets, setBets] = useState<Record<string, Bet> | undefined>(undefined);
  useEffect(() => setBets(load()), []);
  if (HYPOTHESES.some((h) => !h.verdict || !h.result) || ESTIMATES.some((e) => !e.measured || !e.result))
    throw new Error("the scorecard needs every register entry settled, with its result");

  const placed = bets ? HYPOTHESES.filter((h) => bets[h.id]) : [];
  const decided = placed.filter((h) => h.verdict !== "not settled");
  const won = decided.filter((h) => (bets![h.id] === "agree") === (h.verdict === "confirmed"));

  return (
    <figure style={{ margin: "22px 0 6px", padding: "14px 14px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "4px 12px", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ ...mono, fontSize: 11.5, color: "var(--faint)" }}>the register · settled</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)", minHeight: "1.4em" }}>
          {bets !== undefined && (placed.length
            ? <>your bets: <strong style={{ ...mono, color: "var(--ink)" }}>{won.length}</strong> right of the {decided.length} the posts could decide</>
            : <>no bets in this browser</>)}
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {HYPOTHESES.map((h) => {
          const st = STATUS[h.verdict!];
          const oc = bets !== undefined ? outcome(bets[h.id], h.verdict!) : null;
          return (
            <section key={h.id} aria-labelledby={`score-${h.id}`} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${st.colour}`, borderRadius: "0 10px 10px 0", padding: "8px 12px 9px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", alignItems: "baseline" }}>
                <span id={`score-${h.id}`} style={{ ...mono, fontSize: 13, fontWeight: 700, color: POST }}>{h.id}</span>
                <span style={{ ...mono, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: st.colour }}>{st.label}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", flex: "1 1 180px" }}>{h.decides.toLowerCase()}</span>
                {oc && <span style={{ ...mono, fontSize: 11, color: oc.colour }}>{oc.text}</span>}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>
                {h.result}{" "}
                <Link href={h.settled!} style={{ ...mono, fontSize: 11, color: POST, whiteSpace: "nowrap" }}>{h.page}</Link>
              </p>
            </section>
          );
        })}
        {ESTIMATES.map((e) => (
          <section key={e.id} aria-labelledby={`score-${e.id}`} style={{ background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "8px 12px 9px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", alignItems: "baseline" }}>
              <span id={`score-${e.id}`} style={{ ...mono, fontSize: 13, fontWeight: 700, color: POST }}>{e.id}</span>
              <span style={{ ...mono, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: POST }}>measured</span>
              <span style={{ fontSize: 12, color: "var(--muted)", flex: "1 1 180px" }}>{e.question}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>
              {e.result}{" "}
              <Link href={e.measured!} style={{ ...mono, fontSize: 11, color: POST, whiteSpace: "nowrap" }}>{e.page}</Link>
            </p>
          </section>
        ))}
      </div>
    </figure>
  );
}
