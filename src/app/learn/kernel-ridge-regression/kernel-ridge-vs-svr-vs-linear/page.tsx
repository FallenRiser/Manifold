import Link from "next/link";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernel ridge vs SVR vs linear — Manifold",
  description:
    "Three regressors on a spectrum: linear ridge (fast, straight), kernel ridge (flexible, dense), and support vector regression (flexible, sparse). What differs, and how each does on the same nonlinear data.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 11px", fontSize: 12, color: "var(--ink)", fontWeight: 600, borderBottom: "2px solid var(--border-strong)", background: "var(--surface)" };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 11px", fontSize: 12.5, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 11px", fontSize: 12.5, color: "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top", minWidth: 130 };

function Row({ h, lin, krr, svr }: { h: React.ReactNode; lin: React.ReactNode; krr: React.ReactNode; svr: React.ReactNode }) {
  return (
    <tr>
      <td style={rowh}>{h}</td>
      <td style={td}>{lin}</td>
      <td style={{ ...td, background: "color-mix(in srgb, var(--c-regression) 6%, transparent)" }}>{krr}</td>
      <td style={td}>{svr}</td>
    </tr>
  );
}

export default function ComparisonPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Kernel ridge vs SVR vs linear</>}
        intro={<>
          Kernel ridge has two natural neighbours: plain linear ridge on one side, support vector regression on
        the other. Placing all three side by side is the clearest way to see what the kernel buys — and what the
        <em> loss function</em> decides.
        </>}
      />

      <div className="lesson">
        <h2>The spectrum</h2>
        <p>
          Linear ridge and kernel ridge share a loss (squared error) but differ in features (raw vs kernel).
          Kernel ridge and SVR share the kernel but differ in loss (squared vs ε-insensitive). Those two axes —
          <strong> features</strong> and <strong>loss</strong> — explain every difference below.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Linear ridge</th>
                <th style={{ ...th, color: "var(--c-regression)" }}>Kernel ridge</th>
                <th style={th}>SVR</th>
              </tr>
            </thead>
            <tbody>
              <Row h="Boundary" lin="Straight (plane)" krr="Nonlinear (kernel)" svr="Nonlinear (kernel)" />
              <Row h="Loss" lin="Squared error" krr="Squared error" svr="ε-insensitive" />
              <Row h="Solution" lin="Closed form" krr="Closed form (one solve)" svr="Quadratic program" />
              <Row h="Model density" lin="1 weight vector" krr={<><strong>Dense</strong> — all n points</>} svr={<><strong>Sparse</strong> — support vectors only</>} />
              <Row h="Robust to outliers" lin="No" krr="No (squared loss)" svr="Yes (flat tube + linear tails)" />
              <Row h="Key knobs" lin="λ" krr="λ, kernel, γ" svr="C, ε, kernel, γ" />
              <Row h="Scales with" lin="Features (m)" krr="Data (n): O(n³)" svr="Data (n), but sparse model" />
            </tbody>
          </table>
        </div>

        <h2>The same data, three fits</h2>
        <p>
          On <code>make_friedman1</code> — a strongly nonlinear target with 10 features (real run in{" "}
          <code>scripts/kernel_cases.py</code>) — the spectrum shows up in the numbers:
        </p>
        <ul style={ul}>
          <li><strong>Linear ridge:</strong> test <M>{String.raw`R^2 = 0.667`}</M>. It simply can&rsquo;t bend to the nonlinearity.</li>
          <li><strong>Kernel ridge (RBF):</strong> test <M>{String.raw`R^2 = 0.860`}</M> — a big jump, but its model keeps all <strong>300</strong> training points.</li>
          <li><strong>SVR (RBF):</strong> test <M>{String.raw`R^2 = 0.838`}</M> — almost as accurate, from a model built on just <strong>166</strong> support vectors (55%).</li>
        </ul>
        <p>
          The lesson in miniature: the kernel is what closes most of the gap to the truth (0.667 → ~0.85); the
          <em> loss</em> then trades a sliver of accuracy for a sparser, more robust model.
        </p>

        <Callout color="var(--c-regression)" title={<>How to choose between kernel ridge and SVR</>}>
          Reach for <strong>kernel ridge</strong> when you want the simplest thing that works: a closed-form
            solve, no quadratic-programming machinery, and squared-error accuracy — and when <M>{String.raw`n`}</M>
            is small enough that a dense model is fine. Reach for <strong>SVR</strong> when you want a{" "}
            <em>sparse</em> model (cheaper to store and predict), <em>robustness</em> to outliers, or control over
            the error you&rsquo;re willing to ignore (the ε-tube). Same kernel power, different priorities — and the
            subject of the next track.
        </Callout>

        <p>
          That comparison is exactly where the <Link href="/learn/support-vector-regression" style={inlineLink}>support
          vector regression</Link> track picks up: it keeps the kernel and rebuilds the loss around a tolerance
          tube, turning the dense KRR solution into a sparse one.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Kernel ridge and SVR differ mainly in their…",
              options: ["Loss function — squared error (dense) vs ε-insensitive (sparse)", "Kernel", "Number of features"],
              answer: 0,
              explain: "Both use the same kernel machinery; the ε-insensitive loss is what makes SVR sparse and robust, while squared loss makes KRR dense.",
            },
            {
              q: "On the make_friedman1 run, what did the kernel (vs linear ridge) mainly buy?",
              options: ["Most of the accuracy gain — R² 0.667 → ~0.85 by bending to the nonlinearity", "Sparsity", "Faster training"],
              answer: 0,
              explain: "The kernel closes the nonlinearity gap; KRR (0.860) and SVR (0.838) both jump well past linear ridge (0.667). Loss choice then trades accuracy for sparsity.",
            },
            {
              q: "You want a nonlinear regressor that's cheap to store and predict, and robust to outliers. Prefer…",
              options: ["SVR — sparse support vectors and an outlier-tolerant ε-insensitive loss", "Kernel ridge — it keeps all points", "Linear ridge"],
              answer: 0,
              explain: "SVR's sparsity gives a compact model and its ε-tube ignores small errors and caps outlier influence. KRR is dense and outlier-sensitive.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/kernel-ridge-and-gaussian-processes", label: <>← Kernel ridge &amp; Gaussian processes</> }} next={{ href: "/learn/kernel-ridge-regression/worked-example", label: <>Next up · A worked example →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
