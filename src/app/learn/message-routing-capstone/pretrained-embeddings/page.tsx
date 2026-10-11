import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import { Settled } from "@/components/capstone/PredictionRegister";
import NearestPostsLab from "@/components/labs/NearestPostsLab";

export const metadata = {
  title: "Pretrained embeddings — Manifold",
  description:
    "Two sentence-embedding models, trained on other text, read the posts. The large one alone routes level with the bar, worse for senders the router knows and better for the ones it does not; beside the bar it adds a settled point and a half, most of it for new senders and short posts. H4 is confirmed.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outNearest = `each harness new thread's nearest earlier post in the fold's training part, by the words (TF-IDF)
and by the embedding (bge-large), share in the same forum and, for senders met, from the same sender:
  words    same forum 0.695 (senders met 0.792, new senders 0.614); same sender 0.358 of senders met
  meaning  same forum 0.795 (senders met 0.852, new senders 0.748); same sender 0.286 of senders met
  the two disagree on 963 new threads: the words' neighbour alone in the forum 283, the embedding's 680

the later new threads, nearest of all 11314 earlier posts: same forum, words 0.673, embedding 0.781

  601, rec.sport.hockey, 70 words: Sabre fans
    nearest by the words:
      0.186 sci.electronics          Re: Electric power line "balls"    balls bet
      0.182 rec.sport.hockey         Bruins in the Playoffs             frustration playoff fans finally
      0.166 rec.sport.hockey         Re: What's so bad about the new pl sabre playoff
      0.158 rec.sport.baseball       Re: Darrrrrrrrryl                  fans throw team yes
      0.135 rec.sport.hockey         Re: My Predictions of a classic pl playoff games year don
    nearest by the embedding:
      0.826 rec.sport.hockey         Did The Blues Pull It Out?         yes
      0.815 rec.sport.hockey         Bruins in the Playoffs             frustration playoff fans finally
      0.815 rec.sport.hockey         Re: V***'s Playoff Picks           playoff bet fans games
      0.815 rec.sport.hockey         Re: If You Were Pat Burns ...
      0.811 rec.sport.hockey         Re: the hawks WILL return to the f don

  1413, misc.forsale, 41 words: Wanted:  Large dog cage
    nearest by the words:
      0.240 rec.motorcycles          Re: Boom! Dog attack!              cage dog
      0.206 rec.motorcycles          Re: Boom! Dog attack!              cage dog large
      0.201 rec.motorcycles          Re: bikes with big dogs            dog large
      0.195 rec.motorcycles          Re: Motorcycle Security            dog
      0.194 rec.motorcycles          Re: dogs                           dog large
    nearest by the embedding:
      0.651 misc.forsale             WANTED:  FUTON                     large wanted
      0.620 misc.forsale             Wanted: AIRCONDITIONER             wanted
      0.611 misc.forsale             16 Space Rack FOR SALE (Lower Pric
      0.608 rec.sport.hockey         wanted: mail order hockey equipmen wanted
      0.604 sci.space                Re: *** HELP I NEED SOME ADDRESSES need

  1193, sci.med, 35 words: Iridology - Any credence to it???
    nearest by the words:
      0.150 talk.politics.mideast    Zionism                            flyer
      0.142 sci.med                  Re: Homeopathy: a respectable medi health stated person
      0.142 comp.os.ms-windows.misc  Re: Can I Change "Licensed To" Dat licensed
      0.138 talk.politics.guns       Constitutionality of 18 U.S.C 922( person looking tell
      0.134 soc.religion.christian   When are two people married in God eyes opinions
    nearest by the embedding:
      0.751 sci.med                  Scientific Yawn                    health person
      0.745 sci.med                  Re: Science and methodology (was:
      0.744 sci.med                  Re: Good Grief! (was Re: Candida A
      0.738 sci.med                  Great Post! (was Re: Candida (yeas health stated saw person
      0.737 sci.med                  Selective Placebo                  health person

  1144, sci.crypt, 34 words: Encryption Chip Availibility
    nearest by the words:
      0.209 soc.religion.christian   Mission Aviation Fellowship        appreciated hi thanks does
      0.201 sci.crypt                Re: text of White House announceme companies chips encryption chip
      0.192 sci.crypt                Re: White House Public Encryption  encryption public does
      0.189 sci.crypt                Re: White House Public Encryption  companies chips encryption public
      0.186 sci.crypt                Re: Is there ANY security in the C encryption chip
    nearest by the embedding:
      0.857 sci.crypt                Re: Off the shelf cheap DES keysea chips chip
      0.840 sci.crypt                Re: White House Public Encryption  encryption public
      0.836 sci.crypt                Re: Off the shelf cheap DES keysea chips chip know
      0.833 sci.crypt                Re: Off the shelf cheap DES keysea chip
      0.830 sci.crypt                Re: Clipper chip -- technical deta chip

  3145, comp.sys.mac.hardware, 47 words: What was the ....
    nearest by the words:
      0.158 comp.sys.mac.hardware    IIvx -> C650 Upgrade Question      iivx new
      0.138 comp.sys.mac.hardware    Re: what do y'all think of the IIv iivx
      0.133 comp.sys.mac.hardware    Re: Centris Cache & Bernoulli Box  040 tech machine
      0.131 comp.sys.mac.hardware    Re: IIvx -> C650 Upgrade Question  iivx new
      0.125 comp.sys.mac.hardware    Daystar Turbo 040 Opinions?        040
    nearest by the embedding:
      0.749 comp.sys.ibm.pc.hardware The "P24T"
      0.742 misc.forsale             Bunch-O-PC-Stuff for sale          100
      0.737 sci.electronics          Re: what to do with old 2
      0.736 comp.sys.ibm.pc.hardware Re: DX3/99
      0.735 comp.sys.ibm.pc.hardware Connection Machine                 machine

  5748, sci.med, 26 words: Can I sell my TENS unit?
    nearest by the words:
      0.209 sci.med                  What about sci.med.chemistry       med sci
      0.150 sci.med                  Re: Patient-Physician Diplomacy    physician
      0.140 sci.crypt                Re: Once tapped, your code is no g tens people
      0.129 sci.med                  Re: Candida(yeast) Bloom, Fact or  physician people
      0.124 sci.med                  Re: Patient-Physician Diplomacy    physician person people
    nearest by the embedding:
      0.647 sci.electronics          Re: what to do with old 256k SIMMs sell
      0.629 misc.forsale             Re: Realistic PRO-34 Hand-held Sca sell
      0.628 comp.sys.mac.hardware    FOR SALE: 2 4MB 80ns SIMMs         sell
      0.626 sci.crypt                Re: Once tapped, your code is no g
      0.620 misc.forsale             <><><><>SIPPs MEMORY FORSALE<><><>`;

const outPretrained = `the audited view, encoded once by two pretrained sentence models (cached, hash shown):
  sentence-transformers/all-MiniLM-L6-v2    384 numbers per post; reads the first 256 tokens
      23.9% of posts are longer; cache 107f5d49709a
  BAAI/bge-large-en-v1.5                   1024 numbers per post; reads the first 512 tokens
      8.8% of posts are longer; cache efac16164918
each embedding gets its own model: logistic regression, C from 0.3 to 100, chosen fold by fold.

the harness's 3966 new threads (1802 from senders met), share right; change against the bar (0.8328):
                               right    all new threads       senders met           new senders
  MiniLM alone                 0.7829   -4.99 (-6.23, -3.76)  -6.77 (-8.55, -4.99)  -3.51 (-5.41, -1.66)
      C picked by fold: 3, 1, 1, 3, 1
  bge-large alone              0.8366   +0.38 (-0.76, +1.51)  -1.83 (-3.33, -0.22)  +2.22 (+0.65, +3.84)
      C picked by fold: 10, 10, 3, 3, 10

beside a model's scores: + v x the embedding model's log-probability, v from 0.03 to 10; C and v
chosen fold by fold with the model's own reading and setting held. Change against the same model
without the embedding, in points (95%):
  the bar's model (complement naive Bayes)
    the words                  0.8328
      + MiniLM                 0.8555   +2.27 (+1.54, +3.00)  +0.67 (-0.22, +1.50)  +3.60 (+2.50, +4.71)
      + bge-large              0.8649   +3.20 (+2.42, +3.96)  +1.78 (+0.78, +2.89)  +4.39 (+3.28, +5.55)
        (C, v) picked by fold, bge-large: 10, 0.1  10, 0.1  10, 0.1  10, 0.1  10, 0.3
    its search                 0.8550
      + MiniLM                 0.8591   +0.40 (-0.18, +0.98)  -0.17 (-0.89, +0.61)  +0.88 (+0.05, +1.76)
      + bge-large              0.8719   +1.69 (+1.01, +2.37)  +0.94 (+0.06, +1.89)  +2.31 (+1.34, +3.33)
        (C, v) picked by fold, bge-large: 100, 0.1  30, 0.1  3, 0.3  30, 0.3  30, 0.3
    its search + the history   0.8722
      + MiniLM                 0.8815   +0.93 (+0.33, +1.54)  +0.50 (-0.17, +1.17)  +1.29 (+0.42, +2.22)
      + bge-large              0.8893   +1.71 (+1.11, +2.34)  +0.72 (+0.00, +1.44)  +2.54 (+1.62, +3.56)
        (C, v) picked by fold, bge-large: 3, 0.3  30, 0.1  3, 0.3  10, 0.3  10, 0.3
  the linear SVM
    the words                  0.8222
      + MiniLM                 0.8422   +1.99 (+1.31, +2.70)  +1.05 (+0.11, +2.00)  +2.77 (+1.80, +3.79)
      + bge-large              0.8626   +4.03 (+3.18, +4.82)  +2.33 (+1.28, +3.44)  +5.45 (+4.34, +6.70)
        (C, v) picked by fold, bge-large: 1, 0.3  1, 0.3  1, 0.3  1, 0.3  1, 0.3
    its search                 0.8492
      + MiniLM                 0.8601   +1.08 (+0.45, +1.69)  +0.67 (-0.17, +1.44)  +1.43 (+0.60, +2.22)
      + bge-large              0.8717   +2.24 (+1.51, +2.95)  +1.50 (+0.55, +2.50)  +2.87 (+1.85, +3.93)
        (C, v) picked by fold, bge-large: 1, 0.3  0.3, 0.3  10, 0.1  30, 0.1  1, 0.3
    its search + the history   0.8739
      + MiniLM                 0.8822   +0.83 (+0.20, +1.46)  +0.44 (-0.33, +1.22)  +1.16 (+0.23, +2.03)
      + bge-large              0.8901   +1.61 (+0.96, +2.24)  +0.67 (-0.06, +1.39)  +2.40 (+1.39, +3.42)
        (C, v) picked by fold, bge-large: 0.3, 0.3  0.3, 0.3  3, 0.1  3, 0.1  10, 0.3
  all four, the history and bge-large, against the bar:
    the bar's model            0.8893   +5.65 (+4.74, +6.56)
    the linear SVM             0.8901   +5.72 (+4.74, +6.73)
    the linear SVM against the bar's model: +0.08 (-0.61, +0.76)`;

const outReach = `H4: what the embedding gains on new senders minus what it gains on senders met, points (95%):
  the bar's model  the words                  MiniLM     +2.94 (+1.56, +4.40)
  the bar's model  the words                  bge-large  +2.61 (+1.16, +4.12)
  the bar's model  its search                 MiniLM     +1.04 (-0.09, +2.22)
  the bar's model  its search                 bge-large  +1.37 (+0.04, +2.74)
  the bar's model  its search + the history   MiniLM     +0.79 (-0.32, +2.00)
  the bar's model  its search + the history   bge-large  +1.82 (+0.62, +3.04)
  the linear SVM   the words                  MiniLM     +1.72 (+0.35, +3.07)
  the linear SVM   the words                  bge-large  +3.12 (+1.53, +4.71)
  the linear SVM   its search                 MiniLM     +0.77 (-0.44, +1.97)
  the linear SVM   its search                 bge-large  +1.37 (-0.06, +2.80)
  the linear SVM   its search + the history   MiniLM     +0.71 (-0.48, +1.89)
  the linear SVM   its search + the history   bge-large  +1.74 (+0.53, +3.02)

by length: the bar's model reading all four, bge-large alone, and the two together
  words      posts  too long  all four  bge-large  both     both against all four
  0-39         737    0.0%    0.783     0.750      0.813    +2.99 (+1.22, +4.88)
  40-159      2067    0.1%    0.850     0.831      0.868    +1.79 (+0.82, +2.81)
  160+        1162   49.1%    0.910     0.902      0.917    +0.69 (-0.17, +1.55)
  (too long: past the 512 tokens bge-large reads; the rest of the post is not encoded)

the later new threads (report only): each setting at its best on the harness, fitted on all 11314
earlier posts, scored on the 2527 (923 from senders met). An embedding alone is set against the bar
(0.8219); a row with + against the row above it. All four at alpha 0.01; the history at beta 1, w 1.
                                 right    all new threads       senders met           new senders
  MiniLM alone (C 1)             0.7820   -4.00 (-5.54, -2.49)  -5.31 (-7.69, -2.82)  -3.24 (-5.17, -1.25)
  bge-large alone (C 10)         0.8227   +0.08 (-1.39, +1.54)  -2.38 (-4.66, +0.00)  +1.50 (-0.44, +3.37)
  the bar's model, all four      0.8469
    + MiniLM (C 3, v 0.3)        0.8583   +1.15 (+0.24, +2.06)  +0.22 (-0.87, +1.41)  +1.68 (+0.50, +2.99)
    + bge-large (C 30, v 0.1)    0.8662   +1.94 (+1.23, +2.69)  +0.43 (-0.43, +1.30)  +2.81 (+1.87, +3.93)
  all four + the history         0.8560
    + MiniLM (C 0.3, v 0.3)      0.8730   +1.70 (+0.87, +2.49)  +0.87 (-0.22, +1.95)  +2.18 (+1.12, +3.31)
    + bge-large (C 3, v 0.3)     0.8809   +2.49 (+1.66, +3.36)  +1.19 (+0.21, +2.28)  +3.24 (+2.06, +4.49)
  H4 on the later posts (the bar's model, all four + bge-large): +2.37 (+1.05, +3.60)
  all four, the history and bge-large, against the bar: +5.90 (+4.79, +7.08)`;

export default function PretrainedEmbeddingsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 15 minutes"
        title={<>Pretrained embeddings: a model that has read other text</>}
        intro={<>
          Every rung so far learned what words mean from these 11,314 posts and nothing else. This one borrows a
          model trained on far more text, puts it beside the bar, and settles H4: whom that borrowed knowledge reaches.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={19} total={27}>
          Does a model trained on other text help the router, and whom does it help?
        </ArticleOpener>

        <h2>A post as a point</h2>
        <p>
          Every model on the ladder knows a word only from the earlier posts it appears in. A word no earlier post
          used counts for nothing, and two posts that say the same thing in different words look unrelated, because
          the router compares posts by the words they share.
        </p>
        <p>
          A sentence-embedding model is trained elsewhere, on a very large amount of text, for one job: turn a
          passage into a fixed list of numbers, its <em>embedding</em>, so that passages about the same thing get
          lists that point the same way. The router does not train it. It borrows it, reads each post through it
          once, and keeps the numbers. Two such models are on this machine:
        </p>
        <ul>
          <li>
            <strong>all-MiniLM-L6-v2</strong>, a small one: about 22 million weights, 384 numbers per post, and it
            reads the first 256 tokens (pieces of words) of a post.
          </li>
          <li>
            <strong>bge-large-en-v1.5</strong>, a large one: about 335 million weights, 1,024 numbers per post, and
            it reads the first 512 tokens.
          </li>
        </ul>
        <p>
          How alike two posts are is then the cosine between their embeddings, the same measure the router has used
          between TF-IDF rows since <Link href={`${R}/words-into-numbers`} style={link}>page 7</Link>. So the first
          question needs no classifier at all. For each new thread on the harness, find the earlier post nearest to
          it, once by the words and once by bge-large, and ask two things: is that post in the same forum, and, when
          the router has met the sender, did the same person write it?
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>For new threads from senders the router has met, which finds the sender&rsquo;s own earlier post as the nearest more often?</>}
          options={["The words", "The embedding", "About the same"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outNearest}</CodeOutput>

        <p>
          By the embedding, a new thread&rsquo;s nearest earlier post sits in its forum 79.5% of the time; by the
          words, 69.5%. Where the two disagree, the embedding&rsquo;s neighbour is the right one 680 times and the
          words&rsquo; 283. The gap is widest for new senders, 74.8% against 61.4%. The other number runs the other
          way. For a sender the router has met, the words find that person&rsquo;s own earlier post 35.8% of the time
          and the embedding 28.6%. The words are better at finding the same person, the embedding at finding the
          same subject.
        </p>
        <p>
          The lab shows six later new threads from senders the router has never met, with the five earlier posts
          nearest to each by both measures and the words each neighbour shares with the post.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Open post 1 and post 2 by the words, then switch to the embedding. Read which words the wrong neighbours share with the post. Then open posts 5 and 6, where the words win.</>}
          insight={<>
            The words find posts that share words, whatever those words are doing: a hockey fan&rsquo;s moth
            balls match a thread about the marker balls on power lines, and a request for a dog cage matches five
            motorcycle threads about dogs. The embedding finds posts that are about the same kind of thing. It loses
            where one rare word decides the forum, like the name of a computer model, and where what the post asks is
            not what it is about: a question about selling a medical device reads to it like a sale.
          </>}
        >
          <NearestPostsLab />
        </LabFrame>

        <p>
          Post 2 asks for a dog cage. By the words its five nearest are all in rec.motorcycles, threads where riders
          talk about dogs. By the embedding its nearest are other wanted ads, for a futon and an air conditioner,
          which share little with it beyond the word <em>wanted</em>. Post 4
          asks who sells encryption chips, and its nearest post by the words is in soc.religion.christian: they share{" "}
          <em>hi</em>, <em>thanks</em> and <em>appreciated</em>. The last two go the other way. Post 5 asks about the
          IIvx, a Macintosh model: the words find five comp.sys.mac.hardware threads, three naming it, while the
          embedding, which can tell the post is about an old computer but not whose, finds PC hardware. Post 6 asks
          whether a TENS unit, a pain-relief device, can be sold without a physician: the words find sci.med threads
          about physicians, and the embedding finds posts about selling memory chips and a scanner.
        </p>

        <h2>The embedding alone</h2>
        <p>
          To route with an embedding the router needs a model on its numbers. Logistic regression is the natural one:
          1,024 numbers per post is few enough to fit quickly, and{" "}
          <Link href={`${R}/logistic-regression`} style={link}>page 15</Link> showed it gives honest probabilities,
          which matter in a moment. Its C is chosen fold by fold on the harness, as every setting has been.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>bge-large alone, through logistic regression, against the bar&rsquo;s 0.833 on the words. Where does it land?</>}
          options={["Well below the bar", "Level with it", "Well above it"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outPretrained}</CodeOutput>

        <p>
          bge-large alone routes 0.837 of the new threads, level with the bar (+0.38, not settled). The level hides a
          split that runs in both directions. For senders the router has met it is 1.83 points worse than the bar,
          and for new senders 2.22 points better, both settled. The small model, MiniLM, routes 0.783 alone, five
          points below the bar, and worse for both groups.
        </p>

        <h2>Beside the words</h2>
        <p>
          An embedding cannot simply join the bar&rsquo;s columns. Complement naive Bayes reads counts, and an
          embedding&rsquo;s numbers are negative as often as positive. So the embedding keeps its own logistic
          regression, and the two are added the way the sender&rsquo;s history was on{" "}
          <Link href={`${R}/better-features`} style={link}>page 18</Link>: each forum&rsquo;s score from the bar&rsquo;s
          model, plus <em>v</em> times the log of the probability the embedding&rsquo;s model gives that forum. C and{" "}
          <em>v</em> are chosen fold by fold, with the bar&rsquo;s reading and setting held where its own search put
          them. The table above tries this at three stages of the router: the words alone, the bar&rsquo;s search
          over all four readings, and that search with the history.
        </p>
        <p>
          bge-large adds at every stage, for both models. Beside the words it adds 3.20 points; beside all four
          readings, 1.69, from 0.855 to 0.872; beside all four and the history, 1.71, from 0.872 to 0.889. Every one of
          those is settled. The two kinds of gain overlap: all four readings add 2.22 points to the words and
          bge-large adds 3.20, but together they add 3.91, not the 5.42 the two make apart. MiniLM adds 0.40 beside all four, not settled, and 0.93 with
          the history. With everything, the bar&rsquo;s model routes 0.889 of the new threads against the old
          bar&rsquo;s 0.833, and the SVM with the same three things is level with it (+0.08).
        </p>

        <h2>Whom it helps</h2>
        <p>
          H4, written on <Link href={`${R}/research-questions`} style={link}>page 5</Link> before any of this was
          measured, bet that the embedding helps new senders at least as much as familiar ones, because it can tell
          what a post is about but has never met these people. The test reads H4 as written, the embedding beside the
          word counts: the bar&rsquo;s model reading all four, with and without bge-large, and the gain on new
          senders minus the gain on senders met. The same output splits the gain by the length of the post, and checks all of it on the later posts.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>Beside all four readings, where does bge-large add the most?</>}
          options={["Posts under 40 words", "Posts of 40 to 159 words", "Posts of 160 words or more"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outReach}</CodeOutput>

        <Settled id="H4">
          Beside the bar&rsquo;s model reading all four, bge-large adds 0.94 points for senders the router has met
          and 2.31 for new senders. The difference, 1.37 points, has an interval from 0.04 to 2.74, wholly above zero:
          new senders gain more, narrowly settled. The later posts agree with room to spare, 2.37 (1.05 to 3.60), and
          so does every stage of the bar&rsquo;s model with bge-large. With the SVM in place of the bar&rsquo;s model, the same
          difference is 1.37 again, but its interval, from &minus;0.06 to 2.80, crosses zero by a hair.
        </Settled>

        <p>
          Length tells the same story from another side. On posts under 40 words bge-large adds 2.99 points, on posts
          of 40 to 159 words 1.79, and on posts of 160 words or more 0.69, not settled. A short post gives the words
          little to go on, and the embedding still knows what those few words are about. A long post already has
          plenty of words, and half the posts in that band run past the 512 tokens bge-large reads, so the rest of
          them never reach it.
        </p>
        <p>
          On the later posts every number holds its shape. bge-large alone is level with the bar again (0.823 against
          0.822). Beside all four readings it adds 1.94 points, and with the history 2.49, to 0.881: 5.90 points above
          the bar that started this act.
        </p>

        <h2>What it costs</h2>
        <p>
          The gain is not free. bge-large took 21 minutes to read all 18,846 posts on this project&rsquo;s graphics
          card, about fifteen posts a second, and its weights take 1.34 GB. MiniLM read them in under a minute and a
          half from 91 MB, and beside the bar with the history it adds about half what bge-large does (0.93 points
          against 1.71). A router that adds bge-large has a second model to run and keep, on a machine that can hold
          it. And an embedding model must be pinned to one version: another version places the posts differently, so
          every stored embedding would have to be computed again and the logistic regression refitted on them.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>bge-large beside the bar adds 1.7 settled points on the harness and 2.5 next month, most of it for new senders and short posts. It costs a second, much larger model to run. What does the router do?</>}
          options={[
            {
              label: "Leave the router as it is: under two points does not pay for a second model",
              verdict: "close",
              response: <>A fair call for a router that has to run on small machines, made with its price known.
                But the points go where the router is weakest, new senders and short posts, and the cost is one
                encode per post, not a retraining.</>,
            },
            {
              label: "Replace the words with bge-large alone: it routes level with the bar and is one model, not three",
              verdict: "miss",
              response: <>Level on average, and 1.83 points worse for senders the router has met. The words and the
                embedding are right on different posts; the gain is in having both.</>,
            },
            {
              label: "Put MiniLM beside the bar: it is about fifteen times smaller",
              verdict: "close",
              response: <>It adds 0.93 settled points with the history, about half of what bge-large adds, at a
                fraction of the cost. If the large model will not fit where the router runs, this is the next best
                thing.</>,
            },
            {
              label: "Put bge-large beside the bar as a third term, its version pinned",
              verdict: "best",
              response: <>The bar becomes complement naive Bayes reading all four, plus the sender&rsquo;s history,
                plus bge-large&rsquo;s logistic regression: 0.889 on the harness and 0.881 on the later posts. The
                embedding model is pinned to one version, and the stored embeddings carry a hash of the text they
                encoded, so a change to the router&rsquo;s view is caught before it reaches a route.</>,
            },
          ]}
        />

        <p>
          So the bar now has three parts: the counts of what the post says, who sent it, and where a model that has
          read far more text puts it. The SVM with the same three parts is level with it, as it has been at every
          step. The next page chooses between the two, on what is left to compare when their accuracy is the
          same.
        </p>

        <Callout color={POST} title={<>Borrowed knowledge reaches strangers</>}>
          A model trained on other text knows what the world says about a topic, and nothing about your users. Expect
          it to help most where your own data says least: records from people you have not seen, and records too short
          to carry many features. Measure the gain in those groups before paying to run it.
        </Callout>

        <Followup>
          Take a text classifier of your own. Encode the records with a small and a large sentence-embedding model,
          fit a logistic regression on each, and add its log-probability to your model&rsquo;s scores with the weight
          searched on your validation folds. Split the gain by whether the writer appears in training and by record
          length. Then, for a few records your model gets wrong, list the nearest training records by your features
          and by the embedding, and read which words the wrong neighbours share.
        </Followup>

        <SigRule n={18}>
          <strong>Borrow knowledge where your data is thin.</strong> A pretrained model adds most to the records your
          own data says least about, the short ones and the ones from strangers; measure it there, and keep what your
          own data knows beside it.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/better-features`, label: <>← Better features</> }}
          next={{ href: `${R}/choosing-the-model`, label: <>Next up · Choosing the model →</> }}
        />
      </div>
    </article>
  );
}
