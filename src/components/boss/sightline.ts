// Where the room's pieces stand, and which of them are between the camera and a fighter.
//
// The chase camera sits 6 to 16 units behind the knight, so near the ring's edge it swings out past
// the columns, braziers and banners, and they stand in front of the one thing the player has to see.
// Any piece that crosses a sightline to either fighter fades out (arenaScene.ts does the fading).
//
// Pure geometry with no imports: arenaScene.ts places every piece from layout(), so the shapes the
// fade tests are the shapes that are drawn, and scripts/boss_controls_check.mjs runs the same test in
// node against scripted duels. Everything is in units of the ring radius R, as the room is.
//
// Angles are the world's: a piece at angle a stands at (sin a, cos a) * radius. An object turned by
// rotation.y = a has its local +z pointing at (sin a, cos a) and its local +x at (cos a, -sin a).

export type Kind = "pillar" | "brazier" | "statue" | "throne" | "banner" | "arch";

/** A piece as the sightline test sees it: a vertical slab around the floor segment (x0,z0)-(x1,z1),
 *  r thick on each side, from height lo to hi. A column is a segment of length zero. */
export type Piece = { kind: Kind; x0: number; z0: number; x1: number; z1: number; r: number; lo: number; hi: number };

const TAU = Math.PI * 2;

export function layout(R: number) {
  return {
    pillars: Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * TAU + 0.1;
      return { a, x: Math.sin(a) * (R + 2.1), z: Math.cos(a) * (R + 2.1), h: 0.8 + ((i * 7) % 5) * 0.1 };
    }),
    braziers: Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * TAU + Math.PI / 6;
      return { a, x: Math.sin(a) * (R + 1.35), z: Math.cos(a) * (R + 1.35) };
    }),
    statues: [-1, 1].map((s) => ({ s, x: s * 6.4, z: -(R + 1.2) })),
    throne: { x: 0, z: -(R + 2.4) },
    banners: Array.from({ length: 6 }, (_, i) => {
      const a = ((i + 0.5) / 6) * TAU + 0.1;
      return { a, x: Math.sin(a) * (R + 2.45), z: Math.cos(a) * (R + 2.45) };
    }),
    arches: Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * TAU;
      return { a, x: Math.sin(a) * (R + 7.5), z: Math.cos(a) * (R + 7.5) };
    }),
  };
}

// sizes, shared with the meshes in arenaScene.ts
export const PILLAR = { rTop: 0.34, rBottom: 0.5, height: 11, centre: 5.2, cap: 1.15, capH: 0.42 };
export const BANNER = { w: 1.7, h: 4.4, top: 7.6 };
export const ARCH = { r: 1.5, tube: 0.34, y: 3.4 };

/** Every piece that can stand between the camera and a fighter. */
export function pieces(R: number): Piece[] {
  const L = layout(R);
  const out: Piece[] = [];
  const dot = (kind: Kind, x: number, z: number, r: number, lo: number, hi: number) =>
    out.push({ kind, x0: x, z0: z, x1: x, z1: z, r, lo, hi });
  // a piece hung across the ring's tangent at angle a: its width runs along (cos a, -sin a)
  const across = (kind: Kind, a: number, x: number, z: number, half: number, r: number, lo: number, hi: number) =>
    out.push({ kind, x0: x - half * Math.cos(a), z0: z + half * Math.sin(a), x1: x + half * Math.cos(a), z1: z - half * Math.sin(a), r, lo, hi });

  for (const p of L.pillars) {
    // the square caps are wider than the shaft: half their diagonal
    dot("pillar", p.x, p.z, (PILLAR.cap / 2) * Math.SQRT2, 0, (PILLAR.centre + PILLAR.height / 2) * p.h);
  }
  for (const b of L.braziers) dot("brazier", b.x, b.z, 0.4, 0, 3.6);
  for (const s of L.statues) dot("statue", s.x, s.z, 1.55, 0, 5.65);
  // the throne wall: two jambs and a great arch across x = -3.3..3.3
  out.push({ kind: "throne", x0: -3.3, z0: L.throne.z, x1: 3.3, z1: L.throne.z, r: 0.7, lo: 0, hi: 7.7 });
  for (const b of L.banners) across("banner", b.a, b.x, b.z, BANNER.w / 2, 0.08, BANNER.top - BANNER.h, BANNER.top);
  for (const c of L.arches) across("arch", c.a, c.x, c.z, ARCH.r + ARCH.tube, ARCH.tube, ARCH.y - ARCH.tube, ARCH.y + ARCH.r + ARCH.tube);
  return out;
}

