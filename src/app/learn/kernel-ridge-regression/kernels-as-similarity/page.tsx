import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Kernels as similarity — Manifold",
  description:
    "A kernel is just a similarity score between two points — high for near, low for far. Meet the linear, polynomial, and RBF kernels, see how γ sets the RBF's reach, and the rules for building valid kernels.",
};

// RBF kernel k = exp(-gamma * r^2) as a function of distance r, for three widths.
// Analytic and rounded at module scope — no invented data.
const GAMMAS = [{ g: 3, c: "var(--c-regression)" }, { g: 12, c: "var(--c-classification)" }, { g: 40, c: "var(--c-fundamentals)" }];
const RS = Array.from({ length: 61 }, (_, i) => i / 60);
const W = 360, H = 190, padL = 30, padB = 26, padT = 12, padR = 12;
const px = (r: number) => Math.round((padL + r * (W - padL - padR)) * 100) / 100;
const py = (v: number) => Math.round((H - padB - v * (H - padB - padT)) * 100) / 100;
const line = (g: number) => RS.map((r) => `${px(r)},${py(Math.exp(-g * r * r))}`).join(" ");

export default function KernelsAsSimilarityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · from ridge to kernels", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Kernels as similarity</>}
        intro={<>
          Behind the feature-space formalism, a kernel is something intuitive: a <em>similarity</em> score. It&rsquo;s
        large when two points are alike and small when they&rsquo;re different — and that&rsquo;s all kernel ridge
        needs to know about your data.
        </>}
      />

      <div className="lesson">
        <h2>A kernel scores similarity</h2>
        <p>
          Since <M>{String.raw`k(x, z) = \langle \phi(x), \phi(z)\rangle`}</M>, and an inner product is largest
          when two vectors point the same way, a kernel measures <strong>how similar</strong> two points are in
          feature space. Kernel ridge&rsquo;s prediction{" "}
          <M>{String.raw`\hat{y}(x) = \sum_i \alpha_i\, k(x_i, x)`}</M> then reads as: a weighted vote where each
          training point contributes in proportion to how similar it is to the query. Near points speak loudly,
          far ones barely at all — the same instinct as k-NN, made smooth and continuous.
        </p>

        <h2>The three you&rsquo;ll actually use</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 480, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}>Kernel</th>
                <th style={th}>Formula</th>
                <th style={th}>Fits</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}><strong>Linear</strong></td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>x·z</td>
                <td style={td}>Plain ridge — a straight line/plane. The baseline.</td>
              </tr>
              <tr>
                <td style={td}><strong>Polynomial</strong></td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>(x·z + c)ᵈ</td>
                <td style={td}>Polynomial surfaces up to degree d, with no explicit expansion.</td>
              </tr>
              <tr>
                <td style={td}><strong>RBF / Gaussian</strong></td>
                <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>exp(−γ‖x−z‖²)</td>
                <td style={td}>Almost any smooth function; the default, infinitely flexible.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>The RBF kernel and its width γ</h2>
        <p>
          The RBF (radial basis function) kernel depends only on the <em>distance</em> between points, and decays
          smoothly to zero as they separate. The parameter <M>{String.raw`\gamma`}</M> sets how fast: large{" "}
          <M>{String.raw`\gamma`}</M> means similarity drops off sharply (only very close points count — narrow,
          local influence), small <M>{String.raw`\gamma`}</M> means a gentle, wide reach.
        </p>
        <MathBlock>{String.raw`k(x, z) = \exp\!\big(-\gamma\, \lVert x - z\rVert^2\big)`}</MathBlock>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="RBF kernel similarity versus distance, for three values of gamma: all start at 1 and decay to 0, with larger gamma decaying faster.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {GAMMAS.map(({ g, c }) => <polyline key={g} points={line(g)} fill="none" stroke={c} strokeWidth={2.4} />)}
            <text x={px(0.02)} y={py(0.98) + 2} fontSize={8.5} fill="var(--faint)">k = 1 (identical)</text>
            <text x={px(0.55)} y={py(Math.exp(-3 * 0.55 * 0.55)) - 5} fontSize={9} fill="var(--c-regression)">γ = 3 (wide)</text>
            <text x={px(0.34)} y={py(Math.exp(-12 * 0.34 * 0.34)) - 5} fontSize={9} fill="var(--c-classification)">γ = 12</text>
            <text x={px(0.18)} y={py(Math.exp(-40 * 0.18 * 0.18)) - 5} fontSize={9} fill="var(--c-fundamentals)">γ = 40 (narrow)</text>
            <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">distance ‖x − z‖ →</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Every RBF kernel is 1 for identical points and fades to 0 as they separate. <M>{String.raw`\gamma`}</M>
            is the reach: small γ lets distant points still count (smooth, global fits); large γ makes similarity
            vanish quickly (spiky, local fits that can overfit).
          </figcaption>
        </figure>

        <h2>What makes a valid kernel — and how to build new ones</h2>
        <p>
          A function is a valid kernel iff it&rsquo;s symmetric and positive semi-definite (its Gram matrix has no
          negative eigenvalues) — the guarantee that it corresponds to <em>some</em> inner product. Handily, PSD
          is preserved under natural operations, so you can compose kernels:
        </p>
        <ul style={ul}>
          <li>A <strong>sum</strong> <M>{String.raw`k_1 + k_2`}</M> and a <strong>product</strong> <M>{String.raw`k_1 \cdot k_2`}</M> of kernels are kernels.</li>
          <li>A <strong>positive scaling</strong> <M>{String.raw`c\,k`}</M> (for <M>{String.raw`c > 0`}</M>) is a kernel.</li>
          <li>Composing with a feature transform, <M>{String.raw`k(f(x), f(z))`}</M>, is a kernel.</li>
        </ul>
        <p>
          This algebra lets practitioners <em>design</em> similarity — e.g. an RBF over numeric columns plus a
          separate kernel over categorical ones — encoding domain knowledge directly into what &ldquo;alike&rdquo;
          means.
        </p>

        <Callout color="var(--c-regression)" title={<>Kernel choice = inductive bias</>}>
          Choosing a kernel is choosing what your model assumes about the function&rsquo;s shape: linear for planes,
            polynomial for smooth global curvature, RBF for local smoothness. It&rsquo;s the single most important
            modelling decision in a kernel method — more than λ, more than any other knob. The next chapter is
            about making that choice well.
        </Callout>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Intuitively, a kernel k(x, z) measures…",
              options: ["How similar two points are in feature space", "The label of x", "The number of features"],
              answer: 0,
              explain: "It's an inner product in feature space — large for similar points, small for dissimilar ones. KRR's prediction is a similarity-weighted vote over the data.",
            },
            {
              q: "In the RBF kernel, increasing γ…",
              options: ["Makes similarity decay faster with distance — narrower, more local influence", "Widens each point's influence", "Has no effect on the fit"],
              answer: 0,
              explain: "Large γ means exp(−γ‖x−z‖²) drops sharply, so only very close points count — spiky, local, overfitting-prone fits. Small γ is smooth and global.",
            },
            {
              q: "A function is a valid kernel if and only if it is…",
              options: ["Symmetric and positive semi-definite", "Differentiable", "Bounded between 0 and 1"],
              answer: 0,
              explain: "PSD symmetric functions correspond to an inner product in some feature space (Mercer). Sums, products, and positive scalings of kernels stay valid.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/the-dual-form-of-ridge", label: <>← The dual form of ridge</> }} next={{ href: "/learn/kernel-ridge-regression/the-kernel-ridge-solution", label: <>Next up · The kernel ridge solution →</> }} />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 13.5, color: "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
