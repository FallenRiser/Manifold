import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Consistency of k-NN — Manifold",
  description:
    "1-NN plateaus above the Bayes error. Grow k the right way and k-NN reaches it — for any distribution. Stone's theorem and its two conditions, k → ∞ and k/n → 0, are the payoff of the whole bias–variance story.",
};

const condBox: React.CSSProperties = { flex: "1 1 220px", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "14px 16px" };

export default function ConsistencyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 3 · theory", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Consistency of k-NN</>}
        intro={<>
          1-NN gets within a factor of two of optimal but never actually reaches it. The remarkable fact is
        that k-NN <em>can</em> reach the Bayes error exactly — for <strong>any</strong> distribution — provided
        you grow <em>k</em> with the data in just the right way.
        </>}
      />

      <div className="lesson">
        <h2>What consistency means</h2>
        <p>
          A classifier is <strong>consistent</strong> if its error converges to the Bayes error as data grows:
        </p>
        <MathBlock>{String.raw`R_n \xrightarrow[n \to \infty]{} R^*`}</MathBlock>
        <p>
          If this holds for <em>every</em> possible data distribution, the method is{" "}
          <strong>universally (Bayes) consistent</strong> — a strong guarantee that, given enough data, it wrings
          out all the reducible error and leaves only the irreducible floor. This is the gold standard a learning
          rule can meet.
        </p>

        <h2>Why fixed k isn&rsquo;t enough</h2>
        <p>
          The last page showed 1-NN stalls at <M>{String.raw`R_{\text{1NN}} > R^*`}</M>. Any <em>fixed</em>{" "}
          <M>{String.raw`k`}</M> has the same problem: its asymptotic error is a fixed amount above{" "}
          <M>{String.raw`R^*`}</M> (smaller for larger <M>{String.raw`k`}</M>, but never zero). The neighbours&rsquo;
          labels are noisy draws of <M>{String.raw`\eta`}</M>, and averaging a <em>fixed</em> number of them can&rsquo;t
          drive that noise to zero. To close the gap, <M>{String.raw`k`}</M> itself must grow.
        </p>

        <h2>Stone&rsquo;s theorem: the two conditions</h2>
        <p>
          Stone (1977) proved that k-NN is universally consistent precisely when <M>{String.raw`k`}</M> grows,
          but slower than <M>{String.raw`n`}</M>:
        </p>
        <MathBlock>{String.raw`k \to \infty \qquad\text{and}\qquad \frac{k}{n} \to 0 \qquad \Longrightarrow \qquad R_n \to R^*`}</MathBlock>
        <p>
          The two conditions are exactly the two halves of the bias–variance decomposition you already derived,
          now stated as limits — each one kills one source of error:
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "1.4rem 0" }}>
          <div style={condBox}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--c-regression)", marginBottom: 4 }}>
              <M>{String.raw`k \to \infty`}</M> &nbsp;⟹&nbsp; variance → 0
            </div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
              Averaging more and more neighbour labels makes the local class fraction converge to the true{" "}
              <M>{String.raw`\eta(\mathbf{x})`}</M>. Recall the variance fell as <M>{String.raw`\sigma^2/k`}</M> —
              send <M>{String.raw`k`}</M> to infinity and it vanishes.
            </div>
          </div>
          <div style={condBox}>
            <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fundamentals)", marginBottom: 4 }}>
              <M>{String.raw`k/n \to 0`}</M> &nbsp;⟹&nbsp; bias → 0
            </div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
              If <M>{String.raw`k`}</M> is a vanishing fraction of <M>{String.raw`n`}</M>, the neighbourhood still
              shrinks geographically around <M>{String.raw`\mathbf{x}`}</M>, so the neighbours&rsquo; average{" "}
              <M>{String.raw`\eta`}</M> stays local — no smoothing bias.
            </div>
          </div>
        </div>

        <p>
          You need <strong>both at once</strong>. Fix <M>{String.raw`k`}</M> and variance never disappears; let{" "}
          <M>{String.raw`k`}</M> grow as fast as <M>{String.raw`n`}</M> (say <M>{String.raw`k = n/2`}</M>) and the
          neighbourhood swells to cover the whole space — the prediction collapses to the global majority, all
          bias. Threading between them — <M>{String.raw`k \to \infty`}</M> slowly — is what reaches{" "}
          <M>{String.raw`R^*`}</M>.
        </p>

        <Callout color="var(--c-metrics)" title={<>The √n rule is asymptotically consistent</>}>
          The old rule of thumb <M>{String.raw`k \approx \sqrt{n}`}</M> satisfies both conditions:{" "}
            <M>{String.raw`\sqrt{n} \to \infty`}</M> while <M>{String.raw`\sqrt{n}/n = 1/\sqrt{n} \to 0`}</M>.
            Neatly, with <M>{String.raw`k = \sqrt{n}`}</M> the variance term <M>{String.raw`1/k`}</M> and the bias
            term <M>{String.raw`k/n`}</M> are <em>both</em> equal to <M>{String.raw`1/\sqrt{n}`}</M> — the two
            errors shrink in lock-step. So the heuristic from the very first &ldquo;choosing k&rdquo; page isn&rsquo;t
            just practical folklore; it&rsquo;s a consistent schedule.
        </Callout>

        <h2>What consistency does and doesn&rsquo;t promise</h2>
        <ul style={ul}>
          <li><strong>Does:</strong> guarantees k-NN eventually matches the best possible classifier, with no assumptions on the data&rsquo;s form — a purely non-parametric promise.</li>
          <li><strong>Doesn&rsquo;t:</strong> say anything about <em>how fast</em>. Consistency is a statement about the limit, not the finite-sample rate. Two consistent methods can need wildly different amounts of data.</li>
          <li><strong>The rate is where dimension bites.</strong> In high dimensions the convergence to <M>{String.raw`R^*`}</M> is agonisingly slow — the curse of dimensionality, now attacking the <em>rate</em> rather than the limit. That&rsquo;s the subject of the final theory page.</li>
        </ul>

        <p>
          Consistency reframes the entire track: <Link href="/learn/k-nearest-neighbors/bias-and-variance-in-k-nn" style={inlineLink}>bias
          and variance</Link> weren&rsquo;t just a tuning heuristic — they were the two convergence conditions in
          disguise. The last page makes the estimation view explicit.
        </p>

        <Quiz
          accent="var(--c-metrics)"
          questions={[
            {
              q: "A classifier is universally consistent if…",
              options: ["Its error converges to the Bayes error R* for every distribution as n → ∞", "It has zero training error", "It beats the Bayes error"],
              answer: 0,
              explain: "Consistency is convergence to R*; 'universal' means it holds for any distribution. No method can go below R*.",
            },
            {
              q: "Stone's theorem requires which two conditions for k-NN consistency?",
              options: ["k → ∞ and k/n → 0", "k fixed and n → ∞", "k = n and n → ∞"],
              answer: 0,
              explain: "k → ∞ drives variance to zero; k/n → 0 keeps neighbourhoods shrinking so bias vanishes. Both are needed simultaneously.",
            },
            {
              q: "Why does k = √n satisfy the consistency conditions?",
              options: ["√n → ∞ while √n/n = 1/√n → 0 — and both error terms shrink as 1/√n", "Because √n is always odd", "It doesn't; √n grows too fast"],
              answer: 0,
              explain: "k grows without bound but as a vanishing fraction of n. With k=√n the variance (1/k) and bias (k/n) terms both equal 1/√n and vanish together.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-1-nn-error-bound", label: <>← The 1-NN error bound</> }} next={{ href: "/learn/k-nearest-neighbors/k-nn-as-non-parametric-estimation", label: <>Next up · k-NN as non-parametric estimation →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
