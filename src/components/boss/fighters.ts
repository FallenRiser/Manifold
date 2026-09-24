// The two bodies, and the poses they take.
//
// Read this file as a renderer, not as physics. The pose functions take the SAME state the
// simulation stepped -- e.pa, e.pf, e.bm, e.bf, e.bStagger -- and turn it into joint angles. They
// never write to the duel, so nothing here can change an outcome.
//
// Where the animation and the hit test disagree, the hit test wins and the floor wedge in
// DuelArenaLab is the one to trust: the wedge is drawn from m.reach and m.arc directly, while the
// weapon swing is only approximately that long. A sword tip is decoration; the wedge is the rule.

import * as THREE from "three";
import * as V1 from "./duelSim";
import { moveLen, phaseAt, type Seg } from "./duelSim";

/**
 * The handful of world constants the poses need, so that one renderer can draw either world.
 *
 * The rigs and the room are shared between v1 and v2 on purpose: a visual improvement should
 * land in both, and the only things that genuinely differ between the two fights are the timing
 * numbers and the list of move names. Those are here; everything else below is world-agnostic.
 */
export type PoseRules = {
  MOVES: { name: string; seg: Seg[] }[];
  ATK_SEG: Seg[];
  /** v2 only: the player's heavy attack. Undefined means the world has no second swing. */
  ATK2_SEG?: Seg[];
  A_ATK: number; A_HEAVY: number; A_MOVE0: number; A_PARRY: number; A_ROLL0: number;
  ROLL_LEN: number; PARRY_LEN: number; PAR_I0: number; PAR_I1: number;
  ENGAGE: number; HITSTUN: number; GUARDBREAK: number;
};

/** v1, and the default, so every existing call site keeps drawing exactly what it drew before. */
export const V1_POSE: PoseRules = {
  MOVES: V1.MOVES, ATK_SEG: V1.ATK_SEG,
  A_ATK: V1.A_ATK, A_HEAVY: -1, A_MOVE0: V1.A_MOVE0, A_PARRY: V1.A_PARRY, A_ROLL0: V1.A_ROLL0,
  ROLL_LEN: V1.ROLL_LEN, PARRY_LEN: V1.PARRY_LEN, PAR_I0: V1.PAR_I0, PAR_I1: V1.PAR_I1,
  ENGAGE: V1.ENGAGE, HITSTUN: V1.HITSTUN, GUARDBREAK: V1.GUARDBREAK,
};

/**
 * What a pose actually reads off a duel. Both Duel classes satisfy this structurally, which is
 * how one renderer draws two different simulations without either of them knowing.
 */
export type PoseState = {
  pa: number; pf: number; pStun: number; guarding: boolean;
  bm: number; bf: number; bStagger: number; d: number;
};

export type Rig = {
  root: THREE.Group; // world position, and which way the body faces
  spin: THREE.Group; // the roll tumble, pivoting at hip height
  body: THREE.Group; // lean and crouch
  hips: THREE.Group; // the twist a swing comes from
  head: THREE.Group;
  armR: THREE.Group; foreR: THREE.Group; handR: THREE.Group;
  armL: THREE.Group; foreL: THREE.Group; handL: THREE.Group;
  legR: THREE.Group; legL: THREE.Group;
  skin: THREE.MeshStandardMaterial; // the tintable armour
  edge: THREE.MeshStandardMaterial; // the weapon, which lights up on active frames
  shield?: THREE.Group;
  walk: number;
  hipY: number;
};

/** Base armour colours. The lab tints these per frame, so it has to know what to tint back to. */
export const SKIN = { knight: 0xb9c2d0, boss: 0x565c6c };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const geos: THREE.BufferGeometry[] = [];
const mats: THREE.Material[] = [];
const g = <T extends THREE.BufferGeometry>(x: T) => { geos.push(x); return x; };
const m = <T extends THREE.Material>(x: T) => { mats.push(x); return x; };

/** A tapered limb hanging DOWN from the origin, so the group's origin is the joint. */
function limb(len: number, rTop: number, rBot: number, mat: THREE.Material, seg = 7) {
  const geo = g(new THREE.CylinderGeometry(rTop, rBot, len, seg));
  geo.translate(0, -len / 2, 0);
  return new THREE.Mesh(geo, mat);
}
/** A tapered torso standing UP from the origin. */
function trunk(len: number, rBot: number, rTop: number, mat: THREE.Material, seg = 8) {
  const geo = g(new THREE.CylinderGeometry(rTop, rBot, len, seg));
  geo.translate(0, len / 2, 0);
  return new THREE.Mesh(geo, mat);
}
const box = (w: number, h: number, d: number, mat: THREE.Material) =>
  new THREE.Mesh(g(new THREE.BoxGeometry(w, h, d)), mat);

