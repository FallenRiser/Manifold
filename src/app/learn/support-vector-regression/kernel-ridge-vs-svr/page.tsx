import Link from "next/link";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernel ridge vs SVR — Manifold",
  description:
    "Same kernel, different loss — and everything downstream follows. Kernel ridge is dense, closed-form, and slightly more accurate; SVR is sparse, robust, and a quadratic program. A direct comparison on real data.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12, color: "var(--ink)", fontWeight: 600, borderBottom: "2px solid var(--border-strong)", background: "var(--surface)" };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 12px", fontSize: 12.5, color: "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top", minWidth: 150 };

function Row({ h, krr, svr }: { h: React.ReactNode; krr: React.ReactNode; svr: React.ReactNode }) {
  return (
    <tr>
      <td style={rowh}>{h}</td>
      <td style={td}>{krr}</td>
      <td style={{ ...td, background: "color-mix(in srgb, var(--c-regression) 6%, transparent)" }}>{svr}</td>
    </tr>
  );
}

export default function KRRvsSVRPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in practice", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Kernel ridge vs SVR</>}
        intro={<>
          These two are the same method in every way but one: the loss. Kernel ridge uses squared error, SVR uses
        the ε-insensitive loss — and that single difference cascades into density, robustness, tuning, and how you
        solve the thing.
        </>}
      />

      <div className="lesson">
        <h2>One difference, many consequences</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Kernel ridge</th>
                <th style={{ ...th, color: "var(--c-regression)" }}>SVR</th>
              </tr>
            </thead>
            <tbody>
              <Row h="Loss" krr="Squared error" svr="ε-insensitive (tube)" />
              <Row h="Model" krr={<><strong>Dense</strong> — all n points</>} svr={<><strong>Sparse</strong> — support vectors only</>} />
              <Row h="Solved by" krr="One linear solve (closed form)" svr="Quadratic program (SMO)" />
              <Row h="Outliers" krr="Sensitive (squared tails)" svr="Robust (linear tails, capped at C)" />
              <Row h="Hyperparameters" krr="λ, kernel, γ" svr="C, ε, kernel, γ" />
              <Row h="Uncertainty" krr="Via its GP twin" svr="None built in" />
              <Row h="Prediction cost" krr="O(n) — every point" svr="O(#SV) — usually fewer" />
              <Row h="Tends to be" krr="Slightly more accurate, simpler to fit" svr="Smaller, robust, one extra knob" />
            </tbody>
          </table>
        </div>

        <h2>Head to head on real data</h2>
        <p>
          Both on the nonlinear <code>make_friedman1</code> benchmark (300 train / 100 test), from a real run:
        </p>
        <ul style={ul}>
          <li><strong>Kernel ridge (RBF):</strong> test <M>{String.raw`R^2 = 0.860`}</M>, model uses <strong>all 300</strong> training points.</li>
          <li><strong>SVR (RBF):</strong> test <M>{String.raw`R^2 = 0.838`}</M>, model uses <strong>166</strong> support vectors (55%).</li>
        </ul>
        <p>
          The trade in one line: SVR gives up about <strong>2 points of R²</strong> to nearly <strong>halve the
          model size</strong> — and it would hold up better if the data carried heavy outliers, which this clean
          benchmark doesn&rsquo;t stress. On messy data the accuracy gap often closes or reverses in SVR&rsquo;s favour.
        </p>

        <Callout color="var(--c-regression)" title={<>A clean way to remember it</>}>
          <strong>Kernel ridge</strong> is the &ldquo;just fit everything, in closed form&rdquo; kernel regressor —
            reach for it first when <M>{String.raw`n`}</M> is modest and the data is clean.{" "}
            <strong>SVR</strong> is the &ldquo;keep only what matters, tolerate the rest&rdquo; kernel regressor —
            reach for it when you want a compact model, robustness to outliers, or explicit control over the error
            you&rsquo;ll ignore. Same kernel power; different philosophy about error.
        </Callout>

        <p>
          Both share the same <M>{String.raw`n \times n`}</M> scaling wall, so neither is the answer for millions
          of points — the very next page tackles exactly that, scaling SVR with the same kind of kernel
          approximations introduced on kernel ridge&rsquo;s{" "}
          <Link href="/learn/kernel-ridge-regression/the-computational-cost" style={inlineLink}>cost page</Link>. A
          concrete decision guide for choosing between the two models follows a little later.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "The single root difference between kernel ridge and SVR is…",
              options: ["The loss function — squared vs ε-insensitive", "The kernel", "The number of features"],
              answer: 0,
              explain: "Same kernel machinery; the loss is what differs, and everything else (sparsity, robustness, solver) follows from it.",
            },
            {
              q: "On the make_friedman1 run, SVR's trade versus kernel ridge was…",
              options: ["~2 points less R² (0.838 vs 0.860) for roughly half the model size (166 vs 300 points)", "Much higher accuracy", "Identical in every respect"],
              answer: 0,
              explain: "SVR's sparsity nearly halves the stored points at a small accuracy cost on this clean data — and it would be more robust on outlier-heavy data.",
            },
            {
              q: "Which would you prefer for a compact, outlier-robust nonlinear regressor?",
              options: ["SVR — sparse support vectors and a robust ε-insensitive loss", "Kernel ridge — dense and squared-loss", "Linear ridge"],
              answer: 0,
              explain: "SVR keeps only support vectors and caps outlier influence at C. Kernel ridge is denser and more outlier-sensitive.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/nu-svr", label: <>← ν-SVR: controlling the support vectors</> }} next={{ href: "/learn/support-vector-regression/scaling-svr-to-large-n", label: <>Next up · Scaling SVR to large n →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
