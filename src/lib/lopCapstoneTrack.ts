import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Fourth flagship capstone, and the first of a NEW GENRE: a FIELD REPORT.
// The other three capstones run entirely on this site. This one documents a real
// project built OFF it — the reader's own gameplay recorded on their own machine,
// a behavioural-cloning model trained on a free cloud GPU, artifacts on GitHub and
// HuggingFace — and the site is the write-up, not the runtime. See
// docs/lies-of-p-capstone-plan.md and PROJECT.md §13.0 (genre 2) / §13.3.
//
// ⚠️ THE RULE THAT GOVERNS THIS TRACK: methodology pages may be written before the
// model exists; RESULTS PAGES MAY NOT. Anything that would report a number ships only
// once that number has been measured from a real run. Pages in the results acts stay
// href-less (the sidebar greys them) until then — that greying is not an oversight,
// it is the honest-numbers rule made visible.
//
// The spine (what makes this worth a capstone rather than a tutorial):
//   T1  Imitation is a SUPERVISED problem wearing a control problem's clothes — and it
//       inherits a failure mode supervised learning does not have: the moment the agent
//       acts, it changes its own input distribution, and drifts somewhere its teacher
//       never was.
//   T2  It is a LATENCY problem as much as a learning problem. A model that is perfectly
//       accurate and 20 ms late parries nothing. The budget is the design constraint.
export const LOP_CAP_TRACK: TrackChapter[] = [
  {
    title: "Frame the field report",
    pages: [
      { title: "Overview & the honest promise", href: "/learn/lies-of-p-capstone" },
      { title: "Why not reinforcement learning?" },
      { title: "What behavioural cloning actually is" },
      { title: "Scoping it: one boss, one arena" },
    ],
  },
  {
    title: "The rig",
    pages: [
      { title: "Capture: frames, inputs, and the clock that joins them" },
      { title: "The latency budget" },
      { title: "Labels: what a keypress means" },
      { title: "Building the dataset without drowning in it" },
    ],
  },
  {
    title: "The model",
    pages: [
      { title: "Choosing a backbone for 6 GB" },
      { title: "Seeing time: frame stacks vs recurrence" },
      { title: "The imbalance problem: parries are rare" },
      { title: "Training off-site: the Kaggle route" },
    ],
  },
  {
    title: "The loop",
    pages: [
      { title: "From logits to keystrokes" },
      { title: "Does the game even accept synthetic input?" },
      { title: "Measuring the loop you actually built" },
    ],
  },
  {
    title: "Results & failure",
    pages: [
      { title: "What it learned" },
      { title: "Distribution shift, watched live" },
      { title: "The dodge-tank problem" },
      { title: "DAgger: teaching it where it goes wrong" },
    ],
  },
  {
    title: "Conclude & transfer",
    pages: [
      { title: "Verdict, artifacts & model card" },
      { title: "The Deep-RL option (and its real cost)" },
      { title: "Transfer: cloning any real-time skill" },
    ],
  },
];

export const LOP_CAP_TOTAL = LOP_CAP_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const LOP_CAP_DONE = LOP_CAP_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
