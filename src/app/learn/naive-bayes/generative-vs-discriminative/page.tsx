import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Generative vs discriminative — Manifold",
  description:
    "Generative models learn how the data is made and can even invent new samples; discriminative models learn only where to cut. The bias–variance trade that follows — and why it produces a crossover.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GenerativeVsDiscriminativePage() {
  const fromScratch = `# a GENERATIVE model knows what each class looks like -- so it can INVENT data
nb  = GaussianNB().fit(X_train, y_train)
rng = np.random.default_rng(0)

for c in (0, 1):
    # draw a fake "class c" point from its stored per-feature Gaussians
    fake = rng.normal(nb.theta_[c], np.sqrt(nb.var_[c]))
    print(f"synthetic class-{c} sample:", fake[:4].round(2), "...")

# logistic regression cannot do this -- it never modelled P(x|y), only the boundary`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Beginner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Generative vs discriminative</>}
        intro={<>Naive Bayes and logistic regression are often the first two classifiers you meet, and on the
          same data they can draw nearly identical boundaries. But they come from opposite philosophies. One
          learns <em>how the data is made</em>; the other learns only <em>where to cut</em>. That single
          difference decides which to reach for — and it decides it differently depending on how much data
          you have.</>}
      />

      <div className="lesson">
        <h2>Two ways to learn a classifier</h2>
        <p>
          A <strong>generative</strong> model — Naive Bayes is the canonical example — learns the full joint
          distribution of features and labels, factorised the way the last two pages set up:
        </p>

        <MathBlock>{String.raw`P(x, y) = P(y)\,P(x \mid y)`}</MathBlock>

        <p>
          It models the prior <M>{String.raw`P(y)`}</M> and the per-class likelihood{" "}
          <M>{String.raw`P(x \mid y)`}</M>. Because it has a model of what each class <em>looks like</em>, it
          could in principle draw a brand-new synthetic sample from a class. Classification is then a
          by-product: apply Bayes&rsquo; rule to flip the joint into <M>{String.raw`P(y \mid x)`}</M>.
        </p>
        <p>
          A <strong>discriminative</strong> model — <Link href="/learn/logistic-regression" style={link}>logistic
          regression</Link> is the canonical example — skips all that and models{" "}
          <M>{String.raw`P(y \mid x)`}</M> directly. It never forms an opinion about how the features are
          distributed. It learns only the boundary: given <M>{String.raw`x`}</M>, which side are you on? It
          cannot invent a sample, because it never learned what a class looks like.
        </p>

        <h2>See the difference: invent a data point</h2>
        <p>
          The cleanest way to feel &ldquo;generative&rdquo; is to use it for what its name promises. A fitted
          Naive Bayes stored a Gaussian for every feature of every class — so you can <em>sample</em> from
          those Gaussians and manufacture a fake example of any class you like. A discriminative model has
          nothing to sample from. Run it:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} />

        <Callout color={TEAL} title={<>The one-line distinction</>}>
          Generative models the <em>joint</em> <M>{String.raw`P(x, y)`}</M> — how each class makes its data —
          and derives the boundary from it. Discriminative models the <em>conditional</em>{" "}
          <M>{String.raw`P(y \mid x)`}</M> — the boundary itself — and nothing else. More knowledge versus more
          focus: that is the whole trade.
        </Callout>

        <h2>The consequence: bias against variance</h2>
        <p>
          Modelling the full generator is more knowledge, but it has a price. To write down{" "}
          <M>{String.raw`P(x \mid y)`}</M> you must <em>assume a form</em> for it — for Naive Bayes, that the
          features are Gaussian and (next page) conditionally independent. Those assumptions are rarely exactly
          true, so the generative model carries <strong>bias</strong>: a picture of the data that may be a
          little wrong, and no amount of data fully corrects it.
        </p>
        <p>
          In exchange, that commitment buys <strong>low variance</strong>. With only a handful of parameters to
          estimate — a few means, variances, and counts — it settles down on very little data, reaches its
          (biased) answer fast, and barely moves after. The discriminative model makes the opposite bargain:
          it assumes less, so lower bias, but fitting a flexible boundary directly means{" "}
          <strong>higher variance</strong> — noisy on little data, steadier only once it has plenty.
        </p>

        <h2>Why this produces a crossover</h2>
        <p>
          Put the two together and a prediction falls out. With <em>little</em> data, the low-variance
          generative model wins — its bias is a small price next to the discriminative model&rsquo;s wild
          swings. With <em>lots</em> of data, the discriminative model&rsquo;s variance shrinks away and its
          lower bias takes over, overtaking the generative model, which has already hit its biased ceiling. So
          as training size grows you expect the generative model ahead early, the discriminative model ahead
          late, and a <strong>crossover</strong> in between. That is the classic Ng&ndash;Jordan picture, and
          we measure exactly where it lands in{" "}
          <Link href="/learn/naive-bayes/vs-logistic-regression" style={link}>chapter 5</Link>.
        </p>

        <p style={{ color: "var(--muted)", fontSize: 14.5 }}>
          One aside worth keeping: the factorisation <M>{String.raw`P(x,y)=P(y)P(x\mid y)`}</M> is not itself an
          assumption — it is the definition of conditional probability rearranged. Every assumption Naive Bayes
          adds lives <em>inside</em> <M>{String.raw`P(x \mid y)`}</M>. And because the generative model gives
          you the whole joint, summing it over the classes even recovers the feature marginal{" "}
          <M>{String.raw`P(x) = \sum_y P(y)P(x \mid y)`}</M> — the evidence from the last page — for free.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What does a generative model learn that a discriminative one does not?</>,
              options: [
                "A lower training loss",
                "The full joint P(x,y) = P(y)P(x|y) — a model of how each class makes its data, from which it can even synthesise samples",
                "A larger number of features",
              ],
              answer: 1,
              explain: <>Generative models learn the joint by modelling the prior and per-class likelihood, so
                they know what each class looks like and can sample from it. Discriminative models learn only the
                boundary <M>{String.raw`P(y \mid x)`}</M>.</>,
            },
            {
              q: <>Why does the generative model tend to win with little data?</>,
              options: [
                "It has no bias, so it fits the truth exactly",
                "Its modelling assumptions give it low variance — few parameters, so it settles fast — which outweighs its bias when data is scarce",
                "It always has more parameters",
              ],
              answer: 1,
              explain: <>Committing to a form for <M>{String.raw`P(x \mid y)`}</M> means few parameters and low
                variance, so it reaches a stable answer with very little data — beating the discriminative
                model&rsquo;s high variance on sparse data, despite carrying bias.</>,
            },
            {
              q: <>Sweeping training size small → large, why expect a crossover?</>,
              options: [
                "The discriminative model's lower bias eventually overtakes the generative model, whose variance edge fades and whose biased ceiling stops it improving",
                "The generative model overfits as data grows",
                "The two models are mathematically identical",
              ],
              answer: 0,
              explain: <>Early on, low variance wins. As data grows the discriminative model&rsquo;s variance
                shrinks and its lower bias lets it keep improving past the generative model&rsquo;s biased
                asymptote — the crossover measured in chapter 5.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/prior-likelihood-posterior", label: <>← Prior, likelihood, posterior</> }}
          next={{ href: "/learn/naive-bayes/conditional-independence", label: <>Next up · The conditional independence assumption →</> }}
        />
      </div>
    </article>
  );
}
