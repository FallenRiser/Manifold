import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "When the bounds break — Manifold",
  description:
    "Modern over-parameterized models violate every classical prediction: they memorize random labels, have vacuous bounds, and get better past the interpolation threshold where the U-curve says they should be worst. An honest accounting of what the theory does and doesn't explain.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// REAL measured double-descent curve from scripts/learning_theory_cases.py
// section 3 (random-feature ridge on digits 3-vs-8, n_train = 178, alpha=1e-8,
// RS=0, sklearn 1.8.0). These are the actual test MSEs, not a schematic.
const CURVE: [number, number][] = [
  [5, 0.20558], [10, 0.13321], [20, 0.11075], [40, 0.09890], [80, 0.09293],
  [89, 0.11053], [168, 0.59699], [178, 4.77846], [188, 2.29122],
  [356, 0.03583], [712, 0.02270], [4000, 0.01800],
];
const N_TRAIN = 178;

const FW = 380, FH = 210, PD = { l: 44, r: 14, t: 16, b: 34 };
const x0 = PD.l, x1 = FW - PD.r, y0 = FH - PD.b, y1 = PD.t;
const LX0 = Math.log10(5), LX1 = Math.log10(4000);
const LY0 = Math.log10(0.015), LY1 = Math.log10(6);
const px = (p: number) => x0 + ((Math.log10(p) - LX0) / (LX1 - LX0)) * (x1 - x0);
const py = (m: number) => y0 - ((Math.log10(m) - LY0) / (LY1 - LY0)) * (y0 - y1);
const PTS = CURVE.map(([p, m]) => `${px(p).toFixed(2)},${py(m).toFixed(2)}`).join(" ");

function DoubleDescentFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Double descent, measured
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        random-feature ridge on digits 3 vs 8 · n = {N_TRAIN} · both axes log
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />

        <line x1={px(N_TRAIN)} y1={y1} x2={px(N_TRAIN)} y2={y0} stroke="var(--bad)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
        <text x={px(N_TRAIN) + 4} y={y1 + 11} fontSize={9} fill="var(--bad)">p = n</text>

        <polyline points={PTS} fill="none" stroke="var(--brand-2)" strokeWidth={2} />
        {CURVE.map(([p, m]) => (
          <circle key={p} cx={Number(px(p).toFixed(2))} cy={Number(py(m).toFixed(2))} r={3} fill="var(--brand-2)" />
        ))}

        <text x={px(80) - 4} y={py(0.09293) + 16} fontSize={9} fill="var(--muted)" textAnchor="middle">classical best</text>
        <text x={px(4000)} y={py(0.018) - 9} fontSize={9} fill="var(--good)" textAnchor="end">5× better here</text>

        {[0.01, 0.1, 1].map((v) => (
          <text key={v} x={x0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v}</text>
        ))}
        <text x={x0 - 33} y={y1 + 48} fontSize={9.5} fill="var(--muted)" transform={`rotate(-90 ${x0 - 33} ${y1 + 48})`}>test MSE</text>
        {[10, 100, 1000].map((v) => (
          <text key={v} x={px(v)} y={y0 + 14} fontSize={9.5} fill="var(--faint)" textAnchor="middle">{v}</text>
        ))}
        <text x={(x0 + x1) / 2} y={y0 + 27} fontSize={10} fill="var(--muted)" textAnchor="middle">number of features p</text>
      </svg>
    </div>
  );
}

