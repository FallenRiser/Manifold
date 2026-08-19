import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case A: dense vs sparse — Manifold",
  description:
    "A real head-to-head: kernel ridge and SVR fit the same nonlinear data to the same accuracy tier, but KRR keeps every training point while SVR keeps under half. The measured cost of density — and what it buys in return.",
};

export default function CaseADensePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "In the wild · a real run", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Case A: dense vs sparse</>}
        intro={<>
          Kernel ridge and support vector regression share a kernel and a purpose, and differ in one structural
          fact: KRR is dense, SVR is sparse. Here is that difference measured on real data — the code and its
          actual output are below.
        </>}
      />

      <div className="lesson">
        <h2>The setup</h2>
        <p>
          Both models fit <code>make_friedman1</code> — a strongly nonlinear target — with the same RBF kernel, the
          same 600-train / 200-test split, and each tuned by 5-fold cross-validation. The only thing that differs is
          the objective: KRR&rsquo;s squared loss with a dense closed form, versus SVR&rsquo;s ε-insensitive loss with a
          sparse QP.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>Accuracy: a dead heat.</strong> KRR posts test <M>{String.raw`R^2 = 0.929`}</M>, SVR{" "}
            <M>{String.raw`0.920`}</M> — a difference well inside the noise. On clean data the two loss functions
            recover essentially the same nonlinear surface. Neither is &ldquo;more accurate&rdquo; here in any meaningful
            sense.
          </li>
          <li>
            <strong>Model size: not close.</strong> KRR stores <M>{String.raw`600`}</M> of{" "}
            <M>{String.raw`600`}</M> points — every dual coefficient is nonzero. SVR stores{" "}
            <M>{String.raw`291`}</M> (48%), dropping more than half the training set as inside-the-tube and
            irrelevant. KRR&rsquo;s model is <strong>2.1× larger</strong>, and that gap is memory it will carry and
            prediction work it will do on every single query, forever.
          </li>
          <li>
            <strong>The trade is structural, not tunable.</strong> No setting of <M>{String.raw`\lambda`}</M> makes
            KRR sparse — density is intrinsic to the squared loss, just as sparsity is intrinsic to the ε-tube. You
            choose the property when you choose the model.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>So why ever pick the bigger model?</>}>
          Because density buys simplicity. KRR&rsquo;s fit is a single linear solve — no quadratic program, no{" "}
            <M>{String.raw`\varepsilon`}</M> to set, and, crucially, it composes with the{" "}
            <Link href="/learn/kernel-ridge-regression/solving-the-linear-system" style={inlineLink}>eigendecomposition trick</Link>{" "}
            that makes tuning <M>{String.raw`\lambda`}</M> nearly free. <Link href="/learn/kernel-ridge-regression/case-b-efficient-loocv" style={inlineLink}>Case&nbsp;B</Link> measures that payoff — the other half of this
            trade-off. SVR has no equivalent shortcut; its QP must be re-solved for every hyperparameter.
        </Callout>

        <p>
          So the honest summary: on accuracy they tie; SVR wins on model size; KRR wins on tuning cost and
          simplicity. Which matters more is a property of your deployment, not of the data —
          the <Link href="/learn/kernel-ridge-regression/kernel-ridge-vs-svr-vs-linear" style={inlineLink}>comparison page</Link> laid out the decision, and now you have seen it on real numbers.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "On this clean nonlinear benchmark, how did KRR and SVR compare on accuracy?",
              options: ["A dead heat — R² 0.929 vs 0.920, well within noise", "KRR far ahead", "SVR far ahead"],
              answer: 0,
              explain: "With the same kernel on clean data, the two losses recover essentially the same surface. The interesting difference is elsewhere.",
            },
            {
              q: "What was the real difference between the two models?",
              options: ["Model size — KRR stored all 600 points, SVR only 291 (48%), a 2.1× larger KRR model", "The kernel used", "The train/test split"],
              answer: 0,
              explain: "KRR's dual coefficients are all nonzero (dense); SVR keeps only support vectors (sparse). Same accuracy, very different footprint.",
            },
            {
              q: "Given SVR's smaller model, why might you still choose KRR?",
              options: ["Its closed form is simpler and composes with near-free LOOCV tuning; SVR must re-solve its QP per hyperparameter", "It's always more accurate", "It needs no kernel"],
              answer: 0,
              explain: "Density is the price for a single linear solve that reuses one eigendecomposition across the whole λ grid — the subject of Case B.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression/worked-example", label: <>← A worked example</> }} next={{ href: "/learn/kernel-ridge-regression/case-b-efficient-loocv", label: <>Next up · Case B: efficient leave-one-out CV →</> }} />
      </div>
    </article>
  );
}

const code = `from sklearn.datasets import make_friedman1
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.kernel_ridge import KernelRidge
from sklearn.svm import SVR

X, y = make_friedman1(n_samples=800, noise=1.0, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
sc = StandardScaler().fit(Xtr); Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)

# same kernel, same split; each tuned by 5-fold CV
krr = GridSearchCV(KernelRidge(kernel="rbf"),
        {"alpha": [1e-3,1e-2,1e-1,1], "gamma": [.01,.03,.1,.3]}, cv=5).fit(Xtr, ytr)
svr = GridSearchCV(SVR(kernel="rbf"),
        {"C": [1,10,100], "epsilon": [.1,.5,1.], "gamma": [.01,.03,.1,.3]}, cv=5).fit(Xtr, ytr)

krr_stored = len(ytr)                              # dense: all coefficients nonzero
svr_stored = svr.best_estimator_.support_.shape[0] # sparse: support vectors only`;

const output = `=== Case A: dense vs sparse — KRR vs SVR on the same data ===
train=600  test=200  (same features, same split, RBF kernel)
  KRR (dense)  test R^2=0.9291  RMSE=1.4130  stores 600/600 points (100%)
  SVR (sparse) test R^2=0.9200  RMSE=1.5011  stores 291/600 points (48%)
  -> same accuracy tier; KRR's price for its closed form is a model 2.1x larger`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
