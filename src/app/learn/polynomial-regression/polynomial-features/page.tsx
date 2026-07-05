import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Polynomial regression — Manifold",
  description:
    "Polynomial regression fits a curve by expanding one feature into its powers — x, x², x³ — and running ordinary least squares on the wider design matrix. With interaction terms, the same trick captures how features combine.",
};

export default function PolynomialFeaturesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 7 minutes"
        title={<>Polynomial regression</>}
        intro={<>
          The mechanic behind the curve: don&rsquo;t change the model, change the <em>columns</em>. Expand a feature into
        its powers and least squares does the rest.
        </>}
      />

      <div className="lesson">
        <h2>Expand the feature into powers</h2>
        <p>
          A degree-<M>{String.raw`d`}</M> polynomial in one variable is:
        </p>
        <MathBlock>{String.raw`\hat{y} = \beta_0 + \beta_1 x + \beta_2 x^2 + \beta_3 x^3 + \dots + \beta_d x^d`}</MathBlock>
        <p>
          To fit it, we build a <strong>design matrix</strong> whose columns are the powers of <M>{String.raw`x`}</M>.
          A single input value <M>{String.raw`x`}</M> becomes a whole row{" "}
          <M>{String.raw`[\,1,\; x,\; x^2,\; \dots,\; x^d\,]`}</M>:
        </p>
        <MathBlock>{String.raw`\mathbf{X} = \begin{bmatrix} 1 & x_1 & x_1^2 & \cdots & x_1^d \\ 1 & x_2 & x_2^2 & \cdots & x_2^d \\ \vdots & \vdots & \vdots & & \vdots \\ 1 & x_n & x_n^2 & \cdots & x_n^d \end{bmatrix}`}</MathBlock>
        <p>
          Now feed <M>{String.raw`\mathbf{X}`}</M> to ordinary least squares. The normal equation{" "}
          <M>{String.raw`\boldsymbol{\beta} = (\mathbf{X}^\top\mathbf{X})^{-1}\mathbf{X}^\top \mathbf{y}`}</M> is
          identical — only the matrix is wider. The output is a curve in <M>{String.raw`x`}</M>, but a{" "}
          <em>plane</em> in the expanded feature space.
        </p>

        <h2>In code it&rsquo;s one transformer</h2>
        <p>
          scikit-learn&rsquo;s <code>PolynomialFeatures</code> builds those columns for you; chain it with a linear
          model in a <code>Pipeline</code> and you have polynomial regression.
        </p>
        <CodeBlock setup="" fromScratch={code} withLibrary={code} />

        <h2>More than one feature: interactions</h2>
        <p>
          With two inputs <M>{String.raw`x_1, x_2`}</M>, a degree-2 expansion adds not just the squares{" "}
          <M>{String.raw`x_1^2, x_2^2`}</M> but the <strong>interaction</strong> <M>{String.raw`x_1 x_2`}</M> — a term
          that lets the effect of one feature <em>depend on</em> the other. That single product is how a linear
          model captures &ldquo;fertilizer helps, but only when there&rsquo;s enough rain.&rdquo;
        </p>
        <MathBlock>{String.raw`\hat{y} = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_1^2 + \beta_4 x_2^2 + \beta_5\, x_1 x_2`}</MathBlock>

        <Callout color="var(--c-regression)" title={<>The column count explodes</>}>
          With <M>{String.raw`p`}</M> features and degree <M>{String.raw`d`}</M>, the number of polynomial terms
            grows like <M>{String.raw`\binom{p+d}{d}`}</M> — 10 features at degree 3 is already 286 columns. This
            blow-up is why polynomial regression is mostly used for a <em>few</em> features, and why the next
            chapters reach for smarter bases (and regularization) to stay in control.
        </Callout>

        <PrevNext prev={{ href: "/learn/polynomial-regression", label: <>← Why straight lines fail</> }} next={{ href: "/learn/polynomial-regression/linear-in-parameters", label: <>Next up · Still linear in the parameters →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline

x = np.linspace(0, 10, 40)
y = 35 + 12*x - 0.9*x**2 + np.random.default_rng(0).normal(0, 3, x.size)

# degree-3 polynomial = expand features, then plain least squares
model = make_pipeline(PolynomialFeatures(degree=3), LinearRegression())
model.fit(x.reshape(-1, 1), y)

print("R2:", round(model.score(x.reshape(-1, 1), y), 3))
print("coefs:", model[-1].coef_.round(2))   # weights on [1, x, x^2, x^3]`;

