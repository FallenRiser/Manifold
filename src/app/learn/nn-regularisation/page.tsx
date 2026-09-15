import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { REG_NN_DONE, REG_NN_TOTAL } from "@/lib/regularisationTrack";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LearningCurve } from "@/components/figures/LearningCurve";
import { ES_CURVE } from "@/components/figures/nnReg/curves";

export const metadata = {
  title: "Regularisation — Manifold",
  description:
    "Dropout, weight decay, early stopping, augmentation — the tools that close the gap between training and test performance, each demonstrated on a network that genuinely overfits. The sixth and final track of the neural networks family.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The gap",
    href: "/learn/nn-regularisation/the-gap-revisited",
    blurb: "First, build a network that genuinely overfits — train 1.000, test 0.756. You cannot demonstrate a cure on a patient who is not sick.",
    topics: "the gap · capacity · when to regularise",
  },
  {
    name: "Weight decay",
    href: "/learn/nn-regularisation/l2-penalty",
    blurb: "Penalise large weights. Where that works (regression, SGD) and — honestly — where it barely moves the needle, and why weight decay is not the same as L2.",
    topics: "the L2 penalty · decay ≠ L2 · how much · the landscape",
  },
  {
    name: "Dropout",
    href: "/learn/nn-regularisation/randomly-removing-units",
    blurb: "Randomly delete units each step. The single most effective regulariser on this problem — test 0.756 → 0.777 — and the ensemble idea that explains why.",
    topics: "removing units · why it works · the rate · test time · ensembles",
  },
  {
    name: "Early stopping & augmentation",
    href: "/learn/nn-regularisation/early-stopping",
    blurb: "Stop when validation loss bottoms; manufacture new data from old. Two regularisers that cost almost nothing and are almost always worth it.",
    topics: "early stopping · patience · augmentation · label smoothing & mixup",
  },
  {
    name: "Combining regularisers",
    href: "/learn/nn-regularisation/interactions",
    blurb: "The effects partly stack — weight decay plus dropout beats either alone — and BatchNorm quietly regularises too. A playbook, and the whole family in one view.",
    topics: "interactions · BatchNorm as reg · the playbook · the family",
  },
];

export default function RegularisationHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Neural networks", color: CORAL },
          { label: REG_NN_DONE >= REG_NN_TOTAL ? `Complete · ${REG_NN_TOTAL} pages` : `${REG_NN_DONE} of ${REG_NN_TOTAL} pages`, color: CORAL },
        ]}
        time="the family's sixth track"
        title={<>Closing the gap, <em>honestly</em></>}
        intro={<>The architecture track taught you to <strong>diagnose</strong> a train–test gap. This
          track teaches you to <strong>close</strong> it — with the neural network&rsquo;s own toolkit:
          weight decay, dropout, early stopping, data augmentation. But a regulariser you cannot see
          working is a superstition, so every tool here is measured on a network that genuinely
          overfits: <strong>train 1.000, test 0.756, a gap of 0.244</strong> waiting to be closed.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The claim this track rests on</h2>
        <p>
          <strong>Regularisation closes the gap between training and test performance — once you have
          verified that the gap is the problem.</strong> Every technique here trades a little training
          accuracy for a little test accuracy. That trade is only worth making when the model is
          overfitting; on a model that is underfitting, regularisation makes things strictly worse.
          Diagnosis first, then treatment.
        </p>
        <p>
          And the treatments are not equal. On the problem running through this track, <strong>dropout
          is the clear winner</strong> — test accuracy climbs from 0.756 to 0.777 at rate 0.5.{" "}
          <strong>Weight decay, the technique every textbook lists first, barely moves it</strong> under
          the optimiser and data here — a finding we do not hide but explain. Input augmentation reaches
          0.784. And the effects partly stack: weight decay plus dropout reaches 0.781, more than either
          alone.
        </p>

        <Callout color={CORAL} title={<>The honest findings, kept in</>}>
          Every number in this track is measured, not asserted. The setup is deliberately overfittable — a 3×256 MLP
          on 250 points with 10% label noise — because{" "}
          <em>you cannot demonstrate a regulariser on a problem that does not overfit</em>. That includes
          the uncomfortable results: weight decay is nearly inert here while dropout works, and label
          smoothing barely touches accuracy (it changes calibration, not the boundary).
        </Callout>

        <PredictPrompt
          accent={CORAL}
          prompt={<>A wide network is fitted to 80 noisy points and trained for 4,000 epochs. Its
            held-out error reaches its minimum at some point along the way. Roughly where?</>}
          options={[
            "Near the end — that is what the epochs are for",
            "Around halfway",
            "In the first few hundred epochs",
            "In the first fifty epochs",
          ]}
          nudge="Locked in. The trajectory is below."
        />

        <LearningCurve
          x={ES_CURVE.epochs}
          series={[
            { label: "training error", values: ES_CURVE.train, color: "var(--muted)", dash: "4 3" },
            { label: "held-out error", values: ES_CURVE.val, color: "var(--c-neural)" },
          ]}
          markAt={ES_CURVE.bestEpochOfMeanCurve}
          markLabel={`best held-out · epoch ${ES_CURVE.bestEpochOfMeanCurve}`}
          ylabel="MSE"
          caption={<>The whole track in one picture. Training error falls for four thousand epochs and
            never stops falling — that is the curve you would be watching if you only logged the
            training loss. Held-out error bottoms out at <strong>epoch 34</strong> (averaged per seed;
            the averaged curve drawn here turns at epoch 45) and then climbs for the remaining 99% of
            the run, finishing at 0.183 against its minimum of 0.082 — more than twice as bad as the
            model you already had at epoch 45. Everything in this track is a way of not spending those
            3,966 epochs.</>}
        />

        <h2>The five chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: CORAL, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: CORAL, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>What you should already have</h2>
        <p>
          <Link href="/learn/architecture-design/reading-the-curve" style={link}>The diagnostic loop</Link>{" "}
          from Architecture design — because regularisation is the second half of that loop, the part
          you reach for once the learning curve shows a real gap.{" "}
          <Link href="/learn/initialisation-and-normalisation/when-batchnorm-helps" style={link}>BatchNorm</Link>{" "}
          from the previous track, which turns out to regularise as a side effect — the last chapter here
          says exactly how much.{" "}
          <Link href="/learn/model-selection/regularization-as-capacity" style={link}>Regularisation as capacity control</Link>{" "}
          from Model selection for the theory this track makes concrete.
        </p>

        <h2>Where it goes — the family closes here</h2>
        <p>
          This is the sixth and final track of the neural networks family. With it you have the whole
          arc: a <Link href="/learn/perceptron-to-mlp" style={link}>unit and a forward pass</Link>,{" "}
          <Link href="/learn/backpropagation" style={link}>gradients</Link> to train it,{" "}
          <Link href="/learn/activation-functions" style={link}>activations</Link> and{" "}
          <Link href="/learn/architecture-design" style={link}>an architecture</Link> to shape it,{" "}
          <Link href="/learn/initialisation-and-normalisation" style={link}>a starting point</Link> that
          lets it train, and now the tools to make it <em>generalise</em>. The final page collects what
          you have built.
        </p>

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation", label: <>← Initialisation &amp; normalisation</> }}
          next={{ href: "/learn/nn-regularisation/the-gap-revisited", label: <>Start · The train–test gap, revisited →</> }}
        />
      </div>
    </article>
  );
}
