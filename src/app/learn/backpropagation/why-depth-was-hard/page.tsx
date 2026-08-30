import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Why depth was hard for twenty years — Manifold",
  description:
    "Backpropagation was published in 1986 and deep networks did not work until around 2012. Nothing about the algorithm changed. Five things around it did, and each one is a term in the same product.",
};

const CORAL = "var(--c-neural)";

const FIXES: { name: string; year: string; what: string; term: string }[] = [
  {
    name: "ReLU",
    year: "2010–11",
    what: "Replaces a slope of at most 0.25 with a slope of exactly 1 on the active side.",
    term: "removes the g′ shrinkage entirely",
  },
  {
    name: "Xavier / He initialisation",
    year: "2010 / 2015",
    what: "Chooses the weight scale from the fan-in so that the product of factors starts near 1 rather than far from it.",
    term: "sets the W factor deliberately",
  },
  {
    name: "Batch normalisation",
    year: "2015",
    what: "Renormalises activations at every layer during training, so the products cannot drift far from 1 as training proceeds.",
    term: "keeps the product near 1 over time",
  },
  {
    name: "Residual connections",
    year: "2015",
    what: "Adds an identity path around each block, so the gradient has a route back that is multiplied by 1.",
    term: "adds a term with no product at all",
  },
  {
    name: "Adam & adaptive methods",
    year: "2014–15",
    what: "Divides each parameter's step by its own running gradient magnitude, so a small gradient does not mean a small step.",
    term: "compensates for whatever product remains",
  },
];

