import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { FA_SETUP } from "@/lib/runtimeSetup";
import { TriadDiagram } from "@/components/figures/fa/FaDiagrams";

export const metadata = {
  title: "The three ingredients — Manifold",
  description:
    "Remove one leg of the deadly triad at a time and Baird's counterexample stops diverging every single time: 709.21 becomes 9.00, 8.63 or (eventually) exactly 0. Each leg is individually indispensable, which is why the triad is a design constraint rather than a bug to fix.",
};

const GOLD = "var(--c-rl)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheThreeIngredients() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Reinforcement learning", color: GOLD }, { label: "Theory", color: GOLD }]}
        time="about 10 minutes"
        title={<>The three ingredients</>}
        intro={<>Baird&rsquo;s counterexample fails as a whole, so the way to understand it is to take it apart.
          Remove one ingredient, leave the other two, and see what survives. The answer is the same every
          time — and that symmetry is what earns the combination its name.</>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Naming the legs</h2>
        <p>
          The <strong>deadly triad</strong> is the combination of three things, each of which you have already
          met and each of which you have a good reason to want:
        </p>
        <ul>
          <li>
            <strong>Function approximation.</strong> Values come from shared parameters rather than one cell per
            state. Without it, the problems in this track are not merely expensive — for Mountain Car they are{" "}
            <Link href="/learn/function-approximation/semi-gradient-sarsa" style={link}>impossible</Link>.
          </li>
          <li>
            <strong>Bootstrapping.</strong> Targets are built from your own current estimates rather than from
            complete returns. This is what lets you learn online, before an episode ends, and in continuing tasks
            that never end at all — and it lowers variance.
          </li>
          <li>
            <strong>Off-policy training.</strong> The data comes from a different policy than the one you are
            evaluating. This is what lets you learn a greedy policy while exploring, replay old experience, or
            learn many things at once from one stream.
          </li>
        </ul>
        <p>
          Any <em>two</em> of these have been safe throughout this track. Chapter 2 bootstrapped with function
          approximation and converged — to a biased place, but it converged, because it was on-policy. The
          Learning track went off-policy and bootstrapped happily with Q-learning, because it had a table.
        </p>

        <PredictPrompt
          accent={GOLD}
          prompt={<>Take Baird&rsquo;s counterexample and remove exactly one leg — three separate runs, everything
            else identical. How many of the three still diverge?</>}
          options={["All three still diverge", "Two of the three", "One of the three", "None — all three become stable"]}
        />

        <CodeBlock setup={FA_SETUP} fromScratch={code} />
        <CodeOutput>{`   setting                                     ||w||   max|v(s)|
   all three legs                             709.21     1096.07
   drop OFF-POLICY (rho = 1)                    9.00        3.66
   drop BOOTSTRAPPING (Monte Carlo target)       8.63        0.37
   drop FUNCTION APPROX (one-hot)              22.39        9.87

   every true value is 0, so max|v(s)| is the whole error.`}</CodeOutput>

        <p>
          <strong>Removing any single leg stops the divergence.</strong> Not &ldquo;improves it&rdquo; — stops it.
          The full triad reaches a value of 1096 and is still accelerating; the three one-legged-removed variants
          sit at 3.66, 0.37 and 9.87 and are heading down.
        </p>
        <p>
          Two of those rows deserve a note, because a snapshot at 1,000 steps can mislead.
        </p>
        <ul>
          <li>
            <strong>The tabular row looks like it grew</strong> — 22.39 against a starting norm of 10.30. It did,
            and it is a transient, not a divergence. With one-hot features the six upper states are each being
            pulled toward state 7&rsquo;s inflated value of 10 while state 7 itself decays only at rate{" "}
            <M>{String.raw`1-\gamma = 0.01`}</M> per update. Run it out and it lands where it should: max{" "}
            <M>|v(s)|</M> is 9.87 at 1,000 steps, 8.77 at 10,000, 2.46 at 100,000, and{" "}
            <strong>0.0000 at a million</strong>, with <M>{String.raw`\|\mathbf{w}\| \to 0`}</M>.
          </li>
          <li>
            <strong>The Monte Carlo row is the cleanest.</strong> Its target is the actual return, which on this
            problem is exactly 0 for every state, so there is no moving target to chase: the update is ordinary
            supervised regression onto a constant, and max <M>|v(s)|</M> is already down to 0.37.
          </li>
        </ul>

        <Callout color={GOLD} title={<>Why you cannot simply drop one and move on</>}>
          The obvious response is to pick a leg and cut it. Look at what each cut costs.
          <br /><br />
          <strong>Drop function approximation</strong> and you are back to a table — fine for a 4×4 grid, useless
          for Mountain Car&rsquo;s two real numbers, and hopeless for pixels.{" "}
          <strong>Drop bootstrapping</strong> and you wait for episodes to end, give up continuing tasks, and take
          the variance of full returns — the{" "}
          <Link href="/learn/learning/the-trouble-with-monte-carlo" style={link}>Learning track</Link> spent a
          chapter on why that hurts. <strong>Drop off-policy learning</strong> and you cannot reuse old
          experience, which means no replay buffer — and replay is the thing that made deep RL work at all.
          <br /><br />
          DQN, in chapter 5, wants all three at once: a neural network, a bootstrapped target, and a replay buffer
          full of data from older policies. It is standing directly on the triad. That is why it needs the tricks
          it has, and why those tricks are the subject of the next page.
        </Callout>

        <TriadDiagram
          caption={<>The three conditions and the one region where the guarantee is gone. The
            diagram is worth reading for what it does <em>not</em> say: none of the three is a
            mistake, and none of the three is optional in the cases you care about. Function
            approximation is how you leave the table. Bootstrapping is how you learn without waiting
            for the episode to end. Off-policy training is how you reuse data. Each is load-bearing;
            it is only the intersection that is unsafe.</>}
        />

        <h2>What the theory can and cannot promise</h2>
        <p>
          The honest summary of where the guarantees stand:
        </p>

        <div style={{ overflowX: "auto", margin: "1.1rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Setting</th><th style={th}>What is known</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Tabular, on- or off-policy</td><td style={td}>Converges to the right answer under standard conditions</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Linear, on-policy, bootstrapped</td><td style={td}>Converges — to the TD fixed point, not the best fit</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Linear, off-policy, Monte Carlo</td><td style={td}>Converges (it is supervised regression)</td></tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}><td style={td}>Linear, off-policy, bootstrapped</td><td style={{ ...td, color: "var(--bad)" }}>Can diverge — this page&rsquo;s first row</td></tr>
              <tr><td style={td}>Nonlinear, anything</td><td style={td}>Far weaker still; even on-policy guarantees are largely lost</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          Notice the last row. Everything reassuring in this table has the word <em>linear</em> in it, and the
          moment <M>{String.raw`\hat v`}</M> is a neural network the proofs stop applying — including the
          on-policy one we leaned on in chapter 2. Deep RL lives outside the theory, and works anyway, for
          reasons the next page begins to make concrete.
        </p>

        <PrevNext
          prev={{ href: "/learn/function-approximation/bairds-counterexample", label: <>← Baird&rsquo;s counterexample</> }}
          next={{ href: "/learn/function-approximation/whats-safe", label: <>Next · What&rsquo;s safe, and what you do about it →</> }}
        />
      </div>
    </article>
  );
}

const code = `phi, b_probs, gamma = baird()

def run(mode, steps=1000, alpha=0.01, seed=0):
    "mode: triad | onpolicy | nobootstrap | tabular"
    X = np.eye(7) if mode == "tabular" else phi
    w = np.array([1.,1.,1.,1.,1.,1.,10.]) if mode == "tabular" else BAIRD_W0.copy()
    rng = np.random.default_rng(seed)
    for _ in range(steps):
        s = int(rng.integers(7))
        if rng.random() < b_probs[0]:
            s2, rho = int(rng.integers(6)), 0.0
        else:
            s2, rho = 6, 1.0 / b_probs[1]
        if mode == "onpolicy":
            rho = 1.0                                  # pretend we follow the target policy
        if mode == "nobootstrap":
            delta = 0.0 - X[s] @ w                     # the true return is 0: no bootstrap
        else:
            delta = 0.0 + gamma * X[s2] @ w - X[s] @ w
        w = w + alpha * rho * delta * X[s]
    return np.linalg.norm(w), np.max(np.abs(X @ w))

print(f"   {'setting':38s} {'||w||':>10} {'max|v(s)|':>11}")
for mode, label in (("triad",       "all three legs"),
                    ("onpolicy",    "drop OFF-POLICY (rho = 1)"),
                    ("nobootstrap", "drop BOOTSTRAPPING (Monte Carlo target)"),
                    ("tabular",     "drop FUNCTION APPROX (one-hot)")):
    n, mv = run(mode)
    print(f"   {label:38s} {n:10.2f} {mv:11.2f}")
print("\\n   every true value is 0, so max|v(s)| is the whole error.")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const td: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", lineHeight: 1.5 };