/** A blade lying along +z from the grip, so hand.rotation.x alone aims it: 0 forward, +PI/2 down. */
function sword(len: number, wide: number, thick: number, steel: THREE.Material, trim: THREE.Material) {
  const grp = new THREE.Group();
  const blade = box(wide, thick, len, steel);
  blade.position.z = len / 2 + 0.16;
  const tip = new THREE.Mesh(g(new THREE.ConeGeometry(wide * 0.62, wide * 1.7, 4)), steel);
  tip.rotation.x = Math.PI / 2;
  tip.rotation.z = Math.PI / 4;
  tip.position.z = len + 0.16 + wide * 0.6;
  const guard = box(wide * 2.2, thick * 2.4, 0.09, trim);
  guard.position.z = 0.13;
  const grip = box(thick * 2.2, thick * 2.2, 0.28, trim);
  grip.position.z = -0.06;
  const pommel = new THREE.Mesh(g(new THREE.SphereGeometry(wide * 0.42, 8, 6)), trim);
  pommel.position.z = -0.22;
  grp.add(blade, tip, guard, grip, pommel);
  return grp;
}

// ------------------------------------------------------------------ the player
export function buildKnight(): Rig {
  const steel = m(new THREE.MeshStandardMaterial({ color: SKIN.knight, roughness: 0.42, metalness: 0.62 }));
  const cloth = m(new THREE.MeshStandardMaterial({ color: 0x2f4867, roughness: 0.92 }));
  const leather = m(new THREE.MeshStandardMaterial({ color: 0x4a3f34, roughness: 0.85 }));
  const edge = m(new THREE.MeshStandardMaterial({
    color: 0xd9dee8, roughness: 0.22, metalness: 0.85, emissive: 0xe8b84b, emissiveIntensity: 0,
  }));
  const gold = m(new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.75 }));

  const root = new THREE.Group();
  const spin = new THREE.Group();
  const body = new THREE.Group();
  const hips = new THREE.Group();
  spin.position.y = 0.86;
  root.add(spin);
  spin.add(body);
  body.add(hips);

  const torso = trunk(0.5, 0.2, 0.27, steel);
  torso.scale.z = 0.74;
  const skirt = limb(0.3, 0.26, 0.2, cloth, 8);
  skirt.scale.z = 0.8;
  const belt = box(0.4, 0.07, 0.3, leather);
  belt.position.y = 0.02;
  hips.add(torso, skirt, belt);

  for (const s of [-1, 1]) {
    const pauldron = new THREE.Mesh(g(new THREE.SphereGeometry(0.17, 8, 6)), steel);
    pauldron.position.set(s * 0.29, 0.46, 0);
    pauldron.scale.set(1, 0.8, 0.9);
    hips.add(pauldron);
  }

  const head = new THREE.Group();
  head.position.y = 0.62;
  const helm = new THREE.Mesh(g(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 8)), steel);
  const dome = new THREE.Mesh(g(new THREE.SphereGeometry(0.15, 10, 8)), steel);
  dome.position.y = 0.11;
  dome.scale.y = 0.8;
  const visor = box(0.2, 0.05, 0.06, m(new THREE.MeshStandardMaterial({ color: 0x0a0c11, roughness: 1 })));
  visor.position.set(0, 0.02, 0.14);
  const crest = box(0.035, 0.16, 0.28, gold);
  crest.position.y = 0.2;
  head.add(helm, dome, visor, crest);
  hips.add(head);

  const arm = (s: number) => {
    const up = new THREE.Group();
    up.position.set(s * 0.3, 0.42, 0);
    up.add(limb(0.3, 0.095, 0.08, steel));
    const fore = new THREE.Group();
    fore.position.y = -0.3;
    fore.add(limb(0.29, 0.08, 0.07, leather));
    const hand = new THREE.Group();
    hand.position.y = -0.29;
    fore.add(hand);
    up.add(fore);
    hips.add(up);
    return { up, fore, hand };
  };
  const R = arm(1);
  const L = arm(-1);
  R.hand.add(sword(0.95, 0.075, 0.028, edge, gold));

  // a kite shield, extruded from an outline so it reads as a shield and not a plank
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.34);
  shape.bezierCurveTo(0.26, 0.3, 0.3, 0.1, 0.24, -0.1);
  shape.bezierCurveTo(0.18, -0.3, 0.08, -0.4, 0, -0.46);
  shape.bezierCurveTo(-0.08, -0.4, -0.18, -0.3, -0.24, -0.1);
  shape.bezierCurveTo(-0.3, 0.1, -0.26, 0.3, 0, 0.34);
  const shieldGeo = g(new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }));
  const shield = new THREE.Group();
  const face = new THREE.Mesh(shieldGeo, m(new THREE.MeshStandardMaterial({ color: 0x35506f, roughness: 0.66, metalness: 0.2 })));
  const boss = new THREE.Mesh(g(new THREE.SphereGeometry(0.07, 8, 6)), gold);
  boss.position.z = 0.1;
  shield.add(face, boss);
  shield.position.set(0, -0.06, 0.1);
  L.hand.add(shield);

  const cape = box(0.38, 0.52, 0.035, m(new THREE.MeshStandardMaterial({
    color: 0x24344d, roughness: 0.96, side: THREE.DoubleSide,
  })));
  cape.position.set(0, 0.2, -0.2);
  cape.rotation.x = -0.09;
  hips.add(cape);

  const leg = (s: number) => {
    const th = new THREE.Group();
    th.position.set(s * 0.13, -0.04, 0);
    th.add(limb(0.42, 0.12, 0.095, cloth));
    const shin = new THREE.Group();
    shin.position.y = -0.42;
    shin.add(limb(0.38, 0.09, 0.075, steel));
    const foot = box(0.15, 0.08, 0.28, leather);
    foot.position.set(0, -0.4, 0.05);
    shin.add(foot);
    th.add(shin);
    hips.add(th);
    return th;
  };

  const legRg = leg(1);
  const legLg = leg(-1);

  // --- detail. None of it animates; it only has to hold up in silhouette at six metres, which
  // is the range the camera actually sits at. Anything finer than that is wasted triangles.
  const gorget = new THREE.Mesh(g(new THREE.CylinderGeometry(0.19, 0.23, 0.09, 8)), steel);
  gorget.position.y = 0.52;
  hips.add(gorget);

  // breath slits: the one cue that turns a metal cylinder into a great helm
  const slitMat = m(new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: 1 }));
  for (let i = -1; i <= 1; i++) {
    const slit = box(0.016, 0.08, 0.03, slitMat);
    slit.position.set(i * 0.052, -0.055, 0.15);
    head.add(slit);
  }

  // a surcoat over the mail skirt, split at the front so the legs still read when it walks
  for (const s of [-1, 1]) {
    const panel = box(0.17, 0.48, 0.028, cloth);
    panel.position.set(s * 0.1, -0.21, 0.185);
    panel.rotation.x = -0.05;
    hips.add(panel);
  }

  // scabbard on the offhand hip — empty, because the sword is in his hand
  const scabbard = box(0.055, 0.055, 0.66, leather);
  scabbard.position.set(-0.21, -0.24, -0.04);
  scabbard.rotation.set(0.32, 0.22, 0);
  hips.add(scabbard);

  // a longer second cape panel, so the cloak tapers instead of ending in a straight hem
  const capeTail = box(0.3, 0.34, 0.03, m(new THREE.MeshStandardMaterial({
    color: 0x1d2b41, roughness: 0.97, side: THREE.DoubleSide,
  })));
  capeTail.position.set(0, -0.2, -0.235);
  capeTail.rotation.x = -0.16;
  hips.add(capeTail);

  for (const th of [legRg, legLg]) {
    const cop = new THREE.Mesh(g(new THREE.SphereGeometry(0.1, 8, 6)), steel);
    cop.position.set(0, -0.42, 0.035);
    cop.scale.set(1, 0.85, 0.92);
    th.add(cop);
  }

  return {
    root, spin, body, hips, head,
    armR: R.up, foreR: R.fore, handR: R.hand,
    armL: L.up, foreL: L.fore, handL: L.hand,
    legR: legRg, legL: legLg,
    skin: steel, edge, shield, walk: 0, hipY: 0.86,
  };
}

