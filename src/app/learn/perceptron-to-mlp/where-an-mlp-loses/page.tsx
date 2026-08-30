import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Where an MLP loses — Manifold",
  description:
    "On tabular data with threshold structure, a random forest claims 94% of the available headroom and the network claims 64% — and the network needed standardising, an architecture and a learning rate to get there.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhereMlpLosesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What networks are and are not", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>Where an MLP <em>loses</em></>}
        intro={<>Neural networks are the default for images, audio and text, and they are not the default for the
          kind of data most people actually have. This page is the measured version of that claim, including how
          much of the available headroom each model leaves on the table.</>}
      />

      <div className="lesson">
        <h2>The task</h2>
        <p>
          Four thousand rows, four columns — age, income, tenure, region. The true rule is built from thresholds and
          one interaction: income above 40,000 matters; being under 35 <em>and</em> newly joined matters; region 4
          is penalised; long tenure helps. Labels are then sampled from that probability, so some noise is
          irreducible.
        </p>
        <p>
          Because we wrote the generator, we know the ceiling — something you never have on real data and which
          makes the comparison far more readable:
        </p>

        <CodeOutput>{`Bayes-optimal accuracy on this test set = 0.7717

logistic regression       : 0.7067
MLP, 64-64, standardised  : 0.7483
random forest, 400 trees  : 0.7675`}</CodeOutput>

        <p>
          Raw accuracies flatter everyone. What matters is the <strong>headroom left unclaimed</strong> — how much
          of the achievable signal each model failed to capture:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 500 }}>
            <thead>
              <tr>
                {["model", "accuracy", "headroom left", "share of headroom claimed"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["logistic regression", "0.7067", "0.0650", "—"],
                ["MLP, 64–64", "0.7483", "0.0234", "64%"],
                ["random forest", "0.7675", "0.0042", "94%"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 3 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Measured against the linear model&rsquo;s starting deficit of 0.0650, the network closes 64% of the gap to
          optimal and the forest closes 94%. The forest is not marginally ahead — <strong>it leaves less than a
          fifth of the error the network leaves</strong> (0.0042 against 0.0234), on four columns, with no scaling
          and essentially no tuning.
        </p>

        <h2>Why the forest wins here</h2>
        <p>
          <strong>The true rule is made of thresholds, and a tree is made of thresholds.</strong>{" "}
          &ldquo;Income above 40,000&rdquo; is one split — a single node reproduces it exactly. A network has to
          approximate that step with a sum of smooth ramps, and it will always be a little soft in exactly the place
          the truth is sharp.
        </p>
        <p>
          The other three reasons compound it:
        </p>
        <ul>
          <li><strong>No shared structure to exploit.</strong> A network&rsquo;s strength is composing features into
            higher-level ones. Age, income, tenure and region are already the concepts of interest — there is no
            hierarchy waiting to be discovered, so the composition machinery has nothing to build with.</li>
          <li><strong>Four thousand rows is not much.</strong> The network has 4,417 parameters and 2,800 training
            rows. Trees, which do not have parameters in the same sense, are far less exposed to that ratio.</li>
          <li><strong>Everything about a network is a decision you must get right.</strong> The forest needed no
            scaling, no learning rate, no architecture, no epoch count. Each of those is a chance to lose more
            accuracy than the model choice could ever win — as the previous page showed, forgetting to standardise
            cost <strong>0.4258</strong> here, more than twenty times the forest&rsquo;s entire margin.</li>
        </ul>

        <Callout color={CORAL} title={<>This is not a quirk of one synthetic dataset</>}>
          It is the consistent finding of the tabular benchmark literature: on tabular data of this size,
          gradient-boosted trees and random forests remain at or above the state of the art, and specialised deep
          tabular architectures have repeatedly failed to displace them. If your data arrives as a spreadsheet with
          named columns, <strong>the boring answer is usually the right one</strong>, and the burden of proof is on
          the network.
        </Callout>

        <h2>The honest summary of the whole track</h2>
        <p>
          Put the three measured cases side by side, because together they say something no one of them says alone:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 580 }}>
            <thead>
              <tr>
                {["problem", "linear", "network", "forest", "verdict"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["spirals", "0.5767", "0.9500", "0.9533", "non-linearity essential"],
                ["digits", "0.9722", "0.9741", "0.9778", "features already linear"],
                ["tabular", "0.7067", "0.7483", "0.7675", "trees fit thresholds better"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 18px 7px 0", color: j === 4 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: j > 0 && j < 4 ? "tabular-nums" : undefined }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          <strong>The network wins one of three, and the forest is never far behind and twice ahead.</strong> That
          is the honest scoreboard for a plain multilayer perceptron on problems of this size, and it is worth
          holding onto — not because networks are overrated, but because the domains where they are transformative
          (images, audio, language, anything with millions of examples and structure to compose) are genuinely
          different from these, and using the right tool requires being able to tell which one you are looking at.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is &ldquo;headroom left unclaimed&rdquo; more informative than raw accuracy here?</>,
              options: [
                "It is a standard metric for classification",
                "0.7675 and 0.7483 look close, but against a ceiling of 0.7717 one leaves less than a third of the other's error",
                "It corrects for class imbalance",
              ],
              answer: 1,
              explain: <>A 0.0192 gap sounds negligible until you know that only 0.0650 was available at all. Most
                real problems give you no such ceiling — which is exactly why comparing against a strong baseline
                rather than against zero is the habit to build.</>,
            },
            {
              q: <>What property of the true rule most favours trees over a network here?</>,
              options: [
                "The rule uses only four features",
                "The rule is built from thresholds, which a split reproduces exactly and a network can only approximate with smooth ramps",
                "The labels are noisy",
              ],
              answer: 1,
              explain: <>&ldquo;Income above 40,000&rdquo; is one node in a tree and a soft approximation in a
                network. Noise limits everyone equally — that is what the Bayes ceiling accounts for — and dimension
                alone would not decide it.</>,
            },
            {
              q: <>Your data is a spreadsheet with 5,000 rows and twelve named columns. Where should you start?</>,
              options: [
                "A neural network, since it can learn any function",
                "Gradient-boosted trees or a random forest, and make the network prove it beats them",
                "Logistic regression, and stop there",
              ],
              answer: 1,
              explain: <>Tree ensembles are the strong default at this size and shape, and they cost you no scaling,
                no learning rate and no architecture search. Logistic regression is a fine <em>baseline</em> but
                stopping there gives up the non-linear structure trees pick up almost for free — 0.7067 versus
                0.7675 on this task.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/where-an-mlp-wins", label: <>← Where an MLP wins</> }}
          next={{ href: "/learn/perceptron-to-mlp/when-to-reach-for-a-network", label: <>Next up · When to reach for a network →</> }}
        />
      </div>
    </article>
  );
}
