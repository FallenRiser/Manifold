// The warehouse-robot capstone's own skin — the SHOP FLOOR.
//
// Each capstone gets an identity, not a recolour (PROJECT.md §10.5). Housing is
// editorial terracotta; the asteroid capstone is an always-dark sky. This one is a
// painted industrial slab: sealed concrete, saw-cut seams, hi-vis hazard tape and
// stencilled type, in --wh-* tokens that are theme-independent (concrete is concrete
// in dark mode too).
//
// It also fixes a pedagogy problem. The shared pedagogy.tsx opener put the SAME
// "The engineer's question 🤖" box on all 24 pages, which read as boilerplate by
// page four. Here the opener is a WORK ORDER: a dispatch docket numbered WO-07/24,
// whose rail, label and icon change per act — so the page tells you where in the
// six-act job you are standing, and the reader gets progression instead of a refrain.

const ACTS = [
  { n: 1, name: "Frame it", label: "The framing question", icon: "📐" },
  { n: 2, name: "Lock the harness", label: "The measurement question", icon: "📋" },
  { n: 3, name: "Learn it", label: "The learning question", icon: "⚙️" },
  { n: 4, name: "Make it work", label: "The tuning question", icon: "🎚️" },
  { n: 5, name: "Interpret & stress-test", label: "The audit question", icon: "🔎" },
  { n: 6, name: "Conclude & transfer", label: "The transfer question", icon: "📦" },
] as const;

const TOTAL = 24;

const stencil: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

/* ------------------------------------------------------------------ *
 * ShopFloor — the signature panel. A slab of concrete with a band of
 * hazard tape along the top edge. Used for the hero, act openers and
 * the transfer-test intros, so it stays special by scarcity.
 * ------------------------------------------------------------------ */
