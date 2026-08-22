import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Redundancy: one feature in disguise — Manifold",
  description:
    "Correlate everything, then read the extremes: a correlation of exactly ±1 or a perfectly constant ratio means two columns carry the same information. On NEO, the two diameter columns and absolute magnitude are one feature wearing three hats — corr −1.000, ratio exactly sqrt(5).",
};

const SPACE = "var(--c-space)";

export default function RedundancyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 2 · First contact", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Redundancy: one feature in disguise</>}
        intro={<>
          Ten columns does not mean ten pieces of information. Some columns are copies, rescalings, or exact formulas of
          others — new names for old facts. Finding them takes one correlation matrix and the discipline to read its
          extremes literally.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Are any of my features secretly the <em>same</em> feature — a copy, a rescaling, or a deterministic formula of
          another?
        </AnalystQuestion>

        <h2>The move: correlate everything, then read the extremes</h2>
        <p>
          A correlation matrix is usually pitched as a way to find features that relate to the <em>target</em>. Its
          quieter, more important use is finding features that relate perfectly to <em>each other</em>. The rule to
          internalise: a Pearson correlation of <strong>exactly ±1</strong>, or a <strong>perfectly constant
          ratio</strong> between two columns, is not a strong relationship — it&rsquo;s a signature that one column is a
          deterministic function of the other. It carries no information the other lacks.
        </p>
        <CodeBlock fromScratch={code1} />
        <CodeOutput>{`correlation with absolute_magnitude
  est_diameter_min     -0.560
  est_diameter_max     -0.560
  relative_velocity    -0.354
  miss_distance        -0.264

corr(log est_diameter_min, absolute_magnitude): -1.000000`}</CodeOutput>
        <p>
          Here is the subtlety that catches people. The <em>raw</em> correlation of the diameter columns with{" "}
          <code>absolute_magnitude</code> is only <strong>−0.56</strong> — you&rsquo;d shrug and call it &ldquo;moderately
          related.&rdquo; But Pearson correlation measures <em>linear</em> association, and this relationship is
          exponential: <M>{String.raw`D \propto 10^{-0.2H}`}</M>. Take the log first, matching the functional form, and
          the correlation snaps to <strong>−1.000000</strong> — exact to six decimals. That is not &ldquo;highly
          correlated.&rdquo; That is an identity. The lesson within the lesson: a weak linear correlation does not rule
          out a perfect relationship — you have to correlate on the <em>right scale</em>.
        </p>

        <h2>Confirm it: the constant ratio</h2>
        <p>
          A second, even blunter check clinches it. If <code>est_diameter_max</code> is just <code>est_diameter_min</code>{" "}
          rescaled, their ratio will be the same number in every single row.
        </p>
        <CodeBlock fromScratch={code2} />
        <CodeOutput>{`est_diameter_max / est_diameter_min
  mean : 2.236068
  std  : 5.1e-09        <- constant to machine precision
  sqrt(5) = 2.2360680`}</CodeOutput>
        <p>
          The ratio is <M>{String.raw`\sqrt{5}`}</M> in every row, to nine decimals. The &ldquo;min&rdquo; and
          &ldquo;max&rdquo; diameters aren&rsquo;t two measurements bracketing an uncertainty — they&rsquo;re one number
          multiplied by a fixed constant. Together with the log-correlation, the verdict is airtight:{" "}
          <code>est_diameter_min</code>, <code>est_diameter_max</code>, and <code>absolute_magnitude</code> are{" "}
          <strong>three views of a single quantity: size</strong>.
        </p>

        <Callout color={SPACE} title={<>Three columns, one feature — keep the source</>}>
          We keep <strong>one</strong> of them and drop the other two. Which one? <code>absolute_magnitude</code> — the
          <em>raw measured quantity</em>, from which the diameters were derived. Keeping the source rather than a
          derived copy is the habit: it avoids baking in someone else&rsquo;s albedo assumption, and it&rsquo;s the
          value least likely to change if the dataset is regenerated. Redundant features aren&rsquo;t harmless padding —
          they can double-count evidence in a linear model and give a false sense of &ldquo;many features,&rdquo; when
          the real feature count just dropped from a nominal ten to a working <strong>three</strong>:{" "}
          <code>absolute_magnitude</code>, <code>relative_velocity</code>, <code>miss_distance</code>.
        </Callout>

        <p>
          It&rsquo;s worth pausing on how much the audit has already changed the picture. We started with ten columns.
          Two were dead constants, two were identifiers, three were the same size feature in disguise, and one is the
          target. What remains to actually <em>predict</em> with is three genuine numbers — the size proxy and two
          approach kinematics. Knowing that <em>before</em> modelling is what keeps us from mistaking column count for
          information.
        </p>

        <TransferBox>
          On your own data, compute the full correlation matrix early and hunt the extremes, not just the target column.
          A pair at ±1, a constant ratio, or one column that&rsquo;s another times a unit conversion (miles↔km,
          °C↔°F) means you have fewer real features than columns. Drop the derived copy, keep the source — and always
          ask <em>why</em> two columns are identical; the answer is often a clue to how the data was built.
        </TransferBox>

        <PlaybookRule n={6}>
          Hunt redundancy before modelling: correlate <em>everything</em> and read the extremes. A correlation of ±1 or
          a constant ratio means <strong>one feature in disguise</strong> — keep the source column, drop the derived
          copies.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/integrity", label: <>← Integrity audit</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/distributions", label: <>Next up · Distributions &amp; transforms →</> }}
        />
      </div>
    </article>
  );
}

const code1 = `import numpy as np

# relate features to the target AND to each other
num = ["absolute_magnitude", "est_diameter_min", "est_diameter_max",
       "relative_velocity", "miss_distance"]
print(df[num].corr()["absolute_magnitude"])

# the tell: on a log scale, is it an exact identity?
c = np.corrcoef(np.log(df["est_diameter_min"]), df["absolute_magnitude"])[0, 1]
print("log-corr:", round(c, 6))`;

const code2 = `ratio = df["est_diameter_max"] / df["est_diameter_min"]
print("mean:", ratio.mean(), " std:", ratio.std())
print("sqrt(5):", 5 ** 0.5)`;
