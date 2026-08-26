import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Why boosting doesn't overfit (usually) — Manifold",
  description:
    "AdaBoost keeps improving test error long after training error hits zero, which every classical theory forbids. The margin explanation resolves it — and then Breiman's counterexample shows the explanation is incomplete, which is the more honest and more interesting story.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: the shape everyone found impossible. Training error hits zero
// early and stays; test error keeps falling anyway. Illustrative shape of the
// classic AdaBoost observation, drawn schematically -- the axis is deliberately
// unlabelled in absolute terms because this is the QUALITATIVE phenomenon, not
// a measurement. Real measured curves for our own boosting runs live in the
// boosting track.
const FW = 380, FH = 176, P = { l: 40, r: 14, t: 16, b: 32 };
const fx0 = P.l, fx1 = FW - P.r, fy0 = FH - P.b, fy1 = P.t;
const ROUNDS = 100;
const px = (r: number) => fx0 + (r / ROUNDS) * (fx1 - fx0);
const py = (e: number) => fy0 - (e / 0.30) * (fy0 - fy1);

const trainPts: string[] = [];
const testPts: string[] = [];
for (let r = 1; r <= ROUNDS; r++) {
  const tr = Math.max(0, 0.22 * Math.exp(-r / 6));
  const te = 0.085 + 0.145 * Math.exp(-r / 9) + 0.028 * Math.exp(-r / 55);
  trainPts.push(`${px(r).toFixed(2)},${py(tr).toFixed(2)}`);
  testPts.push(`${px(r).toFixed(2)},${py(te).toFixed(2)}`);
}

function BoostingFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        The curve that broke the theory
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        schematic of AdaBoost&rsquo;s classic behaviour — the shape, not a measurement
      </div>
      <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width: "100%", maxWidth: FW, height: "auto", display: "block" }}>
        <rect x={fx0} y={fy1} width={fx1 - fx0} height={fy0 - fy1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={px(26)} y1={fy1} x2={px(26)} y2={fy0} stroke="var(--faint)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
        <text x={px(27)} y={fy1 + 12} fontSize={9} fill="var(--faint)">train error = 0 from here</text>

        <polyline points={testPts.join(" ")} fill="none" stroke="var(--brand-2)" strokeWidth={2} />
        <polyline points={trainPts.join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2} />

        <text x={px(66)} y={py(0.098) - 7} fontSize={9.5} fill="var(--brand-2)">test — still falling</text>
        <text x={px(46)} y={py(0.0) - 7} fontSize={9.5} fill="var(--muted)">train — flat at zero</text>

        {[0, 0.1, 0.2, 0.3].map((v) => (
          <text key={v} x={fx0 - 6} y={py(v) + 3.5} fontSize={9.5} fill="var(--faint)" textAnchor="end">{v.toFixed(1)}</text>
        ))}
        <text x={(fx0 + fx1) / 2} y={fy0 + 25} fontSize={10} fill="var(--muted)" textAnchor="middle">boosting rounds</text>
      </svg>
    </div>
  );
}

