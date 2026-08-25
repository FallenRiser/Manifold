import Link from "next/link";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { M } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { PcaProjectionLab } from "@/components/labs/PcaProjectionLab";
import { PCA_DONE, PCA_TOTAL } from "@/lib/pcaTrack";

export const metadata = {
  title: "Principal component analysis — Manifold",
  description:
    "Real data lives in dozens or thousands of dimensions, but the interesting variation usually hides in a handful. PCA finds those few directions — the ones along which the data spreads most — and lets you keep them and throw the rest away. It is the oldest, fastest, and most useful dimensionality-reduction method there is.",
};

const DIM = "var(--c-dimred)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };

export default function PcaHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Dimensionality reduction", color: DIM },
          { label: PCA_DONE >= PCA_TOTAL ? `Complete · ${PCA_TOTAL} pages` : `In progress · ${PCA_DONE} of ${PCA_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Fewer dimensions, same story</>}
        intro={<>
          A dataset with fifty columns feels like it lives in fifty dimensions. It almost never does. The columns
          lean on each other — height and weight, square footage and price, neighbouring pixels — so the real
          variation folds onto a much smaller surface. <strong>Principal component analysis</strong> finds that
          surface: the few directions along which the data actually spreads, ranked from most to least. Keep the
          top few and you can <em>see</em> your data, compress it, denoise it, or feed it to a model that would
          have drowned in the original columns.
        </>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={DIM}
          form={<>A short list of <em>orthonormal directions</em> <M>{String.raw`v_1,\dots,v_k`}</M> (the principal components) and the coordinates of each point along them. Reduce with <M>{String.raw`z = V_k^\top(x-\bar x)`}</M>; rebuild with <M>{String.raw`\hat x = \bar x + V_k z`}</M>.</>}
          loss={<>Total <strong>squared reconstruction error</strong> <M>{String.raw`\sum_i \lVert x_i-\hat x_i\rVert^2`}</M> — which is exactly the <em>variance you throw away</em>. Minimising it is the same as <em>maximising the variance you keep</em>.</>}
          optimiser={<><strong>No iteration — it&rsquo;s closed form.</strong> The best directions are the top eigenvectors of the covariance matrix, found in one shot by an eigen-decomposition (or, better, the <M>{String.raw`\text{SVD}`}</M> of the centred data).</>}
        />

        <h2>The whole idea in one picture</h2>
        <p>
          Here is a cloud of two-dimensional points. Imagine shining a light straight down onto a line and reading
          off where each point&rsquo;s shadow lands. Some lines keep the shadows spread far apart; others squash
          them into a clump. PCA asks a single question: <em>along which line are the shadows most spread out?</em>
        </p>

        <PredictPrompt
          accent={DIM}
          prompt={<>As you rotate the line, the &ldquo;variance captured&rdquo; and the &ldquo;reconstruction error&rdquo; both change. How are they related?</>}
          options={["They rise and fall together", "One goes up as the other goes down", "They're unrelated"]}
        />

        <LabFrame
          accent={DIM}
          tryThis={<>Rotate the line until the violet bar (variance captured) is as long as possible. Watch the gold residual segments — the leftover error — shrink at the same time. Then hit <strong>Snap to PC1</strong>.</>}
          insight={<>The two numbers always sum to the same total. Maximising the variance you capture is <em>identical</em> to minimising the error you leave behind — two descriptions of the one best direction, the first principal component.</>}
        >
          <PcaProjectionLab />
        </LabFrame>

        <p>
          That best line is <strong>PC1</strong>, the first principal component. The perpendicular to it is
          <strong> PC2</strong>. In higher dimensions the list keeps going — PC3, PC4, … — each one the direction
          of most remaining spread that is at right angles to all the ones before it. The magic is that you never
          have to search: they fall out of a single matrix calculation, which is why PCA scales to thousands of
          features and runs in the blink of an eye.
        </p>

        <Callout color={DIM} title={<>The one-sentence definition</>}>
          PCA re-describes your data using a new set of axes — <strong>ordered by how much the data varies along
          each</strong> — and lets you keep only the first few. Because those axes capture the most variation with
          the fewest numbers, dropping the rest loses the least information possible for a linear method.
        </Callout>

        <h2>In plain terms</h2>
        <p>
          Think of a 3-D object photographed from the one angle that reveals the most about it — a chair looks like a
          meaningless blob from some directions and unmistakably a chair from others. PCA finds that most-revealing
          angle automatically, for data of any number of dimensions, and lets you keep just the flattened photo. You
          can watch it do exactly this to a real 3-D cloud — folding it down to a 2-D plane while barely losing
          anything — on the <Link href="/learn/pca/why-reduce" style={link}>next page</Link>.
        </p>

        <h2>What you actually need it for</h2>
        <p>
          PCA is the workhorse of unsupervised learning because that one trick — keep the few directions that carry
          the most variation — solves four everyday problems at once:
        </p>
        <ul style={ul}>
          <li><strong>See it.</strong> Squash 64 pixels (or 500 features) down to 2 so you can actually plot your data and spot clusters.</li>
          <li><strong>Shrink it.</strong> Store each example in 40 numbers instead of 4,000 — lossy compression with a fidelity dial.</li>
          <li><strong>Clean it.</strong> Noise mostly lives in the small components you discard, so reconstructing from the top few <em>denoises</em> for free.</li>
          <li><strong>Speed up models.</strong> Decorrelate and shrink features before a regression or nearest-neighbour search, so the downstream model is faster and less dazed by useless dimensions.</li>
        </ul>
        <p>
          It is also the conceptual root of the whole family:{" "}
          <Link href="/learn/pca/vs-alternatives" style={link}>kernel PCA, manifold learning, and autoencoders</Link>{" "}
          are all answers to the question &ldquo;what if the best surface isn&rsquo;t flat?&rdquo; — and you can only
          ask that once you understand the flat case cold.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ol}>
          <li><strong>Seeing in fewer dimensions</strong> — why reduce at all, and the core idea that PCA maximises variance.</li>
          <li><strong>The machinery</strong> — centering, the covariance matrix, its eigenvectors, projecting onto them, and reconstructing.</li>
          <li><strong>How many components?</strong> — the scree plot, the rules for choosing <M>k</M>, and why you almost always standardize first.</li>
          <li><strong>PCA, the SVD &amp; compression</strong> — the numerically-sound route, the low-rank optimality theorem, and the autoencoder view.</li>
          <li><strong>Theory</strong> — the variance/reconstruction duality, the Rayleigh quotient, and whitening.</li>
          <li><strong>Reading it &amp; its limits</strong> — interpreting loadings, when PCA breaks, and how it compares to LDA, t-SNE and autoencoders.</li>
          <li><strong>In the wild</strong> — compressing handwritten digits, and using PCA to speed up a classifier, both with real numbers.</li>
        </ol>

        <Callout color={DIM} title={<>Prerequisites</>}>
          You&rsquo;ll get more from this track with a little <Link href="/learn/k-means" style={link}>unsupervised-learning</Link> intuition
          and comfort with <Link href="/learn/math-foundations/expectation-and-variance" style={link}>variance</Link> and{" "}
          <Link href="/learn/math-foundations/vectors" style={link}>vectors</Link> — both built from scratch in the{" "}
          <Link href="/learn/math-foundations" style={link}>Math foundations</Link> track. The eigenvector and SVD ideas
          are developed here too, so no linear-algebra course is required, though one won&rsquo;t hurt.
        </Callout>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/pca/why-reduce", label: <>Next up · Why reduce dimensions at all? →</> }}
        />
      </div>
    </article>
  );
}