export function ShopFloor({
  children,
  stamp,
  pad = "26px 26px 22px",
  radius = 16,
}: {
  children: React.ReactNode;
  stamp?: string;
  pad?: string;
  radius?: number;
}) {
  return (
    <div
      className="wh-slab"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius,
        border: "1px solid var(--wh-seam)",
        padding: pad,
        color: "var(--wh-ink-soft)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      <div className="wh-tape wh-tape-run" style={{ position: "absolute", inset: "0 0 auto 0", height: 7 }} aria-hidden="true" />
      {stamp && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 20,
            right: 18,
            ...stencil,
            fontSize: 10.5,
            fontWeight: 700,
            color: "color-mix(in srgb, var(--wh-ink) 34%, transparent)",
            border: "1.5px solid color-mix(in srgb, var(--wh-ink) 26%, transparent)",
            borderRadius: 4,
            padding: "3px 8px",
            transform: "rotate(-3deg)",
          }}
        >
          {stamp}
        </div>
      )}
      <div style={{ position: "relative", paddingTop: 6 }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * WorkOrder — the per-page opener. Replaces the repeated question box:
 * same pedagogical job (ask the reusable question BEFORE the specifics),
 * but numbered, act-coded and stencilled.
 * ------------------------------------------------------------------ */
export function WorkOrder({
  act,
  n,
  children,
}: {
  act: number;
  n: number;
  children: React.ReactNode;
}) {
  const a = ACTS[act - 1] ?? ACTS[0];
  return (
    <div
      className="wh-slab"
      style={{
        position: "relative",
        display: "flex",
        gap: 14,
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 14,
        border: "1px solid var(--wh-seam)",
        margin: "0 0 22px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26)",
      }}
    >
      {/* the docket rail: hazard tape + the act number, read bottom-up */}
      <div
        className="wh-tape wh-tape-run"
        aria-hidden="true"
        style={{ flexShrink: 0, width: 10 }}
      />
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          padding: "12px 0 12px 2px",
          ...stencil,
          fontSize: 10,
          fontWeight: 700,
          color: "var(--wh-faint)",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        Act {a.n}
      </div>

      <div style={{ padding: "13px 16px 14px 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span aria-hidden="true" style={{ fontSize: 15 }}>{a.icon}</span>
          <span style={{ ...stencil, fontSize: 11, fontWeight: 700, color: "var(--wh-ink)" }}>
            {a.label}
          </span>
          <span aria-hidden="true" style={{ flex: 1, height: 1, background: "color-mix(in srgb, var(--wh-ink) 18%, transparent)", minWidth: 12 }} />
          <span style={{ ...stencil, fontSize: 10, color: "var(--wh-faint)", letterSpacing: "0.1em" }}>
            WO-{String(n).padStart(2, "0")}/{TOTAL} · {a.name}
          </span>
        </div>
        <div style={{ fontSize: 16.5, lineHeight: 1.55, color: "var(--wh-ink)" }}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TransferBox — closes a teaching beat by lifting it off this project.
 * Skinned as a taped-off floor marking: you are being sent out of the
 * warehouse, so the tape runs down the left edge like a doorway threshold.
 * ------------------------------------------------------------------ */
export function TransferBox({ children }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid color-mix(in srgb, var(--c-warehouse) 24%, var(--border))",
        background: "color-mix(in srgb, var(--c-warehouse) 5%, var(--surface))",
        margin: "18px 0",
      }}
    >
      <div className="wh-tape" aria-hidden="true" style={{ flexShrink: 0, width: 8 }} />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ ...stencil, fontSize: 10.5, fontWeight: 700, color: "var(--c-warehouse)", marginBottom: 4 }}>
          Take it off the floor ↗
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PlaybookRule — banks one reusable rule. Skinned as a stencilled crate
 * stamp: the rule number sprayed on in a square, not a soft pill.
 * ------------------------------------------------------------------ */
export function PlaybookRule({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems: "center",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--c-warehouse)",
        borderRadius: "4px 12px 12px 4px",
        padding: "12px 15px",
        margin: "18px 0",
      }}
    >
      <span
        className="font-display"
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 5,
          display: "grid",
          placeItems: "center",
          border: "1.5px solid color-mix(in srgb, var(--c-warehouse) 55%, transparent)",
          background: "color-mix(in srgb, var(--c-warehouse) 12%, transparent)",
          color: "var(--c-warehouse)",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {n}
      </span>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>
        <span style={{ ...stencil, fontSize: 10, color: "var(--c-warehouse)", fontWeight: 700, marginRight: 7 }}>
          Playbook
        </span>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SlabStats — headline numbers stencilled onto the floor. For the moments
 * where three numbers ARE the argument (the hero bracket, the verdict).
 * ------------------------------------------------------------------ */
export function SlabStats({
  items,
}: {
  items: { value: string; label: string; note?: string; tone?: "bad" | "good" | "plain" }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
        gap: 1,
        background: "color-mix(in srgb, var(--wh-ink) 16%, transparent)",
        borderRadius: 10,
        overflow: "hidden",
        margin: "18px 0 4px",
      }}
    >
      {items.map((it) => (
        <div key={it.label} className="wh-slab" style={{ padding: "14px 16px 13px" }}>
          <div style={{ ...stencil, fontSize: 9.5, fontWeight: 700, color: "var(--wh-faint)", marginBottom: 6 }}>
            {it.label}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 27,
              fontWeight: 700,
              lineHeight: 1,
              color:
                it.tone === "bad" ? "var(--wh-spill)" : it.tone === "good" ? "var(--wh-route)" : "var(--wh-ink)",
            }}
          >
            {it.value}
          </div>
          {it.note && (
            <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--wh-ink-soft)", marginTop: 6 }}>{it.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * HazardTape — a labelled band, for marking a hard boundary in the prose
 * ("everything below this line is off-policy").
 * ------------------------------------------------------------------ */
export function HazardTape({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 20px" }} aria-hidden={!label}>
      <div className="wh-tape" style={{ flex: 1, height: 8, borderRadius: 2 }} />
      {label && (
        <span style={{ ...stencil, fontSize: 10.5, fontWeight: 700, color: "var(--c-warehouse)", whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      <div className="wh-tape" style={{ flex: 1, height: 8, borderRadius: 2 }} />
    </div>
  );
}
