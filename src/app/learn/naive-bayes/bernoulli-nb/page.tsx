import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { NB_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Bernoulli Naive Bayes — Manifold",
  description:
    "The flavour for binary presence/absence features. Each feature is a coin flip per class, and — unlike Multinomial — absence is evidence too. Measured 0.944 on median-binarized wine, and when presence beats frequency.",
};

const TEAL = "var(--c-classification)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BernoulliNbPage() {
  const fromScratch = `from sklearn.datasets import load_wine
from sklearn.preprocessing import KBinsDiscretizer
from sklearn.model_selection import train_test_split

X, y = load_wine(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)

# collapse every feature to ONE bit: above its median, or below
binz = KBinsDiscretizer(n_bins=2, encode="ordinal", strategy="quantile")
Btr, Bte = binz.fit_transform(Xtr), binz.transform(Xte)

# P(feature present | class), smoothed -- one coin per feature per class
classes  = np.unique(ytr)
logprior = np.log([(ytr == c).mean() for c in classes])
p = np.array([(Btr[ytr == c].sum(axis=0) + 1.0) / ((ytr == c).sum() + 2.0) for c in classes])

# the Bernoulli score credits present AND absent features: x*log p + (1-x)*log(1-p)
ll   = Bte @ np.log(p).T + (1 - Bte) @ np.log(1 - p).T
pred = (logprior + ll).argmax(axis=1)
print("BernoulliNB (by hand):", round((pred == yte).mean(), 3))   # 0.944`;

  const withLibrary = `from sklearn.datasets import load_wine
from sklearn.preprocessing import KBinsDiscretizer
from sklearn.model_selection import train_test_split

X, y = load_wine(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)

# collapse every feature to ONE bit: above its median, or below
binz = KBinsDiscretizer(n_bins=2, encode="ordinal", strategy="quantile")
Btr, Bte = binz.fit_transform(Xtr), binz.transform(Xte)

acc = accuracy_score(yte, BernoulliNB().fit(Btr, ytr).predict(Bte))
print("BernoulliNB on 1-bit-per-feature wine:", round(acc, 3))   # 0.944`;

  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: TEAL }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Bernoulli Naive Bayes</>}
        intro={<>The third flavour throws away the counts and keeps only a yes-or-no: does the feature appear at
          all? Bernoulli Naive Bayes models each feature as a coin flip per class — and it does something the
          multinomial cannot: it treats an <em>absent</em> feature as genuine evidence, not merely a missing
          count.</>}
      />

      <div className="lesson">
        <h2>Presence as a coin flip</h2>
        <p>
          Bernoulli NB takes binary features, <M>{String.raw`x_j \in \{0, 1\}`}</M> — 1 for &ldquo;present,&rdquo;
          0 for &ldquo;absent.&rdquo; For text, that is whether a word occurs at all, ignoring how many times.
          Each feature <M>{String.raw`j`}</M> in each class <M>{String.raw`c`}</M> gets one number{" "}
          <M>{String.raw`p_{j,c} = P(x_j = 1 \mid y=c)`}</M> — the probability a class-<M>{String.raw`c`}</M>{" "}
          example has the feature switched on. That is a biased coin, with likelihood:
        </p>

        <MathBlock>{String.raw`P(x_j \mid y=c) = p_{j,c}^{\,x_j}\,(1 - p_{j,c})^{\,1 - x_j}`}</MathBlock>

        <p>
          Read the two cases off the exponents. Present (<M>{String.raw`x_j = 1`}</M>) gives{" "}
          <M>{String.raw`p_{j,c}`}</M>; absent (<M>{String.raw`x_j = 0`}</M>) gives{" "}
          <M>{String.raw`1 - p_{j,c}`}</M>. That second factor is the whole point:{" "}
          <strong>absence carries evidence</strong>. A class in which a word is almost always present pays a
          real penalty, <M>{String.raw`1 - p_{j,c} \approx 0`}</M>, when a test document lacks it. The class
          score multiplies over <em>every</em> feature — present and absent alike — in log-space:
        </p>

        <MathBlock>{String.raw`\log P(y=c \mid \mathbf{x}) = \log P(y=c) + \sum_{j=1}^{d}\Big[\,x_j \log p_{j,c} + (1 - x_j)\log(1 - p_{j,c})\,\Big] + \text{const}`}</MathBlock>

        <p>
          And <M>{String.raw`p_{j,c}`}</M> is estimated by counting, same as ever: the fraction of
          class-<M>{String.raw`c`}</M> documents in which the feature is present (that fraction is the Bernoulli
          maximum-likelihood estimate). Here you count <em>documents</em> rather than word occurrences.
        </p>

        <h2>Absence is the dividing line</h2>
        <p>
          This is the sharp distinction from{" "}
          <Link href="/learn/naive-bayes/multinomial-nb" style={link}>Multinomial NB</Link>. The multinomial only
          multiplies in terms for words that <em>appear</em> — a count-zero word contributes{" "}
          <M>{String.raw`\theta_{w,c}^{0} = 1`}</M> and is silently skipped. Bernoulli explicitly walks the
          entire vocabulary and, for every word the document does <em>not</em> contain, multiplies in the{" "}
          <M>{String.raw`(1 - p_{j,c})`}</M> factor. Missing words vote.
        </p>

        <Callout color={TEAL} title={<>Two different questions</>}>
          Multinomial asks &ldquo;given that words were drawn, how often was each one this word?&rdquo; — a model
          of <em>frequency</em>. Bernoulli asks, for each word independently, &ldquo;is it here or not?&rdquo; — a
          model of <em>presence</em>. Same document, same vocabulary, but the multinomial sees a histogram and
          Bernoulli sees a checklist.
        </Callout>

        <h2>The measured result</h2>
        <p>
          To see it on numbers we already trust, take the wine dataset and{" "}
          <strong>binarize every feature at its median</strong> — each of the 13 continuous measurements becomes
          simply &ldquo;above&rdquo; or &ldquo;below.&rdquo; That throws away a great deal: the exact alcohol
          level collapses to a single bit. Even so, Bernoulli NB reaches <strong>0.944</strong> — against{" "}
          <Link href="/learn/naive-bayes/gaussian-nb" style={link}>Gaussian NB</Link>&rsquo;s{" "}
          <strong>0.963</strong> on the same split using the full continuous values. Two points of accuracy given
          up, for reducing every feature to one bit. Run it:
        </p>

        <CodeBlock setup={NB_SETUP} fromScratch={fromScratch} withLibrary={withLibrary} />

        <h2>When Bernoulli beats Multinomial, and vice-versa</h2>
        <p>
          Bernoulli tends to win on <strong>short documents</strong> — tweets, subject lines, SMS spam flags,
          product tags — where a word appears at most once or twice, so its count adds little over its mere
          presence, and where the <em>absence</em> of a telltale word is strongly informative. Modelling absence
          explicitly is exactly right when the signal is &ldquo;this short message contains none of the usual
          spam words.&rdquo;
        </p>
        <p>
          Multinomial tends to win on <strong>longer documents</strong> — articles, reviews, full emails — where
          word <em>frequency</em> genuinely carries information: a message that says &ldquo;refund&rdquo; six
          times differs from one that says it once, and the multinomial uses that while Bernoulli flattens both
          to a single 1. As documents grow, throwing away the counts costs more than modelling absence buys.
        </p>
        <p>
          The one-line rule: <strong>presence matters &rarr; Bernoulli; frequency matters &rarr; Multinomial.</strong>{" "}
          The next page turns that rule, and the Gaussian rule too, into a single decision table.
        </p>

        <Quiz
          accent={TEAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the crucial modelling difference between Bernoulli and Multinomial NB?</>,
              options: [
                "Bernoulli uses continuous features while Multinomial uses counts",
                "Bernoulli models feature absence with a (1 − p) term for every word not present; Multinomial only multiplies terms for words that appear",
                "Bernoulli requires Laplace smoothing but Multinomial does not",
              ],
              answer: 1,
              explain: <>Bernoulli walks the whole vocabulary: present words contribute p, absent words (1 − p).
                Multinomial skips absent words entirely. So absence is evidence in Bernoulli and a non-event in
                Multinomial.</>,
            },
            {
              q: <>On median-binarized wine, Bernoulli scores 0.944 vs Gaussian&rsquo;s 0.963. What does the gap
                reflect?</>,
              options: [
                "Bernoulli is fundamentally weaker and should be avoided",
                "Binarizing at the median discards the exact values, and that lost information costs about two points here",
                "The two models used different datasets",
              ],
              answer: 1,
              explain: <>Both see the same split; Bernoulli just gets one bit per feature instead of the real
                value. Losing that resolution costs only ~0.02 — showing how much signal survives a crude
                binarization — but the full continuous Gaussian still edges it.</>,
            },
            {
              q: <>Classifying very short SMS messages as spam. Why might Bernoulli beat Multinomial?</>,
              options: [
                "Short messages have higher word counts, which Multinomial can't handle",
                "In short text a word appears at most once, so counts add little over presence, and the absence of typical spam words is strong evidence — which only Bernoulli models",
                "Bernoulli is always more accurate regardless of length",
              ],
              answer: 1,
              explain: <>When documents are short, frequency adds almost nothing over presence, so
                Multinomial&rsquo;s advantage vanishes. And that a message lacks the usual spam vocabulary is
                informative — captured only by Bernoulli&rsquo;s (1 − p) absence terms.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/naive-bayes/multinomial-nb", label: <>← Multinomial Naive Bayes</> }}
          next={{ href: "/learn/naive-bayes/choosing-the-flavour", label: <>Next up · Choosing the flavour →</> }}
        />
      </div>
    </article>
  );
}
