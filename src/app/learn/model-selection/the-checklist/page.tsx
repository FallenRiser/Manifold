import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The model-selection checklist — Manifold",
  description:
    "Everything in this pillar as one ordered procedure, with the measured cost of skipping each step — from 8.8 points for a leaky split down to 0.6 for flat cross-validation.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

type Step = { n: number; title: string; body: React.ReactNode; cost?: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "Decide what deployment means, then build the split to match",
    body: <>Ask what the model genuinely won&rsquo;t know at prediction time — a new patient, next week, an unseen factory — and enforce exactly that ignorance. Group, time-aware, or blocked splits as required. Do this <em>first</em>, before any modelling.</>,
    cost: "up to 8.8 points (measured, asteroid capstone)",
  },
  {
    n: 2,
    title: "Set aside a test set and do not look at it",
    body: <>Size it by the precision your decision needs — <M>{String.raw`\pm\sqrt{\ln(40)/2n}`}</M>, so ±0.030 at n = 2,000. Then leave it alone until every decision is final.</>,
  },
  {
    n: 3,
    title: "Put every fitted step inside the fold",
    body: <>Scaling, imputation, feature selection, resampling, target encoding. Use a <code>Pipeline</code> so this is structural rather than something you have to remember.</>,
    cost: "unbounded — can be many points",
  },
  {
    n: 4,
    title: "Cross-validate with 5 or 10 folds, stratified for classification",
    body: <>The exact value of <M>k</M> is the least consequential decision on this list. Stratification and repeated CV matter more when data is scarce.</>,
  },
  {
    n: 5,
    title: "Tune capacity knobs jointly, not one at a time",
    body: <>Depth, <M>{String.raw`\lambda`}</M>, feature count, epochs and dropout are all dials on the same quantity. Tuning them separately explores a diagonal, not the space.</>,
  },
  {
    n: 6,
    title: "Plot the error bars, then apply the one-standard-error rule",
    body: <>Take the simplest model within one SE of the CV minimum. On a real ridge path this chose a penalty 22× stronger with no measurable loss.</>,
  },
  {
    n: 7,
    title: "Plot learning curves before asking for more data",
    body: <>Converged curves at a ceiling mean approximation error dominates and more rows will buy nothing. This is the step that saves quarters, not points.</>,
  },
  {
    n: 8,
    title: "Report from data that chose nothing",
    body: <>The untouched test set, or nested CV if you have no test set to spare. Never the winner&rsquo;s own validation or CV score.</>,
    cost: "+0.006 measured on a 20-point grid; grows as √(ln k / n)",
  },
  {
    n: 9,
    title: "Say what you searched",
    body: <>Grid size, number of experiments, everything you tried and abandoned. A reader cannot judge a reported number without knowing the size of the search that produced it.</>,
  },
];

export default function ChecklistPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "In practice", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>The model-selection checklist</>}
        intro={<>The whole pillar as one ordered procedure — and, where we measured it, the cost of skipping each
          step. They are deliberately not in order of fame; they are in order of when you do them and how much
          they hurt.</>}
      />

      <div className="lesson">
        <div style={{ display: "grid", gap: 10, margin: "1.4rem 0" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: GRAY, flexShrink: 0, width: 20 }}>{s.n}</div>
              <div>
                <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{s.body}</div>
                {s.cost && (
                  <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 5 }}>cost of skipping: {s.cost}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2>The ranking nobody expects</h2>
        <p>
          Put the measured costs side by side and the ordering is instructive. A leaky split cost{" "}
          <strong>8.8 points</strong> of PR-AUC. Flat instead of nested cross-validation cost{" "}
          <strong>0.6 points</strong>. The choice between 5 and 10 folds is smaller still.
        </p>
        <p>
          Yet the attention usually runs the other way — teams debate fold counts and grid resolution while the
          split itself goes unexamined. <strong>Spend your care where the numbers are: on what the split
          simulates, and on what leaked into it.</strong> The subtle statistical corrections are worth making, and
          they are second-order compared with getting the split right.
        </p>

        <Callout color={GRAY} title={<>The one-sentence version</>}>
          <strong>Build the split to simulate deployment, keep something back that chose nothing, and report the
          number that came from it.</strong> Everything else on this list is refinement.
        </Callout>

        <h2>Where to go next</h2>
        <p>
          For the theory beneath all of this — why a held-out score is trustworthy in the first place, what
          searching many hypotheses provably costs, and where the guarantees stop working — the{" "}
          <Link href="/learn/learning-theory" style={link}>learning theory track</Link> is the companion to this
          one. For seeing the whole procedure run end to end on real data, with the split decision made
          explicitly and its cost measured, the{" "}
          <Link href="/learn/asteroid-hazard-capstone" style={link}>asteroid-hazard capstone</Link> is this
          checklist in practice. And for choosing <em>what to optimise</em> in the first place — which metric a
          mistake should be measured in — the{" "}
          <Link href="/learn/evaluation" style={link}>evaluation &amp; metrics pillar</Link> comes logically
          before everything here.
        </p>

        <Quiz
          accent={GRAY}
          title="Final test · the whole pillar"
          questions={[
            {
              q: <>You have a dataset with multiple rows per customer. Ranked by measured impact, which of these should you fix first?</>,
              options: [
                "Switch from 5-fold to 10-fold cross-validation",
                "Group the folds by customer id so no customer spans train and test",
                "Add nested cross-validation around your grid search",
              ],
              answer: 1,
              explain: <>Group leakage is the largest measured effect in this pillar — 8.8 points of PR-AUC in the asteroid capstone, against 0.6 for flat-versus-nested CV and less for fold count. It also distorts <em>which model wins</em>, since flexible models exploit leakage most. Fix the split first; the other two are real but second-order.</>,
            },
            {
              q: <>Your CV curve is nearly flat across a wide range of <M>{String.raw`\lambda`}</M>, and you take the argmin. What have you probably done?</>,
              options: [
                "Found the optimal penalty — that's what the minimum means",
                "Selected on noise, and systematically toward the more complex end where variance is highest",
                "Nothing problematic, as long as you used enough folds",
              ],
              answer: 1,
              explain: <>A flat curve means the differences are inside the error bars, so the argmin is partly luck — and the bias has a direction: the complex end has the most variance, so it produces the most lucky-low scores. The one-SE rule is the standard correction, and more folds shrink the noise without removing the bias.</>,
            },
            {
              q: <>Training and validation curves have converged at 93%, and you have budget to triple the data. What does the curve tell you?</>,
              options: [
                "Tripling the data should give a solid improvement",
                "Estimation error is already spent; the ceiling is the model or the features, so more rows will buy essentially nothing",
                "The curves converging means the model is optimal and nothing more can be done",
              ],
              answer: 1,
              explain: <>Converged curves mean the gap — the estimation error — is nearly closed, and more data only attacks that term. The remaining error is approximation error, which is completely insensitive to sample size. But converged does not mean optimal: in our measured runs a capped model flatlined at 32% while a well-matched one on identical data reached 98.1%. The lever is the model or the features, not the row count.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/model-selection/when-data-isnt-iid", label: <>← When your data isn&rsquo;t i.i.d.</> }}
          next={{ href: "/learn/learning-theory", label: <>The theory beneath it · Learning theory →</> }}
        />
      </div>
    </article>
  );
}
