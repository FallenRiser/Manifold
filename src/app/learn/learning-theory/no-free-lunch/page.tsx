import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext, Proof } from "@/components/lesson";

export const metadata = {
  title: "No free lunch — Manifold",
  description:
    "Averaged over all possible problems, every learning algorithm is equally good — and equally useless. The no-free-lunch theorem is why generalization requires assumptions, and why 'which model is best?' is never answerable without saying best at what.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Static figure: four hypotheses that agree perfectly on every point you've
// seen and disagree completely on the ones you haven't. Computed at module
// scope with fixed coordinates — a server component, so there's no hydration
// surface at all. The four rows are exactly the 2^2 completions of the two
// unseen points, which is the whole counting argument in one picture.
const SEEN = [1, -1, 1];
const UNSEEN_ROWS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const CELL = 34, ROW_H = 30, LEFT = 74, TOP = 34;
const FIG_W = LEFT + 5 * CELL + 16;
const FIG_H = TOP + UNSEEN_ROWS.length * ROW_H + 30;

function CompletionsFigure() {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.6rem 0" }} className="not-prose">
      <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>
        Four hypotheses your data cannot tell apart
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 10 }}>
        filled = predicts +1 · hollow = predicts −1
      </div>
      <svg viewBox={`0 0 ${FIG_W} ${FIG_H}`} style={{ width: "100%", maxWidth: FIG_W, height: "auto", display: "block" }}>
        {/* column headers */}
        <rect x={LEFT - 6} y={TOP - 24} width={3 * CELL + 4} height={UNSEEN_ROWS.length * ROW_H + 30} rx={7} fill="var(--canvas)" stroke="var(--border-strong)" />
        <text x={LEFT + (3 * CELL) / 2 - 4} y={TOP - 30} fontSize={10.5} fill="var(--muted)" textAnchor="middle">seen (training)</text>
        <text x={LEFT + 3 * CELL + CELL - 4} y={TOP - 30} fontSize={10.5} fill="var(--brand-2)" textAnchor="middle">unseen</text>

        {UNSEEN_ROWS.map((row, r) => {
          const y = TOP + r * ROW_H;
          return (
            <g key={r}>
              <text x={LEFT - 16} y={y + 4} fontSize={11} fill="var(--muted)" textAnchor="end">h{r + 1}</text>
              {SEEN.map((s, c) => (
                <circle
                  key={`s${c}`} cx={LEFT + c * CELL + CELL / 2 - 6} cy={y} r={7}
                  fill={s === 1 ? "var(--ink)" : "var(--surface)"}
                  stroke={s === 1 ? "var(--ink)" : "var(--muted)"} strokeWidth={2}
                />
              ))}
              {row.map((s, c) => (
                <circle
                  key={`u${c}`} cx={LEFT + (3 + c) * CELL + CELL / 2 - 6} cy={y} r={7}
                  fill={s === 1 ? "var(--brand-2)" : "var(--surface)"}
                  stroke="var(--brand-2)" strokeWidth={2}
                />
              ))}
            </g>
          );
        })}
        <text x={FIG_W / 2} y={FIG_H - 8} fontSize={10.5} fill="var(--muted)" textAnchor="middle">
          identical training error · every possible answer off the sample
        </text>
      </svg>
    </div>
  );
}

