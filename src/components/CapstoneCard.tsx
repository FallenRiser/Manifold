import Link from "next/link";
import type { Capstone } from "@/lib/siteMap";

// One capstone, shown as a self-contained card in its own accent. Used on the
// landing page (with its signature figure) and the map (compact, figure omitted).
export function CapstoneCard({ capstone, figure }: { capstone: Capstone; figure?: React.ReactNode }) {
  const c = capstone;
  return (
    <Link
      href={c.href}
      className="gcard"
      style={{ ["--accent" as string]: c.color, display: "flex", flexDirection: "column", textDecoration: "none", padding: 0, overflow: "hidden", height: "100%" }}
    >
      {figure && (
        <div style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", padding: 12 }}>
          {figure}
        </div>
      )}
      <div style={{ padding: "16px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: c.color, background: "color-mix(in srgb, var(--accent) 12%, var(--surface))", padding: "2px 9px", borderRadius: 999 }}>
            {c.kind}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--good)", background: "color-mix(in srgb, var(--good) 12%, var(--surface))", padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
            {c.pages} pages
          </span>
        </div>
        <div className="font-display" style={{ fontSize: 19, fontWeight: 500, color: c.color, marginBottom: 6 }}>
          {c.title} capstone
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.6, color: "var(--muted)" }}>{c.blurb}</p>
        {/* the headline result, typeset rather than printed: a quiet label, the baseline it started
            from, and the number it reached carried in the capstone's own accent */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 10, letterSpacing: "0.11em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 4 }}>
              {c.metric}
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{c.from}</span>
              <span style={{ fontSize: 12, color: "var(--faint)" }}>→</span>
              <span className="font-serif" style={{ fontSize: 23, color: c.color, lineHeight: 1 }}>{c.to}</span>
              {c.note && <span style={{ fontSize: 11, color: "var(--faint)" }}>{c.note}</span>}
            </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.color, whiteSpace: "nowrap" }}>Read →</span>
        </div>
      </div>
    </Link>
  );
}