export default function BoundsBreakPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Stability", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 10 minutes"
        title={<>When the bounds break</>}
        intro={<>Everything in this track was developed before the models that now dominate the field. This last
          page is the honest accounting of what still holds, what fails, and what nobody has explained yet —
          including a curve we measured ourselves that the classical picture says cannot exist.</>}
      />

      <div className="lesson">
        <h2>Three uncomfortable facts</h2>
        <p>
          A modern network can have hundreds of times more parameters than training examples. Classical theory
          treats that as hopeless: capacity vastly exceeding data means the generalization bound is vacuous and
          overfitting is essentially guaranteed. What actually happens contradicts the prediction three separate
          ways.
        </p>

        <h3>1. They memorize random labels — and still generalize</h3>
        <p>
          Zhang et al. (2017) trained standard image networks on datasets whose labels had been replaced with
          random ones. The networks reached <strong>zero training error</strong>, fitting pure noise perfectly. So
          their Rademacher complexity is ≈ 1 and every uniform-convergence bound is vacuous. Yet the identical
          architectures trained on real labels generalize excellently.
        </p>
        <p>
          We reproduce this at small scale in <code>scripts/learning_theory_cases.py</code> — 4,000 random tanh
          features on digits, same class and same optimiser throughout:
        </p>
        <MathBlock>{String.raw`\begin{array}{lcc} & \text{train acc} & \text{test acc} \\ \text{true labels} & 1.0000 & 0.9667 \\ \text{random labels} & 1.0000 & 0.0870 \end{array}`}</MathBlock>
        <p>
          Chance is 0.10, so the random-label model learned exactly nothing and memorized everything. The class is
          demonstrably capable of fitting noise perfectly, and on real labels it is excellent. <strong>Capacity
          alone cannot be what determines generalization</strong> — if it were, the second row would make the first
          impossible.
        </p>

        <h3>2. The bounds are vacuous</h3>
        <p>
          As the <Link href="/learn/learning-theory/the-vc-bound" style={link}>VC bound page</Link> measured
          directly, even a humble linear model on MNIST-shaped inputs gets a guaranteed gap of 0.795 — worse than
          useless on a binary problem. For deep networks the numbers are far past 1. Considerable effort has gone
          into non-vacuous bounds (PAC-Bayes approaches by Dziugaite and Roy get genuinely non-trivial numbers for
          some networks), but nothing yet approaches the observed gaps for models in production.
        </p>

        <h3>3. Double descent</h3>
        <p>
          This is the strangest one, and rather than describe it we measured it. Ridge regression on random
          features, digits 3 versus 8, with <M>{String.raw`n = 178`}</M> training points, sweeping the number of
          features <M>p</M> through and far past <M>n</M>:
        </p>

        <DoubleDescentFigure />

        <p>
          Read the shape left to right. Up to about <M>{String.raw`p = 80`}</M> it is the textbook U-curve: test
          error falls, bottoming out at <strong>0.0929</strong>. Then it climbs, and at exactly the{" "}
          <strong>interpolation threshold</strong> <M>{String.raw`p = n = 178`}</M> it explodes to{" "}
          <strong>4.778</strong> — a fifty-fold blow-up, precisely where classical theory says things are at their
          worst.
        </p>
        <p>
          And then, instead of staying bad, it descends again. At <M>{String.raw`p = 4000`}</M> — more than twenty
          times the number of training points — test error is <strong>0.0180</strong>. That is more than{" "}
          <strong>five times better than the classical optimum</strong>, achieved by a model the U-curve says
          should be catastrophically over-parameterized. The bias–variance picture as usually drawn doesn&rsquo;t
          just mispredict the magnitude here; it has the wrong shape.
        </p>

        <Callout color={GRAY} title={<>The explanation, so far as there is one</>}>
          At <M>{String.raw`p = n`}</M> there is exactly <em>one</em> way to interpolate the data, and the model is
          forced to take it however wild it is — hence the spike. Once <M>{String.raw`p \gg n`}</M> there are
          infinitely many interpolating solutions, and the optimiser does not pick one at random: gradient descent
          and minimum-norm solvers select the <strong>smallest-norm</strong> one, which is smooth. So capacity kept
          growing while the <em>effective</em> capacity of what the algorithm actually returns went down. This is
          called <strong>implicit regularization</strong>, and it is the current best answer — the algorithm, not
          the class, is doing the capacity control. Which is, note, the same insight as the{" "}
          <Link href="/learn/learning-theory/algorithmic-stability" style={link}>stability chapter</Link>, and a
          reason to think the stability route is the more promising one.
        </Callout>

        <h2>So what survives?</h2>
        <p>
          A great deal, provided you hold it at the right altitude:
        </p>
        <ul>
          <li>
            <strong>The framework is right.</strong> Risk versus empirical risk, the approximation–estimation
            split, the necessity of inductive bias — none of this is threatened. No free lunch is a theorem; it
            isn&rsquo;t going anywhere.
          </li>
          <li>
            <strong>The mechanisms are real.</strong> Held-out evaluation, the cost of selecting on a test set,
            regularization as capacity control, early stopping, margins — all of these do what the theory says.
            They just aren&rsquo;t quantitatively predictable from the bounds.
          </li>
          <li>
            <strong>The failure is specific.</strong> What breaks is <em>uniform convergence over a class</em> as
            the route to a number for over-parameterized models. That is one technique, not the subject.
          </li>
        </ul>
        <p>
          And the open problem is now sharply stated, which is progress in itself: <strong>generalization in modern
          models is a property of the algorithm and the data together, not of the hypothesis class.</strong> The
          class is far too big to say anything useful about; SGD&rsquo;s implicit bias and the structure of real
          data are doing the work, and nobody has a complete account of either.
        </p>

        <Callout color={GRAY} title={<>What to actually carry out of this track</>}>
          Not numbers — <em>reflexes</em>. Ask which sample a score was computed on and whether it chose anything.
          Know that searching more hypotheses costs you, logarithmically. Recognize that a class that fits anything
          tells you nothing by fitting your data. Read regularization, early stopping, and averaging as one
          mechanism: reducing how much any single example can move your model. And treat every bound as a statement
          about <em>which quantity matters</em>, never as a promise about a number. Those five habits survive every
          failure on this page.
        </Callout>

        <Quiz
          accent={GRAY}
          title="Final test · the whole track"
          questions={[
            {
              q: <>A network reaches zero training error on randomly-labelled data. What follows about how it will do on the <em>real</em> labels?</>,
              options: [
                "It will overfit the real labels too — it has been shown to have excessive capacity",
                "Nothing follows; capacity this high makes uniform-convergence bounds vacuous, but the same architectures generalize excellently on real labels",
                "It will generalize well, since fitting hard problems proves it is powerful",
              ],
              answer: 1,
              explain: <>This is the central lesson of the last page. High capacity makes the <em>bound</em> vacuous — it stops being informative in either direction. Zhang et al.&rsquo;s networks memorize noise perfectly <em>and</em> generalize beautifully on real labels; our own reproduction gives 0.0870 on random labels versus 0.9667 on true ones, same class and optimiser. Capacity is not destiny, and it isn&rsquo;t merit either.</>,
            },
            {
              q: <>Across the whole track, what is the single mechanism shared by ridge regularization, early stopping, and bagging?</>,
              options: [
                "They all shrink the hypothesis class before training begins",
                "They all reduce how much any single training example can influence the final model",
                "They all reduce the training error",
              ],
              answer: 1,
              explain: <>That is the stability framing, and it&rsquo;s the tidiest unification the track offers. Ridge bounds one point&rsquo;s pull on the coefficients, early stopping limits how many times an example is visited, bagging averages away individual influence. Note none shrinks the class beforehand (ridge searches the full class, penalized) and all three typically <em>increase</em> training error — which is the point.</>,
            },
            {
              q: <>You've built a model and want to report an honest error bar. Which of these should you use?</>,
              options: [
                "The VC bound for your model class",
                "A held-out test set, evaluated once, sized via Hoeffding",
                "The Rademacher complexity estimated by fitting random labels",
              ],
              answer: 1,
              explain: <>The practical punchline of the entire track. The VC bound is real but vacuous at any realistic model size, and Rademacher complexity is a <em>capacity diagnostic</em>, not an error estimate. A held-out set gives a genuine <M>{String.raw`\pm\sqrt{\ln(2/\delta)/2n}`}</M> guarantee — provided it chose nothing, which is exactly the discipline chapter one was about. The theory&rsquo;s greatest practical contribution is explaining why that humble procedure is trustworthy.</>,
            },
          ]}
        />

        <p style={{ marginTop: "1.6rem" }}>
          That is the track. If you want the practical counterpart — how to <em>use</em> these ideas to choose
          among models, tune capacity, and run cross-validation without fooling yourself — that is the{" "}
          <Link href="/learn/model-selection" style={link}>model selection</Link> pillar, which picks up exactly
          where this leaves off.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/stability-implies-generalization", label: <>← Stability implies generalization</> }}
          next={{ href: "/learn/model-selection", label: <>Next pillar · Model selection →</> }}
        />
      </div>
    </article>
  );
}