// ------------------------------------------------------------------ the boss
export function buildBoss(): Rig {
  const iron = m(new THREE.MeshStandardMaterial({ color: SKIN.boss, roughness: 0.55, metalness: 0.55 }));
  const cloth = m(new THREE.MeshStandardMaterial({ color: 0x6b2427, roughness: 0.92 }));
  const dark = m(new THREE.MeshStandardMaterial({ color: 0x2c2f38, roughness: 0.72, metalness: 0.4 }));
  const edge = m(new THREE.MeshStandardMaterial({
    color: 0x6e737f, roughness: 0.34, metalness: 0.8, emissive: 0xef4444, emissiveIntensity: 0,
  }));
  const ember = m(new THREE.MeshStandardMaterial({ color: 0x120a08, emissive: 0xff5b2e, emissiveIntensity: 3.2 }));

  const root = new THREE.Group();
  const spin = new THREE.Group();
  const body = new THREE.Group();
  const hips = new THREE.Group();
  spin.position.y = 1.4;
  root.add(spin);
  spin.add(body);
  body.add(hips);

  const torso = trunk(0.84, 0.36, 0.54, iron);
  torso.scale.z = 0.8;
  const tabard = box(0.5, 0.78, 0.1, cloth);
  tabard.position.set(0, -0.28, 0.3);
  const skirt = limb(0.44, 0.44, 0.34, cloth, 8);
  hips.add(torso, tabard, skirt);

  for (const s of [-1, 1]) {
    const pauldron = new THREE.Mesh(g(new THREE.ConeGeometry(0.36, 0.42, 7)), dark);
    pauldron.position.set(s * 0.6, 0.82, 0);
    pauldron.rotation.z = s * 0.5;
    hips.add(pauldron);
    const spike = new THREE.Mesh(g(new THREE.ConeGeometry(0.08, 0.34, 5)), dark);
    spike.position.set(s * 0.72, 0.96, 0);
    spike.rotation.z = s * 0.9;
    hips.add(spike);
  }

  const head = new THREE.Group();
  head.position.y = 1.0;
  const helm = new THREE.Mesh(g(new THREE.CylinderGeometry(0.22, 0.27, 0.4, 7)), iron);
  const crown = new THREE.Mesh(g(new THREE.SphereGeometry(0.23, 10, 8)), iron);
  crown.position.y = 0.16;
  crown.scale.y = 0.78;
  head.add(helm, crown);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(g(new THREE.ConeGeometry(0.075, 0.62, 6)), dark);
    horn.position.set(s * 0.2, 0.24, -0.02);
    horn.rotation.z = s * 0.72;
    horn.rotation.x = -0.35;
    head.add(horn);
    const eye = new THREE.Mesh(g(new THREE.SphereGeometry(0.043, 7, 6)), ember);
    eye.position.set(s * 0.09, 0.02, 0.22);
    head.add(eye);
  }
  hips.add(head);

  const arm = (s: number) => {
    const up = new THREE.Group();
    up.position.set(s * 0.6, 0.74, 0);
    up.add(limb(0.52, 0.17, 0.14, iron));
    const fore = new THREE.Group();
    fore.position.y = -0.52;
    fore.add(limb(0.5, 0.15, 0.12, dark));
    const hand = new THREE.Group();
    hand.position.y = -0.5;
    fore.add(hand);
    up.add(fore);
    hips.add(up);
    return { up, fore, hand };
  };
  const R = arm(1);
  const L = arm(-1);
  R.hand.add(sword(2.25, 0.34, 0.085, edge, dark));

  const leg = (s: number) => {
    const th = new THREE.Group();
    th.position.set(s * 0.26, -0.08, 0);
    th.add(limb(0.66, 0.21, 0.17, iron));
    const shin = new THREE.Group();
    shin.position.y = -0.66;
    shin.add(limb(0.58, 0.16, 0.13, dark));
    const foot = box(0.26, 0.12, 0.46, dark);
    foot.position.set(0, -0.6, 0.08);
    shin.add(foot);
    th.add(shin);
    hips.add(th);
    return th;
  };

  const legRg = leg(1);
  const legLg = leg(-1);

  // --- detail. The boss is read almost entirely as a shape against the firelight, so the budget
  // goes on things that change the OUTLINE -- horns, cloak, pauldrons -- and on the one warm
  // element that says it is alive.
  for (const [sx, sy, rz, len] of [[0.30, 0.08, 1.15, 0.40], [0.13, 0.30, 0.40, 0.46]] as const) {
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(g(new THREE.ConeGeometry(0.052, len, 5)), dark);
      horn.position.set(s * sx, sy, -0.05);
      horn.rotation.z = s * rz;
      horn.rotation.x = -0.5;
      head.add(horn);
    }
  }

  // the furnace under the breastplate, and the cracks it has opened in the iron
  const core = new THREE.Mesh(g(new THREE.SphereGeometry(0.14, 10, 8)), ember);
  core.position.set(0, 0.5, 0.4);
  core.scale.z = 0.45;
  hips.add(core);
  const cracks: [number, number, number, number][] = [
    [-0.22, 0.30, 0.30, -0.7], [0.19, 0.24, 0.26, 0.9], [-0.07, 0.68, 0.22, 0.3],
    [0.26, 0.60, 0.18, -1.1], [-0.28, 0.58, 0.16, 0.6],
  ];
  for (const [cx, cy, h, rz] of cracks) {
    const crack = box(0.03, h, 0.02, ember);
    crack.position.set(cx, cy, 0.42);
    crack.rotation.z = rz;
    hips.add(crack);
  }

  // a heavy cloak: three stacked panels, each longer and further back than the last
  for (let i = 0; i < 3; i++) {
    const layer = box(1.02 - i * 0.14, 1.5 + i * 0.34, 0.035, cloth);
    layer.position.set(0, 0.06 - i * 0.14, -0.44 - i * 0.055);
    layer.rotation.x = -0.11 - i * 0.045;
    hips.add(layer);
  }

  for (const th of [legRg, legLg]) {
    const greave = new THREE.Mesh(g(new THREE.ConeGeometry(0.2, 0.26, 6)), dark);
    greave.position.set(0, -0.64, 0.04);
    greave.rotation.x = Math.PI / 2;
    th.add(greave);
  }

  return {
    root, spin, body, hips, head,
    armR: R.up, foreR: R.fore, handR: R.hand,
    armL: L.up, foreL: L.fore, handL: L.hand,
    legR: legRg, legL: legLg,
    skin: iron, edge, walk: 0, hipY: 1.4,
  };
}

