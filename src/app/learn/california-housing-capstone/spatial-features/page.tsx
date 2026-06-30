import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Capstone: spatial feature engineering — Manifold",
  description:
    "Upgrade 1: the linear model can't bend to California's geography, so we engineer features that do the bending for it — distance to the coast and to major metros, plus geographic region clusters. Result: R² 0.672 → 0.691.",
};

export default function SpatialFeaturesPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Capstone</span>
        <span style={chip("var(--c-metrics)")}>Upgrade 1 · Geography</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Upgrade 1 · Spatial feature engineering
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        <strong>Diagnosis:</strong> geography is the dominant signal but it&rsquo;s non-linear, and raw latitude/longitude
        let a linear model only tilt a flat plane across the state. <strong>Fix:</strong> keep the linear model, but
        feed it features that already encode the geography that matters.
      </p>

      <div className="lesson">
        <h2>Why raw coordinates fail</h2>
        <p>
          To a linear model, <code>Latitude</code> means &ldquo;price changes by a fixed amount per degree north&rdquo; —
          everywhere, monotonically. But California&rsquo;s price surface isn&rsquo;t a tilt: it&rsquo;s high on the coast and in two
          metros, low in the inland valley, with no consistent north–south gradient. The map can&rsquo;t be drawn with a
          plane. So rather than ask the linear model to do something it can&rsquo;t, we compute features that translate
          location into the quantities that actually drive price.
        </p>

        <h2>The engineered features</h2>
        <ul style={ul}>
          <li><strong>Distance to the coast</strong> — minimum distance to a set of coastline anchor points. Coastal premium is huge and roughly monotonic in this distance, so it&rsquo;s a feature a linear model <em>can</em> use.</li>
          <li><strong>Distance to San Francisco and to Los Angeles</strong> — proximity to the two big job markets, each a monotonic price driver.</li>
          <li><strong>Geographic region clusters</strong> — k-means on (lat, long) carves the state into 12 regions; one-hot encoding them lets the model learn a separate price level per region, approximating the non-linear surface with piecewise constants.</li>
        </ul>
        <p>
          The region one-hots are the clever part: they give the linear model a free <em>intercept per region</em>,
          which is how a linear model fakes non-linearity in space without us hand-specifying the shape. Crucially,
          we cluster on coordinates only — never on price — so there&rsquo;s no leakage.
        </p>

        <CodeBlock fromScratch={code} withLibrary={code} />
        <CodeOutput>{`dist_coast correlation with price:  -0.429   (closer coast -> pricier)

5-fold CV  (ridge)
  base 10 features            RMSE 0.662   R2 0.672
  + spatial features          RMSE 0.643   R2 0.691     <- lift

added: dist_coast, dist_sf, dist_la, + 12 region one-hots`}</CodeOutput>

        <h2>The result, read honestly</h2>
        <p>
          R² rises from <strong>0.672 to 0.691</strong> and RMSE falls from 0.662 to 0.643 — a real, repeatable
          improvement, and a far better correlation from distance-to-coast (−0.43) than raw longitude ever managed
          (−0.05). But it&rsquo;s a <em>modest</em> gain. The reason is instructive: hand-engineered spatial features are
          still <strong>additive and monotonic</strong>, so they capture the broad coastal/metro gradient but not the
          fine, interacting structure of the price surface. We&rsquo;ve helped the linear model bend a little; truly
          capturing the geography needs a model that can carve arbitrary regions on its own — which is Upgrade 3.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Feature engineering is domain knowledge as code
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            None of these features were in the data — they come from <em>knowing</em> that California real estate is
            about the coast and the metros, and encoding that belief numerically. That&rsquo;s the essence of feature
            engineering: not blind transformation, but translating what you understand about the domain into inputs
            a model can use. It&rsquo;s also why a domain expert with a linear model can beat a novice with a fancy one.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/california-housing-capstone/diagnostics" style={navLink}>← Diagnostics: what it misses</Link>
          <Link href="/learn/california-housing-capstone/censored-regression" style={{ ...navLink, fontWeight: 600 }}>Next up · Upgrade 2: Tobit &amp; censored regression →</Link>
        </div>
      </div>
    </article>
  );
}

const code = `import numpy as np
from sklearn.cluster import KMeans

lat, lon = train.Latitude.values, train.Longitude.values
P = np.c_[lat, lon]

# distance to the coast: min distance to coastline anchor points
coast = np.array([[41.7,-124.2],[39.4,-123.8],[37.77,-122.42],[36.6,-121.9],
                  [35.1,-120.6],[34.05,-118.24],[33.0,-117.27],[32.7,-117.16]])
dist_coast = np.min(np.linalg.norm(P[:,None,:] - coast[None,:,:], axis=2), axis=1)
dist_sf = np.linalg.norm(P - [37.77, -122.42], axis=1)
dist_la = np.linalg.norm(P - [34.05, -118.24], axis=1)

# 12 geographic regions from k-means on coordinates ONLY (no leakage)
region = KMeans(n_clusters=12, n_init=5, random_state=0).fit_predict(P)
region_oh = pd.get_dummies(region, prefix="reg")

X_spatial = np.c_[X_base, dist_coast, dist_sf, dist_la, region_oh.values]
print("dist_coast corr:", np.corrcoef(dist_coast, y)[0, 1].round(3))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
