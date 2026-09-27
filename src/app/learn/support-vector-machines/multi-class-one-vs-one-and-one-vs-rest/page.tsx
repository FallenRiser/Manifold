import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import MultiClassLab from "@/components/labs/MultiClassLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "Two sides at a time — Manifold",
  description:
    "How an SVM, which only ever separates two classes, handles ten: one-vs-rest and one-vs-one, what each costs, the class in the middle that one of them loses, and why a clean vote is not a confident one.",
};

const outTwo = `digits: 1797 images, 10 classes, standardised. The default rbf SVM (C=1,
gamma='scale') is the binary machine inside both.

                                                one-vs-rest   one-vs-one
  binary models fitted                                   10           45
  training points each model sees                      1797      351-365
  training points summed over all models             17,970       16,173
  solver work (iterations x points, summed)       7,608,498    2,894,171
  support vectors a prediction must visit              1942          847
  accuracy (5-fold, 5 repeats)                       0.9802       0.9815

One-vs-one fits 4.5 times as many models and does 2.6 times LESS work. Each of its
models sees two classes, about a fifth of the data, and an SVM's cost grows faster
than its data. At prediction time libsvm pools the support vectors of all 45 pairs,
so one-vs-one visits 847 points where one-vs-rest visits 1942. And the accuracy is the
same to within 0.0013.

sklearn's SVC is ALWAYS one-vs-one. Its decision_function_shape='ovr' option only
reshapes the output; the models and the labels are the same:

  iris     decision_function (150, 3) vs (150, 3)   same label on 150 of 150
  wine     decision_function (178, 3) vs (178, 3)   same label on 178 of 178
  digits   decision_function (1797, 45) vs (1797, 10)   same label on 1797 of 1797

To get real one-vs-rest from a kernel SVM, wrap it: OneVsRestClassifier(SVC()).
LinearSVC goes the other way and is one-vs-rest by default.`;

const outMask = `Three classes in a row along one axis: A on the left, B in the middle, C on the
right, each a round cloud of spread 0.7. 30 training points per class, 300 new ones
to score on, 20 draws at each spacing. Linear SVMs, C=1:

               linear one-vs-rest      linear one-vs-one      B-vs-rest
   spacing        all      B only        all      B only  says 'B' to B
         2     0.8113      0.4665     0.8977      0.8447         0.0000
         3     0.9256      0.7807     0.9744      0.9580         0.0000
         4     0.9702      0.9107     0.9957      0.9938         0.0000

B-vs-rest asks one straight line to put B on one side and BOTH neighbours on the
other. No line can. The line it settles for says 'B' to none of B's own points,
in any of the 60 draws. So B is left to win on a technicality: wherever A's and C's
scores are both even lower than B's, a strip between them. At spacing 2 that strip
catches about half of B. One-vs-one never asks the impossible question. Its models
are A-vs-B, A-vs-C and B-vs-C, and each pair has a line between them.

This is not a toy problem. Iris's three species, projected on their first principal
component, standardised:

  setosa +2.22   versicolor -0.50   virginica -1.73

Versicolor sits in the middle. Recall for each species, 5-fold, 5 repeats:

                                         setosa  versicolor  virginica
  linear one-vs-rest                     0.9800      0.8560     0.9240
  linear one-vs-one                      1.0000      0.9200     0.9640
  rbf one-vs-rest                        1.0000      0.9400     0.9400
  rbf one-vs-one                         0.9920      0.9440     0.9400

The middle class is the one linear one-vs-rest loses, by the same mechanism. A
kernel removes the problem at its root: an rbf boundary can wrap around B, so
B-vs-rest is a fair question again, and the two strategies agree.`;

const outClaims = `One-vs-rest asks every model 'is this yours?'. Nothing makes exactly one of them
say yes. One-vs-one holds a round-robin and counts wins. digits, standardised, the
default rbf SVM, trained on the even-numbered images and scored on the odd ones:

  one-vs-rest: how many of the 10 models said 'mine'
                                   points      share   argmax right
  exactly one                         817     0.9098         0.9927
  none                                 78     0.0869         0.6795
  two or more                           3     0.0033         0.3333
  all                                 898     0.9633

  one-vs-one: how many of its 9 duels the winning class won
                                   points      share     vote right
  all 9                               895     0.9967         0.9665
  fewer (a tie at the top)              3     0.0033         0.0000
  all                                 898     0.9633

One-vs-rest's awkward cases are informative. 27 of its 33 mistakes are points no
model claimed, where it had to fall back on 'whose score is least negative'; on
points exactly one model claimed it is right 99.3% of the time.

One-vs-one's vote is not. The winning class won all nine of its duels on 895 of 898
points -- including 30 of its 33 mistakes. A clean sweep is the normal result,
right or wrong. Of the 45 models, 36 never saw the true class at all: they were
trained on two classes that are both wrong for this point, and their votes land
somewhere regardless. A vote count is a label, not a confidence. Page 18 is about
getting a real one.`;

