import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { RademacherLab } from "@/components/labs/RademacherLab";

export const metadata = {
  title: "Rademacher complexity — Manifold",
  description:
    "Measure capacity by asking how well a class can fit pure noise. Unlike VC dimension it is distribution-dependent, estimable from your own data, and it gives tighter bounds — and it turns 'can this model memorize random labels?' into the definition itself.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RademacherPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Measuring capacity", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 9 minutes"
        title={<>Rademacher complexity</>}
        intro={<>A different way to ask how powerful a class is — not by counting what it could label in the worst
          case, but by testing how well it chases meaningless noise. It gives sharper bounds than VC dimension, and
          unlike VC dimension you can actually measure it on your own data.</>}
      />

      <div className="lesson">
        <h2>The idea, in one experiment</h2>
        <p>
          Here is a test you could run this afternoon. Take your training inputs and{" "}
          <strong>throw the labels away</strong>, replacing them with coin flips. Now fit your model as hard as you
          can. There is nothing to learn — the labels are noise, unrelated to the inputs — so any fit at all is
          pure pattern-chasing. <em>How well it does is a direct measurement of capacity.</em>
        </p>
        <p>
          A class too rigid to chase noise will do barely better than chance. A class rich enough to shatter your
          data will fit the noise perfectly, every time. That measurement is <strong>Rademacher
          complexity</strong>, and it is unusual among theoretical quantities in being something you can literally
          compute.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>You measure how well a class correlates with random labels, on a scale from 0 (chance) to 1 (perfect). What reading would you expect from a class rich enough to shatter your points?</>}
          options={[
            "About 0.5 — it's noise, so roughly half the labels should match",
            "Exactly 1.000, on every single draw of the coins",
            "It varies a lot from draw to draw",
          ]}
        />

        <h2>The definition</h2>
        <p>
          Let <M>{String.raw`\sigma = (\sigma_1, \dots, \sigma_n)`}</M> be independent <strong>Rademacher
          variables</strong> — each equally likely to be <M>{String.raw`+1`}</M> or <M>{String.raw`-1`}</M>. Given
          a fixed sample <M>{String.raw`S = (x_1, \dots, x_n)`}</M>, the <strong>empirical Rademacher
          complexity</strong> of <M>{String.raw`\mathcal H`}</M> is
        </p>
        <MathBlock>{String.raw`\hat{\mathfrak R}_S(\mathcal H) \;=\; \mathbb E_{\sigma}\left[\sup_{h \in \mathcal H} \frac{1}{n}\sum_{i=1}^{n} \sigma_i\, h(x_i)\right]`}</MathBlock>
        <p>
          Read it inside out. The sum is the <em>correlation</em> between the class member&rsquo;s predictions and
          the random signs. The <M>{String.raw`\sup`}</M> picks the class member that correlates best — the class
          trying its hardest to fit noise. The <M>{String.raw`\mathbb E_\sigma`}</M> averages over which noise it
          was handed. The result sits in <M>{String.raw`[0, 1]`}</M> for <M>{String.raw`\pm 1`}</M>-valued
          hypotheses: <strong>0 means the class is helpless against noise, 1 means it fits any noise
          perfectly.</strong>
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Leave capacity at 1 and flip the coins a few times — note how the number barely moves. Then walk the capacity slider up one notch at a time and watch where the reading goes.</>}
          insight={<>A single threshold still matches about ten of the fourteen coin flips — noise is easy to half-fit, which is why the scale bottoms out well above zero — and the complexity reads <strong>0.454</strong>. Push capacity to 13 and it reads <strong>1.000</strong> on every draw, matching all 14: the class shatters the points, so &ldquo;it fit the training data&rdquo; carries exactly zero information. This is a <em>capacity</em> measurement, not a performance one.</>}
        >
          <RademacherLab />
        </LabFrame>

        <p>
          The lab computes the inner supremum exactly, by dynamic programming over sign changes, and averages over
          200 draws of the coins — so the number displayed is the genuine empirical Rademacher complexity of that
          class on those points, not an illustration of one.
        </p>

        <h2>The bound</h2>
        <p>
          Rademacher complexity slots into a generalization bound as directly as VC dimension does, but with better
          constants and no growth-function detour. With probability at least <M>{String.raw`1-\delta`}</M>, for
          all <M>{String.raw`h \in \mathcal H`}</M> simultaneously:
        </p>
        <MathBlock>{String.raw`R(h) \;\le\; \hat R_S(h) \;+\; 2\,\hat{\mathfrak R}_S(\mathcal H) \;+\; 3\sqrt{\frac{\ln(2/\delta)}{2n}}`}</MathBlock>
        <p>
          Three terms, each with a clean meaning: how badly you did on the data you have, how much of that
          performance could have been noise-chasing, and a concentration term for the luck of the draw.
        </p>

        <Proof title="the symmetrization argument, and where the factor of 2 comes from" color={GRAY}>
          <p>
            The heart of the proof explains why Rademacher complexity appears <em>at all</em> — it is not
            postulated, it falls out. We bound the expected supremum of the gap:
          </p>
          <MathBlock>{String.raw`\mathbb E_S\left[\sup_{h}\big(R(h) - \hat R_S(h)\big)\right].`}</MathBlock>
          <p>
            <strong>Step 1 — introduce a ghost sample.</strong> Write{" "}
            <M>{String.raw`R(h) = \mathbb E_{S'}[\hat R_{S'}(h)]`}</M> for an independent sample{" "}
            <M>{String.raw`S'`}</M> of the same size. Then, pushing the expectation through the supremum with
            Jensen&rsquo;s inequality (legal because <M>{String.raw`\sup`}</M> is convex):
          </p>
          <MathBlock>{String.raw`\mathbb E_S\left[\sup_h \big(\mathbb E_{S'}[\hat R_{S'}(h)] - \hat R_S(h)\big)\right] \le \mathbb E_{S,S'}\left[\sup_h \big(\hat R_{S'}(h) - \hat R_S(h)\big)\right].`}</MathBlock>
          <p>
            <strong>Step 2 — swap points between the samples.</strong> Here is the trick. The two samples are
            i.i.d. from the same distribution, so exchanging the <M>i</M>-th point of <M>S</M> with the{" "}
            <M>i</M>-th point of <M>{String.raw`S'`}</M> leaves the joint distribution completely unchanged. That
            means we may attach an independent random sign to each swap without changing the expectation:
          </p>
          <MathBlock>{String.raw`\mathbb E_{S,S'}\left[\sup_h \frac{1}{n}\sum_i \big(\ell(h, z'_i) - \ell(h, z_i)\big)\right] = \mathbb E_{\sigma, S, S'}\left[\sup_h \frac{1}{n}\sum_i \sigma_i\big(\ell(h, z'_i) - \ell(h, z_i)\big)\right].`}</MathBlock>
          <p>
            <strong>Step 3 — split the supremum.</strong> Using{" "}
            <M>{String.raw`\sup(a + b) \le \sup a + \sup b`}</M> and the fact that <M>{String.raw`\sigma`}</M> and{" "}
            <M>{String.raw`-\sigma`}</M> have the same distribution, the two halves each give a Rademacher term:
          </p>
          <MathBlock>{String.raw`\le \; \mathbb E_{\sigma,S'}\left[\sup_h \frac{1}{n}\sum_i \sigma_i \ell(h, z'_i)\right] + \mathbb E_{\sigma,S}\left[\sup_h \frac{1}{n}\sum_i \sigma_i \ell(h, z_i)\right] \;=\; 2\,\mathfrak R_n(\mathcal H).`}</MathBlock>
          <p>
            <strong>That is the factor of 2</strong> — one Rademacher term for each of the two samples the
            symmetrization introduced. Nothing was assumed about the distribution anywhere, which is why the result
            is so general; and the random signs entered as a <em>bookkeeping device</em> for an exchange that
            doesn&rsquo;t change anything, not as an assumption about the data. The final step from expectation to
            a high-probability statement uses{" "}
            <Link href="/learn/math-foundations/azuma-mcdiarmid" style={link}>McDiarmid&rsquo;s inequality</Link>,
            since changing one sample point moves the supremum by at most <M>{String.raw`1/n`}</M> — which is
            exactly the bounded-differences condition McDiarmid needs, and precisely why that page exists in the
            concentration strand.
          </p>
        </Proof>

        <h2>Why it beats VC dimension</h2>
        <ul>
          <li>
            <strong>It knows about your distribution.</strong> VC dimension takes a maximum over all conceivable
            samples; Rademacher complexity is computed on the points you actually have. If your data lies on a
            gentle low-dimensional manifold, a class with enormous VC dimension can have small Rademacher
            complexity <em>on that data</em>, and the bound reflects it.
          </li>
          <li>
            <strong>It handles real-valued classes natively.</strong> VC dimension is defined for binary
            classifiers; extending it to regression needs fat-shattering dimensions and other machinery. Rademacher
            complexity needs no modification at all.
          </li>
          <li>
            <strong>It is estimable.</strong> You cannot compute the VC dimension of a random forest. You{" "}
            <em>can</em> estimate its Rademacher complexity: randomize the labels, refit, measure the fit. That is
            a Tuesday afternoon, not a research programme.
          </li>
          <li>
            <strong>It notices margins.</strong> Applied to margin-based losses it yields bounds that improve when
            a classifier is confident — the subject of the next chapter, and something VC dimension is blind to.
          </li>
        </ul>

        <Callout color={GRAY} title={<>The experiment that reframed the field</>}>
          In 2017 Zhang and co-authors ran exactly the lab&rsquo;s experiment on deep networks: replace ImageNet
          and CIFAR-10 labels with random ones and train. The networks reached{" "}
          <strong>zero training error</strong> — perfect memorization of pure noise — while the very same
          architectures, trained on real labels, generalized excellently. In Rademacher terms these classes have
          complexity ≈ 1, so the bound above is vacuous, and yet they work. Our own reproduction of this on digits
          is in <code>scripts/learning_theory_cases.py</code>: with 4,000 random features, random labels give train
          accuracy <strong>1.0000</strong> and test accuracy <strong>0.0870</strong> against a chance rate of 0.10,
          while real labels give <strong>1.0000</strong> and <strong>0.9667</strong>. Same class, same optimiser.{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>The final chapter</Link> takes
          this puzzle seriously.
        </Callout>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · Measuring capacity"
          questions={[
            {
              q: <>Lines in the plane fail to shatter three <em>collinear</em> points. Why is the VC dimension of linear classifiers in the plane still 3?</>,
              options: [
                "Because collinear points are a measure-zero edge case that the definition ignores",
                "Because the definition asks whether SOME set of size 3 is shattered, and a triangle is",
                "Because VC dimension counts parameters, and a 2-D line has three of them",
              ],
              answer: 1,
              explain: <>The definition is existential: <M>{String.raw`\exists`}</M> a shattered set of size <M>d</M>. A triangle is shattered, so <M>{String.raw`d \ge 3`}</M>; Radon&rsquo;s theorem kills every 4-point set, so <M>{String.raw`d < 4`}</M>. Collinear triples are irrelevant to the lower bound. (The parameter-count coincidence is real here but not the reason — the <M>{String.raw`\sin(\alpha x)`}</M> class has one parameter and infinite VC dimension.)</>,
            },
            {
              q: <>Sauer&rsquo;s lemma says the growth function is polynomial once <M>{String.raw`n > d`}</M>. Why does that specific fact make learning possible?</>,
              options: [
                "Because polynomials are easier to compute than exponentials",
                "Because ln(polynomial in n) grows like log n, which is beaten by the n in the denominator of the bound",
                "Because it proves the training error converges to zero",
              ],
              answer: 1,
              explain: <>The bound is <M>{String.raw`\sqrt{\ln \Pi(n)/n}`}</M>. If <M>{String.raw`\Pi(n) = 2^n`}</M> then <M>{String.raw`\ln \Pi(n) = n\ln 2`}</M> and the ratio is a constant — it never shrinks, no matter how much data you gather. Sauer makes <M>{String.raw`\ln \Pi(n) = O(d\log n)`}</M>, so the ratio goes to zero. Polynomial loses to exponential, and that race <em>is</em> generalization.</>,
            },
            {
              q: <>You randomize your training labels, refit, and the model reaches 100% training accuracy. What have you learned?</>,
              options: [
                "The model is broken — a correct implementation can't fit random labels",
                "The class has Rademacher complexity near 1 on this data, so its training score carries no information about generalization",
                "The model will definitely overfit on the real labels too",
              ],
              answer: 1,
              explain: <>Nothing is broken — this is a capacity measurement, and it came back high. The consequence is specifically about <em>what the training score can tell you</em>: a class that fits any labels fits yours too, so a good training score is not evidence of anything. It does <strong>not</strong> follow that the model will overfit the real labels — Zhang et al.&rsquo;s networks memorize noise and still generalize beautifully. That gap between what the bound permits and what actually happens is the open puzzle.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning-theory/the-vc-bound", label: <>← The VC generalization bound</> }}
          next={{ href: "/learn/learning-theory/margins", label: <>Next up · The margin, and why it buys confidence →</> }}
        />
      </div>
    </article>
  );
}
