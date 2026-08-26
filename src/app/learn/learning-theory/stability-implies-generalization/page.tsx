import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "Stability implies generalization — Manifold",
  description:
    "The theorem that makes stability more than an intuition: a β-stable algorithm has expected generalization gap at most β, proved by a symmetry argument that fits in a paragraph. It also explains early stopping, bagging, and why ridge works.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function StabilityGeneralizationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Stability", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 7 minutes"
        title={<>Stability implies generalization</>}
        intro={<>One theorem, one short proof, and a satisfying amount of practice explained. This is the cleanest
          argument in the track — no growth functions, no symmetrization, no supremum over a class.</>}
      />

      <div className="lesson">
        <h2>The theorem</h2>
        <p>
          If <M>{String.raw`\mathcal A`}</M> has uniform stability <M>{String.raw`\beta`}</M>, then its expected
          generalization gap is at most <M>{String.raw`\beta`}</M>:
        </p>
        <MathBlock>{String.raw`\Big|\, \mathbb E_S\big[R(\mathcal A(S)) - \hat R_S(\mathcal A(S))\big] \,\Big| \;\le\; \beta`}</MathBlock>
        <p>
          That is the entire result. No capacity term, no <M>{String.raw`\ln|\mathcal H|`}</M>, no VC dimension —
          the class could be infinite and the statement is unchanged. Stability alone controls the gap.
        </p>

        <Proof title="the renaming trick, in full" color={GRAY}>
          <p>
            The proof turns on a symmetry so simple it feels like a sleight of hand, so it&rsquo;s worth doing
            slowly.
          </p>
          <p>
            <strong>Setup.</strong> Let <M>{String.raw`S = (z_1, \dots, z_n)`}</M> be the training sample and let{" "}
            <M>{String.raw`z'`}</M> be one extra independent draw from the same distribution. Write{" "}
            <M>{String.raw`S^{i}`}</M> for the sample with its <M>i</M>-th example <em>replaced</em> by{" "}
            <M>{String.raw`z'`}</M>.
          </p>
          <p>
            <strong>Step 1 — express the true risk.</strong> Since <M>{String.raw`z'`}</M> is a fresh draw,
          </p>
          <MathBlock>{String.raw`\mathbb E_S\big[R(\mathcal A(S))\big] = \mathbb E_{S, z'}\big[\ell(\mathcal A(S), z')\big].`}</MathBlock>
          <p>
            <strong>Step 2 — express the empirical risk.</strong> By linearity, and because every index is
            symmetric,
          </p>
          <MathBlock>{String.raw`\mathbb E_S\big[\hat R_S(\mathcal A(S))\big] = \mathbb E_S\left[\frac1n \sum_{i=1}^n \ell(\mathcal A(S), z_i)\right] = \mathbb E_{S}\big[\ell(\mathcal A(S), z_i)\big] \ \text{ for any fixed } i.`}</MathBlock>
          <p>
            <strong>Step 3 — the renaming.</strong> Here is the trick. The pair{" "}
            <M>{String.raw`(S, z')`}</M> and the pair <M>{String.raw`(S^i, z_i)`}</M> have{" "}
            <em>exactly the same distribution</em> — both consist of <M>{String.raw`n+1`}</M> i.i.d. draws, and all
            we have done is relabel which one we call &ldquo;the extra&rdquo;. Therefore
          </p>
          <MathBlock>{String.raw`\mathbb E_{S, z'}\big[\ell(\mathcal A(S), z')\big] = \mathbb E_{S, z'}\big[\ell(\mathcal A(S^i), z_i)\big].`}</MathBlock>
          <p>
            Read that carefully, because it is the crux. On the left, the algorithm trains <em>without</em>{" "}
            <M>{String.raw`z'`}</M> and is tested <em>on</em> it. On the right, the algorithm trains on a sample in
            which <M>{String.raw`z_i`}</M> has been swapped out, and is tested on{" "}
            <M>{String.raw`z_i`}</M>. Same distribution, different names.
          </p>
          <p>
            <strong>Step 4 — subtract.</strong> The generalization gap is now the difference between two
            expectations of the <em>same loss at the same point</em> <M>{String.raw`z_i`}</M>, differing only in
            whether the algorithm was trained on a sample containing <M>{String.raw`z_i`}</M> or one where it was
            replaced:
          </p>
          <MathBlock>{String.raw`\mathbb E_S\big[R - \hat R_S\big] = \mathbb E\big[\ell(\mathcal A(S^i), z_i) - \ell(\mathcal A(S), z_i)\big].`}</MathBlock>
          <p>
            <strong>Step 5 — apply stability.</strong> <M>{String.raw`S`}</M> and <M>{String.raw`S^i`}</M> differ
            in one example, so by definition the bracket is at most <M>{String.raw`\beta`}</M> in absolute value
            (formally, replacement is two deletions&rsquo; worth, absorbed into the constant). Hence the gap is at
            most <M>{String.raw`\beta`}</M>. <M>{String.raw`\blacksquare`}</M>
          </p>
          <p>
            No union bound, no capacity, no supremum. The whole argument is: <strong>generalization is the
            difference between testing on a point you trained on and one you didn&rsquo;t, and stability is exactly
            the statement that this difference is small.</strong> The two concepts are almost the same thing, seen
            from two directions — which is why the proof can be this short.
          </p>
        </Proof>

        <h2>Plugging in ridge regression</h2>
        <p>
          Ridge has stability <M>{String.raw`\beta = O(1/(\lambda n))`}</M>, so the theorem immediately gives an
          expected generalization gap of <M>{String.raw`O(1/(\lambda n))`}</M> — and notice what it doesn&rsquo;t
          contain. There is no dimension <M>d</M>. Ridge regression with a fixed penalty generalizes at a rate
          governed by <M>{String.raw`\lambda n`}</M> <em>however many features you have</em>, which the VC bound —
          scaling as <M>{String.raw`\sqrt{d/n}`}</M> — flatly fails to predict.
        </p>
        <p>
          This is not a small footnote. It is a case where the newer framework gives a strictly better answer for a
          method people actually deploy, and it explains something practitioners have long observed: ridge and
          lasso work in the <M>{String.raw`p \gg n`}</M> regime that classical theory says should be hopeless.
        </p>

        <h2>What else this explains</h2>
        <ul>
          <li>
            <strong>Early stopping.</strong> SGD&rsquo;s stability degrades with the number of steps taken. Stop
            earlier and you are literally more stable, hence a smaller gap. Early stopping is not merely
            &ldquo;stopping before it overfits&rdquo; — it is capacity control with a theorem attached, which is
            the same claim the boosting track makes empirically in{" "}
            <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link>.
          </li>
          <li>
            <strong>Bagging and averaging.</strong> Averaging many models trained on resamples reduces the
            influence any single example can have on the final output. That&rsquo;s a stability improvement by
            construction, and it&rsquo;s the theoretical shadow of the variance reduction the{" "}
            <Link href="/learn/random-forests/why-averaging-works" style={link}>random forests track</Link>{" "}
            derives from the correlation formula.
          </li>
          <li>
            <strong>Differential privacy implies generalization.</strong> A differentially private algorithm is by
            definition insensitive to any single record — which is a stability condition. So privacy guarantees
            hand you generalization guarantees for free, a connection that founded the field of adaptive data
            analysis and is the principled answer to the leaderboard problem from{" "}
            <Link href="/learn/learning-theory/the-union-bound-argument" style={link}>chapter one</Link>.
          </li>
        </ul>

        <Callout color={GRAY} title={<>The limitation, stated plainly</>}>
          Uniform stability is a demanding condition — it must hold for <em>every</em> sample and{" "}
          <em>every</em> deletion, worst case. Deep networks trained to convergence are <strong>not</strong>{" "}
          uniformly stable in this sense, so this framework does not rescue them either. Weaker notions
          (on-average stability, hypothesis stability) buy some ground, and they are an active research direction.
          But like every other chapter, this one stops short of explaining the models currently in production —
          which is where the track ends, next.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/learning-theory/algorithmic-stability", label: <>← Algorithmic stability</> }}
          next={{ href: "/learn/learning-theory/when-the-bounds-break", label: <>Next up · When the bounds break →</> }}
        />
      </div>
    </article>
  );
}
