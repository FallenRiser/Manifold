import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { CodeOutput } from "@/components/CodeOutput";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import LandmarkLab from "@/components/labs/LandmarkLab";

const PINK = "var(--c-classification)";

export const metadata = {
  title: "When to use an SVM — Manifold",
  description:
    "The practical end of the track: rare classes, data too large for an exact kernel, and a checklist for deciding when an SVM is the right model, every item backed by a measurement.",
};

const outImbalance = `Ten features, five informative, 2,000 points to train on and 2,000 to test, the
default rbf SVM, standardised. The rare class is 5% or 1% of the data. Ten draws,
averaged. 'found' is the share of the rare class the model catches (recall); 'right
when it says so' is the share of its rare-class calls that are correct (precision):

    rare                          accuracy    found    right when it       balanced
                                                             says so       accuracy
      5% default                    0.9661   0.4030           0.9827         0.7012
      5% class_weight='balanced'     0.9257   0.7521           0.4317         0.8441
      1% default                    0.9858   0.0892           0.4833         0.5446
      1% class_weight='balanced'     0.9304   0.3445           0.0944         0.6421

At 1% the default model scores 0.9858 accuracy and finds 9% of the rare class.
Always answering 'common', with no model at all, would score 0.9847. The SVM has
learned that 'common' is nearly always right, which is what minimising the hinge
loss over mostly-common points rewards. class_weight='balanced' multiplies C for each
class by the inverse of its frequency, so the rare class's slack, summed, costs as
much as the common class's. It finds 34% of the rare class, and pays in precision:
only 9% of its rare-class calls are right, and accuracy falls to 0.9304. Neither is
'better'. Which one you want depends on what a missed rare case costs against a
false alarm -- and accuracy is the wrong number to decide it with.`;

const outApprox = `An exact kernel SVM needs the similarity of every pair it touches. The Nystroem
method picks m landmark points, measures every point's similarity to the landmarks
only, and fits a LINEAR SVM on those m numbers. covertype, two classes, standardised,
gamma='scale', the same 5,000-point test set as page 19:

        n                            accuracy  similarities computed
                                                      per prediction
   16,000 exact rbf SVM                0.8050                  8,133
          Nystroem, 100 landmarks      0.7834                    100
          Nystroem, 300 landmarks      0.7976                    300
          Nystroem, 1000 landmarks     0.8124                  1,000
          random forest                0.8722                     --
   64,000 Nystroem, 100 landmarks      0.7790                    100
          Nystroem, 300 landmarks      0.8072                    300
          Nystroem, 1000 landmarks     0.8282                  1,000
          random forest                0.9188                     --

At 16,000 points, 1,000 landmarks score 0.8124 against the exact SVM's 0.8050, while
each prediction compares against 1,000 points instead of 8,133 support vectors. The
approximation does not have to be worse: it is a different model -- a linear SVM on
1,000 similarity features, with its own C -- and here it does slightly better. It
also reaches sizes the exact solver does not: at 64,000 points, 1,000 landmarks
score 0.8282.

It does not change what the model is, though. The forest scores 0.9188 at 64,000
points. Approximation removes the SVM's cost problem, not its fit to the data.`;

const outLandmarks = `The same idea on the moons, small enough to see. 200 points to train on, 400 to
test, gamma = 1, C = 1. The landmarks are the first m training points; the kernel the
SVM sees is k_L(x)^T K_LL^-1 k_L(z), built from each point's m landmark similarities.
Ten draws of the data:

     landmarks     accuracy   worst draw         similarities per
                                                       prediction
             2       0.7227       0.6525                        2
             3       0.7660       0.6575                        3
             5       0.8088       0.7100                        5
            10       0.9478       0.8725                       10
            20       0.9850       0.9550                       20
            50       0.9853       0.9525                       50
         exact       0.9853       0.9525          30-43 (the SVs)

From 20 landmarks the approximation is within half a point of the exact SVM on
average, and it asks for 20 similarities per prediction where the exact model asks
for one per support vector. The moons are two curves in a plane; a handful of well
placed reference points describe them. Data with more going on needs more landmarks:
covertype needed 1,000 to match its exact model.`;

