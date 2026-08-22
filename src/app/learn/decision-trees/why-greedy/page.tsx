import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "Why greedy? — Manifold",
  description:
    "Finding the optimal decision tree is NP-complete, so CART settles for greedy top-down splitting with an impurity surrogate. What that compromise costs, where it fails (XOR), and the optimal-tree solvers that now exist for small cases.",
};

const TREES = "var(--c-trees)";
const GREY = "var(--c-metrics)";

export default function WhyGreedyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 3 · theory", color: GREY }]}
        time="about 7 minutes"
        title={<>Why greedy?</>}
        intro={<>
          CART commits to the locally best split at every node and never reconsiders. That&rsquo;s obviously a
          compromise — so why not search for the genuinely best tree? Because you can&rsquo;t afford to. The
          optimal tree is one of the classic intractable problems.
        </>}
      />

      <div className="lesson">
        <h2>The optimal tree is NP-complete</h2>
        <p>
          &ldquo;Best tree&rdquo; means: over <em>all</em> trees, the one minimising error at a given size (or
          the smallest tree achieving zero error). Hyafil and Rivest proved in 1976 that constructing that
          optimal binary decision tree is <strong>NP-complete</strong>. The search space is monstrous — the
          choice of split at the root changes every subproblem beneath it, and those choices multiply
          combinatorially with depth. There is no known algorithm that finds the optimal tree in polynomial
          time, and almost certainly none exists.
        </p>
        <p>
          So exhaustive search is off the table for any realistic dataset. Greedy top-down growth is the
          practical answer: at each node do the one thing you can afford — take the best split right here — and
          recurse. It runs in roughly <M>{String.raw`O(n\,d\,\text{depth})`}</M>, which is cheap.
        </p>

        <h2>Impurity is a surrogate for what we actually want</h2>
        <p>
          There&rsquo;s a second compromise hiding inside the first. What we ultimately care about is{" "}
          <em> generalisation error</em>, which we can&rsquo;t see at training time. So the tree optimises a{" "}
          <strong> surrogate</strong> we <em>can</em> compute — the immediate impurity drop — and trusts that
          locally purer nodes lead to a globally better tree. Most of the time that trust is well placed:
          impurity reduction is a reasonable, if myopic, proxy for progress.
        </p>

        <h2>Where greedy actually fails: XOR</h2>
        <p>
          The clean failure case is exclusive-or. Put two balanced classes in a checkerboard with the classes
          perfectly balanced on every axis. Now consider any single split, say <M>{String.raw`x_1 \le \tfrac12`}</M>:
          each side is still an exact 50/50 mix, so the information gain is <strong>zero</strong>. Every
          first-level split scores zero. A strictly greedy tree that only splits when gain is positive sees no
          reason to make the <em>first</em> cut — even though making it, and then one more, would separate the
          classes perfectly.
        </p>
        <p>
          This is the horizon effect in its purest form: the valuable structure is two levels away, invisible
          to a one-step score. Three things rescue greedy in practice:
        </p>
        <ul style={ul}>
          <li><strong>Noise and finite samples.</strong> Real data is never a perfect 50/50 on each side, so
            the first split has a small but nonzero gain and the tree proceeds — which is exactly why the
            noisy checkerboard in this track&rsquo;s labs is learnable while textbook XOR is not.</li>
          <li><strong>Lookahead.</strong> Evaluating splits two levels deep would find the XOR structure, but
            it multiplies the cost and, empirically, rarely helps enough to be worth it on real data.</li>
          <li><strong>Ensembles.</strong> Randomised, averaged trees explore many first splits, so the family
            as a whole escapes any single greedy dead end.</li>
        </ul>

        <Callout color={GREY} title={<>Optimal trees are making a comeback</>}>
          For <em>small</em> trees, the intractable has become merely expensive: modern solvers (mixed-integer
          programming — Bertsimas &amp; Dunn&rsquo;s Optimal Classification Trees — and dynamic-programming
          methods like GOSDT) find provably optimal shallow trees in seconds to minutes. They can beat greedy
          on accuracy <em>and</em> size when interpretability demands a tiny tree. For anything deep, greedy
          plus an ensemble still rules — but &ldquo;greedy because we must&rdquo; is now &ldquo;greedy unless
          the tree is small enough to optimise.&rdquo;
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/class-weights-and-cost-sensitive", label: <>← Class weights & cost-sensitive trees</> }}
          next={{ href: "/learn/decision-trees/bias-and-variance-of-trees", label: <>Next up · The bias–variance profile →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
