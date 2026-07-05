import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Capstone: preprocessing pipeline — Manifold",
  description:
    "Turning the data-quality findings into one clean, leakage-safe preprocessing pipeline: drop the ID, fix impossible values, median-impute, log-transform skew, and standardize — all fit on training data only.",
};

export default function PreprocessingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: "var(--c-regression)" }, { label: "3 · The linear baseline", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Preprocessing pipeline</>}
        intro={<>
          Five decisions, each with a reason, assembled into one function applied identically to train and test.
        The reasons matter more than the code.
        </>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>The decisions</h2>
        <ul style={ul}>
          <li><strong>Drop <code>PropertyID</code></strong> — a unique label, no signal, a memorisation/leakage risk.</li>
          <li><strong>Negative populations → <code>NaN</code></strong> — they&rsquo;re corrupted, not extreme; treat as missing rather than keep nonsense or invent a value.</li>
          <li><strong>Median-impute</strong> the resulting gaps plus the 1,313 missing ages — robust to skew and outliers, and computed on <em>training</em> data only.</li>
          <li><strong>Log-transform</strong> the heavily skewed positives (population, occupancy, rooms, rooms-per-household) — pulls in the tail, defuses the 1,243-occupancy leverage, keeps every row.</li>
          <li><strong>Standardize</strong> — required for fair penalties and for comparable coefficients later; fit inside the pipeline so it re-fits per CV fold.</li>
        </ul>

        <h2>The pipeline</h2>
        <CodeBlock fromScratch={code} withLibrary={codeLib} />
        <CodeOutput>{`before:  TotalRooms skew = 18.6   AvgOccupancy skew = 87.9
after :  TotalRooms skew =  0.7   AvgOccupancy skew =  0.2
negative populations remaining: 0    missing values remaining: 0
design matrix: (16512, 10)  -> ready for modeling`}</CodeOutput>
        <p>
          The log transform did its job — skew collapsed from 18.6 and 87.9 to under 1, so no single block can
          dominate the fit anymore. Imputation closed every gap, and the impossible populations are gone. The
          data is now honest and model-ready.
        </p>

        <Callout color="var(--c-regression)" title={<>The one rule that prevents most disasters: fit on train, apply to test</>}>
          Every statistic the pipeline learns — the medians, the scaler&rsquo;s means and standard deviations — is
            computed on the <em>training</em> data and reused on the test data, never re-fit. Re-fitting per split
            leaks information and inflates your scores. Wrapping the scaler in a scikit-learn <code>Pipeline</code>
            makes this automatic inside cross-validation, which is why the modeling page uses pipelines
            everywhere rather than transforming the data up front.
        </Callout>

        <PrevNext prev={{ href: "/learn/california-housing-capstone/data-quality", label: <>← Data quality &amp; cleaning</> }} next={{ href: "/learn/california-housing-capstone/linear-models", label: <>Next up · Baseline &amp; regularized models →</> }} />
      </div>
    </article>
  );
}

const code = `import numpy as np

FEAT = ['IncomeLevel','PropertyAge','TotalRooms','TotalBedrooms','NeighborhoodPop',
        'AvgOccupancy','Latitude','Longitude','RoomsPerHousehold','BedroomsRatio']

def preprocess(df, medians=None):
    d = df.drop(columns=['PropertyID']).copy()             # 1. drop identifier
    d.loc[d.NeighborhoodPop < 0, 'NeighborhoodPop'] = np.nan  # 2. impossible -> NaN
    if medians is None:
        medians = d[FEAT].median()                          # train-only stats
    d[FEAT] = d[FEAT].fillna(medians)                       # 3. median impute
    for c in ['NeighborhoodPop','AvgOccupancy','TotalRooms','RoomsPerHousehold']:
        d[c] = np.log1p(d[c].clip(lower=0))                 # 4. log-transform skew
    return d, medians

train_df, med = preprocess(train)
test_df,  _   = preprocess(test, medians=med)               # reuse train medians`;

const codeLib = `from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import RidgeCV

# 5. standardize lives INSIDE the pipeline -> re-fits per CV fold, no leakage
model = make_pipeline(StandardScaler(), RidgeCV())
model.fit(train_df[FEAT], train_df['TargetPrice'])`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
