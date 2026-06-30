// A notebook-style "executed output" panel shown under a CodeBlock. Signals that the
// code above was actually run, and displays its real captured stdout.
export function CodeOutput({ children, label = "output" }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ margin: "-6px 0 1.6rem", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--good)" }} />
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>{label}</span>
      </div>
      <pre style={{ margin: 0, padding: "11px 13px", background: "var(--canvas)", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12.5, lineHeight: 1.55, color: "var(--ink)", overflowX: "auto", whiteSpace: "pre" }}>
        {children}
      </pre>
    </div>
  );
}
