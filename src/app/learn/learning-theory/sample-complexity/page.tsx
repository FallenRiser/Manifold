import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { SampleComplexityLab } from "@/components/labs/SampleComplexityLab";

export const metadata = {
  title: "Sample complexity — Manifold",
  description:
    "How much data does a hypothesis class actually need? The answer is logarithmic in the size of the class, logarithmic in the confidence, and quadratic in the accuracy you demand — and that last exponent is where all the money goes.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SampleComplexityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The PAC framework", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 7 minutes"
        title={<>Sample complexity</>}
        intro={<>The question every project actually starts with, asked precisely: how many examples do I need? The
          three inputs to the answer are priced wildly differently, and knowing which one is expensive changes what
          you negotiate for.</>}
      />

      <div className="lesson">
        <h2>The number, and the three prices</h2>
        <p>
          <strong>Sample complexity</strong> is the smallest <M>n</M> for which a PAC guarantee holds — the data
          requirement as a function of what you demand. From the previous chapter, for a finite class:
        </p>
        <MathBlock>{String.raw`n_{\text{realizable}} \ge \frac{\ln|\mathcal H| + \ln(1/\delta)}{\varepsilon} \qquad n_{\text{agnostic}} \ge \frac{\ln|\mathcal H| + \ln(2/\delta)}{2\varepsilon^2}`}</MathBlock>
        <p>
          Three knobs, three completely different price tags — and it&rsquo;s worth naming them in order of how
          much they cost you:
        </p>
        <ul>
          <li>
            <strong>Confidence <M>{String.raw`\delta`}</M> is nearly free.</strong> It enters as{" "}
            <M>{String.raw`\ln(1/\delta)`}</M>. Going from 95% to 99.99% confidence — a thousand-fold reduction in
            failure probability — multiplies your data requirement by less than three. If someone offers you more
            certainty, take it; it&rsquo;s the cheapest thing on the menu.
          </li>
          <li>
            <strong>Class size <M>{String.raw`|\mathcal H|`}</M> is cheap.</strong> It enters as{" "}
            <M>{String.raw`\ln|\mathcal H|`}</M>, which — as the previous chapter showed — is a count of{" "}
            <em>bits</em>. A class a billion times larger costs you about twenty more bits, and twenty more bits is
            twenty more examples per unit of accuracy.
          </li>
          <li>
            <strong>Accuracy <M>{String.raw`\varepsilon`}</M> is where the money goes.</strong> It enters as{" "}
            <M>{String.raw`1/\varepsilon`}</M> at best and <M>{String.raw`1/\varepsilon^2`}</M> in the realistic
            case. Halving your error target doesn&rsquo;t double the data — it <em>quadruples</em> it.
          </li>
        </ul>

        <PredictPrompt
          accent={GRAY}
          prompt={<>You need to cut your target error from 4% to 2%, in the ordinary (agnostic) setting. Roughly what happens to the amount of data you need?</>}
          options={[
            "It doubles",
            "It quadruples",
            "It grows by about 40% — the square root of 2",
          ]}
        />

        <h2>Watch the exponent do its work</h2>
        <p>
          The lab plots both regimes on a log scale. Drag <M>{String.raw`\varepsilon`}</M> to the left and watch the
          two curves separate: they&rsquo;re different <em>shapes</em>, not different constants, so no amount of
          engineering closes the distance.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Park ε at 0.05 and note both numbers. Now drag ε down to 0.01 and watch how differently the two curves respond — then try dragging |H| across its whole range and see how little happens.</>}
          insight={<>The <M>{String.raw`|\mathcal H|`}</M> slider spans eight orders of magnitude and barely moves the curves; the <M>{String.raw`\varepsilon`}</M> slider spans one and moves them enormously. <strong>Precision is the expensive axis, and model size is not.</strong> That is the formal reason &ldquo;get more data&rdquo; is sound advice for a hard target and &ldquo;use a smaller model&rdquo; usually isn&rsquo;t.</>}
        >
          <SampleComplexityLab />
        </LabFrame>

        <h2>Why noise costs you a whole exponent</h2>
        <p>
          The jump from <M>{String.raw`1/\varepsilon`}</M> to <M>{String.raw`1/\varepsilon^2`}</M> is not a
          technical artifact — it&rsquo;s a real difference in the job being done, and it&rsquo;s worth being able
          to explain in one breath.
        </p>
        <p>
          In the <strong>realizable</strong> case you are <em>eliminating</em>. A hypothesis with error above{" "}
          <M>{String.raw`\varepsilon`}</M> has to survive every single training point, and its survival probability
          decays as <M>{String.raw`e^{-n\varepsilon}`}</M>. One counterexample is fatal, so evidence accumulates
          directly.
        </p>
        <p>
          In the <strong>agnostic</strong> case nothing is fatal. Every hypothesis makes mistakes, including the
          best one, so you can no longer eliminate — you have to <em>estimate</em> each hypothesis&rsquo;s error
          rate accurately enough to rank them. Estimation is governed by the standard error of a mean, which shrinks
          like <M>{String.raw`1/\sqrt n`}</M>. Setting <M>{String.raw`1/\sqrt n \approx \varepsilon`}</M> gives{" "}
          <M>{String.raw`n \approx 1/\varepsilon^2`}</M>. <strong>Elimination is exponential in the evidence;
          estimation is only quadratic.</strong> That&rsquo;s the whole story, and it&rsquo;s the same{" "}
          <M>{String.raw`1/\sqrt n`}</M> that governs every error bar you have ever computed.
        </p>

        <Callout color={GRAY} title={<>What this actually licenses you to say</>}>
          When a stakeholder asks &ldquo;can we get from 94% to 97%?&rdquo;, this is the arithmetic behind the
          honest answer. Halving the error rate typically means quadrupling the data — so if it took a year to
          collect what you have, the naive path to that target is four years. That reframes the conversation
          toward the things that <em>don&rsquo;t</em> obey this curve: better features, a class whose inductive
          bias actually matches the problem, or a different target. And it&rsquo;s the same reason the asteroid
          capstone concludes its{" "}
          <Link href="/learn/asteroid-hazard-capstone/limits" style={link}>PR-AUC plateau is a feature ceiling</Link>{" "}
          — more rows would not have bought the missing information.
        </Callout>

        <h2>The gap in the argument, again</h2>
        <p>
          Every bound on this page contains <M>{String.raw`\ln|\mathcal H|`}</M>, and every model you will ever
          train has <M>{String.raw`|\mathcal H| = \infty`}</M>. We keep circling this, so let&rsquo;s be precise
          about why it&rsquo;s not fatal. A linear classifier in the plane has uncountably many weight vectors —
          but on a training set of <M>n</M> points, it can only produce a <em>finite number of distinct labelings</em>.
          Hypotheses that agree on every point in your sample are indistinguishable to the bound, and counting
          those <em>behaviours</em> rather than parameters is what rescues everything. That&rsquo;s the next
          chapter, and it&rsquo;s the most important idea in the track.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/pac-learnability", label: <>← Probably approximately correct</> }}
          next={{ href: "/learn/learning-theory/agnostic-pac", label: <>Next up · Agnostic PAC &amp; the Bayes floor →</> }}
        />
      </div>
    </article>
  );
}
