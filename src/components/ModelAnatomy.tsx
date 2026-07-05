// The throughline strip (PROJECT.md §2 / §10.6 item "tier system + throughline
// in-page"): every track index states this model's form / loss / optimiser so
// the unifying pattern from the Start-here track stays visible across methods.
// Server component — purely presentational.

export function ModelAnatomy({
  accent = "var(--c-regression)",
  form,
  loss,
  optimiser,
}: {
  accent?: string;
  form: React.ReactNode;
  loss: React.ReactNode;
  optimiser: React.ReactNode;
}) {
  const cells: [string, React.ReactNode][] = [
    ["Form", form],
    ["Loss", loss],
    ["Optimiser", optimiser],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 1,
        background: `color-mix(in srgb, ${accent} 20%, var(--border))`,
        border: `1px solid color-mix(in srgb, ${accent} 20%, var(--border))`,
        borderRadius: 12,
        overflow: "hidden",
        margin: "1.5rem 0",
      }}
    >
      {cells.map(([label, value]) => (
        <div key={label} style={{ background: "var(--surface)", padding: "11px 14px" }}>
          <div
            className="font-display"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, marginBottom: 4 }}
          >
            {label}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}
