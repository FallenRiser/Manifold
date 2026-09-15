import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { DecisionPoint } from "@/components/DecisionPoint";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { COMBOS } from "@/components/figures/nnReg/data";

export const metadata = {
  title: "The regularisation playbook — Manifold",
  description:
    "The ordered procedure you have earned: confirm the gap, reach for the regulariser that fits the data, add the cheap ones, combine across failure modes, and remember BatchNorm already regularises. Plus the honest ranking on this problem — and why it is not universal.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ThePlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Combining regularisers", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>The regularisation playbook</>}
        intro={<>You now have every tool this track teaches, each one measured on the same overfitting
          network. This chapter turns them into an ordered procedure — the sequence to run when a real
          train&ndash;test gap appears in front of you. It is a checklist, not a recipe: every step is a
          decision you make from a measurement, and the ranking at the end is a property of{" "}
          <em>this</em> problem, not a law.</>}
      />

      <div className="lesson">
        <h2>The ordered playbook</h2>
        <ol style={{ lineHeight: 1.8 }}>
          <li>
            <strong>Confirm there is a gap.</strong> Read both numbers. Regularisation only helps a model
            that overfits — high train, lower test. If the model is underfitting (both low), regularising
            makes it strictly worse; the fix there is capacity, not constraint (
            <Link href="/learn/nn-regularisation/the-gap-revisited" style={link}>the train-test gap,
            revisited</Link> and <Link href="/learn/nn-regularisation/when-to-regularise" style={link}>when
            to regularise</Link>).
          </li>
          <li>
            <strong>Reach for the regulariser that fits the data.</strong> Not the one the textbook lists
            first. On this problem <Link href="/learn/nn-regularisation/randomly-removing-units" style={link}>dropout</Link>{" "}
            and <Link href="/learn/nn-regularisation/data-augmentation" style={link}>augmentation</Link> did
            the work; <Link href="/learn/nn-regularisation/l2-penalty" style={link}>weight decay</Link> was
            nearly inert. Which one wins is a question you answer by measuring, because it depends on the
            data and the optimiser (
            <Link href="/learn/nn-regularisation/dropout-rate" style={link}>dropout rate and where to apply
            it</Link>).
          </li>
          <li>
            <strong>Add early stopping and augmentation almost always.</strong> They are the cheap ones.
            Early stopping costs a validation split and buys you the best point on the curve for free;
            augmentation manufactures data you already implicitly have. Both are close to free and rarely
            hurt (
            <Link href="/learn/nn-regularisation/early-stopping" style={link}>early stopping</Link>).
          </li>
          <li>
            <strong>Combine two that attack different failure modes, and tune them together.</strong> Weight
            decay (weight magnitude) beside dropout (unit co-adaptation) reached 0.781, beating either alone
            — but the best rate for a technique in company is not its best rate solo, so re-tune the pair.
            Do not stack two of the same kind (
            <Link href="/learn/nn-regularisation/interactions" style={link}>the interaction between
            techniques</Link>).
          </li>
          <li>
            <strong>Remember BatchNorm already regularises.</strong> If it is in your network for training
            stability, it has already spent part of your noise budget (+0.012 here). Use less explicit
            dropout when BatchNorm is present (
            <Link href="/learn/nn-regularisation/batchnorm-as-reg" style={link}>BatchNorm as implicit
            regularisation</Link>).
          </li>
        </ol>

        <Callout color={CORAL} title={<>The ranking on this problem — and only this problem</>}>
          Ordered by test accuracy on the 3&times;256 MLP over 250 noisy points (baseline 0.753):
          <ul style={{ margin: "8px 0 0", lineHeight: 1.7 }}>
            <li><strong>input jitter 0.4 &mdash; 0.784</strong> (best single regulariser)</li>
            <li><strong>weight decay + dropout &mdash; 0.781</strong> (the pair beats dropout-0.3&rsquo;s 0.772)</li>
            <li><strong>dropout 0.5 &mdash; 0.777</strong></li>
            <li><strong>BatchNorm &mdash; 0.763</strong> (free, from training-stability layers)</li>
            <li><strong>weight decay &mdash; ~0.751</strong> (inert here)</li>
          </ul>
          <span style={{ display: "block", marginTop: 8 }}>
            Read this as a fact about <em>this</em> dataset and optimiser, never as a universal order. On a
            different problem the ranking reshuffles — the whole point of the track is that you measure it
            rather than memorise it.
          </span>
        </Callout>

        <Dumbbell
          rows={COMBOS.map((c) => ({ init: c.label, a: c.test }))}
          seriesLabels={["test accuracy on the track's overfitting problem"]}
          ticks={[0.75, 0.76, 0.77, 0.78]}
          caption={<>The playbook is ordered by this figure, not by tradition. Weight decay — the item
            every textbook lists first — is the flat one here. Dropout is the one that moves. The two
            together are the best configuration measured, and adding a third regulariser on top makes
            it worse. An ordering that put decay first would have you spending your first afternoon on
            the row that does nothing.</>}
        />

        <DecisionPoint
          accent={CORAL}
          question={<>A model reports <strong>train 0.91, validation 0.88</strong>. The team wants
            another two points and someone proposes adding dropout at 0.5, since that was the best
            single regulariser measured in this track. What do you do?</>}
          options={[
            {
              label: "Add the dropout — 0.5 was the measured optimum",
              verdict: "miss",
              response: <>The measured optimum for <em>a network with a 0.244 gap</em>. This one has a
                gap of 0.03. Every regulariser in this track buys test accuracy by spending training
                accuracy, and there is almost none here to spend — dropout at 0.5 on this model will
                take both numbers down. The rate is not the thing that transfers between problems; the
                diagnosis is.</>,
            },
            {
              label: "Neither — the gap is small, so look for headroom instead",
              verdict: "best",
              response: <>Right. Three points of gap is not an overfitting problem, so nothing in this
                track applies. The two numbers together say the model is limited by what it can
                represent or by what it has been shown, which puts you back in the architecture
                track&rsquo;s territory: more capacity, longer training, better features, more data.
                This is the top-left cell of the diagnostic square, and the correct move from it is to
                stop reading this track.</>,
            },
            {
              label: "Add weight decay instead — it is the gentler option",
              verdict: "close",
              response: <>Gentler, and therefore less harmful, so this is a defensible instinct. But it
                is still the wrong cell: a gentle treatment for a condition the patient does not have
                is not a compromise, it is a delay. It also happens to be the technique that did
                nothing at all on the problem where regularisation genuinely was the answer.</>,
            },
            {
              label: "Try all of them and keep whichever validation likes best",
              verdict: "close",
              response: <>This will not damage the model, and on a large enough validation set it is a
                legitimate if inelegant search. The costs are real though: you will burn the afternoon,
                and every extra configuration scored on the same validation set is another chance to
                fit it. Diagnosis first is cheaper and it tells you <em>why</em>, which is what you
                need the next time the numbers look like this.</>,
            },
          ]}
        />

        <h2>Pick the right implementation, not just the right technique</h2>
        <p>
          One trap sits underneath the whole playbook: two things that share a name can be different updates.
          Applying weight decay through AdamW&rsquo;s decoupled decay scored 0.751; putting the <em>same</em>{" "}
          nominal strength into the loss as an L2 penalty and letting Adam adapt it scored 0.770 — a gap of
          0.019 from an implementation choice, not a hyperparameter (
          <Link href="/learn/nn-regularisation/weight-decay-vs-l2" style={link}>weight decay is not L2</Link>).
          The lesson generalises: when a regulariser does less than you expect, check that the update you are
          running is the update you think you are running before you conclude the technique itself has failed.
        </p>

        <h2>The shape of the procedure</h2>
        <p>
          Notice the arc. You start by <em>refusing to regularise</em> until a gap is proven, because the most
          common regularisation mistake is treating an underfit model. Then you spend your effort on the
          techniques that fit the data, add the cheap ones by default, and only combine deliberately across
          different failure modes — stopping the moment the test number turns down, which is the face of
          over-regularisation. It is a search with priors, run one change at a time, each result read off a
          held-out measurement. That discipline is worth more than any single technique in it.
        </p>

        <Proof color={CORAL} title="why 'which regulariser wins' cannot be known a priori">
          <p>
            Each regulariser encodes an <em>assumption</em> about where the true function lives: weight decay
            assumes small weights, dropout assumes distributed and redundant features, augmentation assumes
            invariance to the perturbations you apply. A regulariser helps exactly to the degree its
            assumption matches the target function — and it hurts when the assumption is wrong.
          </p>
          <p>
            The no-free-lunch result makes this precise: averaged over all possible target functions, no
            regularisation bias beats any other. There is no ordering of techniques that is best across all
            problems, because &ldquo;best&rdquo; is defined relative to a matching between the technique&rsquo;s
            assumption and the problem&rsquo;s structure, and that matching is a property of the data. This is
            not a gap in the theory to be filled by a cleverer rule; it is why the playbook ends in a
            measurement rather than a verdict. You rank regularisers on <M>{String.raw`\text{your}`}</M>{" "}
            validation set because there is no other place the ranking could come from.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The playbook opens with &ldquo;confirm there is a gap&rdquo; before any technique. Why is
                that step first?</>,
              options: [
                "It is a formality; you can safely regularise any model",
                "Regularisation trades training accuracy for test accuracy, which only helps an overfitting model — on an underfitting model it makes things strictly worse",
                "You need the gap number to compute the dropout rate",
              ],
              answer: 1,
              explain: <>Regularisation is treatment for overfitting. If the model underfits (both train and
                test low), constraining it further only lowers the numbers. Diagnosis before treatment: prove
                a high-train/low-test gap exists before reaching for any regulariser.</>,
            },
            {
              q: <>AdamW decoupled weight decay scored 0.751 while the same nominal strength as an L2 penalty
                under Adam scored 0.770. What is the general lesson?</>,
              options: [
                "Weight decay is always worse than L2",
                "Two updates that share a name can differ: check that the implementation you are running matches your mental model before concluding the technique failed",
                "The 0.019 difference is measurement noise and means nothing",
              ],
              answer: 1,
              explain: <>Decoupled decay and L2-in-the-loss are genuinely different updates once the optimiser
                adapts per-parameter learning rates. The 0.019 gap came from the implementation, not the
                hyperparameter — so when a regulariser underperforms, verify the update before blaming the
                technique.</>,
            },
            {
              q: <>On this problem input jitter (0.784) topped the ranking and weight decay (~0.751) sat at the
                bottom. How should you use that ranking on your next problem?</>,
              options: [
                "Apply the same order — jitter first, weight decay last — everywhere",
                "Treat it as a fact about this dataset and optimiser only; re-measure on your own validation set because which regulariser wins depends on the problem",
                "Conclude weight decay is a bad technique and never use it",
              ],
              answer: 1,
              explain: <>Each regulariser encodes an assumption about the target function, and it helps only
                when that assumption matches the data. No-free-lunch guarantees no universal ordering, so the
                ranking is a property of this problem. You re-rank on your own validation set every time.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/batchnorm-as-reg", label: <>&larr; BatchNorm as implicit regularisation</> }}
          next={{ href: "/learn/nn-regularisation/family-summary", label: <>Next up &middot; The neural networks family: what you now have &rarr;</> }}
        />
      </div>
    </article>
  );
}
