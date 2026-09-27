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
      { title: "Closing the channels" },
    ],
  },
  {
    title: "Lock the harness",
    pages: [
      { title: "The split that predicts the future" },
      { title: "The metric, on the right posts" },
      { title: "Baselines" },
    ],
  },
  {
    title: "Model, rung by rung",
    pages: [
      { title: "Naive Bayes" },
      { title: "Logistic regression" },
      { title: "Linear SVM" },
      { title: "Do kernels or trees help?" },
      { title: "Better features" },
      { title: "Pretrained embeddings" },
      { title: "Choosing the model" },
    ],
  },
  {
    title: "Build the system around it",
    pages: [
      { title: "Reading the errors" },
      { title: "Automate or hand off" },
      { title: "The label budget" },
      { title: "When the world changes" },
    ],
  },
  {
    title: "Conclude & transfer",
    pages: [
      { title: "Verdict, playbook & notebook" },
      { title: "Transfer test I (near)" },
      { title: "Transfer test II (far)" },
    ],
  },
];

export const ROUTING_TOTAL = ROUTING_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const ROUTING_DONE = ROUTING_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
