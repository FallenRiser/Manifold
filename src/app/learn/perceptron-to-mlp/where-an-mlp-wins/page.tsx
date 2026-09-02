import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "Where an MLP wins — Manifold",
  description:
    "Two measured cases pointing in opposite directions: +0.3733 over logistic regression on interleaved spirals, and +0.0019 on handwritten digits. The gap between them is the whole decision.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhereMlpWinsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What networks are and are not", color: CORAL }, { label: "Tier 2 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>Where an MLP <em>wins</em></>}
        intro={<>Two real experiments that disagree. On one, a network is worth thirty-seven accuracy points over a
          linear model. On the other, two-tenths of one point. Understanding what separates them is more useful than
          either number.</>}
      />

      <div className="lesson">
        <h2>Case A — the features do not exist yet</h2>
        <p>
          Two interleaved spirals, 1,000 points, two features, a 30% test split. You met this in chapter 2; here are
          all four models on the same split.
        </p>

        <CodeOutput>{`logistic regression      : 0.5767
MLP, 8 hidden units      : 0.5733
MLP, 64-64               : 0.9500
random forest, 300 trees : 0.9533`}</CodeOutput>

        <p>
          <strong>+0.3733 for the network over the linear model.</strong> This is the shape of problem where a
          network earns its complexity: the raw features carry no usable signal on their own — both classes span the
          same range of <code>x₁</code> and the same range of <code>x₂</code> — and all the information lives in a
          relationship between them that nobody wrote down.
        </p>
        <p>
          Two details in that table are worth as much as the headline. The <strong>8-unit network scores 0.5733,
          slightly below logistic regression</strong>: a small network is not &ldquo;a bit of a network&rdquo;, it
          is a model without enough capacity to represent the answer, and it fails just as completely as the linear
          model does. And the <strong>random forest matches the network at 0.9533</strong>. The lesson here is not
          &ldquo;networks beat other models&rdquo; — it is &ldquo;models that can learn non-linear structure beat
          models that cannot&rdquo;, and the forest is one of those too.
        </p>

        <h2>Case B — the features are already good</h2>
        <p>
          Now handwritten digits: <code>load_digits</code>, 1,797 examples, 64 raw pixel values, ten classes, 30%
          test. This is image data, which is exactly where you would expect a network to shine.
        </p>

        <GuessSlider
          accent={CORAL}
          prompt={<>Logistic regression scores 0.9722 on these digits. How much does a 64-unit hidden layer add?</>}
          min={-0.01}
          max={0.03}
          step={0.001}
          start={0.015}
          actual={0.0019}
          decimals={4}
          reveal={<>+0.0019 — one extra correct digit out of 540. An 8×8 digit is already very nearly linearly
            separable, so there is essentially nothing for a hidden layer to discover. Most people guess several
            times this, because &ldquo;images&rdquo; sounds like a job for a network.</>}
        />

        <CodeOutput>{`load_digits, 1797 rows, 64 pixel features, 30% test (540 rows)
  logistic regression      : 0.9722  (15 errors)
  MLP, one 64-unit layer   : 0.9741  (14 errors)
  random forest, 300 trees : 0.9778  (12 errors)`}</CodeOutput>

        <p>
          Fourteen errors against fifteen. The network has 4,160 hidden parameters, needed 179 iterations, and
          bought one digit. <strong>The random forest, which is not a network at all, beats both.</strong>
        </p>

        <Callout color={CORAL} title={<>Why we are showing you the boring result</>}>
          It would be easy to write this page with the spirals alone and let you conclude that networks are what you
          reach for on hard problems. The digits result is the corrective, and it is the more common situation:
          <strong> most real problems are closer to digits than to spirals.</strong> When a simple model is already
          at 97%, the ceiling is what limits you, not the model class — and the correct response is to look at{" "}
          <Link href="/learn/data-workflow/error-analysis" style={link}>which fourteen examples are wrong</Link>{" "}
          rather than to reach for something bigger.
        </Callout>

        <h2>The distinguishing question</h2>
        <p>
          What separates the two cases is not the domain, the data size, or how impressive the problem sounds. It is
          one question:
        </p>
        <p>
          <strong>Is the useful structure already present in your columns, or does it have to be
          constructed?</strong>
        </p>
        <p>
          On the digits, pixel 27 being bright is directly informative — a linear model can use it as it stands. On
          the spirals, <code>x₁</code> alone tells you nothing whatsoever; the signal exists only in a combination
          of both features that no one specified. That is precisely the work a hidden layer does, and precisely the
          work that is redundant when the columns are already meaningful.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr>
                {["signal for a network", "signal against"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 26px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["raw, unengineered inputs (pixels, audio, text)", "a handful of well-understood columns"],
                ["a linear model performs near chance", "a linear model is already close to the ceiling"],
                ["you cannot articulate the useful feature", "a domain expert can name it in one line"],
                ["lots of data relative to parameters", "a few thousand rows"],
                ["you will reuse the learned representation", "you need to explain each prediction"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 26px 7px 0", color: j === 0 ? CORAL : "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>The test that costs ten minutes</h2>
        <p>
          You never have to guess which case you are in. Fit a linear model first — it takes seconds — and read the
          answer off the gap between it and a sensible baseline.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

for name, model in [("baseline", DummyClassifier(strategy="most_frequent")),
                    ("linear  ", make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000))),
                    ("forest  ", RandomForestClassifier(n_estimators=300, random_state=0))]:
    print(name, round(model.fit(Xtr, ytr).score(Xte, yte), 4))`}
        />

        <p>
          A large gap between the baseline and the linear model means your features already work, and a network has
          little room to add. A linear model stuck near the baseline while a forest pulls away means the structure
          is non-linear — <em>now</em> a network is worth trying. And if the forest is stuck too, the problem is
          your data or your framing, and no model choice will rescue it.
        </p>
        <p>
          This is the same discipline as{" "}
          <Link href="/learn/data-workflow/start-with-a-baseline" style={link}>starting with a baseline</Link>:
          cheap models are not there to be good, they are there to tell you what kind of problem you have.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On the spirals, an 8-unit network scored 0.5733 — below logistic regression&rsquo;s 0.5767. What
                does that show?</>,
              options: [
                "Small networks are worse than linear models in general",
                "A network without enough capacity to represent the answer fails as completely as a linear model does",
                "The 8-unit network was undertrained",
              ],
              answer: 1,
              explain: <>Capacity is not a dial that trades smoothly against performance here. Below the threshold
                needed to represent the spiral, the network has nothing useful to offer and lands at roughly the
                linear model&rsquo;s score. On the digits, by contrast, a modest network is entirely sufficient.</>,
            },
            {
              q: <>Logistic regression gets 0.9722 on your problem and a network gets 0.9741. What is the right
                conclusion?</>,
              options: [
                "The network needs to be deeper",
                "The features already carry the signal linearly — look at the remaining errors instead of changing model",
                "The dataset is too small for a network",
              ],
              answer: 1,
              explain: <>A 0.0019 gain for 4,160 extra parameters says the linear structure was nearly all of it.
                The productive move is error analysis on the fourteen remaining mistakes, which may well be
                genuinely ambiguous digits. Note the random forest beat both — reaching for depth is not the only
                direction available.</>,
            },
            {
              q: <>What single question best predicts whether a network will help?</>,
              options: [
                "How much data do I have?",
                "Is the useful structure already present in the columns, or must it be constructed?",
                "Is the problem an image problem?",
              ],
              answer: 1,
              explain: <>The digits are an image problem where a network bought almost nothing, so the domain is not
                the discriminator. Data size matters but is downstream: if the features already work linearly, more
                data will not create work for a hidden layer to do.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/many-equivalent-solutions", label: <>← Universal approximation</> }}
          next={{ href: "/learn/perceptron-to-mlp/where-an-mlp-loses", label: <>Next up · Where an MLP loses →</> }}
        />
      </div>
    </article>
  );
}