const outCost = `2,000 points in 10 dimensions, split into k well-separated blobs, standardised,
the default rbf SVM. Solver work is iterations times points, summed over models:

     k OvR models       OvR work OvO models       OvO work   OvR/OvO same label
     3          3      1,542,000          3        693,307      2.22     1.0000
     5          5      1,936,000         10        808,800      2.39     0.9980
    10         10      2,598,000         45      1,072,800      2.42     1.0000
    20         20      4,910,000        190      2,037,400      2.41     0.9980
    40         40      8,420,000        780      3,365,400      2.50     0.9950

The usual worry is that one-vs-one's k(k-1)/2 models explode: 780 of them at k=40.
They do, and it does not matter, because each one gets smaller as k grows. Both
strategies' work rises with k, and one-vs-one stays the cheaper one at every row.

Accuracy, 5-fold with 5 repeats, standardised, C=1. The last column is Crammer and
Singer's formulation, which solves ONE joint problem over all classes instead of
many binary ones (LinearSVC(multi_class='crammer_singer')):

              rbf OvR    rbf OvO    lin OvR    lin OvO Crammer-Singer
  iris         0.9600     0.9587     0.9200     0.9613         0.9573
  wine         0.9843     0.9843     0.9752     0.9618         0.9596
  digits       0.9802     0.9815     0.9530     0.9797         0.9534

With an rbf kernel the choice is worth at most 0.0013. With a linear one it is worth
up to 0.0413, and one-vs-one won 2 of 3. The single joint problem is the principled
answer, and it was the best linear option on 0 of 3 datasets.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 15 minutes"
        title={<>Two sides at a time</>}
        intro={<>Everything on this track has had two classes, because an SVM is built to separate
          two: one side of the boundary or the other. Digits have ten. There are two standard ways
          to build a ten-way classifier out of two-way ones, and they differ in how many models
          they fit, what each model is asked, and which class they quietly fail.</>}
        titleSize={42}
      />

      <div className="lesson">
        <p>
          An SVM&apos;s decision function has one output, and its sign is the answer:
        </p>

        <MathBlock>{String.raw`f(x) \;=\; \sum_i \alpha_i\, y_i\, K(x_i, x) \;+\; b`}</MathBlock>

        <p>
          There is no way to read three answers off one sign. So with <M>{String.raw`k`}</M>{" "}
          classes you train several binary SVMs and combine their verdicts. The two standard
          recipes differ in which binary questions they ask.
        </p>

        <p>
          <strong>One-vs-rest</strong> fits <M>{String.raw`k`}</M> models. Model{" "}
          <M>{String.raw`c`}</M> is trained on every point, with class <M>{String.raw`c`}</M> as
          +1 and everything else as −1, and the prediction is the class whose model is most
          enthusiastic:
        </p>

        <MathBlock>{String.raw`\hat y \;=\; \arg\max_{c}\; f_c(x)`}</MathBlock>

        <p>
          <strong>One-vs-one</strong> fits a model for every pair of classes,{" "}
          <M>{String.raw`k(k-1)/2`}</M> of them, each trained only on the points of its two
          classes. The prediction is a round-robin: every pair votes for its winner, and the
          class with the most wins takes it.
        </p>

        <MathBlock>{String.raw`\begin{gathered}
