import Link from "next/link";
import { KernelRidgeLab } from "@/components/labs/KernelRidgeLab";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { KRR_DONE, KRR_TOTAL } from "@/lib/kernelRidgeTrack";

export const metadata = {
  title: "Kernel ridge regression — Manifold",
  description:
    "Ridge regression draws straight lines. Kernel ridge keeps ridge's clean closed-form solution but swaps raw features for a similarity kernel — so the same math fits arbitrarily curved functions without ever writing down the features.",
};

export default function KRRHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: KRR_DONE >= KRR_TOTAL ? `Complete · ${KRR_TOTAL} pages` : `In progress · ${KRR_DONE} of ${KRR_TOTAL} pages`, color: "var(--c-fundamentals)" }]}
        time="about 6 minutes"
        title={<>Bending ridge regression</>}
        intro={<>
          Ridge regression is fast, stable, and closed-form — but it can only draw straight lines (or whatever
        features you hand-build). Kernel ridge keeps every good property of ridge and gains the ability to fit
        <em> any</em> smooth curve, through one elegant move: replace dot products with a <strong>kernel</strong>.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          form={<>A weighted sum of kernels on the data: <code>ŷ = Σ αᵢ k(x, xᵢ)</code></>}
          loss={<>Ridge loss in feature space — squared error + an L2 penalty on the function</>}
          optimiser={<>Closed form: <code>α = (K + λI)⁻¹ y</code> — one linear solve, no iteration</>}
        />

        <h2>The problem: ridge can&rsquo;t bend</h2>
        <p>
          Ridge regression fits <code>ŷ = w·x</code> — a plane. To fit a curve you can add polynomial or basis
          features by hand (the <Link href="/learn/polynomial-regression" style={inlineLink}>previous track</Link>),
          but that gets awkward fast: high-degree polynomials explode, and rich feature maps can be
          <em> enormous</em> or even infinite-dimensional. Kernel ridge sidesteps all of it.
        </p>

        <KernelRidgeLab />

        <p>
          Above is real kernel ridge regression on noisy data. It fits a smooth nonlinear curve — yet under the
          hood it&rsquo;s <em>still ridge regression</em>, just measured through a similarity kernel instead of raw
          coordinates. Slide <strong>λ</strong> and <strong>γ</strong> and you&rsquo;re steering the same
          bias–variance trade-off you already know, now in a curved world.
        </p>

        <h2>The one idea: features you never write down</h2>
        <p>
          The kernel trick lets a linear method work in a high-dimensional feature space{" "}
          <em>without ever computing the features</em> — you only ever need <strong>similarities</strong>
          between pairs of points, <code>k(x, z)</code>. Ridge regression happens to depend on the data only
          through those inner products, so swapping them for a kernel upgrades it to a nonlinear method for free,
          keeping the closed-form solve intact.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>From ridge to kernels</strong> — the kernel trick, the dual form of ridge that makes it possible, and what a kernel really measures.</li>
          <li><strong>Kernel ridge in depth</strong> — the <code>(K + λI)⁻¹y</code> solution, choosing the kernel and its width γ, tuning λ and γ together, and the cost you pay.</li>
          <li><strong>Theory &amp; connections</strong> — the representer theorem that guarantees the form, the Gaussian-process view, and how KRR sits beside SVR and plain linear models.</li>
          <li><strong>Apply it</strong> — a worked example on real, nonlinear data.</li>
        </ol>

        <Callout color="var(--c-regression)" title={<>Prerequisites</>}>
          This builds on <Link href="/learn/regularized-regression" style={inlineLink}>ridge regression</Link>{" "}
            (the L2 penalty and its closed form) and pairs with{" "}
            <Link href="/learn/polynomial-regression" style={inlineLink}>basis-function regression</Link> —
            kernels are the limit of the &ldquo;add more features&rdquo; idea taken as far as it can go. Its
            companion track is <Link href="/learn/support-vector-regression" style={inlineLink}>support vector
            regression</Link>, which kernelises a different loss.
        </Callout>

        <PrevNext prev={{ href: "/learn/polynomial-regression", label: <>← Polynomial &amp; basis functions</> }} next={{ href: "/learn/kernel-ridge-regression/the-kernel-trick", label: <>Next up · The kernel trick →</> }} />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
