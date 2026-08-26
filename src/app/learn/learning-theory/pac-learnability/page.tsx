import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "Probably approximately correct — Manifold",
  description:
    "Valiant's PAC framework turned 'this algorithm learns' into a provable statement by giving up on two impossible demands at once: perfect accuracy, and certainty. Both concessions are forced, and both are named in the acronym.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PacPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The PAC framework", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 7 minutes"
        title={<>Probably approximately correct</>}
        intro={<>The definition that turned machine learning into a mathematical subject. Its power comes from what
          it refuses to promise — and the two words it gives up are both sitting right there in the name.</>}
      />

      <div className="lesson">
        <h2>Two things you must give up</h2>
        <p>
          Suppose you want to prove a statement of the form &ldquo;this algorithm learns.&rdquo; The naive version
          would read: <em>after seeing enough examples, the algorithm outputs a hypothesis with zero error.</em>{" "}
          That statement is false for every algorithm, and it fails twice over.
        </p>
        <p>
          <strong>You cannot promise exactness.</strong> A finite sample can leave two hypotheses indistinguishable
          while they disagree on a rare region of the input space. If a case occurs with probability 0.001, a
          thousand-point sample will usually contain none of it, and nothing in the data can tell you how to label
          it. So we must settle for <em>approximately</em> correct: error at most{" "}
          <M>{String.raw`\varepsilon`}</M>, not zero.
        </p>
        <p>
          <strong>You cannot promise certainty.</strong> Even a perfect algorithm can be handed a freak sample —
          there is a real, if tiny, probability of drawing a thousand examples that are all wildly unrepresentative.
          No amount of cleverness defends against a bad draw. So we must settle for <em>probably</em>: the guarantee
          holds with probability at least <M>{String.raw`1-\delta`}</M> over the draw of the training set, not
          always.
        </p>
        <p>
          Concede exactly those two things and what remains is provable. That is Valiant&rsquo;s 1984 insight, and
          it won him a Turing Award: <strong>probably approximately correct</strong>.
        </p>

        <h2>The definition</h2>
        <p>
          A hypothesis class <M>{String.raw`\mathcal H`}</M> is <strong>PAC-learnable</strong> if there exists an
          algorithm <M>{String.raw`\mathcal A`}</M> and a function{" "}
          <M>{String.raw`n_{\mathcal H}(\varepsilon, \delta)`}</M> such that: for every distribution{" "}
          <M>{String.raw`\mathcal D`}</M>, every target concept in <M>{String.raw`\mathcal H`}</M>, and every{" "}
          <M>{String.raw`\varepsilon, \delta \in (0,1)`}</M>, running <M>{String.raw`\mathcal A`}</M> on at least{" "}
          <M>{String.raw`n_{\mathcal H}(\varepsilon, \delta)`}</M> i.i.d. examples returns a hypothesis{" "}
          <M>{String.raw`\hat h`}</M> satisfying
        </p>
        <MathBlock>{String.raw`P_{S \sim \mathcal D^n}\Big(R(\hat h) \le \varepsilon\Big) \;\ge\; 1 - \delta.`}</MathBlock>
        <p>
          Read the quantifiers slowly, because they carry the whole weight. The <M>{String.raw`\varepsilon`}</M> and{" "}
          <M>{String.raw`\delta`}</M> are chosen <em>by the user</em>, and the algorithm must cope with whatever they
          ask for — the guarantee is not &ldquo;there is some accuracy it achieves&rdquo; but &ldquo;name any
          accuracy and any confidence, and enough data exists.&rdquo;
        </p>

        <Callout color={GRAY} title={<>The quantifier that does the most work</>}>
          <strong>For every distribution <M>{String.raw`\mathcal D`}</M></strong>. The algorithm does not get to
          know the distribution, and must succeed on all of them — including adversarial ones designed against it.
          This is what makes PAC a <em>distribution-free</em> framework, and it&rsquo;s why the guarantees feel so
          strong and so pessimistic at once. It&rsquo;s also precisely how PAC coexists with{" "}
          <Link href="/learn/learning-theory/no-free-lunch" style={link}>no free lunch</Link>: we quantify over all
          distributions, but the target is restricted to <M>{String.raw`\mathcal H`}</M>. The assumption we were
          forced to make lives in the choice of class, exactly as promised.
        </Callout>

        <h2>Efficiency, and why it&rsquo;s a separate question</h2>
        <p>
          The definition above is about <em>information</em>: is there enough signal in <M>n</M> examples? A second,
          independent question is about <em>computation</em>: can you actually find the good hypothesis in
          reasonable time? A class is <strong>efficiently PAC-learnable</strong> if the algorithm additionally runs
          in time polynomial in <M>{String.raw`1/\varepsilon`}</M>, <M>{String.raw`1/\delta`}</M>, and the size of
          the input.
        </p>
        <p>
          These come apart in practice, and the gap is where a lot of real machine learning lives. Boolean
          conjunctions are efficiently PAC-learnable. General 3-term DNF formulas are <em>not</em> efficiently
          learnable in their own representation (it&rsquo;s NP-hard) yet become tractable if you allow the learner
          to output a hypothesis from a richer class — a striking result, and the theoretical ancestor of a habit
          you already have: <strong>relaxing the hypothesis class to make the optimisation easy</strong>. It&rsquo;s
          the same trade that makes{" "}
          <Link href="/learn/decision-trees/why-greedy" style={link}>greedy tree induction</Link> the practical
          answer to an NP-complete problem.
        </p>

        <Proof title="a full PAC proof, end to end, for boolean conjunctions" color={GRAY}>
          <p>
            Let&rsquo;s prove something is PAC-learnable rather than just define it. Take{" "}
            <M>{String.raw`\mathcal H`}</M> = conjunctions over <M>d</M> boolean variables (literals may appear
            plain, negated, or be absent), and assume the realizable case: the true labeling is some conjunction{" "}
            <M>{String.raw`c \in \mathcal H`}</M>.
          </p>
          <p>
            <strong>The algorithm (elimination).</strong> Start with the most specific hypothesis possible: the
            conjunction of <em>all</em> <M>{String.raw`2d`}</M> literals,{" "}
            <M>{String.raw`x_1 \wedge \bar x_1 \wedge \dots`}</M>, which is unsatisfiable and so labels everything
            negative. Then process the training examples: <em>ignore every negative example</em>, and for each
            positive example, delete from the hypothesis every literal that the example contradicts. Output whatever
            conjunction survives.
          </p>
          <p>
            <strong>It never errs on a positive.</strong> Every literal in the true concept <M>c</M> is satisfied by
            every positive example, so no literal of <M>c</M> is ever deleted — the output always contains{" "}
            <M>c</M>&rsquo;s literals, making it <em>more specific</em> than <M>c</M>. A more specific conjunction
            labels fewer things positive, so the only errors possible are <strong>false negatives</strong>: points
            that <M>c</M> calls positive but a surviving extra literal rejects.
          </p>
          <p>
            <strong>Bounding the error.</strong> An error therefore requires some literal <M>z</M> that survived
            training but is not in <M>c</M>. Call a literal <strong>bad</strong> if{" "}
            <M>{String.raw`p(z) = P\big(z \text{ is false} \wedge c(x) = 1\big) > \varepsilon/(2d)`}</M> — that is,
            it causes a false negative often enough to matter. A bad literal survives only if no training example
            ever deleted it, and each example deletes it with probability <M>{String.raw`p(z) > \varepsilon/2d`}</M>,
            so
          </p>
          <MathBlock>{String.raw`P(\text{a specific bad } z \text{ survives}) \le \Big(1 - \tfrac{\varepsilon}{2d}\Big)^n \le e^{-n\varepsilon/2d}.`}</MathBlock>
          <p>
            <strong>Union bound and inversion.</strong> There are at most <M>{String.raw`2d`}</M> literals, so the
            chance that <em>any</em> bad literal survives is at most{" "}
            <M>{String.raw`2d\,e^{-n\varepsilon/2d}`}</M>. If no bad literal survives, total error is at most{" "}
            <M>{String.raw`2d \cdot \varepsilon/(2d) = \varepsilon`}</M> by a union bound over the surviving
            literals. Setting <M>{String.raw`2d e^{-n\varepsilon/2d} \le \delta`}</M> and solving:
          </p>
          <MathBlock>{String.raw`n \;\ge\; \frac{2d}{\varepsilon}\Big(\ln(2d) + \ln\tfrac{1}{\delta}\Big).`}</MathBlock>
          <p>
            That is polynomial in <M>d</M>, <M>{String.raw`1/\varepsilon`}</M>, and{" "}
            <M>{String.raw`\ln(1/\delta)`}</M>, and the algorithm itself runs in <M>{String.raw`O(nd)`}</M> time. So
            conjunctions are <strong>efficiently PAC-learnable</strong>. Notice this bound is a factor{" "}
            <M>{String.raw`2d`}</M> worse than the generic <M>{String.raw`\ln|\mathcal H|/\varepsilon`}</M> count
            from the previous chapter — that&rsquo;s the price of analysing a <em>specific</em> algorithm&rsquo;s
            failure mode rather than assuming an oracle that returns any consistent hypothesis.
          </p>
        </Proof>

        <h2>What PAC gives you as a practitioner</h2>
        <p>
          It gives you a vocabulary precise enough to argue with. &ldquo;This model will work&rdquo; is not a claim;{" "}
          <em>&ldquo;with 95% confidence over the training draw, this class achieves error within 3 points of the
          best it can do, given 5,000 examples&rdquo;</em> is. Every clause is falsifiable and every clause names a
          resource you actually control. The next page turns the definition into that number.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/finite-hypothesis-classes", label: <>← Finite hypothesis classes</> }}
          next={{ href: "/learn/learning-theory/sample-complexity", label: <>Next up · Sample complexity →</> }}
        />
      </div>
    </article>
  );
}
