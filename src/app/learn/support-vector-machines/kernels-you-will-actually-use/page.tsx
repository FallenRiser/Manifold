import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { KernelChoiceLab } from "@/components/labs/KernelChoiceLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Kernels you'll actually use — Manifold",
  description:
    "Three kernels cover almost everything, and choosing between them is choosing what 'similar' means. Gamma is a distance you can compare against your own data, the polynomial kernel has two specific traps rather than a general mood, and the rbf default fails by becoming a lookup table rather than by losing accuracy.",
};

const outMenu = `Page 12 said a kernel is a claim about what 'similar' means. If that is more than a
phrase, then a kernel should win where its claim is true and lose where it is not.
Three worlds, each with a different kind of boundary, 5-fold CV on 600 points:

  world          linear   poly d=2   poly d=3        rbf
  straight       0.8083     0.8100     0.8017     0.8100
  rings          0.5367     0.9950     0.9967     0.9983
  moons          0.8817     0.8683     0.9483     0.9483

Half of that is what you would expect. A line is at chance on the rings (0.5367),
and a degree-3 boundary carries the moons where a line cannot. The other half is not.

  world            linear          rbf   rbf - linear
  straight         0.8083       0.8100        +0.0017
  rings            0.5367       0.9983        +0.4617
  moons            0.8817       0.9483        +0.0667

Look at the sizes rather than the signs. Guessing 'curved' when the truth is straight
costs +0.0017 -- nothing. Guessing 'straight' when the truth is a ring costs 0.4617.
The two mistakes are not the same size, and that asymmetry is most of why the rbf
kernel is the default everywhere. It is not that it is always right. It is that being
wrong in its direction is cheap on data like this.

Which is a claim about data like this. The rest of this page is the bill.`;

const outReach = `exp(-gamma |x - z|^2) does not care about gamma in the abstract, only about gamma
times a squared distance. So gamma sets a LENGTH: the range over which two points
still count as similar. Solve exp(-gamma r^2) = 1/2 and that length is sqrt(ln2/gamma),
which is the honest unit to compare against the spread of your own data.

     gamma  half-life  neighbours     mean k     #sv    train     test
             distance  with k>0.5   off-diag
      0.01     8.3255      199.00     0.9627     122   0.8450   0.8850
       0.1     2.6328      163.90     0.7149      88   0.8550   0.9200
       0.5     1.1774       57.72     0.3290      66   0.9300   0.9300
         2     0.5887       18.23     0.1150      63   0.9600   0.9500
        10     0.2633        4.22     0.0279     121   0.9550   0.9450
       100     0.0833        0.37     0.0030     192   0.9850   0.8450
      1000     0.0263        0.05     0.0003     200   1.0000   0.6200

  mean distance between two training points          1.7597
  mean distance to the NEAREST other point           0.1257
  half-life at gamma='scale'                         1.1774

Read the half-life column against those two numbers and the whole dial explains
itself. At gamma=0.01 the half-life is 8.33, 4.7 times the mean distance across the
whole cloud: every point is similar to every point, the mean off-diagonal similarity
is 0.96, and the model underfits. At gamma=1000 the half-life is 0.026 against a
nearest-neighbour distance of 0.1257 -- 0.21 of the way to the closest other point, so
the average point has 0.05 neighbours, all 200 of them become support vectors,
training accuracy is 1.0000 and the test set falls to 0.6200. gamma='scale' sets the
half-life at 1.18, comfortably between the two.

That last column is worth sitting with. Nothing failed. The solver converged, the
margin was maximised, every KKT condition held, and the model memorised the training
set, because at that length scale the only point similar to a point is itself.`;

