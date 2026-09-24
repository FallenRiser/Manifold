import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { KernelTrickLab } from "@/components/labs/KernelTrickLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "The kernel trick — Manifold",
  description:
    "The dual reads the training set only as a table of inner products, so replacing that function with another one is a one-line edit that buys a curved boundary. The space the new function measures angles in is real, it can be written down for polynomials, and for the rbf kernel it has no finite size at all.",
};

const outSwap = `Section 36 left the dual reading nothing but a table of inner products. So here is
the experiment that question invites: keep the solver, keep the box, keep the
equality constraint, keep the rule for the offset, keep the prediction formula --
and fill the table with a different function of each pair.

The data is two concentric rings. No straight line separates them, so if the rest of
the machinery survives the substitution, it will be obvious.

  K[i,j] =              train     test    #sv   free    vs sklearn
  x . z                0.4333   0.4383     60      0     5.778e-01
  (1 + x . z)^2        1.0000   1.0000     23      6     3.599e-06
  (1 + x . z)^3        1.0000   1.0000     12      7     1.011e-06
  exp(-|x - z|^2)      1.0000   1.0000     26     10     1.096e-07

Three of those four are perfect on 600 held-out points, and the solver was not told
it had changed problems. The last column is our prices scoring the test set against
sklearn's own decision function, so the curved fits are the same fits it makes.

The linear row is the odd one out twice over. It is at chance, and its check is
0.58 rather than 1e-7 -- because not one of its 60 multipliers is free. Nothing rests
on the margin, so the offset is an interval again (section 40), and two solvers are
entitled to pick different points in it. A model at chance has no margin to pin.

Now the part that is easy to miss. In the linear row the answer collapses into
w = sum a_i y_i x_i, two numbers, and the training points can be thrown away. In the
other three it cannot: the sum lives in whatever space the new function is an inner
product in, and we never built that space, so there is nowhere to add the vectors up.

  linear      as w and b: 3 numbers   as support vectors, prices and b:  181 numbers
  rbf g=1     as w and b: no such w   as support vectors, prices and b:   79 numbers

That is the trade the rest of this page is about. You get a curved boundary for the
price of one edit, and you pay by carrying the points forever.`;

const outLift = `Calling (1 + x.z)^p an inner product in some other space is a claim, and it is
checkable, because for this kernel the other space can be written down. Expand the
bracket: every term is a monomial in x times the same monomial in z, so define phi
to hold those monomials and the whole expansion becomes phi(x) . phi(z).

  degree      D        max |K|     max |diff|         relative
  2           6     1.0385e+02      2.842e-14        2.737e-16
  3          10     1.0584e+03      4.547e-13        4.297e-16
  4          15     1.0786e+04      4.547e-12        4.216e-16
  5          21     1.0992e+05      3.638e-11        3.310e-16
  6          28     1.1201e+06      4.657e-10        4.157e-16

Agreement at the last bit of a double, at every degree. The two columns are not
close, they are the same number computed twice -- once by building a D-dimensional
vector and dotting it, once by multiplying two numbers together p times.

And if the space is real, a plain linear SVM run inside it must return the same
model as the kernel. Same C, same solver, 400 fresh points scored both ways:

  degree 2: linear SVM on   6 explicit features vs kernel='poly'   max|f1-f2| 4.796e-13   #sv 15 vs 15   same label True
  degree 3: linear SVM on  10 explicit features vs kernel='poly'   max|f1-f2| 1.597e-12   #sv 16 vs 16   same label True
  degree 4: linear SVM on  15 explicit features vs kernel='poly'   max|f1-f2| 6.359e-12   #sv 13 vs 13   same label True

Not similar models. The same model, reached twice, once through a space that was
built and once through a space that was not.

So why not build it? Because D is a binomial coefficient in the number of features,
and the kernel's cost is not:

  features   degree        D = C(d + p, p)       kernel needs
         2        2                      6              2 mults
         2        5                     21              2 mults
        10        2                     66             10 mults
        10        5                  3,003             10 mults
       100        2                  5,151            100 mults
       100        5             96,560,646            100 mults
      1000        2                501,501           1000 mults
      1000        5      8,459,043,543,951           1000 mults

The right-hand column is flat because the kernel never touches D. It multiplies d
pairs of numbers, adds one, and raises the result to the fifth power -- at a thousand
features that is a thousand multiplications either way you set C, while the vector it
is standing in for has eight and a half trillion coordinates. The map has to exist
for the argument to work. It does not have to be built for the model to run.`;

