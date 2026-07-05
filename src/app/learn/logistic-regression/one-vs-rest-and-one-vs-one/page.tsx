import { M } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

const code = `from sklearn.multiclass import OneVsRestClassifier, OneVsOneClassifier
from sklearn.linear_model import LogisticRegression

soft = LogisticRegression(max_iter=5000).fit(Xtr, ytr)           # native multinomial
ovr  = OneVsRestClassifier(LogisticRegression()).fit(Xtr, ytr)   # 3 binary models
ovo  = OneVsOneClassifier(LogisticRegression()).fit(Xtr, ytr)    # 3 pairwise models

for name, m in [("softmax", soft), ("one-vs-rest", ovr), ("one-vs-one", ovo)]:
    print(f"{name:12s} test accuracy = {m.score(Xte, yte):.3f}")`;

export default function OvrOvoPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>One-vs-rest &amp; one-vs-one</>}
        intro={<>
          Softmax handles many classes natively. But there&rsquo;s an older, model-agnostic trick:
          stitch a multiclass classifier out of many binary ones. It&rsquo;s how you make an
          intrinsically two-class model — an SVM, say — do multiclass at all.
        </>}
      />

      <div className="lesson">
        <p>
          The idea is decomposition: reduce one hard <M>K</M>-class problem to a pile of easy
          two-class problems, each of which any binary classifier can solve. There are two standard
          recipes.
        </p>

        <h2>One-vs-rest (OvR)</h2>
        <p>
          Train <strong>one binary classifier per class</strong>: &ldquo;class A vs everything
          else,&rdquo; &ldquo;class B vs everything else,&rdquo; and so on — <M>K</M> models for{" "}
          <M>K</M> classes. To predict, run all <M>K</M> and take the class whose model is most
          confident. Simple, cheap, and interpretable (each model is one class&rsquo;s
          &ldquo;detector&rdquo;). Its weakness: each model trains on a lopsided problem (one class
          against all the rest combined), and the <M>K</M> confidence scores come from separate models
          that were never calibrated against each other, so &ldquo;most confident&rdquo; can be a
          shaky comparison.
        </p>

        <h2>One-vs-one (OvO)</h2>
        <p>
          Train <strong>one binary classifier per pair of classes</strong> — A-vs-B, A-vs-C, B-vs-C
          — which is <M>{String.raw`\binom{K}{2}`}</M> models. To predict, every classifier casts a
          vote for one of its two classes and the majority wins. Each model sees a cleaner, balanced
          two-class slice, but the model count grows with <M>{String.raw`K^2`}</M> — for 10 digits
          that&rsquo;s 45 classifiers. OvO trains more models but each on less data, which is why some
          libraries default to it for SVMs (whose training cost is superlinear in dataset size).
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>On our clean three-blob dataset, how will native softmax, OvR, and OvO compare on accuracy?</>}
          options={["Softmax wins by a lot", "All three within a point or two of each other", "OvO always loses"]}
          nudge={<>Locked in. The three accuracies are printed below.</>}
        />

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`softmax      test accuracy = 0.928
one-vs-rest  test accuracy = 0.922
one-vs-one   test accuracy = 0.928`}</CodeOutput>

        <p>
          On well-separated data the three barely differ — softmax and OvO tie at 92.8%, OvR a
          hair behind at 92.2%. The decomposition tricks are remarkably competitive. So why prefer
          native softmax for logistic regression?
        </p>

        <h2>Why softmax wins for logistic regression specifically</h2>
        <p>
          Because logistic regression <em>has</em> a native multiclass form, and it gives you the one
          thing the decompositions can&rsquo;t: a single, jointly-trained probability distribution
          that sums to 1 and is calibrated across all classes at once. OvR&rsquo;s <M>K</M> scores
          come from <M>K</M> separate fits and don&rsquo;t naturally form a distribution (you have to
          normalize them post hoc, and the result isn&rsquo;t truly calibrated). For a model that
          already speaks multiclass, wrapping it in OvR/OvO throws away its best feature.
        </p>

        <Callout color={ACCENT} title={<>So when do you reach for OvR/OvO?</>}>
          When your base classifier is <em>intrinsically binary</em> and has no native multiclass
          form — the classic case is the SVM. There, OvR (fewer models) or OvO (balanced, cheaper
          per model on big data) is how you get multiclass at all. For logistic regression, softmax
          is the right default; keep OvR/OvO in your pocket as the general reduction that turns any
          binary classifier into a multiclass one.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "For a 10-class problem, how many binary models does one-vs-one train?",
              options: ["10", "45 — one per pair, C(10,2)", "100"],
              answer: 1,
              explain: "OvO trains one classifier per pair: C(10,2) = 45. OvR would train 10 (one per class). OvO's count grows roughly with K², which is its main cost.",
            },
            {
              q: "The main reason to use native softmax over OvR for logistic regression is…",
              options: ["It's always more accurate", "It produces one jointly-trained, calibrated distribution over all classes that sums to 1", "It trains faster on every dataset"],
              answer: 1,
              explain: "Accuracy is often similar. The real win is a single coherent probability distribution — OvR's K independent scores don't naturally sum to 1 or stay mutually calibrated.",
            },
            {
              q: "You're using an SVM (intrinsically binary) on a 4-class problem. The natural approach is…",
              options: ["Softmax — just switch it on", "OvR or OvO to reduce it to binary problems the SVM can solve", "Give up; SVMs can't do multiclass"],
              answer: 1,
              explain: "SVMs have no native multiclass form, so you decompose: OvR (4 models) or OvO (6 models). This is exactly the situation the reduction tricks were built for.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/softmax-and-multinomial", label: <>← Softmax &amp; multinomial</> }}
          next={{ href: "/learn/logistic-regression/calibration", label: <>Next up · Calibration →</> }}
        />
      </div>
    </article>
  );
}
