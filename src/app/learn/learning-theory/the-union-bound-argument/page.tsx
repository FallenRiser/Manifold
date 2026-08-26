import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { UnionBoundLab } from "@/components/labs/UnionBoundLab";

export const metadata = {
  title: "The union bound argument — Manifold",
  description:
    "Hoeffding covers one hypothesis. To cover all of them at once you pay a union bound — and because the price enters through a logarithm, searching a thousand hypotheses costs far less than you'd fear, but never nothing.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function UnionBoundPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Generalization", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>The union bound argument</>}
        intro={<>The previous page left us stuck: the guarantee we have covers a hypothesis fixed in advance, and the
          hypothesis we care about was chosen by looking at the data. The repair is almost embarrassingly simple, and
          it is the template for nearly every bound in learning theory.</>}
      />

      <div className="lesson">
        <h2>The trick: stop trying to predict which one</h2>
        <p>
          We can&rsquo;t apply Hoeffding to <M>{String.raw`\hat h`}</M>, the hypothesis our algorithm returns,
          because <M>{String.raw`\hat h`}</M> depends on the sample. But notice what we <em>can</em> say. Whatever{" "}
          <M>{String.raw`\hat h`}</M> turns out to be, it&rsquo;s certainly <em>one of</em> the hypotheses in our
          class <M>{String.raw`\mathcal H`}</M>. So if we prove that <strong>every</strong> hypothesis in{" "}
          <M>{String.raw`\mathcal H`}</M> has a small gap simultaneously, then in particular the one we picked does
          — no matter how we picked it.
        </p>
        <p>
          This is the move that unlocks the whole field. Stop trying to reason about the chosen hypothesis and
          instead demand <strong>uniform convergence</strong>: a guarantee that holds across the entire class at
          once. We want to bound
        </p>
        <MathBlock>{String.raw`P\Big(\exists h \in \mathcal H : \big|\hat R_S(h) - R(h)\big| \ge \varepsilon\Big)`}</MathBlock>
        <p>
          — the probability that <em>anything at all</em> goes wrong anywhere in the class. And for that we need one
          fact from elementary probability.
        </p>

        <h2>The union bound</h2>
        <p>
          For any events <M>{String.raw`A_1, \dots, A_M`}</M>, however they overlap and whether or not they&rsquo;re
          independent:
        </p>
        <MathBlock>{String.raw`P\Big(\bigcup_{i=1}^{M} A_i\Big) \;\le\; \sum_{i=1}^{M} P(A_i)`}</MathBlock>
        <p>
          The chance that at least one bad thing happens is at most the sum of the chances of each. It&rsquo;s crude
          — it double-counts every overlap, and it&rsquo;s tight only when the events are disjoint — but it demands
          nothing whatsoever about dependence, which is exactly why it survives contact with hypotheses that are
          wildly correlated with each other.
        </p>

        <Proof title="uniform convergence over a finite class, start to finish" color={GRAY}>
          <p>
            Let <M>{String.raw`\mathcal H = \{h_1, \dots, h_M\}`}</M> be finite, with{" "}
            <M>{String.raw`M = |\mathcal H|`}</M>, and let 0/1 loss be our loss. Define the bad event for a single
            hypothesis: <M>{String.raw`A_i = \{|\hat R_S(h_i) - R(h_i)| \ge \varepsilon\}`}</M>.
          </p>
          <p>
            <strong>Step 1 — bound each event.</strong> Each <M>{String.raw`h_i`}</M> is a fixed element of the
            class, specified before we drew the sample. So Hoeffding applies to each one individually:{" "}
            <M>{String.raw`P(A_i) \le 2e^{-2n\varepsilon^2}`}</M>. Note carefully what makes this legal — we fixed{" "}
            the <em>class</em> in advance, so every member of it was named before the data arrived, even though we
            don&rsquo;t yet know which one the algorithm will select.
          </p>
          <p>
            <strong>Step 2 — union over the class.</strong> The event &ldquo;some hypothesis has a large gap&rdquo;
            is the union <M>{String.raw`\bigcup_i A_i`}</M>, so
          </p>
          <MathBlock>{String.raw`P\Big(\exists h \in \mathcal H: |\hat R_S(h) - R(h)| \ge \varepsilon\Big) \;\le\; \sum_{i=1}^{M} P(A_i) \;\le\; 2M e^{-2n\varepsilon^2}.`}</MathBlock>
          <p>
            <strong>Step 3 — set the failure probability to <M>{String.raw`\delta`}</M> and invert.</strong> We
            want <M>{String.raw`2Me^{-2n\varepsilon^2} = \delta`}</M>. Taking logs,
          </p>
          <MathBlock>{String.raw`\ln(2M) - 2n\varepsilon^2 = \ln\delta \;\Longrightarrow\; 2n\varepsilon^2 = \ln\frac{2M}{\delta} \;\Longrightarrow\; \varepsilon = \sqrt{\frac{\ln M + \ln(2/\delta)}{2n}}.`}</MathBlock>
          <p>
            <strong>Step 4 — read it as a guarantee.</strong> With probability at least{" "}
            <M>{String.raw`1-\delta`}</M> over the draw of <M>S</M>, <em>simultaneously for every</em>{" "}
            <M>{String.raw`h \in \mathcal H`}</M>:
          </p>
          <MathBlock>{String.raw`\big|\hat R_S(h) - R(h)\big| \;\le\; \sqrt{\frac{\ln M + \ln(2/\delta)}{2n}}.`}</MathBlock>
          <p>
            Because it holds for every <M>h</M> at once, it holds for <M>{String.raw`\hat h`}</M> — the one your
            algorithm returns after staring at the data for as long as it likes. The dependence on <M>S</M> that
            broke the single-hypothesis argument is now harmless, because we never had to name{" "}
            <M>{String.raw`\hat h`}</M> in advance. <strong>That is the entire idea.</strong>
          </p>
        </Proof>

        <h2>Reading the price tag</h2>
        <p>
          The result of that derivation is the first real generalization bound in this track:
        </p>
        <MathBlock>{String.raw`\varepsilon(M, n, \delta) \;=\; \sqrt{\frac{\ln M + \ln(2/\delta)}{2n}}`}</MathBlock>
        <p>
          Compare it to the single-hypothesis bound, <M>{String.raw`\sqrt{\ln(2/\delta)/2n}`}</M>. The only change
          is the extra <M>{String.raw`\ln M`}</M> in the numerator — and <em>that logarithm is the good
          news</em>. The cost of searching is not proportional to how many hypotheses you tried; it&rsquo;s
          proportional to the log. Play with it below.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Hold n fixed and drag M from 1 to a million. Then drop n to a few hundred and drag M again — watch when the curve crosses into the red.</>}
          insight={<>Going from 1 hypothesis to 1,000,000 multiplies the error bar by only about ×2.6 — a logarithm is a very forgiving price. But it never stops growing, and with a small n the bound climbs past 0.5, at which point it &ldquo;guarantees&rdquo; a coin flip. A bound above 0.5 on a binary problem is <strong>vacuous</strong>: technically true, and worth nothing.</>}
        >
          <UnionBoundLab />
        </LabFrame>

        <p>
          Two practical readings fall straight out of that curve. First, <strong>a moderate search is nearly
          free</strong>. Tuning over a few hundred hyperparameter configurations barely widens the bar compared to
          committing to one model up front — which is the formal blessing for grid search. Second,{" "}
          <strong>the bar widens every time you look</strong>. Evaluating the twentieth variant on the same test set
          is not the same as evaluating the first, and if you keep going you will eventually find something that
          looks good and isn&rsquo;t. This is the leaderboard problem, and it&rsquo;s why a truly final test set
          gets touched once.
        </p>

        <Callout color={GRAY} title={<>The trap this formalizes</>}>
          &ldquo;We tried a few thresholds on the test set and picked the best&rdquo; is a union bound over
          thresholds — usually harmless, since <M>{String.raw`\ln M`}</M> is small. &ldquo;We ran a neural
          architecture search over 50,000 configurations and reported the winner&rsquo;s test score&rdquo; is a union
          bound over 50,000 hypotheses, and the honest error bar is{" "}
          <M>{String.raw`\sqrt{\ln(50000)/2n}`}</M> wider than the one reported. Nobody in either story did anything
          dishonest. The arithmetic simply doesn&rsquo;t care about intent.
        </Callout>

        <h2>Where this leaves us</h2>
        <p>
          We now have a genuine guarantee for a hypothesis chosen by looking at the data — the exact thing that
          looked impossible one page ago. It cost us a factor of <M>{String.raw`\ln M`}</M>, and it works for any
          finite class, any algorithm, and any dependence between hypotheses.
        </p>
        <p>
          The next page cashes it out into a statement about learning, and then the chapter after it confronts the
          obvious problem: <M>{String.raw`\ln M`}</M> is meaningless when <M>{String.raw`\mathcal H`}</M> is
          infinite, which it is for every model you have ever actually trained. A single linear classifier has
          uncountably many settings of its weights. Rescuing the argument from that is what{" "}
          <Link href="/learn/learning-theory/vc-dimension" style={link}>VC dimension</Link> is for.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/no-free-lunch", label: <>← No free lunch</> }}
          next={{ href: "/learn/learning-theory/finite-hypothesis-classes", label: <>Next up · Finite hypothesis classes →</> }}
        />
      </div>
    </article>
  );
}