const outNospace = `D = C(d+p, p) is what the construction happens to write. It is not obviously the
smallest space that would do, and the data may not use all of it. Both questions have
the same answer and it is readable off the Gram matrix: the rank of K is exactly the
dimension of the span of phi(x_1) ... phi(x_n), whatever phi is. Eigenvalues tell you
the size of a space nobody constructed.

  n = 200 points in 2 features. r(eps) = how many eigenvalues you must keep for the
  rebuilt matrix to be within eps of K in every single entry.

  K[i,j] =           1e-1     1e-3     1e-6    1e-12     C(d+p,p)
  x . z                 2        2        2        2            2
  (1 + x.z)^2           5        6        6        6            6
  (1 + x.z)^3           6       10       10       10           10
  (1 + x.z)^5           7       12       21       21           21
  rbf gamma=0.5        21       38       67      124           --
  rbf gamma=2          45       86      137      194           --

The polynomial rows stop dead on the number the construction predicted and then do
not move: 6, 10 and 21 are C(4,2), C(5,2) and C(7,2). Nothing was wasted and nothing
was missing. The rbf rows never stop.

A ceiling would show up as a count that stops growing when you add points, so add
points. 'dimension used' below is the number of eigenvalues above float noise:

       n      x . z  (1 + x.z)^3    rbf g=0.5      rbf g=2
      25          2           10           25           25
      50          2           10           50           50
     100          2           10           82          100
     200          2           10          105          184
     400          2           10          128          263
     800          2           10          145          335

Two columns are constants and two are still climbing at 800. The rbf columns are
n exactly while n is small enough -- every point independent of every other, which is
what a space with no ceiling looks like from inside. They fall behind n later only
because eigenvalues shrink past what a double can hold, not because the kernel ran
out of dimensions. There is no finite D to print for the last two columns, and that
is not a gap in the measurement. It is the measurement.`;

const outAllowed = `If any two-argument function worked, the trick would be a free lunch. Put one in and
see. Four functions below are inner products in some space; one is a distance, which
is not the same thing, and tanh(x.z + 1) is a function people genuinely do pass to
SVC as kernel='sigmoid'.

Every claim of the form 'K is an inner product table' has a consequence you can
check without solving anything: |phi(x) - phi(z)|^2 = k(x,x) - 2k(x,z) + k(z,z), and
a squared length is not allowed to be negative.

  k(x,z) =              min eig    min |phi|^2    pairs below 0
  x . z                 -0.0000         0.0015          0 / 1560
  (1 + x.z)^3           -0.0000         0.0148          0 / 1560
  rbf gamma=0.5          0.0000         0.0015          0 / 1560
  tanh(x.z + 1)         -4.3315        -0.0962        194 / 1560
  |x - z|              -20.2350       -10.2871       1560 / 1560

The first three have no negative eigenvalue and no negative squared distance, to
float noise. The last two have both. There is no space in which tanh(x.z + 1) is an
inner product, because in that space 194 pairs of these 40 points would have to be a
negative distance apart. That is what a Gram matrix with a negative eigenvalue means,
and it is the whole content of the condition on kernels.

The damage shows up in the objective. With a genuine kernel the quadratic term is a
real squared length, so the dual is concave and its maximum is THE maximum. Without
one there are directions of negative curvature, and the only thing standing between
the objective and infinity is the box. So open the box:

  k(x,z) =                   C=1         C=100       C=10000       C=1e+06  per 100x C
  x . z                    13.13          1066     1.062e+05     1.062e+07      100.0x
  (1 + x.z)^3              8.039         357.2          1027          1027        1.0x
  rbf gamma=0.5            13.71         411.4          2874          2874        1.0x
  tanh(x.z + 1)            21.26     7.301e+04     7.182e+08     7.126e+12     9921.1x
  |x - z|                  315.3     2.796e+06     2.778e+10     2.923e+14    10520.4x

Three behaviours in five rows. The polynomial and the rbf stop dead: 1027 and 2874,
unchanged to the last digit however wide the box gets, because in THEIR feature
spaces this data is separable -- the hinge sum reaches zero and what is left over is
the hard-margin answer, which does not care about C. The linear kernel never gets
there, since no line separates this data, so it keeps paying; but it pays in
proportion, a hundred times the objective for a hundred times the cap.

The bottom two multiply by ten thousand. Squaring the growth rate is the signature of
a quadratic form running downhill until it hits a wall, and no C is large enough to
level it off, because there is nothing down there to reach. Take the cap away and
these two problems have no solution -- not a hard one, none. On this data the box was
not tuning the fit. It was the only reason a number came back at all.

None of this raises an error:

  SVC(kernel='rbf'    ) fits, returns 22 support vectors, scores 0.9500 on its training data
  SVC(kernel='sigmoid') fits, returns 19 support vectors, scores 0.8250 on its training data

It fits, it predicts, it looks like a model. What it is not is the maximum-margin
separator in any space, so every argument this track has made about it -- the margin,
the bound in section 41, duality itself -- is about a different object. The failure is
quiet, which is the reason to know the condition rather than trust the library.`;

