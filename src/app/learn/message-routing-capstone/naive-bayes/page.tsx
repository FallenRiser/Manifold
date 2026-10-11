import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import NaiveBayesLab from "@/components/labs/NaiveBayesLab";

export const metadata = {
  title: "Naive Bayes — Manifold",
  description:
    "The oldest text classifier on the harness. The textbook model cannot route to a forum whose word counts are mostly encoded files; three fixes from 2003 take it past the linear SVM by a point, and the lead survives paying for the choice.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";
const link: React.CSSProperties = { color: POST, textDecoration: "underline", textUnderlineOffset: 3 };

const outNaiveBayes = `the audited view; harness = earlier posts, 5 folds grouped by thread, scored on their 3966 new
threads (weighted: to the later mix of senders it has met). Every cell picks its own alpha,
the smoothing, on the harness from 0.01, 0.03, 0.1, 0.3, 1.

the textbook model: multinomial naive Bayes on word counts, alpha 0.1
  harness 0.7526, weighted 0.7442; the SVM 0.8250, 0.8181
  comp.os.ms-windows.misc: 18 of its 276 harness new threads routed there (the SVM 231); the model
  sends 20 of all 3966 there
  19 of its 591 earlier posts carry an encoded file; they hold 73.6% of the words it counts
  'the' per 1000 counted words: 12.4 in comp.os.ms-windows.misc, 25.0 to 62.8 in the other forums

the fixes of Rennie et al. (2003), one at a time; harness, with each cell's alpha
                                   multinomial      complement       complement, weights normalised
  word counts                      0.7526  0.1      0.7774  0.3      0.7595  0.3
  + log counts                     0.7592  0.03     0.8043  1        0.7786  1
  + each post's length normalised  0.7975  0.01     0.8348  0.1      0.8260  0.1
  + IDF (the SVM's TF-IDF)         0.8058  0.03     0.8293  0.3      0.8270  0.3
  each step against the row above, paired, points (95%):
  + log counts                     +0.66 (+0.05, +1.24)  +2.70 (+1.97, +3.43)  +1.92 (+1.26, +2.60)
  + each post's length normalised  +3.83 (+2.87, +4.74)  +3.05 (+2.27, +3.83)  +4.74 (+3.91, +5.60)
  + IDF (the SVM's TF-IDF)         +0.83 (+0.23, +1.41)  -0.55 (-1.03, -0.05)  +0.10 (-0.43, +0.63)
  complement against multinomial, lengths normalised: +3.73 (+2.70, +4.74)
  complement on the SVM's TF-IDF against the SVM: +0.43 (-0.58, +1.36)
  the linear SVM, lengths normalised 0.8011 (C=1)
  the linear SVM, + IDF              0.8250 (C=0.3)

the harness's pick among all 60: complement, log counts with each post's length normalised
  (no IDF), alpha 0.1
  chosen on four folds and scored on the fifth: 0.8328 (the same pick in 4 of 5 folds)
  the SVM, choosing its C and whether to use IDF the same way: 0.8222

the pick against the linear SVM (C=0.3, TF-IDF)
                                 naive Bayes  SVM      naive Bayes - SVM, points (95%)
  harness, 3966 new threads      0.8348       0.8250   +0.98 (+0.05, +1.89)
  both chosen fold by fold       0.8328       0.8222   +1.06 (+0.10, +1.97)
  weighted                       0.8283       0.8181
  known senders, 1802            0.8751       0.8674   +0.78 (-0.55, +2.05)
  new senders, 2164              0.8013       0.7897   +1.16 (-0.18, +2.54)
  each forum once                0.8041       0.8061
  they route 87.4% of the new threads alike and are right on 89.6% of those; of the 499 where
  they differ, naive Bayes alone is right on 205, the SVM alone on 166, neither on 128

  per forum on the harness, 95% intervals; * the whole interval is below 0.75
                                n   naive Bayes            SVM
  alt.atheism                  35   0.400 (0.229-0.571)*  0.457 (0.314-0.629)*
  comp.graphics               301   0.784 (0.734-0.831)   0.771 (0.721-0.817)
  comp.os.ms-windows.misc     276   0.768 (0.717-0.819)   0.837 (0.793-0.880)
  comp.sys.ibm.pc.hardware    317   0.729 (0.681-0.776)   0.700 (0.653-0.754)
  comp.sys.mac.hardware       267   0.846 (0.801-0.888)   0.801 (0.753-0.850)
  comp.windows.x              347   0.867 (0.830-0.902)   0.824 (0.784-0.865)
  misc.forsale                508   0.852 (0.821-0.882)   0.874 (0.844-0.904)
  rec.autos                   146   0.822 (0.760-0.884)   0.774 (0.705-0.842)
  rec.motorcycles             128   0.898 (0.844-0.945)   0.859 (0.797-0.922)
  rec.sport.baseball          161   0.932 (0.888-0.969)   0.925 (0.882-0.963)
  rec.sport.hockey            206   0.981 (0.961-0.995)   0.971 (0.947-0.990)
  sci.crypt                   140   0.957 (0.921-0.986)   0.900 (0.850-0.943)
  sci.electronics             226   0.699 (0.637-0.761)   0.690 (0.628-0.752)
  sci.med                     163   0.859 (0.804-0.908)   0.859 (0.804-0.908)
  sci.space                   188   0.963 (0.936-0.984)   0.899 (0.856-0.941)
  soc.religion.christian      171   0.889 (0.842-0.936)   0.807 (0.748-0.860)
  talk.politics.guns           79   0.924 (0.861-0.975)   0.886 (0.810-0.949)
  talk.politics.mideast       172   0.971 (0.942-0.994)   0.953 (0.919-0.983)
  talk.politics.misc           73   0.699 (0.602-0.808)   0.849 (0.767-0.932)
  talk.religion.misc           62   0.242 (0.145-0.355)*  0.484 (0.355-0.613)*
  naive Bayes is higher on 14 forums, the SVM on 5, level on 1
  below the floor: naive Bayes alt.atheism, talk.religion.misc
                   the SVM     alt.atheism, talk.religion.misc
  talk.religion.misc: naive Bayes sends 41 of its 62 to soc.religion.christian, the SVM 25

the later new threads (report only): multinomial on word counts 0.7388, routing 0 of the 170
  comp.os.ms-windows.misc new threads there; the pick 0.8219, the SVM 0.8168,
  the pick - the SVM +0.51 (-0.71, +1.66)

the lab's posts (later new threads; counts / lengths normalised / complement / SVM):
  407 comp.os.ms-windows.misc
    comp.windows.x / right / right / right
  924 sci.crypt
    right / comp.graphics / right / comp.graphics
  2274 talk.religion.misc
    soc.religion.christian / soc.religion.christian / soc.religion.christian / right`;

export default function NaiveBayesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 13 minutes"
        title={<>Naive Bayes: the first rung</>}
        intro={<>
          The oldest text classifier fits by counting words. In its textbook form it scores seven points under
          the SVM on the harness, and almost never routes to one of the forums. The fixes published in 2003 take it past
          the SVM. The question is whether &ldquo;past&rdquo; is more than the harness&rsquo;s noise.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={5} article={14} total={27}>
          Can a model that only counts words route the posts?
        </ArticleOpener>

        <h2>Counting words per forum</h2>
        <p>
          <Link href="/learn/naive-bayes/multinomial-nb" style={link}>Multinomial naive Bayes</Link> learns one
          thing per forum: what share of the forum&rsquo;s words each word makes up. To route a post, it adds up,
          for every forum, the log of that share for each word in the post (a word that appears three times
          counts three times), plus the log of the forum&rsquo;s share of the posts. The forum with the highest
          total wins. A small constant, alpha, is added to every count so that a word a forum has never used
          does not rule it out; it is the model&rsquo;s one dial (the
          track on <Link href="/learn/naive-bayes/laplace-smoothing" style={link}>smoothing</Link> covers it).
        </p>
        <p>
          Teams start here for good reasons. Fitting is counting, one pass over the posts with nothing to
          converge. Adding a post means adding its counts. And every route is a sum of word votes that can be
          read off, as the lab below does.
        </p>

        <h2>The textbook model, and a forum it cannot see</h2>
        <p>
          On word counts, with its best alpha, the model files 75.3% of the harness&rsquo;s new threads right, 7.2
          points under the SVM. One forum accounts for most of the gap. Of comp.os.ms-windows.misc&rsquo;s 276
          new threads on the harness, it routes 18 there and the SVM 231: 213 posts, 5.4 of the 7.2 points. Across
          all 3,966 it sends only 20 posts to that forum. On the later posts it sends none of the 170.
        </p>
        <p>
          The cause is 19 posts. Nineteen of the forum&rsquo;s 591 earlier posts carry an encoded file, pages of
          text-encoded binary like the bitmap met in{" "}
          <Link href={`${R}/words-into-numbers`} style={link}>words into numbers</Link>, and those 19 hold 73.6%
          of the words the forum&rsquo;s counts are made of. Ordinary English is diluted accordingly: in
          comp.os.ms-windows.misc&rsquo;s counts, &ldquo;the&rdquo; is 12.4 words in every thousand, where the other
          forums have 25.0 to 62.8. So every &ldquo;the&rdquo; in a post is a vote against that forum, and a
          Windows question written in plain English loses to its own grammar. Any queue where a few records are
          enormous (pasted logs, attachments, stack traces) distorts a counting model the same way.
        </p>

        <h2>The fixes from 2003</h2>
        <p>
          Jason Rennie, Lawrence Shih, Jaime Teevan and David Karger took the model&rsquo;s assumptions apart in
          &ldquo;Tackling the poor assumptions of naive Bayes text classifiers&rdquo; (ICML 2003), testing on this
          dataset; Rennie also keeps the page that documents the release this capstone uses. Their fixes, each a
          change to the numbers the model counts or to how it counts them:
        </p>
        <ul style={ol}>
          <li><strong>Log counts.</strong> A word used seven times is not seven independent pieces of evidence. Count 1 + ln(n) instead of n.</li>
          <li><strong>Each post&rsquo;s length normalised.</strong> Scale every post to the same length before it is added to its forum&rsquo;s totals, so no post, however long, outweighs another. This is the fix aimed at the 19 posts.</li>
          <li><strong>IDF.</strong> Weigh down the words that appear in most posts. With all three, the numbers are exactly the TF-IDF the SVM reads.</li>
          <li><strong>Complement.</strong> Estimate each forum&rsquo;s word shares from the posts of all the <em>other</em> forums, and vote for the forum whose complement least expects the post&rsquo;s words. Nineteen forums&rsquo; posts give steadier estimates than one forum&rsquo;s.</li>
          <li><strong>Weights normalised.</strong> Scale each forum&rsquo;s weights to the same total, so no forum wins by having larger weights overall.</li>
        </ul>
        <p>
          The paper found the fixed model level with an SVM on random splits of this dataset, 0.861 against 0.862.
          Random splits flatter every model here, as <Link href={`${R}/the-split`} style={link}>the split</Link> showed,
          so the harness has to say it again, on new threads.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>With the best of the fixes, where does naive Bayes land against the SVM&rsquo;s 0.825 on the harness?</>}
          options={["Still well short: it is the naive model", "Level, within the harness's noise", "Ahead, by more than the noise"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outNaiveBayes}</CodeOutput>

        <p>
          Normalising each post&rsquo;s length is the fix that matters: 3.1 to 4.7 points for every kind of model,
          settled each time. The complement adds 3.7 points over the multinomial model on the same numbers. Log
          counts help every kind, by 0.7 to 2.7 points. Normalising the weights scores below the plain complement
          at every step.
        </p>
        <p>
          IDF is the surprise. It helps the multinomial model by 0.83 points and costs the complement model 0.55,
          both settled. The paper&rsquo;s full recipe is not the best one on these posts. The SVM goes the other
          way: without IDF it drops to 0.801, with it 0.825. On the SVM&rsquo;s own features, complement naive
          Bayes scores 0.829, level with the SVM within the noise; on its own best features it scores 0.835. A
          comparison on one fixed set of features measures how well each model suits those features.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start on the Windows question with word counts, and read the votes for comp.windows.x. Then switch to lengths normalised. Then take the crypto request through all three models, and look at which words carry the complement model.</>}
          insight={<>
            On raw counts the Windows question is lost to &ldquo;to&rdquo;, &ldquo;the&rdquo; and &ldquo;of&rdquo;, by 94
            log units; with lengths normalised the vote is close, and &ldquo;windows&rdquo; leads it. The verse posted
            to talk.religion.misc shows what counting cannot do: its words are soc.religion.christian&rsquo;s, and the
            strongest votes for where it was posted are the daily series&rsquo; date and &ldquo;promise&rdquo;.
          </>}
        >
          <NaiveBayesLab />
        </LabFrame>

        <h2>Past the bar, or past the noise?</h2>
        <p>
          The harness&rsquo;s pick is complement naive Bayes on log counts with each post&rsquo;s length normalised,
          no IDF, alpha 0.1: 0.835, 0.828 weighted to next month&rsquo;s senders. Against the SVM that is 0.98
          points, with an interval from 0.05 to 1.89. It clears the noise by a twentieth of a point.
        </p>
        <p>
          But it is the best of 60 settings, and the best of many is flattered: some of its lead is the luck of
          being chosen on the same posts it is scored on. The harness can price that. For each fold, choose the
          setting on the other four folds, then score it on this one. Chosen that way, naive Bayes scores 0.833,
          making the same choice in four folds of five, and the SVM, choosing its C and whether to use IDF the
          same way, scores 0.822. The choosing costs each model two to three tenths of a point, and the lead is 1.06
          points, from 0.10 to 1.97. It survives, thinly. Known and new senders both lean the same way, neither
          settled on its own.
        </p>

        <h2>Where it wins, and where it loses</h2>
        <p>
          Naive Bayes is higher on 14 forums and the SVM on 5. But the two largest differences either way are the
          SVM&rsquo;s: talk.religion.misc falls from 0.484 to 0.242 and talk.politics.misc from 0.849 to 0.699.
          comp.os.ms-windows.misc falls too, from 0.837 to 0.768; naive Bayes&rsquo;s largest gain is
          soc.religion.christian, from 0.807 to 0.889. Counting each forum once, the SVM is still marginally
          ahead, 0.806 to 0.804. The talk.religion.misc losses go one way: naive Bayes sends 41 of its 62 new
          threads to soc.religion.christian, the SVM 25. The verse in the lab, a later post, goes the same way.
        </p>
        <p>
          The <Link href={`${R}/the-metric`} style={link}>metric</Link> says what to do with this. The ranking is
          per new thread; the per-forum report names the forums whose whole interval sits below 0.75. Both models
          name the same two, alt.atheism and talk.religion.misc, so naive Bayes adds no forum to the list. Most of
          its talk.religion.misc losses land in the same family, which is what act 6 will price when it decides
          how much a near miss costs.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>Naive Bayes beats the SVM on the harness by a point, settled by a tenth of a point after paying for the choice. What is the bar for the next rung?</>}
          options={[
            {
              label: "Keep the SVM: a point is thin, and this is the naive model",
              verdict: "miss",
              response: <>The rule was set before the result: a rung that beats the bar by more than the noise
                takes it. Changing the rule when the cheap model wins is the same as having no rule.</>,
            },
            {
              label: "Check the later posts before switching",
              verdict: "miss",
              response: <>Then the later posts become a second harness, and every rung after this one gets chosen on
                them too. They report; they do not choose. (They say +0.51, from &minus;0.71 to +1.66: the same
                direction, and too few posts to settle it.)</>,
            },
            {
              label: "Complement naive Bayes becomes the bar, with its forum losses on record",
              verdict: "best",
              response: <>The bar is now 0.835 on the harness, 0.828 weighted. Every rung from here must beat it by
                more than the noise, and its two largest forum losses, talk.religion.misc (0.242) and
                talk.politics.misc (0.699), stay on record until act 6 decides what a near miss costs.</>,
            },
          ]}
        />

        <p>
          So the first rung takes the bar. The textbook model, on counts, would have been dismissed at 0.753; the
          fixed one, chosen fairly, beats the SVM that act 4 built the harness around. The later posts, reported
          and not used, put it at 0.822 against the SVM&rsquo;s 0.817. Next comes logistic regression, which reads the
          same words but fits its weights to separate the forums, as the SVM does.
        </p>

        <Callout color={POST} title={<>The model and its features are chosen together</>}>
          Naive Bayes wants no IDF and the SVM needs it. Compare each model at its own best settings, not at
          one model&rsquo;s. Then pay for the search: choose on some folds and score on the others, so the winner
          is not just the luckiest of many tries.
        </Callout>

        <Followup>
          Before dismissing the cheap model on your data, look for the classes where a few records hold most of
          the text (attachments, logs, forwarded threads), and normalise each record&rsquo;s length. Give every
          candidate its own feature settings, choose them fold by fold, and see which one is left standing.
        </Followup>

        <SigRule n={13}>
          <strong>Compare each model at its own best features, and pay for the search.</strong> Choose settings on
          some folds and score them on the others; a lead that survives that is a lead.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/baselines`, label: <>← Baselines</> }}
          next={{ href: `${R}/logistic-regression`, label: <>Next up · Logistic regression →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
