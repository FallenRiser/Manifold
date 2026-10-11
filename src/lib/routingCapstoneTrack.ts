import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Fourth capstone: routing Usenet posts to the right forum (20 Newsgroups, bydate), worked the
// way a data scientist works a text problem in the real world. It picks up where the SVM track's
// closing checklist left off ("text is the classic linear-SVM win") and measures it, on the posts
// the router would actually face. See docs/routing-capstone-plan.md.
// Every number comes from scripts/routing_cases.py.
const R = "/learn/message-routing-capstone";

export const ROUTING_TRACK: TrackChapter[] = [
  {
    title: "Frame the job",
    pages: [
      { title: "Overview & goal", href: R },
      { title: "What job is the model doing?", href: `${R}/the-job` },
      { title: "How the data was made", href: `${R}/how-the-data-was-made` },
      { title: "Anatomy of a post", href: `${R}/anatomy-of-a-post` },
      { title: "Research questions", href: `${R}/research-questions` },
    ],
  },
  {
    title: "First contact: text into numbers",
    pages: [
      { title: "First look at the posts", href: `${R}/first-look` },
      { title: "Words into numbers", href: `${R}/words-into-numbers` },
      { title: "Reading the weights", href: `${R}/reading-the-weights` },
    ],
  },
  {
    title: "The leak audit",
    pages: [
      { title: "The moderator's fingerprint", href: `${R}/the-moderators-fingerprint` },
      { title: "Closing the channels", href: `${R}/closing-the-channels` },
    ],
  },
  {
    title: "Lock the harness",
    pages: [
      { title: "The split that predicts the future", href: `${R}/the-split` },
      { title: "The metric, on the right posts", href: `${R}/the-metric` },
      { title: "Baselines", href: `${R}/baselines` },
    ],
  },
  {
    title: "Model, rung by rung",
    pages: [
      { title: "Naive Bayes", href: `${R}/naive-bayes` },
      { title: "Logistic regression", href: `${R}/logistic-regression` },
      { title: "Linear SVM", href: `${R}/linear-svm` },
      { title: "Kernels and trees", href: `${R}/kernels-and-trees` },
      { title: "Better features", href: `${R}/better-features` },
      { title: "Pretrained embeddings", href: `${R}/pretrained-embeddings` },
      { title: "Choosing the model", href: `${R}/choosing-the-model` },
    ],
  },
  {
    title: "Build the system around it",
    pages: [
      { title: "Reading the errors", href: `${R}/reading-the-errors` },
      { title: "Automate or hand off", href: `${R}/automate-or-hand-off` },
      { title: "The label budget", href: `${R}/the-label-budget` },
      { title: "When the world changes", href: `${R}/when-the-world-changes` },
    ],
  },
  {
    title: "Conclude & transfer",
    pages: [
      { title: "Verdict, playbook & notebook", href: `${R}/takeaways` },
      { title: "Transfer test I (near)", href: `${R}/transfer-near` },
      { title: "Transfer test II (far)", href: `${R}/transfer-far` },
    ],
  },
];

export const ROUTING_TOTAL = ROUTING_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const ROUTING_DONE = ROUTING_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
