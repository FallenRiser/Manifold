import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DecisionPoint } from "@/components/DecisionPoint";
import { LabFrame } from "@/components/LabFrame";
import { ArticleOpener, Followup, SigRule } from "@/components/capstone/newsreader";
import KeywordRuleLab from "@/components/labs/KeywordRuleLab";

export const metadata = {
  title: "Baselines — Manifold",
  description:
    "What the router scores without a model: the majority guess on the right posts, and a keyword rule learned from the earlier posts. The linear SVM clears the rule by 17 points, on every forum, and even on the posts the rule is surest of.",
};

const POST = "var(--c-post)";
const R = "/learn/message-routing-capstone";

const outBaselines = `the audited view; harness = earlier posts, 5 folds grouped by thread, scored on their new
threads (weighted: to the later mix of senders it has met); later = the 2527 later new threads

the majority guess                          harness  weighted  later
  the most common forum of all posts        0.0363   0.0345    0.0514  (rec.sport.hockey)
  the most common forum of new threads      0.1281   0.1325    0.1397  (misc.forsale)

a keyword rule learned from the earlier posts: every word seen in 10+ posts belongs to the forum
holding the largest share of its posts; each forum keeps its K words with the largest share; a
post goes to the forum with the most of its keywords. No keyword, or a tie: the rule does not
fire and the post goes to the most common forum of new threads.

         harness                              later new threads
  K      right   weighted  fires  right when  right   fires  right when  SVM on the
                                  it fires                   it fires    same posts
  3      0.2499  0.2445    15.2%  0.9451      0.2212  12.1%  0.9085      0.9281
  5      0.2827  0.2766    21.2%  0.9202      0.2513  16.6%  0.9071      0.9262
  10     0.3510  0.3440    35.2%  0.8882      0.3106  31.6%  0.8636      0.8874
  25     0.4942  0.4893    54.0%  0.8511      0.4404  48.6%  0.8404      0.8803
  50     0.5943  0.5872    68.5%  0.8281      0.5702  66.6%  0.8228      0.8728
  100    0.6543  0.6454    76.4%  0.8247      0.6312  75.8%  0.8022      0.8606
  250    0.6367  0.6274    82.2%  0.7526      0.6343  82.3%  0.7494      0.8514
  1000   0.2297  0.2215    94.3%  0.2334      0.1903  95.7%  0.1860      0.8214
  the harness picks K=100; the later posts would pick K=250 (0.6343)

the linear SVM (C=0.3)                       0.8250   0.8181    0.8168
  SVM - rule (K=100) on the harness: +17.07 points (95%: +15.68 to +18.43); the rule alone is right
  on 140 new threads, the SVM alone on 817
  on the posts the rule is surest of (K=3, it fires on 15.2%): the rule 0.945, the SVM 0.952;
  later 0.908 and 0.928
  forums where the rule (K=100) beats the SVM on the harness: none
  the rule's worst forum: comp.os.ms-windows.misc, 0.199 (the SVM 0.837)

each forum's first 12 keywords (240 words, all earlier posts):
  fragments of an encoded file (most of their posts carry one)  11
  a private person: a name, initials or an address               9
  one conversation (half their posts or more in one thread)     49
  the rest                                                     171`;