// ------------------------------------------------------------------ posing
function rest(r: Rig) {
  r.spin.rotation.set(0, 0, 0);
  r.spin.position.y = r.hipY;
  r.spin.scale.setScalar(1);
  r.body.rotation.set(0, 0, 0);
  r.body.position.set(0, 0, 0);
  r.hips.rotation.set(0, 0, 0);
  r.head.rotation.set(0, 0, 0);
  for (const j of [r.armR, r.armL, r.foreR, r.foreL, r.handR, r.handL, r.legR, r.legL]) {
    j.rotation.set(0, 0, 0);
  }
}

/**
 * The player. Priority matches the simulation's own: a stun overrides everything, then the locked
 * animations (roll, attack, parry), then the held buttons.
 */
export function poseKnight(r: Rig, e: PoseState, dt: number, rules: PoseRules = V1_POSE) {
  // Shadow the world's constants into local scope. Everything below then reads exactly as it did
  // when there was only one world, and picks up v2's timings without a line of it changing.
  const {
    ATK_SEG: LIGHT_SEG, ATK2_SEG, A_ATK, A_HEAVY, A_MOVE0, A_PARRY, A_ROLL0,
    ROLL_LEN, PARRY_LEN, PAR_I0, PAR_I1, HITSTUN, GUARDBREAK,
  } = rules;
  // v2's heavy attack is the same motion, wound further and held longer, so it runs through the
  // same three-phase block with its own segment lengths.
  const heavy = ATK2_SEG !== undefined && e.pa === A_HEAVY;
  const ATK_SEG = heavy ? ATK2_SEG! : LIGHT_SEG;
  const ATK_LEN = moveLen({ seg: ATK_SEG });
  const swinging = e.pa === A_ATK || heavy;
  const HEFT = heavy ? 1.28 : 1; // the heavy winds up further and lands harder
  rest(r);
  const breathe = Math.sin(performance.now() / 620) * 0.012;
  r.armR.rotation.x = 0.22;
  r.foreR.rotation.x = -0.55;
  r.handR.rotation.x = 1.15;
  r.armL.rotation.x = 0.18;
  r.armL.rotation.z = -0.1;
  r.foreL.rotation.x = -0.95;
  r.handL.rotation.y = -0.5;
  r.body.position.y = breathe;

  const rolling = e.pa >= A_ROLL0 && e.pa <= A_ROLL0 + 3;

  if (e.pStun > 0) {
    // the recoil, deepest on the frame it lands and unwinding over the stun
    const total = e.pStun > HITSTUN ? GUARDBREAK : HITSTUN;
    const u = clamp01(e.pStun / total);
    r.body.rotation.x = -0.5 * u;
    r.head.rotation.x = -0.4 * u;
    r.armR.rotation.x = 0.2 + 0.9 * u;
    r.armL.rotation.x = 0.2 + 1.1 * u;
    r.armL.rotation.z = -0.5 * u;
    r.legR.rotation.x = 0.3 * u;
    r.legL.rotation.x = -0.45 * u;
    r.spin.position.y = r.hipY - 0.1 * u;
    return;
  }

  if (rolling) {
    const u = clamp01(e.pf / ROLL_LEN);
    // Named by the axis they actually travel, not by the key: quarter q steps along eighth 2q,
    // so 1 is local +x (which the shoulder camera shows on the left) and 3 is local -x.
    const q = e.pa - A_ROLL0;
    const turn = 2 * Math.PI * ease(u);
    if (q === 0) r.spin.rotation.x = turn;
    else if (q === 2) r.spin.rotation.x = -turn;
    else if (q === 1) r.spin.rotation.z = -turn;
    else r.spin.rotation.z = turn;
    const tuck = Math.sin(Math.PI * u);
    r.spin.position.y = r.hipY - 0.3 * tuck;
    r.spin.scale.setScalar(1 - 0.16 * tuck);
    r.legR.rotation.x = -1.5 * tuck;
    r.legL.rotation.x = -1.35 * tuck;
    r.armR.rotation.x = -0.4 - 0.7 * tuck;
    r.armL.rotation.x = -0.4 - 0.7 * tuck;
    r.foreR.rotation.x = -1.6 * tuck;
    r.body.rotation.x = 0.5 * tuck;
    return;
  }

  if (swinging && e.pf < ATK_LEN) {
    const [kind] = phaseAt({ seg: ATK_SEG }, e.pf);
    if (kind === "w") {
      const u = ease(clamp01(e.pf / ATK_SEG[0][1]));
      r.hips.rotation.y = lerp(0, -0.62 * HEFT, u);
      r.armR.rotation.x = lerp(0.22, -2.3 * HEFT, u);
      r.armR.rotation.z = lerp(0, -0.5, u);
      r.foreR.rotation.x = lerp(-0.55, -0.9, u);
      r.handR.rotation.x = lerp(1.15, -0.5, u);
      r.body.rotation.x = lerp(0, -0.1, u);
    } else if (kind === "h") {
      const u = clamp01((e.pf - ATK_SEG[0][1] + 1) / ATK_SEG[1][1]);
      r.hips.rotation.y = lerp(-0.62 * HEFT, 0.5 * HEFT, u);
      r.armR.rotation.x = lerp(-2.3 * HEFT, 0.55, u);
      r.armR.rotation.z = lerp(-0.5, 0.35, u);
      r.foreR.rotation.x = -0.5;
      r.handR.rotation.x = lerp(-0.5, 0.9, u);
      r.body.rotation.x = 0.16;
      r.spin.position.y = r.hipY - 0.05;
    } else {
      const u = ease(clamp01((e.pf - ATK_SEG[0][1] - ATK_SEG[1][1]) / ATK_SEG[2][1]));
      r.hips.rotation.y = lerp(0.5 * HEFT, 0, u);
      r.armR.rotation.x = lerp(0.55, 0.22, u);
      r.armR.rotation.z = lerp(0.35, 0, u);
      r.foreR.rotation.x = lerp(-0.5, -0.55, u);
      r.handR.rotation.x = lerp(0.9, 1.15, u);
      r.body.rotation.x = lerp(0.16, 0, u);
    }
    if (e.guarding) raiseShield(r, 0.75);
    return;
  }

  if (e.pa === A_PARRY && e.pf < PARRY_LEN) {
    // the flick, and the five frames in the middle of it that actually catch a blow
    const open = e.pf >= PAR_I0 && e.pf <= PAR_I1;
    const u = e.pf < PAR_I0 ? clamp01(e.pf / PAR_I0) : open ? 1 : 1 - clamp01((e.pf - PAR_I1) / (PARRY_LEN - PAR_I1));
    const k = ease(u);
    r.armL.rotation.x = lerp(0.18, -1.55, k);
    r.armL.rotation.z = lerp(-0.1, 0.5, k);
    r.foreL.rotation.x = lerp(-0.95, -0.15, k);
    r.handL.rotation.y = lerp(-0.5, -1.35, k);
    r.hips.rotation.y = lerp(0, -0.34, k);
    r.body.rotation.x = 0.07 * k;
    return;
  }

  if (e.guarding) raiseShield(r, 1);

  const moving = e.pa >= A_MOVE0 && e.pa <= A_MOVE0 + 7;
  if (moving) {
    r.walk += dt * (e.guarding ? 5.2 : 8.4);
    const s = Math.sin(r.walk);
    r.legR.rotation.x = s * 0.55;
    r.legL.rotation.x = -s * 0.55;
    if (!e.guarding) {
      r.armL.rotation.x += s * 0.3;
      r.armR.rotation.x -= s * 0.22;
    }
    r.spin.position.y = r.hipY + Math.abs(Math.cos(r.walk)) * 0.035 - 0.02;
    // lean into the direction of travel, in the local frame: +z is straight at the boss
    const a = (e.pa - A_MOVE0) * (Math.PI / 4);
    r.body.rotation.x += 0.13 * Math.cos(a);
    r.body.rotation.z += -0.13 * Math.sin(a);
  } else {
    r.walk += dt * 1.1;
    r.legR.rotation.x = Math.sin(r.walk) * 0.03;
    r.legL.rotation.x = -Math.sin(r.walk) * 0.03;
  }
}

