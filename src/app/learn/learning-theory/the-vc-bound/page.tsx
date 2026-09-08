import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "The VC generalization bound — Manifold",
  description:
    "The classical bound: generalization gap grows like the square root of VC dimension over sample size. It is the crowning result of the theory, and evaluated on real model sizes it is honestly, spectacularly vacuous — which is the most interesting thing about it.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)" };

// Real values from scripts/learning_theory_cases.py section 1 (python 3.13.11,
// numpy 2.3.5). Bound: sqrt((8/n)[d(ln(2n/d)+1) + ln(4/delta)]), delta = 0.05.
const ROWS: [string, string, string, string, boolean][] = [
  ["2", "3", "100", "1.264", false],
  ["2", "3", "1,000", "0.464", true],
  ["10", "11", "1,000", "0.762", false],
  ["64", "65", "1,000", "1.529", false],
  ["64", "65", "10,000", "0.594", false],
  ["784", "785", "60,000", "0.795", false],
];

export default function VcBoundPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Measuring capacity", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>The VC generalization bound</>}
        intro={<>Everything so far assembles into one inequality — the classical result of statistical learning
          theory. Then we do the thing most treatments skip: put real numbers in it and report what comes out,
          however embarrassing.</>}
      />

      <div className="lesson">
        <h2>The bound</h2>
        <p>
          Combine uniform convergence with the growth function, apply Sauer&rsquo;s lemma, and you get: for a class
          of VC dimension <M>d</M>, with probability at least <M>{String.raw`1-\delta`}</M>, simultaneously for
          every <M>{String.raw`h \in \mathcal H`}</M>,
        </p>
        <MathBlock>{String.raw`R(h) \;\le\; \hat R_S(h) \;+\; \sqrt{\frac{8}{n}\left[d\left(\ln\frac{2n}{d} + 1\right) + \ln\frac{4}{\delta}\right]}`}</MathBlock>
        <p>
          Strip the constants and the shape is the thing to remember:
        </p>
        <MathBlock>{String.raw`\text{gap} \;=\; O\!\left(\sqrt{\frac{d \log(n/d)}{n}}\right)`}</MathBlock>
        <p>
          Capacity over data, square-rooted. It is distribution-free — no assumption whatsoever about{" "}
          <M>{String.raw`\mathcal D`}</M> — it holds for every hypothesis at once so it survives training, and it
          says the gap vanishes as <M>{String.raw`n \to \infty`}</M> for any class of finite VC dimension. As a
          qualitative statement about what governs generalization, it is a genuine intellectual achievement.
        </p>

        <Proof title="where the 8, the 2n, and the 4 come from" color={GRAY}>
          <p>
            The constants look arbitrary; each is a specific technical step, and knowing which is which tells you
            where the looseness lives.
          </p>
          <p>
            <strong>The symmetrization step (the <M>{String.raw`2n`}</M>).</strong> We want to bound{" "}
            <M>{String.raw`P(\sup_h |\hat R_S(h) - R(h)| > \varepsilon)`}</M>, but <M>{String.raw`R(h)`}</M> is an
            expectation over an infinite distribution, so we cannot union-bound over behaviours on it. The trick is
            to introduce a <em>ghost sample</em> <M>{String.raw`S'`}</M> of the same size, drawn independently,
            and show
          </p>
          <MathBlock>{String.raw`P\Big(\sup_h |\hat R_S(h) - R(h)| > \varepsilon\Big) \le 2\, P\Big(\sup_h |\hat R_S(h) - \hat R_{S'}(h)| > \tfrac{\varepsilon}{2}\Big).`}</MathBlock>
            <p>
            Now both quantities are empirical, computed on <M>{String.raw`2n`}</M> total points — so only the
            behaviours on those <M>{String.raw`2n`}</M> points matter, and there are at most{" "}
            <M>{String.raw`\Pi_{\mathcal H}(2n)`}</M> of them. <strong>That is why the growth function is evaluated
            at <M>{String.raw`2n`}</M> rather than <M>n</M>, and where the leading factor of 2 originates.</strong>
          </p>
          <p>
            <strong>The union bound over behaviours.</strong> Apply the union bound over the at most{" "}
            <M>{String.raw`\Pi_{\mathcal H}(2n)`}</M> distinguishable labelings, then Sauer to replace it with{" "}
            <M>{String.raw`(2en/d)^d`}</M>. Taking logs turns that into{" "}
            <M>{String.raw`d(\ln(2n/d) + 1)`}</M> — the bracket in the bound.
          </p>
          <p>
            <strong>The <M>{String.raw`4/\delta`}</M> and the 8.</strong> The factor 2 from symmetrization and
            another factor 2 from the two-sided absolute value together turn <M>{String.raw`\delta`}</M> into{" "}
            <M>{String.raw`\delta/4`}</M>. The 8 in front is the accumulated cost of the <M>{String.raw`\varepsilon/2`}</M>{" "}
            in the symmetrization step feeding into a Hoeffding exponent of{" "}
            <M>{String.raw`2n\varepsilon^2`}</M>: halving <M>{String.raw`\varepsilon`}</M> costs a factor of 4
            inside the square root, which combines with the 2 to give 8.
          </p>
          <p>
            None of these steps is wasteful in isolation. But notice they <em>compound</em>: symmetrization pays a
            factor of 2 for an event that is usually far from worst-case, and the union bound over behaviours
            assumes the labelings fail independently when in practice they are enormously correlated. Loose steps
            multiply, and this is why the final number comes out where it does.
          </p>
        </Proof>

        <h2>Now put numbers in it</h2>
        <p>
          A bound is a promise about a number, so let&rsquo;s collect the promises. Linear classifiers in{" "}
          <M>{String.raw`\mathbb R^p`}</M> have <M>{String.raw`d = p+1`}</M>. With{" "}
          <M>{String.raw`\delta = 0.05`}</M>, evaluated directly from the formula above:
        </p>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>features <M>p</M></th>
              <th style={th}><M>{String.raw`d_{\text{VC}}`}</M></th>
              <th style={th}><M>n</M></th>
              <th style={th}>guaranteed gap</th>
              <th style={th}>verdict</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r[0]}</td>
                <td style={td}>{r[1]}</td>
                <td style={td}>{r[2]}</td>
                <td style={{ ...td, color: r[4] ? "var(--ink)" : "var(--bad)" }}>{r[3]}</td>
                <td style={{ ...td, color: r[4] ? "var(--muted)" : "var(--bad)", fontSize: 12.5 }}>
                  {r[4] ? "usable" : "vacuous"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          Read the last row. A linear classifier on MNIST-shaped inputs, trained on sixty thousand examples — a
          genuinely large dataset by classical standards — comes with a guaranteed generalization gap of{" "}
          <strong>0.795</strong>. On a binary problem, where guessing gives you 0.5, a bound of 0.795 says: your
          true error is at most your training error plus eighty points. It is <em>true</em>. It is also{" "}
          <strong>vacuous</strong> — it excludes nothing you didn&rsquo;t already know.
        </p>
        <p>
          How much data would that case need for a meaningful gap of 0.1? Running the formula forward:{" "}
          <strong>about 7.4 million examples</strong>. MNIST has 60,000, and a linear model on it generalizes to
          within a couple of points. The bound is off by more than two orders of magnitude, in the direction of
          uselessness, on one of the easiest problems anyone studies.
        </p>

        <Callout color={GRAY} title={<>Why we tell you this instead of hiding it</>}>
          A bound this loose could look like a reason to dismiss the theory. It isn&rsquo;t, and the distinction
          matters: <strong>the VC bound is wrong as a prediction and right as an explanation.</strong> It correctly
          identifies that the gap is driven by capacity divided by data, that it shrinks like{" "}
          <M>{String.raw`1/\sqrt n`}</M>, and that a class of infinite VC dimension has no guarantee at all. Those
          facts are true and useful. What it cannot do is tell you the number. Treat it as physics-style scaling —{" "}
          <em>which quantities matter and in what proportion</em> — not as an error bar you would report.
        </Callout>

        <h2>Three reasons it&rsquo;s so loose</h2>
        <ul>
          <li>
            <strong>Worst case over distributions.</strong> Distribution-freeness is bought by assuming an
            adversary chose your data. Your data was not chosen by an adversary, so you pay for protection you
            don&rsquo;t need. Rademacher complexity, next, gives this back.
          </li>
          <li>
            <strong>Worst case over the class.</strong> We bounded{" "}
            <M>{String.raw`\sup_{h} |\hat R_S(h) - R(h)|`}</M> — the gap of the <em>worst</em> hypothesis, including
            absurd ones your optimiser would never return. Your algorithm has strong preferences the bound ignores.
            Algorithmic stability, in the final chapter, exploits exactly this.
          </li>
          <li>
            <strong>Independence assumed where there is none.</strong> The union bound treats the behaviours as if
            they fail separately. Nearby hypotheses fail together, so the true sup is far smaller than the sum
            suggests.
          </li>
        </ul>
        <p>
          Each of these is a live research direction, and each of the remaining chapters picks one up. But no
          repair yet proposed closes the gap for modern deep networks — that honest accounting is where the track
          ends, on{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>when the bounds break</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/growth-function", label: <>← The growth function &amp; Sauer&rsquo;s lemma</> }}
          next={{ href: "/learn/learning-theory/rademacher-complexity", label: <>Next up · Rademacher complexity →</> }}
        />
      </div>
    </article>
  );
}
