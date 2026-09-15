import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, WALK_MU, TRUE_ONLY, AGG_VS_TRUE } from "@/components/figures/fa/data";

export const metadata = {
  title: "Generalisation, not storage — Manifold",
  description:
    "A table stores; a function generalises. Replace the array V[s] with a parameterised v(s,w) and one visit updates a hundred states at once — which is the entire point, and the entire price. Watch a single update move states the agent has never seen.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GeneralisationNotStorage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 8 minutes"
        title={<>Generalisation, not storage</>}
        intro={<>A table is a filing cabinet: one drawer per state, and opening one tells you nothing about the
          others. The fix is not a bigger cabinet. It is to stop filing and start <em>computing</em> — and the
          moment you do, a single visit starts changing the estimates of states you have never been to.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>From an array to a function</h2>
        <p>
          Everything so far ended in <M>{String.raw`V[s]`}</M> — an array with one cell per state, each cell an
          independent number. Replace it with a <strong>parameterised function</strong>:
        </p>
        <MathBlock>{String.raw`\hat v(s, \mathbf{w}) \approx v_\pi(s), \qquad \mathbf{w} \in \mathbb{R}^d, \quad d \ll |\mathcal{S}|`}</MathBlock>
        <p>
          Read that <M>{String.raw`d \ll |\mathcal{S}|`}</M> carefully, because it is the whole subject.{" "}
          <strong>There are fewer knobs than there are states.</strong> The knobs must therefore be shared, and
          sharing has a consequence that sounds obvious written down and is startling in practice: you can no
          longer change one state&rsquo;s estimate on its own. Every update moves a whole neighbourhood.
        </p>

        <Staircase
          x={WALK_STATES}
          lines={TRUE_ONLY}
          mu={WALK_MU}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>The thing a table would hold: one number per state, a thousand of them. Drawn
            end to end it is obviously not a thousand unrelated facts — it is a smooth curve, nearly
            linear through the middle and bending at the ends where termination is close. A table
            has no way to know that. It would have to learn each of those thousand numbers
            separately, from visits to that exact state, and the shaded strip underneath shows how
            unevenly those visits are distributed.</>}
        />

        <h2>The simplest possible sharing</h2>
        <p>
          To see it without any machinery, use the crudest feature map there is:{" "}
          <strong>state aggregation</strong>. Chop the thousand states of the random walk into ten groups of a
          hundred, and let every state in a group share one weight. Ten numbers for a thousand states.
        </p>
        <p>
          That is not a clever approximator — it is a staircase. But it is a real one, and it makes the mechanism
          impossible to miss.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>We visit <strong>exactly one state</strong> — state 137 — and apply one update. How many of
            the thousand value estimates will have changed afterwards?</>}
          options={["Just the one", "About 10", "About 100", "All 1000"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`states we visited      : 1
estimates that changed : 100
  ...spanning states 101 to 200

v(137) = 0.100   <- the state we actually visited
v(200) = 0.100   <- never visited, same group
v(201) = 0.000   <- never visited, next group along`}</CodeOutput>

        <p>
          One visit, a hundred estimates moved. The agent has never been to state 200, and now has an opinion about
          it — a correct-ish one, obtained for free. <strong>That transfer of experience between states is
          generalisation</strong>, and it is the only reason function approximation is worth the trouble. A tabular
          agent would have learned about state 137 and nothing else.
        </p>

        <h2>The same picture, read as a warning</h2>
        <p>
          Now look at the last two lines again. States 200 and 201 are <em>neighbours</em>. They are as similar as
          two states in this problem can be — their true values differ by less than two thousandths. And yet one
          moved by a tenth and the other did not move at all, because an arbitrary boundary happens to fall between
          them.
        </p>
        <p>
          Nothing about the world put that boundary there. <strong>We did</strong>, when we chose the features. And
          that is the trade in its entirety:
        </p>
        <Callout color={GOLD} title={<>The bargain you have just signed</>}>
          <strong>You get:</strong> experience in one state improves your estimate in many, so you can learn about
          far more states than you will ever visit — including, as we will see with Mountain Car, states you{" "}
          <em>could not possibly</em> visit.
          <br /><br />
          <strong>You pay:</strong> you can no longer be right everywhere at once. Fixing one state&rsquo;s estimate
          can break another&rsquo;s, and which states get grouped together is now a design decision you are
          responsible for — one the environment will not make for you.
        </Callout>

        <Staircase
          x={WALK_STATES}
          lines={AGG_VS_TRUE}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>Ten numbers instead of a thousand, and this is the <em>best</em> those ten can
            do — not what a particular run reached, but the closest a ten-group aggregation can get
            under the on-policy distribution. Two things are true at once and the page needs both:
            the staircase tracks the curve well enough to be useful, and it can never be right,
            because inside a group every state is forced to share one value. That permanent residual
            is the approximation floor, and here it is <strong>0.0544</strong>.</>}
        />

        <h2>Why this is a generalisation, not a replacement</h2>
        <p>
          It is worth noticing what happens if you take state aggregation to its limit. Give every state its own
          group. Now <M>{String.raw`d = |\mathcal{S}|`}</M>, each weight belongs to exactly one state, and updating
          one changes nothing else.
        </p>
        <p>
          That is <em>precisely</em> a lookup table. <strong>The table was never a different kind of thing — it was
          function approximation with the least useful features you could choose</strong>, one binary feature per
          state, no sharing at all. Everything in the{" "}
          <Link href="/learn/learning" style={link}>Learning</Link> track was a special case of what this track
          does; it simply happened to be the special case where the guarantees are easy.
        </p>
        <p>
          Which reframes the whole subject. We are not abandoning the tabular methods. We are turning a dial —
          from one weight per state, toward far fewer — and asking what breaks along the way, and when the
          generalisation we buy is worth the exactness we sell.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation", label: <>← When you can&rsquo;t store a value per state</> }}
          next={{ href: "/learn/function-approximation/what-best-fit-means", label: <>Next · What &ldquo;best fit&rdquo; means now →</> }}
        />
      </div>
    </article>
  );
}

const code = `w = np.zeros(10)                       # ten weights for a thousand states
v_hat = lambda: np.array([w[group_of(s)] for s in range(1, N_STATES + 1)])

before = v_hat()
s = 137                                            # visit ONE state
w[group_of(s)] += 0.1 * (1.0 - w[group_of(s)])     # nudge it toward a return of +1
after = v_hat()

moved = np.flatnonzero(before != after) + 1
print("states we visited      :", 1)
print("estimates that changed :", len(moved))
print("  ...spanning states", moved.min(), "to", moved.max())
print()
print(f"v(137) = {after[136]:.3f}   <- the state we actually visited")
print(f"v(200) = {after[199]:.3f}   <- never visited, same group")
print(f"v(201) = {after[200]:.3f}   <- never visited, next group along")`;
