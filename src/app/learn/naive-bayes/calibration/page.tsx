import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Calibration: probabilities you cannot trust — Manifold",
  description:
    "Naive Bayes double-counts correlated evidence, so it reports 96% confidence on decisions it gets right 83% of the time. Here is how badly, measured, and what to do about it.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Measured reliability bins from scripts/naive_bayes_cases.py section 7:
// GaussianNB on 12 features (6 informative, 4 redundant). predicted P(y=1)
// binned against the actual frequency in each bin.
const BINS = [
  { lo: 0.0, hi: 0.2, n: 805, pred: 0.045, actual: 0.165 },
  { lo: 0.2, hi: 0.4, n: 150, pred: 0.293, actual: 0.340 },
  { lo: 0.4, hi: 0.6, n: 118, pred: 0.500, actual: 0.551 },
  { lo: 0.6, hi: 0.8, n: 160, pred: 0.711, actual: 0.562 },
  { lo: 0.8, hi: 1.0, n: 767, pred: 0.962, actual: 0.833 },
];

// A drawn reliability diagram: predicted probability (x) vs actual frequency
// (y). The dashed diagonal is perfect calibration; the coral curve is
// GaussianNB. Server-rendered, literal coordinates, no hydration.
function ReliabilityDiagram() {
  const S = 300, PAD = 40;
  const X0 = PAD, X1 = S - 12, Y0 = S - PAD, Y1 = 12;
  const px = (p: number) => X0 + p * (X1 - X0);
  const py = (p: number) => Y0 - p * (Y0 - Y1);
  const pts = BINS.map((b) => `${px(b.pred).toFixed(1)},${py(b.actual).toFixed(1)}`).join(" ");
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "1.2rem 0" }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "min(100%, 340px)" }} role="img" aria-label="Reliability diagram for Gaussian Naive Bayes">
        {/* frame */}
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="var(--border-strong)" strokeWidth={1} />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border-strong)" strokeWidth={1} />
        {/* perfect-calibration diagonal */}
        <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke="var(--muted)" strokeWidth={1.3} strokeDasharray="4 4" />
        <text x={px(0.62)} y={py(0.72)} fontSize={11} fill="var(--muted)" transform={`rotate(-38 ${px(0.62)} ${py(0.72)})`}>perfectly calibrated</text>
        {/* NB curve */}
        <polyline points={pts} fill="none" stroke={TEAL} strokeWidth={2.5} />
        {BINS.map((b, i) => (
          <circle key={i} cx={px(b.pred)} cy={py(b.actual)} r={4} fill={TEAL} />
        ))}
        {/* axis ticks + labels */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <text x={px(t)} y={Y0 + 16} fontSize={10.5} fill="var(--faint)" textAnchor="middle">{t}</text>
            <text x={X0 - 8} y={py(t) + 3} fontSize={10.5} fill="var(--faint)" textAnchor="end">{t}</text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={S - 6} fontSize={11} fill="var(--muted)" textAnchor="middle">predicted probability</text>
        <text x={12} y={(Y0 + Y1) / 2} fontSize={11} fill="var(--muted)" textAnchor="middle" transform={`rotate(-90 12 ${(Y0 + Y1) / 2})`}>actual frequency</text>
      </svg>
    </div>
  );
}

