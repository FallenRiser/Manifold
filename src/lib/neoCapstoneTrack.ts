import type { TrackChapter } from "@/lib/linearRegressionTrack";

// Second flagship capstone: NASA Nearest-Earth-Objects hazard classification, worked
// the way a data scientist actually works an unfamiliar dataset — and taught for
// TRANSFER (every page teaches the general move, then applies it to NEO, then asks
// the reader to lift it to their own data). See docs/neo-capstone-plan.md.
// Every number/plot is computed from public/capstone/neo_v2.csv via scripts/neo_cases.py.
export const NEO_TRACK: TrackChapter[] = [
  {
    title: "The project & the field",
    pages: [
      { title: "Overview & goal", href: "/learn/asteroid-hazard-capstone" },
      { title: "Researching an unfamiliar field", href: "/learn/asteroid-hazard-capstone/researching-the-field" },
      { title: "The NEO field guide", href: "/learn/asteroid-hazard-capstone/neo-field-guide" },
      { title: "Research questions & hypotheses", href: "/learn/asteroid-hazard-capstone/research-questions" },
    ],
  },
  {
    title: "First contact & integrity",
    pages: [
      { title: "Load & look: what is one row?", href: "/learn/asteroid-hazard-capstone/first-look" },
      { title: "Integrity audit: trust every row?", href: "/learn/asteroid-hazard-capstone/integrity" },
      { title: "Redundancy: one feature in disguise", href: "/learn/asteroid-hazard-capstone/redundancy" },
    ],
  },
  {
    title: "Explore & analyse",
    pages: [
      { title: "Distributions & transforms", href: "/learn/asteroid-hazard-capstone/distributions" },
      { title: "What separates the classes?", href: "/learn/asteroid-hazard-capstone/separation" },
      { title: "From plots to testable checks", href: "/learn/asteroid-hazard-capstone/hypotheses" },
    ],
  },
  {
    title: "Lock the harness before modelling",
    pages: [
      { title: "Choose the metric by cost", href: "/learn/asteroid-hazard-capstone/metrics" },
      { title: "Choose the split: the leakage trap", href: "/learn/asteroid-hazard-capstone/the-split" },
      { title: "Baselines: the number to beat", href: "/learn/asteroid-hazard-capstone/baselines" },
    ],
  },
  {
    title: "Model, rung by rung",
    pages: [
      { title: "Logistic regression", href: "/learn/asteroid-hazard-capstone/logistic" },
      { title: "Decision tree", href: "/learn/asteroid-hazard-capstone/decision-tree" },
      { title: "Random forest", href: "/learn/asteroid-hazard-capstone/random-forest" },
      { title: "Gradient boosting", href: "/learn/asteroid-hazard-capstone/gradient-boosting" },
      { title: "Model comparison", href: "/learn/asteroid-hazard-capstone/model-comparison" },
      { title: "Choosing the operating point", href: "/learn/asteroid-hazard-capstone/operating-point" },
    ],
  },
  {
    title: "Interpret, conclude, hand off",
    pages: [
      { title: "Interpretation: does it agree with reality?", href: "/learn/asteroid-hazard-capstone/interpretation" },
      { title: "Limits: what it can never know", href: "/learn/asteroid-hazard-capstone/limits" },
      { title: "Verdict, playbook & notebook", href: "/learn/asteroid-hazard-capstone/takeaways" },
      { title: "Transfer test I · Pulsars (near)", href: "/learn/asteroid-hazard-capstone/transfer-near" },
      { title: "Transfer test II · Bank marketing (far)", href: "/learn/asteroid-hazard-capstone/transfer-far" },
    ],
  },
];

export const NEO_TOTAL = NEO_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const NEO_DONE = NEO_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