export default function Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: PINK }, { label: "Core", color: "var(--c-fundamentals)" }]}
        time="about 14 minutes"
        title={<>When to use an SVM</>}
        intro={<>Nineteen pages built the SVM from a single idea, a boundary with room to spare, up
          to a tuned, calibrated, multi-class model. This last page covers two situations you will
          meet in practice, rare classes and data too large for an exact kernel, and then collects
          the track&apos;s measurements into a checklist for deciding when an SVM is the right
          model to reach for.</>}
        titleSize={42}
      />

      <div className="lesson">
        <h2>When one class is rare</h2>

        <p>
          Fraud, faults, disease: in a lot of real problems the class you care about is the rare
          one. The hinge loss sums slack over every training point, so when 99 points in 100 are
          common, the cheapest boundary is one that serves the common class and gives up on the
          rest.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outImbalance}</CodeOutput>

        <p>
          At 1% the default SVM scores <strong>0.9858</strong> accuracy and catches{" "}
          <strong>9%</strong> of the rare class. Always answering &ldquo;common&rdquo;, with no
          model at all, would score about as well, which is why accuracy is the wrong number here.{" "}
          <code>class_weight=&apos;balanced&apos;</code> scales each class&apos;s{" "}
          <M>{String.raw`C`}</M> by the inverse of its frequency. It catches{" "}
          <strong>34%</strong>, but only 9% of its rare-class alarms are real. Neither setting is
          correct in general. The choice depends on what a miss costs compared with a false alarm,
          and it is worth making on purpose rather than by default.
        </p>

        <h2>When the data is large</h2>

        <p>
          Page 19 found the exact SVM&apos;s cost growing much faster than its data: at 16,000
          points, half the training set was support vectors and every prediction compared against
          8,133 of them. The standard way out is to approximate the kernel. Pick{" "}
          <M>{String.raw`m`}</M> landmark points, describe every point only by its similarity to
          those landmarks, and fit a linear SVM on those <M>{String.raw`m`}</M> numbers. This is
          the Nyström method.
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outApprox}</CodeOutput>

        <p>
          With 1,000 landmarks the approximation scores <strong>0.8124</strong>, slightly better
          than the exact SVM&apos;s 0.8050, while each prediction needs 1,000 similarities instead
          of 8,133. It also scales to 64,000 points. But the forest is still far ahead at every
          size. Approximation fixes the SVM&apos;s cost, not whether it suits the data.
        </p>

        <PredictPrompt
          prompt="The moons need about 40 support vectors for the exact SVM. How many landmarks do you think the approximation needs before it matches the exact model on new points?"
          options={["2 or 3", "About 20", "About 40, one per support vector", "All 200 training points"]}
          accent="var(--c-classification)"
          nudge="The landmarks do not have to sit on the boundary. They only have to describe where things are."
        />

        <LabFrame
          accent={PINK}
          tryThis={<>Start at 10 landmarks, then step down to 2 and back up to 50, comparing the
            shaded boundary with the dashed exact one. The rings are the landmarks, simply the
            first <M>{String.raw`m`}</M> training points.</>}
          insight={<>With 2 landmarks the model knows each point only by two similarities, and it
            scores <strong>0.65</strong>. At 10 it reaches 0.9825, and at 20 it scores{" "}
            <strong>0.985</strong>, the same as the exact SVM, from 20 similarities per prediction
            where the exact model needs one for each of its 40 support vectors. The landmarks are
            not special points on the boundary. They are a small set of reference positions, and
            describing every point relative to them is enough to recover the curve.</>}
        >
          <LandmarkLab />
        </LabFrame>

        <p>
          Over ten draws of the data rather than the lab&apos;s one:
        </p>

        <CodeOutput source="scripts/svm_cases.py">{outLandmarks}</CodeOutput>

        <h2>The checklist</h2>

        <p>
          Everything the track measured, as questions to ask of a dataset before choosing a
          model. Each points to the page that measured it.
        </p>

        <Callout color={PINK} title="Reach for an SVM when">
          <ul>
            <li>
              <strong>The features are informative and you can scale them.</strong> An rbf SVM
              weighs every feature equally in its distances. Unscaled, one feature can take 99% of
              the say (page 15). Five columns of pure noise cost it at least twice what they cost
              a forest, and tuning did not help (page 19).
            </li>
            <li>
              <strong>The data is small to medium.</strong> Its wins over a forest and logistic
              regression came on datasets of 178 to 1,797 rows: three of the six compared on
              page 19. Beyond that, the exact solver&apos;s cost climbs steeply, and a Nyström
              approximation is the way to keep it (this page).
            </li>
            <li>
              <strong>The boundary is curved, or you do not know.</strong> On a truth that really
              is a line, the rbf SVM never trailed a linear SVM by more than 0.01, while a straight
              line lost 2.3 points on curved data (page 19).
            </li>
            <li>
              <strong>You will scale, and then trust the defaults.</strong> On standardised data,
              a 49-cell grid search gained at most 0.0018 over <M>{String.raw`C = 1`}</M> and{" "}
              <code>gamma=&apos;scale&apos;</code>, and the grid&apos;s own score overstated
              itself by more than that (page 16).
            </li>
          </ul>
        </Callout>

        <Callout color="var(--c-trees)" title="Think twice when">
          <ul>
            <li>
              <strong>Many columns probably carry nothing.</strong> A forest picks its features and
              an SVM cannot (page 19).
            </li>
            <li>
              <strong>There is a lot of data, and more is coming.</strong> On covertype the forest
              kept gaining with every doubling of the data, and the SVM fell behind (page 19).
            </li>
            <li>
              <strong>You need probabilities first.</strong> An SVM&apos;s scores need Platt
              scaling, fitted on held-out scores with stratified folds (page 18). Logistic
              regression gives probabilities directly and won the breast_cancer comparison
              outright.
            </li>
            <li>
              <strong>One class is rare.</strong> This is not a reason to avoid an SVM, but the
              default optimises the wrong thing, so set <code>class_weight</code> deliberately and
              judge the model on recall and precision, not accuracy (this page).
            </li>
          </ul>
        </Callout>

        <p>
          The idea underneath all of this is the one the track started with. An SVM keeps only
          the points that sit near the boundary and ignores the rest. That makes it compact and
          robust when the classes are well separated in a sensible metric. It makes it expensive
          when most points are near the boundary, and fragile when the metric is dominated by
          features that do not matter. Knowing which of those describes your data is most of the
          decision.
        </p>

        <Quiz
          questions={[
            {
              q: <>With 1% positives, the default SVM scores 0.9858 accuracy. Why is that not good news?</>,
              options: [
                "Because the test set was too small",
                "Because always predicting the common class scores about the same, and the model catches only 9% of the rare class",
                "Because the SVM did not converge",
                "Because accuracy above 0.98 means overfitting",
              ],
              answer: 1,
              explain: (
                <>
                  The hinge loss over mostly-common points rewards serving the common class. Recall
                  and precision on the rare class are the numbers that show what happened.
                </>
              ),
            },
            {
              q: <>What does the Nyström approximation change about an SVM?</>,
              options: [
                "It makes the boundary linear",
                "It replaces the kernel with one built from each point's similarities to m landmarks, so a prediction costs m similarities instead of one per support vector",
                "It removes the need to scale features",
                "It makes the SVM output probabilities",
              ],
              answer: 1,
              explain: (
                <>
                  On covertype, 1,000 landmarks matched the exact model at 16,000 points, with 1,000
                  similarities per prediction instead of 8,133.
                </>
              ),
            },
            {
              q: <>A dataset has 300 columns, most of which you suspect are irrelevant. Which model does the track&apos;s evidence favour?</>,
              options: [
                "An rbf SVM, tuned carefully",
                "A random forest, which chooses its features per split",
                "A linear SVM, because there are many features",
                "It makes no difference",
              ],
              answer: 1,
              explain: (
                <>
                  Irrelevant columns dilute every distance an rbf kernel measures, and tuning did not
                  recover it. Even on a truth that was exactly a line, the forest won once 495
                  irrelevant columns were added.
                </>
              ),
            },
            {
              q: <>Why is scaling the features the first thing on the checklist?</>,
              options: [
                "Because sklearn raises an error on unscaled data",
                "Because an rbf kernel compares distances, and without scaling the feature with the largest units dominates them",
                "Because it makes training deterministic",
                "Because it reduces the number of support vectors to zero",
              ],
              answer: 1,
              explain: (
                <>
                  On breast_cancer, two area features carried 99% of the squared distance before
                  scaling (page 15), and standardising lifted accuracy from 0.906 to 0.953.
                </>
              ),
            },
          ]}
        />
      </div>

      <PrevNext
        prev={{
          label: "SVM vs logistic regression vs forest",
          href: "/learn/support-vector-machines/svm-vs-logistic-regression-vs-forest",
        }}
        next={{
          label: "Capstone · Message routing",
          href: "/learn/message-routing-capstone",
        }}
      />
    </article>
  );
}
