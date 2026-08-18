import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The computational cost — Manifold",
  description:
    "Kernel ridge's Achilles heel: it scales with the number of data points, not features. The O(n³) fit and O(n²) memory that cap it around tens of thousands of points — and the approximations that break the ceiling.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, fontWeight: 600, borderBottom: "2px solid var(--border-strong)" };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 13, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)" };
const td: React.CSSProperties = { padding: "9px 12px", fontSize: 13.5, color: "var(--muted)", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace" };

export default function CostPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · in depth", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>The computational cost</>}
        intro={<>
          Kernel ridge&rsquo;s power comes from working with all pairwise similarities — and so does its limit. The
        kernel matrix is <M>{String.raw`n \times n`}</M>, so cost grows with the number of <em>data points</em>,
        and that caps the method well before big data.
        </>}
      />

      <div className="lesson">
        <h2>Where the cost lives</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 460, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr><th style={th}>Step</th><th style={th}>Cost</th><th style={th}>Why</th></tr>
            </thead>
            <tbody>
              <tr><td style={rowh}>Build K</td><td style={td}>O(n²·m)</td><td style={{ ...td, fontFamily: "inherit" }}>Every pair of the n points, each an m-feature similarity.</td></tr>
              <tr><td style={rowh}>Solve for α</td><td style={td}>O(n³)</td><td style={{ ...td, fontFamily: "inherit" }}>Inverting / factorising the n×n matrix K + λI.</td></tr>
              <tr><td style={rowh}>Memory</td><td style={td}>O(n²)</td><td style={{ ...td, fontFamily: "inherit" }}>The whole kernel matrix must be held (and stored to predict).</td></tr>
              <tr><td style={rowh}>Predict one point</td><td style={td}>O(n·m)</td><td style={{ ...td, fontFamily: "inherit" }}>A kernel against every training point (α is dense).</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          The <M>{String.raw`O(n^3)`}</M> solve and <M>{String.raw`O(n^2)`}</M> memory are the binding
          constraints. Notice what&rsquo;s <em>absent</em>: the number of features <M>{String.raw`m`}</M> barely
          matters — even the RBF kernel&rsquo;s infinite implicit features cost nothing extra. Kernel ridge trades
          &ldquo;scales badly with features&rdquo; for &ldquo;scales badly with data.&rdquo;
        </p>

        <Callout color="var(--c-regression)" title={<>A concrete ceiling</>}>
          At <M>{String.raw`n = 10{,}000`}</M>, the kernel matrix alone is <M>{String.raw`10^8`}</M> numbers
            (~800 MB in double precision) and the solve is on the order of <M>{String.raw`10^{12}`}</M>
            operations — workable. At <M>{String.raw`n = 100{,}000`}</M> it&rsquo;s 80 GB and a thousand times the
            compute — generally infeasible. Exact kernel ridge lives comfortably up to a few thousand points and
            strains past tens of thousands.
        </Callout>

        <h2>Breaking the ceiling: approximate the kernel</h2>
        <p>
          The fix is to stop forming the full <M>{String.raw`n \times n`}</M> matrix. Two standard routes replace
          the exact kernel with a cheap approximation, turning the dual problem back into a small{" "}
          <em>primal</em> one you can solve in <M>{String.raw`O(n)`}</M>:
        </p>
        <ul style={ul}>
          <li>
            <strong>Random Fourier features.</strong> For shift-invariant kernels (like the RBF), a random{" "}
            <M>{String.raw`D`}</M>-dimensional feature map <M>{String.raw`\tilde{\phi}(x)`}</M> satisfies{" "}
            <M>{String.raw`\tilde{\phi}(x)\cdot\tilde{\phi}(z) \approx k(x, z)`}</M>. Fit ordinary ridge on those{" "}
            <M>{String.raw`D`}</M> explicit features — linear in <M>{String.raw`n`}</M>.
          </li>
          <li>
            <strong>Nyström approximation.</strong> Approximate <M>{String.raw`K`}</M> from a random subset of{" "}
            <M>{String.raw`\ell \ll n`}</M> landmark points, giving a low-rank stand-in that&rsquo;s far cheaper to
            solve with.
          </li>
        </ul>
        <MathBlock>{String.raw`k(x, z) \;\approx\; \tilde{\phi}(x) \cdot \tilde{\phi}(z), \qquad \tilde{\phi}(x) \in \mathbb{R}^{D},\ D \ll n`}</MathBlock>
        <p>
          Both recover most of the accuracy at a fraction of the cost, and both are why kernel methods remain
          practical beyond toy sizes. When even these don&rsquo;t scale, the field reaches for the model that keeps
          the kernel idea but learns a compact set of active points — which is one motivation for{" "}
          <Link href="/learn/support-vector-regression" style={inlineLink}>support vector regression</Link>, whose{" "}
          <em>sparse</em> solution stores only the support vectors.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Exact kernel ridge regression scales as…",
              options: ["O(n³) to fit and O(n²) memory — in the number of data points", "O(m³) in the number of features", "O(n) — linear in everything"],
              answer: 0,
              explain: "The n×n kernel matrix must be built, stored, and solved. Features barely matter — even an infinite-dimensional RBF map is free.",
            },
            {
              q: "What do random Fourier features and Nyström have in common?",
              options: ["They approximate the kernel to avoid forming the full n×n matrix, restoring near-linear scaling", "They make the fit exact", "They require labels for the test set"],
              answer: 0,
              explain: "Both replace the exact kernel with a cheap low-dimensional approximation, turning the dual back into a small primal problem solvable in O(n).",
            },
            {
              q: "Kernel ridge trades one scaling weakness for another. Which?",
              options: ["Scales badly with data (n) instead of with features (m)", "Scales badly with both", "It has no scaling weakness"],
              answer: 0,
              explain: "The kernel trick makes features (even infinite ones) free, but the n×n matrix makes the number of data points the bottleneck.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/tuning-lambda-and-gamma", label: <>← Tuning λ and γ</> }} next={{ href: "/learn/kernel-ridge-regression/the-representer-theorem", label: <>Next up · The representer theorem →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
