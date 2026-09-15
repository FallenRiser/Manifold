// A notebook-style "executed output" panel. Two modes, and the prop picks both the
// meaning and the styling:
//
//   <CodeBlock>…</CodeBlock>
//   <CodeOutput>…</CodeOutput>
//       ATTACHED — this is what the code directly above printed. Joins the code block
//       (no top border, negative top margin, bottom-only corners).
//
//   <CodeOutput source="scripts/boosting_cases.py">…</CodeOutput>
//       STANDALONE — a measured result with no code on this page. Gets its own full
//       border, and names the script that produced the numbers, which is house rule
//       #1 (every number on the site is reproduced by something in the repo).
//
// Never use the attached form without a CodeBlock above it: it renders visually
// detached AND publishes a number whose code the reader cannot see.
export function CodeOutput({
  children,
  source,
  label = source ? "measured" : "output",
}: {
  children: React.ReactNode;
  source?: string;
  label?: string;
}) {
  const standalone = Boolean(source);
  return (
    <div
      style={{
        margin: standalone ? "1.6rem 0" : "-6px 0 1.6rem",
        border: "1px solid var(--border)",
        borderTop: standalone ? "1px solid var(--border)" : "none",
        borderRadius: standalone ? 10 : "0 0 10px 10px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--good)" }} />
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}>{label}</span>
      </div>
      <pre style={{ margin: 0, padding: "11px 13px", background: "var(--canvas)", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12.5, lineHeight: 1.55, color: "var(--ink)", overflowX: "auto", whiteSpace: "pre" }}>
        {children}
      </pre>
      {standalone && (
        <div style={{ padding: "6px 12px", background: "var(--panel)", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-display)", letterSpacing: "0.02em", overflowX: "auto", whiteSpace: "nowrap" }}>
          reproduced by <code style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11 }}>{source}</code>
        </div>
      )}
    </div>
  );
}
