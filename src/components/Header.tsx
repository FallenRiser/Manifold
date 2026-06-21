import Link from "next/link";
import { ManifoldMark } from "./ManifoldMark";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "saturate(150%) blur(8px)",
        background: "color-mix(in srgb, var(--paper) 82%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "11px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <ManifoldMark size={30} />
          <span
            className="font-display"
            style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)" }}
          >
            manifold
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Link href="/map" style={navLink}>
            Algorithms
          </Link>
          <span style={{ ...navLink, opacity: 0.55 }}>Workflow</span>
          <span style={{ ...navLink, opacity: 0.55 }}>Metrics</span>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

const navLink: React.CSSProperties = {
  fontSize: 14,
  color: "var(--muted)",
  textDecoration: "none",
};