const outCoef0 = `The polynomial kernel has a reputation for being fiddly. It is deserved, and it is
two specific things rather than a general mood.

FIRST: the constant is not decoration. sklearn's default is coef0=0.0, which makes
the kernel (gamma x.z)^p with nothing added. Same data, same degree, same everything
else -- only the constant differs:

    degree      coef0=1      coef0=0        #sv
         2       0.9200       0.4850         74
         3       0.9250       0.8950         43
         4       0.9250       0.5150         40
         5       0.9250       0.8950         38
         8       0.9050       0.5100         34

The even degrees collapse to a coin flip and the odd ones do not. That is not noise,
it is a symmetry, and it is exact:

  p=2  max|k(x,z) - k(-x,z)|  0.000e+00    max|f(x) - f(-x)|  0.000e+00    x and -x labelled the same at 100.0% of points
  p=3  max|k(x,z) - k(-x,z)|  7.171e+02    max|f(x) - f(-x)|  3.399e+01    x and -x labelled the same at   1.2% of points
  p=4  max|k(x,z) - k(-x,z)|  0.000e+00    max|f(x) - f(-x)|  0.000e+00    x and -x labelled the same at 100.0% of points
  p=5  max|k(x,z) - k(-x,z)|  3.619e+04    max|f(x) - f(-x)|  1.423e+02    x and -x labelled the same at  18.5% of points

With no constant the kernel is homogeneous, so (x.z)^p = (-x.z)^p whenever p is even
-- identically, to zero. Every such model must give x and its reflection through the
origin the same answer, and the table says it does, at 100.0% of points. Whether that
ruins you depends on your data:

  class 0 points whose reflection sits nearer the other class   87.5%
  class 1 points whose reflection sits nearer the other class   93.0%

Nine points in ten. The moons are almost exactly antisymmetric, so a model forced to
agree with itself under reflection is forced to be wrong about half of them, and a
coin flip is the best it can do. Add the constant back and degree 8 still scores
0.9050.

SECOND: the kernel's own arithmetic is not scale-free. Raising a dot product to a
power magnifies whatever units you fed it:

    degree    max K, scaled max K, x10 units          ratio
         2        6.568e+01        5.061e+05      7.706e+03
         3        5.323e+02        3.601e+08      6.765e+05
         5        3.496e+04        1.822e+14      5.213e+09
         8        1.861e+07        6.562e+22      3.526e+15

Ten times the units, and at degree 8 the numbers the solver is working with are
3.5e+15 times larger. That is not a rounding worry, it decides whether the fit
finishes at all. The same moons in 100x units, every solver capped at 2,000,000
iterations:

  poly p=2       test 0.4400   iterations 2,000,000   hit the cap: True
  poly p=3       test 0.7300   iterations 2,000,000   hit the cap: True
  poly p=5       test 0.4900   iterations 2,000,000   hit the cap: True
  rbf            test 0.5400   iterations       247   hit the cap: False

Three runs out of three stopped because they ran out of iterations, not because they
found an answer. The rbf kernel on the identical data finished in 247. Page 15 is
about scaling and this is the sharpest version of why: exp(-gamma|x-z|^2) is bounded
between 0 and 1 whatever units you hand it, and (1 + x.z)^8 is not bounded by
anything.`;

