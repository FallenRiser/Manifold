import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { COMBOS } from "@/components/figures/nnReg/data";

export const metadata = {
  title: "The interaction between techniques — Manifold",
  description:
    "Do regularisers stack? Partly. Weight decay plus dropout beats either alone, but adding a third on top does not keep climbing. The rule: combine techniques that attack different failure modes, and tune them together.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function InteractionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Combining regularisers", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>The interaction between techniques</>}
        intro={<>You have four regularisers now, each measured alone on the same overfitting network.
          The natural question is whether they add up. If dropout buys you some test accuracy and weight
          decay buys you some, does using both buy you the sum? The honest answer is <em>partly</em> — and
          the shape of that &ldquo;partly&rdquo; is the most useful thing this chapter has to teach.</>}
      />

      <div className="lesson">
        <h2>The stacking question, measured</h2>
        <p>
          The running problem is unchanged: a 3&times;256 MLP on 250 points with 10% label noise,
          full-batch AdamW for 400 epochs, averaged over three seeds. Training accuracy is 1.000 in every
          row — the network memorises the training set no matter what we do — so the only number that
          moves is the test accuracy, and the gap is just <M>{String.raw`1.000 - \text{test}`}</M>.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>configuration</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>gap</th>
              </tr>
            </thead>
            <tbody>
              {([
                { c: "none", acc: "0.753", gap: "0.247", best: false },
                { c: "weight decay 1e-2", acc: "0.751", gap: "0.249", best: false },
                { c: "dropout 0.3", acc: "0.772", gap: "0.228", best: false },
                { c: "wd + dropout", acc: "0.781", gap: "0.219", best: true },
                { c: "wd + dropout + jitter", acc: "0.774", gap: "0.226", best: false },
              ] as const).map((r) => (
                <tr key={r.c}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.c}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Three-seed average, train accuracy 1.000 throughout.
        </p>

        <Dumbbell
          rows={COMBOS.map((c) => ({ init: c.label, a: c.test }))}
          seriesLabels={["test accuracy"]}
          ticks={[0.75, 0.76, 0.77, 0.78]}
          caption={<>Five configurations on one axis. Weight decay alone is indistinguishable from
            nothing (0.751 against 0.753). Dropout alone gains two points. The two together reach
            <strong> 0.781</strong> — better than either, and better than the sum of their individual
            gains, which is the one genuinely surprising row given that decay on its own does nothing.
            Then adding jitter on top takes it back down to 0.774. Stacking is not additive and it is
            not monotone; three regularisers is not more regularisation than two, it is a different
            model.</>}
        />

        <h2>Reading the table honestly</h2>
        <p>
          Start with the two techniques that do work here. Dropout at rate 0.3 lifts test accuracy from
          0.753 to 0.772 — a real gain of 0.019. Weight decay at 1e-2 does essentially nothing: 0.751,
          a hair <em>below</em> the unregularised baseline and well inside the seed-to-seed noise. On this
          problem, under this optimiser, weight decay is inert — a result the{" "}
          <Link href="/learn/nn-regularisation/l2-penalty" style={link}>weight-decay chapter</Link>{" "}
          explained and did not hide.
        </p>
        <p>
          Now the interesting row. <strong>Weight decay plus dropout reaches 0.781</strong> — better than
          dropout&rsquo;s 0.772 alone, and much better than weight decay&rsquo;s 0.751 alone. This is the
          heart of the chapter: a technique that did nothing on its own contributed 0.009 once it was
          paired with dropout. The two together are worth more than the better of them individually. That
          is what &ldquo;stacking&rdquo; looks like when it happens.
        </p>
        <p>
          And then the row that keeps you honest. Adding input jitter on top —{" "}
          <strong>weight decay plus dropout plus jitter — falls to 0.774</strong>, below the 0.781 of the
          pair. A third regulariser did not keep the climb going. It interfered. Three noise sources
          stacked on a network that was already close to its achievable ceiling pushed it from
          well-regularised toward <em>over</em>-regularised, and over-regularisation looks exactly like
          underfitting creeping back in.
        </p>

        <Callout color={CORAL} title={<>Stacking is real but bounded</>}>
          Regularisers partly add: weight decay plus dropout (0.781) beats either alone (0.772 and 0.751).
          But the returns diminish and can reverse — the third technique here (jitter) dragged the result
          <em> down</em> to 0.774. There is a floor of irreducible error set by the 10% label noise, and
          once you are near it, extra regularisation removes signal, not just overfitting. More knobs is
          not more accuracy.
        </Callout>

        <h2>Why some pairs stack and others do not</h2>
        <p>
          The pattern is not random. Two regularisers stack when they attack <em>different</em> failure
          modes, and they stop stacking — or interfere — when they attack the <em>same</em> one. Weight
          decay shrinks the magnitude of the weights; dropout forces the network to spread its reliance
          across many units rather than a few. Those are different pathologies of an overfit network:
          weights that are too large, and units that are too co-adapted. Fixing both is genuinely two
          fixes.
        </p>
        <p>
          Dropout and input jitter, on the other hand, are two flavours of the <em>same</em> fix — both
          inject noise to stop the network from locking onto exact training coordinates. Dropout perturbs
          the activations; jitter perturbs the inputs. Once dropout has already made the network noise-robust,
          adding jitter mostly duplicates that pressure, and past a point it just erodes the usable signal.
          Redundant medicine is not double the cure; it is a double dose that starts to poison.
        </p>

        <MathBlock>{String.raw`\text{test error} \;\approx\; \underbrace{\text{bias}}_{\text{too much reg}} \;+\; \underbrace{\text{variance}}_{\text{too little reg}} \;+\; \underbrace{\sigma^2_{\text{noise}}}_{\text{irreducible}}`}</MathBlock>

        <p>
          Every regulariser trades variance for bias. Stacking two that cut variance along independent
          axes lowers variance twice while barely raising bias. Stacking two that cut the <em>same</em>{" "}
          variance the second time buys little variance reduction but still pays the bias cost — so the
          curve turns over. The <M>{String.raw`\sigma^2_{\text{noise}}`}</M> term, fixed by the 10% label
          noise here, is the floor none of this can cross.
        </p>

        <Proof color={CORAL} title="why different-mode regularisers stack and same-mode ones do not">
          <p>
            Model the test error as bias plus variance plus irreducible noise. A regulariser reduces
            variance by constraining the hypothesis it can express, at the cost of a little bias. Suppose
            two regularisers <M>{String.raw`R_A`}</M> and <M>{String.raw`R_B`}</M> constrain{" "}
            <em>different</em> directions of the model&rsquo;s freedom — say, weight magnitude and unit
            co-adaptation. The variance reductions apply to nearly disjoint components, so they add:{" "}
            <M>{String.raw`\Delta\text{Var} \approx \Delta\text{Var}_A + \Delta\text{Var}_B`}</M>, while
            each contributes only its own small bias. Net effect: the sum is better than either.
          </p>
          <p>
            Now suppose <M>{String.raw`R_A`}</M> and <M>{String.raw`R_B`}</M> constrain the{" "}
            <em>same</em> direction — both inject activation-level noise. Once <M>{String.raw`R_A`}</M>{" "}
            has removed that slice of variance, there is little left for <M>{String.raw`R_B`}</M> to
            remove: <M>{String.raw`\Delta\text{Var}_B \to 0`}</M>. But <M>{String.raw`R_B`}</M> still adds
            its bias. The sum <M>{String.raw`\Delta\text{Var} - \Delta\text{Bias}`}</M> can go negative,
            and the combined model is worse than the single one — exactly the 0.781 &rarr; 0.774 you
            measured. The takeaway is diagnostic, not decorative: before stacking, ask what failure mode
            each tool addresses, and only pair tools that address different ones.
          </p>
        </Proof>

        <h2>The operational rule</h2>
        <p>
          Combine, but combine deliberately. Pick one regulariser that fits the data (on this problem,
          dropout or augmentation) and one that constrains a different axis (weight decay), and{" "}
          <strong>tune them together</strong> — the best rate for dropout alone is not the best rate for
          dropout beside weight decay. Then watch the test number as you add a third. If it stops rising,
          you have hit the noise floor. If it <em>falls</em>, you have over-regularised, and the fix is to
          remove a regulariser, not add another. The signal that you have gone too far is unmistakable
          once you know its face: the train-test gap shrinks, but the test accuracy shrinks with it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Weight decay alone scored 0.751 (below the 0.753 baseline) and dropout alone scored
                0.772. Together they scored 0.781. What does that tell you?</>,
              options: [
                "The measurements are inconsistent — weight decay cannot help if it did nothing alone",
                "Regularisers can partly stack: weight decay contributed once paired with dropout because the two constrain different failure modes",
                "Dropout was actually doing all the work and weight decay was irrelevant",
              ],
              answer: 1,
              explain: <>An inert-alone technique can still contribute in combination. Weight decay
                constrains weight magnitude; dropout constrains unit co-adaptation. Because they attack
                different pathologies of the overfit network, their variance reductions partly add, so the
                pair (0.781) beats the better single technique (0.772).</>,
            },
            {
              q: <>Adding input jitter on top of weight decay + dropout moved test accuracy from 0.781 to
                0.774 — a drop. Why did the third regulariser hurt?</>,
              options: [
                "Input jitter is never a useful regulariser",
                "Jitter and dropout attack the same failure mode (injected noise), so the third technique added bias without removing new variance, pushing the model toward over-regularisation",
                "Three seeds is too few to measure the effect",
              ],
              answer: 1,
              explain: <>Dropout and jitter are both noise injection — the same fix twice. Once dropout has
                made the network noise-robust, jitter removes little additional variance but still pays a
                bias cost, and near the 10% noise floor that trade turns negative. Over-regularisation
                looks like underfitting returning.</>,
            },
            {
              q: <>You are combining regularisers and the train-test gap is shrinking but the test accuracy
                is also shrinking. What has happened, and what do you do?</>,
              options: [
                "The model is generalising better — keep adding regularisers",
                "You have over-regularised; remove a regulariser rather than adding another",
                "The training accuracy must have dropped below 1.000 by mistake",
              ],
              answer: 1,
              explain: <>A closing gap with a falling test number is the signature of over-regularisation:
                you have crossed from cutting variance into cutting signal. The remedy is to back off — take
                a regulariser away or lower a rate — not to pile on a fourth technique.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/label-smoothing", label: <>&larr; Label smoothing and mixup</> }}
          next={{ href: "/learn/nn-regularisation/batchnorm-as-reg", label: <>Next up &middot; BatchNorm as implicit regularisation &rarr;</> }}
        />
      </div>
    </article>
  );
}