export default function TheKernelTrickPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Deep", color: "var(--c-fundamentals)" }]}
        time="about 18 minutes"
        title={<>A space you never build</>}
        intro={<>Page 10 ended on an observation that looked like a curiosity: the dual never asks
          where a point is, only how it relates to other points. Nothing in the objective, the
          constraints or the prediction rule touches a coordinate. This page takes that
          literally and changes one line.</>}
        titleSize={42}
        introSize={17.5}
      />

      <div className="lesson">
        <h2>One line different</h2>
        <p>
          Here is the dual again, with every occurrence of the inner product boxed off into a
          function called <M>{String.raw`k`}</M>, and the prediction rule underneath it:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\max_{\alpha}\ \ \sum_i \alpha_i - \tfrac12 \sum_i \sum_j \alpha_i \alpha_j y_i y_j\, k(x_i, x_j) \\[6pt]
\text{subject to} \quad 0 \le \alpha_i \le C, \qquad \sum_i \alpha_i y_i = 0
\end{gathered}`}</MathBlock>

        <MathBlock>{String.raw`f(x) \;=\; \sum_i \alpha_i y_i \, k(x_i, x) \;+\; b`}</MathBlock>

        <p>
          With <M>{String.raw`k(x,z) = x \cdot z`}</M> that is exactly page 10&rsquo;s problem,
          character for character. But the solver does not know that. It is handed an{" "}
          <M>{String.raw`n \times n`}</M> table of numbers and a box, and it maximises. So the
          experiment writes itself: fill the table with something else and see whether anything
          objects.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outSwap}</CodeOutput>

        <p>
          Three of the four are perfect on 600 held-out points, on data where a straight line is a
          coin flip — and not one line of the solver changed. The prices came back in the same
          box, summing against the same labels to zero, and scoring the test set with them lands
          on sklearn&rsquo;s own decision function to six decimals or better.
        </p>
        <p>
          The linear row disagrees with sklearn by 0.58 rather than 10<sup>−7</sup>, and the
          reason is page 11&rsquo;s, not a bug: none of its sixty multipliers is free. Nothing
          rests on the margin, so the offset is an interval, and two solvers may legitimately pick
          different points in it. A model at chance has no margin to pin.
        </p>

        <Callout color={PINK} title={<>What you gave up to get the curve</>}>
          <p>
            In the linear row the answer collapses:{" "}
            <M>{String.raw`w = \sum_i \alpha_i y_i x_i`}</M> is two numbers, and once you have
            them the training set can be thrown away. In the other three it does not, and the
            reason is not that the sum is expensive. It is that the sum lives in whatever space
            the new function is an inner product in, and that space was never built, so there is
            nowhere to add the vectors up.
          </p>
          <p>
            So a kernel model <em>is</em> its support vectors — 79 numbers here against the
            linear model&rsquo;s 3, and every one of them consulted on every prediction. That is
            the bill page 11&rsquo;s count was quietly running up.
          </p>
        </Callout>

        <h2>The space is real, and you can write it down</h2>
        <p>
          &ldquo;An inner product in some other space&rdquo; is a claim, not a decoration, and for
          the polynomial kernel it is checkable, because that space can be written out. Expand the
          bracket for two features and degree two:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
(1 + x \cdot z)^2 \;=\; 1 + 2x_1z_1 + 2x_2z_2 \\[4pt]
\;+\; x_1^2z_1^2 + x_2^2z_2^2 + 2x_1x_2z_1z_2
\end{gathered}`}</MathBlock>

        <p>
          Every term is a monomial in <M>{String.raw`x`}</M> multiplied by the same monomial in{" "}
          <M>{String.raw`z`}</M>. So collect the <M>{String.raw`x`}</M> halves into a vector and
          the whole expansion becomes an ordinary dot product of two six-dimensional vectors:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\varphi(x) = \big(\,1,\ \sqrt2\,x_1,\ \sqrt2\,x_2,\ x_1^2,\ x_2^2,\ \sqrt2\,x_1x_2\,\big) \\[6pt]