export default function WhyDepthWasHardPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "When gradients misbehave", color: CORAL }, { label: "Tier 2 · context", color: CORAL }]}
        time="about 7 minutes"
        title={<>Why depth was hard for <em>twenty years</em></>}
        intro={<>Backpropagation was published in its modern form in 1986. Deep networks did not reliably work until
          around 2012. That gap is not a story about compute, and the algorithm did not change — everything that
          changed was a term in the product this chapter has been measuring.</>}
      />

      <div className="lesson">
        <h2>The thing that did not change</h2>
        <p>
          The four equations from chapter 2 are the same four equations Rumelhart, Hinton and Williams published in
          1986. Nobody has improved backpropagation, because there is nothing to improve — it computes the exact
          gradient at essentially optimal cost.
        </p>
        <p>
          What did not work was <em>training deep networks with it</em>. Two or three layers were fine. Beyond that,
          practitioners reported the same thing repeatedly: the network trains, the loss falls, and adding layers
          makes it no better and often worse. We now know exactly why, because we measured it two pages ago —{" "}
          <strong>a gradient 29 million times smaller at the front than the back means the early layers are frozen
          at their random initialisation.</strong> The network was not deep in any functional sense; it was a
          shallow network on top of a random projection.
        </p>

        <Callout color={CORAL} title={<>The part worth noticing about the history</>}>
          For most of that period the diagnosis was not that the gradients were vanishing. It was that the loss
          surface was too non-convex, or the models overfitted, or there was not enough data. Those explanations
          were reasonable and wrong, and they were sustained by a general belief that networks were finicky.
          <br /><br />
          The measurement in the previous lab takes one backward pass and about ten lines of code, and it settles
          the question immediately. <strong>The gap was substantially a gap in diagnosis</strong> — which is the
          strongest possible argument for the habit this track keeps pushing: when training misbehaves, look at the
          gradients, not only at the loss.
        </Callout>

        <h2>The five things that fixed it</h2>
        <p>
          None of them changed backpropagation. Each of them changes a factor in{" "}
          <M>{String.raw`\prod_\ell W^{(\ell)}g'(\mathbf{z}^{(\ell)})`}</M>.
        </p>

        <div style={{ display: "grid", gap: 10, margin: "1.2rem 0" }}>
          {FIXES.map((f) => (
            <div key={f.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span className="font-display" style={{ fontSize: 14.5, fontWeight: 500, color: CORAL }}>{f.name}</span>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{f.year}</span>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "5px 0 6px" }}>{f.what}</p>
              <div style={{ fontSize: 12, color: "var(--ink)" }}>
                <span style={{ color: "var(--faint)" }}>in the product: </span>{f.term}
              </div>
            </div>
          ))}
        </div>

        <p>
          Read that list as five attacks on one equation and the modern toolkit stops looking like a pile of tricks.
          Two of them set the factors at initialisation, one keeps them controlled during training, one adds a path
          that avoids the product altogether, and one compensates downstream for whatever is left.
        </p>

        <h2>The residual connection deserves its own sentence</h2>
        <p>
          It is the most direct attack of the five. A residual block computes{" "}
          <M>{String.raw`\mathbf{y} = \mathbf{x} + F(\mathbf{x})`}</M>, so the gradient with respect to{" "}
          <M>{String.raw`\mathbf{x}`}</M> is <M>{String.raw`1 + \partial F/\partial \mathbf{x}`}</M>. The{" "}
          <strong>1</strong> is a path back through the whole network that is multiplied by nothing at all.
        </p>
        <p>
          Even if every <M>{String.raw`\partial F/\partial\mathbf{x}`}</M> shrinks to nothing, the gradient still
          arrives at the first layer intact. This is why networks went from a practical limit of tens of layers to
          hundreds within about a year of residual connections appearing — and why the fix reads as obvious in
          hindsight once you have seen the product written out.
        </p>

        <h2>And, honestly, the other reasons</h2>
        <p>
          It would be a tidy story to say vanishing gradients were the whole explanation. They were not, and it is
          worth naming what else was in the way:
        </p>
        <ul>
          <li><strong>Data.</strong> ImageNet&rsquo;s 1.2 million labelled images arrived in 2009. Deep models need
            data in quantities that did not previously exist in labelled form.</li>
          <li><strong>Compute.</strong> GPUs made the matrix products one to two orders of magnitude cheaper, which
            turned a month-long experiment into an overnight one — and research speed is roughly experiments per
            week.</li>
          <li><strong>Regularisation.</strong> Dropout (2012) and its relatives made large models trainable without
            memorising their training sets.</li>
          <li><strong>Software.</strong> Autodiff frameworks removed the hand-derivation step, so a new architecture
            became an afternoon rather than a paper.</li>
        </ul>
        <p>
          The honest summary is that all four had to arrive together, and the gradient story is the one this track
          can <em>measure</em> — which is why it gets the emphasis here rather than because it was uniquely
          decisive.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What changed about backpropagation between 1986 and 2012?</>,
              options: [
                "It was reformulated to avoid vanishing gradients",
                "Nothing — the algorithm is identical; what changed were the activations, initialisation, normalisation and architecture around it",
                "It was generalised to arbitrary computational graphs",
              ],
              answer: 1,
              explain: <>The four equations are unchanged. Every fix on this page alters a factor in the product
                that backprop multiplies out; none alters the algorithm. Autodiff generalised the{" "}
                <em>implementation</em>, not the mathematics.</>,
            },
            {
              q: <>Why is a residual connection such a direct answer to vanishing gradients?</>,
              options: [
                "It reduces the number of layers the gradient passes through",
                "The identity path contributes a term of exactly 1, so the gradient has a route back that is never multiplied down",
                "It normalises the activations",
              ],
              answer: 1,
              explain: <><M>{String.raw`\partial(\mathbf{x} + F(\mathbf{x}))/\partial\mathbf{x} = 1 + \partial F/\partial\mathbf{x}`}</M>.
                Even if every <M>{String.raw`F`}</M> term vanishes, the 1 survives all the way to the first layer.
                The gradient still traverses every layer — it simply has an unattenuated route.</>,
            },
            {
              q: <>What does the twenty-year gap most argue for, as a working habit?</>,
              options: [
                "Waiting for hardware to improve before attempting hard problems",
                "Measuring gradients directly rather than inferring what is wrong from the loss curve",
                "Preferring shallow models until proven otherwise",
              ],
              answer: 1,
              explain: <>The field spent two decades attributing the failure to non-convexity, overfitting and data
                scarcity, when ten lines printing per-layer gradient norms would have identified it. That is the
                habit worth taking: the loss curve is a summary, and the gradient is the evidence.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/exploding-gradients", label: <>← Exploding gradients &amp; clipping</> }}
          next={{ href: "/learn/backpropagation/the-backprop-playbook", label: <>Next up · The backprop playbook →</> }}
        />
      </div>
    </article>
  );
}
