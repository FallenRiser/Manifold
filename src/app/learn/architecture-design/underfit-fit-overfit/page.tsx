import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Underfit, fit, overfit — Manifold",
  description:
    "Three regimes, one decision table. Underfitting, a good fit, and overfitting each leave a distinct signature in the train and test numbers — and each prescribes a different next move.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function UnderfitFitOverfitPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "The diagnostic loop", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Underfit, fit, overfit</>}
        intro={
          <>
            The learning curve gives you two numbers that matter — how well the model fits the
            data it has seen, and how well that fit generalises. Their combination lands the model
            in one of three regimes, and each regime has a different remedy. This page turns that
            into a decision table you can read at a glance.
          </>
        }
      />

      <div className="lesson">
        <h2>The three regimes</h2>
        <p>
          Every trained model sits somewhere on a line between &ldquo;has not learned the
          problem&rdquo; and &ldquo;has memorised the training set.&rdquo; Two measurements place
          it: the <strong>training accuracy</strong> (how well it fits the data the optimiser saw)
          and the <strong>test accuracy</strong> (how well that fit transfers to held-out data).
          The <strong>gap</strong> between them — training minus test — is the overfitting signal.
        </p>

        <MathBlock>{String.raw`\text{gap} = \text{acc}_{\text{train}} - \text{acc}_{\text{test}}`}</MathBlock>

        <p>
          The trap is reading either number alone. A low gap looks reassuring but says nothing
          about whether the absolute level is any good; a high training accuracy looks like success
          but says nothing about whether it generalises. You need both, together. Here is what the
          three combinations look like on this track&rsquo;s running problem — sklearn moons, ReLU,
          He initialisation, Adam at learning rate 0.001.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr>
                {["regime", "train", "test", "gap", "what it means", "remedy"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)",
                    fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                {
                  regime: "Underfit", train: "0.862", test: "0.845", gap: "~0.017",
                  means: "too little capacity", remedy: "add capacity (width first)",
                },
                {
                  regime: "Good fit", train: "0.953", test: "0.945", gap: "~0.010",
                  means: "enough, not too much", remedy: "stop — you are done",
                },
                {
                  regime: "Overfit", train: "0.955", test: "0.945", gap: "~0.010",
                  means: "excess fits noise", remedy: "regularise or get data",
                },
              ] as const).map((r) => (
                <tr key={r.regime}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.regime}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.train}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.test}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{r.gap}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.means}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.remedy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Diagnostic configs on moons, five-seed averages.
        </p>

        <h2>Underfitting: both numbers are low</h2>
        <p>
          The underfit configuration — a small network that cannot represent the crescent boundary —
          reaches training accuracy 0.862 and test accuracy <strong>0.845</strong>. The gap is
          tiny, about 0.017, and that tiny gap is exactly the danger: it looks like a well-behaved
          model until you notice that 0.845 is far below the 0.953 a right-sized model reaches on
          the same data. The model is not overfitting because it has not learned enough <em>to</em>{" "}
          overfit.
        </p>
        <p>
          <strong>The remedy is capacity.</strong> Widen the layers first — width is the cheapest,
          most predictable knob (<Link href="/learn/architecture-design/what-width-buys" style={link}>what
          width buys</Link>). Only if widening does not lift training accuracy do you add depth, and
          only if the problem plausibly has a hierarchy to compose. Do <em>not</em> regularise an
          underfit model: it is already too constrained, and regularisation constrains it further.
        </p>

        <h2>A good fit: both high, gap small</h2>
        <p>
          The good-fit configuration — the depth-2, width-32 network with 1,185 parameters — reaches
          training accuracy 0.953 and test accuracy <strong>0.945</strong>, a gap of about 0.010.
          Both numbers are high, and they are close. The model has enough capacity to learn the
          boundary and not so much that it starts memorising the noise around it. This is the target
          state, and the correct action is to <strong>stop searching the architecture</strong>. If
          you need more accuracy from here, the lever is the data, the features, or the framing — not
          the model size.
        </p>

        <h2>Overfitting: train high, test lower, gap wide</h2>
        <p>
          Overfitting is the regime where training accuracy climbs while test accuracy stalls or
          falls, so the gap widens. The overfit configuration on this problem — a much larger
          network — drives training accuracy to 0.955 but holds test accuracy at{" "}
          <strong>0.945</strong>, the same as the right-sized model. The extra capacity bought a
          tighter fit to the training set and nothing on the test set: that difference is the
          excess fitting noise.
        </p>

        <Callout color={CORAL} title={<>On this problem, even the &ldquo;overfit&rdquo; config barely overfits</>}>
          The honest caveat: moons is a clean, low-dimensional, strongly-separated problem. The
          overfit configuration here only reaches a gap of about <strong>0.010</strong> — the signal
          is so strong that even a large network cannot memorise much beyond it. That is precisely
          why the <Link href="/learn/architecture-design/when-its-not-architecture" style={link}>L2
          experiment</Link> on a 3&times;128 net moves the gap from 0.015 to 0.016 — it does nothing,
          because there was almost no gap to close. Regularisation is not a free lunch when you are
          not overfitting. On a genuinely overfitting problem — noisier data, less of it, higher
          dimension — the gap reaches tens of points, and regularisation earns its keep. That is the
          subject of the <Link href="/learn/nn-regularisation" style={link}>Regularisation track</Link>.
        </Callout>

        <p>
          <strong>The remedy for real overfitting is not less architecture search — it is
          regularisation or more data.</strong> The model already has the representational power; it
          is misusing the excess. Weight decay, dropout, and early stopping all rein it in, and more
          training data gives the excess capacity something real to fit. Shrinking the network works
          too, but it throws away capacity you may want once the data grows.
        </p>

        <Proof color={CORAL} title="why the gap, not train loss alone, is the overfitting signal">
          <p>
            Training loss measures only how well the model fits the data it was optimised on, and
            the optimiser drives it down by construction. A low training loss is therefore
            consistent with <em>every</em> regime: an underfit model can still reach a modest
            training loss, a good fit reaches a low one, and an overfit model reaches the lowest of
            all. Training loss alone cannot distinguish &ldquo;learned the pattern&rdquo; from
            &ldquo;memorised the sample.&rdquo;
          </p>
          <p>
            Generalisation is by definition a statement about data the optimiser never touched. The
            only way to observe it is to compare performance on seen data against performance on
            held-out data — the gap. When the gap is small, the training performance is
            representative of true performance; when it is large, the training performance is
            inflated by memorisation that will not transfer. This is why held-out evaluation is not
            optional bookkeeping but the load-bearing measurement: it is the one number the
            optimiser could not have gamed, because it never saw it.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>A model reaches training accuracy 0.862 and test accuracy 0.845 — a gap of just
                0.017. The same problem is solvable at 0.953. Which regime is this, and what is the
                fix?</>,
              options: [
                "Overfitting — regularise it",
                "Underfitting — the small gap hides that both numbers are low, so add capacity (width first)",
                "A good fit — the gap is small, so leave it alone",
              ],
              answer: 1,
              explain: <>The small gap only rules out overfitting. Both absolute numbers sit far
                below the 0.953 a right-sized model reaches, so the model is too simple. The remedy
                is more capacity, starting with width — never regularisation, which would constrain
                an already-underfit model further.</>,
            },
            {
              q: <>Why can training loss alone not tell you whether a model is overfitting?</>,
              options: [
                "Training loss is always noisy and unreliable",
                "The optimiser minimises training loss by construction, so a low value is consistent with underfit, good-fit, and overfit models alike — only the train-test gap reveals generalisation",
                "Training loss cannot be computed on held-out data",
              ],
              answer: 1,
              explain: <>A low training loss is exactly what the optimiser is built to produce, so it
                appears in every regime. Overfitting is a statement about data the optimiser never
                saw, and the only way to observe it is the gap between seen and held-out
                performance.</>,
            },
            {
              q: <>On moons, the &ldquo;overfit&rdquo; configuration reaches a gap of only about 0.010,
                and adding L2 moved a 3&times;128 net&rsquo;s gap from 0.015 to 0.016. What is the
                lesson?</>,
              options: [
                "L2 regularisation is broken on this dataset",
                "Regularisation is not a free lunch — when the problem barely overfits, there is almost no gap to close, so regularisation does nothing measurable",
                "The overfit configuration should have used more parameters",
              ],
              answer: 1,
              explain: <>Moons is clean and strongly separated, so even a large network cannot
                memorise much beyond the real signal. With almost no gap to begin with, regularisation
                has nothing to remove. It earns its keep only on problems that genuinely overfit —
                the subject of the Regularisation track.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/reading-the-curve", label: <>&larr; Reading the learning curve</> }}
          next={{ href: "/learn/architecture-design/the-order-of-operations", label: <>Next up &middot; The order of operations &rarr;</> }}
        />
      </div>
    </article>
  );
}
