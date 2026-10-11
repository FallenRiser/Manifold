import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import SenderHistoryLab from "@/components/labs/SenderHistoryLab";
import { PiecesPair } from "@/components/figures/routing/PiecesFigures";

export const metadata = {
  title: "Better features — Manifold",
  description:
    "The models stay and what they read changes: pairs of words, pieces of words, the subject, the quoted text, and the sender's history. Pieces help the senders the router has never met, much of it by reading back a one-letter word the tokenizer threw away; the history helps the senders it has met, and costs the posts that go somewhere new.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outFeatures = `the audited view; the harness as before, scored on its 3966 new threads, 45.4% of them from a sender
met in the fold's training posts (the later new threads: 36.5%). Each reading is added to the
words and tried on two models, each with its own search: alpha 0.001 to 0.3 for naive Bayes; C from
0.3, 1, 3 for the SVM, a step further while the best C sits at an end. Each choice is priced fold by
fold. Share routed right, then the change against the same model reading the words, in points (95%):

the bar's model (complement naive Bayes)     columns   right    all new threads
  the words, as before                        90,893   0.8328   (senders met 0.8746, new senders 0.7981)
  + pairs of neighbouring words              809,697   0.8409   +0.81 (+0.03, +1.64)
      senders met +1.22 (+0.28, +2.28), new senders +0.46 (-0.74, +1.71)
  + pieces of words, 2 to 5 characters       461,863   0.8424   +0.96 (+0.28, +1.59)
      senders met +0.11 (-0.61, +0.89), new senders +1.66 (+0.69, +2.68)
  + the subject counted again                 97,270   0.8361   +0.33 (-0.28, +0.93)
      senders met +0.06 (-0.83, +0.89), new senders +0.55 (-0.32, +1.43)
  + the quoted text                           94,918   0.8298   -0.30 (-0.81, +0.20)
      senders met -0.06 (-0.78, +0.67), new senders -0.51 (-1.20, +0.23)
  + pairs and pieces                       1,183,226   0.8477   +1.49 (+0.76, +2.22)
      senders met +1.11 (+0.22, +2.00), new senders +1.80 (+0.65, +2.91)
  + all four                               1,296,856   0.8550   +2.22 (+1.46, +2.95)
      senders met +2.22 (+1.22, +3.22), new senders +2.22 (+1.06, +3.33)

the linear SVM                               columns   right    all new threads
  the words, as before                        90,893   0.8222   (senders met 0.8640, new senders 0.7874)
  + pairs of neighbouring words              809,697   0.8296   +0.73 (+0.15, +1.31)
      senders met +0.55 (-0.28, +1.39), new senders +0.88 (+0.00, +1.76)
  + pieces of words, 2 to 5 characters       461,863   0.8381   +1.59 (+0.98, +2.19)
      senders met +0.33 (-0.44, +1.11), new senders +2.63 (+1.71, +3.56)
  + the subject counted again                 97,270   0.8296   +0.73 (+0.13, +1.36)
      senders met +0.83 (-0.11, +1.78), new senders +0.65 (-0.18, +1.48)
  + the quoted text                           94,918   0.8301   +0.78 (+0.25, +1.31)
      senders met +0.61 (-0.11, +1.33), new senders +0.92 (+0.14, +1.71)
  + pairs and pieces                       1,183,226   0.8480   +2.57 (+1.84, +3.35)
      senders met +1.17 (+0.22, +2.16), new senders +3.74 (+2.68, +4.85)
  + all four                               1,296,856   0.8492   +2.70 (+1.92, +3.50)
      senders met +1.61 (+0.61, +2.66), new senders +3.60 (+2.45, +4.85)

C searched for the SVM: words 0.1-3; pairs 0.3-10; pieces 0.1-3; subject 0.3-3;
  quoted text 0.1-3; pairs and pieces 0.3-3; all four 0.3-30

each model's whole search (every reading and setting above), chosen fold by fold, against the bar
(complement naive Bayes on the words, its own search on page 14: 0.8328)
  the bar's model (complement naive Bayes)   0.8550   +2.22 (+1.46, +2.95)
    picked by fold: all four (alpha 0.01), same, same, same, same
  the linear SVM                             0.8492   +1.64 (+0.65, +2.62)
    picked by fold: all four (C 10), all four (C 3), same, same, all four (C 10)
  the linear SVM against the bar's model, each with its search: -0.58 (-1.44, +0.28)

the later new threads (report only): each reading at its best setting on the harness, fitted on all
11314 earlier posts, scored on the 2527 (923 from senders met); change against the same model on the words
  the bar's model (complement naive Bayes)
    the words, as before (alpha 0.1)                     0.8219
    + pairs of neighbouring words (alpha 0.03)           0.8263   +0.44 (-0.59, +1.42)
        senders met +2.38 (+0.76, +4.01), new senders -0.69 (-2.00, +0.56)
    + pieces of words, 2 to 5 characters (alpha 0.01)    0.8310   +0.91 (+0.12, +1.70)
        senders met +1.08 (+0.00, +2.28), new senders +0.81 (-0.25, +1.87)
    + the subject counted again (alpha 0.1)              0.8215   -0.04 (-0.83, +0.75)
        senders met +0.98 (-0.11, +2.28), new senders -0.62 (-1.68, +0.44)
    + the quoted text (alpha 0.1)                        0.8251   +0.32 (-0.24, +0.87)
        senders met +0.76 (-0.33, +1.84), new senders +0.06 (-0.62, +0.75)
    + pairs and pieces (alpha 0.01)                      0.8425   +2.06 (+1.15, +3.01)
        senders met +3.25 (+1.84, +4.77), new senders +1.37 (+0.12, +2.56)
    + all four (alpha 0.01)                              0.8469   +2.49 (+1.58, +3.40)
        senders met +3.68 (+2.06, +5.31), new senders +1.81 (+0.62, +2.93)
  the linear SVM
    the words, as before (C 0.3)                         0.8168
    + pairs of neighbouring words (C 3)                  0.8227   +0.59 (-0.24, +1.42)
        senders met +1.30 (+0.22, +2.38), new senders +0.19 (-0.94, +1.31)
    + pieces of words, 2 to 5 characters (C 0.3)         0.8374   +2.06 (+1.35, +2.77)
        senders met +1.63 (+0.54, +2.71), new senders +2.31 (+1.37, +3.30)
    + the subject counted again (C 1)                    0.8160   -0.08 (-0.87, +0.67)
        senders met +1.08 (+0.00, +2.17), new senders -0.75 (-1.81, +0.25)
    + the quoted text (C 0.3)                            0.8235   +0.67 (-0.04, +1.39)
        senders met +1.63 (+0.54, +2.82), new senders +0.12 (-0.69, +1.00)
    + pairs and pieces (C 1)                             0.8413   +2.45 (+1.54, +3.36)
        senders met +1.63 (+0.43, +2.82), new senders +2.93 (+1.75, +4.11)
    + all four (C 10)                                    0.8472   +3.05 (+2.06, +4.00)
        senders met +2.93 (+1.41, +4.44), new senders +3.12 (+2.00, +4.43)
  against the bar on the later posts (0.8219):
    the bar's model reading all four: +2.49 (+1.58, +3.40)
    the linear SVM reading all four: +2.53 (+1.27, +3.76)`;

const outPieces = `pieces of words against the words, on the harness's new threads, points (95%)
                                           posts  the bar's model             the linear SVM
  senders met                               1802  +0.11 (-0.61, +0.89)        +0.33 (-0.44, +1.11)
  new senders                               2164  +1.66 (+0.69, +2.68)        +2.63 (+1.71, +3.56)
  new senders, no word unseen in training    536  +2.24 (+0.37, +4.29)        +3.36 (+1.31, +5.60)
  new senders, at least one unseen word     1628  +1.47 (+0.31, +2.64)        +2.40 (+1.41, +3.44)
  (73.8% of new threads have a word no training post contains)

the linear SVM: posts pieces turn right minus posts they turn wrong, by forum (all +63):
  comp.windows.x +16, sci.electronics +13, comp.graphics +12, comp.sys.ibm.pc.hardware +9, rec.autos +7

the words as scikit-learn counts them are runs of two or more letters or digits: the one-letter word X,
the name of the X Window System, is not one. The words with one-letter words kept, against the words:
  the bar's model  0.8343   +0.15 (-0.20, +0.53); against pieces -0.81 (-1.41, -0.10)
    comp.windows.x's 347 new threads: words 0.865, one-letter words kept 0.893, pieces 0.899
  the linear SVM   0.8331   +1.08 (+0.61, +1.56); against pieces -0.50 (-1.11, +0.13)
    comp.windows.x's 347 new threads: words 0.821, one-letter words kept 0.896, pieces 0.867

two later new threads from new senders: the SVM on the words routes them wrong, with pieces right.
The features that move each most from the words' forum to its own (piece = p, word = w):
  5811, comp.windows.x, 51 words; the SVM on the words alone routes it to comp.graphics
    its margin toward comp.windows.x, from the words -0.084 and from the pieces +0.265
    p' x' +0.214, p' x ' +0.102, w'extension' +0.068, w'an' +0.052, w'audio' +0.050, p'x ' +0.037
      a word holding ' x'              in 1125 earlier posts, 44% of them in comp.windows.x
      the word 'x'                     in  641 earlier posts, 42% of them in comp.windows.x
      the word 'xv'                    in   39 earlier posts, 26% of them in comp.windows.x
  7226, sci.crypt, 29 words; the SVM on the words alone routes it to sci.electronics
    its margin toward sci.crypt, from the words +0.059 and from the pieces +0.570
    w'attack' +0.061, p'crypt' +0.046, p'cryp' +0.046, p'rypt' +0.045, p'ryp' +0.045, p'ypt' +0.042
      a word holding 'crypt'           in  370 earlier posts, 97% of them in sci.crypt
      the word 'cryptosystem'          in   14 earlier posts, 100% of them in sci.crypt`;

const outHistory = `the sender's history, added to a model's scores: + w x ln(share of the sender's earlier posts in the
forum, beta posts added to every forum first). beta and w each from 0.01, 0.03, 0.1, 0.3, 1, 3, 10,
chosen fold by fold, with the model's reading and setting held where its search put them: a sender
with no earlier post routes exactly as before.

the harness: 1802 new threads from senders met in the fold's training posts; the post went to
  the sender's usual forum            1548 (85.9%)
  another forum they had posted in      77 (4.3%)
  a forum they never had               177 (9.8%)
  the sender's usual forum as the route, alone: 0.8590 of them

                                     right    senders met            all new threads, at the later mix
  the bar's model, the words         0.8563   +5.16 (+3.83, +6.55)   +1.89 (+1.40, +2.39)
  the bar's model, its search        0.8722   +3.77 (+2.55, +5.05)   +1.38 (+0.93, +1.84)
    (beta, w) picked by fold with its search: 0.03, 0.3  1, 1  1, 1  1, 1  1, 1
  the linear SVM, the words          0.8510   +6.33 (+4.83, +7.88)   +2.31 (+1.76, +2.88)
  the linear SVM, its search         0.8739   +5.44 (+4.00, +6.99)   +1.99 (+1.46, +2.55)
    (beta, w) picked by fold with its search: 0.1, 0.3  0.1, 0.3  0.1, 0.3  0.1, 0.3  0.1, 0.3

senders met, by where the post went: share right without -> with the history (each model with its search)
  the sender's usual forum           1548   the bar's model  0.919 -> 0.979   +6.01 (+4.78, +7.24)
                                            the linear SVM   0.899 -> 0.986   +8.72 (+7.36, +10.21)
  another forum they had posted in   77     the bar's model  0.857 -> 0.831   -2.60 (-9.09, +3.90)
                                            the linear SVM   0.883 -> 0.896   +1.30 (-3.90, +6.53)
  a forum they never had             177    the bar's model  0.718 -> 0.588   -12.99 (-18.08, -7.91)
                                            the linear SVM   0.712 -> 0.497   -21.47 (-27.68, -15.25)

against the bar (0.8328), all new threads:
  the bar's model, its search                0.8550   +2.22 (+1.46, +2.95)
    + the sender's history                   0.8722   +3.93 (+3.05, +4.82)
  the linear SVM, its search                 0.8492   +1.64 (+0.65, +2.62)
    + the sender's history                   0.8739   +4.11 (+3.10, +5.17)
  the linear SVM against the bar's model, both with their search and the history: +0.18 (-0.58, +0.98)

the later new threads (report only): 923 from senders met. The post went to the sender's usual
forum 81.9%, another forum they had posted in 5.2%, a forum they never had 12.9%; the usual forum
alone routes 0.8191 of them.
  the bar's model, words (alpha 0.1), + history (beta 0.3, w 0.3): 0.8389
      against no history: senders met +4.66 (+2.60, +6.94), all new threads +1.70 (+0.87, +2.53)
      the sender's usual forum                        756   0.877 -> 0.971
      another forum they had posted in                 48   0.604 -> 0.708
      a forum they never had                          119   0.664 -> 0.387
      against the bar on the later posts (0.8219): +1.70 (+0.87, +2.53)
  the bar's model, all four (alpha 0.01), + history (beta 1, w 1): 0.8560
      against no history: senders met +2.49 (+0.87, +4.12), all new threads +0.91 (+0.28, +1.50)
      the sender's usual forum                        756   0.917 -> 0.967
      another forum they had posted in                 48   0.708 -> 0.708
      a forum they never had                          119   0.655 -> 0.529
      against the bar on the later posts (0.8219): +3.40 (+2.33, +4.47)
  the linear SVM, words (C 0.3), + history (beta 0.1, w 0.3): 0.8346
      against no history: senders met +4.88 (+2.71, +7.04), all new threads +1.78 (+0.95, +2.57)
      the sender's usual forum                        756   0.877 -> 0.971
      another forum they had posted in                 48   0.646 -> 0.729
      a forum they never had                          119   0.655 -> 0.403
      against the bar on the later posts (0.8219): +1.27 (+0.00, +2.57)
  the linear SVM, all four (C 10), + history (beta 0.1, w 0.3): 0.8583
      against no history: senders met +3.03 (+1.19, +4.98), all new threads +1.11 (+0.44, +1.82)
      the sender's usual forum                        756   0.905 -> 0.967
      another forum they had posted in                 48   0.708 -> 0.812
      a forum they never had                          119   0.681 -> 0.479
      against the bar on the later posts (0.8219): +3.64 (+2.37, +4.91)`;

export default function BetterFeaturesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 16 minutes"
        title={<>Better features: what else the router can read</>}
        intro={<>
          Four rungs changed the model and kept the words. This one keeps the two best models and changes what they
          read: pairs of words, pieces of words, the subject, the quoted text, and who sent the post.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={18} total={27}>
          Can the router do better by reading the posts differently, or by knowing who sent them?
        </ArticleOpener>

        <h2>Five things the router could read</h2>
        <p>
          Since <Link href={`${R}/words-into-numbers`} style={link}>page 7</Link> every model has read the same
          thing: the subject and the body, cut into words, one column per word. A word, in scikit-learn&rsquo;s
          default, is a run of two or more letters or digits. That is one way to read a post, and there are others
          the router could use when a post arrives.
        </p>
        <ul>
          <li>
            <strong>Pairs of neighbouring words.</strong> &ldquo;Hard drive&rdquo;, &ldquo;power supply&rdquo;,
            &ldquo;New York&rdquo;. Cut into words, a phrase falls into two columns that each mean something
            else; a pair gets a column of its own.
          </li>
          <li>
            <strong>Pieces of words.</strong> Every run of 2 to 5 characters inside a word, with the word&rsquo;s
            edges marked. &ldquo;Encryption&rdquo; and &ldquo;cryptosystem&rdquo; share &ldquo;crypt&rdquo;, and
            a misspelt word shares most of its pieces with the right spelling.
          </li>
          <li>
            <strong>The subject, counted again.</strong> The subject line says in a few words what the post is
            about. Its words get columns of their own, so a model can weigh them apart from the body.
          </li>
          <li>
            <strong>The quoted text.</strong> <Link href={`${R}/closing-the-channels`} style={link}>Page 10</Link>{" "}
            closed the quotes because on a random split they carried the thread&rsquo;s own text. A new thread that
            quotes something quotes another conversation, and page 10 left it to be tested here.
          </li>
          <li>
            <strong>The sender&rsquo;s history.</strong> Not text at all: the forums the sender&rsquo;s earlier
            posts went to. A support desk routing a ticket knows the customer&rsquo;s past tickets; this router
            knows the sender&rsquo;s past posts. Page 10 kept the sender out of the text, because a model that
            reads names as words helps the people it has met and costs everyone else. Here the history gets a term
            of its own.
          </li>
        </ul>
        <p>
          The first four go to both models: complement naive Bayes, the bar, and the linear SVM. Each reading is
          added to the words, and each model searches its own setting on it, priced fold by fold on the harness as
          every rung has been. <Link href={`${R}/naive-bayes`} style={link}>Page 14</Link> found that the two models
          want different numbers (IDF helps the SVM and hurts naive Bayes), so a reading that suits one may not suit
          the other. Two combinations go in too: pairs and pieces, and all four at once. A post has far more pieces
          than words, so each kind of column is scaled to length one on its own before they are put side by side;
          otherwise the pieces would drown the words.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Which single reading helps the senders the router has never met the most?</>}
          options={["Pairs of words", "Pieces of words", "The subject, counted again", "The quoted text"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outFeatures}</CodeOutput>

        <p>
          Pieces, by a distance. They lift the SVM&rsquo;s new senders by 2.63 points and the bar&rsquo;s model&rsquo;s
          by 1.66, both settled, and barely move the senders the router has met. Pairs help the bar&rsquo;s model
          mostly on senders it has met. The subject and the quoted text each add under a point to the SVM and nothing
          the harness can settle to naive Bayes.
        </p>
        <p>
          Together they add up. Reading all four, the bar&rsquo;s model routes 0.855 of the new threads, 2.22
          points above the bar, settled, and its search picks all four in every fold. The SVM gains more, 2.70
          points on its own words, but starts lower and ends at 0.849, level with the bar&rsquo;s model (&minus;0.58,
          not settled). All four cost columns: 1.3 million of them, against 91,000 words. Fitted on every earlier
          post, all four lift both models on the later new threads by two and a half to three points, to 0.847.
        </p>

        <h2>What the pieces read</h2>
        <p>
          The obvious reason for pieces to help new senders is the words the router has never seen. A new sender
          has their own typos and their own names for things, and page 7 found that the vocabulary drops 3.5% of
          the later posts&rsquo; words without a warning. Page 7 also left open whether letter pieces, which catch
          a typo, help the router overall. Before reading the gain that way, check it.
        </p>

        <CodeOutput source="scripts/routing_cases.py">{outPieces}</CodeOutput>

        <p>
          Unseen words are not it. New senders whose posts contain no unseen word at all gain as much from pieces
          as the ones whose posts do, 3.36 points against 2.40 for the SVM. The gain sits somewhere else, and
          sorting it by forum shows where: comp.windows.x leads, with a quarter of the net gain.
        </p>
        <p>
          comp.windows.x is the forum for the X Window System, and its users call it X. A word, to scikit-learn, is
          two or more characters, so the one-letter word X has never been a column: the router has been reading a
          forum without its name since page 7. A piece keeps it, because a piece of a word is the word with its
          edges marked, and &ldquo;␣x␣&rdquo; is the word X on its own. Keeping one-letter words, with nothing else
          changed, takes the SVM from 0.821 to 0.896 on comp.windows.x and recovers two thirds of what pieces add
          to it overall. Naive Bayes gains less from the fix, 0.15 points overall and not settled, though its
          comp.windows.x posts rise from 0.865 to 0.893.
        </p>

        <PiecesPair />

        <p>
          In the first post the word X appears three times. It is in 641 earlier posts, 42% of them in
          comp.windows.x, and without it the words send the post to comp.graphics. The rest of the gain is families
          of words. In the second post, &ldquo;cryptosystem&rdquo; is in only 14 earlier posts: as a word it is
          one rare column. A word holding the piece &ldquo;crypt&rdquo; (&ldquo;encryption&rdquo;,
          &ldquo;crypto&rdquo;, &ldquo;cryptography&rdquo; and the rest) is in 370, 97% of them in sci.crypt, and
          read as pieces the rare word borrows the weight of its whole family. The senders the router has met gain
          almost nothing from any of this, 0.33 points for the SVM and not settled.
        </p>

        <h2>The sender&rsquo;s history</h2>
        <p>
          The last candidate is who sent the post. On{" "}
          <Link href={`${R}/how-the-data-was-made`} style={link}>page 3</Link> the From address alone, routing each
          known sender&rsquo;s new thread to the forum they had posted in most, filed about four in five of them
          correctly. Page
          10 found that putting the header lines back into the text helped those senders and cost the new ones, so
          here the history is not text. A model scores every forum from what the post says, and the history adds
          to each forum&rsquo;s score <em>w</em> times the log of the share of the sender&rsquo;s earlier posts
          that went there. Before the shares are taken, a few posts (beta) are added to every forum, so a forum the
          sender has never used becomes unlikely but not impossible. A sender with no earlier post gets nothing
          added, and their route cannot move.
        </p>
        <p>
          Both weights are searched on the harness and chosen fold by fold, with each model&rsquo;s reading held
          where its own search put it. One correction matters: in the harness&rsquo;s folds 45.4% of new threads
          come from a sender seen in training, and next month only 36.5% will (
          <Link href={`${R}/the-split`} style={link}>page 11</Link>), so the history&rsquo;s gain is also given
          weighted to the later mix.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>The history lifts the senders the router has met. Whose new threads does it cost?</>}
          options={["Nobody’s: a new sender routes as before", "Posts to a forum the sender has never posted in", "Senders with only one or two earlier posts"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outHistory}</CodeOutput>

        <p>
          It is the largest single gain on the page and it has a bill. On top of all four readings, the history
          lifts the bar&rsquo;s model to 0.872 on the harness, and weighted to next month&rsquo;s mix of senders it
          adds 1.38 points, settled. On the later new threads it adds 0.91, still settled, and the bar&rsquo;s
          model with both ends 3.40 points above the bar there.
        </p>
        <p>
          The bill goes to the posts that leave home. One in ten of a known sender&rsquo;s new threads goes to a
          forum they have never posted in, and those fall from 0.718 to 0.588 with the bar&rsquo;s model, and from 0.712
          to 0.497 with the SVM. On the later posts more senders wander, 12.9% of them, and the history takes those from
          0.655 to 0.529. Everyone else pays nothing: new senders route exactly as before, and posts to the
          sender&rsquo;s usual forum go from 0.919 to 0.979. The history is a bet that people keep doing what they
          did, and it is paid for by the ones who do not.
        </p>
        <p>
          The lab holds one setting for every fold on the harness, the one most folds picked (beta 1, the bar&rsquo;s
          model reading all four), so its harness numbers differ from the table&rsquo;s by a few posts. Its later
          posts are the table&rsquo;s exactly.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start at no history and slide the weight up one step at a time, watching the red line. Then switch to the later posts at the harness&rsquo;s pick, w = 1, and compare the posts it turns right with the ones it turns wrong.</>}
          insight={<>
            The history turns right almost only posts that went to the sender&rsquo;s usual forum, and turns wrong only
            posts that did not. As the weight grows, the first group runs out of posts to fix while the second keeps
            losing them, which is why the total rises, peaks near w = 1, and falls.
          </>}
        >
          <SenderHistoryLab />
        </LabFrame>

        <p>
          Two things about this history make it different from the leak act 3 closed. The names in the header lines
          inflated a random split, where a sender&rsquo;s other posts sat in the same thread on both sides of the
          line. This history is priced on the harness built to predict next month, and checked on next month: it
          holds there, smaller. And it cannot reach a new sender, so it cannot crowd out what the post says the way
          names read as words did on page 10.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>All four readings are a settled gain for both models. The history adds about another point next month, all of it from senders the router has met, and costs posts that go to a forum new to their sender about thirteen points. What does the router read from now on?</>}
          options={[
            {
              label: "All four readings, and leave the history out",
              verdict: "close",
              response: <>A defensible line: the router reads only what the post says. It gives up a settled point
                next month to keep every sender on the same footing, and the team should make that choice knowing
                its price, not by default.</>,
            },
            {
              label: "All four readings, and put the From line back into the text so one model learns both",
              verdict: "miss",
              response: <>That is the experiment page 10 ran. Read as words, the sender&rsquo;s address helped the
                senders the router had met and cost the new ones, because the model leaned on names instead of on
                what the post says. A separate term cannot touch a new sender.</>,
            },
            {
              label: "All four readings, and the history as its own term, with the posts that leave home watched",
              verdict: "best",
              response: <>The bar becomes complement naive Bayes reading all four, plus the sender&rsquo;s history:
                0.872 on the harness, 0.856 on the later posts. Two guards go with it. Posts to a forum new to their
                sender join the metric&rsquo;s named groups, next to the forums below 0.75 from{" "}
                <Link href={`${R}/the-metric`} style={link}>page 12</Link>. And the history counts only posts whose
                forum a person placed or confirmed, so a misroute cannot become the evidence for the next one.</>,
            },
          ]}
        />

        <p>
          So the bar moves for the first time since page 14: still complement naive Bayes, now reading pairs and
          pieces of words, the subject and the quoted text, with the sender&rsquo;s history beside it. The SVM with
          the same is level with it. Every gain on this page came from reading more of the posts, or something
          beside them, with the same models. The next page goes further down that road with pretrained embeddings,
          which have read far more text than these 11,314 posts, and settles H4, the bet that what they add reaches
          new senders at least as much as familiar ones.
        </p>

        <Callout color={POST} title={<>Count what the tokenizer throws away</>}>
          Every vectorizer has defaults that delete text before a model sees it: a minimum word length, a token
          pattern, a stop list, a minimum count. Before engineering a new feature, list the tokens the defaults drop
          and count them by class. Here one dropped letter was the name of a forum&rsquo;s subject.
        </Callout>

        <Followup>
          Take a text classifier of your own. Fit it once with character pieces beside the words, and split the gain
          by class and by whether the writer appears in training. Then refit with your tokenizer keeping every token
          it now drops, one-character ones included, and see how much of the gain that alone recovers. If you have
          any history for the writer, add it as a separate term with its weight searched, and report the records
          that go somewhere new for the writer as a group of their own.
        </Followup>

        <SigRule n={17}>
          <strong>Split every gain by who it reaches.</strong> A feature that adds a point overall can add six to
          the people the model already knows and take thirteen from the ones who change their habits; report the
          gain by group before you keep it.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/kernels-and-trees`, label: <>← Kernels and trees</> }}
          next={{ href: `${R}/pretrained-embeddings`, label: <>Next up · Pretrained embeddings →</> }}
        />
      </div>
    </article>
  );
}
