import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { NaiveBayesConfidenceLab } from "@/components/labs/NaiveBayesConfidenceLab";

export const metadata = {
  title: "Probabilities break, decisions survive — Manifold",
  description:
    "The measured demonstration. Duplicate the feature vector k times and Naive Bayes treats one piece of evidence as k. Accuracy stays pinned at 0.975, confidence climbs to 1.000, log-loss quadruples.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ProbabilitiesBreakDecisionsSurvivePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Core idea", color: "var(--c-fundamentals)" },
        ]}
        time="about 9 minutes"
        title={<>Probabilities break, decisions survive</>}
        intro={<>Two pages of argument now become one measurement. We take a working Gaussian Naive Bayes and
          break its independence assumption in the crudest way possible — duplicate the entire feature vector —
          then watch two numbers that ought to move together come apart. The decision stays perfectly still
          while the probability inflates toward certainty. This is the whole track in a single experiment.</>}
      />

      <div className="lesson">
        <PredictPrompt
          prompt={<>You are about to duplicate the whole feature vector 2×, 4×, 8×, 16× — feeding Naive Bayes the
            same evidence over and over as if each copy were new. What happens to its <em>accuracy</em>, and
            what happens to its <em>confidence</em>?</>}
          options={[
            "Both climb — more features, better model",
            "Accuracy holds flat; confidence climbs toward certainty",
            "Both fall — the duplicates confuse it",
          ]}
          nudge={<>Locked in. Drag the slider and watch the two readouts move — or fail to.</>}
        />

        <h2>The experiment, in the lab</h2>
        <p>
          Each duplicate is a perfectly correlated feature — the most severe possible violation of the
          independence assumption — and the classifier, believing every copy is fresh independent evidence,
          multiplies its confidence accordingly.
        </p>

        <LabFrame
          accent={TEAL}
          tryThis={<>Slide <M>{String.raw`k`}</M> from 1 up to 16. Watch the accuracy readout and the
            mean-confidence readout at the same time. One of them does not move at all; the other races toward
            its ceiling.</>}
          insight={<>Accuracy is frozen at 0.975 for every value of <M>{String.raw`k`}</M>. Confidence climbs
            0.990 &rarr; 0.996 &rarr; 0.998 &rarr; 0.999 &rarr; 1.000, and log-loss quadruples from 0.186 to
            0.756. Duplicating evidence cannot change which class wins — the sign of the log-odds is fixed — but
            it multiplies the log-odds by <M>{String.raw`k`}</M>, and the sigmoid saturates.</>}
        >
          <NaiveBayesConfidenceLab />
        </LabFrame>

        <h2>The mechanism: k copies, log-odds times k</h2>
        <p>
          Recall the score Naive Bayes computes: a sum of per-feature log-likelihoods. Duplicate the whole
          vector <M>{String.raw`k`}</M> times and every feature&rsquo;s contribution appears in that sum{" "}
          <M>{String.raw`k`}</M> times — the model has no way to know the copies are redundant. So the log-odds
          is multiplied cleanly by <M>{String.raw`k`}</M>:
        </p>

        <MathBlock>{String.raw`\text{logit}_k(\mathbf{x}) \;=\; k \cdot \text{logit}_1(\mathbf{x}).`}</MathBlock>

        <p>
          Now trace the two halves of the prediction. The <strong>decision</strong> is the sign of the logit,
          and multiplying by a positive <M>{String.raw`k`}</M> cannot change a sign — every point stays on the
          side of the boundary it started on. The <strong>probability</strong> is the sigmoid of the logit, and
          there scaling matters enormously:
        </p>

        <MathBlock>{String.raw`\sigma\bigl(k \cdot z\bigr) \;\xrightarrow{\;k \to \infty\;}\; \begin{cases} 1 & z > 0 \\ 0 & z < 0 \end{cases} \qquad \text{(a step function).}`}</MathBlock>

        <p>
          As <M>{String.raw`k`}</M> grows the sigmoid saturates — every confident-but-not-certain probability is
          pushed toward a hard 0 or 1. The classifier keeps every decision it was already making and simply
          becomes more sure of each. (Strictly, the log-prior term is not multiplied, but wherever the evidence
          dominates the prior — as here — the likelihood sum carries the logit, so the scaling is{" "}
          <M>{String.raw`k`}</M> to an excellent approximation.)
        </p>

        <h2>The numbers, exactly</h2>
        <p>
          Sweeping <M>{String.raw`k`}</M> from 1 to 16 (accuracy / mean confidence / log-loss / Brier):
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}><M>{String.raw`k`}</M></th>
                <th style={{ padding: "8px 12px" }}>Accuracy</th>
                <th style={{ padding: "8px 12px" }}>Mean confidence</th>
                <th style={{ padding: "8px 12px" }}>Log-loss</th>
                <th style={{ padding: "8px 12px" }}>Brier</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "0.975", "0.990", "0.186", "0.023"],
                ["2", "0.975", "0.996", "0.354", "0.023"],
                ["4", "0.975", "0.998", "0.589", "0.023"],
                ["8", "0.975", "0.999", "0.670", "0.024"],
                ["16", "0.975", "1.000", "0.756", "0.025"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px", fontVariantNumeric: "tabular-nums" }}>{row[0]}</td>
                  <td style={{ padding: "8px 12px", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: TEAL }}>{row[1]}</td>
                  <td style={{ padding: "8px 12px", fontVariantNumeric: "tabular-nums" }}>{row[2]}</td>
                  <td style={{ padding: "8px 12px", fontVariantNumeric: "tabular-nums" }}>{row[3]}</td>
                  <td style={{ padding: "8px 12px", fontVariantNumeric: "tabular-nums" }}>{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Read the accuracy column first: <strong>0.975 at every value of <M>{String.raw`k`}</M></strong> — not
          approximately constant, exactly constant, because the sign of the logit never moves. Now read across:
          mean confidence climbs to <strong>1.000</strong>, and log-loss more than quadruples, from{" "}
          <strong>0.186 to 0.756</strong>. Log-loss punishes confident mistakes, and saturation manufactures
          exactly those — the handful of points wrong at <M>{String.raw`k=1`}</M> are still wrong at{" "}
          <M>{String.raw`k=16`}</M>, but now asserted with near-total certainty.
        </p>

        <Callout color={TEAL} title={<>A good classifier, a bad probability estimate</>}>
          This is the thesis of the whole track, in one table. The <em>accuracy</em> — everything zero-one loss
          cares about — is untouched by a gross violation of the model&rsquo;s core assumption. The{" "}
          <em>probability</em> — everything a calibrated forecast cares about — is wrecked by it. Naive Bayes
          gives you the first and not the second. Trust its labels; do not trust its confidence.
        </Callout>

        <p>
          Notice the Brier score barely moves (0.023 → 0.025) while log-loss quadruples. Not a contradiction — a
          lesson in what each metric measures. Brier is a bounded squared error: a probability of 1.000 on a
          wrong answer costs it at most 1. Log-loss is unbounded and punishes certainty on a logarithmic scale,
          so a confident error costs it <M>{String.raw`-\log(\text{tiny})`}</M>, which grows without limit.
          Saturation is precisely where the two diverge — and the divergence is the fingerprint of
          overconfidence.
        </p>

        <h2>Why this is not a contrived trick</h2>
        <p>
          Duplicating the vector is the exaggerated, controllable version of something real data does all the
          time: correlated features. Two features measuring nearly the same thing are a soft duplicate, and
          Naive Bayes double-counts their shared evidence exactly as it double-counts an exact copy — just less
          severely. Every redundant feature nudges the confidence up without earning it. The{" "}
          <M>{String.raw`k`}</M>-copy experiment dials that effect up until it is impossible to miss, but the
          mechanism is the one operating quietly in every real deployment — which is why the method is
          systematically overconfident, and why{" "}
          <Link href="/learn/naive-bayes/calibration" style={link}>a whole page later</Link> is spent on its
          calibration.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/why-naive", label: <>&larr; Why it is called naive</> }}
          next={{ href: "/learn/naive-bayes/the-decision-boundary", label: <>Next up &middot; The decision boundary &rarr;</> }}
        />
      </div>
    </article>
  );
}
