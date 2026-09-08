import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";
import { WAREHOUSE_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Warehouse-robot capstone: overview & the goal — Manifold",
  description:
    "An end-to-end reinforcement-learning project: teach a delivery robot to fetch a package and deliver it across a floor with spills. Acting at random scores −817; a perfect planner scores +21. Everything between those two numbers is the work.",
};

const OLIVE = "var(--c-warehouse)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WarehouseCapstoneIndex() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: OLIVE }, { label: "Reinforcement learning", color: "var(--c-rl)" }]}
        time="about 6 minutes"
        title={<>A robot that learns to do its job</>}
        intro={<>
          Three tracks taught you to describe a world as an MDP, to plan in it when you know the rules, and to
          learn in it when you don&rsquo;t. This is the project where you do all of it at once, on one problem,
          end to end — and discover that the algorithm was never the hard part.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion accent={OLIVE} label="The engineer's question" icon="🤖">
          What decision does this agent actually serve, and what would it mean for it to have <em>succeeded</em>?
        </AnalystQuestion>

        <h2>The brief</h2>
        <p>
          A warehouse robot starts at the <strong>dock</strong>. It must drive to the <strong>pickup shelf</strong>,
          collect a package, and carry it to the <strong>dropoff</strong>. The floor is not clean: a row of{" "}
          <strong>spills</strong> cuts across the middle. Drive into one and you lose thirty points and get towed
          back to the dock — you keep the package, but you have lost a great deal of time.
        </p>
        <p>
          The spill wall has exactly one <strong>doorway</strong> through the middle, and one long way around it on
          the right. The doorway is much shorter. It is also flanked by spills on both sides, and the robot&rsquo;s
          wheels <em>slip</em>: one step in ten, it goes somewhere other than where it aimed. That single tension —
          a short risky route versus a long safe one — is what the whole project turns on.
        </p>

        <CodeBlock setup={WAREHOUSE_SETUP} fromScratch={codeFloor} />
        <CodeOutput>{`floor:
    S......D
    ........
    HHH.HH..
    ........
    P.......
state = (0, 0, 0)  (row, col, carrying)
states: 80  actions: 4
random episode: 250 steps, return -1090.0, delivered=False`}</CodeOutput>
        <p>
          <code>S</code> is the dock, <code>P</code> the pickup shelf, <code>D</code> the dropoff, and{" "}
          <code>H</code> the spills. Notice the doorway in the spill row — column 3 — and the clear ground on the
          right, columns 6 and 7. Notice too what one episode of <em>random</em> driving achieves: it wanders for
          the full 250-step limit, never delivers anything, and returns <strong>−1090</strong>.
        </p>

        <h2>The two numbers that bracket the whole project</h2>
        <p>
          Before writing a line of learning code, it is worth knowing what &ldquo;bad&rdquo; and
          &ldquo;perfect&rdquo; look like. Acting uniformly at random delivers the package{" "}
          <strong>0.7%</strong> of the time and scores <strong>−817</strong>. At the other end, a planner that is
          <em> handed the rules of the world</em> and solves them exactly — value iteration from the Planning
          track — delivers <strong>100%</strong> of the time and scores <strong>+21.00</strong>.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 430 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-strong)" }}>
                <th style={th}>Reference point</th><th style={thR}>Return</th><th style={thR}>Delivered</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}>Acting at random</td><td style={tdR}>−817.22</td><td style={tdR}>0.7%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={tdc}>A sensible hand-written rule</td><td style={tdR}>−3543.05</td><td style={tdR}>3.7%</td>
              </tr>
              <tr>
                <td style={tdc}><strong>Oracle</strong> — value iteration, given the model</td>
                <td style={{ ...tdR, color: OLIVE, fontWeight: 600 }}>+21.00</td><td style={tdR}>100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Read the middle row twice. A perfectly reasonable hand-coded rule — <em>drive toward wherever you are
          headed</em> — scores <strong>−3543</strong>, which is more than four times <em>worse</em> than flailing at
          random. Working out why is the subject of Act 2, and it is the first genuinely useful thing this project
          will teach you.
        </p>

        <Callout color={OLIVE} title={<>What we are actually going to find out</>}>
          Two results carry this capstone, and neither is about picking a clever algorithm.
          <br /><br />
          <strong>1. The state is the whole ballgame.</strong> A textbook-correct Q-learning agent, given a
          textbook-correct implementation, scores <strong>−250</strong> and delivers <strong>nothing</strong> —
          until we add one bit of information to its state. Then the same code scores <strong>+20</strong> and
          delivers every time.
          <br /><br />
          <strong>2. &ldquo;Which algorithm is best&rdquo; is not a question about algorithms.</strong> Q-learning
          beats SARSA when the finished robot stops exploring. SARSA beats Q-learning — by more and more — when it
          keeps exploring on the floor. Both are right; they are answering different questions, and only you know
          which one you are asking.
        </Callout>

        <h2>How this capstone runs</h2>
        <p>
          Twenty-four pages in six acts, and every one of them follows the same contract you met in the{" "}
          <Link href="/learn/asteroid-hazard-capstone" style={link}>asteroid-hazard capstone</Link>: open with the
          question a practitioner asks on <em>any</em> project, teach the general move, apply it here, then hand
          the lesson back to you for your own work. Each page banks one rule into a running{" "}
          <strong>RL Playbook</strong> you can take to your next problem.
        </p>
        <ol>
          <li><strong>Frame it as an MDP</strong> — state, actions, reward, discount. The act where the project is won or lost.</li>
          <li><strong>Lock the harness</strong> — how you will measure success, your baselines, and your ceiling, all before training anything.</li>
          <li><strong>Learn it</strong> — Q-learning, SARSA, Expected SARSA, and the trade-off between them.</li>
          <li><strong>Make it work</strong> — step size, exploration schedule, optimism, and a tuning protocol that won&rsquo;t fool you.</li>
          <li><strong>Evaluate &amp; stress-test</strong> — read the policy, find where it breaks, name what it can never know.</li>
          <li><strong>Conclude &amp; transfer</strong> — the Playbook, then two fresh problems to run it on.</li>
        </ol>
        <p>
          Every number you will see was computed by running the code on this page&rsquo;s environment before the
          prose around it was written. Where a result contradicted what the textbook would have predicted — and
          that happened more than once — you get the result, and an explanation of the gap.
        </p>

        <TransferBox accent={OLIVE}>
          Before you start any RL project, write down two numbers: what a <em>random</em> policy scores, and what
          the best conceivable policy would score. If you cannot name the second one, say so explicitly — that
          uncertainty is itself a finding, and it changes how you should read every result that follows.
        </TransferBox>

        <PlaybookRule n={1} accent={OLIVE}>
          <strong>Frame first.</strong> Write the decision the agent serves and how success will be measured,
          before choosing an algorithm — and bracket the problem with a floor (random) and, if you can, a ceiling.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/learning/the-throughline", label: <>← The Learning track</> }}
          next={{ href: "/learn/warehouse-robot-capstone/from-task-to-mdp", label: <>Next up · From a task to an MDP →</> }}
        />
      </div>
    </article>
  );
}

const codeFloor = `env.seed(0); s = env.reset()
print("floor:"); [print("   ", row) for row in FLOOR]
print("state =", unpack(s), " (row, col, carrying)")
print("states:", nS, " actions:", nA)

# one episode of acting completely at random
env.seed(0); s = env.reset(); total = 0.0
for t in range(250):
    s, r, done = env.step(int(env.rng.integers(nA)))
    total += r
    if done: break
print(f"random episode: {t+1} steps, return {total:.1f}, delivered={done}")`;

const th: React.CSSProperties = { textAlign: "left", padding: "8px 14px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" };
const thR: React.CSSProperties = { ...th, textAlign: "right" };
const tdc: React.CSSProperties = { padding: "8px 14px", color: "var(--muted)", verticalAlign: "top", lineHeight: 1.5 };
const tdR: React.CSSProperties = { ...tdc, textAlign: "right", fontFamily: "ui-monospace, monospace", color: "var(--ink)" };
