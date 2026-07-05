import Link from "next/link";
import { ManifoldMark } from "./ManifoldMark";

const LEARN = [
  { name: "Linear regression", href: "/learn/linear-regression" },
  { name: "Regularized regression", href: "/learn/regularized-regression" },
  { name: "Polynomial regression", href: "/learn/polynomial-regression" },
  { name: "k-Means clustering", href: "/learn/k-means" },
  { name: "k-Nearest Neighbors", href: "/learn/k-nearest-neighbors" },
  { name: "California housing capstone", href: "/learn/california-housing-capstone" },
];

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 0 }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "44px 24px 52px",
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.2fr) minmax(160px, 1fr) minmax(160px, 1fr)",
          gap: 32,
        }}
        className="footer-grid"
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <ManifoldMark size={24} />
            <span className="font-display" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>manifold</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--muted)", maxWidth: 300, margin: 0 }}>
            An interactive textbook for machine-learning intuition. Drag, tune, and watch every
            algorithm work from the inside out.
          </p>
        </div>

        <div>
          <div className="font-display" style={colHead}>Learn</div>
          {LEARN.map((l) => (
            <Link key={l.href} href={l.href} style={colLink}>{l.name}</Link>
          ))}
          <Link href="/map" style={{ ...colLink, color: "var(--ink)" }}>The full map →</Link>
        </div>

        <div>
          <div className="font-display" style={colHead}>Colophon</div>
          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--muted)", margin: 0 }}>
            Set in <em>Instrument Serif</em>, <em>Bricolage Grotesque</em>, and <em>Geist</em>.
            Every figure is a hand-built SVG; every lab runs real math in your browser —
            least squares, Lloyd&rsquo;s iterations, gradient descent and all.
          </p>
        </div>
      </div>
    </footer>
  );
}

const colHead: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 12,
};

const colLink: React.CSSProperties = {
  display: "block",
  fontSize: 13.5,
  color: "var(--muted)",
  textDecoration: "none",
  padding: "3px 0",
};