function raiseShield(r: Rig, amount: number) {
  r.armL.rotation.x = lerp(0.18, -1.2, amount);
  r.armL.rotation.z = lerp(-0.1, 0.42, amount);
  r.foreL.rotation.x = lerp(-0.95, -0.92, amount);
  r.handL.rotation.y = lerp(-0.5, -1.5, amount);
  r.hips.rotation.y = lerp(0, -0.3, amount);
  r.spin.position.y = r.hipY - 0.05 * amount;
}

/** The five moves, as poses. Keyframes are (windup end) -> (strike end) for each segment. */
type Key = { armX: number; armZ: number; foreX: number; handX: number; hipY: number; lean: number; drop: number };
const K = (armX: number, armZ: number, foreX: number, handX: number, hipY: number, lean: number, drop = 0): Key =>
  ({ armX, armZ, foreX, handX, hipY, lean, drop });

const IDLE_KEY = K(0.35, -0.05, -0.75, 1.0, 0, 0.12);
//                              wound                         struck
const SWING: Record<string, [Key, Key]> = {
  slash: [K(-0.7, -1.05, -1.15, -0.25, -0.85, -0.12), K(-0.25, 0.75, -0.35, 0.55, 0.95, 0.24)],
  thrust: [K(0.85, -0.15, -2.1, 0.05, -0.42, -0.18), K(-0.12, -0.05, -0.05, 0.0, 0.3, 0.34)],
  heavy: [K(-2.55, -0.1, -0.5, -0.85, -0.2, -0.22), K(0.72, -0.05, -0.25, 1.15, 0.18, 0.4, 0.16)],
  slam: [K(-2.75, 0.12, -0.3, -1.2, 0, -0.3), K(0.95, 0.05, -0.1, 1.3, 0, 0.5, 0.42)],
  combo: [K(-0.55, -0.95, -1.2, -0.3, -0.7, -0.08), K(-0.2, 0.7, -0.3, 0.5, 0.8, 0.2)],

  // --- v2. Each one has to be legible from the windup alone, because the windup is all the
  // warning there is -- and they are the three shapes v1 could not make.
  // jab: barely a windup at all. A short cock of the elbow and a straight punch of the blade.
  jab: [K(0.55, -0.1, -1.85, 0.35, -0.22, -0.1), K(0.05, 0.0, -0.2, 0.15, 0.22, 0.14)],
  // sweep: wound almost horizontally behind the body, then dragged all the way through. The
  // enormous hip travel is the tell that there is no side to step to.
  sweep: [K(-0.15, -1.5, -0.55, -0.1, -1.25, -0.06, 0.3), K(-0.05, 1.45, -0.25, 0.3, 1.35, 0.1, 0.34)],
  // flurry / onslaught: a tight, fast string. Small travel per beat so the hits read as separate
  // strikes rather than as one long swing, which is what a player parrying on rhythm needs to see.
  flurry: [K(-0.95, -0.75, -1.35, -0.35, -0.55, -0.10), K(-0.10, 0.60, -0.45, 0.45, 0.62, 0.18)],
  onslaught: [K(-1.05, -0.62, -1.25, -0.30, -0.48, -0.12), K(-0.05, 0.68, -0.40, 0.50, 0.58, 0.20)],
  // lunge: wound back low and behind, weapon trailing, then thrown forward with the whole body
  // committed. It has to read as TRAVEL from a long way off, not as another swing.
  lunge: [K(0.95, -0.35, -2.35, -0.15, -0.78, -0.30), K(-0.35, 0.05, -0.15, 0.25, 0.52, 0.46, 0.12)],
  // eruption: both arms up, weapon vertical, held far too long, then driven into the floor.
  eruption: [K(-2.95, 0.0, -0.15, -1.55, 0, -0.42), K(1.15, 0.0, 0.0, 1.45, 0, 0.62, 0.58)],
};