export default function BaselinesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: POST }, { label: "Act 4 · Lock the harness", color: "var(--c-metrics)" }]}
        time="about 11 minutes"
        title={<>Baselines: the bar before the model</>}
        intro={<>
          A score means something only next to what the cheapest alternative scores. Two alternatives are always
          available: guess the most common forum, or write a rule that looks for telltale words. Score both on
          the harness before act 5 climbs the model ladder.
        </>}
      />

      <div className="lesson">
        <ArticleOpener act={4} article={13} total={27}>
          What would the router score without machine learning?
        </ArticleOpener>

        <h2>Better than what?</h2>
        <p>
          The linear SVM routes 82.5% of the harness&rsquo;s new threads right. Whether that is good depends on
          what the operators would have without it. If a rule a moderator could write in an afternoon scores 80%,
          the model is a maintenance burden for two points. If the rule scores 40%, the model is the product.
          Nobody knows until the rule is scored, on the same posts, by the same count.
        </p>

        <h2>The majority guess, on the right posts</h2>
        <p>
          The floor every tutorial reports is the most common forum of the training posts, which here is
          rec.sport.hockey. On the later new threads it is right 5.1% of the time. But the router&rsquo;s job is
          new threads, and among those the most common forum is misc.forsale, right 14.0% of the time. Even the
          floor depends on which posts you count.
        </p>

        <h2>A keyword rule</h2>
        <p>
          The rule a team writes first looks for words: &ldquo;NHL&rdquo; means hockey, &ldquo;RSA&rdquo; means
          cryptography. Written by hand, it is one person&rsquo;s guesses. Learned from the earlier posts, it is
          the same kind of rule with less guessing:
        </p>
        <ul style={ol}>
          <li>Every word seen in 10 or more earlier posts belongs to the forum that holds the largest share of the posts containing it.</li>
          <li>Each forum keeps its <em>K</em> words with the largest share.</li>
          <li>A post goes to the forum with the most of its keywords in it. With no keyword, or a tie, the rule does not fire, and the post goes to misc.forsale.</li>
        </ul>
        <p>
          The rule has one dial, the length of the lists. The harness picks it, the same way it picks the
          SVM&rsquo;s C.
        </p>

        <PredictPrompt
          accent={POST}
          prompt={<>With the best list length, how close does the keyword rule get to the SVM&rsquo;s 0.825 on the harness?</>}
          options={["Within 5 points: most forums have telltale words", "10 to 20 points short", "Under half of it"]}
          nudge="Locked in. The output answers it."
        />

        <CodeOutput source="scripts/routing_cases.py">{outBaselines}</CodeOutput>

        <p>
          The harness picks 100 words per forum: 0.654, 0.645 weighted to next month&rsquo;s senders. The SVM
          is 17.07 points higher, with an interval from 15.68 to 18.43, so the gap is settled several times
          over. On the later posts the rule scores 0.631; they would have picked 250 words, by 0.3 points.
        </p>
        <p>
          The dial fails in both directions. Short lists are sure of themselves and rarely speak: with three
          words per forum the rule fires on 15.2% of the harness&rsquo;s new threads and is right on 94.5% of
          them. Long lists speak about everything: with a thousand words per forum it fires on 94.3% and is
          right on 23.3%.
        </p>

        <h2>Where the rule is surest</h2>
        <p>
          A rule that is rarely wrong when it fires could still earn a place in the system, as a front door that
          files the obvious posts before the model sees them. It would need to beat the model on the posts it
          fires on. It does not. On the 15.2% the three-word rule is surest of, the SVM is right on 95.2%, the
          rule on 94.5%; on the later posts, 92.8% against 90.8%. At every list length the SVM does at least as
          well on the rule&rsquo;s own posts, and at the harness&rsquo;s 100 words there is no forum where the rule
          beats it.
          Where they disagree, the rule alone is right on 140 new threads and the SVM alone on 817.
        </p>

        <LabFrame
          accent={POST}
          tryThis={<>Start at 100 words, the harness&rsquo;s pick, with comp.os.ms-windows.misc selected, and read its keywords. Then step down to 3 words and watch the rule fire less and hit more, while the SVM stays ahead on the same posts. Then look at sci.med and talk.politics.guns.</>}
          insight={<>
            The rule&rsquo;s most concentrated words are not its forums&rsquo; topics. They are fragments of
            encoded files, people, and single conversations. That is the same set of shortcuts acts 2 and 3
            found in the model, and a rule shows them to anyone who reads its lists.
          </>}
        >
          <KeywordRuleLab />
        </LabFrame>

        <h2>What the rule learned</h2>
        <p>
          A keyword rule is the most readable model there is, and reading it is worth the trouble. Of the 240
          words at the head of the twenty lists, 11 are fragments of encoded files, and they are all
          comp.os.ms-windows.misc&rsquo;s: its rule files 19.9% of that forum&rsquo;s new threads right, where
          the SVM files 83.7%. Nine are private people&rsquo;s names, initials or addresses. And 49 are one
          conversation&rsquo;s words, with half their posts or more in a single thread: sci.med&rsquo;s list
          holds &ldquo;barbecued&rdquo; and &ldquo;krillean&rdquo;, each from one thread, and
          talk.politics.guns&rsquo;s opens with &ldquo;ranch&rdquo; and &ldquo;dividian&rdquo;, from the Waco
          threads.
        </p>
        <p>
          &ldquo;Most concentrated in one forum&rdquo; turns out to mean &ldquo;written by one person, in one
          file, or in one thread&rdquo; about as often as it means &ldquo;about the forum&rsquo;s topic&rdquo;.
          The SVM reads the same words. What it adds is weighing all of them at once, so that no single
          concentrated word decides a route.
        </p>

        <DecisionPoint
          accent={POST}
          question={<>What does a model in act 5 have to beat?</>}
          options={[
            {
              label: "The majority guess, 14.0% on the later new threads",
              verdict: "miss",
              response: <>Every model clears it. It measures the forum mix, not the router, and belongs in the
                report only to show where zero is.</>,
            },
            {
              label: "The keyword rule, 0.654 on the harness",
              verdict: "close",
              response: <>It is what a team would ship without machine learning, and the question it answers
                matters: yes, a model is worth running here, by 17 points, settled. But that question is now
                answered, and a bar that has been cleared by 17 points cannot choose between two models.</>,
            },
            {
              label: "The linear SVM already built, 0.818 weighted on the harness, by a margin the harness can settle",
              verdict: "best",
              response: <>Act 5 climbs the ladder to replace it, not to reach it. A rung earns its place only by
                beating the SVM on the harness by more than the harness&rsquo;s noise. The majority guess and the
                rule stay in every report as floors, so every number keeps its context.</>,
            },
          ]}
        />

        <p>
          So act 4 is finished. The harness is five thread-grouped folds of the earlier posts, scored on their
          new threads and weighted to next month&rsquo;s senders. The metric counts each new thread once, with
          the twenty forums and their intervals beside it. On the harness the floors are 0.128 for the majority
          guess and 0.654 for the keyword rule, and the bar is the linear SVM at 0.825, 0.818 weighted. Act 5
          starts from the bottom rung.
        </p>

        <Callout color={POST} title={<>A baseline is the alternative, not a formality</>}>
          A baseline says what the model is worth, and only if it is the alternative someone would otherwise
          ship, scored the way the model is scored. Here that is a keyword rule, and the model is worth 17 points
          over it. Score the rule on the records it is surest of, too: a rule that beats the model there has a
          place in the system.
        </Callout>

        <Followup>
          Write down what your team would run without a model: keyword lists, a lookup table, &ldquo;the same
          as last time&rdquo;. Score it on your harness beside the model, overall, per group, and on the records
          it is surest of. Then read what it learned; a rule&rsquo;s lists show the shortcuts in your data more
          plainly than any model&rsquo;s weights.
        </Followup>

        <SigRule n={12}>
          <strong>Score the cheapest honest alternative on the same harness: the majority of the right records,
          and the rule a team would ship without a model.</strong> Keep both in every report, and check whether the
          rule beats the model on the records it is surest of.
        </SigRule>

        <PrevNext
          prev={{ href: `${R}/the-metric`, label: <>← The metric, on the right posts</> }}
          next={{ href: `${R}/naive-bayes`, label: <>Next up · Naive Bayes →</> }}
        />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 14px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
