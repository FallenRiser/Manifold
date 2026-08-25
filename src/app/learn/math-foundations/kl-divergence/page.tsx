import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Cross-entropy & KL divergence — Manifold",
  description:
    "Cross-entropy measures the cost of using the wrong distribution to encode the right one; KL divergence is the extra cost over the ideal. Minimizing cross-entropy is exactly what training a classifier does.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function KlPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Information theory", color: AMBER }, { label: "Tier 0 · foundations", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Cross-entropy &amp; KL divergence</>}
        intro={<>If entropy is the cost of encoding a distribution with the <em>best</em> code, cross-entropy is the
          cost of using the <em>wrong</em> code, and KL divergence is the penalty for the mismatch. This trio is the
          reason nearly every classifier is trained by &ldquo;cross-entropy loss.&rdquo;</>}
      />

      <div className="lesson">
        <h2>Cross-entropy: coding with the wrong model</h2>
        <p>
          Suppose reality follows distribution <M>p</M> but you built your code assuming <M>q</M>.{" "}
          <strong>Cross-entropy</strong> is the average number of bits you&rsquo;ll actually spend:
        </p>
        <MathBlock>{String.raw`H(p, q) = -\sum_i p_i \log q_i.`}</MathBlock>
        <p>
          If <M>{String.raw`q = p`}</M> this collapses to the ordinary <Link href="/learn/math-foundations/entropy" style={link}>entropy</Link>{" "}
          <M>{String.raw`H(p)`}</M> — the best you can do. If <M>q</M> is wrong, cross-entropy is strictly larger. It
          blows up when your model assigns a near-zero probability to something that actually happens
          (<M>{String.raw`-\log q_i \to \infty`}</M>) — the mathematical reason a confidently-wrong classifier is
          punished so hard.
        </p>

        <h2>KL divergence: the penalty for being wrong</h2>
        <p>
          The <strong>Kullback–Leibler divergence</strong> is exactly the excess — cross-entropy minus the
          irreducible entropy:
        </p>
        <MathBlock>{String.raw`D_{\mathrm{KL}}(p \parallel q) = \sum_i p_i \log\frac{p_i}{q_i} = H(p, q) - H(p).`}</MathBlock>
        <p>
          It measures how far <M>q</M> is from <M>p</M> in bits. Two key properties: it&rsquo;s always{" "}
          <M>{String.raw`\ge 0`}</M>, and it&rsquo;s <M>0</M> only when <M>{String.raw`q = p`}</M> (Gibbs&rsquo;
          inequality). But it is <strong>not symmetric</strong>: <M>{String.raw`D_{\mathrm{KL}}(p \parallel q) \neq D_{\mathrm{KL}}(q \parallel p)`}</M>,
          so it&rsquo;s a &ldquo;divergence,&rdquo; not a true distance — the direction you measure it matters.
        </p>

        <h2>Why classifiers minimize cross-entropy</h2>
        <p>
          In classification, <M>p</M> is the true label (a one-hot distribution — all mass on the correct class) and{" "}
          <M>q</M> is the model&rsquo;s predicted probabilities. Because <M>{String.raw`H(p)=0`}</M> for a one-hot
          label, minimizing cross-entropy <em>is</em> minimizing <M>{String.raw`D_{\mathrm{KL}}(p\parallel q)`}</M> —
          pushing the predicted distribution to match the truth. And for a one-hot label the whole sum reduces to a
          single term:
        </p>
        <MathBlock>{String.raw`\text{cross-entropy loss} = -\log q_{\text{true class}}.`}</MathBlock>
        <p>
          That&rsquo;s the log-loss you met in <Link href="/learn/logistic-regression/log-loss" style={link}>logistic
          regression</Link> — reward the model for putting high probability on the right answer, punish it
          logarithmically for confident mistakes. It also equals <strong>maximum-likelihood estimation</strong>:
          minimizing cross-entropy is maximizing the probability the model assigns to the data.
        </p>

        <Callout color={AMBER} title={<>KL is everywhere once you see it</>}>
          Variational inference and VAEs minimize a KL between an approximate and a true posterior. Diffusion models,
          the <Link href="/learn/logistic-regression/the-generative-twin" style={link}>maximum-entropy view</Link> of
          logistic regression, model distillation, and t-SNE (which minimizes a KL between neighbour distributions)
          all run on it. &ldquo;Make this distribution look like that one&rdquo; is a KL objective, and it&rsquo;s one
          of the most common shapes an ML loss can take.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/math-foundations/entropy", label: <>← Entropy: measuring surprise</> }}
          next={{ href: "/learn/math-foundations/mutual-information", label: <>Next up · Mutual information →</> }}
        />
      </div>
    </article>
  );
}
