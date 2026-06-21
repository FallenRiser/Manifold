import Link from "next/link";
import { AssumptionsDiagnosticLab } from "@/components/labs/AssumptionsDiagnosticLab";

export const metadata = {
  title: "The five assumptions — Manifold",
  description:
    "Linear regression only works as advertised when five conditions hold. Here's what they are, why they matter, and what goes wrong when they don't.",
};

export default function TheFiveAssumptionsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The five assumptions
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The math of linear regression doesn't care about your data. But the
        <em> guarantees</em> — unbiased coefficients, valid p-values, reliable
        predictions — only hold when five conditions are met.
      </p>

      <div className="lesson">
        <p>
          The normal equation finds a line. It always will, no matter what you
          feed it. But whether that line <em>means anything</em> depends on the
          data satisfying a set of assumptions. Break them, and your standard
          errors are wrong, your confidence intervals are lies, and your
          predictions may be systematically off. This chapter visits each one.
        </p>

        <h2>The five, at a glance</h2>
        <div style={fiveGrid}>
          <AssumCard n={1} title="Linearity" color="var(--c-regression)"
            body="The relationship between each feature and the outcome is linear (in the parameters)."
            href="/learn/linear-regression/linearity" />
          <AssumCard n={2} title="Independence" color="var(--brand)"
            body="Each observation's error is independent of every other — no autocorrelation."
            href="/learn/linear-regression/independence-of-errors" />
          <AssumCard n={3} title="Homoscedasticity" color="var(--good)"
            body="The variance of the errors is constant across all fitted values — no fanning out."
            href="/learn/linear-regression/homoscedasticity" />
          <AssumCard n={4} title="Normality" color="var(--c-fundamentals)"
            body="The residuals follow a roughly normal distribution (matters most for inference)."
            href="/learn/linear-regression/normality-of-residuals" />
          <AssumCard n={5} title="No multicollinearity" color="var(--bad)"
            body="Predictors are not near-perfectly correlated with each other."
            href="/learn/linear-regression/multicollinearity" />
        </div>

        <p>
          These go by the acronym <strong>LINE + M</strong> (Linearity,
          Independence, Normality, Equal variance, no Multicollinearity) —
          though many textbooks list them differently. The first three matter
          most for <em>predictions</em>; normality matters primarily for{" "}
          <em>inference</em>; multicollinearity destabilises the{" "}
          <em>coefficients</em>.
        </p>

        <h2>How to spot violations: residual plots</h2>
        <p>
          Nearly all assumption diagnostics come down to looking at the{" "}
          <strong>residuals</strong> — the differences between what the model
          predicted and what actually happened. If the model is correctly
          specified and the assumptions hold, residuals should look like random
          noise: no patterns, no fanning, no outliers.
        </p>
        <p>
          The most important diagnostic is the <strong>residual-vs-fitted</strong>{" "}
          plot. Select each scenario below and watch how the pattern in the
          right panel signals each type of violation.
        </p>

        <AssumptionsDiagnosticLab />

        <h2>The order of concern</h2>
        <div style={priorityList}>
          <PriorityRow n={1} title="Linearity" color="var(--c-regression)"
            impact="Systematic bias in predictions — the model is fitting the wrong shape."
            fix="Add polynomial terms, transform features, or switch to a non-linear model." />
          <PriorityRow n={2} title="Homoscedasticity" color="var(--good)"
            impact="Standard errors and confidence intervals are wrong — inference is unreliable."
            fix="Weighted least squares, log-transform the outcome, or use robust standard errors." />
          <PriorityRow n={3} title="Independence" color="var(--brand)"
            impact="Standard errors are under-estimated — p-values are too small."
            fix="Add lag features, use mixed-effects models, or cluster standard errors." />
          <PriorityRow n={4} title="Normality" color="var(--c-fundamentals)"
            impact="Only matters for inference in small samples. Central limit theorem helps for large N."
            fix="Log-transform skewed outcomes; check for outliers." />
          <PriorityRow n={5} title="No multicollinearity" color="var(--bad)"
            impact="Coefficients are unstable — small data changes flip their signs."
            fix="Drop one correlated predictor, use PCA, or apply Ridge regularisation." />
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            A practical perspective
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            In practice, assumptions are rarely perfectly satisfied. The goal
            isn't perfection — it's assessing whether violations are severe
            enough to materially affect your conclusions. A mild non-normality
            in a large dataset? Essentially harmless. Severe heteroscedasticity?
            Fix it before reporting standard errors.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/polynomial-and-interaction-terms" style={navLink}>← Polynomial &amp; interaction terms</Link>
          <Link href="/learn/linear-regression/linearity" style={navLink}>Next up · Linearity →</Link>
        </div>
      </div>
    </article>
  );
}

function AssumCard({ n, title, color, body, href }: { n: number; title: string; color: string; body: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`,
        border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`,
        borderRadius: 14, padding: "12px 14px",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            width: 24, height: 24, borderRadius: 7, background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>{n}</span>
          <span className="font-display" style={{ fontSize: 14, fontWeight: 600, color }}>{title}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
      </div>
    </Link>
  );
}

function PriorityRow({ n, title, color, impact, fix }: { n: number; title: string; color: string; impact: string; fix: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{
        width: 26, height: 26, borderRadius: 8, background: color, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#fff",
      }}>{n}</span>
      <div>
        <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}><strong style={{ color: "var(--ink)" }}>Impact:</strong> {impact}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}><strong style={{ color: "var(--ink)" }}>Fix:</strong> {fix}</div>
      </div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const fiveGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, margin: "1.4rem 0" };
const priorityList: React.CSSProperties = { margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
