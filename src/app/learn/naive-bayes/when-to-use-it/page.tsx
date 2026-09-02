import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to reach for Naive Bayes — Manifold",
  description:
    "Naive Bayes is the right first model more often than its reputation suggests — and the wrong one in a few specific, predictable places. A field guide.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const COMPARE = [
  { model: "Naive Bayes", wins: "Text, tiny data, one-pass speed", weak: "Correlated features, honest probabilities", href: "/learn/naive-bayes" },
  { model: "Logistic regression", wins: "Plenty of data, calibrated probabilities", weak: "Small data, non-linear boundaries", href: "/learn/logistic-regression" },
  { model: "k-Nearest neighbours", wins: "Local, irregular boundaries", weak: "High dimensions, large datasets (slow)", href: "/learn/k-nearest-neighbors" },
  { model: "Trees / forests", wins: "Interactions, mixed feature types", weak: "Tiny data, very high-dim sparse text", href: "/learn/decision-trees" },
];

export default function WhenToUseItPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>When to reach for Naive Bayes</>}
        intro={<>It has an unfair reputation as a toy. In truth Naive Bayes is the correct first model in a
          few specific situations — and knowing which ones is worth more than any amount of tuning. Here is
          the field guide.</>}
      />

      <div className="lesson">
        <p>
          We have taken Naive Bayes apart: a generative model, an absurd assumption, a decision that
          survives it, three flavours, smoothing, and the crossover against logistic regression. Time to
          zoom out. Everything you have measured points to a clear answer to one question —{" "}
          <em>when is this the model to grab first?</em>
        </p>

        <h2>Reach for it when…</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong>The features are high-dimensional and sparse — especially text.</strong> Thousands of
            word-features, most zero, is precisely where the independence assumption hurts least: given the
            topic, most word pairs really are close to independent. It is the classic spam baseline for a
            reason.</li>
          <li><strong>You have very little training data.</strong> Naive Bayes estimates a handful of means
            and counts, so it reaches its ceiling fast. Below the crossover — around{" "}
            <strong>400 points</strong> on the problem we measured — it <em>beat</em> logistic regression.</li>
          <li><strong>You need a baseline in one pass.</strong> Training is counting: a single sweep over the
            data, no iterations, no learning rate. It is often the fastest model to a first number, and a
            surprisingly strong one (0.768 vs logistic regression&rsquo;s 0.755 on our text task).</li>
          <li><strong>Retraining must be cheap or online.</strong> Counts update incrementally, so streaming
            and frequent retraining are trivial.</li>
        </ul>

        <h2>Look elsewhere when…</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong>You need probabilities you can trust.</strong> Its ECE was <strong>0.116</strong> against
            logistic regression&rsquo;s 0.035. If a downstream cost or threshold multiplies the probability,
            recalibrate first — or pick a better-calibrated model. See{" "}
            <Link href="/learn/naive-bayes/calibration" style={link}>calibration</Link>.</li>
          <li><strong>Features are strongly correlated and you are near the boundary.</strong> Double-counted
            evidence occasionally flips a genuinely borderline case, not just the confidence.</li>
          <li><strong>You have plenty of data.</strong> Past the crossover, a discriminative model
            (logistic regression) or a tree ensemble will edge it out — the independence assumption becomes
            the ceiling you cannot raise.</li>
          <li><strong>Feature interactions carry the signal.</strong> Naive Bayes cannot see them by
            construction; trees and forests are built for exactly that.</li>
        </ul>

        <h2>Where it sits among its neighbours</h2>
        <p>
          Naive Bayes is the generative corner of the classification family. Its discriminative twin is
          logistic regression (same linear form, different estimator — that was{" "}
          <Link href="/learn/naive-bayes/hidden-linear-classifier" style={link}>the last page</Link>); its
          geometric cousins draw boundaries a different way.
        </p>

        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr>
                {["model", "at its best on", "weak on"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.model}>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>
                    <Link href={r.href} style={link}>{r.model}</Link>
                  </td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{r.wins}</td>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{r.weak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout color="var(--c-fundamentals)" title={<>In an interview</>}>
          &ldquo;When would you actually use Naive Bayes?&rdquo; → <em>As a fast, strong baseline for
          high-dimensional sparse problems like text, and whenever data is scarce — it has low variance, so
          it wins the small-sample regime before a discriminative model catches up. I would not trust its
          probabilities without recalibration, and I would switch once I had enough data for logistic
          regression or trees to pull ahead.</em>
        </Callout>

        <Callout color={TEAL} title={<>The one thing to take away</>}>
          Naive Bayes is a specialist, not a toy: the small-data, high-dimensional, need-it-now corner is
          genuinely its own. Reach for it there first, and know the exact moment — more data, correlated
          features, probabilities that must be honest — to hand off to something else.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/hidden-linear-classifier", label: <>← The hidden linear classifier</> }}
          next={{ href: "/learn/naive-bayes/the-playbook", label: <>Next up · The Naive Bayes playbook →</> }}
        />
      </div>
    </article>
  );
}
