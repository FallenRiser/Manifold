import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Universal approximation — Manifold",
  description:
    "One hidden layer can approximate any continuous function to any accuracy. Four words in that sentence are doing enormous work, and the theorem is far weaker — and more interesting — than its reputation.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

// Building a bump out of two sigmoids: the constructive core of the proof,
// drawn rather than described. Literal coordinates; no hydration surface.
function BumpFigure() {
  const W = 540, H = 170, PAD = { l: 34, r: 12, t: 14, b: 26 };
  const X0 = PAD.l, X1 = W - PAD.r, Y0 = H - PAD.b, Y1 = PAD.t;
  const XLO = -6, XHI = 6;
  const px = (x: number) => X0 + ((x - XLO) / (XHI - XLO)) * (X1 - X0);
  const py = (y: number) => Y0 - ((y + 0.15) / 1.35) * (Y0 - Y1);
  const sig = (z: number) => 1 / (1 + Math.exp(-z));

  const curve = (f: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = XLO + (i / 160) * (XHI - XLO);
      pts.push(`${px(x).toFixed(2)},${py(f(x)).toFixed(2)}`);
    }
    return pts.join(" ");
  };

  const K = 6;
  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        role="img" aria-label="Two steep sigmoids, one rising and one falling, subtracting to leave a rectangular bump">
        <rect x={X0} y={Y1} width={X1 - X0} height={Y0 - Y1} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={X0} y1={py(0)} x2={X1} y2={py(0)} stroke="var(--border)" strokeWidth={1} />
        <polyline points={curve((x) => sig(K * (x + 1.5)))} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
        <polyline points={curve((x) => sig(K * (x - 1.5)))} fill="none" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="4 3" />
        <polyline points={curve((x) => sig(K * (x + 1.5)) - sig(K * (x - 1.5)))} fill="none" stroke={CORAL} strokeWidth={2.4} />
        <text x={px(-4.2)} y={py(0.86)} fontSize={10} fill="var(--muted)">σ(k(x+1.5))</text>
        <text x={px(2.2)} y={py(0.86)} fontSize={10} fill="var(--muted)">σ(k(x−1.5))</text>
        <text x={px(0)} y={py(1.06)} fontSize={10.5} fill={CORAL} textAnchor="middle">their difference</text>
        <text x={(X0 + X1) / 2} y={Y0 + 19} fontSize={10} fill="var(--muted)" textAnchor="middle">x</text>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        Two hidden units, subtracted, make a bump. Enough bumps at enough places approximate anything — which is
        both the proof and the reason it promises so little.
      </figcaption>
    </figure>
  );
}

