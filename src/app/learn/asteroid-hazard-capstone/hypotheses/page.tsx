import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "From plots to testable checks — Manifold",
  description:
    "Exploration is only worth something if it settles a prediction. Here we score the three Act-1 hypotheses with one quick numeric check each: H1 (size gates) confirmed as necessary but not sufficient, H2 (kinematics) revised to miss distance over velocity, H3 (leakage) structurally confirmed but its cost still to be measured.",
};

const SPACE = "var(--c-space)";

const VERDICTS = {
  confirmed: { label: "Confirmed", color: "var(--good)" },
  revised: { label: "Confirmed, but revised", color: "var(--warn)" },
  pending: { label: "Structure confirmed · cost still to measure", color: "var(--c-space)" },
} as const;

function HypoCard({ n, claim, verdict, children }: { n: string; claim: React.ReactNode; verdict: keyof typeof VERDICTS; children: React.ReactNode }) {
  const v = VERDICTS[verdict];
  return (
    <div style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${v.color}`, borderRadius: "0 12px 12px 0", background: "var(--surface)", padding: "14px 16px", margin: "16px 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: SPACE }}>{n}</span>
        <span style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, flex: 1, minWidth: 220 }}>{claim}</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: v.color, whiteSpace: "nowrap" }}>{v.label}</span>
      </div>
      <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

export default function HypothesesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 3 · Explore & analyse", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>From plots to testable checks</>}
        intro={<>
          Exploration only earns its keep if it <em>settles</em> something. We wrote three falsifiable hypotheses before
          looking; now we convert each into one quick numeric check and record the verdict — including the ones that come
          back &ldquo;not quite.&rdquo;
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Which of my hunches actually <em>survive</em> a check — and can I turn each plot into a single number that
          could prove me wrong?
        </AnalystQuestion>

        <h2>The move: every plot becomes one falsifiable number</h2>
        <p>
          A chart persuades; a number decides. The discipline that turns exploration into evidence is to reduce each
          hypothesis to the smallest quantity that could refute it — a rate, an AUC, a count — and read it against the
          prediction you committed to. Three hypotheses, three checks.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`H1 · size gates hazard
  hazardous rate, small objects (H > 22) : 0.0015   (0.15%)
  hazardous rate, big objects  (H <= 22) : 0.301    (30.1%)
  max H among hazardous objects          : 22.40    (none bigger)

H2 · kinematics separate the big ones  (H <= 22 subset)
  miss_distance   AUC : 0.604
  relative_velocity AUC : 0.535

H3 · repeated objects will leak
  duplicate-id rows : 63,413 / 90,836   (structure present)`}</CodeOutput>

        <h2>The scorecard</h2>

        <HypoCard n="H1" verdict="revised" claim={<>Size is a near-necessary condition for hazard.</>}>
          <strong>Necessary: yes.</strong> No hazardous object exceeds <code>H = 22.4</code>, and only 0.15% of small
          objects are flagged — being big is almost a prerequisite. <strong>Sufficient: no.</strong> Among big objects,
          just 30.1% are hazardous. So the correct statement is sharper than our hunch: size is a <em>gate</em>, not an
          <em> answer</em>. It cleanly removes ~70% of objects from suspicion, and hands the real problem — telling
          hazardous from harmless <em>among the big ones</em> — to the other features.
        </HypoCard>

        <HypoCard n="H2" verdict="revised" claim={<>Velocity and miss distance separate the big objects.</>}>
          <strong>Half right.</strong> We predicted both would do the work; the check says it&rsquo;s mostly{" "}
          <em>miss distance</em> (AUC 0.604) with velocity contributing little on its own (0.535). This is a genuine
          correction to our prior belief — and exactly the kind of surprise that written hypotheses exist to surface. It
          also lines up with the physics: miss distance stands in for the orbital-closeness half of the label that our
          data lacks.
        </HypoCard>

        <HypoCard n="H3" verdict="pending" claim={<>Repeated objects will inflate a naive test score.</>}>
          <strong>The structure is confirmed</strong> — 63,413 rows repeat an object, so a random split <em>can</em> leak
          an object across train and test. But a check on the raw data can only prove the <em>mechanism</em> exists, not
          how badly it flatters a score. Measuring that inflation needs a controlled experiment: train once with a random
          split, once with a grouped split, and compare. That experiment is the centrepiece of the next act.
        </HypoCard>

        <Callout color={SPACE} title={<>Being wrong on paper is the point</>}>
          Two of our three predictions came back <em>revised</em>, and that&rsquo;s a success, not a failure. We now
          hold sharper, defensible beliefs — size gates but doesn&rsquo;t decide; miss distance, not velocity, does the
          fine separation — <em>and</em> a precise open question to carry into modelling. Had we only plotted without
          predicting first, we&rsquo;d have &ldquo;confirmed&rdquo; whatever the charts happened to show and learned far
          less.
        </Callout>

        <p>
          Exploration is done. We understand what one row is, which columns are real, what shape they take, what
          separates the classes, and where the one remaining danger lives. The next act stops looking and starts building
          — but carefully, locking an honest evaluation harness <em>before</em> the first model, so that H3&rsquo;s
          leakage can never quietly inflate a number we report.
        </p>

        <TransferBox>
          At the end of any exploration, write a one-line verdict for each hypothesis: confirmed, refuted, or revised —
          with the number that decided it. The revisions are your real deliverable from EDA. Any hunch you{" "}
          <em>couldn&rsquo;t</em> settle with the raw data becomes a designed experiment for later, exactly like H3.
        </TransferBox>

        <PlaybookRule n={9}>
          Turn every plot into a <strong>falsifiable number</strong> and record a verdict per hypothesis. Prize the
          <em> revisions</em> — and promote any hunch the raw data can&rsquo;t settle into a designed experiment.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/separation", label: <>← What separates the classes?</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/metrics", label: <>Next up · Choose the metric by cost →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.metrics import roc_auc_score

# H1: does size gate hazard? compare hazardous rate by size, check the ceiling
small, big = df[df.absolute_magnitude > 22], df[df.absolute_magnitude <= 22]
print("small rate:", small.hazardous.mean(), " big rate:", big.hazardous.mean())
print("max H among hazardous:", df[df.hazardous].absolute_magnitude.max())

# H2: among big objects, which kinematic feature separates?
yb = big.hazardous.astype(int)
for c in ["miss_distance", "relative_velocity"]:
    print(c, round(max(roc_auc_score(yb, big[c]), roc_auc_score(yb, -big[c])), 3))

# H3: is the leakage mechanism present at all?
print("duplicate-id rows:", len(df) - df.id.nunique())`;
