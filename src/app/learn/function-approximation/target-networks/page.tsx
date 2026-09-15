import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { DqnDiagram } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "Target networks — Manifold",
  description:
    "A frozen copy of the network to build targets from. On Baird it was decisive; on CartPole it does not improve the mean at all (247.7 vs 360.4, inside one standard deviation) — what it buys is reliability, and the same seed reverses its verdict between 150 and 300 episodes.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TargetNetworks() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Practitioner", color: GOLD }]}
        time="about 11 minutes"
        title={<>Target networks</>}
        intro={<>The second of DQN&rsquo;s two ideas is one line: build your targets from a frozen copy of the
          network instead of the live one. Chapter 4 showed it rescuing the standard counterexample outright. On
          CartPole its effect is much stranger, and much more instructive.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The self-reference, one more time</h2>
        <p>
          The bootstrapped target is <M>{String.raw`r + \gamma \max_{a'} \hat q(s', a', \mathbf{w})`}</M>, and the
          thing you are updating is <M>{String.raw`\mathbf{w}`}</M>. Every gradient step therefore moves the
          target it was aiming at. In the{" "}
          <Link href="/learn/function-approximation/when-td-diverges" style={link}>two-state example</Link> this
          was fatal in the cleanest possible way: raising the estimate raised the target twice as fast, and the
          weight ran to 11,487.
        </p>
        <p>
          A <strong>target network</strong> breaks the loop. Keep a second copy of the weights,{" "}
          <M>{String.raw`\mathbf{w}^-`}</M>, use it to compute targets, and refresh it from the live network
          every <M>K</M> steps:
        </p>
        <div style={{ margin: "1rem 0", padding: "0.9rem 1.1rem", borderLeft: `3px solid ${GOLD}`, background: "var(--surface-2)", fontFamily: "ui-monospace, monospace", fontSize: 13.5, lineHeight: 1.7 }}>
          y = r + γ · max<sub>a′</sub> q(s′, a′; <strong>w⁻</strong>) &nbsp;&nbsp;← frozen<br />
          loss = ( q(s, a; <strong>w</strong>) − y )² &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← live<br />
          every K steps: <strong>w⁻</strong> ← <strong>w</strong>
        </div>
        <p>
          Between refreshes the target is a fixed function, so each stretch of training is ordinary supervised
          regression toward something that is not running away. On{" "}
          <Link href="/learn/function-approximation/whats-safe" style={link}>Baird&rsquo;s counterexample</Link>{" "}
          that was the difference between max <M>|v(s)|</M> reaching 10<sup>12</sup> and reaching{" "}
          10<sup>−13</sup>.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Same trick, applied to CartPole, where nothing was diverging in the first place. What does
            removing the target network do?</>}
          options={["Breaks it, like replay did", "Clearly worse but still learns", "No reliable change in the mean", "Actually better — it slows learning down"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`bootstrapping off yourself vs off a frozen copy (150 episodes, seed 0)

target network, synced every 200 steps         last 25   385.3   best  500
no target network (bootstrap off the live net) last 25   160.0   best  426`}</CodeOutput>

        <p>
          Read that and you would conclude the target network is worth 2.4× on CartPole. Run five seeds for 300
          episodes and the conclusion falls apart. (As on the last page, the exact figure of the first row moves
          between Python builds — it is 364.0 under CPython — while the second row, 160.0, is identical
          everywhere.)
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>300 episodes, 5 seeds</th><th style={thR}>last-50 mean</th><th style={thR}>per-seed</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={td}>With target network</td><td style={tdR}>360.4 ± 55.6</td>
                <td style={tdR}>339 / 362 / 456 / 317 / 329</td>
              </tr>
              <tr>
                <td style={td}>Without</td><td style={tdR}>247.7 ± 163.4</td>
                <td style={tdR}>449 / 326 / <span style={{ color: "var(--bad)" }}>100</span> / 304 / <span style={{ color: "var(--bad)" }}>59</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The mean is lower without the target network — by 112.7 — but the standard deviation of that difference
          is <strong>192.8</strong>, so the gap is well inside the noise. On this task,{" "}
          <strong>we cannot show that a target network improves the score at all.</strong>
        </p>
        <p>
          What we <em>can</em> show is the second column. The standard deviation triples, from 55.6 to{" "}
          <strong>163.4</strong>. Two of the five runs without a target network collapsed to 100 and 59 steps,
          while no run <em>with</em> one fell below 317. The trick is not buying performance here, it is buying{" "}
          <strong>reliability</strong> — which is exactly what you would expect from something that suppresses a
          failure mode rather than improving learning.
        </p>

        <Callout color={GOLD} title={<>The same seed reverses its verdict</>}>
          Look at seed 0 in both experiments. In the 150-episode cell above, with the target network it scores
          385 and without it 160 — a decisive win for the trick. In the 300-episode table, the same seed scores
          339 with and <strong>449 without</strong> — a decisive win the other way.
          <br /><br />
          Nothing changed except how long the run went on. Had we written this page from either experiment alone,
          in good faith, we would have stated the opposite conclusion with equal confidence. A learning curve
          measured at one horizon, on one seed, is not evidence about an algorithm — and the last chapter of this
          track is devoted to that failure of reading.
        </Callout>

        <DqnDiagram
          caption={<>The dashed arrow is the entire mechanism: the online network&rsquo;s weights are
            copied into the target network every <M>{String.raw`N`}</M> steps and are otherwise
            frozen. Between copies the regression target is a fixed function, which turns a moving
            self-referential problem into a sequence of ordinary supervised ones. The cost is equally
            visible — the target is deliberately stale, by up to <M>{String.raw`N`}</M> steps of
            learning, and that staleness is the whole of the tuning question.</>}
        />

        <h2>So when is it worth it?</h2>
        <p>
          Put the two measurements side by side. On Baird, where the triad genuinely bites and the weights are
          heading for infinity, the target network is the difference between divergence and the exact right
          answer. On CartPole, where nothing was diverging, it costs a little learning speed — a stale target is
          a slightly wrong target — and returns reliability.
        </p>
        <p>
          That is the honest rule: <strong>a target network is insurance, not fuel.</strong> Its premium is slower
          adaptation, and it pays out only when instability was on the table. On easy problems you may never see
          the payout; on hard ones you will not get far without it. The sync interval <M>K</M> sets the premium —
          200 steps here, 10,000 in the original Atari DQN, where the instability was severe enough to be worth a
          very stale target.
        </p>
        <p>
          With both ideas in hand, the next page puts the whole algorithm on one screen.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/experience-replay", label: <>← Experience replay</> }}
          next={{ href: "/learn/function-approximation/dqn-assembled", label: <>Next · DQN, assembled →</> }}
        />
      </div>
    </article>
  );
}

const code = `print("bootstrapping off yourself vs off a frozen copy (150 episodes, seed 0)\\n")
for target, label in ((True, "target network, synced every 200 steps"),
                      (False, "no target network (bootstrap off the live net)")):
    q, L = train_cartpole_dqn(episodes=150, target=target, seed=0)
    print(f"{label:46s} last 25 {L[-25:].mean():7.1f}   best {L.max():4d}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...td, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