const outLookup = `Section 46 made the rbf kernel look free. It is not, and the bill does not arrive as
lost accuracy -- which is why it is easy to miss.

Data with a genuinely linear boundary, at most five informative features and the
rest noise, 400 points throughout. The only thing that changes is how many noise
columns come along. Everything is averaged over 5 draws, gamma left at 'scale':

       d       #sv      train         cv train - cv    linear cv
       2     61.6%     0.7455     0.7355    0.0100       0.7400
      10     59.0%     0.9185     0.8150    0.1035       0.8485
      50     88.1%     0.9840     0.7905    0.1935       0.7970
     200     99.5%     0.9980     0.6865    0.3115       0.6655
    1000    100.0%     1.0000     0.6060    0.3940       0.6195

The accuracy columns are the boring ones. At d=1000 the rbf kernel scores 0.6060 and
a straight line scores 0.6195 -- the same answer, within noise, on data whose
boundary IS a straight line. The rbf column tracks the linear column the whole way
down, so nothing was lost by choosing it.

What moved is everything else. The support set went from 61.6% of the training data
to 100.0% of it, every point with no exceptions; training accuracy went to 1.0000
against a cross-validated 0.6060, a gap of 0.3940. The model fits its training set
perfectly and knows nothing, and by page 11's arithmetic each prediction now costs
400 kernel evaluations where the line costs one dot product.

The reason is in the shape of the data rather than in the kernel. Distances in high
dimensions concentrate, so 'near' stops meaning anything:

       d    spread of distances   nearest vs average point
                      sd / mean            how much closer
       2                 0.5263                     14.69x
      10                 0.2279                      2.18x
      50                 0.0995                      1.34x
     200                 0.0497                      1.14x
    1000                 0.0221                      1.06x

At d=2 your nearest neighbour is 14.7 times closer than a typical point and the
distances vary by half their own size. At d=1000 the spread has fallen to 0.0221 and
your nearest neighbour is 1.06 times closer -- six per cent. Every point is now
essentially the same distance from every other, so a similarity built out of distance
has nothing left to say, and the only point measurably close to a point is itself.

This is section 47's failure arriving by a different road. There, the half-life was
driven below the spacing of the data by turning gamma up. Here gamma is left alone
and the spacing is driven above the half-life by adding dimensions, because in high
dimensions points are all far apart and all equally far apart. Either way the kernel
ends up saying every point is similar only to itself, and a model that believes that
has memorised its training set. Page 16 turns both knobs on purpose.`;

export default function KernelsYouWillActuallyUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 19 minutes"
        title={<>Choosing what similar means</>}
        intro={<>Page 12 established that you may put any positive semi-definite function in the
          table. That is a licence, not advice. In practice three kernels cover almost everything,
          and picking between them is not a search for the best one — it is a statement about how
          your data is shaped, which is a thing you sometimes know.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>Three kernels, three truths</h2>
        <p>
          If a kernel really is a claim about which points count as similar, then each one should
          win where its claim is true and lose where it is false. That is a testable sentence, so
          here are three worlds with three different kinds of boundary:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outMenu}</CodeOutput>

        <p>
          Half of that is unsurprising. A line is at chance on concentric rings, and a degree-3
          boundary carries the moons where a line cannot. The other half is the part worth
          keeping.
        </p>

        <Callout color={PINK} title={<>The two mistakes are not the same size</>}>
          <p>
            Guessing <em>curved</em> when the truth is straight costs <strong>0.0017</strong> —
            nothing. Guessing <em>straight</em> when the truth is a ring costs{" "}
            <strong>0.4617</strong>, which is the difference between a model and a coin.
          </p>
          <p>
            That asymmetry, and not any claim to superiority, is most of why the rbf kernel is the
            default in every library you will meet. It is not that it is usually right. It is that
            on data of this shape, being wrong in its direction is cheap — and the rest of this
            page is about what that sentence is quietly charging you.
          </p>
        </Callout>

        <h2>Gamma is a distance</h2>
        <p>
          The rbf kernel has one number in it, and the single most useful thing to know about that
          number is that it is not dimensionless:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
