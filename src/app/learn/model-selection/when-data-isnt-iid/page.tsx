import Link from "next/link";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When your data isn't i.i.d. — Manifold",
  description:
    "Every guarantee in model selection assumes independent draws from one distribution. Real data has repeated entities, time order, and group structure — and a random split quietly turns each of those into leakage worth several points.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top" };

export default function NotIidPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "In practice", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 8 minutes"
        title={<>When your data isn&rsquo;t i.i.d.</>}
        intro={<>Every bound and every procedure in this pillar rests on one assumption: your data are independent
          draws from a single distribution. Real datasets violate it constantly, and a random split turns each
          violation into leakage that inflates your score without leaving a trace in the code.</>}
      />

      <div className="lesson">
        <h2>The assumption, and what breaks it</h2>
        <p>
          &ldquo;i.i.d.&rdquo; does two jobs. <strong>Independent</strong> means one row tells you nothing about
          another. <strong>Identically distributed</strong> means every row comes from the same world. Random{" "}
          <M>k</M>-fold cross-validation is only valid when both hold — and in applied work, at least one usually
          doesn&rsquo;t.
        </p>

        <table style={table}>
          <thead>
            <tr><th style={th}>Structure</th><th style={th}>What a random split does</th><th style={th}>The right split</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}><strong>Repeated entities</strong><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>many rows per patient, user, or object</span></td>
              <td style={{ ...td, color: "var(--bad)" }}>the same entity lands in train and test; the model recognises the entity, not the pattern</td>
              <td style={td}><code>GroupKFold</code> on the entity id</td>
            </tr>
            <tr>
              <td style={td}><strong>Time order</strong><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>anything forecast forward</span></td>
              <td style={{ ...td, color: "var(--bad)" }}>trains on the future to predict the past — impossible at deployment</td>
              <td style={td}><code>TimeSeriesSplit</code>, expanding window</td>
            </tr>
            <tr>
              <td style={td}><strong>Spatial correlation</strong><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>neighbouring locations</span></td>
              <td style={{ ...td, color: "var(--bad)" }}>a neighbouring point is nearly a copy, so the test set is half-memorised</td>
              <td style={td}>blocked or buffered spatial folds</td>
            </tr>
            <tr>
              <td style={td}><strong>Distribution shift</strong><br /><span style={{ fontSize: 12, color: "var(--muted)" }}>deployment differs from training</span></td>
              <td style={{ ...td, color: "var(--bad)" }}>measures performance on a world that no longer exists</td>
              <td style={td}>hold out the newest period; monitor after launch</td>
            </tr>
          </tbody>
        </table>

        <h2>Group leakage, measured</h2>
        <p>
          The asteroid capstone is a clean case with real numbers. Its dataset has 90,836 rows but only 27,423
          unique objects — the same asteroid is observed on many close approaches, and its hazard label is a
          property of the <em>object</em>, not the approach. A random split therefore puts the same asteroid on
          both sides.
        </p>
        <p>
          Measured effect: a random forest scores <strong>PR-AUC 0.566</strong> under a random split and{" "}
          <strong>0.478</strong> under a grouped split — <strong>8.8 points</strong> of pure leakage, dwarfing
          every other methodological effect in this pillar. The{" "}
          <Link href="/learn/asteroid-hazard-capstone/the-split" style={link}>capstone&rsquo;s split page</Link>{" "}
          has the interactive version.
        </p>

        <Callout color={GRAY} title={<>The detail that makes this dangerous</>}>
          Leakage rewards <em>flexible</em> models most. In that same experiment the forest gained 8.8 points from
          the leak, gradient boosting 4.8, and the logistic model essentially nothing — a flexible model can
          memorise entity identities, a rigid one cannot. So a leaky split doesn&rsquo;t merely inflate your
          numbers; <strong>it changes which model wins.</strong> You will conclude that the forest is best, ship
          it, and watch it underperform in a way your validation never predicted.
        </Callout>

        <h2>Time is the strictest case</h2>
        <p>
          With temporal data, random splitting is not merely optimistic — it is measuring an impossible quantity.
          At deployment you will never have tomorrow&rsquo;s data when predicting today. Use an{" "}
          <strong>expanding window</strong>: train on months 1–6 and test on 7, then 1–7 and test on 8, and so on.
          Every fold respects the arrow of time, and the average across folds is your honest estimate.
        </p>
        <p>
          Two extra traps live here. <strong>Feature leakage through time</strong> — computing a rolling mean or a
          target encoding over the full series leaks the future into every row, and no split can fix a feature
          that was already contaminated. And <strong>gaps</strong>: if you predict 7 days ahead, leave a 7-day
          buffer between train and test, or you are using information unavailable at prediction time.
        </p>

        <h2>The question to ask before you split</h2>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--ink)", margin: "1.2rem 0 1.3rem", fontStyle: "italic" }}>
          &ldquo;At prediction time, what will the model genuinely not know?&rdquo;
        </p>
        <p>
          Then build a split that enforces exactly that ignorance. If deployment means a new patient, split by
          patient. If it means next week, split by time. If it means a new factory, hold out a factory. The split
          should <strong>simulate deployment</strong>, and any split that gives the model access to something it
          won&rsquo;t have in production is measuring the wrong thing — however careful the rest of your
          methodology is. Note the corollary the capstone&rsquo;s transfer pages test: if your data has{" "}
          <em>no</em> group structure, imposing a grouped split is also wrong, and needlessly pessimistic.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/one-standard-error-rule", label: <>← The one-standard-error rule</> }}
          next={{ href: "/learn/model-selection/the-checklist", label: <>Next up · The model-selection checklist →</> }}
        />
      </div>
    </article>
  );
}