export default function NoFreeLunchPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Generalization", color: GRAY }, { label: "Tier 3 · theory", color: GRAY }]}
        time="about 7 minutes"
        title={<>No free lunch</>}
        intro={<>Before we start proving that learning works, we have to be honest about a result that says it
          can&rsquo;t. The no-free-lunch theorem is not a technicality to be routed around — understanding exactly
          what it forbids is what makes every later guarantee meaningful.</>}
      />

      <div className="lesson">
        <h2>The uncomfortable observation</h2>
        <p>
          Your training set pins down the labels of the points in it. It says <em>nothing whatsoever</em>, as a
          matter of pure logic, about the label of any point not in it. Suppose you&rsquo;ve seen three examples and
          two points remain unseen. There are four functions that fit your training data perfectly and differ on
          everything you haven&rsquo;t seen:
        </p>

        <CompletionsFigure />

        <p>
          All four have zero training error. Nothing in the data prefers one over another. And if the unseen points
          were labeled by an adversary rather than by nature, whichever one your algorithm picks, there&rsquo;s a
          world in which it&rsquo;s exactly wrong. With <M>k</M> unseen points there are{" "}
          <M>{String.raw`2^k`}</M> such completions, and your training set is equally compatible with all of them.
        </p>

        <h2>The theorem</h2>
        <p>
          Wolpert&rsquo;s no-free-lunch theorem makes that observation exact. In its cleanest form: fix any
          learning algorithm <M>{String.raw`\mathcal A`}</M> and any sample size <M>n</M>. Then, averaged uniformly
          over <em>all</em> possible labeling functions on a finite domain,
        </p>
        <MathBlock>{String.raw`\mathbb E_{f}\big[R_f(\mathcal A(S))\big] \;=\; \tfrac12 \quad\text{for every algorithm } \mathcal A.`}</MathBlock>
        <p>
          Every algorithm has the same expected off-sample error — one half, the coin flip — and therefore no
          algorithm is better than any other. Deep networks, gradient boosting, k-nearest neighbours, and a function
          that ignores the data and always answers &ldquo;yes&rdquo; are, averaged over all problems, tied.
        </p>

        <Proof title="why the average is exactly one half" color={GRAY}>
          <p>
            The proof is a pairing argument, and it needs no machinery at all. Let the domain be finite, let{" "}
            <M>S</M> be the sample, and consider any point <M>x</M> not in <M>S</M>. Take the set{" "}
            <M>{String.raw`\mathcal F`}</M> of all <M>{String.raw`2^{|X|}`}</M> binary labeling functions on the
            domain, and pair them up: match each <M>f</M> with the function <M>{String.raw`f'`}</M> that is{" "}
            <em>identical to <M>f</M> everywhere except at <M>x</M></em>, where it is flipped.
          </p>
          <p>
            This is a perfect matching of <M>{String.raw`\mathcal F`}</M> into pairs — every function appears in
            exactly one pair, since applying the flip twice returns you to where you started. Now notice the key
            fact: <M>f</M> and <M>{String.raw`f'`}</M> agree on every point of <M>S</M>, so they produce{" "}
            <em>the identical training set</em>. The algorithm sees the same input in both worlds and therefore
            returns the same hypothesis <M>{String.raw`h = \mathcal A(S)`}</M>, which makes the same prediction at{" "}
            <M>x</M>.
          </p>
          <p>
            But <M>f</M> and <M>{String.raw`f'`}</M> disagree at <M>x</M> by construction. So <M>h</M> is correct at{" "}
            <M>x</M> in exactly one of the two worlds and wrong in the other — the pair contributes exactly one
            error out of two. Since this holds for <em>every</em> pair, averaging over all of{" "}
            <M>{String.raw`\mathcal F`}</M> gives error rate exactly <M>{String.raw`1/2`}</M> at <M>x</M>. Averaging
            over all off-sample <M>x</M> gives expected off-sample risk <M>{String.raw`1/2`}</M>.
          </p>
          <p>
            Nowhere did we use anything about <M>{String.raw`\mathcal A`}</M>. It could be gradient descent on a
            transformer or a coin flip; the pairing doesn&rsquo;t care, because the algorithm cannot distinguish the
            two worlds. That is the whole content of the theorem: <strong>the data cannot break a tie it never
            saw.</strong>
          </p>
        </Proof>

        <h2>What it actually forbids — and what it doesn&rsquo;t</h2>
        <p>
          Read carelessly, no free lunch says learning is impossible, which is plainly false — models work. The
          theorem is narrower and sharper than that. It forbids exactly one thing: <strong>a universal learner that
          needs no assumptions</strong>. It does not say that all algorithms are equally good on{" "}
          <em>your</em> problem. It says they&rsquo;re tied when averaged over a uniform distribution across all
          possible problems, and that uniform average is a fantasy nobody lives in.
        </p>
        <p>
          The reason is that the space of &ldquo;all possible labeling functions&rdquo; is overwhelmingly dominated
          by pure noise. Almost every one of those <M>{String.raw`2^{|X|}`}</M> functions is a random scramble with
          no structure whatsoever: no smoothness, no locality, no relationship between similar inputs. Real problems
          are an unimaginably thin slice of that space. Nearby X-rays have similar diagnoses; similar loan profiles
          default at similar rates; an asteroid&rsquo;s hazard doesn&rsquo;t flip when its diameter changes by a
          metre. The world is structured, and structure is precisely what the average destroys.
        </p>

        <Callout color={GRAY} title={<>The lesson, in one sentence</>}>
          Generalization is impossible without assumptions, so <strong>every working algorithm is a bet about what
          kind of structure the world has</strong> — and the bet is called <em>inductive bias</em>. Linear regression
          bets on additive linear effects. k-NN bets that nearby points share labels. Trees bet on axis-aligned
          rectangles. Convolutional networks bet on translation invariance. None is universally right; each wins on
          the problems whose structure matches its bet.
        </Callout>

        <h2>Why this is good news for the rest of the track</h2>
        <p>
          No free lunch tells us what shape a real theorem must have. It rules out results of the form &ldquo;this
          algorithm achieves low error&rdquo; with no strings attached — any such claim is provably false. What it
          leaves entirely open, and what everything from here on delivers, are <em>conditional</em> results:
        </p>
        <MathBlock>{String.raw`\text{if } h \text{ comes from a restricted class } \mathcal H, \text{ then the gap is at most } \varepsilon(\mathcal H, n, \delta).`}</MathBlock>
        <p>
          Restricting <M>{String.raw`\mathcal H`}</M> is how you smuggle your assumption in, and the bound is the
          receipt. Choose a small class and the guarantee is strong but the class may not contain anything good;
          choose a huge one and it surely contains something good but no guarantee survives. That tension has a
          name — the approximation–estimation tradeoff — and it is the engine of the next several chapters.
        </p>
        <p>
          It also explains a fact you may have found suspicious in practice: why nobody can answer &ldquo;which
          model is best?&rdquo; without asking about your data first. They&rsquo;re not being evasive. The question
          has no answer. This is the formal backing for the decision guides throughout the site, like{" "}
          <Link href="/learn/k-nearest-neighbors/when-to-use-k-nn" style={link}>when to reach for k-NN</Link> or{" "}
          <Link href="/learn/decision-trees/when-to-use-a-tree" style={link}>when a tree is the right shape</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/learning-theory/risk-and-empirical-risk", label: <>← Risk, empirical risk &amp; the gap</> }}
          next={{ href: "/learn/learning-theory/the-union-bound-argument", label: <>Next up · The union bound argument →</> }}
        />
      </div>
    </article>
  );
}
