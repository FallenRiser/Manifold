// Pedagogy primitives for the asteroid-hazard capstone. They enforce the
// "teach transferable thinking, not a recipe" contract (docs/neo-capstone-plan.md §2)
// on every page: open with the GENERAL question, close with a transfer prompt, and
// bank one reusable Playbook rule. They carry the --c-space accent so the capstone
// reads as its own thing without leaving the editorial surface. Presentational only.

const SPACE = "var(--c-space)";

// Opens every page: the reusable question a data scientist asks, BEFORE the asteroids.
export function AnalystQuestion({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "color-mix(in srgb, var(--c-space) 7%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-space) 26%, var(--border))", borderRadius: 14, padding: "14px 16px", margin: "0 0 20px" }}>
      <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1.3 }}>🧭</span>
      <div>
        <div style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: SPACE, fontWeight: 600, marginBottom: 4 }}>
          The analyst&rsquo;s question
        </div>
        <div style={{ fontSize: 16.5, lineHeight: 1.55, color: "var(--ink)" }}>{children}</div>
      </div>
    </div>
  );
}

// Closes a teaching beat: lift the lesson off the asteroids onto the reader's own work.
export function TransferBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `3px solid ${SPACE}`, background: "color-mix(in srgb, var(--c-space) 5%, var(--surface))", borderRadius: "0 12px 12px 0", padding: "12px 16px", margin: "18px 0" }}>
      <div style={{ fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: SPACE, fontWeight: 600, marginBottom: 4 }}>
        Your turn ↗
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>{children}</div>
    </div>
  );
}

// Banks one reusable rule into the running Data-Science Playbook.
export function PlaybookRule({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px", margin: "18px 0" }}>
      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--c-space) 16%, var(--surface))", color: SPACE, fontWeight: 700, fontSize: 13 }} className="font-display">
        {n}
      </span>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink)" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: SPACE, fontWeight: 600, marginRight: 6 }}>Playbook</span>
        {children}
      </div>
    </div>
  );
}