export default function CalibrationPage() {
  const fromScratch = `# GaussianNB double-counts correlated evidence -> overconfident probabilities
nb = GaussianNB().fit(X_train, y_train)
p  = nb.predict_proba(X_test)[:, 1]

# bin the predictions; compare mean predicted prob to the actual frequency
edges = np.linspace(0, 1, 6)
print("bin          n    predicted  actual")
ece = 0.0
for lo, hi in zip(edges[:-1], edges[1:]):
    m = (p >= lo) & (p <= hi if hi == 1 else p < hi)
    if m.sum() == 0:
        continue
    conf, freq = p[m].mean(), y_test[m].mean()
    ece += m.mean() * abs(conf - freq)          # expected calibration error
    print(f"[{lo:.1f},{hi:.1f})   {m.sum():<4} {conf:.3f}      {freq:.3f}")
print(f"\\nECE: {ece:.3f}   accuracy: {accuracy_score(y_test, nb.predict(X_test)):.3f}")`;

  const withLibrary = `from sklearn.calibration import calibration_curve

nb = GaussianNB().fit(X_train, y_train)
lr = LogisticRegression(max_iter=2000).fit(X_train, y_train)

for name, model in [("GaussianNB", nb), ("LogReg   ", lr)]:
    prob = model.predict_proba(X_test)[:, 1]
    freq, pred = calibration_curve(y_test, prob, n_bins=5)
    acc = accuracy_score(y_test, model.predict(X_test))
    gap = np.mean(np.abs(freq - pred))          # rough calibration gap
    print(f"{name}  accuracy {acc:.3f}   mean |pred-actual| {gap:.3f}")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Calibration: probabilities you cannot trust</>}
        intro={<>Naive Bayes is a fine <em>classifier</em>. It is a terrible <em>forecaster</em>. When it
          says &ldquo;96% sure,&rdquo; it is right about 83% of the time — and the gap is not noise, it is
          baked into the naive assumption itself. This is the price of the trick that makes it work.</>}
      />

      <div className="lesson">
        <p>
          We just saw Naive Bayes win as a text classifier. But every prediction it makes comes with a
          probability attached — <code>predict_proba</code> — and it is tempting to read those numbers as
          real confidence. Resist. The whole track has been building to this warning: the model that
          <em> decides</em> so well <em>estimates</em> so badly, and now we can measure exactly how badly.
        </p>

        <h2>Why the probabilities drift — a callback</h2>
        <p>
          Back in <Link href="/learn/naive-bayes/probabilities-break-decisions-survive" style={link}>the
          spine of the track</Link>, duplicating a feature multiplied the log-odds without moving the
          decision. Real data does the same thing more quietly: correlated features carry overlapping
          evidence, and Naive Bayes counts each one as if it were fresh and independent. Every redundant
          feature nudges the log-odds a little further from zero, so the probabilities pile up against the
          walls at 0 and 1. The model becomes <strong>overconfident</strong> — not occasionally, but
          systematically.
        </p>

        <PredictPrompt
          prompt={<>Group every test point where Naive Bayes predicted a probability between 0.8 and 1.0. Of that
            group, what fraction are <em>actually</em> in the positive class?</>}
          options={["About 0.90 — roughly what it claims", "About 0.83 — a bit lower than it claims", "About 0.55 — barely better than a coin"]}
          nudge={<>Locked in. The reliability diagram below plots exactly this: what it promised vs what happened.</>}
        />

        <h2>The reliability diagram</h2>
        <p>
          The honest test of a probability is simple: gather every prediction near 0.9 and check whether
          about 90% of them come true. Plot predicted probability across the bottom and the actual
          frequency up the side. A perfectly calibrated model lands on the diagonal. Here is GaussianNB on
          twelve features, four of them redundant:
        </p>

        <ReliabilityDiagram />

        <p>
          The curve is <strong>flatter than the diagonal</strong> — the signature of overconfidence. On
          the right, where it predicts <strong>0.962</strong>, the truth is only <strong>0.833</strong>.
          On the left, where it predicts <strong>0.045</strong>, the truth is <strong>0.165</strong>. It
          overshoots toward certainty at both ends. The exact bins:
        </p>

        <div style={{ overflowX: "auto", margin: "1rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr>
                {["predicted-prob bin", "points", "mean predicted", "actual frequency", "gap"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BINS.map((b) => {
                const gap = Math.abs(b.pred - b.actual);
                return (
                  <tr key={b.lo}>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>[{b.lo.toFixed(1)}, {b.hi.toFixed(1)})</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{b.n}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{b.pred.toFixed(3)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{b.actual.toFixed(3)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: gap > 0.1 ? "var(--bad)" : "var(--muted)" }}>{gap.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p>
          Notice the two fat bins: <strong>805</strong> points crammed near zero and <strong>767</strong>{" "}
          near one. Naive Bayes rarely says &ldquo;maybe.&rdquo; It reports near-certainty on almost every
          point, which is exactly what makes its probabilities untrustworthy.
        </p>

        <h2>One number for it: expected calibration error</h2>
        <p>
          Average the gap between predicted and actual across the bins, weighted by how many points fall in
          each, and you get the <strong>expected calibration error</strong> (ECE). Lower is better; zero is
          perfect. Run the same data through Naive Bayes and logistic regression and the split is stark.
        </p>

        <Callout color={TEAL} title={<>The number that matters</>}>
          Gaussian Naive Bayes: <strong>ECE 0.116</strong>. Logistic regression on the identical data:{" "}
          <strong>ECE 0.035</strong> — more than three times better calibrated. And their accuracies are
          almost the same (0.780 vs 0.798). Similar decisions, wildly different trustworthiness of the
          probabilities behind them.
        </Callout>

        <p>Fit both yourself and watch the gap open up:</p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <h2>So what do you do about it?</h2>
        <p>
          Two honest options. First: <strong>use the ranking, not the number.</strong> Naive Bayes gets the
          <em> order</em> of confidence right even when the values are off, so it is fine for &ldquo;show me
          the 100 most likely spam messages.&rdquo; Second: if you genuinely need a probability — a cost
          you multiply, a threshold you set — <strong>recalibrate</strong> it. Fit a small monotonic
          function (Platt scaling, or isotonic regression) that maps the raw scores onto honest
          probabilities, using held-out data. That is exactly what{" "}
          <Link href="/learn/evaluation/calibration" style={link}>the calibration page in Evaluation</Link>{" "}
          walks through, and it works on any miscalibrated model, Naive Bayes included.
        </p>

        <Callout color="var(--c-fundamentals)" title={<>Interview-grade answer</>}>
          &ldquo;Why is Naive Bayes poorly calibrated?&rdquo; → <em>Because it assumes features are
          conditionally independent. When they are correlated it double-counts the shared evidence, which
          inflates the log-odds and pushes predicted probabilities toward 0 and 1. The argmax still lands on
          the right class — so accuracy holds — but the probabilities are overconfident. Measured, its ECE is
          several times worse than logistic regression at the same accuracy. Use the ranking, or recalibrate
          with Platt/isotonic scaling.</em>
        </Callout>

        <Callout color={TEAL} title={<>The one thing to take away</>}>
          A good decision and a good probability are different achievements. Naive Bayes reliably delivers
          the first and reliably fails the second. Trust its <em>choice</em>; recalibrate before you trust
          its <em>number</em>.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/naive-bayes-for-text", label: <>← Naive Bayes for text</> }}
          next={{ href: "/learn/naive-bayes/vs-logistic-regression", label: <>Next up · Naive Bayes vs logistic regression →</> }}
        />
      </div>
    </article>
  );
}
