// Shading "the side the neuron says yes to" correctly.
//
// A half-plane clipped to a rectangle is a triangle, a quadrilateral or a
// pentagon depending on the angle -- so drawing it as a fixed triangle from the
// two boundary endpoints plus one corner is right only some of the time, and
// silently wrong the rest. In a lab whose entire job is showing which side is
// "on", that is not a cosmetic bug.
//
// Sutherland-Hodgman clipping of the box against {w1*x + w2*y + b >= 0} gives
// the exact region for every setting of the weights, including the degenerate
// ones (all of the box, or none of it).

export type Pt = [number, number];

/** Clip any convex polygon against the half-plane {w1*x + w2*y + b >= 0}. */
export function clipHalfPlane(poly: Pt[], w1: number, w2: number, b: number): Pt[] {
  const f = (p: Pt) => w1 * p[0] + w2 * p[1] + b;
  const out: Pt[] = [];

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fc = f(c);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fc >= 0) {
      const t = fa / (fa - fc);
      out.push([a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])]);
    }
  }
  return out;
}

export const box = (lo: number, hi: number): Pt[] =>
  [[lo, lo], [hi, lo], [hi, hi], [lo, hi]];

export function halfPlanePolygon(
  w1: number,
  w2: number,
  b: number,
  lo: number,
  hi: number,
): Pt[] {
  return clipHalfPlane(box(lo, hi), w1, w2, b);
}

/** The boundary segment w1*x + w2*y + b = 0, clipped to the same box. */
export function boundarySegment(
  w1: number,
  w2: number,
  b: number,
  lo: number,
  hi: number,
): [Pt, Pt] | null {
  const hits: Pt[] = [];
  const push = (p: Pt) => {
    if (p[0] >= lo - 1e-9 && p[0] <= hi + 1e-9 && p[1] >= lo - 1e-9 && p[1] <= hi + 1e-9) {
      if (!hits.some((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9)) hits.push(p);
    }
  };
  if (Math.abs(w2) > 1e-12) {
    push([lo, -(w1 * lo + b) / w2]);
    push([hi, -(w1 * hi + b) / w2]);
  }
  if (Math.abs(w1) > 1e-12) {
    push([-(w2 * lo + b) / w1, lo]);
    push([-(w2 * hi + b) / w1, hi]);
  }
  return hits.length >= 2 ? [hits[0], hits[1]] : null;
}