/** Moves that drive a shockwave ring out of the floor, and how far it travels. */
const SHOCK: Record<string, number> = { slam: 2.6, eruption: 4.2 };

function applyKey(r: Rig, k: Key, mirror: number) {
  r.armR.rotation.x = k.armX;
  r.armR.rotation.z = k.armZ * mirror;
  r.foreR.rotation.x = k.foreX;
  r.handR.rotation.x = k.handX;
  r.hips.rotation.y = k.hipY * mirror;
  r.body.rotation.x = k.lean;
  r.spin.position.y = r.hipY - k.drop;
}
const blend = (a: Key, b: Key, u: number): Key =>
  K(lerp(a.armX, b.armX, u), lerp(a.armZ, b.armZ, u), lerp(a.foreX, b.foreX, u),
    lerp(a.handX, b.handX, u), lerp(a.hipY, b.hipY, u), lerp(a.lean, b.lean, u), lerp(a.drop, b.drop, u));

/** Returns the shockwave radius to draw this frame, or 0. */
export function poseBoss(r: Rig, e: PoseState, dt: number, rules: PoseRules = V1_POSE): number {
  const { MOVES, ENGAGE } = rules;
  rest(r);
  applyKey(r, IDLE_KEY, 1);
  r.armL.rotation.x = 0.3;
  r.armL.rotation.z = 0.12;
  r.foreL.rotation.x = -0.6;

  if (e.bStagger > 0) {
    // down on one knee, weapon on the flags. This is the riposte window, so it has to read
    // instantly from across the arena.
    const u = clamp01(e.bStagger / 12); // the last frames are the recovery back to its feet
    const k = Math.min(1, u);
    r.spin.position.y = r.hipY - 0.62 * k;
    r.body.rotation.x = 0.62 * k;
    r.head.rotation.x = 0.5 * k;
    r.legR.rotation.x = -1.75 * k;
    r.legL.rotation.x = 0.45 * k;
    r.armR.rotation.x = 1.15 * k;
    r.foreR.rotation.x = -0.15;
    r.handR.rotation.x = 0.5;
    r.armL.rotation.x = 1.0 * k;
    return 0;
  }

  if (e.bm < 0) {
    // walking the player down, or standing off waiting out its cooldown
    const chasing = e.d > ENGAGE;
    r.walk += dt * (chasing ? 4.0 : 1.3);
    const s = Math.sin(r.walk);
    const amp = chasing ? 0.42 : 0.05;
    r.legR.rotation.x = s * amp;
    r.legL.rotation.x = -s * amp;
    r.armL.rotation.x += s * amp * 0.5;
    r.spin.position.y = r.hipY + Math.abs(Math.cos(r.walk)) * (chasing ? 0.06 : 0.015);
    r.body.rotation.x = 0.12 + (chasing ? 0.05 : 0);
    return 0;
  }

  const mv = MOVES[e.bm];
  const [kind, seg] = phaseAt(mv, e.bf);
  let start = 0;
  for (let i = 0; i < seg; i++) start += mv.seg[i][1];
  const n = mv.seg[seg][1];
  const u = clamp01((e.bf - start) / Math.max(1, n));
  const [wound, struck] = SWING[mv.name];
  // a combo alternates sides between its two swings; every other move keeps one side
  const mirror = mv.name === "combo" && seg >= 2 ? -1 : 1;

  let shock = 0;
  if (kind === "w") {
    applyKey(r, blend(IDLE_KEY, wound, ease(u)), mirror);
  } else if (kind === "d") {
    // The delay. It must look EXACTLY like the end of the windup: this is the frames the boss
    // spends holding a pose that does nothing, and it is the whole reason a fixed reaction fails.
    applyKey(r, wound, mirror);
  } else if (kind === "h") {
    applyKey(r, blend(wound, struck, ease(clamp01((e.bf - start + 1) / n))), mirror);
    const reach = SHOCK[mv.name];
    if (reach) shock = 0.6 + reach * clamp01((e.bf - start + 1) / n);
  } else {
    applyKey(r, blend(struck, IDLE_KEY, ease(u)), mirror);
  }

  // the two-handed moves bring the off arm onto the grip
  if (mv.name === "slam" || mv.name === "eruption") {
    r.armL.rotation.x = r.armR.rotation.x;
    r.armL.rotation.z = -r.armR.rotation.z;
    r.foreL.rotation.x = r.foreR.rotation.x;
  }
  // the legs brace under a committed swing
  const set = kind === "h" || kind === "r" ? 1 : 0.25;
  r.legR.rotation.x = -0.3 * set;
  r.legL.rotation.x = 0.34 * set;
  return shock;
}

export function disposeFighters() {
  geos.forEach((x) => x.dispose());
  mats.forEach((x) => x.dispose());
  geos.length = 0;
  mats.length = 0;
}
