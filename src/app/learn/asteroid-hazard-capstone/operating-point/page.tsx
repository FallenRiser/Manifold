import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Choosing the operating point — Manifold",
  description:
    "PR-AUC grades the model across all thresholds; deployment needs exactly one. Choosing it is a business decision about the cost of each error, not a default 0.5. Given that a missed hazard dwarfs a false alarm, we set a high-recall threshold: catch 90% of hazards (2,045 of 2,266) at the cost of ~4,000 false alarms for human follow-up.",
};

const SPACE = "var(--c-space)";

// RF operating points on the grouped test set (scripts/neo_cases.py + recall sweep).
const POINTS = [
  { rec: "≥ 0.95", thr: 0.07, prec: 0.326, catch: "2155 / 2266", fa: 4450 },
  { rec: "≥ 0.90", thr: 0.103, prec: 0.335, catch: "2045 / 2266", fa: 4054, pick: true },
  { rec: "≥ 0.80", thr: 0.15, prec: 0.347, catch: "1825 / 2266", fa: 3428 },
  { rec: "≥ 0.70", thr: 0.19, prec: 0.358, catch: "1604 / 2266", fa: 2882 },
  { rec: "≥ 0.50", thr: 0.287, prec: 0.392, catch: "1136 / 2266", fa: 1762 },
  { rec: "(precision ≥ 0.70)", thr: 0.64, prec: 0.71, catch: "308 / 2266", fa: 126 },
];

// confusion matrix at the chosen recall>=0.90 point
const CM = { tp: 2045, fn: 221, fp: 4054, tn: 16340 };

function ConfusionMatrix() {
  const cell = (v: number, label: string, good: boolean) => (
    <div style={{ padding: "12px 14px", background: good ? "color-mix(in srgb, var(--good) 9%, var(--surface))" : "color-mix(in srgb, var(--bad) 9%, var(--surface))", borderRadius: 8, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }} className="font-display">{v.toLocaleString()}</div>
      <div style={{ fontSize: 11.5, color: good ? "var(--good)" : "var(--bad)", marginTop: 2 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ margin: "18px 0 6px", padding: "16px 18px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr", gap: 8, alignItems: "center" }}>
        <div />
        <div style={hd}>predicted safe</div>
        <div style={hd}>predicted hazard</div>
        <div style={{ ...hd, textAlign: "right" }}>actually hazard</div>
        {cell(CM.fn, "missed hazard (FN)", false)}
        {cell(CM.tp, "caught (TP)", true)}
        <div style={{ ...hd, textAlign: "right" }}>actually safe</div>
        {cell(CM.tn, "correct all-clear (TN)", true)}
        {cell(CM.fp, "false alarm (FP)", false)}
      </div>
      <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 10 }}>
        Random forest at threshold 0.103 (recall ≈ 0.90) on the 22,660-row grouped test set.
      </div>
    </div>
  );
}

export default function OperatingPointPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Choosing the operating point</>}
        intro={<>
          We have a model and a score — but a score isn&rsquo;t a decision. To deploy, we must pick <em>one</em>{" "}
          threshold that turns the forest&rsquo;s probability into a yes/no call. Where we put it is not a technical
          default; it&rsquo;s where the cost of a miss and the cost of a false alarm meet.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          The model outputs a probability; deployment needs a yes/no. Where do I set the cutoff — and what decides that,
          if not 0.5?
        </AnalystQuestion>

        <h2>PR-AUC graded the whole curve; deployment picks one point on it</h2>
        <p>
          Every threshold from 0 to 1 is a different operating point with a different precision and recall. PR-AUC
          summarised <em>all</em> of them to compare models; now that the forest has won, we must choose the single point
          we&rsquo;ll actually run at. The default 0.5 is arbitrary — it silently assumes the two errors cost the same,
          which on this problem they emphatically do not. So we sweep the threshold and read the trade-off directly.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`random forest, grouped test set (2,266 hazards among 22,660)
 target recall   thr    precision   hazards caught   false alarms
   >= 0.95       0.070    0.326       2155 / 2266        4450
   >= 0.90       0.103    0.335       2045 / 2266        4054   <- our pick
   >= 0.80       0.150    0.347       1825 / 2266        3428
   >= 0.70       0.190    0.358       1604 / 2266        2882
   >= 0.50       0.287    0.392       1136 / 2266        1762
  precision>=0.70 0.640   0.710        308 / 2266         126`}</CodeOutput>

        <h2>Let the cost asymmetry choose</h2>
        <p>
          Back in Act 4 we named the costs: a <strong>missed hazard</strong> is far worse than a <strong>false
          alarm</strong> (a false alarm just spends an analyst&rsquo;s time on a follow-up look). That single judgement
          picks the region of the table. The tempting high-<em>precision</em> point (bottom row) looks clean — 71%
          precision, only 126 false alarms — but it catches just <strong>308 of 2,266 hazards</strong>, missing 87% of
          the very things we built the system to find. For hazard triage that&rsquo;s a non-starter. We go the other way
          and buy recall.
        </p>

        <ConfusionMatrix />

        <Callout color={SPACE} title={<>The chosen point: catch nearly all, tolerate the false alarms</>}>
          At a threshold of <strong>0.103</strong> the forest catches <strong>2,045 of 2,266 hazards (90%)</strong>,
          missing 221. The price is <strong>4,054 false alarms</strong> — harmless objects flagged for a second look.
          Given the cost structure, that&rsquo;s the right trade: ~4,000 quick human follow-ups is a small price to avoid
          missing real hazards, and precision of 0.335 means one in three flags is genuine — far better than the 9.7%
          base rate a random pull would give an analyst. The threshold <em>is</em> the decision, and we set it from the
          costs, not from a library default.
        </Callout>

        <p>
          Notice this is a <em>policy</em>, and it can be revisited without retraining. If follow-up capacity shrinks,
          slide the threshold up to trade recall for fewer alarms; if the tolerance for a miss drops further, slide it
          down. The model ranks; the threshold encodes the current cost of being wrong.
        </p>

        <TransferBox>
          Never ship the default 0.5. Sweep the threshold, look at the precision/recall (or the confusion matrix) at each,
          and choose the point that matches the real cost of each error — recall-first for costly misses (disease,
          hazards, fraud you must catch), precision-first when false positives are the expensive ones (spam filters,
          irreversible actions). Write the threshold down as a decision with a rationale, and expose it as a knob, not a
          constant.
        </TransferBox>

        <PlaybookRule n={18}>
          A <strong>threshold is a cost decision, not a default.</strong> Sweep it, read precision/recall at each point,
          and set it from the real cost of each error — then expose it as a tunable policy, since costs change.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/model-comparison", label: <>← Model comparison</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/interpretation", label: <>Next up · Interpretation →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.metrics import precision_recall_curve, confusion_matrix

p = rf.predict_proba(Xte)[:, 1]
prec, rec, thr = precision_recall_curve(yte, p)

for target in [0.95, 0.90, 0.80, 0.70, 0.50]:
    i = np.max(np.where(rec[:-1] >= target))    # highest thr meeting recall
    pred = (p >= thr[i]).astype(int)
    tn, fp, fn, tp = confusion_matrix(yte, pred).ravel()
    print(target, round(thr[i], 3), "caught", tp, "false alarms", fp)`;

const hd: React.CSSProperties = { fontSize: 11.5, color: "var(--faint)", fontWeight: 500 };
