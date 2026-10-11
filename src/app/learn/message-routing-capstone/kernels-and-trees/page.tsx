import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import KernelReachLab from "@/components/labs/KernelReachLab";
import { TreePath } from "@/components/figures/routing/TreeFigures";

export const metadata = {
  title: "Kernels and trees — Manifold",
  description:
    "Four models that do not draw a straight line through the words, each with its own search on the harness. None reaches the linear SVM: the kernel does best when it is nearly straight, and a forest's tree asks a post hundreds of questions, nearly all about words it does not contain.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const SVM = "/learn/support-vector-machines";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outKernelsTrees = `the audited view; the harness as before, scored on its 3966 new threads. Every model reads the
harness's TF-IDF. Each family searches its own settings on the harness, and the choice is priced
fold by fold, as the other rungs' were. Share routed right on the harness:

nearest neighbours: the forum with the most votes among the k earlier posts most similar to the
post (cosine), each vote worth its similarity or one each
  k                1       3       5      10      20      30      50     100
  similarity  0.6952  0.7204  0.7360  0.7572  0.7683  0.7680  0.7693  0.7600
  one each    0.6952  0.6969  0.7179  0.7383  0.7463  0.7496  0.7504  0.7363

the kernel SVM (scikit-learn's SVC: hinge loss, one classifier per pair of forums), RBF kernel
exp(-gamma |a - b|^2), by gamma (rows) and C (columns)
  gamma            1       3      10      30     100
  0.03        0.3210  0.7383  0.8016  0.8094  0.8058
  0.1         0.7358  0.8001  0.8101  0.8084  0.8086
  0.3         0.7900  0.8137  0.8129  0.8129  0.8129
  1           0.8001  0.8101  0.8096  0.8096  0.8096
  3           0.6952  0.7065  0.7068  0.7068  0.7068
  10          0.0567  0.0605  0.0605  0.0605  0.0605
  a straight line in the same solver (the linear kernel), C = 0.3, 1, 3, 10: 0.7796  0.8116  0.8064  0.8051

a random forest, by the words each split may choose from (rows) and the trees (columns), with
the words its 2000 trees ask about between them
  words          100     250     500    1000    2000   words asked
  1           0.7022  0.7587  0.7763  0.7887  0.7978        72,934
  3           0.6979  0.7526  0.7794  0.7892  0.7970        71,699
  10          0.6911  0.7539  0.7746  0.7819  0.7940        68,363
  30          0.7010  0.7547  0.7738  0.7811  0.7827        65,314
  100         0.7209  0.7557  0.7675  0.7726  0.7794        61,844
  297 (sqrt)  0.7264  0.7494  0.7572  0.7592  0.7645        57,831

boosted trees (LightGBM: a tree per forum per round), by setting (rows) and rounds (columns), with
the words their trees split on after 200 rounds
                                                            25      50     100     200   words used
  LightGBM's defaults: step 0.1, leaves of 20+ posts    0.7254  0.7421  0.7438  0.7421        3,225
  step 0.05, leaves of 5+ posts, a third of the words   0.7602  0.7683  0.7809  0.7829        6,657
  step 0.02, leaves of 5+ posts, a third of the words   0.7663  0.7766  0.7827  0.7859        7,127

each family's search priced fold by fold (chosen on four folds, scored on the fifth); points (95%)
                           chosen   against the linear SVM      against the bar
  the bar (naive Bayes)    0.8328
  the linear SVM           0.8222                               -1.06 (-1.97, -0.10)
  the kernel SVM (RBF)     0.8124   -0.98 (-1.77, -0.20)        -2.04 (-3.08, -0.96)
  nearest neighbours       0.7663   -5.60 (-6.68, -4.54)        -6.66 (-7.79, -5.55)
  a random forest          0.7940   -2.82 (-3.81, -1.84)        -3.88 (-4.94, -2.87)
  boosted trees            0.7859   -3.63 (-4.66, -2.67)        -4.69 (-5.85, -3.53)
  the kernel SVM against a straight line in its own solver (chosen the same way, 0.8116): +0.08 (-0.35, +0.48)

H1: each family below the linear SVM, the tree models by more than 3 points:
  the kernel SVM (RBF) held; nearest neighbours held; a random forest not settled; boosted trees not settled

the later new threads (report only): each pick fitted on all 11314 earlier posts, scored on the 2527
  the linear SVM 0.8168, the bar 0.8219
  the kernel SVM (RBF)     0.8025   against the linear SVM -1.42 (-2.33, -0.55)
  nearest neighbours       0.7626   against the linear SVM -5.42 (-6.73, -4.08)
  a random forest          0.7934   against the linear SVM -2.33 (-3.48, -1.15)
  boosted trees            0.7859   against the linear SVM -3.09 (-4.27, -1.90)`;

const outKernelReach = `each harness new thread's squared distance to the training posts of its fold (TF-IDF rows have
length one: 0 is the same words in the same proportions, 2 is no word in common)
  to its nearest training post: median 1.534 (cosine 0.233); 10th percentile 1.118, 90th 1.685
  to a typical training post (its median one): median 1.937 (cosine 0.032)
  as distances: the nearest 1.24, a typical one 1.39, the farthest possible 1.41

the RBF kernel exp(-gamma d^2) by gamma: the distance at which it halves, sqrt(ln 2 / gamma); how
many times a typical post's weight the nearest post gets (median over new threads); and at
gamma's best C on the harness, the share of training posts that are support vectors, the share
routed right, and the share routed as the linear SVM routes them
  gamma   halves at  nearest counts  best C  support vectors  right    as the linear SVM
  0.03    4.81       1.01x           30      0.881            0.8094   0.905
  0.1     2.63       1.04x           10      0.889            0.8101   0.908
  0.3     1.52       1.13x           3       0.911            0.8137   0.914
  1       0.83       1.49x           3       0.971            0.8101   0.910
  3       0.48       3.31x           10      0.998            0.7068   0.779
  10      0.26       53.85x          3       0.998            0.0605   0.063
  a straight line in the same solver (C=1): 0.8116, 0.910 as the linear SVM, support vectors 0.877
  nearest neighbours: the single nearest post 0.6952; the best k (50, votes by similarity) 0.7693`;

const outTreeQuestions = `the harness's forest (1 word per split, 2000 trees) fitted on all 11314 earlier posts, routing the
2527 later new threads (each tree grown on a bootstrap draw of the posts)
  each tree: 6,425 leaves, and a longest path of 1560 questions (medians over the trees; the longest
  path runs from 819 to 2209)
  a new thread's way to its leaf: median 639.6 questions per tree; 0.4% of them about a word the post
  contains (median); the post's own words: median 62; asked about by at least one of the 2000 trees: 100.0%
  questions about the post's words per tree: median 2.7

share routed right by the post's length in words (the router's view)
  0 to 39        692 posts   the forest 0.715   the linear SVM 0.751   -3.61 (-6.21, -1.01)
  40 to 159     1471 posts   the forest 0.829   the linear SVM 0.840   -1.16 (-2.65, +0.27)
  160 or more    364 posts   the forest 0.799   the linear SVM 0.846   -4.67 (-7.42, -1.92)