\hat y \;=\; \arg\max_{c}\; v_c(x) \\[6pt]
v_c(x) \;=\; \#\{\, c' \ne c \;:\; f_{c\,c'}(x) > 0 \,\}
\end{gathered}`}</MathBlock>

        <h2>Counting the cost</h2>

        <p>
          Ten classes means ten models one way and forty-five the other, which sounds like an easy
          call. Here is what the two actually cost on standardised digits, with the default rbf
          SVM as the binary machine inside both.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outTwo}</CodeOutput>

        <p>
          One-vs-one fits 4.5 times as many models and does <strong>2.6 times less</strong>{" "}
          solver work, because each of its models sees only about a fifth of the data and an
          SVM&apos;s cost grows faster than its data does. It is also cheaper to predict with:
          libsvm pools the support vectors of all 45 pairs, so a new image is compared with{" "}
          <strong>847</strong> training points rather than <strong>1,942</strong>. Accuracy is
          within 0.0013.
        </p>

        <Callout color={PINK} title="SVC is already one-vs-one">
          <p>
            sklearn&apos;s <code>SVC</code> always trains one-vs-one, whatever you pass. Its{" "}
            <code>decision_function_shape=&apos;ovr&apos;</code> option, which is the default,
            only reshapes the output into one column per class; the models and the labels are
            identical, as the second table shows. If you want real one-vs-rest from a kernel SVM,
            wrap it in <code>OneVsRestClassifier</code>. <code>LinearSVC</code> goes the other
            way: it is one-vs-rest unless told otherwise.
          </p>
        </Callout>

        <h2>The class in the middle</h2>

        <p>
          The two recipes ask different questions, and one of those questions can be impossible.
          Put three classes in a row, A on the left, B in the middle, C on the right, and fit
          linear SVMs.
        </p>

        <PredictPrompt
          prompt="Linear one-vs-rest, three classes in a row. One of the three is going to be classified much worse than the others. Which one, and why?"
          options={[
            "A, because it is fitted first",
            "B, the one in the middle",
            "C, because argmax breaks ties towards later classes",
            "None of them — all three suffer equally",
          ]}
          accent="var(--c-classification)"
          nudge="Think about the model that has to answer 'is this B?' with a single straight line."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Start where it opens: classes in a row, linear kernel, one-vs-rest. Click{" "}
            <em>B vs rest</em> to see that one model on its own, then switch the strategy to
            one-vs-one. Then try the rbf kernel, and the triangle.</>}
          insight={<>Linear one-vs-rest finds only <strong>0.495</strong> of class B, against 0.97
            and 0.985 for its neighbours. Look at <em>B vs rest</em>: its weights are{" "}
            <M>{String.raw`w = (0, 0)`}</M>, one flat score everywhere, &ldquo;rest&rdquo; for every
            spot on the plane. B only wins where A&apos;s and C&apos;s scores are both lower still.
            One-vs-one never asks for that line and finds <strong>0.880</strong> of B. The rbf kernel
            fixes one-vs-rest too (0.865), because a curved boundary can wrap around B. On the
            triangle, where no class is between the other two, all four settings land within a
            point of each other.</>}
        >
          <MultiClassLab />
        </LabFrame>

        <p>
          The same thing, measured over many draws and three spacings:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outMask}</CodeOutput>

        <p>
          The B-vs-rest line says &ldquo;B&rdquo; to <strong>none</strong> of B&apos;s own points in
          all 60 draws. With the classes two units apart, linear one-vs-rest recovers{" "}
          <strong>0.47</strong> of B and one-vs-one <strong>0.84</strong>. Iris shows the effect on
          real data: versicolor sits between the other two species, and it is the one linear
          one-vs-rest loses, 0.856 against one-vs-one&apos;s 0.920. With an rbf kernel the two
          strategies agree to within a point, because the impossible question has become a
          possible one.
        </p>

        <h2>Who claims a point</h2>

        <p>
          Neither recipe guarantees a clean answer. One-vs-rest asks every model &ldquo;is this
          yours?&rdquo;, and nothing makes exactly one of them say yes: in the lab&apos;s linear
          one-vs-rest, the hatched area where no model or several claim a point covers{" "}
          <strong>29.7%</strong> of the plot. One-vs-one can only be unclear when every class wins
          exactly one duel, which covers <strong>0.2%</strong>. That looks like a point for
          one-vs-one. It is less of one than it looks.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outClaims}</CodeOutput>

        <p>
          One-vs-rest&apos;s awkward cases are informative. On points exactly one model claimed it
          is right <strong>99.3%</strong> of the time, and <strong>27 of its 33 mistakes</strong>{" "}
          are points no model claimed, where it had to fall back on whichever score was least
          negative. &ldquo;Nobody says mine&rdquo; is a usable warning.
        </p>

        <p>
          One-vs-one&apos;s vote is not. The winning class won all nine of its duels on 895 of 898
          test images, including <strong>30 of its 33 mistakes</strong>. Of its 45 models, 36 never
          saw the true class at all. They were trained on two classes that are both wrong for this
          image, and they vote anyway. A clean sweep is what one-vs-one produces almost every time,
          right or wrong, so a vote count is a label and not a confidence. Page 18 is about getting
          a real one.
        </p>

        <h2>More classes, and which to pick</h2>

        <p>
          The usual objection to one-vs-one is that <M>{String.raw`k(k-1)/2`}</M> grows like{" "}
          <M>{String.raw`k^2`}</M>. It does. What that objection leaves out is that each of those
          models gets smaller as <M>{String.raw`k`}</M> grows.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outCost}</CodeOutput>

        <p>
          780 models at 40 classes, and still 2.5 times less work than 40 one-vs-rest models,
          which each have to chew through all 2,000 points. The ratio barely moves from 3 classes
          to 40. On accuracy, the kernel decides whether the choice matters. With rbf the two
          strategies are within <strong>0.0013</strong> on all three datasets. With a linear kernel
          they can be <strong>four points</strong> apart, and one-vs-one won two of three. Crammer
          and Singer&apos;s formulation, which solves one joint problem over all classes instead of
          many binary ones, is the elegant answer and was not the best linear option on any of
          them.
        </p>

        <h2>Where this leaves you</h2>

        <p>
          With a kernel SVM, one-vs-one is the default for good reasons: cheaper to train, cheaper
          to predict, and as accurate. With a linear SVM the choice is real, and one-vs-rest has a
          blind spot for any class that sits between others. When you need to know how sure the
          model is, neither the argmax nor the vote tells you directly, though one-vs-rest&apos;s
          &ldquo;nobody claimed it&rdquo; is a better warning than one-vs-one&apos;s vote count.
        </p>

        <Quiz
          questions={[
            {
              q: <>With 10 classes, one-vs-one fits 45 models and one-vs-rest fits 10. On digits, which did less solver work?</>,
              options: [
                "One-vs-rest, because it fits fewer models",
                "One-vs-one, because each of its models sees only two classes' points and SVM cost grows faster than the data",
                "They did the same work",
                "It depends only on the number of support vectors",
              ],
              answer: 1,
              explain: (
                <>
                  Each one-vs-one model trains on 351 to 365 images rather than 1,797. Summed over
                  all models, one-vs-one did 2.6 times less work.
                </>
              ),
            },
            {
              q: <>You fit <code>SVC(decision_function_shape=&apos;ovr&apos;)</code> on a three-class problem. Which strategy did it train?</>,
              options: [
                "One-vs-rest",
                "One-vs-one — the option only reshapes the decision function's output",
                "Crammer-Singer",
                "A single three-class model",
              ],
              answer: 1,
              explain: (
                <>
                  SVC always trains one-vs-one. The shape option changes how the scores are
                  presented, not the models: the labels were identical on all three datasets.
                </>
              ),
            },
            {
              q: <>Why does linear one-vs-rest lose the middle class when three classes lie in a row?</>,
              options: [
                "The middle class has fewer points",
                "No single line puts the middle class on one side and both neighbours on the other, so its model says 'rest' everywhere",
                "The argmax always prefers the outer classes",
                "The middle class has the largest margin",
              ],
              answer: 1,
              explain: (
                <>
                  B-vs-rest said &ldquo;B&rdquo; to none of B&apos;s points in any of 60 draws. B only
                  wins where both neighbours&apos; scores are lower still. One-vs-one asks only
                  pairwise questions, each of which a line can answer.
                </>
              ),
            },
            {
              q: <>A one-vs-one SVM predicts a digit with the winning class taking all nine of its duels. What does that tell you?</>,
              options: [
                "The prediction is almost certainly right",
                "Very little — the winner swept its duels on 895 of 898 test images, including 30 of the 33 mistakes",
                "That the image is far from every boundary",
                "That one-vs-rest would have predicted the same",
              ],
              answer: 1,
              explain: (
                <>
                  36 of the 45 models never saw the true class and vote anyway, so a clean sweep is
                  the normal outcome whether or not the answer is right. One-vs-rest&apos;s
                  &ldquo;no model claimed it&rdquo; was the more useful warning: 27 of its 33
                  mistakes were there.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "Choosing C and gamma",
          href: "/learn/support-vector-machines/choosing-c-and-gamma",
        }}
        next={{
          label: "Probabilities from an SVM",
          href: "/learn/support-vector-machines/probabilities-from-an-svm",
        }}
      />
    </article>
  );
}
