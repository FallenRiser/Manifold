import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Gradient boosting for classification — Manifold",
  description:
    "Classification boosting works in log-odds space: start at the base rate, and every tree's pseudo-residual is the gap between the true label and the current predicted probability. A softmax over K accumulated scores handles many classes.",
};

const TREES = "var(--c-trees)";

export default function GbmClassificationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Gradient boosting for classification</>}
        intro={<>
          Nothing about the machine changes for classification — it still fits regression trees to negative
          gradients. What changes is <em>where</em> the model lives: not in probability space but in{" "}
          <strong>log-odds space</strong>, with a logistic squashing at the end. The pseudo-residuals turn out to
          be gloriously simple.
        </>}
      />

      <div className="lesson">
        <h2>The model predicts a score, not a probability</h2>
        <p>
          The additive model <M>{String.raw`F(x) = F_0 + \nu\sum_m h_m(x)`}</M> outputs an unbounded real number —
          a <strong>log-odds score</strong>. A logistic function converts it to a probability only at the end:
        </p>
        <MathBlock>{String.raw`p(x) = \sigma\big(F(x)\big) = \frac{1}{1 + e^{-F(x)}}`}</MathBlock>
        <p>
          Boosting the score rather than the probability keeps every step in an unconstrained space where adding
          trees is well-behaved — you never have to worry about a prediction leaving <M>{String.raw`[0,1]`}</M>.
        </p>

        <h2>The initial guess is the base rate</h2>
        <p>
          The best constant under log-loss is the <strong>log-odds of the class balance</strong>:{" "}
          <M>{String.raw`F_0 = \ln\frac{p_+}{1-p_+}`}</M>, where <M>{String.raw`p_+`}</M> is the fraction of
          positives. If 38% of passengers survived, <M>{String.raw`F_0 = \ln(0.38/0.62) \approx -0.49`}</M> and
          every prediction starts at the base rate before a single tree is added — the sensible null model.
        </p>

        <h2>The pseudo-residual is (label − probability)</h2>
        <p>
          Take the log-loss <M>{String.raw`L = -[\,y\ln p + (1-y)\ln(1-p)\,]`}</M> with{" "}
          <M>{String.raw`y \in \{0,1\}`}</M> and differentiate with respect to the score{" "}
          <M>{String.raw`F`}</M>. After the chain rule collapses beautifully:
        </p>
        <MathBlock>{String.raw`-\frac{\partial L}{\partial F} = y - \sigma(F) = y - p`}</MathBlock>
        <p>
          The negative gradient is just <strong>how wrong the current probability is</strong>. If the truth is 1
          and the model says <M>{String.raw`p=0.7`}</M>, the pseudo-residual is <M>{String.raw`+0.3`}</M> — the
          next tree learns to nudge this example&rsquo;s score up. It is the exact classification analogue of{" "}
          &ldquo;fit the residual,&rdquo; with <em>probability error</em> playing the role of residual. Confidently
          correct points (<M>{String.raw`p\approx y`}</M>) contribute almost nothing; the trees concentrate on the
          contested boundary.
        </p>

        <Callout color={TREES} title={<>The leaf value needs a Newton step</>}>
          For squared error a leaf&rsquo;s optimal value was just the mean residual. For log-loss it isn&rsquo;t —
          the relationship between score and loss is curved. Gradient boosting sets each leaf value with a
          one-step Newton update, dividing the summed gradient by the summed <em>Hessian</em>{" "}
          <M>{String.raw`\sum p(1-p)`}</M> of the points in the leaf. Hold that thought: making the Hessian a
          first-class citizen of the whole tree-building process — not just the leaf values — is exactly{" "}
          <Link href="/learn/boosting/newton-boosting" style={link}>XGBoost&rsquo;s</Link> central idea.
        </Callout>

        <h2>Many classes: one function per class + softmax</h2>
        <p>
          For <M>{String.raw`K`}</M> classes, boosting maintains <M>{String.raw`K`}</M> parallel additive scores{" "}
          <M>{String.raw`F_1(x),\dots,F_K(x)`}</M> and converts them with a softmax,{" "}
          <M>{String.raw`p_k = e^{F_k}/\sum_j e^{F_j}`}</M>. Each round fits <M>{String.raw`K`}</M> regression
          trees, one per class, to the per-class pseudo-residuals <M>{String.raw`y_{ik} - p_{ik}`}</M> (with{" "}
          <M>{String.raw`y_{ik}`}</M> the one-hot label). That is why a multiclass GBM trains{" "}
          <M>{String.raw`K`}</M> times as many trees as a binary one — worth knowing when you eye the fit time.
        </p>

        <h2>On real data</h2>
        <p>
          Histogram gradient boosting on the forest-cover-type task (25k rows, 7 classes), the same data the
          random forest scored 0.847 on:
        </p>
        <CodeOutput label="HistGradientBoostingClassifier — covtype, defaults">{`test accuracy 0.783   log-loss 0.659
(random forest reference: 0.847)`}</CodeOutput>
        <p>
          Read that honestly: <strong>out of the box, boosting here <em>loses</em> to the forest.</strong> Its
          auto early-stopping halts after only a handful of rounds, underfitting a dataset that rewards deep
          feature interactions. This is not a failure of boosting but a preview of its defining trait — it has a
          higher ceiling <em>and</em> more knobs, so defaults rarely find the ceiling. Give it more capacity and
          the right library and it climbs past the forest to 0.865; that is the{" "}
          <Link href="/learn/boosting/case-a-tabular" style={link}>case study</Link>, and the tuning it needs is
          the <Link href="/learn/boosting/shrinkage" style={link}>next chapter</Link>.
        </p>

        <Quiz
          title="Can you answer these?"
          accent={TREES}
          questions={[
            {
              q: <>In binary gradient boosting with log-loss, what is the pseudo-residual for an example?</>,
              options: ["y − p, the label minus the current predicted probability", "The class label y itself", "Always +1 or −1"],
              answer: 0,
              explain: <>The negative gradient of log-loss w.r.t. the score is exactly y − σ(F) = y − p — how far the current probability is from the truth.</>,
            },
            {
              q: <>What does the additive model F(x) directly output before the final squashing?</>,
              options: ["A probability in [0,1]", "A log-odds score in (−∞, ∞)", "A class label"],
              answer: 1,
              explain: <>Boosting accumulates an unbounded log-odds score; σ(F) turns it into a probability only at the end, keeping every additive step unconstrained.</>,
            },
            {
              q: <>Why does a 7-class GBM fit roughly 7× as many trees as a binary one for the same n_estimators?</>,
              options: [
                "It uses deeper trees",
                "It maintains one additive score per class and fits one tree per class each round",
                "Multiclass needs more rounds to converge",
              ],
              answer: 1,
              explain: <>Each boosting round fits K regression trees — one per class — to the per-class pseudo-residuals y_k − p_k, combined with a softmax.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/boosting/loss-functions", label: <>← Loss functions &amp; robustness</> }}
          next={{ href: "/learn/boosting/shrinkage", label: <>Next up · The learning rate &amp; shrinkage →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
