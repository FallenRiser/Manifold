import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { MF_DONE, MF_TOTAL } from "@/lib/mathFoundationsTrack";

export const metadata = {
  title: "Math foundations — Manifold",
  description:
    "The Tier-0 track underneath everything else: linear algebra, calculus and optimization, probability, concentration inequalities, and information theory — each built from scratch, with a visual and an interactive for every idea. Read it front to back, or dip in when a track sends you here.",
};

const AMBER = "var(--c-fundamentals)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const STRANDS: { name: string; href: string; blurb: string; topics: string }[] = [
  { name: "Linear algebra", href: "/learn/math-foundations/vectors", blurb: "The language of data: vectors, matrices as transformations, eigenvectors and the SVD.", topics: "vectors · norms · dot product · matrices · rank · eigen · SVD · SPD" },
  { name: "Calculus & optimization", href: "/learn/math-foundations/derivatives", blurb: "How models learn: derivatives, gradients, convexity, and the descent that trains everything.", topics: "derivatives · gradients · chain rule · convexity · gradient descent · Lagrange · duality · subgradients" },
  { name: "Probability", href: "/learn/math-foundations/random-variables", blurb: "Reasoning under uncertainty: distributions, expectation, Bayes, the Gaussian, and the CLT.", topics: "random variables · distributions · E & Var · Bayes · covariance · Gaussian · MGFs · LLN & CLT" },
  { name: "Concentration inequalities", href: "/learn/math-foundations/markov-chebyshev", blurb: "Why averages are trustworthy — the bounds behind generalization and learning theory.", topics: "Markov · Chebyshev · Hoeffding · Chernoff · Azuma · McDiarmid" },
  { name: "Information theory", href: "/learn/math-foundations/entropy", blurb: "Measuring information: entropy, KL divergence, and the losses they define.", topics: "entropy · cross-entropy · KL · mutual information · Bregman" },
];

export default function MathFoundationsHub() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Math foundations", color: AMBER },
          { label: MF_DONE >= MF_TOTAL ? `Complete · ${MF_TOTAL} pages` : `${MF_DONE} of ${MF_TOTAL} pages`, color: "var(--c-fundamentals)" },
        ]}
        time="a reference track"
        title={<>The math under the machine</>}
        intro={<>Every algorithm on this site rests on a small set of mathematical ideas — a vector here, a gradient
          there, a covariance, a probability. This track builds all of them from the ground up, in the same
          intuition-first, drag-to-see style as the rest of Manifold. It&rsquo;s <strong>Tier 0</strong>: the floor
          you can always drop down to when a lesson leans on something you&rsquo;d like to see built from scratch.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <Callout color={AMBER} title={<>How to use this track</>}>
          You don&rsquo;t have to read it front to back. Every other track links <em>into</em> these pages exactly
          where a prerequisite first comes up — hit one of those links, get the idea, and jump back. If you&rsquo;re
          starting from scratch, though, reading a whole strand in order is the most solid way to build real fluency.
          Nothing here assumes a university course; it assumes curiosity.
        </Callout>

        <h2>The five strands</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, margin: "1.2rem 0" }}>
          {STRANDS.map((s) => (
            <Link key={s.name} href={s.href} className="gcard" style={{ ["--accent" as string]: AMBER, display: "block", textDecoration: "none", padding: "14px 16px" }}>
              <div className="font-display" style={{ fontSize: 16, fontWeight: 500, color: AMBER, marginBottom: 4 }}>{s.name}</div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "0 0 8px" }}>{s.blurb}</p>
              <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>{s.topics}</div>
            </Link>
          ))}
        </div>

        <h2>What makes this different from a textbook</h2>
        <p>
          Three things, the same three that define the rest of Manifold. <strong>Intuition leads</strong> — you meet
          every idea as a picture or a situation before a single symbol. <strong>Everything is interactive</strong> —
          drag vectors, morph a matrix, slide a distribution&rsquo;s parameters, watch the central limit theorem
          assemble a bell curve out of chaos. And <strong>every idea earns its keep</strong> by pointing forward:
          each page ends by naming the model or method it unlocks, so the math never feels like homework for its own
          sake.
        </p>

        <p>
          A good place to start is <Link href="/learn/math-foundations/vectors" style={link}>vectors</Link> — the
          single object all of machine learning is written in. From there the linear-algebra strand runs all the way
          to the <Link href="/learn/math-foundations/svd" style={link}>SVD</Link>, the decomposition behind{" "}
          <Link href="/learn/pca" style={link}>PCA</Link> and half of numerical ML.
        </p>

        <PrevNext
          prev={{ href: "/map", label: <>← The map</> }}
          next={{ href: "/learn/math-foundations/vectors", label: <>Start · Vectors &amp; vector spaces →</> }}
        />
      </div>
    </article>
  );
}