\Longrightarrow \qquad \varphi(x)\cdot\varphi(z) = (1 + x\cdot z)^2
\end{gathered}`}</MathBlock>

        <p>
          The same construction works at any degree: the coordinates are all monomials of total
          degree at most <M>{String.raw`p`}</M>, each weighted by the square root of its
          multinomial coefficient, and there are <M>{String.raw`\binom{d+p}{p}`}</M> of them. You
          can hold both sides of that equation in your hands at once.
        </p>

        <PredictPrompt
          accent={PINK}
          prompt={<>The lab below computes <M>{String.raw`\varphi(x)\cdot\varphi(z)`}</M> by
            actually building both vectors, and <M>{String.raw`(1 + x\cdot z)^p`}</M> by not
            building anything. As you turn the degree dial up, what happens to the gap between
            those two numbers?</>}
          options={[
            "It grows, slowly at first and then quickly",
            "It stays down at the last bit of a double, whatever the degree",
            "It is exactly zero at every degree",
            "It grows only when the points are far apart",
          ]}
          nudge="Both routes are floating-point arithmetic on the same quantities — but they are not the same operations in the same order."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Drag either point and watch the two large numbers track each other. Then walk
            the degree dial from 1 to 5 and read the three counters underneath: the number of
            coordinates, the arithmetic the long way, the arithmetic the kernel does.</>}
          insight={<>Most of the time the difference reads exactly <strong>0</strong> — the two
            routes round to the same double — and where they part it is the last bit or two,
            never above 10<sup>−10</sup> anywhere on the plane at any degree. Bit-identical
            agreement gets rarer as the dial climbs, from about three-quarters of positions at
            degree 1 to under a tenth at degree 5, simply because there are more coordinates to
            round. Meanwhile the coordinate count runs 3, 6, 10, 15, 21 while the kernel&rsquo;s
            own arithmetic goes 2, 3, 4, 5, 6 — and at a hundred features and degree 5 that
            vector would have 96,560,646 coordinates against the kernel&rsquo;s 104
            multiplications.</>}
        >
          <KernelTrickLab />
        </LabFrame>

        <p>
          Watching two numbers agree is suggestive. The stronger test is whether a plain linear
          SVM, run inside the built space, returns the <em>same model</em> as the kernel:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLift}</CodeOutput>

        <p>
          Same support vectors, same count, same decision value on 400 fresh points to eleven
          decimals or better. Not two models that behave alike — one model, reached twice, once through a
          space that was built and once through a space that was not. And the last table is the
          reason anybody bothers with the second route: <M>{String.raw`D`}</M> is a binomial
          coefficient in the number of features and the kernel&rsquo;s cost is not.
        </p>

        <h2>How big is that space, really</h2>
        <p>
          <M>{String.raw`\binom{d+p}{p}`}</M> is what one particular construction happens to
          write down. It is not obviously the smallest space that would do the job, and the data
          may not use all of it. Both questions have the same answer, and it is sitting in the
          Gram matrix: the rank of <M>{String.raw`K`}</M> is exactly the dimension of the span of{" "}
          <M>{String.raw`\varphi(x_1), \ldots, \varphi(x_n)`}</M>, whatever{" "}
          <M>{String.raw`\varphi`}</M> is. Eigenvalues will measure a space nobody built.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outNospace}</CodeOutput>

        <p>
          The polynomial rows stop dead on the predicted number — 6, 10 and 21 — and then refuse
          to move when the sample grows from 25 points to 800. Nothing was wasted, nothing was
          missing, and the construction was not merely <em>a</em> feature space but the right
          size of one.
        </p>

        <Callout color={PINK} title={<>Why the last two columns have no number in them</>}>
          <p>
            The rbf columns are equal to <M>{String.raw`n`}</M> while <M>{String.raw`n`}</M> is
            small — every point linearly independent of every other in feature space — and they
            are still climbing at 800. There is no <M>{String.raw`D`}</M> to print, and that is
            not the measurement failing to reach it. A finite feature space of size{" "}
            <M>{String.raw`D`}</M> could not produce a Gram matrix of rank above{" "}
            <M>{String.raw`D`}</M> no matter how many points you fed it, so a count that keeps
            rising rules out every finite <M>{String.raw`D`}</M> in turn.
          </p>
          <p>
            The rbf counts do eventually fall behind <M>{String.raw`n`}</M>, and it is worth
            being clear about why: the eigenvalues shrink past what a double can represent, so
            the arithmetic runs out before the kernel does. Page 13 picks this up as a practical
            matter — a spectrum that decays that fast is what makes low-rank approximations of
            big kernel matrices work.
          </p>
        </Callout>

        <h2>What you are allowed to put in the table</h2>
        <p>
          If any two-argument function worked, this would be a free lunch, and it is not. The
          substitution was justified by a story — <M>{String.raw`k(x,z)`}</M> is an inner product
          in some space — and a function that has no such space is not a kernel, whatever it is
          called in the documentation. The condition is that every Gram matrix it produces is
          positive semi-definite:
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\sum_{i}\sum_{j} c_i c_j \, k(x_i, x_j) \;\ge\; 0 \\[4pt]
\text{for every finite sample and every } c \in \mathbb{R}^n
\end{gathered}`}</MathBlock>

        <p>
          That looks abstract until you notice it has a consequence you can check by hand. If{" "}
          <M>{String.raw`k`}</M> really is an inner product then squared distances in that space
          are computable from it —{" "}
          <M>{String.raw`\|\varphi(x)-\varphi(z)\|^2 = k(x,x) - 2k(x,z) + k(z,z)`}</M> — and a
          squared length is not allowed to be negative.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outAllowed}</CodeOutput>

        <p>
          There is no space in which <M>{String.raw`\tanh(x\cdot z + 1)`}</M> is an inner product,
          and the reason is concrete rather than technical: in that space, 194 pairs of these 40
          points would have to be a negative distance apart. A negative eigenvalue in a Gram
          matrix means exactly that, and it is the whole content of the condition.
        </p>
        <p>
          The consequence lands on the objective. With a genuine kernel the quadratic term is a
          real squared length, the dual is concave, and its maximum is <em>the</em> maximum —
          which is why the polynomial and rbf rows stop dead at 1027 and 2874 however wide the box
          gets. Without one there are directions of negative curvature, and opening the box a
          hundredfold multiplies the objective by ten thousand, forever. Take the cap off and
          those two problems have no solution at all.
        </p>

        <Callout color={PINK} title={<>Nothing raises an error</>}>
          <p>
            <code>SVC(kernel=&apos;sigmoid&apos;)</code> fits, returns 19 support vectors, and
            scores 0.8250 on its training data. It looks like a model and it will go on looking
            like one in production. What it is not is the maximum-margin separator in any space —
            so the margin argument, the leave-one-out bound from page 11, and duality itself are
            all statements about a different object.
          </p>
          <p>
            That is the case for knowing the condition rather than trusting the library. The
            failure is quiet, and a quiet failure in a model that still returns numbers is the
            kind you ship.
          </p>
        </Callout>

        <h2>Where this leaves you</h2>
        <p>
          The trick is not that a clever function makes a linear model curved. It is that the dual
          only ever reads a table, so any function producing a legitimate table defines a linear
          model in a space you are never required to visit — and the model you get is exactly the
          one you would have got by visiting it. What it costs is the collapse into{" "}
          <M>{String.raw`w`}</M>: the support vectors become the model, on disk and at prediction
          time.
        </p>
        <p>
          Which raises the question this page has been dodging. Two kernels have done all the work
          here, chosen because their feature spaces are easy to talk about. Page 13 asks which
          ones are worth using on real data, what <M>{String.raw`\gamma`}</M> is actually doing to
          the rbf kernel, and how to tell an expensive kernel from a useful one.
        </p>

        <Quiz
          accent={PINK}
          questions={[
            {
              q: <>A colleague says the kernel trick works by mapping the data into a
                high-dimensional space and fitting a linear model there. What is wrong with
                that description?</>,
              options: [
                "Nothing — that is exactly what happens",
                "Nothing is mapped: the map is never computed, and for some kernels it cannot be",
                "The model fitted in the new space is not linear",
                "The new space is lower-dimensional, not higher",
              ],
              answer: 1,
              explain: <>It is a fair description of what the model is equivalent to and a bad
                description of what runs. No feature vector is ever formed. The measurement on
                this page shows the two routes returning the same model to eleven decimals or better for
                the polynomial kernel — and for the rbf kernel the first route is not available
                at any price, because there is no finite vector to form.</>,
            },
            {
              q: <>The Gram matrix of an rbf kernel on 50 distinct points has rank 50; on 800
                points the count is still climbing. What does that establish?</>,
              options: [
                "The data is 50-dimensional",
                "No finite-dimensional feature space can reproduce this kernel",
                "The kernel is badly conditioned and gamma should be lowered",
                "The points are nearly identical to one another",
              ],
              answer: 1,
              explain: <>A feature space of dimension D caps the rank of every Gram matrix it can
                produce at D. A rank that keeps rising with n therefore rules out each finite D in
                turn. The polynomial rows are the control: they pin at 6, 10 and 21 and stay
                there, which is what a finite feature space looks like from the outside.</>,
            },
            {
              q: <>You pass a non-PSD function as your kernel. What is the most likely thing to
                happen?</>,
              options: [
                "The solver raises an error about the kernel matrix",
                "It fits, predicts, and looks fine — but it is not maximising any margin",
                "The fit is identical to using the rbf kernel",
                "Training accuracy drops to chance",
              ],
              answer: 1,
              explain: <>Measured on this page: it fits, returns 19 support vectors and scores
                0.8250 on its training data with no warning. The damage is that the dual is no
                longer concave, so the number it returns is not a maximum of anything meaningful,
                and every guarantee the track has derived is about a different object. The
                objective growing quadratically in C rather than linearly is the symptom you can
                actually measure.</>,
            },
            {
              q: <>Why can a linear SVM throw away its training data after fitting while a kernel
                SVM cannot?</>,
              options: [
                "Because kernel models need the data to recompute gamma at prediction time",
                "Because the sum defining w lives in the feature space, which was never built",
                "Because kernel models have many more support vectors, so it is not worth it",
                "Because the dual does not produce a w for any kernel, including the linear one",
              ],
              answer: 1,
              explain: <>w is the weighted sum of the support vectors in feature space. With a
                linear kernel the feature space is the input space, so the sum is two numbers you
                can form and keep. With any other kernel there is nowhere to perform the
                addition — so prediction has to go back through k, one evaluation per support
                vector, which is why page 11&rsquo;s count turned out to be a latency budget.</>,
            },
          ]}
        />

      </div>

      <PrevNext
        prev={{
          label: "Support vectors, exactly",
          href: "/learn/support-vector-machines/support-vectors-exactly",
        }}
        next={{
          label: "Kernels you'll actually use",
          href: "/learn/support-vector-machines/kernels-you-will-actually-use",
        }}
      />
    </article>
  );
}
