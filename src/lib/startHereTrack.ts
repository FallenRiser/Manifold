import type { TrackChapter } from "@/lib/linearRegressionTrack";

// The onboarding track (PROJECT.md §10.6): a short, fully-built runway for
// someone who has never touched ML. Five pages, no maths prerequisites, ends
// by routing the reader into a real track. Everything here has an href — an
// onboarding track with greyed-out pages would defeat its own purpose.
export const START_TRACK: TrackChapter[] = [
  {
    title: "The big idea",
    pages: [
      { title: "You already do machine learning", href: "/learn/start-here" },
      { title: "The three kinds of learning", href: "/learn/start-here/three-kinds-of-learning" },
      { title: "Every model is three choices", href: "/learn/start-here/every-model-is-three-choices" },
    ],
  },
  {
    title: "Using Manifold",
    pages: [
      { title: "How to read this site", href: "/learn/start-here/how-to-read-this-site" },
      { title: "Pick your path", href: "/learn/start-here/pick-your-path" },
    ],
  },
];

export const START_TOTAL = START_TRACK.reduce((n, c) => n + c.pages.length, 0);
export const START_DONE = START_TRACK.reduce(
  (n, c) => n + c.pages.filter((p) => p.href).length,
  0,
);
