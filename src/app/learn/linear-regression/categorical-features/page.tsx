import { CategoricalFeaturesLab } from "@/components/labs/CategoricalFeaturesLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";


export const metadata = {
  title: "Categorical features — Manifold",
  description:
    "Linear regression needs numbers. But real data has cities, colours, and job titles. One-hot encoding converts categories into columns the model can use.",
};

export default function CategoricalFeaturesPage() {
  const fromScratch = `import numpy as np

# Neighbourhood: 'urban', 'suburban', 'rural'
neighbourhoods = ['urban', 'suburban', 'rural', 'urban', 'rural', 'suburban']
prices         = np.array([520, 310, 180, 490, 210, 330], dtype=float)

# Integer-encode categories
mapping = {'rural': 0, 'suburban': 1, 'urban': 2}
cat_int = np.array([mapping[n] for n in neighbourhoods])

# One-hot: drop 'rural' (index 0) as the baseline reference
# np.eye(3) creates an identity matrix; slice off first column
ohe = np.eye(3)[cat_int][:, 1:]    # shape (6, 2): suburban, urban cols
print("Encoded X:\\n", ohe)

# Add intercept and solve
X     = np.column_stack([np.ones(len(ohe)), ohe])
theta = np.linalg.lstsq(X, prices, rcond=None)[0]

print(f"Baseline (rural):     \${theta[0]:.0f}k")
print(f"Suburban premium:     +\${theta[1]:.0f}k")
print(f"Urban premium:        +\${theta[2]:.0f}k")`;

  const withLibrary = `import pandas as pd
from sklearn.linear_model import LinearRegression

df = pd.DataFrame({
    'neighbourhood': ['urban','suburban','rural','urban','rural','suburban'],
    'price':         [520,     310,       180,    490,    210,    330],
})

# drop_first=True removes one category (baseline) automatically
X = pd.get_dummies(df['neighbourhood'], drop_first=True).astype(float)
y = df['price'].values

model = LinearRegression().fit(X, y)

print("Feature names:", list(X.columns))
print("Coefficients: ", model.coef_.round(1))
print(f"Baseline (rural) intercept: \${model.intercept_:.0f}k")`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Core idea", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Categorical features</>}
        intro={<>
          Linear regression does matrix multiplication. Categories like "Europe"
        or "Sedan" aren't numbers — so we turn them into numbers. One-hot
        encoding is the standard tool.
        </>}
      />

      <div className="lesson">
        <p>
          Suppose your dataset has a column for "region": Europe, Asia,
          Americas, Africa. You might be tempted to encode these as 1, 2, 3, 4.
          Don't. That encoding implies Asia is twice Europe, and Africa is four
          times Europe — a ranking that doesn't exist in your data. The model
          will treat those distances literally and learn nonsense.
        </p>

        <h2>One-hot encoding</h2>
        <p>
          Instead, create one binary column per category. Each column is 1 if
          the row belongs to that category, 0 otherwise:
        </p>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={oheTable}>
            <thead>
              <tr>
                {["region", "gdp", "isEurope", "isAsia", "isAmericas"].map(h => (
                  <th key={h} style={{ ...thStyle, color: h.startsWith("is") ? "var(--brand)" : "var(--faint)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Europe", "46k", "1", "0", "0"],
                ["Asia", "18k", "0", "1", "0"],
                ["Americas", "63k", "0", "0", "1"],
                ["Africa", "5k", "0", "0", "0"],
              ].map(row => (
                <tr key={row[0]}>
                  {row.map((v, i) => (
                    <td key={i} style={{ ...tdStyle, color: i > 1 && v === "1" ? "var(--brand)" : "var(--muted)" }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Notice Africa has all zeros — it's the <strong>reference
          category</strong>. We always drop one column to avoid the{" "}
          <em>dummy variable trap</em>: if you include all categories, the
          columns sum to 1 everywhere, making the design matrix singular
          (XᵀX becomes uninvertible). The coefficient on "isEurope" then means
          "the predicted change vs Africa, after controlling for GDP."
        </p>

        <h2>See it work</h2>
        <p>
          The lab uses happiness scores from 16 countries. With GDP alone, all
          regions sit on the same line. Add one-hot region columns and the
          model fits a separate parallel line per continent — each shifted by
          that region's coefficient.
        </p>

        <CategoricalFeaturesLab />

        <h2>Ordinal vs nominal categories</h2>
        <p>
          Not every category is purely nominal. <strong>Ordinal</strong>{" "}
          categories have a natural order — {'"'}cold, warm, hot{'"'}, or{" "}
          {'"'}low, medium, high education{'"'}. Here you can sometimes use
          a single integer encoding (0, 1, 2) without lying to the model.
          But if the spacing between levels isn't uniform, one-hot encoding
          remains the safer choice.
        </p>

        <h2>High-cardinality categories</h2>
        <p>
          One-hot works well when there are a handful of categories. With
          thousands — zip codes, product IDs, user IDs — the design matrix
          explodes in width and many columns will be mostly zeros
          (sparse). Common fixes:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Target encoding</strong> — replace each category with the mean of y for that category. Fast, but leaks target information if not done carefully.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Embedding layers</strong> — used in neural networks; learn a dense vector representation per category jointly with the rest of the model.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Grouping rare categories</strong> — merge low-frequency levels into an "Other" bucket before encoding.
          </li>
        </ul>

        <Callout color="var(--c-fundamentals)" title={<>The dummy variable trap</>}>
          Always drop one category from the one-hot encoding (or equivalently,
            omit the intercept). If you include all k categories plus an
            intercept, the columns are linearly dependent — XᵀX is singular and
            the normal equation has no unique solution. Libraries like{" "}
            <code>pandas.get_dummies(drop_first=True)</code> handle this
            automatically.
        </Callout>

        <h2>The code</h2>
        <p>
          One-hot encoding from scratch using NumPy, then the pandas
          shortcut that handles the dummy-variable trap automatically.
        </p>

        <CodeBlock setup={REGRESSION_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <PrevNext prev={{ href: "/learn/linear-regression/feature-scaling", label: <>← Feature scaling</> }} next={{ href: "/learn/linear-regression/polynomial-and-interaction-terms", label: <>Next up · Polynomial &amp; interaction terms →</> }} />
      </div>

    </article>
  );
}


const oheTable: React.CSSProperties = { borderCollapse: "collapse", fontSize: 13, width: "auto" };
const thStyle: React.CSSProperties = { padding: "5px 14px", fontWeight: 500, textAlign: "center", borderBottom: "1px solid var(--border-strong)", fontFamily: "ui-monospace, monospace" };
const tdStyle: React.CSSProperties = { padding: "4px 14px", textAlign: "center", borderBottom: "1px solid var(--border)", fontFamily: "ui-monospace, monospace" };


