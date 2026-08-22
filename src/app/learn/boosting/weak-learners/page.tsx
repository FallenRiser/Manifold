import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Weak learners & the boosting question — Manifold",
  description:
    "Boosting was born from a theoretical question: if you have a learner that is only slightly better than a coin flip, can you combine many of them into one that is arbitrarily accurate? Schapire proved the answer is yes — and the constructive proof is the boosting algorithm.",
};

const TREES = "var(--c-trees)";

export default function WeakLearnersPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 1 · intuition", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Weak learners &amp; the boosting question</>}
        intro={<>
          Boosting is unusual among machine-learning methods: it began not as an algorithm looking for a use, but
          as the <em>answer</em> to a precise theoretical question. Understanding that question is the fastest way
          to understand what every boosting method is really doing.
        </>}
      />

      <div className="lesson">
        <h2>Strong vs weak learners</h2>
        <p>
          In the PAC (probably approximately correct) framework, a <strong>strong learner</strong> is the dream:
          given enough data, it can reach <em>any</em> target accuracy — error as close to zero as you like, with
          high probability. That is a demanding standard, and for most interesting problems we don&rsquo;t have an
          algorithm that clears it directly.
        </p>
        <p>
          A <strong>weak learner</strong> is a much humbler thing. It only has to do{" "}
          <em>slightly better than random guessing</em> — for a balanced two-class problem, achieve error{" "}
          <M>{String.raw`\le \tfrac12 - \gamma`}</M> for some small edge <M>{String.raw`\gamma>0`}</M>. A model
          that is right 51% of the time qualifies. A single <strong>decision stump</strong> — a tree with one
          split — is the canonical weak learner: it can almost always find <em>one</em> feature threshold that
          beats a coin flip, but on its own it is hopeless at the full problem.
        </p>

        <Callout color={TREES} title={<>Kearns &amp; Valiant&rsquo;s question (1988)</>}>
          <em>Are the weak and strong learnability the same thing?</em> Concretely: if all you have is a black box
          that reliably does a little better than chance, can you <strong>boost</strong> it — call it many times
          in some clever way — into a learner that is as accurate as you please? It was posed as an open problem,
          and most people expected the answer to be no.
        </Callout>

        <h2>Schapire&rsquo;s answer: yes</h2>
        <p>
          In 1990 Robert Schapire proved that weak and strong learnability are{" "}
          <strong>equivalent</strong>. If a class of problems is weakly learnable at all, it is strongly
          learnable. The proof was <em>constructive</em> — it didn&rsquo;t just assert that a strong learner
          exists, it showed how to build one out of the weak one. That construction was the first boosting
          algorithm. A year later Freund improved it, and in 1995 Freund &amp; Schapire distilled the idea into{" "}
          <strong>AdaBoost</strong>, the algorithm the next page builds by hand.
        </p>
        <p>
          The philosophical punchline is worth sitting with: <strong>there is no such thing as a learner that is
          reliably a little better than chance but fundamentally weak.</strong> Any edge, however small, can be
          amplified into arbitrary accuracy, provided you can keep finding that edge on the examples you are still
          getting wrong. Boosting is the machine that does the amplifying.
        </p>

        <h2>Why the edge has to be on the <em>hard</em> examples</h2>
        <p>
          Here is the catch that makes boosting subtle rather than trivial. Suppose you train one weak learner and
          it gets 30% of examples wrong. Training a second weak learner on the <em>same</em> data just reproduces
          roughly the same model and the same 30% — averaging clones buys nothing (this is exactly why a{" "}
          <Link href="/learn/random-forests/decorrelating-the-trees" style={link}>forest must decorrelate</Link>{" "}
          its trees). Boosting&rsquo;s move is to <strong>change the problem</strong> for the next learner: make
          the examples the ensemble currently gets wrong <em>matter more</em>, so the next weak learner is forced
          to concentrate its meagre power exactly where it is needed.
        </p>
        <MathBlock>{String.raw`\text{weak edge on the \emph{reweighted} data} \;\Longrightarrow\; \text{the ensemble error shrinks geometrically}`}</MathBlock>
        <p>
          That is the whole trick, and the next page makes it concrete: keep a weight on every training example,
          raise the weight of whatever the team just got wrong, train the next weak learner on the reweighted
          data, and add it in. Each learner is weak; the sequence is strong.
        </p>

        <Callout color={TREES} title={<>The weak learner of choice: shallow trees</>}>
          In practice the weak learner is nearly always a <strong>shallow decision tree</strong> — a stump
          (depth&nbsp;1) for classic AdaBoost, or a small tree of depth 3–8 for gradient boosting. Trees are the
          natural fit: they handle mixed feature types, need no scaling, are fast to fit, and their{" "}
          <em>depth</em> is a clean dial for exactly how weak each learner should be. Deeper trees per round means
          each learner captures higher-order feature interactions — a knob you&rsquo;ll tune later.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/boosting", label: <>← Learning from mistakes</> }}
          next={{ href: "/learn/boosting/adaboost", label: <>Next up · AdaBoost by hand →</> }}
        />
      </div>
    </article>
  );
}

const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
