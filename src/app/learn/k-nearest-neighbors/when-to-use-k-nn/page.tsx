import Link from "next/link";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use k-NN — Manifold",
  description:
    "A practitioner's decision guide: the situations where k-NN is the right first (or final) tool, the ones where it quietly fails, and the checklist to tell them apart before you commit.",
};

const col: React.CSSProperties = { flex: "1 1 280px", borderRadius: 14, padding: "16px 18px" };
const liStyle: React.CSSProperties = { marginBottom: 8, lineHeight: 1.55 };

export default function WhenToUseKnnPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · strengths & kin", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>When to use k-NN</>}
        intro={<>
          You now know k-NN inside out — how it predicts, how to tune and scale it, and why it works. This page
        is the practitioner&rsquo;s payoff: a clear read on when it&rsquo;s the right tool and when to reach past it.
        </>}
      />

      <div className="lesson">
        <h2>The one-line summary</h2>
        <p>
          k-NN is a <strong>local, non-parametric, lazy</strong> method: it assumes nearby points share
          outcomes, commits to no global shape, and defers all work to query time. That single sentence
          predicts every strength and every weakness below.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "1.4rem 0" }}>
          <div style={{ ...col, background: "color-mix(in srgb, var(--good) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--good) 28%, var(--border))" }}>
            <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--good)", marginBottom: 8 }}>Reach for k-NN when…</div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 14, color: "var(--muted)" }}>
              <li style={liStyle}>The decision boundary is <strong>irregular or non-linear</strong> and you have no model for its shape.</li>
              <li style={liStyle}>You have <strong>plenty of data in modest dimensions</strong> (roughly <M>{String.raw`d \lesssim 20`}</M>, after any reduction).</li>
              <li style={liStyle}>You want a <strong>strong baseline fast</strong> — almost no training, few assumptions.</li>
              <li style={liStyle}>You need <strong>example-based explanations</strong> (&ldquo;similar to these known cases&rdquo;).</li>
              <li style={liStyle}>The task is <strong>similarity search / retrieval / recommendation</strong> — k-NN&rsquo;s native home at scale.</li>
              <li style={liStyle}>New data arrives continuously — adding points needs <strong>no retraining</strong>.</li>
            </ul>
          </div>
          <div style={{ ...col, background: "color-mix(in srgb, var(--bad, #d9534f) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--bad, #d9534f) 26%, var(--border))" }}>
            <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--bad, #d9534f)", marginBottom: 8 }}>Avoid k-NN when…</div>
            <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 14, color: "var(--muted)" }}>
              <li style={liStyle}><strong>High dimensions</strong> with no reduction — distances concentrate and &ldquo;nearest&rdquo; loses meaning.</li>
              <li style={liStyle}><strong>Low-latency serving on large <M>{String.raw`n`}</M></strong> — every query scans (or indexes) the whole dataset.</li>
              <li style={liStyle}>You must <strong>extrapolate</strong> beyond the observed data — k-NN never does.</li>
              <li style={liStyle}>Many features are <strong>irrelevant or unscaled</strong> and you can&rsquo;t fix them — they poison the distance.</li>
              <li style={liStyle}>You need a <strong>compact, portable model</strong> — k-NN must ship all its training data.</li>
              <li style={liStyle}>Data is <strong>sparse</strong> relative to the dimension — neighbourhoods aren&rsquo;t local.</li>
            </ul>
          </div>
        </div>

        <h2>Strengths, and the flaw each one hides</h2>
        <ul style={ul}>
          <li><strong>No training / no assumptions</strong> → but all cost moves to <em>inference</em>, and it needs lots of data to pin down the local structure.</li>
          <li><strong>Arbitrarily flexible boundary</strong> → but high variance at small <M>{String.raw`k`}</M>, and it overfits noise without care.</li>
          <li><strong>Naturally multi-class and probabilistic</strong> (<code>predict_proba</code> = class fractions) → but those probabilities are coarse for small <M>{String.raw`k`}</M> and need calibration.</li>
          <li><strong>Interpretable by example</strong> → but there&rsquo;s no global summary, no coefficients to read.</li>
          <li><strong>One dial (<M>{String.raw`k`}</M>)</strong> → but the distance, scaling, and features around it matter just as much, and must be got right first.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>The pre-flight checklist</>}>
          Before committing to k-NN, confirm you&rsquo;ve: (1){" "}
            <Link href="/learn/k-nearest-neighbors/why-feature-scaling-matters" style={inlineLink}>scaled the features</Link>;
            (2) picked and validated a <Link href="/learn/k-nearest-neighbors/choosing-the-right-metric" style={inlineLink}>metric</Link>{" "}
            and <Link href="/learn/k-nearest-neighbors/choosing-k-by-cross-validation" style={inlineLink}>k</Link> together by CV;
            (3) checked the <Link href="/learn/k-nearest-neighbors/the-curse-of-dimensionality" style={inlineLink}>dimensionality</Link>{" "}
            (reduce if <M>{String.raw`d`}</M> is large); (4) planned for <Link href="/learn/k-nearest-neighbors/the-brute-force-cost" style={inlineLink}>query cost</Link>{" "}
            at your target scale; and (5) evaluated with a metric that survives{" "}
            <Link href="/learn/k-nearest-neighbors/ties-and-class-imbalance" style={inlineLink}>imbalance</Link>. Miss one and
            k-NN can look far worse than it is.
        </Callout>

        <p>
          If several &ldquo;avoid&rdquo; boxes are ticked, the fix isn&rsquo;t always to abandon k-NN — often it&rsquo;s
          to change the <em>representation</em> (reduce dimensions, learn an embedding) so that k-NN&rsquo;s
          assumption holds again. But sometimes another model is simply a better fit, which is the next page.
        </p>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Which scenario is k-NN best suited to?",
              options: ["An irregular non-linear boundary with ample data in modest dimensions", "A thousand sparse features and millions of rows served at low latency", "A task requiring extrapolation beyond the data"],
              answer: 0,
              explain: "k-NN thrives on flexible boundaries with dense, modest-dimensional data. High-dimensional sparse data, tight latency, and extrapolation are its weak spots.",
            },
            {
              q: "k-NN's 'no training' strength comes with which hidden cost?",
              options: ["All the work — and latency — moves to inference", "It can't do multi-class", "It always overfits"],
              answer: 0,
              explain: "Lazy learning defers everything to query time, so the O(1) fit is paid back on every prediction. That's the core trade-off.",
            },
            {
              q: "Several 'avoid' conditions apply. A good first response is often to…",
              options: ["Change the representation (reduce dimensions / learn an embedding) so k-NN's assumption holds again", "Increase k until it works", "Remove the test set"],
              answer: 0,
              explain: "Many k-NN failures are really representation failures. Fixing the feature space often rescues it; only then consider a different model.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-nn-as-non-parametric-estimation", label: <>← k-NN as non-parametric estimation</> }} next={{ href: "/learn/k-nearest-neighbors/k-nn-vs-logistic-regression-svm-trees", label: <>Next up · k-NN vs logistic, SVM, trees →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
