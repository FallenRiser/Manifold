import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Why AdaBoost works: exponential loss — Manifold",
  description:
    "AdaBoost looks like a heuristic — reweight, vote, repeat — but it is exactly forward stagewise minimisation of the exponential loss. Deriving the α and reweighting rules from that single loss demystifies the algorithm and reveals its one weakness: fragility to label noise.",
};

const TREES = "var(--c-trees)";

export default function ExpLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Why AdaBoost works: exponential loss</>}
        intro={<>
          For a decade after its invention, AdaBoost worked so well that its success was itself a puzzle. The
          resolution — due to Friedman, Hastie &amp; Tibshirani — is that AdaBoost is not a heuristic at all: it is
          coordinate-by-coordinate descent on one specific loss function. That single insight is the bridge from
          AdaBoost to <em>all</em> of gradient boosting.
        </>}
      />

      <div className="lesson">
        <h2>Forward stagewise additive modelling</h2>
        <p>
          Strip boosting down to its skeleton. We are building an additive model{" "}
          <M>{String.raw`F(x) = \sum_{m} \alpha_m h_m(x)`}</M>, and we build it <strong>greedily, one term at a
          time</strong>, never going back to adjust an earlier term. This template is called{" "}
          <em>forward stagewise additive modelling</em>: at each step, holding the model so far{" "}
          <M>{String.raw`F_{m-1}`}</M> fixed, choose the next weak learner and its weight to reduce the total
          loss as much as possible:
        </p>
        <MathBlock>{String.raw`(\alpha_m, h_m) = \arg\min_{\alpha, h} \sum_{i=1}^{n} L\big(y_i,\; F_{m-1}(x_i) + \alpha\, h(x_i)\big)`}</MathBlock>
        <p>
          Everything in this track is a choice of the loss <M>{String.raw`L`}</M> and a way of solving that
          inner minimisation. AdaBoost is one particular choice.
        </p>

        <h2>AdaBoost&rsquo;s loss is the exponential loss</h2>
        <p>
          Take the <strong>exponential loss</strong>, with labels <M>{String.raw`y \in \{-1,+1\}`}</M>:
        </p>
        <MathBlock>{String.raw`L(y, F) = e^{-y F(x)}`}</MathBlock>
        <p>
          This penalises the <em>margin</em> <M>{String.raw`yF`}</M>: confidently correct (large positive{" "}
          <M>{String.raw`yF`}</M>) costs almost nothing; confidently wrong (large negative{" "}
          <M>{String.raw`yF`}</M>) costs exponentially much. Substitute it into the stagewise objective and split
          the exponential:
        </p>
        <MathBlock>{String.raw`\sum_i e^{-y_i(F_{m-1}(x_i) + \alpha h(x_i))} = \sum_i \underbrace{e^{-y_i F_{m-1}(x_i)}}_{\displaystyle w_i^{(m)}} \, e^{-\alpha\, y_i h(x_i)}`}</MathBlock>
        <p>
          The factor <M>{String.raw`w_i^{(m)} = e^{-y_i F_{m-1}(x_i)}`}</M> depends only on the model so far, not
          on the new learner — so it acts as a fixed <strong>weight</strong> on example <M>{String.raw`i`}</M>.
          There are AdaBoost&rsquo;s weights, falling out of the loss rather than being posited. Examples the
          current ensemble already scores confidently and correctly have small <M>{String.raw`w_i`}</M>; examples
          it gets wrong have large <M>{String.raw`w_i`}</M>.
        </p>

        <h2>Minimising it gives the two rules</h2>
        <p>
          Because <M>{String.raw`y_i h(x_i) \in \{-1,+1\}`}</M>, the sum splits into correctly- and
          incorrectly-classified groups. Minimising over <M>{String.raw`h`}</M> for fixed{" "}
          <M>{String.raw`\alpha>0`}</M> is exactly <strong>minimising the weighted error</strong>{" "}
          <M>{String.raw`\varepsilon_m`}</M>; then minimising over <M>{String.raw`\alpha`}</M> by setting the
          derivative to zero yields
        </p>
        <MathBlock>{String.raw`\alpha_m = \tfrac12 \ln\frac{1-\varepsilon_m}{\varepsilon_m}`}</MathBlock>
        <p>
          — the exact vote from the previous page. And the weight recursion{" "}
          <M>{String.raw`w_i^{(m+1)} = w_i^{(m)} e^{-\alpha_m y_i h_m(x_i)}`}</M> is just the definition of{" "}
          <M>{String.raw`w_i`}</M> at the next step. <strong>Nothing in AdaBoost was arbitrary.</strong> The
          reweighting, the log-ratio vote, the sign trick — all of it is the mechanical consequence of doing
          forward stagewise descent on <M>{String.raw`e^{-yF}`}</M>.
        </p>

        <Callout color={TREES} title={<>Why exponential loss, of all losses?</>}>
          Because its population minimiser is beautiful: the <M>{String.raw`F`}</M> that minimises{" "}
          <M>{String.raw`\mathbb{E}[e^{-yF}]`}</M> is <M>{String.raw`F^\star(x) = \tfrac12 \ln\frac{P(y=1\mid x)}{P(y=-1\mid x)}`}</M>
          — half the log-odds. So AdaBoost, despite never mentioning probabilities, is implicitly estimating the
          log-odds, and <M>{String.raw`\operatorname{sign}(F)`}</M> recovers the Bayes-optimal decision. The
          exponential loss is a smooth, easy-to-optimise <em>surrogate</em> for the 0/1 error you actually care
          about.
        </Callout>

        <h2>The weakness this exposes</h2>
        <p>
          Seeing the loss also reveals AdaBoost&rsquo;s Achilles&rsquo; heel. Look again at{" "}
          <M>{String.raw`e^{-yF}`}</M>: a badly misclassified point (large negative margin) incurs an{" "}
          <em>exponentially</em> large loss and therefore an exponentially large weight. A mislabelled example —
          noise — is exactly such a point, and AdaBoost will pour ever more of the ensemble&rsquo;s attention onto
          it, chasing an error it can never fix. On clean data this aggressive focus is a strength; on noisy data
          it is a liability, and AdaBoost&rsquo;s accuracy degrades faster than gentler methods.
        </p>
        <p>
          The fix writes itself once you have the loss-function view: <strong>swap the loss</strong>. Replace the
          fragile exponential with the <Link href="/learn/logistic-regression" style={link}>logistic
          (log-)loss</Link>, whose penalty grows only <em>linearly</em> for large negative margins, and you get{" "}
          <strong>LogitBoost</strong> — and, more generally, the freedom to plug in <em>any</em> differentiable
          loss. That generalisation is <Link href="/learn/boosting/gradient-boosting" style={link}>gradient
          boosting</Link>, and it is where the rest of the track lives. AdaBoost is the special case of gradient
          boosting with exponential loss.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/adaboost", label: <>← AdaBoost by hand</> }}
          next={{ href: "/learn/boosting/margins", label: <>Next up · Margins &amp; resistance to overfitting →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
