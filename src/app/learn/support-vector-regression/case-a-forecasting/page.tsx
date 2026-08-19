import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case A: forecasting a chaotic series — Manifold",
  description:
    "A real run on the chaotic Mackey-Glass series. A linear autoregressive model and an RBF-kernel SVR are given the same 8 lag features; SVR halves the forecast error, and it does it with a sparse model built on a third of the training points.",
};

export default function CaseAPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "In the wild · a real run", color: "var(--c-regression)" }]}
        time="about 8 minutes"
        title={<>Case A: forecasting a chaotic series</>}
        intro={<>
          Theory said the RBF kernel would capture nonlinear structure a linear model cannot. Here it is on a
          classic chaotic benchmark — the code and its actual output are below, every number measured, not
          illustrative.
        </>}
      />

      <div className="lesson">
        <h2>The task</h2>
        <p>
          The <strong>Mackey-Glass</strong> series is a standard chaos benchmark: a deterministic delay equation
          whose trajectory never repeats and is famously hard to forecast. We generate 900 points, then set up a
          one-step-ahead forecast — predict <M>{String.raw`x_t`}</M> from its 8 most recent lags{" "}
          <M>{String.raw`(x_{t-1}, \dots, x_{t-8})`}</M>. Crucially we split <em>chronologically</em>: train on the
          first 75%, test on the future 25%. Shuffling time would leak the answer.
        </p>
        <p>
          Two models get the <strong>same</strong> 8 lag features. A ridge regression — this is a linear
          autoregressive (AR) model, the classic forecasting baseline — and an RBF-kernel SVR. Only the hypothesis
          class differs.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput label="output">{output}</CodeOutput>

        <h2>Reading the result</h2>
        <ul style={ul}>
          <li>
            <strong>SVR more than halves the error.</strong> Test RMSE drops from ridge&rsquo;s{" "}
            <M>{String.raw`0.0095`}</M> to <M>{String.raw`0.0044`}</M> — the RBF kernel picks up the curved,
            nonlinear dependence between recent lags and the next value that a straight AR model, restricted to a
            linear combination, structurally cannot represent.
          </li>
          <li>
            <strong>Both <M>{String.raw`R^2`}</M> look high — read the RMSE.</strong> Ridge posts{" "}
            <M>{String.raw`R^2 = 0.9986`}</M>, SVR <M>{String.raw`0.9997`}</M>. On a smooth series a linear AR model
            is already <em>good</em>; <M>{String.raw`R^2`}</M> compresses near 1 and hides the gap. The RMSE, more
            than 2× apart, is the honest scoreboard. A lesson in itself: pick the metric that can see the difference
            you care about.
          </li>
          <li>
            <strong>224 support vectors of 669 (~33%).</strong> The better forecaster is also the leaner model — it
            threw away two-thirds of the training history as inside-the-tube and irrelevant, keeping only the points
            that pin down the dynamics.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Why this is a fair fight</>}>
          Both models see identical inputs — the same 8 lags, the same scaler, the same chronological split. The
            <em>only</em> difference is linear-versus-kernel. So the entire RMSE gap is attributable to the kernel
            capturing nonlinear temporal structure. That is exactly the claim SVR&rsquo;s theory makes, measured on a
            series designed to be hard.
        </Callout>

        <p>
          This is the payoff case for the kernel. Next we isolate the <em>other</em> half of SVR — the loss
          function — on a problem where nonlinearity is irrelevant and only robustness matters.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "Why must the train/test split here be chronological, not random?",
              options: ["It's a forecasting task — shuffling time leaks future values into training", "SVR requires sorted data", "Random splits break the kernel"],
              answer: 0,
              explain: "Predicting the future from the past is only honest if the test set is genuinely later in time. A random split would let the model peek ahead.",
            },
            {
              q: "Ridge and SVR both post R² near 1.00. Why trust RMSE more here?",
              options: ["On a smooth series R² saturates near 1 and hides the gap; RMSE (2× apart) shows the real difference", "R² is always wrong", "RMSE is easier to compute"],
              answer: 0,
              explain: "When a linear baseline is already strong, R² compresses near 1. RMSE keeps its resolution, revealing SVR's 2× improvement.",
            },
            {
              q: "What let RBF-SVR beat the linear AR baseline on identical features?",
              options: ["The kernel represents nonlinear dependence between lags that a linear model structurally cannot", "It used more data", "It ignored the noise"],
              answer: 0,
              explain: "Same inputs, same split — the only difference is the hypothesis class. The kernel captures curvature a linear combination of lags cannot.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/support-vector-regression/worked-example", label: <>← A worked example</> }} next={{ href: "/learn/support-vector-regression/case-b-robustness", label: <>Next up · Case B: robustness to outliers →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge
from sklearn.svm import SVR

series = mackey_glass(900)            # chaotic delay equation (see script)
L = 8                                 # predict next value from 8 recent lags
X = np.stack([series[i-L:i] for i in range(L, len(series))])
y = series[L:]
cut = int(len(y) * 0.75)              # chronological split — never shuffle time
Xtr, Xte, ytr, yte = X[:cut], X[cut:], y[:cut], y[cut:]

ridge = make_pipeline(StandardScaler(), Ridge(alpha=1.0)).fit(Xtr, ytr)
svr   = make_pipeline(StandardScaler(),
            SVR(kernel="rbf", C=100, gamma=0.1, epsilon=0.005)).fit(Xtr, ytr)`;

const output = `=== Case A: forecasting the chaotic Mackey-Glass series ===
series length=900  lag features L=8  train=669  test=223
  ridge (linear AR)    test RMSE=0.0095  R^2=0.9986
  SVR (RBF)            test RMSE=0.0044  R^2=0.9997
  SVR support vectors: 224 of 669`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
