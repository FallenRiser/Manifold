import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { MarginLab } from "@/components/labs/MarginLab";
import { SVM_DONE, SVM_TOTAL } from "@/lib/svmTrack";

const PINK = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const ul: React.CSSProperties = { paddingLeft: "1.15rem", lineHeight: 1.75 };

export const metadata = {
  title: "Support vector machines — Manifold",
  description:
    "When many boundaries separate the data equally well, the SVM picks the one with the most room on either side. Drag the points and watch the widest corridor move — plus the measurement showing how much that choice is actually worth.",
};

export default function SVMHubPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Classification", color: PINK },
          {
            label: SVM_DONE >= SVM_TOTAL
              ? `Complete · ${SVM_TOTAL} pages`
              : `In progress · ${SVM_DONE} of ${SVM_TOTAL} pages`,
            color: "var(--c-fundamentals)",
          },
        ]}
        time="about 9 minutes"
        title={<>A boundary with room to spare</>}
        intro={<>When two classes can be separated by a straight line, they can usually be separated
          by infinitely many. Every one of them gets the training data perfectly right, so training
          accuracy cannot choose between them. The support vector machine picks the line with the most
          empty space on either side — and that single tie-breaking rule is the whole idea.</>}
        titleSize={44}
        introSize={17.5}
      />

      <div className="lesson">
        <ModelAnatomy
          accent={PINK}
          form={<>A signed distance to a hyperplane: <code>ŷ = sign(w · x + b)</code></>}
          loss={<>Hinge: zero once a point is correct by a margin, linear before that</>}
          optimiser={<>A quadratic program — most training points end up mattering not at all</>}
        />

        <h2>The problem accuracy cannot solve</h2>
        <p>
          Put two well-separated clouds of points on a page and draw a line between them. Now nudge
          that line a little, or tilt it. Still separated. Tilt it further — still separated. There is
          a whole family of lines that make zero training mistakes, and every metric you have learned
          so far scores them <em>identically</em>. A{" "}
          <Link href="/learn/perceptron-to-mlp/the-perceptron" style={link}>perceptron</Link> will hand you whichever one
          it happened to stop at, which depends on the order it saw the data in.
        </p>
        <p>
          So you need a tie-breaker that is not about the training data at all. The SVM&rsquo;s is
          geometric: <strong>prefer the boundary that stays furthest away from every point.</strong>{" "}
          Picture widening a corridor outward from the line until it bumps into data on both sides. The
          line whose corridor is widest is the one the SVM returns, and the points it bumps into are
          the <strong>support vectors</strong>.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>You are about to drag a single point — one of fourteen — far away from the
            boundary, on its own side. What happens to the line?</>}
          options={[
            "It shifts a little, because every point influences the fit",
            "It does not move at all",
            "It tilts toward the point that moved",
          ]}
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag any point. Watch which points get <strong>rings</strong> — those are the
            ones the boundary is resting on. Then drag a <em>ringed</em> point and compare.</>}
          insight={<>Points without rings can be moved anywhere on their own side and the line does
            not budge. The boundary is held up by two or three points on the margin and is
            completely blind to the rest. Pull C down and the corridor widens until it swallows
            nearly every point; push C up and it narrows onto the closest few.</>}
        >
          <MarginLab />
        </LabFrame>

        <p>
          That lab is not drawing a line by eye. Every frame it re-solves the same optimisation
          problem a library would, and lands on the same boundary scikit-learn returns — so the
          corridor you are widening is genuinely the widest one available, not an approximation
          of it.
        </p>

        <Callout color={PINK} title={<>Why &ldquo;support vector&rdquo; is a literal description</>}>
          <p>
            A trained SVM stores <em>only</em> the support vectors. Delete every other training point
            and refit, and you get the same boundary back — not approximately, but to five decimal
            places. There is a measurement of exactly that later in this track. It is the sharpest
            difference between an SVM and something like{" "}
            <Link href="/learn/logistic-regression" style={link}>logistic regression</Link>, where
            every point keeps a small pull on the fit forever.
          </p>
        </Callout>

        <h2>But is the widest corridor actually better?</h2>
        <p>
          That is a question about data, not a theorem, so it takes an experiment. Two hundred
          separable draws; on each one, a maximum-margin boundary and a perceptron boundary,{" "}
          <em>both</em> of which separate the training data perfectly. The only difference is where
          they put the line.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outMargin}</CodeOutput>

        <p>
          The margin argument <strong>holds</strong> — 30 wins against 3 losses is not a coin flip.
          But it ties on 152 of 185 draws, and the average gain is{" "}
          <strong>half a percentage point</strong>. On easy, well-separated data most separators agree,
          so the tie-breaker rarely gets to matter.
        </p>
        <p>
          Which is the real reason to keep reading. The margin is not worth a track because it adds
          0.56% on easy problems. It is worth a track because of what it <em>enables</em>: a loss that
          switches off completely once a point is safe, which makes the solution sparse; a formulation
          written entirely in inner products, which lets a kernel replace the straight line with almost
          any boundary you like; and a single knob that trades margin width against training mistakes
          when the classes overlap — which they always do.
        </p>

        <h2>The arc of this track</h2>
        <ol style={ul}>
          <li><strong>The margin idea</strong> — functional versus geometric margin, why maximising it
            becomes a minimisation of <code>‖w‖</code>, and the experiment above in full.</li>
          <li><strong>When the data overlaps</strong> — slack variables, the C knob, and the hinge
            loss that makes sparsity happen.</li>
          <li><strong>The mechanics</strong> — the primal, Lagrangian duality and the KKT conditions,
            the dual, the kernel trick, and how the problem is actually solved.</li>
          <li><strong>In practice</strong> — why an SVM cannot skip feature scaling, choosing C and
            γ, multi-class strategies, probabilities, and a head-to-head against logistic regression
            and a forest.</li>
        </ol>

        <Callout color={PINK} title={<>You have already met half the machinery</>}>
          <p>
            This site built the derived form first. The{" "}
            <Link href="/learn/support-vector-regression" style={link}>support vector regression</Link>{" "}
            track already covers the primal, the dual, the kernel trick and SMO — aimed at fitting a
            tube rather than separating two classes. If you have read it, the mechanics chapter here
            will feel familiar and you can move quickly; if you have not, this track does not assume
            it.
          </p>
        </Callout>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Two lines both separate the training data with zero errors. What does the SVM use
                to choose between them?</>,
              options: [
                "The one with higher training accuracy",
                "The one whose nearest point is furthest away",
                "The one that passes closest to the class means",
                "The one found first during optimisation",
              ],
              answer: 1,
              explain: <>Training accuracy is tied at 100% by construction, so it cannot choose. The
                SVM maximises the distance from the boundary to the nearest point on either side —
                the geometric margin.</>,
            },
            {
              q: <>In the lab, you drag an un-ringed point further from the boundary. The line…</>,
              options: [
                "moves slightly away from it",
                "does not move at all",
                "tilts toward it",
              ],
              answer: 1,
              explain: <>Only support vectors — the ringed points, on or inside the margin — enter the
                solution. A point already correct by more than the margin contributes exactly zero, so
                moving it further away changes nothing.</>,
            },
            {
              q: <>The experiment above found the max-margin boundary beat the perceptron on 30 of 185
                draws and lost on 3. What is the fair summary?</>,
              options: [
                "The margin makes a large, reliable difference on separable data",
                "The margin makes no difference and the idea is not useful",
                "The margin helps consistently but by a small amount, and ties most of the time",
                "The result is a coin flip",
              ],
              answer: 2,
              explain: <>30-to-3 is a clear direction, so it is not chance — but 152 ties and a
                +0.0056 mean gain say the effect is small on easy data. The margin earns its keep
                through sparsity and kernels, not through that half-point.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{ label: "Naive Bayes", href: "/learn/naive-bayes" }}
        next={{
          label: "Functional & geometric margin",
          href: "/learn/support-vector-machines/functional-and-geometric-margin",
        }}
      />
    </article>
  );
}

const outMargin = `Both models separate the TRAINING data perfectly. The only difference is WHERE they
put the boundary. If the margin argument is real, the wider one wins on held-out data.

  185 of 200 draws were separated perfectly by both models.

                         max-margin     perceptron
  mean train margin      7.227          3.622
  mean test accuracy     0.9968         0.9912

  max-margin better on 30 draws, worse on 3, tied on 152
  mean accuracy gain: +0.0056

  The margin is 2.0x wider on average. The accuracy gain is real but SMALL --
  most draws tie, because on easy separable data most separators agree.`;