one later new thread (3041, rec.motorcycles, 38 words) on its way through the first tree: 569 questions, 5 about
  a word it contains (is, not, them, they, to); its leaf: talk.politics.mideast
  the forest's 2000 trees: rec.motorcycles 10.9%, rec.sport.baseball 9.3%, rec.autos 7.6%; the linear SVM: rec.motorcycles`;

export default function KernelsAndTreesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 14 minutes"
        title={<>Kernels and trees: the fourth rung</>}
        intro={<>
          Every rung so far draws a straight boundary through the words. Four models that bend it get a search of
          their own, and the first prediction in the register gets its verdict.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={17} total={27}>
          Does a boundary that bends route new threads better than a straight one?
        </ArticleOpener>

        <h2>Four models that bend</h2>
        <p>
          Naive Bayes, logistic regression and the linear SVM differ in how they set their weights, but they route
          the same way: each forum has a weight for every word, and a post goes to the forum whose weights add up
          highest over the words it contains. Between any two forums that boundary is flat. The four models on this
          page do not route that way.
        </p>
        <ul>
          <li>
            <strong>Nearest neighbours</strong> draws no boundary at all. A new thread goes where the earlier
            posts most like it went (the <Link href="/learn/k-nearest-neighbors" style={link}>k-NN track</Link>).
          </li>
          <li>
            <strong>The kernel SVM</strong> keeps the SVM&rsquo;s machinery but measures how alike two posts are with
            the <Link href={`${SVM}/the-kernel-trick`} style={link}>RBF kernel</Link>, which lets the boundary curve
            around groups of posts.
          </li>
          <li>
            <strong>A random forest</strong> grows hundreds of trees, each a chain of yes-or-no questions about one
            word at a time, and lets them vote (the{" "}
            <Link href="/learn/random-forests" style={link}>random forests track</Link>).
          </li>
          <li>
            <strong>Boosted trees</strong> grow small trees one after another, each fitted to what the trees before
            it still get wrong (the <Link href="/learn/boosting" style={link}>boosting track</Link>).
          </li>
        </ul>
        <p>
          H1, the first entry in the register on <Link href={`${R}/research-questions`} style={link}>page 5</Link>,
          bet that none of them beats the linear SVM on new threads, and that the two tree models trail it by more
          than three points. Each family gets its own search on the harness, reading the same TF-IDF: k and how
          the votes count; gamma and C; how many words each split may choose from and how many trees; step size,
          leaf size and rounds. Each family&rsquo;s choice is then priced fold by fold, as every rung&rsquo;s has
          been.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Each family gets its own search, priced fold by fold. Which comes closest to the linear SVM&rsquo;s 0.822?</>}
          options={["Nearest neighbours", "The kernel SVM", "A random forest", "Boosted trees"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outKernelsTrees}</CodeOutput>

        <p>
          None of them gets there. The kernel SVM comes closest at 0.812, then the forest at 0.794, boosted trees at
          0.786 and nearest neighbours at 0.766. All four are below the linear SVM by margins the harness can settle,
          and further below the bar. Fitted on every earlier post and scored on the later new threads, they land in
          the same order, every one of them below the linear SVM there too.
        </p>
        <p>
          Two things inside the tables matter for the rest of this page. The kernel SVM does best at the gentle end
          of its gamma dial and falls apart past gamma 1: 0.707 at gamma 3, and 0.06 at gamma 10, worse than
          sending every post to one forum. And the forest gets better as each split is allowed fewer words, from
          0.765 at scikit-learn&rsquo;s default of about 300 to 0.798 at one. With one word per split a tree does
          not choose its questions at all. scikit-learn draws words at random until it finds one that occurs in
          some of the posts at that node, and splits on it. Letting every split pick the best of 300 words makes
          the trees ask the same questions, and a forest gains only from{" "}
          <Link href="/learn/random-forests/decorrelating-the-trees" style={link}>trees that disagree</Link>.
        </p>
        <p>
          Boosted trees needed help to get this far. At LightGBM&rsquo;s defaults a leaf must hold 20 posts, so a
          word has to appear in 20 posts before a tree can use it, and the model routes 0.744. Smaller steps and
          leaves of five posts bring it to 0.786.
        </p>

        <Settled id="H1">
          Every family routes new threads worse than the linear SVM, each by a margin the harness can settle, so
          the first half of H1 holds. The second half cannot be settled. The forest trails by 2.82 points and the
          boosted trees by 3.63, but their intervals run from 1.84 to 3.81 points and from 2.67 to 4.66: both
          straddle the three-point line. The forest&rsquo;s estimate falls inside the line H1 drew, the boosted
          trees&rsquo; outside it, and 3,966 new threads cannot tell either from three.
        </Settled>

        <h2>Why the kernel cannot help</h2>
        <p>
          The kernel SVM&rsquo;s lost point is not the kernel&rsquo;s. The same solver with a straight line, the
          linear kernel, loses the same point, and the RBF kernel against that straight line is level, +0.08. The
          point goes to the way scikit-learn&rsquo;s <code>SVC</code> splits twenty forums into problems: one for{" "}
          <Link href={`${SVM}/multi-class-one-vs-one-and-one-vs-rest`} style={link}>each pair of forums</Link>, 190
          in all, each with the plain hinge loss, where <code>LinearSVC</code> fits one per forum against the rest.
        </p>
        <p>
          The kernel itself can do only one thing: count the earlier posts close to a new thread for more than the
          ones far from it. Gamma sets how fast that weight falls with distance, and the{" "}
          <Link href={`${SVM}/kernels-you-will-actually-use`} style={link}>SVM track</Link> read it as a length to
          hold against the data. So measure how far apart the posts are.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outKernelReach}</CodeOutput>

        <p>
          Nothing is near anything. Two posts with no word in common sit 1.41 apart, the farthest TF-IDF allows.
          A typical earlier post sits 1.39 from a new thread, and the nearest of all 9,000 sits 1.24 away, sharing a
          cosine of 0.23 with it. This is the{" "}
          <Link href="/learn/k-nearest-neighbors/the-curse-of-dimensionality" style={link}>curse of dimensionality</Link>{" "}
          measured on the posts: 90,000 words, and a new thread uses a median of 62 of them.
        </p>
        <p>
          At the gamma the harness picks, 0.3, the kernel&rsquo;s weight would halve only at a distance of 1.52,
          farther than any two posts can be. The nearest post counts 1.13 times a typical one, and over the
          distances that occur the kernel is nearly a straight function of the dot product. That is why the kernel
          SVM routes 91.4% of new threads exactly as the linear SVM does. Raise gamma until the nearest post counts
          for clearly more, and the kernel stops seeing the rest. At gamma 3 the nearest post counts 3.3 times a
          typical one, 99.8% of the training posts become support vectors, and the share right falls to 0.707. At gamma
          10 the kernel sees no other post at all and routes 6% right. Between staying straight and seeing nothing,
          there is no setting where the curve helps.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start at the harness&rsquo;s gamma, 0.3, and watch the two dots on the curve as you slide gamma up to 10. Then step up to the first gamma where the nearest post counts for more than twice a typical one, and read the share routed right there.</>}
          insight={<>
            The nearest earlier post is almost as far from a new thread as a typical one. A gamma small enough to
            reach the typical post treats every post alike, which is a straight line; a gamma large enough to tell
            the nearest from the typical has fallen to near zero for both, and the kernel SVM has nothing left to
            route with.
          </>}
        >
          <KernelReachLab />
        </LabFrame>

        <p>
          Nearest neighbours runs into the same distances from the other side. It trusts the nearest posts
          completely, and the single nearest earlier post routes a new thread right 69.5% of the time. Letting the
          fifty nearest vote, each by its similarity, brings it to 0.769: closer to a vote of the whole forum than
          to a neighbour&rsquo;s opinion.
        </p>

        <h2>What a tree asks a post</h2>
        <p>
          H1&rsquo;s reason was about the trees. A post uses a handful of the 90,000 words; a linear model adds up
          the evidence of every word it contains at once, while a tree asks about one word per split. So follow the
          forest the harness picked, one word per split and 2,000 trees, as it routes the later new threads, and
          count what its trees ask each post.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>On its way to a leaf, a tree asks a post hundreds of questions, each about one word. What share of them are about a word the post contains?</>}
          options={["Most of them", "About half", "Fewer than one in a hundred"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outTreeQuestions}</CodeOutput>

        <p>
          Fewer than one in two hundred. Grown on 11,314 posts, each tree ends in 6,425 leaves, and its longest
          path asks 1,560 questions. A new thread passes through a median of 640 questions on its way to a leaf,
          and 0.4% of them, about three, are about a word it contains. Every other question asks about a word the
          post lacks, and the answer is no. Between them the 2,000 trees ask about every word of a typical post, but
          each tree routes it on about three of them. The linear SVM adds up all 62 at once.
        </p>

        <TreePath />

        <p>
          The motorcycle post above shows what that does to one tree. Of its 569 questions, the only ones about
          words in the post are about <em>they</em>, <em>is</em>, <em>not</em>, <em>to</em> and <em>them</em>, and
          the tree files a question about scratched paint in talk.politics.mideast. The forest gets the post right,
          but by a thin vote: 10.9% of its trees say rec.motorcycles, 9.3% rec.sport.baseball. Trees that each read
          a few words recover by voting 2,000 times, and that takes the forest to within about three points of a
          model that reads every word once.
        </p>
        <p>
          The forest comes closest on posts of 40 to 159 words, where the two are level. On posts of 160 words or
          more, where the linear SVM has the most words to add up, it leads by a settled 4.67 points, and on posts
          under 40 words by a settled 3.61.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>Every model that bends routes new threads worse than the linear SVM, and all of them worse than the bar. What does act 5 do next?</>}
          options={[
            {
              label: "Use the kernel SVM: it is within a point of the linear SVM",
              verdict: "miss",
              response: <>It is a settled point below the linear SVM and two below the bar, and against a straight
                line in its own solver it adds 0.08 points. At its best it is a linear model with a different
                solver.</>,
            },
            {
              label: "Search the trees further: more trees, more rounds",
              verdict: "miss",
              response: <>The forest&rsquo;s search already ran to the end of its dial, one word per split, the least
                a tree can choose. From its 1,000th tree to its 2,000th it gained 0.9 points; to reach the bar it
                would need another 3.9.</>,
            },
            {
              label: "Keep the bar, and change what the models read",
              verdict: "best",
              response: <>The bar stays complement naive Bayes. Every rung of act 5 has changed the model and kept the
                words, and the biggest gains on record came from changing the numbers a model reads: IDF on page 7
                and each post&rsquo;s length normalised on page 14, three to four points each. The next two pages
                change the features.</>,
            },
          ]}
        />

        <p>
          So the fourth rung ends where <Link href={`${R}/words-into-numbers`} style={link}>page 7</Link> pointed:
          with 90,000 words and a few dozen per post, every post sits about as far from every other, and a
          straight boundary over all the words is the model that fits that shape. Nothing that bends beats it, and
          the bar stays complement naive Bayes. The next page changes what the models read: the quoted text and the
          sender&rsquo;s history that act 3 set aside, tested on the harness. Then come pretrained embeddings.
        </p>

        <Callout color={POST} title={<>Measure the distances before the flexible model</>}>
          A kernel and a nearest-neighbour model both lean on what is close. Before tuning either, compute each
          test record&rsquo;s distance to its nearest training record and to a typical one. When the two are nearly
          equal, as they are for text, there is nothing close for the flexible model to lean on.
        </Callout>

        <Followup>
          Take a dataset of your own with many sparse features: text, purchase histories, diagnosis codes. Compute
          each test record&rsquo;s distance to its nearest and to its median training record. Fit an RBF SVM beside
          the linear kernel in the same solver, and a random forest at its default <code>max_features</code> and at
          1. If the forest improves as its splits choose less, and the kernel never beats the straight line, your
          data has the shape these posts have.
        </Followup>

        <SigRule n={16}>
          <strong>Bend the boundary only where the data has neighbours.</strong> When a record&rsquo;s nearest
          neighbour is nearly as far away as a typical record, a kernel either stays straight or sees nothing, and
          a tree routes on the features a record lacks.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/linear-svm`, label: <>← Linear SVM</> }}
          next={{ href: `${R}/better-features`, label: <>Next up · Better features →</> }}
        />
      </div>
    </article>
  );
}
