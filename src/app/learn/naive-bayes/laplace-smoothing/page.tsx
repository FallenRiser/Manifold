import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { SmoothingLab } from "@/components/labs/SmoothingLab";
import { NB_TEXT_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Laplace smoothing & the zero-frequency problem — Manifold",
  description:
    "One word never seen with a class gets likelihood zero, and zero times anything is zero — a single unseen feature vetoes the whole class. Add a pseudocount and the classifier comes back to life. The full alpha sweep, measured.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LaplaceSmoothingPage() {
  const fromScratch = `# a deliberately SPARSE corpus: big vocab, short docs, few training docs
rng = np.random.RandomState(0)
V, L, N = 1000, 20, 400
base = rng.gamma(0.4, size=V)
def topic(idx):
    w = base.copy(); w[idx] *= 5.0; return w / w.sum()
pa, pb = topic(rng.choice(V, 40, False)), topic(rng.choice(V, 40, False))
X = np.array([rng.multinomial(L, pa if d % 2 == 0 else pb) for d in range(N)])
y = np.array([d % 2 for d in range(N)])
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.5, random_state=0, stratify=y)

for a in (1e-10, 0.1, 1.0, 5.0):                 # sweep the smoothing strength
    acc = accuracy_score(yte, MultinomialNB(alpha=a).fit(Xtr, ytr).predict(Xte))
    print(f"alpha={a:<8}: {round(acc, 3)}")        # ~0.63 -> 0.87 -> 0.86`;

  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: TEAL },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Laplace smoothing &amp; the zero-frequency problem</>}
        intro={<>Naive Bayes multiplies one probability per feature, and multiplication has a brutal failure
          mode: if any single factor is exactly zero, the whole product is zero. In a counting model an unseen
          event has count zero — so a word that never appeared with a class in training gives that class a
          likelihood of zero and <strong>vetoes it outright</strong>, no matter how much other evidence points
          the other way. The fix is one of the oldest tricks in statistics, and this page measures exactly what
          it buys.</>}
      />

      <div className="lesson">
        <h2>The zero-frequency problem</h2>
        <p>
          Multinomial NB estimates, for each class and each word, the probability that a random token from a
          class-<M>{String.raw`y`}</M> document is that word — count over total. Now suppose &ldquo;refund&rdquo;
          never once appears in a training document labelled <em>not-spam</em>. Then its estimated probability is
          exactly zero, and a test email containing &ldquo;refund&rdquo; is scored, under not-spam, as a product
          with a factor of zero in it:
        </p>

        <MathBlock>{String.raw`P(\mathbf{x}\mid y) = \prod_{j} \theta_{j\mid y}^{\,x_j} \;=\; \underbrace{\theta_{\text{refund}\mid\text{not-spam}}}_{=\,0} \times \;(\cdots) \;=\; 0`}</MathBlock>

        <p>
          The class is dead. It does not matter that the other forty words scream &ldquo;ordinary message&rdquo; —
          one feature the model never happened to observe with this class has driven its likelihood to exactly
          zero, and zero cannot be out-voted. This is the <strong>zero-frequency problem</strong>, and in a large
          sparse vocabulary it is not an edge case — it is the default.
        </p>

        <h2>The fix: a pseudocount</h2>
        <p>
          Refuse to believe any count is truly zero. Before dividing, add a small constant{" "}
          <M>{String.raw`\alpha`}</M> — a <em>pseudocount</em> — to every raw count, as if you had seen every word
          a fraction of a time in every class. To keep a valid distribution, the same mass goes into the
          denominator once per vocabulary word:
        </p>

        <MathBlock>{String.raw`\hat{\theta}_{j\mid y} = \frac{\text{count}(j, y) + \alpha}{\Bigl(\sum_{k} \text{count}(k, y)\Bigr) + \alpha\,V}`}</MathBlock>

        <p>
          With <M>{String.raw`\alpha = 1`}</M> this is <strong>Laplace</strong> (add-one) smoothing; other values
          are <em>additive</em> or <em>Lidstone</em> smoothing. The unseen word now gets a small positive floor
          instead of zero — enough to keep the class alive so the rest of the evidence can be heard.
        </p>

        <Callout color={TEAL} title={<>Smoothing is not optional for text</>}>
          Every serious implementation smooths by default — sklearn&rsquo;s <code>MultinomialNB</code> ships with{" "}
          <M>{String.raw`\alpha = 1`}</M> and you must deliberately set it lower. A real vocabulary has tens of
          thousands of words, most classes have seen only a fraction, and without a pseudocount practically every
          test document contains at least one class-fatal unseen word.
        </Callout>

        <h2>How much does <M>{String.raw`\alpha`}</M> matter? Turn the knob</h2>
        <p>
          The lab trains a <code>MultinomialNB</code> on a deliberately <em>sparse</em> corpus: a 1000-word
          vocabulary, 20-word documents, 200 training documents — so each class has seen only about half the
          vocabulary and the zero-frequency problem is everywhere.
        </p>

        <PredictPrompt
          prompt={<>As you slide <M>{String.raw`\alpha`}</M> from 1 down toward 0 — removing the smoothing — what
            happens to test accuracy on this sparse corpus?</>}
          options={[
            "It improves — less bias means a sharper model",
            "It barely changes — smoothing is a minor detail",
            "It collapses toward chance — unseen words start vetoing classes",
          ]}
          nudge={<>Locked in. Drag the slider and find the peak.</>}
        />

        <LabFrame
          accent={TEAL}
          tryThis={<>Slide <M>{String.raw`\alpha`}</M> down toward zero and watch accuracy fall off a cliff, then
            push it up past 1 and watch it sag again. Find the peak.</>}
          insight={<>The curve is a hump, not a slope. At <M>{String.raw`\alpha \approx 0`}</M> the model
            over-trusts its empty cells — every unseen word vetoes a class — and accuracy sits near 0.63. It
            climbs to a peak of <strong>0.87 at <M>{String.raw`\alpha = 1`}</M></strong>, the default, then
            declines as too much pseudocount washes the real word frequencies out. Smoothing is a bias knob: too
            little and you trust noise, too much and you erase the signal.</>}
        >
          <SmoothingLab />
        </LabFrame>

        <p>Reproduce a few points of that sweep yourself:</p>

        <CodeBlock setup={NB_TEXT_SETUP} fromScratch={fromScratch} />

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                {["smoothing α", "test accuracy", "what is happening"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                { a: "≈ 0 (1e-10)", acc: "0.630", note: "unseen words veto classes — crippled", peak: false },
                { a: "0.01", acc: "0.730", note: "floor starting to protect classes", peak: false },
                { a: "0.1", acc: "0.805", note: "most vetoes neutralised", peak: false },
                { a: "0.5", acc: "0.850", note: "close to optimal", peak: false },
                { a: "1.0", acc: "0.870", note: "peak — the default", peak: true },
                { a: "2.0", acc: "0.865", note: "signal beginning to wash out", peak: false },
                { a: "5.0", acc: "0.860", note: "over-smoothed toward uniform", peak: false },
              ] as const).map((r) => (
                <tr key={r.a}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.a}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.peak ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", fontWeight: r.peak ? 600 : 400 }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The two ends fail for opposite reasons. At <M>{String.raw`\alpha \approx 0`}</M> the model trusts
          counts that are mostly zero by accident of small-sample training, and a single unseen word vetoes a
          class — accuracy stuck at 0.630. At <M>{String.raw`\alpha = 5`}</M> the pseudocount swamps the real
          counts and pushes every estimate toward the uniform <M>{String.raw`1/V`}</M>, erasing the class
          differences that carry the signal. The peak at <M>{String.raw`\alpha = 1`}</M> is why the default is the
          default.
        </p>

        <Callout color={TEAL} title={<>Smoothing is a bias–variance dial in disguise</>}>
          Small <M>{String.raw`\alpha`}</M> is low bias, high variance: the estimates chase every quirk of the
          training counts, zeros included. Large <M>{String.raw`\alpha`}</M> is high bias, low variance: pulled
          toward a uniform prior, deaf to the data. The best <M>{String.raw`\alpha`}</M> trades just enough
          variance for bias — and, like any such knob, is worth tuning by cross-validation rather than trusting
          the default blindly, especially with an unusually large vocabulary or unusually short documents.
        </Callout>

        <p style={{ color: "var(--muted)" }}>
          One last note, because it matters for trusting the trick: adding <M>{String.raw`\alpha`}</M> is not a
          fudge. It is exactly the <strong>maximum-a-posteriori</strong> estimate under a symmetric{" "}
          <strong>Dirichlet prior</strong> of strength <M>{String.raw`\alpha`}</M> — the Dirichlet is conjugate to
          the multinomial, so the posterior mode is precisely{" "}
          <M>{String.raw`(\text{count} + \alpha)/(N + \alpha V)`}</M>, the smoothed formula above. So{" "}
          <M>{String.raw`\alpha`}</M> is a prior measured in imaginary observations, and as real data accumulates
          it fades and the estimate returns to the raw frequency — the prior weakening exactly as it should.
        </p>

        <PrevNext
          prev={{ href: "/learn/naive-bayes/choosing-the-flavour", label: <>&larr; Choosing the flavour</> }}
          next={{ href: "/learn/naive-bayes/log-space", label: <>Next up &middot; Working in log-space &rarr;</> }}
        />
      </div>
    </article>
  );
}