type V3 = { x: number; y: number; z: number };

/**
 * Does the piece stand between the camera and the point? Measured on the floor plan: the nearest
 * approach of the sightline to the piece's segment, then the sightline's height at that point. A
 * piece at or beyond the point does not block it; a camera standing inside a piece is blocked.
 */
export function blocks(p: Piece, cam: V3, at: V3, pad: number): boolean {
  // closest points between segment C->T (parameter s) and segment P0->P1 (parameter t), in x-z
  const dx = at.x - cam.x, dz = at.z - cam.z;
  const ex = p.x1 - p.x0, ez = p.z1 - p.z0;
  const wx = cam.x - p.x0, wz = cam.z - p.z0;
  const a = dx * dx + dz * dz, b = dx * ex + dz * ez, c = ex * ex + ez * ez;
  const d = dx * wx + dz * wz, e = ex * wx + ez * wz;
  let s: number, t: number;
  if (c < 1e-12) {
    t = 0;
    s = a < 1e-12 ? 0 : clamp(-d / a);
  } else {
    const den = a * c - b * b;
    s = den > 1e-12 ? clamp((b * e - c * d) / den) : 0;
    t = (b * s + e) / c;
    if (t < 0) { t = 0; s = a < 1e-12 ? 0 : clamp(-d / a); }
    else if (t > 1) { t = 1; s = a < 1e-12 ? 0 : clamp((b - d) / a); }
  }
  if (s > 0.98) return false; // at or beyond the fighter
  const qx = cam.x + s * dx - (p.x0 + t * ex), qz = cam.z + s * dz - (p.z0 + t * ez);
  // the fighter's half-width seen from the lens: nothing at the camera, all of it at the fighter
  if (qx * qx + qz * qz > (p.r + pad * s) ** 2) return false;
  const y = cam.y + s * (at.y - cam.y);
  return y >= p.lo && y <= p.hi;
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** The points on each fighter a sightline must reach: feet, middle and head, with half a body's
 *  width of margin. The boss is nearly twice the knight's height. */
export const KNIGHT_SIGHT = { heights: [0.25, 0.9, 1.65], pad: 0.35 };
export const BOSS_SIGHT = { heights: [0.4, 1.5, 2.7], pad: 0.8 };

/** Does the piece hide any part of the knight at (px, pz) or the boss at (bx, bz)? extra widens both
 *  fighters, which the arena uses to keep a faded piece faded until it is clearly out of the way. */
export function hides(p: Piece, cam: V3, px: number, pz: number, bx: number, bz: number, extra = 0) {
  return (
    KNIGHT_SIGHT.heights.some((h) => blocks(p, cam, { x: px, y: h, z: pz }, KNIGHT_SIGHT.pad + extra)) ||
    BOSS_SIGHT.heights.some((h) => blocks(p, cam, { x: bx, y: h, z: bz }, BOSS_SIGHT.pad + extra))
  );
}

/** Which pieces block the camera's view of either fighter. */
export function blocking(list: Piece[], cam: V3, px: number, pz: number, bx: number, bz: number, extra = 0) {
  return list.map((p) => hides(p, cam, px, pz, bx, bz, extra));
}

/** rotation.y that turns an object at angle a so its local +z faces the middle of the ring. */
export const facingIn = (a: number) => a + Math.PI;
/** rotation.y that lays an object's local +x along the ring's tangent at angle a. */
export const alongRing = (a: number) => a;
