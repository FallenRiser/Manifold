import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { MS_DONE, MS_TOTAL } from "@/lib/modelSelectionTrack";

export const metadata = {
  title: "Model selection — Manifold",
  description:
    "Every comparison you make spends a little of your ability to trust the result. This pillar is about choosing among models, tuning capacity, and validating honestly — the practitioner's counterpart to learning theory, with real measurements of exactly how much selection costs you.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CHAPTERS: { name: string; href: string; blurb: string; topics: string }[] = [
  {
    name: "The selection problem",
    href: "/learn/model-selection/what-youre-choosing",
    blurb: "What you're really choosing when you pick a model, and the trap that makes the winner's score a lie.",
    topics: "hypothesis classes · approximation vs estimation · selection optimism",
  },
  {
    name: "Validation done right",
    href: "/learn/model-selection/train-validation-test",
    blurb: "Three splits, k folds, and the nested procedure that keeps a tuned model's score honest.",
    topics: "train/val/test · cross-validation · choosing k · nested CV",
  },
  {
    name: "Controlling capacity",
    href: "/learn/model-selection/structural-risk-minimization",
    blurb: "Four different dials that all do the same job — making your effective hypothesis class smaller.",
    topics: "SRM · regularization · early stopping · AIC, BIC & MDL",
  },
  {
    name: "Selecting in the real world",
    href: "/learn/model-selection/learning-curves",
    blurb: "Diagnosing which error dominates, preferring simpler models on purpose, and what to do when your data isn't i.i.d.",
    topics: "learning curves · the one-SE rule · grouped & time-aware splits · the checklist",
  },
];

export default function ModelSelectionHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Model selection", color: GRAY },
          { label: MS_DONE >= MS_TOTAL ? `Complete · ${MS_TOTAL} pages` : `${MS_DONE} of ${MS_TOTAL} pages`, color: GRAY },
        ]}
        time="a pillar track"
        title={<>Choosing among models</>}
        intro={<>You have six candidate models, four hyperparameters each, and one dataset. Picking the one with
          the best validation score sounds obviously correct, and it is one of the most reliable ways to fool
          yourself in applied machine learning. This pillar is how to choose well — and how to know what your
          choice cost.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The one idea underneath all of it</h2>
        <p>
          <strong>Every comparison you make spends a little of your ability to trust the result.</strong> Score two
          models on a validation set and the winner looks slightly better than it is. Score two hundred and the
          winner looks a lot better than it is — even when all two hundred are worthless.
        </p>
        <p>
          That is not a hypothetical. Take 200 &ldquo;models&rdquo; that are all literally coin flips with true
          accuracy 0.500, score each on 200 validation examples, and report the best. Averaged over 2,000 trials,
          that reported number is <strong>0.5975</strong> — nearly ten points of pure illusion, manufactured by the
          act of choosing. (Real run:{" "}
          <code>scripts/model_selection_cases.py</code>.) Nobody cheated, nobody overfit a model. Selection did it.
        </p>
        <p>
          Almost every bad practice in applied ML is a failure to account for that, and almost every good practice
          — held-out sets, cross-validation, nested CV, the one-standard-error rule — is a way of paying for it
          honestly.
        </p>

        <Callout color={GRAY} title={<>How this relates to the learning theory track</>}>
          <Link href="/learn/learning-theory" style={link}>Learning theory</Link> proves <em>why</em> a held-out
          score can be trusted and exactly what searching many hypotheses costs — its{" "}
          <Link href="/learn/learning-theory/the-union-bound-argument" style={link}>union bound page</Link> is the
          formal version of the paragraph above. This pillar is the practical counterpart: the procedures, the
          diagnoses, and the judgement calls. You can read either first. The theory makes this track&rsquo;s rules
          feel inevitable rather than arbitrary; this track makes the theory feel useful rather than abstract.
        </Callout>

        <h2>The four chapters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {CHAPTERS.map((c) => (
            <Link key={c.name} href={c.href} className="gcard" style={{ ["--accent" as string]: GRAY, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 15.5, fontWeight: 500, color: GRAY, marginBottom: 4 }}>{c.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{c.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{c.topics}</div>
            </Link>
          ))}
        </div>

        <h2>Every number here is measured</h2>
        <p>
          This pillar makes quantitative claims — how much optimism a grid search injects, how much nested
          cross-validation recovers, what the one-standard-error rule costs you. All of them come from real runs in{" "}
          <code>scripts/model_selection_cases.py</code>, with seeds and protocols stated on the page. Where the
          honest answer is &ldquo;the effect is small&rdquo;, we say so rather than inflating it: on a 20-point
          grid the selection optimism is <M>{String.raw`+0.006`}</M>, not a catastrophe. Knowing which
          mistakes are small is as useful as knowing which are large.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/model-selection/what-youre-choosing", label: <>Start · What you&rsquo;re actually choosing →</> }}
        />
      </div>
    </article>
  );
}
