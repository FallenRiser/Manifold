import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Empirical risk minimization — Manifold",
  description:
    "Minimize the error you can see. It's the principle behind essentially every model you've ever trained — and it fails catastrophically without a restricted hypothesis class, which is why inductive bias isn't optional.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ErmPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The PAC framework", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 8 minutes"
        title={<>Empirical risk minimization</>}
        intro={<>You&rsquo;ve been doing this the whole time. Every fit on this site — every least-squares line,
          every log-loss descent, every impurity-reducing split — is one principle with different loss functions
          plugged in. Here it is named, and here is the exact condition under which it is a catastrophe.</>}
      />

      <div className="lesson">
        <h2>The principle</h2>
        <p>
          You want to minimise <M>{String.raw`R(h)`}</M> and you can&rsquo;t see it. So minimise the thing you can
          see:
        </p>
        <MathBlock>{String.raw`\hat h \;=\; \arg\min_{h \in \mathcal H} \; \hat R_S(h) \;=\; \arg\min_{h \in \mathcal H} \; \frac{1}{n}\sum_{i=1}^{n} \ell(h(x_i), y_i)`}</MathBlock>
        <p>
          That is <strong>empirical risk minimization</strong>, and it is the entire recipe. Manifold&rsquo;s
          throughline — <em>every supervised model is a model form, a loss, and an optimiser</em> — is ERM with the
          three slots filled in. Linear regression is ERM with squared loss over linear functions.{" "}
          <Link href="/learn/logistic-regression/log-loss" style={link}>Logistic regression</Link> is ERM with log
          loss. An SVM is regularized ERM with hinge loss. A{" "}
          <Link href="/learn/decision-trees/growing-the-tree" style={link}>decision tree</Link> is greedy,
          approximate ERM over axis-aligned partitions. The differences between these models — the things that fill
          entire tracks — are choices of <M>{String.raw`\mathcal H`}</M> and <M>{String.raw`\ell`}</M>. The
          principle underneath never changes.
        </p>

        <h2>The catastrophe, and it&rsquo;s not subtle</h2>
        <p>
          Now let <M>{String.raw`\mathcal H`}</M> be unrestricted — <em>all</em> functions from inputs to labels —
          and run ERM honestly. Consider the hypothesis
        </p>
        <MathBlock>{String.raw`h_{\text{mem}}(x) \;=\; \begin{cases} y_i & \text{if } x = x_i \text{ for some } i \\ 1 & \text{otherwise} \end{cases}`}</MathBlock>
        <p>
          It has <strong>zero empirical risk</strong>. It is a perfect minimiser — ERM has done its job flawlessly
          and cannot be faulted on its own terms. And on continuous data, where a fresh <M>x</M> never coincides
          with a training point, its true risk is that of always answering 1: no better than the base rate, and
          worse than a coin flip if the classes are balanced against it.
        </p>
        <p>
          This is not a pathological corner case. It is the honest description of what unconstrained ERM does, and
          it is why the phrase &ldquo;just minimise training error&rdquo; is incomplete to the point of being
          wrong. <strong>ERM is only a learning principle when paired with a restricted{" "}
          <M>{String.raw`\mathcal H`}</M></strong>. The restriction is not a regrettable practical compromise; it
          is the part that does the learning.
        </p>

        <Callout color={GRAY} title={<>The circle finally closes</>}>
          <Link href="/learn/learning-theory/no-free-lunch" style={link}>No free lunch</Link> said generalization is
          impossible without assumptions. ERM says minimise what you can see. Put them together and you get the
          shape of every working learning algorithm: <strong>minimise empirical risk over a class small enough that
          uniform convergence holds.</strong> The class encodes the assumption; the bound prices it; the
          optimisation finds the winner. Three chapters of theory land on one sentence.
        </Callout>

        <h2>Two ways to shrink the class</h2>
        <p>
          &ldquo;Restrict <M>{String.raw`\mathcal H`}</M>&rdquo; comes in a hard flavour and a soft one, and you
          have used both.
        </p>
        <p>
          <strong>Hard constraint:</strong> declare the class outright — linear functions only, trees of depth at
          most 5, polynomials of degree at most 3. The bound then applies to that class directly.
        </p>
        <p>
          <strong>Soft constraint (regularized ERM):</strong> keep the big class but add a penalty that makes
          complicated members expensive:
        </p>
        <MathBlock>{String.raw`\hat h \;=\; \arg\min_{h \in \mathcal H} \; \hat R_S(h) \;+\; \lambda\,\Omega(h)`}</MathBlock>
        <p>
          Ridge takes <M>{String.raw`\Omega(h) = \|w\|_2^2`}</M>, lasso takes{" "}
          <M>{String.raw`\|w\|_1`}</M>, and tree pruning takes a leaf count. Every one of these is a way of saying{" "}
          <em>&ldquo;I&rsquo;ll consider a rich class, but you must pay for the rich parts&rdquo;</em> — which is
          equivalent, by Lagrangian duality, to searching a{" "}
          <Link href="/learn/regularized-regression/penalty-vs-constraint" style={link}>hard-constrained ball</Link>{" "}
          whose radius <M>{String.raw`\lambda`}</M> controls. Tuning <M>{String.raw`\lambda`}</M> is therefore
          literally tuning the size of your effective hypothesis class — which is why the model-selection story and
          the capacity story are the same story.
        </p>

        <h2>The loss you minimise is rarely the loss you care about</h2>
        <p>
          One honest complication, because it shapes every classifier you use. The loss in the PAC theory is 0/1 —
          count the mistakes. But minimising 0/1 loss over linear classifiers is <strong>NP-hard</strong>, and worse,
          0/1 loss has zero gradient almost everywhere, so gradient descent has nothing to descend.
        </p>
        <p>
          So in practice nobody minimises it. We minimise a convex <strong>surrogate</strong> that upper-bounds it:
          log loss for logistic regression, hinge loss for SVMs, exponential loss for AdaBoost. Each is convex, so
          the optimisation is tractable and has a{" "}
          <Link href="/learn/math-foundations/convexity" style={link}>unique minimum</Link>; each upper-bounds 0/1
          loss, so driving it down drives the error count down too.
        </p>

        <Proof title="what a surrogate actually guarantees, and what it doesn't" color={GRAY}>
          <p>
            Write the 0/1 loss of a real-valued score <M>{String.raw`f(x)`}</M> against label{" "}
            <M>{String.raw`y \in \{-1, +1\}`}</M> in terms of the <em>margin</em>{" "}
            <M>{String.raw`m = y f(x)`}</M>. A mistake is exactly <M>{String.raw`m \le 0`}</M>, so the 0/1 loss is
            the step function <M>{String.raw`\mathbb 1[m \le 0]`}</M>. The standard surrogates are all convex upper
            bounds on that step:
          </p>
          <MathBlock>{String.raw`\underbrace{\log_2(1 + e^{-m})}_{\text{logistic}}, \quad \underbrace{\max(0, 1-m)}_{\text{hinge}}, \quad \underbrace{e^{-m}}_{\text{exponential}} \;\;\ge\;\; \mathbb 1[m \le 0].`}</MathBlock>
          <p>
            Check the binding case at <M>{String.raw`m = 0`}</M>, where the step jumps to 1: logistic gives{" "}
            <M>{String.raw`\log_2 2 = 1`}</M>, hinge gives <M>{String.raw`\max(0,1) = 1`}</M>, exponential gives{" "}
            <M>{String.raw`e^0 = 1`}</M>. All three touch the step exactly there and lie above it elsewhere — which
            is precisely why the base-2 logarithm appears in the logistic version.
          </p>
          <p>
            The upper bound gives you the direction of the implication you want:
          </p>
          <MathBlock>{String.raw`\hat R^{0/1}_S(f) \;\le\; \hat R^{\text{surr}}_S(f),`}</MathBlock>
          <p>
            so a small surrogate risk <em>forces</em> a small error count. Combined with a generalization bound on
            the surrogate risk, you get a genuine guarantee on the true 0/1 risk. That chain is the formal
            justification for training on log loss and reporting accuracy.
          </p>
          <p>
            <strong>Now the honest caveat.</strong> The implication runs one way only. A <em>large</em> surrogate
            loss does not imply a large error count — a classifier can get every label right while a single
            confidently-wrong outlier keeps the exponential loss enormous. This asymmetry is not academic: it is why
            AdaBoost&rsquo;s <M>{String.raw`e^{-m}`}</M> loss, which punishes negative margins exponentially, is
            notoriously sensitive to mislabeled points, while hinge loss — which grows only linearly — is not. When
            you choose a surrogate you are choosing how hysterically to react to your worst example.
          </p>
        </Proof>

        <Quiz
          accent={GRAY}
          title="Chapter checkpoint · The PAC framework"
          questions={[
            {
              q: <>A colleague proposes skipping model restrictions entirely: &ldquo;use the richest possible class and just minimise training error — ERM is provably the right principle.&rdquo; What breaks?</>,
              options: [
                "Nothing breaks; ERM over the richest class is optimal, just slow to compute",
                "ERM over an unrestricted class returns a memorizer with zero training error and no generalization at all",
                "ERM requires a convex loss, and rich classes aren't convex",
              ],
              answer: 1,
              explain: <>The memorizing hypothesis attains <em>zero</em> empirical risk, so ERM has succeeded perfectly on its own terms while learning nothing — on continuous inputs its true risk is the base rate. ERM is a learning principle only when paired with a restricted class; the restriction is what does the learning, not a compromise on the way to it.</>,
            },
            {
              q: <>Your model has 18% training error and 19% test error. Which term dominates, and what should you reach for?</>,
              options: [
                "Estimation error — get more data or regularize harder",
                "Approximation error — the class is too poor, so enrich it or improve the features",
                "Neither; a small train/test gap means the model is performing optimally",
              ],
              answer: 1,
              explain: <>The tiny gap says estimation error is already small — you are finding nearly the best member of your class. The problem is that the best member is bad, which is approximation error, and it is <strong>completely insensitive to sample size</strong>. More data will move essentially nothing here. A richer class, better features, or accepting that you're near the Bayes floor are the real options.</>,
            },
            {
              q: <>Why is logistic regression trained on log loss rather than on the error count it's actually judged by?</>,
              options: [
                "Log loss gives a better final accuracy than minimising the error count would",
                "Minimising 0/1 loss is NP-hard and has zero gradient almost everywhere; log loss is a convex upper bound that's tractable",
                "0/1 loss can't be computed on a training set",
              ],
              answer: 1,
              explain: <>0/1 loss is perfectly computable — it&rsquo;s just useless to optimise: flat almost everywhere, so no gradient, and NP-hard to minimise exactly over linear classifiers. Convex surrogates that upper-bound it make the problem tractable while ensuring a small surrogate loss forces a small error count. Note the implication runs one way: small surrogate ⇒ small error count, never the reverse.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/learning-theory/agnostic-pac", label: <>← Agnostic PAC &amp; the Bayes floor</> }}
          next={{ href: "/learn/learning-theory/when-counting-fails", label: <>Next up · When counting hypotheses fails →</> }}
        />
      </div>
    </article>
  );
}