export default function UniversalApproximationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "What networks are and are not", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 9 minutes"
        title={<>Universal approximation</>}
        intro={<>The most quoted theorem in the field, and the most misread. It says something real and surprisingly
          modest, and almost everything people take away from it is an addition they made themselves.</>}
      />

      <div className="lesson">
        <h2>The statement</h2>
        <p>
          <strong>A network with one hidden layer and a non-polynomial activation can approximate any continuous
          function on a closed bounded region, to any accuracy you specify, given enough hidden units.</strong>
        </p>
        <p>
          Formally: for any continuous <M>{String.raw`f`}</M> on a compact{" "}
          <M>{String.raw`K \subset \mathbb{R}^d`}</M> and any <M>{String.raw`\varepsilon > 0`}</M>, there exist a
          width <M>{String.raw`m`}</M> and parameters such that
        </p>

        <MathBlock>{String.raw`\sup_{\mathbf{x} \in K} \left| f(\mathbf{x}) - \sum_{j=1}^{m} v_j\, g(\mathbf{w}_j \cdot \mathbf{x} + b_j) \right| < \varepsilon`}</MathBlock>

        <p>
          That is a genuinely strong statement about <em>expressiveness</em>, and it settles the question chapter 2
          opened. XOR was not a hint that networks have some deeper limitation; one hidden layer is already enough
          to express anything you can draw.
        </p>

        <h2>Why it is true, in one picture</h2>
        <p>
          The classical proof is constructive, and the construction is easy to see. A sigmoid with a large weight is
          nearly a step. Subtract two steps offset from each other and you get a bump of any width and height, at
          any position — using two hidden units.
        </p>

        <BumpFigure />

        <p>
          Now tile the input space with bumps and scale each one to the height of <M>{String.raw`f`}</M> there. That
          is a staircase approximation, and making it finer makes it better without limit. In{" "}
          <M>{String.raw`d`}</M> dimensions the same construction works with bumps built from{" "}
          <M>{String.raw`2d`}</M> units apiece.
        </p>

        <Callout color={CORAL} title={<>And there is the catch, in the same sentence</>}>
          Read the construction again as an engineer rather than a mathematician. Tiling{" "}
          <M>{String.raw`d`}</M>-dimensional space with bumps of width{" "}
          <M>{String.raw`\delta`}</M> takes on the order of <M>{String.raw`(1/\delta)^d`}</M> of them. In ten
          dimensions with a modest resolution of <M>{String.raw`\delta = 0.1`}</M> that is{" "}
          <M>{String.raw`10^{10}`}</M> hidden units. The theorem says the width exists. It says <em>nothing</em>{" "}
          about the width being reasonable, and the constructive proof suggests it very often is not.
        </Callout>

        <h2>The four things it does not say</h2>
        <p>
          Almost all the confusion around this theorem comes from reading a promise into it that is not there.
        </p>
        <ul>
          <li><strong>It does not say the width is practical.</strong> &ldquo;There exists an{" "}
            <M>{String.raw`m`}</M>&rdquo; carries no bound. It may exceed the number of atoms available to build the
            machine.</li>
          <li><strong>It does not say you can find the weights.</strong> The theorem is about existence, not
            reachability. Gradient descent on a non-convex loss has no obligation to find the network the theorem
            promises — and the XOR result, 25 successes from 50 seeds at the minimum size, is that gap measured on
            the smallest possible problem.</li>
          <li><strong>It does not say you have the data.</strong> Approximating <M>{String.raw`f`}</M> presumes you
            know <M>{String.raw`f`}</M>. In practice you have <M>{String.raw`n`}</M> noisy samples of it, and a
            network wide enough to approximate anything is also wide enough to interpolate your noise
            perfectly.</li>
          <li><strong>It does not say one layer is a good idea.</strong> This is the one people find most
            surprising, because the theorem is stated for a single hidden layer and is often read as saying depth is
            unnecessary. It says depth is not <em>necessary for expressiveness</em>. There are functions requiring
            exponentially many units in one layer that a deep network represents with a polynomial number — so depth
            is about <em>efficiency</em>, and the theorem is silent on efficiency entirely.</li>
        </ul>

        <Proof color={CORAL} title="why 'non-polynomial' is the exact condition">
          <p>
            The activation must be non-polynomial — not merely non-linear. The reason is a closure argument. If{" "}
            <M>{String.raw`g`}</M> is a polynomial of degree <M>{String.raw`k`}</M>, then every{" "}
            <M>{String.raw`g(\mathbf{w}\cdot\mathbf{x} + b)`}</M> is a polynomial of degree at most{" "}
            <M>{String.raw`k`}</M> in <M>{String.raw`\mathbf{x}`}</M>, and sums of such things are still polynomials
            of degree at most <M>{String.raw`k`}</M>.
          </p>
          <p>
            So the entire network, at any width, lives inside the finite-dimensional space of degree-{" "}
            <M>{String.raw`k`}</M> polynomials. That space is not dense in the continuous functions — it cannot
            approximate <M>{String.raw`\sin(x)`}</M> uniformly on the whole real line, for instance — so no width
            rescues it. This is the same collapse argument as the identity-activation case from chapter 2, one rung
            up: there, the closed set was the affine maps; here it is the degree-<M>{String.raw`k`}</M>{" "}
            polynomials.
          </p>
          <p>
            Leshno, Lin, Pinkus and Schocken (1993) proved the converse too: for a continuous activation,{" "}
            <strong>non-polynomial is exactly equivalent to universal</strong>. Not sufficient — equivalent. Which
            is why the practical bar is so low that ReLU, a single kink, clears it comfortably.
          </p>
        </Proof>

        <h2>What to take from it</h2>
        <p>
          The useful reading is a negative one. Universal approximation tells you that when your network
          underperforms, <strong>expressiveness is not the explanation</strong> — the model class was never the
          constraint. That leaves optimisation, data, and generalisation, which is a much more useful list to be
          holding, and it is exactly the list the{" "}
          <Link href="/learn/data-workflow/what-to-do-next" style={link}>what to do next</Link> page in the data
          workflow pillar works through.
        </p>
        <p>
          It also explains why nobody tunes for expressiveness in practice. Once you are past a handful of hidden
          units the question is never &ldquo;can this represent the answer&rdquo; but &ldquo;will this find it, and
          will it survive contact with data it has not seen&rdquo;.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Your one-hidden-layer network underperforms. Does universal approximation say a wider one will
                fix it?</>,
              options: [
                "Yes — that is exactly what the theorem guarantees",
                "No — it guarantees a good approximation exists, not that training will find it or that it will generalise",
                "Only if the activation is a sigmoid rather than ReLU",
              ],
              answer: 1,
              explain: <>The theorem is about existence. It says nothing about optimisation reaching that network,
                nothing about the width being achievable, and nothing about performance on unseen data. It holds for
                any non-polynomial activation, so the choice between sigmoid and ReLU is irrelevant to it.</>,
            },
            {
              q: <>If one hidden layer can approximate any continuous function, why build deep networks?</>,
              options: [
                "Deep networks can express functions shallow ones cannot",
                "Efficiency — some functions need exponentially many units in one layer but only polynomially many when composed",
                "Deep networks are easier to optimise",
              ],
              answer: 1,
              explain: <>Both are universal, so expressiveness is not the difference. Depth buys parameter
                efficiency through composition. It was historically <em>harder</em> to optimise, which is precisely
                why initialisation schemes, normalisation and residual connections had to be invented.</>,
            },
            {
              q: <>Why must the activation be non-polynomial rather than merely non-linear?</>,
              options: [
                "Polynomials are too smooth to fit sharp boundaries",
                "Sums of polynomials of degree k are still polynomials of degree k, so the network stays inside a set that is not dense",
                "Polynomials are computationally expensive",
              ],
              answer: 1,
              explain: <>It is a closure argument, exactly parallel to the affine collapse in chapter 2. Any width
                of polynomial units still lives in a finite-dimensional space that cannot approximate arbitrary
                continuous functions. For continuous activations, non-polynomial is not just sufficient for
                universality — it is equivalent to it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/what-can-go-wrong", label: <>← What can go wrong</> }}
          next={{ href: "/learn/perceptron-to-mlp/where-an-mlp-wins", label: <>Next up · Where an MLP wins →</> }}
        />
      </div>
    </article>
  );
}
