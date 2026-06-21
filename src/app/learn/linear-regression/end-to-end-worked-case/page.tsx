import Link from "next/link";
import { CaseTracker } from "@/components/CaseTracker";

export const metadata = {
  title: "End-to-end: Overview — Manifold",
  description: "A multi-case capstone applying linear regression from start to finish.",
};

export default function EndToEndOverviewPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>In the wild</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· Overview</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        End-to-end capstone
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        You know the theory. You know the math. Now let's put it all together
        and solve real problems from start to finish.
      </p>

      <CaseTracker />

      <div className="lesson">
        <h2>The Journey Ahead</h2>
        <p>
          Instead of just one toy example, we are going to work through <strong>three case studies</strong> of increasing complexity. 
          Together, these cases will test everything you've learned in the last 40 pages: feature engineering, diagnostics, assumption checking, and inference.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 32 }}>
          {/* Case A */}
          <div style={caseCard}>
            <div style={badge("A")}>Case A</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Predicting Startup Revenue</h3>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
              A simple, 15-row fabricated dataset. We'll use this to build our end-to-end scaffolding: from identifying inputs to fitting a quick prototype model and interpreting the initial results.
            </p>
            <Link href="/learn/linear-regression/end-to-end-worked-case/startup-revenue" style={btnLink}>
              Start Case A →
            </Link>
          </div>

          {/* Case B */}
          <div style={caseCard}>
            <div style={badge("B")}>Case B</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Predicting House Prices</h3>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
              A real, messy dataset of 20,640 California houses. We will handle skewed targets, standardize features, run full diagnostics, and fine-tune our model using Ridge regression.
            </p>
            <Link href="/learn/linear-regression/end-to-end-worked-case/house-prices" style={btnLink}>
              Start Case B →
            </Link>
          </div>

          {/* Case C */}
          <div style={caseCard}>
            <div style={badge("C")}>Case C</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Predicting Medical Costs</h3>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
              A complex simulated dataset. We will introduce interaction terms (e.g., does smoking affect older people differently?), deal with heteroscedasticity, and perform strict statistical inference.
            </p>
            <Link href="/learn/linear-regression/end-to-end-worked-case/medical-costs" style={btnLink}>
              Start Case C →
            </Link>
          </div>
        </div>

        <h2>How the three cases differ</h2>
        <p>
          Same workflow each time — frame, look, fit, diagnose, fix, interpret — but each case adds
          one layer of real-world difficulty.
        </p>
        <div style={ctable}>
          <div style={{ ...crow, borderTop: "none" }}>
            <span style={ch}>&nbsp;</span><span style={ch}>Case A</span><span style={ch}>Case B</span><span style={ch}>Case C</span>
          </div>
          <CRow label="Data" a="12-row toy" b="20,640 real rows" c="simulated, grouped" />
          <CRow label="Target" a="clean" b="skewed + capped" c="non-constant variance" />
          <CRow label="Key challenge" a="see the skeleton" b="diagnostics that fail" c="interaction + inference" />
          <CRow label="Fit method" a="normal equation" b="OLS → Ridge (CV)" c="OLS + interaction term" />
          <CRow label="New skill" a="the workflow" b="transform / scale / regularize" c="CI, p-values, prediction intervals" />
          <CRow label="The question" a="how much?" b="can I trust it?" c="is the effect real?" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 48, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/failure-mode-gallery" style={navLink}>← Failure-mode gallery</Link>
          <Link href="/learn/linear-regression/end-to-end-worked-case/startup-revenue" style={{...navLink, fontWeight: 600}}>Start Case A →</Link>
        </div>
      </div>
    </article>
  );
}

function CRow({ label, a, b, c }: { label: string; a: string; b: string; c: string }) {
  return (
    <div style={crow}>
      <span style={cl}>{label}</span>
      <span style={cv}>{a}</span>
      <span style={cv}>{b}</span>
      <span style={cv}>{c}</span>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}

const ctable: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", margin: "1rem 0 0.4rem" };
const crow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 1fr 1.2fr 1.4fr", borderTop: "1px solid var(--border)" };
const ch: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--ink)", padding: "9px 12px", background: "var(--surface-2)" };
const cl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--ink)", padding: "9px 12px" };
const cv: React.CSSProperties = { fontSize: 13, color: "var(--muted)", padding: "9px 12px" };

const caseCard: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "24px",
  position: "relative"
};

function badge(letter: string): React.CSSProperties {
  return {
    position: "absolute",
    top: -12,
    right: 24,
    width: 28,
    height: 28,
    background: "var(--brand)",
    color: "white",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  };
}

const btnLink: React.CSSProperties = {
  display: "inline-block",
  background: "var(--brand)",
  color: "white",
  textDecoration: "none",
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
};

const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
