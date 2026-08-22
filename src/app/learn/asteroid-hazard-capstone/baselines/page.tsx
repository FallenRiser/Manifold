import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Baselines: the number to beat — Manifold",
  description:
    "Before the first real model, establish the trivial scores every model must beat: the majority classifier (PR-AUC = prevalence, 0.10) and the one-feature size rule (PR-AUC 0.289 on the honest grouped split). The size rule, not chance, is the real bar — any model that can't clear it has learned nothing beyond 'is it big?'.",
};

const SPACE = "var(--c-space)";

export default function BaselinesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Baselines: the number to beat</>}
        intro={<>
          The harness is locked: PR-AUC on a grouped split. The last thing to fix before the first real model is the{" "}
          <em>bar</em> — the trivial scores any model worth its complexity must clear. Skip this and you have no way to
          know whether a fancy model actually did anything.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          What&rsquo;s the score a model gets for doing almost nothing — and what&rsquo;s the score it gets from the one
          obvious feature alone?
        </AnalystQuestion>

        <h2>Two baselines, two different jobs</h2>
        <p>
          A baseline is not one number; it&rsquo;s a floor and a bar. The <strong>floor</strong> tells you what
          &ldquo;no skill&rdquo; scores. The <strong>bar</strong> tells you what &ldquo;the obvious idea&rdquo; scores —
          and it&rsquo;s usually the harder, more honest thing to beat.
        </p>
        <ul style={ul}>
          <li>
            <strong>The floor — majority / chance.</strong> A model that always predicts the majority class. Its PR-AUC
            is just the positive prevalence. If a model can&rsquo;t beat this, it has negative skill.
          </li>
          <li>
            <strong>The bar — the simplest sensible rule.</strong> Here that&rsquo;s the one-feature size rule (rank by{" "}
            −H). It encodes the domain fact that big objects are the hazardous ones — the &ldquo;gimme&rdquo; half
            of the label. This is the number a real model must beat to justify its existence.
          </li>
        </ul>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`baselines on the grouped split (PR-AUC)
  majority (chance)      0.100      <- the floor
  size rule (-H)         0.289      <- the bar to beat

  (ROC-AUC, for reference: majority 0.500, size rule 0.869)`}</CodeOutput>

        <Callout color={SPACE} title={<>The bar is 0.289, not 0.10</>}>
          It would be easy to feel good about a model scoring 0.30 PR-AUC — it&rsquo;s 3× chance! But chance is the wrong
          comparison. The honest bar is the size rule at <strong>0.289</strong>, because a single-line rule already
          captures the obvious signal for free. A model that lands at 0.30 has essentially <em>tied a one-liner</em> and
          justified none of its complexity. The real question for every model in the next act is not &ldquo;did it beat
          chance?&rdquo; but &ldquo;did it beat the size rule — and by enough to be worth its cost?&rdquo;
        </Callout>

        <p>
          This reframes the whole modelling act. From the exploration we already know where the lift <em>must</em> come
          from: not from size (the rule has that), but from what miss distance and velocity add <em>among the big
          objects</em>. The baseline turns that insight into a scoreboard. Any model&rsquo;s worth is precisely its
          margin over 0.289.
        </p>

        <TransferBox>
          Always set two baselines before modelling: a trivial floor (majority, or the mean for regression) and the
          simplest domain-sensible rule (one strong feature, a threshold, last-value-carried-forward for time series).
          Report every model as its <em>margin over the sensible baseline</em>, not its raw score. A model that only ties
          the one-liner is a more expensive one-liner.
        </TransferBox>

        <PlaybookRule n={12}>
          <strong>Baseline before you model.</strong> Set a trivial floor and the simplest sensible rule, then judge
          every model by its <em>margin over the sensible baseline</em> — not by its raw score, and not against chance.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/the-split", label: <>← The split: the leakage trap</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/logistic", label: <>Next up · Logistic regression →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.metrics import average_precision_score, roc_auc_score

# evaluate on the GROUPED test set locked in on the previous page
print("majority PR-AUC:", yte.mean())                        # = prevalence
score = -Xte[:, 0]                                            # size rule: -H
print("size rule PR-AUC:", average_precision_score(yte, score))
print("size rule ROC-AUC:", roc_auc_score(yte, score))`;

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
