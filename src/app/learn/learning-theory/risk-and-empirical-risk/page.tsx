import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { EmpiricalRiskLab } from "@/components/labs/EmpiricalRiskLab";

export const metadata = {
  title: "Risk, empirical risk & the gap — Manifold",
  description:
    "True risk is the average loss over the whole distribution; empirical risk is the average over your sample. Generalization is the study of the distance between them — and of the moment when choosing a hypothesis using the sample destroys the guarantee.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RiskPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Generalization", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Risk, empirical risk &amp; the gap</>}
        intro={<>Two numbers look almost identical on paper and mean completely different things. Getting the
          difference between them straight is the whole foundation — every bound in this track is a statement about
          the distance between these two quantities.</>}
      />

      <div className="lesson">
        <h2>The number you want</h2>
        <p>
          Somewhere out there is a distribution <M>{String.raw`\mathcal D`}</M> over pairs{" "}
          <M>{String.raw`(x, y)`}</M> — every loan application that could arrive, every asteroid that could be
          spotted, every photo someone could take. Your model <M>h</M> makes a mistake on some of them. The fraction
          it gets wrong, averaged over the whole distribution, is the <strong>true risk</strong> (also called the
          generalization error, or just the risk):
        </p>
        <MathBlock>{String.raw`R(h) \;=\; \mathbb E_{(x,y)\sim\mathcal D}\big[\ell(h(x), y)\big]`}</MathBlock>
        <p>
          For 0/1 loss this is exactly <M>{String.raw`P(h(x) \ne y)`}</M> — the probability the model is wrong on a
          fresh draw. This is the number you actually care about, the one that decides whether the system is any good.
          And you can never compute it. <M>{String.raw`\mathcal D`}</M> is not something you have; it is the world.
        </p>

        <h2>The number you have</h2>
        <p>
          What you have is a sample <M>{String.raw`S = \{(x_1,y_1), \dots, (x_n,y_n)\}`}</M> drawn from{" "}
          <M>{String.raw`\mathcal D`}</M>. Average the loss over just those points and you get the{" "}
          <strong>empirical risk</strong>:
        </p>
        <MathBlock>{String.raw`\hat R_S(h) \;=\; \frac{1}{n}\sum_{i=1}^{n} \ell(h(x_i), y_i)`}</MathBlock>
        <p>
          This one you can compute exactly — it&rsquo;s training error when <M>S</M> is the training set, test error
          when <M>S</M> is a held-out set. The entire practice of machine learning consists of manipulating{" "}
          <M>{String.raw`\hat R`}</M> and hoping <M>R</M> follows. Learning theory is the study of when that hope is
          justified.
        </p>

        <Callout color={GRAY} title={<>Same formula, different sample, different name</>}>
          Training error and test error are <em>both</em> empirical risk — the formula is identical. What separates
          them is one thing only: whether the sample was used to choose <M>h</M>. That single distinction, not the
          arithmetic, is why one of them is trustworthy and the other isn&rsquo;t. Hold onto it; the rest of this
          page is that sentence made precise.
        </Callout>

        <h2>For a hypothesis fixed in advance, the gap is tiny</h2>
        <p>
          Suppose you commit to a hypothesis <M>h</M> <em>before</em> seeing the data. Then each loss term{" "}
          <M>{String.raw`\ell(h(x_i), y_i)`}</M> is an independent draw from a fixed bounded distribution whose mean
          is <M>{String.raw`R(h)`}</M>, and <M>{String.raw`\hat R_S(h)`}</M> is just their average.
          That is precisely the setting of{" "}
          <Link href="/learn/math-foundations/hoeffding" style={link}>Hoeffding&rsquo;s inequality</Link>, which says
          the average of bounded independent terms clings to its mean with a failure probability that dies
          exponentially:
        </p>
        <MathBlock>{String.raw`P\Big(\big|\hat R_S(h) - R(h)\big| \ge \varepsilon\Big) \;\le\; 2e^{-2n\varepsilon^2}`}</MathBlock>
        <p>
          Turn it around and you get the form used everywhere in this track: with probability at least{" "}
          <M>{String.raw`1-\delta`}</M>,
        </p>
        <MathBlock>{String.raw`\big|\hat R_S(h) - R(h)\big| \;\le\; \sqrt{\frac{\ln(2/\delta)}{2n}}`}</MathBlock>

        <Proof title="inverting Hoeffding into a confidence bound" color={GRAY}>
          <p>
            Start from <M>{String.raw`P(|\hat R_S(h) - R(h)| \ge \varepsilon) \le 2e^{-2n\varepsilon^2}`}</M>. We want
            the right-hand side to be at most <M>{String.raw`\delta`}</M>, so that the bad event has probability at
            most <M>{String.raw`\delta`}</M> and the good event has probability at least{" "}
            <M>{String.raw`1-\delta`}</M>. Set them equal and solve for <M>{String.raw`\varepsilon`}</M>:
          </p>
          <MathBlock>{String.raw`2e^{-2n\varepsilon^2} = \delta \;\Longrightarrow\; e^{-2n\varepsilon^2} = \frac{\delta}{2} \;\Longrightarrow\; -2n\varepsilon^2 = \ln\frac{\delta}{2}.`}</MathBlock>
          <p>
            Multiply both sides by <M>{String.raw`-1`}</M>, using{" "}
            <M>{String.raw`-\ln(\delta/2) = \ln(2/\delta)`}</M>:
          </p>
          <MathBlock>{String.raw`2n\varepsilon^2 = \ln\frac{2}{\delta} \;\Longrightarrow\; \varepsilon = \sqrt{\frac{\ln(2/\delta)}{2n}}.`}</MathBlock>
          <p>
            So with probability at least <M>{String.raw`1-\delta`}</M> over the draw of <M>S</M>, the empirical risk
            is within <M>{String.raw`\sqrt{\ln(2/\delta)/2n}`}</M> of the true risk. Two features of this expression
            are worth noticing, because they recur on every later page. The dependence on the sample size is{" "}
            <M>{String.raw`n^{-1/2}`}</M> — to halve your error bar you need <em>four times</em> the data. The
            dependence on the confidence is <M>{String.raw`\sqrt{\ln(1/\delta)}`}</M>, which is extraordinarily
            cheap: going from 95% to 99.9% confidence multiplies the bar by well under two. Certainty is affordable;
            precision is not.
          </p>
        </Proof>

        <p>
          Put numbers on it. With <M>{String.raw`n = 2{,}000`}</M> and <M>{String.raw`\delta = 0.05`}</M> the bound
          is <M>{String.raw`\sqrt{\ln(40)/4000} \approx 0.030`}</M>. A test accuracy of 91% on two thousand held-out
          examples really does mean the true accuracy is 91% give or take about three points, at 95% confidence.{" "}
          <strong>This is the formal reason a held-out score means anything at all.</strong>
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>A thousand people each hand you a hypothesis, and every single one is a worthless coin flip with a true risk of exactly 0.50. You score all thousand on one sample and report the best-looking result. Where does that reported number land?</>}
          options={[
            "Right around 0.50 — they're all coin flips, so nothing changed",
            "Below 0.50 but inside the band — a little luck, no real harm",
            "Below 0.50 and outside the band — the guarantee is broken",
          ]}
        />

        <h2>Choose using the sample, and the guarantee evaporates</h2>
        <p>
          The lab below has one honest setup and one dishonest one. In the first, a single fixed hypothesis is
          measured on a fresh sample; slide <M>n</M> and watch the band tighten as{" "}
          <M>{String.raw`1/\sqrt n`}</M> while the measured risk stays loyal to 0.50. In the second, a thousand
          hypotheses — all pure coin flips, none better than any other — are measured, and the{" "}
          <em>best-looking</em> one is reported. Every number in it is simulated live from that setup — nothing is
          asserted that the lab doesn&rsquo;t derive in front of you.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Start with one fixed hypothesis and draw a few samples. Then switch to &ldquo;best of 1,000&rdquo; and draw again — watch where the marker goes, and whether it stays inside the band.</>}
          insight={<>Nothing was overfit and no hypothesis was any good — all thousand are coin flips with true risk 0.50. <strong>Selection alone</strong> pushed the reported score outside the band. And notice what the <M>n</M> slider does <em>not</em> fix: the violation persists at every sample size, because the selection bias and the band both shrink at exactly the same <M>{String.raw`1/\sqrt n`}</M> rate. More data is not the remedy. The wider band — the one that <em>does</em> hold — is the repair, and the next pages derive it.</>}
        >
          <EmpiricalRiskLab />
        </LabFrame>

        <p>
          This is the entire problem in miniature. Hoeffding&rsquo;s guarantee is about a hypothesis chosen{" "}
          <em>before</em> the sample is seen. The moment you use the sample to pick <M>h</M> — which is what training{" "}
          <em>is</em> — <M>h</M> is no longer independent of <M>S</M>, the loss terms are no longer a fixed set of
          independent draws, and the inequality simply doesn&rsquo;t apply. It isn&rsquo;t that the bound gets
          weaker. It doesn&rsquo;t hold.
        </p>

        <h2>The gap, named properly</h2>
        <p>
          Define the quantity this track is about — the <strong>generalization gap</strong> of a hypothesis:
        </p>
        <MathBlock>{String.raw`\text{gap}(h) \;=\; R(h) - \hat R_S(h)`}</MathBlock>
        <p>
          For a fixed <M>h</M> it&rsquo;s a small mean-zero wobble. For the <M>h</M> your algorithm actually
          returns — <M>{String.raw`\hat h`}</M>, the one chosen by looking at <M>S</M> — it is systematically
          positive: the chosen hypothesis looks better on the sample than it is in the world, because looking good on
          the sample is exactly the criterion by which it was chosen. Every remaining page in this track answers one
          question:
        </p>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--ink)", margin: "1.2rem 0 1.4rem", fontStyle: "italic" }}>
          how large can that gap be, for the hypothesis my algorithm actually picked?
        </p>
        <p>
          The next page rules out the laziest possible answer — &ldquo;maybe it&rsquo;s always small&rdquo; — and
          then the union bound gives us the first real one.
        </p>

        <Callout color={GRAY} title={<>Reach for this framing when</>}>
          Anyone shows you a number and calls it performance. The reflex worth building: <em>which sample was this
          computed on, and was that sample used to choose anything?</em> Model selection, threshold tuning, early
          stopping, feature selection, and &ldquo;we tried a few architectures&rdquo; are all choices — and every one
          of them spends the guarantee. This is the same failure the asteroid capstone measures on real data, where
          a leaky split inflated a forest&rsquo;s{" "}
          <Link href="/learn/asteroid-hazard-capstone/the-split" style={link}>PR-AUC from 0.478 to 0.566</Link>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory", label: <>← Why does learning work at all?</> }}
          next={{ href: "/learn/learning-theory/no-free-lunch", label: <>Next up · No free lunch →</> }}
        />
      </div>
    </article>
  );
}
