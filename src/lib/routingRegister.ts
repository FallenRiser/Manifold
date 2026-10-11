// The message-routing capstone's prediction register: the hypotheses written on the
// "Research questions" page, before acts 2 to 6 look at the posts.
//
// The wording is frozen once published. When a later page settles one, it fills in `verdict`
// and `settled` here (and says so in its own text); it never edits the claim or the test.

export type Verdict = "confirmed" | "wrong" | "not settled";

export type Hypothesis = {
  id: string;
  /** the decision the answer feeds */
  decides: string;
  claim: string;
  why: string;
  wrongIf: string;
  /** where it gets settled: act number and the page's title */
  act: number;
  page: string;
  verdict?: Verdict;
  /** href of the page that settled it */
  settled?: string;
  /** what the settling page measured, in one sentence (the takeaways page's scorecard) */
  result?: string;
};

export const HYPOTHESES: Hypothesis[] = [
  {
    id: "H1",
    decides: "Which models are worth trying",
    claim:
      "Nothing non-linear beats the linear SVM on the new threads. An RBF-kernel SVM, a random forest, boosted trees and nearest neighbours all score below it, and the tree models trail it by more than three points.",
    why:
      "A post uses a handful of the 110,000 words. A linear model adds up evidence from every word it contains at once; a tree asks about one word per split, and most words are never asked about.",
    wrongIf: "any of them beats the linear SVM, or a tree model gets within three points of it.",
    act: 5,
    page: "Kernels and trees",
    verdict: "not settled",
    settled: "/learn/message-routing-capstone/kernels-and-trees",
    result:
      "Every non-linear model routed worse than the linear SVM, but the forest trailed by 2.82 points and the boosted trees by 3.63, and both intervals straddle three.",
  },
  {
    id: "H2",
    decides: "Whether the router's view is clean",
    claim:
      "The moderator's marks are not only in the header lines. Some soc.religion.christian posts carry words the moderator wrote inside the body, which the router's view reads, and at least one such word is among that forum's twenty heaviest in the model.",
    why:
      "In a moderated forum the moderator is the one who posts every article (page 3). Someone who handles every post can write in it, too.",
    wrongIf: "none of the forum's twenty heaviest words in the router's view comes from the moderator rather than the posters.",
    act: 3,
    page: "The moderator's fingerprint",
    verdict: "confirmed",
    settled: "/learn/message-routing-capstone/the-moderators-fingerprint",
    result:
      "The moderator's initials ranked 4th of the forum's twenty heaviest words, and 80 of their 83 uses sat inside the moderator's notes.",
  },
  {
    id: "H3",
    decides: "Whether the leaks can be audited one at a time",
    claim:
      "On a random split the channels back each other up. Removing the header lines, the quotes or the signatures on its own costs little; removing all three costs at least three times what the costliest one costs alone.",
    why:
      "The same person is named in several places: the From line, the sign-off, the line above a quote that says who wrote it. Close one and the model reads the name from another.",
    wrongIf: "any one channel on its own costs more than a third of what closing all three costs.",
    act: 3,
    page: "Closing the channels",
    verdict: "wrong",
    settled: "/learn/message-routing-capstone/closing-the-channels",
    result:
      "Closing the quotes alone cost 82% of what closing all three channels cost: the quotes carried it, as the thread's own text rather than names.",
  },
  {
    id: "H4",
    decides: "Whether the embedding buys knowledge of topics or of people",
    claim: "Putting the embedding beside the word counts helps new senders at least as much as familiar ones.",
    why:
      "The embedding model learned from other text. It can tell what a post is about, but it has never met these people, and familiar senders are already routed well from their words and their sign-offs (page 4).",
    wrongIf: "familiar senders gain more than new senders do.",
    act: 5,
    page: "Pretrained embeddings",
    verdict: "confirmed",
    settled: "/learn/message-routing-capstone/pretrained-embeddings",
    result: "New senders gained 1.37 points more than familiar ones, from 0.04 to 2.74: narrowly settled.",
  },
  {
    id: "H5",
    decides: "Whether a near miss needs its own place in the metric and the hand-off",
    claim:
      "Most mistakes are near misses: more than half of the misrouted new threads land in a forum of their own family (the five comp forums, the four rec, the four sci, the three talk.politics, or the three about religion).",
    why:
      "Forums in a family share their words. A question about a graphics card could sit in any of four comp forums. If mistakes fell at random over the other nineteen forums, at most four in nineteen would stay in the family.",
    wrongIf: "half or fewer of the misrouted new threads stay in their family.",
    act: 6,
    page: "Reading the errors",
    verdict: "not settled",
    settled: "/learn/message-routing-capstone/reading-the-errors",
    result: "51.9% of the harness's misroutes stayed in their family, from 47.4% to 56.7%: the interval straddles half.",
  },
  {
    id: "H6",
    decides: "How to set the threshold so the promise holds next month",
    claim:
      "The 95% promise slipped because the threshold was set on posts from more familiar senders than the later posts have. Set it on folds grouped by sender instead of by thread, and the later posts get their 95%.",
    why:
      "Familiar senders are routed better (page 4). In folds grouped by thread, a sender's other posts sit in the other folds, so the older posts look more familiar than next month will: only 36.5% of the later new threads come from someone the router has met.",
    wrongIf: "with the threshold set on sender-grouped folds, the later posts still come out below 95%.",
    act: 6,
    page: "Automate or hand off",
    verdict: "wrong",
    settled: "/learn/message-routing-capstone/automate-or-hand-off",
    result:
      "Set on sender-grouped folds, the threshold delivered 93.88% next month, wholly below 95%. Set on each forum's latest quarter, it delivered 94.4%.",
  },
  {
    id: "H7",
    decides: "Whether the threshold alone protects the router when a new forum appears",
    claim: "Posts from a forum left out of training mostly fall below the threshold: fewer than one in ten are routed without a person.",
    why:
      "When no forum fits, the two best scores should be close together, and a small gap between them is exactly what the threshold refuses.",
    wrongIf: "one in ten or more of the left-out forum's posts are routed on their own.",
    act: 6,
    page: "When the world changes",
    verdict: "wrong",
    settled: "/learn/message-routing-capstone/when-the-world-changes",
    result:
      "37.0% of a left-out forum's threads were filed without a person, mostly into a neighbour. Holding the new forum's family brought it to 9.1%.",
  },
];

export type Estimate = {
  id: string;
  question: string;
  act: number;
  page: string;
  /** href of the page that measured it */
  measured?: string;
  /** the measured answer, in one sentence */
  result?: string;
};

/** Questions that need a number but have no evidence yet to predict it from. */
export const ESTIMATES: Estimate[] = [
  {
    id: "E1",
    question: "How many labelled posts does a new forum need before the router can file its threads?",
    act: 6,
    page: "The label budget",
    measured: "/learn/message-routing-capstone/the-label-budget",
    result:
      "About 80, weighted to an average forum's pull: 73.7% of its threads routed right, against 37.1% for the same posts as fitted.",
  },
];