k(x,z) = \exp\!\big(-\gamma\,\|x-z\|^2\big) \\[6pt]
\Longrightarrow \qquad k = \tfrac12 \ \text{ at } \ \|x-z\| = \sqrt{\tfrac{\ln 2}{\gamma}}
\end{gathered}`}</MathBlock>

        <p>
          <M>{String.raw`\gamma`}</M> only ever appears multiplied by a squared distance, so it
          sets a <strong>length</strong>: the range over which two points still count as similar.
          Solving for where similarity has halved gives a number in the units of your own data,
          which means you can compare it against how far apart your points actually are. That
          comparison is the whole of what follows.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>In the lab below, the dashed ring around the moving point is that half-life
            distance. Turn <M>{String.raw`\gamma`}</M> all the way up so the ring shrinks smaller
            than the gap between neighbouring points. What happens to the number of support
            vectors?</>}
          options={[
            "It falls — a tighter kernel needs fewer points to describe the boundary",
            "It rises until almost every training point is a support vector",
            "It stays roughly constant; gamma changes the shape, not the count",
            "It falls on curved data and rises on straight data",
          ]}
          nudge="A support vector is a point the solution had to pay for. Ask what the model can still see from a given point once the ring is smaller than the distance to its nearest neighbour."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag the small dark point around and watch the ring — it is how far the
            kernel can see from there. Compare it against the{" "}
            <em>nearest-neighbour distance</em> in the readout. Then walk{" "}
            <M>{String.raw`\gamma`}</M> from 0.05 to 200 on each of the three worlds, watching the
            support-vector count rather than the accuracy.</>}
          insight={<>On <em>rings</em> and <em>moons</em> the support count is a U: too wide and
            too narrow both cost you, and the cheapest model sits in the middle. On{" "}
            <em>straight</em> there is no U at all — the count climbs from the very first{" "}
            <M>{String.raw`\gamma`}</M>, because a straight boundary has no scale that needs
            resolving and the widest kernel on the dial is already the right one. At the top of
            the dial all three worlds end the same way, with the ring smaller than the gap between
            neighbours and nearly every one of the 60 points bought and paid for.</>}
        >
          <KernelChoiceLab />
        </LabFrame>

        <p>
          The lab shows the mechanism. Here is the same dial measured, with the half-life put
          beside the actual spacing of the data:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outReach}</CodeOutput>

        <p>
          At <M>{String.raw`\gamma = 0.01`}</M> the half-life is 8.33 against a mean separation of
          1.76 — every point similar to every point, mean off-diagonal similarity 0.96, and the
          model underfits. At <M>{String.raw`\gamma = 1000`}</M> the half-life is 0.026 against a
          nearest-neighbour distance of 0.126, the average point has{" "}
          <strong>0.05 neighbours</strong>, and all 200 training points become support vectors.
        </p>

        <Callout color={PINK} title={<>Nothing failed, and that is the problem</>}>
          <p>
            At the bottom of that table training accuracy is <strong>1.0000</strong> and the test
            set is at <strong>0.6200</strong>. No part of the machinery misbehaved: the solver
            converged, the margin was maximised, every KKT condition from page 9 held exactly.
          </p>
          <p>
            The model memorised its training set because at that length scale the statement{" "}
            <em>the only point similar to a point is itself</em> is a true description of the
            kernel it was handed. It answered the question correctly. The question was wrong, and
            no amount of checking the optimisation would ever have told you so.
          </p>
        </Callout>

        <h2>The two ways the polynomial kernel bites</h2>
        <p>
          The polynomial kernel has a reputation for being fiddly. It is deserved, and it turns
          out to be two specific things rather than a general mood — one of which is a default
          you have probably never changed.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outCoef0}</CodeOutput>

        <p>
          The first is the constant. With <M>{String.raw`\texttt{coef0}=0`}</M>, which is{" "}
          <em>sklearn&rsquo;s default</em>, the kernel is <M>{String.raw`(\gamma\,x\cdot z)^p`}</M>{" "}
          with nothing added, and every even degree collapses to a coin flip. That is not noise,
          it is a symmetry, and the table pins it to zero:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
(-x \cdot z)^p = (x\cdot z)^p \quad \text{for even } p \\[6pt]
\Longrightarrow \qquad f(-x) = f(x) \ \text{ for every such model}
\end{gathered}`}</MathBlock>

        <p>
          A homogeneous kernel of even degree cannot tell a point from its reflection through the
          origin — measured as <M>{String.raw`\max|k(x,z)-k(-x,z)| = 0`}</M> exactly, and{" "}
          <strong>100.0%</strong> of points given the same label as their reflection. Whether that
          ruins you is a fact about your data, and on the moons it does:{" "}
          <strong>87.5% and 93.0%</strong> of each class have their reflection sitting nearer the
          other class. Put the constant back and degree 8 still scores 0.9050.
        </p>
        <p>
          The second is arithmetic. Raising a dot product to a power magnifies whatever units you
          fed it, so the same data in units ten times larger makes the numbers the solver handles{" "}
          <strong>3.5 × 10<sup>15</sup></strong> times bigger at degree 8. That is not a rounding
          worry — on the unscaled moons, all three polynomial fits stopped because they exhausted
          two million iterations, while the rbf kernel on identical data finished in{" "}
          <strong>247</strong>.
        </p>

        <Callout color={PINK} title={<>Why the rbf kernel forgives what the polynomial does not</>}>
          <p>
            <M>{String.raw`\exp(-\gamma\|x-z\|^2)`}</M> lies between 0 and 1 whatever units you
            hand it. <M>{String.raw`(1 + x\cdot z)^8`}</M> is bounded by nothing at all. Page 15
            is about scaling and why an SVM cannot skip it; this is the sharpest version of the
            reason, and it is the difference between a fit that is slightly off and a fit that
            never finishes.
          </p>
        </Callout>

        <h2>When the default becomes a lookup table</h2>
        <p>
          The first section made the rbf kernel look free. It is not, and the reason it is easy to
          miss is that the bill does not arrive as lost accuracy.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLookup}</CodeOutput>

        <p>
          The accuracy columns are the dull ones: at <M>{String.raw`d = 1000`}</M> the rbf kernel
          scores 0.6060 and a straight line scores 0.6195, the same answer within noise, on data
          whose boundary genuinely is a straight line. Nothing was lost by choosing it.
        </p>
        <p>
          Everything else moved. The support set went from 61.6% of the training data to{" "}
          <strong>100.0%</strong> of it, training accuracy reached 1.0000 against a
          cross-validated 0.6060, and by page 11&rsquo;s arithmetic every prediction now costs 400
          kernel evaluations where the line costs one dot product. You are paying four hundred
          times over for a model that has memorised its training set and learned nothing.
        </p>
        <p>
          And the cause is in the data rather than the kernel. As dimensions pile up, distances
          concentrate: the spread of pairwise distances falls from 0.5263 of their mean to{" "}
          <strong>0.0221</strong>, and your nearest neighbour goes from 14.7 times closer than a
          typical point to <strong>1.06</strong> times closer. Six per cent. A similarity built
          out of distance has nothing left to work with.
        </p>

        <Callout color={PINK} title={<>Two roads to the same broken model</>}>
          <p>
            This is the <M>{String.raw`\gamma = 1000`}</M> row again, reached from the other
            direction. There, the half-life was driven below the spacing of the data by turning{" "}
            <M>{String.raw`\gamma`}</M> up. Here <M>{String.raw`\gamma`}</M> is left entirely
            alone and the spacing is driven above the half-life by adding columns.
          </p>
          <p>
            Either way the kernel ends up asserting that every point is similar only to itself,
            and a model that believes that has memorised its training set. Which is why the useful
            question is never &ldquo;what is a good <M>{String.raw`\gamma`}</M>&rdquo; but{" "}
            &ldquo;how does this length compare to the distances in my data&rdquo; — a question
            with an answer you can compute before fitting anything.
          </p>
        </Callout>

        <h2>Where this leaves you</h2>
        <p>
          Three kernels is the honest size of the menu. Start linear, because when it works it
          collapses to a weight vector and costs nothing to serve. Reach for rbf when you have
          reason to think the boundary is curved and{" "}
          <M>{String.raw`n`}</M> is comfortably larger than <M>{String.raw`d`}</M>, and check the
          support-vector count rather than the training accuracy to find out whether it worked.
          Reach for polynomial when the interactions themselves are the thing you care about —
          and set <M>{String.raw`\texttt{coef0}`}</M>.
        </p>
        <p>
          All of which has assumed the fit happens. Twelve pages in, every solver on this track
          has been a library call or a few hundred lines of SMO taken on faith. Page 14 opens it
          up: how you actually maximise a dual with <M>{String.raw`n`}</M> coupled variables and
          an equality constraint tying them together, two at a time.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>Your rbf SVM has 100% training accuracy and 98% of the training points are
                support vectors. What is the most likely diagnosis?</>,
              options: [
                "The model is excellent and the data is easy",
                "The similarity length is far below the spacing of your data",
                "C is too small, so the model is paying for too many violations",
                "The kernel is not positive semi-definite",
              ],
              answer: 1,
              explain: <>Both failures measured on this page look exactly like that — gamma turned
                up until the half-life fell under the nearest-neighbour distance, and gamma left
                alone while dimensions were added until the distances rose above it. In each case
                the kernel says every point is similar only to itself, so every point has to be
                bought, and the model memorises. Compare sqrt(ln2/gamma) against the actual
                distances in your data.</>,
            },
            {
              q: <>Why does rbf beat linear by 0.4617 on the rings but only 0.0017 on the straight
                world?</>,
              options: [
                "The rings have more points, so there is more to learn",
                "Because the mistakes are asymmetric: a flexible kernel can imitate a straight boundary, but a straight one cannot imitate a curve",
                "Because gamma was tuned on the rings and not on the straight world",
                "It is a fluke of that particular seed",
              ],
              answer: 1,
              explain: <>That asymmetry is most of why rbf is everyone&rsquo;s default. It is not
                a claim that curved is usually right — it is that on data of this shape the cost
                of being wrong in the flexible direction is close to zero while the cost of being
                wrong in the rigid direction is total. The price for that insurance shows up in
                the support-vector count, not in the accuracy.</>,
            },
            {
              q: <>You fit SVC(kernel=&apos;poly&apos;, degree=4) with default settings and get
                50% accuracy. What should you check first?</>,
              options: [
                "Whether C is large enough",
                "coef0, which defaults to 0 and makes every even degree blind to reflection through the origin",
                "Whether the classes are balanced",
                "Whether the data needs more features",
              ],
              answer: 1,
              explain: <>With coef0=0 the kernel is homogeneous, so (-x.z)^p equals (x.z)^p exactly
                whenever p is even — measured here as a difference of 0.000e+00 — and every such
                model is forced to give x and -x the same label, at 100.0% of points. On data that
                is roughly antisymmetric about the origin, as the moons are for about nine points
                in ten, a coin flip is the best such a model can do. Odd degrees are unaffected,
                which is the tell.</>,
            },
            {
              q: <>Why do unscaled features break a polynomial kernel much more violently than an
                rbf one?</>,
              options: [
                "The polynomial kernel has more hyperparameters to get wrong",
                "The rbf kernel's output is bounded between 0 and 1 in any units, while a power of a dot product is bounded by nothing",
                "The rbf kernel internally standardises its inputs",
                "Polynomial kernels are not positive semi-definite on unscaled data",
              ],
              answer: 1,
              explain: <>Measured: the same data in units ten times larger makes the largest Gram
                entry 3.5e+15 times bigger at degree 8. On the unscaled moons all three polynomial
                fits hit a two-million-iteration cap without converging, while the rbf kernel on
                identical data finished in 247 iterations. The rbf kernel does not standardise
                anything — it just cannot produce a number outside [0, 1] whatever you feed it.</>,
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "The kernel trick",
          href: "/learn/support-vector-machines/the-kernel-trick",
        }}
        next={{
          label: "Solving it: SMO",
          href: "/learn/support-vector-machines/solving-it-smo",
        }}
      />
    </article>
  );
}
