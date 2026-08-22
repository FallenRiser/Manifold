import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { PredictPrompt } from "@/components/PredictPrompt";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Research questions & hypotheses — Manifold",
  description:
    "Turn curiosity into falsifiable, written predictions before touching a model: H1 size gates hazard, H2 kinematics separate the big ones, H3 duplicate objects will leak. Committing to a prediction beats post-hoc storytelling.",
};

const SPACE = "var(--c-space)";

export default function ResearchQuestionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 1 · Frame the field", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Research questions &amp; hypotheses</>}
        intro={<>
          The field research handed us strong hunches. The discipline now is to write them down as{" "}
          <em>falsifiable predictions</em> — before we look — so that the exploration that follows tests our thinking
          instead of flattering it.
        </>}
      />

      <div className="lesson">
        <AnalystQuestion>
          What will you actually test — and what do you predict, <em>in writing</em>, before you look?
        </AnalystQuestion>

        <h2>Why commit to a prediction first</h2>
        <p>
          After you&rsquo;ve seen a plot, everything looks obvious — hindsight quietly rewrites what you &ldquo;expected
          all along.&rdquo; Writing hypotheses <em>first</em> converts exploratory plotting from story-telling into
          genuine hypothesis testing. When a result surprises you, that gap — between what you predicted and what
          happened — is the most valuable thing on the page. You can only feel it if you committed first.
        </p>

        <h2>Our three hypotheses</h2>
        <p>Straight from the field guide, each with a prediction we can be wrong about:</p>
        <ol style={ol}>
          <li>
            <strong>H1 · Size gates hazard.</strong> Because size is literally half the PHA definition, we predict{" "}
            <code>absolute_magnitude</code> alone will be a <em>near-necessary</em> condition — almost every hazardous
            object will be big — and a simple size threshold will already be a strong, if incomplete, predictor.
          </li>
          <li>
            <strong>H2 · Kinematics separate the big ones.</strong> Among large objects, we predict{" "}
            <code>miss_distance</code> and <code>relative_velocity</code> will do the real separating work — standing in
            for the orbital-distance half of the definition our data is missing.
          </li>
          <li>
            <strong>H3 · Structure will leak.</strong> Each row is one close approach, and objects make many approaches.
            We predict the same object appears in many rows — so a naive random train/test split will let a model
            memorise objects and report a score that&rsquo;s too good to be true.
          </li>
        </ol>

        <PredictPrompt
          accent={SPACE}
          prompt={<>Once size is accounted for, which will matter <em>more</em> for separating hazardous from harmless big objects?</>}
          options={["Relative velocity", "Miss distance", "About equal", "Neither — size is the whole story"]}
          nudge="Locked in. We'll settle it with real numbers in Act 3 — and again when the models disagree with the simple rule."
        />

        <Callout color={SPACE} title={<>Good hypotheses are falsifiable</>}>
          Notice each prediction could be <em>wrong</em>, and we&rsquo;d know it: H1 fails if hazardous objects are
          spread across all sizes; H2 fails if kinematics add nothing beyond size; H3 fails if every row is a distinct
          object. &ldquo;The data will be interesting&rdquo; is not a hypothesis — it can never be refuted, so it
          teaches nothing.
        </Callout>

        <TransferBox>
          On your own data, write two or three falsifiable hypotheses before the first chart. Keep them where you can
          see them. Score yourself later — the predictions you got <em>wrong</em> are where you actually learned the
          domain.
        </TransferBox>

        <PlaybookRule n={3}>
          Write <strong>falsifiable hypotheses before you model.</strong> A prediction you commit to beats post-hoc
          storytelling — and its failures are where the learning is.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/neo-field-guide", label: <>← The NEO field guide</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/first-look", label: <>Next up · Load &amp; look: what is one row? →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.9 };
