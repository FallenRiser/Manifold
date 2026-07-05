import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-means as EM (link to GMM) — Manifold",
  description:
    "k-Means' assign/update loop is Expectation–Maximization in disguise. Seeing it as the hard limit of fitting a Gaussian mixture explains both why it works and exactly where it breaks.",
};

export default function KMeansAsEMPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>k-means as EM (link to GMM)</>}
        intro={<>
          The deepest way to understand k-means is to see it as a stripped-down special case of fitting a
        Gaussian mixture with the Expectation–Maximization algorithm. This single view ties the whole
        track together.
        </>}
      />

      <div className="lesson">
        <h2>The two loops are the same shape</h2>
        <p>
          EM fits latent-variable models by alternating two steps, and k-means&rsquo; loop maps onto them
          exactly:
        </p>
        <ul style={ul}>
          <li>
            <strong>E-step ↔ assign.</strong> EM computes each point&rsquo;s probability of belonging to each
            cluster (its <em>responsibilities</em>). k-means does the hard version: responsibility 1 for the
            nearest centroid, 0 for the rest.
          </li>
          <li>
            <strong>M-step ↔ update.</strong> EM re-estimates each cluster&rsquo;s parameters (mean, covariance,
            weight) to maximise the expected likelihood. k-means re-estimates only the means, with each
            point counted fully in one cluster.
          </li>
        </ul>
        <p>
          Both alternate &ldquo;guess the hidden assignments&rdquo; with &ldquo;refit given those assignments,&rdquo; and
          both are guaranteed to improve their objective each round — which is exactly why k-means
          converges (it&rsquo;s the same monotonic-improvement argument EM enjoys).
        </p>

        <h2>k-means is the hard, spherical limit of a GMM</h2>
        <p>
          Make three restrictions to a Gaussian mixture and EM <em>becomes</em> k-means:
        </p>
        <ul style={ul}>
          <li><strong>Equal, spherical covariances</strong> <M>{String.raw`\Sigma_j = \sigma^2 I`}</M> — every cluster a same-sized ball.</li>
          <li><strong>Equal mixing weights</strong> — every cluster equally likely a priori.</li>
          <li><strong>Variance shrinks to zero</strong> <M>{String.raw`\sigma^2 \to 0`}</M> — the soft responsibilities harden to 0/1.</li>
        </ul>
        <p>
          In that limit the Gaussian responsibility collapses to &ldquo;all-or-nothing for the nearest mean,&rdquo;
          and maximising likelihood reduces to minimising squared distance:
        </p>
        <MathBlock>{String.raw`\lim_{\sigma^2 \to 0} \; \text{GMM-EM} \;=\; \text{k-means}`}</MathBlock>

        <Callout color="var(--c-clustering)" title={<>This explains every failure mode</>}>
          The three restrictions <em>are</em> the assumptions that fail elsewhere in this track. Equal
            spherical covariance → can&rsquo;t handle elongated or unequal-spread clusters. Equal weights →
            struggles with unequal cluster sizes. Hard assignment → no soft membership, awkward on
            overlaps. Relaxing each restriction gives back a GMM that fixes that specific weakness. k-means
            isn&rsquo;t a different algorithm from GMM — it&rsquo;s GMM with the dials turned to their simplest setting.
        </Callout>

        <h2>Why ever use the hard limit?</h2>
        <p>
          If GMM is more general, why is k-means everywhere? Because the simplifications buy speed and
          robustness: no covariance matrices to estimate or invert, far fewer parameters, less data needed,
          and a cheaper per-iteration cost. When clusters really are roughly round and equal, k-means gets
          essentially the same answer as GMM for a fraction of the work — and it&rsquo;s a superb, fast{" "}
          <em>initialiser</em> for GMM itself. Generality you don&rsquo;t need is just cost.
        </p>

        <h2>Hard EM vs. soft EM, side by side</h2>
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/bisecting-k-means", label: <>← Bisecting k-means</> }} next={{ href: "/learn/k-means/np-hardness", label: <>Next up · NP-hardness of optimal clustering →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# k-means IS hard-assignment EM. The only change to make it soft (GMM-style)
# is the E-step: a one-hot argmin becomes a softmax of (negative) distances.

def e_step_hard(X, C):                 # k-means: responsibility is 0/1
    d = ((X[:, None] - C[None])**2).sum(2)
    r = np.zeros_like(d)
    r[np.arange(len(X)), d.argmin(1)] = 1.0
    return r

def e_step_soft(X, C, var):            # GMM (spherical): responsibility in (0,1)
    d = ((X[:, None] - C[None])**2).sum(2)
    w = np.exp(-d / (2 * var))
    return w / w.sum(1, keepdims=True)
# as var -> 0, e_step_soft -> e_step_hard. Same M-step (weighted mean) for both.`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture

km  = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)

# GMM relaxes the restrictions; k-means is a great initialiser for it
gmm = GaussianMixture(n_components=3, covariance_type="full",
                      means_init=km.cluster_centers_, random_state=0).fit(X)
print(gmm.predict_proba(X)[:5])   # SOFT responsibilities — k-means' E-step, un-hardened`;


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };


