import Link from "next/link";
import { SVRTubeLab } from "@/components/labs/SVRTubeLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { SVR_DONE, SVR_TOTAL } from "@/lib/svrTrack";

export const metadata = {
  title: "Support vector regression — Manifold",
  description:
    "Support vector regression fits a tube, not a line. Errors inside the tube are free; only points outside — the support vectors — shape the model. The result is a sparse, robust, kernelised regressor.",
};

export default function SVRHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: SVR_DONE >= SVR_TOTAL ? `Complete · ${SVR_TOTAL} pages` : `In progress · ${SVR_DONE} of ${SVR_TOTAL} pages`, color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Regression with a tube</>}
        intro={<>
          Most regressors chase every last residual. Support vector regression does the opposite: it draws a
        <em> tube</em> of tolerance around the fit and declares every error inside it a non-issue. Only the
        points that break out of the tube get a say — and that one idea buys sparsity and robustness.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          form={<>A kernel expansion on the support vectors: <code>ŷ = Σ (αᵢ − αᵢ*) k(x, xᵢ) + b</code></>}
          loss={<>ε-insensitive: zero inside a tube of width ε, linear outside</>}
          optimiser={<>A quadratic program (the dual) — most coefficients come out exactly zero</>}
        />

        <h2>The idea: forgive small errors</h2>
        <p>
          Kernel ridge (the <Link href="/learn/kernel-ridge-regression" style={inlineLink}>previous track</Link>)
          uses squared error, so every point pulls on the fit and every point is kept. Support vector regression
          swaps that for an <strong>ε-insensitive loss</strong>: predictions within ε of the truth cost
          nothing at all. Picture a tube of half-width ε around the fit — inside it, you&rsquo;re &ldquo;close
          enough.&rdquo;
        </p>

        <SVRTubeLab />

        <p>
          Slide ε above and watch what happens: as the tube widens, points slip inside and stop mattering. The
          only points that shape the model are the ones <em>on or outside</em> the tube — the{" "}
          <strong>support vectors</strong>. Everything else could move freely without changing the fit. That&rsquo;s
          why the trained model is <strong>sparse</strong>: it stores only the support vectors, not the whole
          dataset.
        </p>

        <h2>Why this is worth a whole track</h2>
        <p>
          Three properties fall out of the tube, and together they define SVR&rsquo;s niche:
        </p>
        <ul style={ul}>
          <li><strong>Sparsity</strong> — only support vectors are kept, so the model is compact and fast to evaluate (unlike dense kernel ridge).</li>
          <li><strong>Robustness</strong> — points far outside the tube contribute a <em>bounded</em>, linear penalty, so a few outliers can&rsquo;t dominate the way they do under squared error.</li>
          <li><strong>Kernelisation</strong> — like kernel ridge, SVR is written in inner products, so the kernel trick makes it nonlinear for free.</li>
        </ul>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>The ε-insensitive idea</strong> — the loss, the tube, support vectors, and the soft-margin C that handles points outside.</li>
          <li><strong>The mechanics</strong> — the primal, the dual and its kernel trick, how the QP is actually solved (SMO), kernels, the three hyperparameters, and the ν-SVR variant.</li>
          <li><strong>In practice</strong> — kernel ridge vs SVR head-to-head, scaling to large datasets, when to reach for SVR, and a worked example.</li>
          <li><strong>In the wild</strong> — two real runs that isolate SVR&rsquo;s two strengths: the kernel on a chaotic forecast, and the loss against outliers.</li>
        </ol>

        <Callout color="var(--c-regression)" title={<>Prerequisites</>}>
          This is the companion to <Link href="/learn/kernel-ridge-regression" style={inlineLink}>kernel ridge
            regression</Link> — same kernel machinery, different loss — so read that first if you haven&rsquo;t. It
            also shares its soul with <Link href="/learn/logistic-regression" style={inlineLink}>margin-based
            classification</Link>: SVR is the regression sibling of the support vector machine.
        </Callout>

        <PrevNext prev={{ href: "/learn/kernel-ridge-regression", label: <>← Kernel ridge regression</> }} next={{ href: "/learn/support-vector-regression/the-epsilon-insensitive-loss", label: <>Next up · The ε-insensitive loss →</> }} />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