export default function BoostingMarginsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Margins", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Why boosting doesn&rsquo;t overfit (usually)</>}
        intro={<>An experimental result that contradicted everything the theory predicted, a beautiful explanation
          that resolved it, and then a counterexample that showed the explanation wasn&rsquo;t the whole truth. This
          is what a live scientific question looks like from the inside.</>}
      />

      <div className="lesson">
        <h2>The observation nobody could explain</h2>
        <p>
          Run <Link href="/learn/boosting/adaboost" style={link}>AdaBoost</Link> for a thousand rounds. Somewhere
          around round twenty or thirty the training error reaches zero — every training point is classified
          correctly and stays that way. Classical theory is unambiguous about what should happen next: each round
          adds another weak learner, capacity keeps climbing, empirical risk cannot improve because it&rsquo;s
          already zero, so the generalization gap must widen. Test error should rise.
        </p>
        <p>
          It doesn&rsquo;t. It keeps falling, often for hundreds of rounds after training error flatlines.
        </p>

        <BoostingFigure />

        <p>
          This was reported repeatedly in the mid-1990s and was genuinely embarrassing for the field. Occam&rsquo;s
          razor, VC theory, and the bias–variance story as usually told all predict the opposite. Something in the
          accounting was wrong.
        </p>

        <h2>The margin explanation</h2>
        <p>
          Schapire, Freund, Bartlett and Lee&rsquo;s 1998 resolution is elegant: <strong>training error is not the
          only thing still changing.</strong> AdaBoost&rsquo;s output is a weighted vote, so define its normalized
          margin on a point:
        </p>
        <MathBlock>{String.raw`\text{margin}(x_i, y_i) \;=\; \frac{y_i \sum_t \alpha_t h_t(x_i)}{\sum_t |\alpha_t|} \;\in\; [-1, 1]`}</MathBlock>
        <p>
          This is the weighted fraction of the ensemble voting correctly, rescaled to{" "}
          <M>{String.raw`[-1,1]`}</M>. Training error hitting zero only means every margin is <em>positive</em> —
          every point wins its vote. It says nothing about winning <em>by how much</em>. And AdaBoost, because its
          exponential loss keeps punishing small positive margins, goes right on pushing them upward round after
          round.
        </p>
        <p>
          Feed that into the previous page&rsquo;s bound. The margin distribution keeps improving, so{" "}
          <M>{String.raw`\hat R_\rho`}</M> keeps falling at any fixed <M>{String.raw`\rho`}</M> — and critically,
          the bound depends on the number of rounds <M>T</M> only through the weak learners&rsquo; complexity, not
          through <M>T</M> itself. More rounds, more confidence, no capacity penalty. The paradox dissolves.
        </p>

        <Proof title="the boosting margin bound, and what it does not contain" color={GRAY}>
          <p>
            For a convex combination of base classifiers from a class{" "}
            <M>{String.raw`\mathcal G`}</M> of VC dimension <M>d</M>, with probability{" "}
            <M>{String.raw`1-\delta`}</M>, for all <M>{String.raw`\rho > 0`}</M>:
          </p>
          <MathBlock>{String.raw`R(f) \;\le\; \hat R_\rho(f) \;+\; O\!\left(\sqrt{\frac{d}{n\rho^2}}\right) + \sqrt{\frac{\ln(1/\delta)}{2n}}`}</MathBlock>
          <p>
            <strong>Now look at what is absent.</strong> There is no <M>T</M>. The number of boosting rounds — the
            thing everyone assumed was driving capacity — does not appear anywhere in the bound. Only{" "}
            <M>d</M>, the complexity of a <em>single</em> weak learner, and <M>{String.raw`\rho`}</M>, the margin
            you achieve.
          </p>
          <p>
            The reason is that the class being bounded is the <strong>convex hull</strong> of{" "}
            <M>{String.raw`\mathcal G`}</M> — all weighted averages of base classifiers — and taking convex
            combinations does not increase Rademacher complexity. This is a genuinely surprising and load-bearing
            fact: <M>{String.raw`\mathfrak R_n(\text{conv}(\mathcal G)) = \mathfrak R_n(\mathcal G)`}</M>, exactly,
            because the supremum of a linear functional over a convex hull is always attained at an extreme point.
            Averaging a thousand stumps is, as far as capacity is concerned, no more expressive than one stump.
          </p>
          <p>
            AdaBoost also provably drives margins up: if every weak learner achieves edge{" "}
            <M>{String.raw`\gamma`}</M> over random guessing, the fraction of training points with margin below{" "}
            <M>{String.raw`\theta`}</M> decays exponentially in <M>T</M> for any{" "}
            <M>{String.raw`\theta < \gamma`}</M>. So as <M>{String.raw`T \to \infty`}</M>,{" "}
            <M>{String.raw`\hat R_\rho \to 0`}</M> for <M>{String.raw`\rho`}</M> up to roughly{" "}
            <M>{String.raw`\gamma`}</M> while the capacity term stays fixed. Test error should keep improving —
            exactly what the experiments showed.
          </p>
        </Proof>

        <h2>The honest ending: it isn&rsquo;t settled</h2>
        <p>
          The margin story is beautiful and it is not the whole truth. In 1999 Breiman took it seriously enough to
          test it directly: he built <strong>arc-gv</strong>, an algorithm designed to maximize the{" "}
          <em>minimum</em> margin more aggressively than AdaBoost does. If margins explain generalization, arc-gv
          should generalize better.
        </p>
        <p>
          It produced provably larger minimum margins — and <strong>worse test error</strong>. The theory&rsquo;s
          own prediction failed on its own terms.
        </p>
        <p>
          The current understanding is that the <em>whole margin distribution</em> matters, not just its minimum;
          arc-gv improves the worst margin while degrading the rest. Later work by Reyzin and Schapire also found
          that arc-gv used deeper trees, confounding the comparison — a reminder that even careful experiments
          carry hidden variables. Refinements based on average margin and margin variance predict better. But no
          version of the theory yet explains boosting&rsquo;s behaviour completely, and AdaBoost <em>can</em>{" "}
          overfit — reliably so on noisy data, where its exponential loss chases mislabeled points, which is the
          same sensitivity we flagged when comparing{" "}
          <Link href="/learn/learning-theory/empirical-risk-minimization" style={link}>surrogate losses</Link>. Our
          own boosting track has the practical version of this in{" "}
          <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link>.
        </p>

        <Callout color={GRAY} title={<>What to take from an unfinished story</>}>
          This is the most honest page in the track, and its lesson is methodological. A theory that explains an
          anomaly is not thereby proven — margins explained boosting&rsquo;s behaviour and then failed the
          experiment built specifically to test them. What survived is the <em>quantity</em>: margins are clearly
          part of the mechanism, clearly not all of it. Hold explanations the way you hold a bound — as a guide to
          which knob matters, not as a promise about a number. And note that the field&rsquo;s response to a failed
          prediction was to build the counterexample and publish it, which is the part worth imitating.
        </Callout>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · Margins"
          questions={[
            {
              q: <>Two linear classifiers achieve identical zero training error on the same separable data, one with a large margin and one grazing the nearest point. Why do the VC bounds of the previous chapter treat them identically?</>,
              options: [
                "Because they have the same training error and come from the same hypothesis class — the only two inputs a VC bound has",
                "Because VC dimension is undefined for separable data",
                "Because the margin classifier is actually in a larger hypothesis class",
              ],
              answer: 0,
              explain: <>A VC bound takes exactly two inputs: empirical risk and the class&rsquo;s capacity. Both are identical here, so the bound must be. Margin analysis adds a third input — <em>where in the class</em> your solution sits — which is precisely the information VC theory throws away.</>,
            },
            {
              q: <>The boosting margin bound contains no <M>T</M>, the number of rounds. What fact makes that possible?</>,
              options: [
                "AdaBoost stops adding meaningful learners after training error hits zero",
                "The Rademacher complexity of a convex hull equals that of the base class, so averaging more learners adds no capacity",
                "The weak learners are independent, so their complexities cancel",
              ],
              answer: 1,
              explain: <>Taking convex combinations does not increase Rademacher complexity — the supremum of a linear functional over a convex hull is attained at an extreme point. A thousand averaged stumps have the capacity of one stump. AdaBoost demonstrably <em>does</em> keep doing meaningful work after training error hits zero (it keeps raising margins), and the learners are highly dependent by construction, each fitting the previous one&rsquo;s mistakes.</>,
            },
            {
              q: <>Breiman&rsquo;s arc-gv achieved larger minimum margins than AdaBoost and generalized <em>worse</em>. What&rsquo;s the right conclusion?</>,
              options: [
                "Margin theory is refuted; margins are irrelevant to generalization",
                "The minimum margin alone is the wrong summary — the whole margin distribution matters, and the explanation remains incomplete",
                "The experiment must have been flawed, since the theorem is proved",
              ],
              answer: 1,
              explain: <>The bound is a valid theorem, so it can&rsquo;t be refuted by experiment — but it&rsquo;s an <em>upper</em> bound, and a looser bound doesn&rsquo;t force worse performance. What the experiment refuted is the <em>explanatory</em> claim that maximizing the minimum margin drives generalization. The distribution matters, later work found confounds in the tree depths, and the question is still genuinely open.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning-theory/margin-bounds", label: <>← Margin-based bounds</> }}
          next={{ href: "/learn/learning-theory/algorithmic-stability", label: <>Next up · Algorithmic stability →</> }}
        />
      </div>
    </article>
  );
}
