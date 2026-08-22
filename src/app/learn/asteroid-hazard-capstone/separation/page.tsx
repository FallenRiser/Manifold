import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { NeoField } from "@/components/figures/NeoField";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "What separates the classes? — Manifold",
  description:
    "Which features actually separate hazardous from harmless — and why a feature's marginal signal can flip once you condition on what you already know. On the whole data, velocity out-separates miss distance; among big objects only, miss distance wins. Single-feature separation, honestly measured.",
};

const SPACE = "var(--c-space)";

export default function SeparationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 3 · Explore & analyse", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>What separates the classes?</>}
        intro={<>
          Now the central exploratory question of any classification problem: for each feature, do the two classes{" "}
          <em>look different</em>? We&rsquo;ll answer it visually and with one honest number per feature — and then watch
          that number flip when we condition on what we already know.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Feature by feature, do the classes separate — and am I sure that separation is <em>real</em>, not an artifact
          of something I already know?
        </AnalystQuestion>

        <h2>See it first: the whole problem in one plot</h2>
        <p>
          Before any statistic, look. Each dot is one object, placed by its miss distance (across) and its size (up the
          axis, since smaller <em>H</em> means bigger). Amber is hazardous, indigo is harmless.
        </p>
        <figure style={{ margin: "18px 0 6px" }}>
          <NeoField />
          <figcaption style={cap}>
            200 sampled objects. The separation is almost entirely <em>vertical</em>: every amber dot sits above the
            size gate. Across the horizontal (miss distance) axis the two colours overlap heavily.
          </figcaption>
        </figure>
        <p>
          The picture makes one thing obvious and one thing subtle. Obvious: <strong>size does the heavy lifting</strong>{" "}
          — hazardous objects are the big ones, clustered above the gate. Subtle: <em>above</em> the gate, amber and
          indigo are thoroughly mixed, so something else must be doing the finer separation there. Both observations are
          testable, so let&rsquo;s put a number on each feature.
        </p>

        <h2>One honest number per feature: single-feature AUC</h2>
        <p>
          A quick, threshold-free way to score how well a <em>single</em> feature separates two classes is the
          area under its ROC curve — the probability that a random hazardous object ranks ahead of a random harmless one
          on that feature alone. 0.5 is coin-flip; 1.0 is perfect. It costs one line per feature.
        </p>
        <CodeBlock fromScratch={code1} />
        <CodeOutput>{`single-feature ROC-AUC (all objects)
  absolute_magnitude   0.865      <- size: strong, as the plot showed
  relative_velocity    0.679      <- moderate
  miss_distance        0.542      <- barely above chance`}</CodeOutput>
        <p>
          This confirms the eye: size (0.865) separates strongly, velocity (0.679) moderately, miss distance (0.542)
          almost not at all. A beginner stops here and concludes <em>&ldquo;miss distance is useless, velocity is the
          second-best feature.&rdquo;</em> That conclusion is a trap — and catching it is the real lesson of this page.
        </p>

        <h2>The move that separates analysts: condition on the gimme</h2>
        <p>
          We already know size is nearly the whole label — almost every small object is harmless. So a feature&rsquo;s
          separation <em>across all objects</em> is dominated by how it happens to correlate with size. The question we
          actually care about is the one the plot raised: <strong>among the big objects — the only ones in play — what
          separates hazardous from harmless?</strong> So we re-run the exact same measurement on the subset with{" "}
          <code>H ≤ 22</code>.
        </p>
        <CodeBlock fromScratch={code2} />
        <CodeOutput>{`among big objects only (H <= 22, n = 29,101, 30.1% hazardous)
  miss_distance        0.604      <- now the STRONGER of the two
  relative_velocity    0.535      <- now barely above chance

(whole-data ranking was the opposite: velocity 0.679 > miss 0.542)`}</CodeOutput>
        <Callout color={SPACE} title={<>The ranking flips — and the flip is the finding</>}>
          Across all objects, velocity looked like the better feature. But that was mostly velocity riding on its mild
          correlation with size. Once we hold size roughly fixed by looking only at big objects, <strong>miss distance
          (0.604) overtakes velocity (0.535)</strong>. This is not noise — it&rsquo;s the data telling us that, among the
          objects that could actually be hazardous, <em>how close it passes</em> matters more than <em>how fast</em>.
          That makes physical sense: miss distance is our only proxy for the orbit-distance half of the PHA definition
          that our data is missing.
        </Callout>

        <p>
          Recall the prediction you locked in back in Act 1 — <em>&ldquo;once size is accounted for, which matters more,
          velocity or miss distance?&rdquo;</em> If you said <strong>miss distance</strong>, the conditional analysis
          just vindicated you. If you said velocity, you were reading the marginal signal — exactly the trap this page
          exists to defuse. Either way, you now have a <em>measured</em> answer, not a hunch.
        </p>

        <TransferBox>
          Marginal separation (a feature vs the target, ignoring everything else) can mislead whenever a dominant feature
          is confounded with the others. The fix is general: <strong>condition on what you already know</strong> — split
          on the dominant feature, or control for it — and re-measure. A signal that survives conditioning is real; one
          that vanishes was borrowed. This is the seed of the whole idea of controlling for covariates.
        </TransferBox>

        <PlaybookRule n={8}>
          Measure each feature&rsquo;s separation, then <strong>re-measure conditioned on the dominant feature.</strong>{" "}
          Marginal signal can be borrowed from a confounder; the signal that survives conditioning is the one worth
          modelling.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/distributions", label: <>← Distributions &amp; transforms</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/hypotheses", label: <>Next up · From plots to testable checks →</> }}
        />
      </div>
    </article>
  );
}

const code1 =`from sklearn.metrics import roc_auc_score

y = df["hazardous"].astype(int)
for c in ["absolute_magnitude", "relative_velocity", "miss_distance"]:
    # try both directions; report the informative one
    auc = max(roc_auc_score(y, df[c]), roc_auc_score(y, -df[c]))
    print(c, round(auc, 3))`;

const code2 = `big = df[df["absolute_magnitude"] <= 22]      # condition on the gimme
yb = big["hazardous"].astype(int)
for c in ["miss_distance", "relative_velocity"]:
    auc = max(roc_auc_score(yb, big[c]), roc_auc_score(yb, -big[c]))
    print(c, round(auc, 3))`;

const cap: React.CSSProperties = { marginTop: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 };
