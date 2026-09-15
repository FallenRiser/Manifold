import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { Staircase } from "@/components/figures/fa/Staircase";
import { WALK_STATES, AGG_RESOLUTION } from "@/components/figures/fa/data";

export const metadata = {
  title: "The resolution dial — Manifold",
  description:
    "Coarse groups learn fast but can never be precise; fine groups could be precise but starve each weight of data. Sweep state aggregation from 2 groups to a full 1000-state table and the error is U-shaped — and at a realistic budget, the table comes last.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheResolutionDial() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Intuition", color: GOLD }]}
        time="about 9 minutes"
        title={<>The resolution dial</>}
        intro={<>State aggregation has one knob: how many groups. Turn it down and every state shares with many
          others; turn it all the way up and you are back to a table. It looks like more groups should simply be
          better. It is not — and the reason is the most important trade-off in all of machine learning, showing
          up in a place you might not expect it.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Two things can go wrong</h2>
        <p>
          Every approximate value function can be wrong for two quite different reasons, and aggregation lets you
          watch them trade places.
        </p>
        <p>
          <strong>It can be too crude.</strong> With two groups, the best possible fit is a two-step staircase, and
          no amount of data will make it curve. That error is baked in by the choice of features — it is the{" "}
          <em>floor</em> we have been computing.
        </p>
        <p>
          <strong>It can be under-fed.</strong> Each weight learns only from visits to its own group. Split the
          states a thousand ways and each weight sees roughly a thousandth of the experience — and the groups near
          the edges, which the walk visits 135 times less often than the centre, see almost nothing at all. Those
          weights are still near zero, not because the answer is zero but because nothing has taught them otherwise.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Same budget for everyone — <strong>2000 episodes</strong>. Which number of groups ends up with
            the lowest error?</>}
          options={["2", "20", "100", "1000 (a full table)"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`groups   best possible   reached in 2000 episodes
     2          0.2349     0.2499
     5          0.1049     0.1178
    10          0.0544     0.0632
    20          0.0273     0.0467
    50          0.0109     0.0896
   100          0.0054     0.1587
  1000          0.0000     0.3592`}</CodeOutput>

        <p>
          Read the two columns as two different stories.
        </p>
        <p>
          <strong>&ldquo;Best possible&rdquo; falls every single row.</strong> More groups can always represent more,
          and at a thousand — one per state — the floor is exactly zero. That is the table: it can represent the
          truth perfectly.
        </p>
        <p>
          <strong>&ldquo;Reached&rdquo; is a U.</strong> It improves down to 20 groups at <strong>0.0467</strong>,
          then turns and gets worse, and the table finishes dead last at <strong>0.3592</strong> — nearly eight
          times worse than 20 groups, and worse even than a crude two-step staircase. The representation that{" "}
          <em>could</em> be perfect is the one that learned the least.
        </p>

        <Callout color={GOLD} title={<>You have seen this trade-off before</>}>
          The two columns are the two halves of a decomposition from the{" "}
          <Link href="/learn/model-selection/approximation-vs-estimation" style={link}>model-selection pillar</Link>:
          <br /><br />
          <strong>Approximation error</strong> — the gap between the truth and the best function your features can
          express. That is the &ldquo;best possible&rdquo; column, and it only ever shrinks as the representation
          grows.
          <br /><br />
          <strong>Estimation error</strong> — the gap between that best function and what you actually learned
          from limited data. It grows as the same data gets split across more parameters.
          <br /><br />
          Reinforcement learning did not escape this. <strong>Generalisation is how you pay down estimation
          error</strong>: pooling states means each weight learns from more experience. The table pools nothing,
          which is exactly why it is so hungry.
        </Callout>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Ten groups over a thousand states gives a best-possible error of 0.0544. Double
            it to twenty groups, halving the width of every step. What happens to that floor?</>}
          options={[
            "Roughly halves — to about 0.027",
            "Roughly quarters — error falls with the square",
            "Barely moves — the shape is the limit, not the resolution",
            "Gets worse — more parameters, less data per parameter",
          ]}
          nudge="Locked in. Both staircases are drawn below."
        />

        <Staircase
          x={WALK_STATES}
          lines={AGG_RESOLUTION}
          ylabel="vπ(s)"
          xlabel="state"
          caption={<>Two resolutions of the same idea. Twice the groups gives roughly half the floor
            — <strong>0.0544</strong> down to <strong>0.0273</strong> — because the error inside a
            group is set by how far the true curve travels across that group, and halving the width
            halves that travel. Note what does <em>not</em> change: both are still flat inside every
            group, so both are still incapable of a slope. Resolution buys accuracy here; it never
            buys a different shape.</>}
        />

        <h2>The sweet spot moves with the data</h2>
        <p>
          The best setting is not a property of the problem alone — it depends on how much experience you have. Run
          the same sweep for 10,000 episodes instead of 2,000 and the fine settings catch up: 50 groups improves
          from 0.0896 to 0.0613, 100 groups from 0.1587 to 0.1145. Twenty groups still wins at that budget, at
          0.0421, but the gap is closing. With enough data the optimum keeps sliding towards finer resolution, and
          in the limit of infinite experience, the table would finally win.
        </p>
        <p>
          You almost never have infinite experience. That, in one sentence, is the practical case for function
          approximation — and it is a stronger one than &ldquo;the table does not fit in memory&rdquo;. Even on a
          problem small enough to store, a well-chosen approximation can learn a better answer, faster, than exact
          storage can.
        </p>

        <h2>What aggregation cannot do</h2>
        <p>
          The dial has a flaw built into it: <strong>resolution and generalisation are the same knob.</strong>{" "}
          Coarse groups generalise broadly but can only draw a crude staircase; fine groups draw sharply but barely
          generalise at all. You cannot ask for wide sharing <em>and</em> fine detail at the same time.
        </p>
        <p>
          Unless the groups overlap. Let every state belong to several groups at once, each offset slightly from
          the last, and the two properties come apart — each group can be wide, while the <em>overlaps</em> between
          them are narrow. That is tile coding, and it is next.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/linear-function-approximation", label: <>← Linear function approximation</> }}
          next={{ href: "/learn/function-approximation/tile-coding", label: <>Next · Coarse coding &amp; tile coding →</> }}
        />
      </div>
    </article>
  );
}

const code = `V_true = walk_true_values()[1:N_STATES + 1]
mu = walk_mu()
S = np.arange(1, N_STATES + 1)

print("groups   best possible   reached in 2000 episodes")
for k in (2, 5, 10, 20, 50, 100, 1000):
    g = np.array([group_of(s, k) for s in S])
    best = np.array([np.sum(mu[g == j] * V_true[g == j]) / np.sum(mu[g == j]) for j in range(k)])
    w = np.zeros(k)
    env = RandomWalk1000(0)
    for ep in range(2000):
        env.seed(ep); s = env.reset(); traj = []
        while True:
            traj.append(s); s, r, done = env.step()
            if done: break
        for st in traj:
            j = g[st - 1]; w[j] += 1e-3 * (r - w[j])
    print(f"{k:6d}   {rmse(best[g], V_true, mu):13.4f}   {rmse(w[g], V_true, mu):8.4f}")`;
