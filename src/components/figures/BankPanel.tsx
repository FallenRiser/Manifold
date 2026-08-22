// Transfer test II identity — bank marketing. Deliberately the OPPOSITE of the
// dark space panels: an always-LIGHT ledger-paper card (theme-independent, uses
// --bank-* tokens) so the far transfer reads instantly as a cold, unfamiliar,
// non-space field. Motif: faint horizontal ledger rules plus a small bar-chart
// (campaign response) in the corner. Deterministic → SSR-safe, no animation loop.

const BARS = [0.35, 0.6, 0.28, 0.82, 0.45, 0.7, 0.5]; // static, illustrative campaign bars

export function BankPanel({
  children,
  pad = "32px 30px 24px",
  radius = 18,
}: {
  children: React.ReactNode;
  pad?: string;
  radius?: number;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius, border: "1px solid var(--bank-border)", background: "var(--bank-panel)", padding: pad, color: "var(--bank-ink-soft)" }}>
      {/* faint ledger rules across the whole card */}
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={0} y1={12 + i * 11} x2={100} y2={12 + i * 11} stroke="var(--bank-rule)" strokeWidth={0.3} />
        ))}
      </svg>
      {/* small campaign bar-chart, top-right */}
      <svg viewBox="0 0 120 80" width="132" height="88" aria-hidden="true" style={{ position: "absolute", right: 18, top: 18, opacity: 0.7 }}>
        <line x1={4} y1={72} x2={116} y2={72} stroke="var(--bank-faint)" strokeWidth={1} />
        {BARS.map((b, i) => (
          <rect key={i} x={8 + i * 15.5} y={72 - b * 60} width={11} height={b * 60} rx={1.5} fill={i === 3 ? "var(--bank-accent)" : "var(--bank-rule)"} />
        ))}
      </svg>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
