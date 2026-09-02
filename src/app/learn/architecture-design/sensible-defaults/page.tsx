import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Sensible starting points — Manifold",
  description:
    "Before any search, start from a strong default: for tabular data, 2–3 layers of width 64–256, ReLU or GELU, He init, Adam at 1e-3. Good defaults are priors that make the search short.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SensibleDefaultsPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "The diagnostic loop", color: CORAL },
          { label: "Tier 2 · practitioner", color: CORAL },
        ]}
        time="about 7 minutes"
        title={<>Sensible starting points</>}
        intro={
          <>
            You never start an architecture search from nothing. Decades of collective experience
            have produced defaults that work on the majority of problems, and starting from them
            turns the search into a few doublings rather than a blind sweep. This page lists the
            defaults worth starting from — and when to start somewhere else.
          </>
        }
      />

      <div className="lesson">
        <h2>The tabular default</h2>
        <p>
          For a supervised problem on tabular data — a fixed set of numeric and categorical features,
          no spatial or sequential structure — the default that works most of the time is small:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                {["choice", "default", "why"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)",
                    fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                { c: "depth", d: "2–3 hidden layers", w: "enough to compose, below the depth tax" },
                { c: "width", d: "64–256 units", w: "past the plateau for most tabular problems" },
                { c: "activation", d: "ReLU or GELU", w: "no saturation, He-compatible" },
                { c: "initialisation", d: "He (Kaiming)", w: "keeps gradient factors near 1 with ReLU" },
                { c: "optimiser", d: "Adam, lr 1e-3", w: "robust default across problems" },
              ] as const).map((r) => (
                <tr key={r.c}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.c}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{r.d}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          These are not arbitrary. This track&rsquo;s running problem is tabular in spirit — two
          numeric features — and a network well inside these defaults already hits the ceiling:{" "}
          <strong>depth 2, width 32 reaches 0.953</strong>, the best test accuracy measured anywhere
          in the track, with just 1,185 parameters. Starting from the default put us at the optimum
          before any search began. The search only has to confirm the plateau, not discover the
          architecture.
        </p>

        <Callout color={CORAL} title={<>Defaults are priors, not guesses</>}>
          A default is a prior: a starting belief about where the answer lives, informed by every
          problem the community has solved before yours. Starting from a strong prior means the
          search is short — you begin near the answer and take a few steps to confirm it, rather than
          exploring the whole space. Starting from a weak prior (width 4, depth 12, sigmoid, SGD)
          means the search is long and most of it is spent climbing out of a hole the defaults would
          have avoided.
        </Callout>

        <h2>When to start elsewhere</h2>
        <p>
          The tabular default is a starting point, not a law. The structure of the input tells you
          when to begin somewhere else, because the right architecture mirrors the structure of the
          data:
        </p>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <strong>Images</strong> have local, translation-invariant structure, so start with
            convolutions and more depth — the feature hierarchy from edges to objects is exactly what
            depth composes (<Link href="/learn/architecture-design/what-depth-buys" style={link}>what
            depth buys</Link>). A 2-layer MLP is the wrong prior for pixels.
          </li>
          <li>
            <strong>Sequences and language</strong> have long-range dependencies, so start with
            attention. The prior is a transformer block, not a fixed-width MLP, because the useful
            structure is relational rather than positional.
          </li>
          <li>
            <strong>Very small datasets</strong> shift the default smaller and toward stronger
            regularisation or classical models — a few hundred rows rarely justify a deep net at all.
          </li>
        </ul>
        <p>
          In every case the logic is the same: pick the default whose built-in assumptions match the
          structure of your data, then run the short search from there. The architecture family is a
          prior about structure; width and depth are the parameters you tune within it.
        </p>

        <Proof color={CORAL} title="why good defaults reduce the search to a few doublings">
          <p>
            Capacity knobs act on a logarithmic scale — what matters is the order of magnitude of
            width and depth, not the exact integer. On this track&rsquo;s width sweep, everything
            from 16 to 512 lands within 0.004 test accuracy of each other; the meaningful transitions
            were between <em>powers</em> (1 &rarr; 3 &rarr; 16), not between adjacent values. So the
            search space that matters is not &ldquo;every width from 1 to 512&rdquo; but a handful of
            doublings: 64, 128, 256.
          </p>
          <p>
            A good default drops you inside that handful. If the default is 128 and the true optimum
            is anywhere on the plateau, you are already there; if it is not, one doubling up or down
            usually reaches it, because the plateau is wide and the cliff below it is a doubling or
            two away, not a hundred units away. A poor default outside the plateau forces you to
            traverse the whole logarithmic range to find it. The defaults are chosen to sit on the
            plateau for typical problems, which is why the search that follows them is short: a
            confirmation, not an exploration.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the recommended default architecture to start from for a tabular
                classification problem?</>,
              options: [
                "As deep as possible with SGD and sigmoid activations",
                "2–3 layers of width 64–256, ReLU or GELU, He initialisation, Adam at learning rate 1e-3",
                "A single wide layer of 4096 units with no hidden depth",
              ],
              answer: 1,
              explain: <>The tabular default is small and robust: 2–3 layers wide enough to sit past
                the plateau, ReLU/GELU with He init to keep gradients healthy, and Adam at 1e-3. On
                this track&rsquo;s two-feature problem, depth 2 width 32 already reached 0.953, the
                best number measured.</>,
            },
            {
              q: <>Why does the page describe defaults as &ldquo;priors that make the search
                short&rdquo;?</>,
              options: [
                "Because defaults are always exactly optimal and need no search",
                "Because capacity knobs act on a log scale, so a default on the plateau puts you at or within a doubling of the optimum — a confirmation rather than a full exploration",
                "Because priors eliminate the need to measure the train-test gap",
              ],
              answer: 1,
              explain: <>Width and depth matter by order of magnitude, so the meaningful search is a
                few doublings, not every integer. A default chosen to sit on the plateau lands you at
                or near the optimum, turning the search into a short confirmation.</>,
            },
            {
              q: <>You are classifying 32×32 images. Why is the tabular default (a 2-layer MLP) the
                wrong starting prior?</>,
              options: [
                "MLPs cannot be trained on image data at all",
                "Images have local, hierarchical, translation-invariant structure that convolutions and depth are built to exploit; a flat MLP encodes no such prior and would need far more capacity",
                "Adam does not work on images",
              ],
              answer: 1,
              explain: <>The right default mirrors the structure of the data. Images have an edges-to-
                objects hierarchy, so the strong prior is convolutions plus depth. A 2-layer MLP
                assumes no spatial structure and throws that prior away, making the search much
                longer.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-order-of-operations", label: <>&larr; The order of operations</> }}
          next={{ href: "/learn/architecture-design/the-playbook", label: <>Next up &middot; The architecture playbook &rarr;</> }}
        />
      </div>
    </article>
  );
}
