import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { CoefPathLab } from "@/components/labs/CoefPathLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "The shrinkage effect & coefficient paths — Manifold",
  description:
    "Plot every coefficient against λ and you get the coefficient path — the clearest single picture of what ridge does. All paths glide toward zero together, but none ever reaches it.",
};

export default function ShrinkagePathsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 6 minutes"
        title={<>The shrinkage effect & coefficient paths</>}
        intro={<>
          The single most useful diagnostic for any regularizer is the <strong>coefficient path</strong>:
        every coefficient traced as a function of λ. For ridge, that picture tells the whole story at a
        glance — and sets up the dramatic contrast with Lasso.
        </>}
      />

      <div className="lesson">
        <h2>Reading a coefficient path</h2>
        <p>
          Plot each coefficient&rsquo;s value on the vertical axis against the penalty strength λ on the
          horizontal. At the weak-penalty end (right) the coefficients equal the OLS estimates; as λ
          strengthens (moving left), watch them migrate. For ridge, every line slides smoothly toward the
          zero axis — together, gradually, and <strong>never quite arriving</strong>.
        </p>

        <h2>See it — and compare to Lasso</h2>
        <p>
          Drag λ and toggle between the two penalties. With <strong>Ridge</strong>, all six coefficients
          stay alive, shrinking in proportion. Flip to <strong>Lasso</strong> (a preview of the next chapter)
          and the difference is stark: paths hit exactly zero and stay there, dropping features one by one.
        </p>
        <CoefPathLab />

        <h2>What the ridge paths tell you</h2>
        <ul style={ul}>
          <li>
            <strong>Smooth, monotone shrinkage.</strong> No coefficient jumps around; each contracts steadily.
            That smoothness is why ridge solutions are stable as you vary λ.
          </li>
          <li>
            <strong>Nothing is eliminated.</strong> Even at strong λ every coefficient is small-but-nonzero —
            visual proof that ridge doesn&rsquo;t do feature selection.
          </li>
          <li>
            <strong>Correlated features shrink together.</strong> Where two features are correlated, ridge
            tends to share the weight between them and shrink them in tandem, rather than arbitrarily picking
            one — the stabilising behaviour we&rsquo;ll see fully on the multicollinearity page.
          </li>
        </ul>

        <Callout color="var(--c-regression)" title={<>Paths are how you choose λ visually</>}>
          The path plot isn&rsquo;t just pretty — it&rsquo;s a practical tool. Overlay the cross-validation error and
            you can see which coefficients are stable across a sensible range of λ and which collapse quickly.
            For Lasso especially, the path shows the <em>order</em> in which features enter the model, a free
            ranking of their importance. Libraries compute the entire path efficiently in one shot.
        </Callout>

        <h2>Compute the path</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/the-closed-form-solution", label: <>← The closed-form solution</> }} next={{ href: "/learn/regularized-regression/ridge-and-multicollinearity", label: <>Next up · Ridge &amp; multicollinearity →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def ridge_fit(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

# trace each coefficient across a log-spaced grid of λ — that's the path
lambdas = np.logspace(-2, 3, 50)
path = np.array([ridge_fit(X, y, lam) for lam in lambdas])   # shape (50, p)
# plt.plot(np.log10(lambdas), path)  ->  the coefficient-path figure`;

const codeLib = `import numpy as np
from sklearn.linear_model import Ridge

lambdas = np.logspace(-2, 3, 50)
coefs = [Ridge(alpha=lam).fit(X, y).coef_ for lam in lambdas]

import matplotlib.pyplot as plt
plt.plot(np.log10(lambdas), coefs)
plt.xlabel("log10(λ)"); plt.ylabel("coefficient"); plt.show()`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


