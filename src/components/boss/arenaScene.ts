// The room the duel happens in. Set dressing only — nothing here is read by the simulation, and
// nothing here reads the simulation. The one exception is the floor radius, which is ARENA, because
// the wall is a real mechanic: it is what stops a player from simply running away forever.
//
// Everything is placed in units of ARENA rather than in metres, so when the arena grows the room
// grows with it and nothing has to be re-tuned by hand.
//
// Textures are painted into a <canvas> once at build time, so the arena costs one draw call per
// object and no network requests. The budget that actually binds is LIGHTS: every real light costs
// a shader branch on every fragment of every fighter, so there are four of them and everything else
// that glows is emissive or additive, which costs nothing.

import * as THREE from "three";
import { ARENA } from "./duelSim";
import { ARCH, BANNER, PILLAR, alongRing, facingIn, hides, layout, pieces, type Kind } from "./sightline";

export type ArenaSet = {
  group: THREE.Group;
  /** brazier flicker, embers, drifting dust, banner sway; t is seconds */
  tick: (t: number, dt: number) => void;
  /** fade every piece of the room that stands between the camera and the knight at (px, pz) or the
   *  boss at (bx, bz); call it after the camera has moved, every frame */
  clearView: (cam: THREE.Vector3, px: number, pz: number, bx: number, bz: number, dt: number) => void;
  dispose: () => void;
};

type Fadeable = { mats: { m: THREE.Material; base: number }[]; alpha: number };

const junk: { dispose: () => void }[] = [];
const keep = <T extends { dispose: () => void }>(x: T) => {
  junk.push(x);
  return x;
};

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { c, g: c.getContext("2d")! };
}

/** Flagstones, a ring of inlay, cracks, and the sigil the boss stands on. */
function floorTexture() {
  const S = 1024;
  const { c, g } = canvas(S);
  const mid = S / 2;

  const base = g.createRadialGradient(mid, mid, S * 0.04, mid, mid, mid);
  base.addColorStop(0, "#3b4250");
  base.addColorStop(0.5, "#2c323d");
  base.addColorStop(0.86, "#232833");
  base.addColorStop(1, "#171a21");
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);

  // mortar between the flagstones: eight rings cut by twenty-four spokes
  g.strokeStyle = "rgba(9,11,15,0.55)";
  g.lineWidth = 3;
  for (let r = 1; r <= 8; r++) {
    g.beginPath();
    g.arc(mid, mid, (r / 8) * mid * 0.99, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.moveTo(mid + Math.cos(a) * mid * 0.13, mid + Math.sin(a) * mid * 0.13);
    g.lineTo(mid + Math.cos(a) * mid * 0.99, mid + Math.sin(a) * mid * 0.99);
    g.stroke();
  }

  // cracks: a few forked lines that ignore the flagstone grid, so the floor reads as broken
  // stone rather than as tiling. Each one wanders and forks once.
  g.strokeStyle = "rgba(6,8,12,0.62)";
  const crack = (x: number, y: number, ang: number, len: number, w: number) => {
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    let cx = x;
    let cy = y;
    let ca = ang;
    for (let s = 0; s < len; s++) {
      ca += (Math.random() - 0.5) * 0.5;
      cx += Math.cos(ca) * 9;
      cy += Math.sin(ca) * 9;
      g.lineTo(cx, cy);
    }
    g.stroke();
    return [cx, cy, ca] as const;
  };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random();
    const r = mid * (0.2 + Math.random() * 0.62);
    const [fx, fy, fa] = crack(mid + Math.cos(a) * r, mid + Math.sin(a) * r, Math.random() * 7, 14, 3.2);
    crack(fx, fy, fa + 0.9, 7, 1.8);
  }

  // wear: pale scuffing worn into the middle, where every duel is fought
  g.globalAlpha = 0.5;
  const worn = g.createRadialGradient(mid, mid, 0, mid, mid, mid * 0.42);
  worn.addColorStop(0, "rgba(150,160,180,0.16)");
  worn.addColorStop(1, "rgba(150,160,180,0)");
  g.fillStyle = worn;
  g.fillRect(0, 0, S, S);
  g.globalAlpha = 1;

  // old stains, dried almost black. Everyone who came before.
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * mid * 0.72;
    const x = mid + Math.cos(a) * r;
    const y = mid + Math.sin(a) * r;
    const rad = 14 + Math.random() * 46;
    const st = g.createRadialGradient(x, y, 0, x, y, rad);
    st.addColorStop(0, "rgba(46,14,14,0.40)");
    st.addColorStop(1, "rgba(46,14,14,0)");
    g.fillStyle = st;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }

  // the sigil
  g.strokeStyle = "rgba(200,140,70,0.32)";
  g.lineWidth = 4;
  for (const rr of [0.1, 0.13, 0.205]) {
    g.beginPath();
    g.arc(mid, mid, mid * rr, 0, Math.PI * 2);
    g.stroke();
  }
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * Math.PI * 4 - Math.PI / 2; // a five-pointed star, drawn as one stroke
    const x = mid + Math.cos(a) * mid * 0.125;
    const y = mid + Math.sin(a) * mid * 0.125;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();

  // runes around the inlay ring, unreadable on purpose — they only have to read as writing
  g.fillStyle = "rgba(200,140,70,0.26)";
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const x = mid + Math.cos(a) * mid * 0.168;
    const y = mid + Math.sin(a) * mid * 0.168;
    g.save();
    g.translate(x, y);
    g.rotate(a + Math.PI / 2);
    g.fillRect(-2, -6, 4, 4 + Math.random() * 8);
    g.restore();
  }

  // grit
  for (let i = 0; i < 2600; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * mid;
    const x = mid + Math.cos(a) * r;
    const y = mid + Math.sin(a) * r;
    g.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.13)";
    g.fillRect(x, y, 2, 2);
  }

  const t = keep(new THREE.CanvasTexture(c));
  t.anisotropy = 8;
  return t;
}

/** Wet, sooty masonry for the wall the arena sits inside. */
function wallTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  g.fillStyle = "#1a1d25";
  g.fillRect(0, 0, W, H);

  // courses of block, offset every other row
  const bw = 64;
  const bh = 26;
  for (let row = 0; row * bh < H; row++) {
    const off = (row % 2) * (bw / 2);
    for (let col = -1; col * bw < W + bw; col++) {
      const x = col * bw + off;
      const y = row * bh;
      const v = 18 + Math.random() * 20;
      g.fillStyle = `rgb(${v + 6},${v + 8},${v + 14})`;
      g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      // a lit top lip on each block, which is what makes masonry read as masonry
      g.fillStyle = "rgba(255,255,255,0.045)";
      g.fillRect(x + 1.5, y + 1.5, bw - 3, 2);
    }
  }

  // soot climbing the wall, and darkness at the top where the roof would be
  const sm = g.createLinearGradient(0, 0, 0, H);
  sm.addColorStop(0, "rgba(0,0,0,0.85)");
  sm.addColorStop(0.45, "rgba(0,0,0,0.25)");
  sm.addColorStop(1, "rgba(0,0,0,0.72)");
  g.fillStyle = sm;
  g.fillRect(0, 0, W, H);

  const t = keep(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 1.6);
  return t;
}

/** A dim, warm-above/cold-below environment, so metal has something to reflect. */
export function envMap(renderer: THREE.WebGLRenderer) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 32;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, 32);
  grd.addColorStop(0, "#141821");
  grd.addColorStop(0.42, "#3a3226");
  grd.addColorStop(0.56, "#6b4a28");
  grd.addColorStop(0.72, "#20242e");
  grd.addColorStop(1, "#0b0d12");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 32);
  // two bright smudges where the braziers are, so the armour catches something as it turns
  for (const x of [14, 46]) {
    const s = g.createRadialGradient(x, 19, 0, x, 19, 11);
    s.addColorStop(0, "rgba(255,150,70,0.85)");
    s.addColorStop(1, "rgba(255,150,70,0)");
    g.fillStyle = s;
    g.fillRect(x - 12, 7, 24, 24);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  pmrem.dispose();
  tex.dispose();
  return rt;
}

/** A soft round blob, used for the painted shadows and for the ember sprites. */
export function blobTexture() {
  const S = 128;
  const { c, g } = canvas(S);
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

/** A tattered hanging banner: a plane whose lower corners are chewed away. */
function bannerGeometry(w: number, h: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, -h * 0.74);
  shape.lineTo(w * 0.22, -h * 0.9);
  shape.lineTo(w * 0.06, -h * 0.68);
  shape.lineTo(-w * 0.12, -h);
  shape.lineTo(-w * 0.3, -h * 0.72);
  shape.lineTo(-w / 2, -h * 0.86);
  shape.lineTo(-w / 2, 0);
  return keep(new THREE.ShapeGeometry(shape));
}

export function buildArena(radius: number = ARENA): ArenaSet {
  junk.length = 0;
  const group = new THREE.Group();
  const R = radius; // everything below is in units of the arena radius, so v2's 11m ring
                    // gets a proportionally bigger room for free

  const floor = new THREE.Mesh(
    keep(new THREE.CircleGeometry(R + 0.35, 96)),
    keep(new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.94, metalness: 0.04 }))
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // the edge itself — the thing that makes running away finite
  const lip = new THREE.Mesh(
    keep(new THREE.TorusGeometry(R, 0.13, 6, 96)),
    keep(new THREE.MeshStandardMaterial({ color: 0x5a4a33, roughness: 0.8, metalness: 0.25 }))
  );
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = 0.06;
  group.add(lip);

  // A shallow step down outside the lip, then the wall. The step is what gives the arena a floor
  // level of its own rather than looking painted onto an infinite plane.
  const apron = new THREE.Mesh(
    keep(new THREE.RingGeometry(R + 0.35, R + 2.6, 96)),
    keep(new THREE.MeshStandardMaterial({ color: 0x14171e, roughness: 1 }))
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.34;
  group.add(apron);

  const wallMat = keep(
    new THREE.MeshStandardMaterial({ map: wallTexture(), side: THREE.BackSide, roughness: 1 })
  );
  const wall = new THREE.Mesh(keep(new THREE.CylinderGeometry(R + 2.7, R + 2.7, 15, 72, 1, true)), wallMat);
  wall.position.y = 6.6;
  group.add(wall);

  // ---------------------------------------------------------------- the pieces that can fade
  // The chase camera swings out past the colonnade whenever the knight is near the edge, and then
  // any of these can stand between it and a fighter. Each one gets its own materials so it can fade
  // on its own; clearView() below decides which. Every position and size comes from sightline.ts,
  // so the shapes the fade tests are the shapes drawn here.
  const L = layout(R);
  const fadeByKind: Record<Kind, Fadeable[]> = { pillar: [], brazier: [], statue: [], throne: [], banner: [], arch: [] };
  // a fading piece is drawn in the transparent pass from the start, at opacity 1, so fading it never
  // swaps its shader
  const own = <M extends THREE.Material>(m: M) => {
    const c = keep(m.clone() as M);
    c.transparent = true;
    return c;
  };
  const fadeable = (kind: Kind, mats: THREE.Material[]) =>
    fadeByKind[kind].push({ mats: mats.map((m) => ({ m, base: m.opacity })), alpha: 1 });

  // ---------------------------------------------------------------- the colonnade
  // Two tiers. The near ring of buttresses stands inside the wall and is what the fighters are
  // read against; the arcade behind it is only ever seen in silhouette, which is the cheapest
  // depth there is.
  const stoneMat = keep(new THREE.MeshStandardMaterial({ color: 0x232733, roughness: 0.95 }));
  const darkStone = keep(new THREE.MeshStandardMaterial({ color: 0x171a23, roughness: 1 }));

  const pillarGeo = keep(new THREE.CylinderGeometry(PILLAR.rTop, PILLAR.rBottom, PILLAR.height, 7));
  const capGeo = keep(new THREE.BoxGeometry(PILLAR.cap, PILLAR.capH, PILLAR.cap));
  for (const p of L.pillars) {
    const shaftMat = own(stoneMat);
    const capMat = own(darkStone);
    const col = new THREE.Group();
    col.position.set(p.x, 0, p.z);
    col.rotation.y = alongRing(p.a);
    const shaft = new THREE.Mesh(pillarGeo, shaftMat);
    shaft.position.y = PILLAR.centre * p.h;
    shaft.scale.y = p.h;
    // a base and a capital, which is most of what makes a cylinder look like a column
    const base = new THREE.Mesh(capGeo, capMat);
    base.position.y = 0.2;
    const capital = new THREE.Mesh(capGeo, capMat);
    capital.position.y = PILLAR.centre * p.h * 2 - 0.2;
    col.add(shaft, base, capital);
    group.add(col);
    fadeable("pillar", [shaftMat, capMat]);
  }

  // the arcade: a far ring of arches, deliberately unlit
  const archGeo = keep(new THREE.TorusGeometry(ARCH.r, ARCH.tube, 5, 10, Math.PI));
  for (const c of L.arches) {
    const m = own(darkStone);
    const arch = new THREE.Mesh(archGeo, m);
    arch.position.set(c.x, ARCH.y, c.z);
    arch.rotation.y = alongRing(c.a);
    group.add(arch);
    fadeable("arch", [m]);
  }

  // ---------------------------------------------------------------- the throne wall
  // One big asymmetric feature behind the boss's starting side. A room that is the same in every
  // direction has no orientation, and an arena you cannot orient yourself in is a worse arena.
  const throneMat = own(stoneMat);
  const throne = new THREE.Group();
  throne.position.set(L.throne.x, 0, L.throne.z);
  const dais = new THREE.Mesh(keep(new THREE.CylinderGeometry(3.4, 4.0, 0.7, 12, 1, false, 0, Math.PI)), throneMat);
  dais.rotation.y = Math.PI / 2;
  dais.position.y = -0.1;
  throne.add(dais);
  const greatArch = new THREE.Mesh(keep(new THREE.TorusGeometry(2.7, 0.6, 6, 16, Math.PI)), throneMat);
  greatArch.position.y = 4.4;
  throne.add(greatArch);
  for (const s of [-1, 1]) {
    const jamb = new THREE.Mesh(keep(new THREE.BoxGeometry(1.2, 4.6, 1.2)), throneMat);
    jamb.position.set(s * 2.7, 2.2, 0);
    throne.add(jamb);
  }
  // the dark behind the arch: a black disc, so the arch reads as an opening and not a decoration
  const gateMat = own(new THREE.MeshBasicMaterial({ color: 0x05060a }));
  const gate = new THREE.Mesh(keep(new THREE.CircleGeometry(2.6, 24)), gateMat);
  gate.position.set(0, 4.4, -0.3);
  throne.add(gate);
  group.add(throne);
  fadeable("throne", [throneMat, gateMat]);

  // two colossal figures flanking it, hooded, faceless, holding swords point-down
  const statueMat = keep(new THREE.MeshStandardMaterial({ color: 0x1d212b, roughness: 0.98 }));
  const robeGeo = keep(new THREE.CylinderGeometry(0.62, 1.5, 4.6, 8));
  const hoodGeo = keep(new THREE.SphereGeometry(0.62, 8, 6));
  const bladeGeo = keep(new THREE.BoxGeometry(0.22, 3.6, 0.06));
  for (const s of L.statues) {
    const m = own(statueMat);
    const st = new THREE.Group();
    st.position.set(s.x, 0, s.z);
    const robe = new THREE.Mesh(robeGeo, m);
    robe.position.y = 2.3;
    const hood = new THREE.Mesh(hoodGeo, m);
    hood.position.y = 4.8;
    hood.scale.set(1, 1.3, 1.05);
    const blade = new THREE.Mesh(bladeGeo, m);
    blade.position.set(0, 2.2, 0.66);
    st.add(robe, hood, blade);
    st.rotation.y = -s.s * 0.32;
    group.add(st);
    fadeable("statue", [m]);
  }

  // ---------------------------------------------------------------- banners
  const bannerMat = keep(
    new THREE.MeshStandardMaterial({ color: 0x5a1f24, roughness: 0.98, side: THREE.DoubleSide })
  );
  const bGeo = bannerGeometry(BANNER.w, BANNER.h);
  const banners: THREE.Mesh[] = [];
  for (const c of L.banners) {
    const m = own(bannerMat);
    const b = new THREE.Mesh(bGeo, m);
    b.position.set(c.x, BANNER.top, c.z);
    b.rotation.y = facingIn(c.a);
    banners.push(b);
    group.add(b);
    fadeable("banner", [m]);
  }

  // ---------------------------------------------------------------- fire
  // Six bowls, but only two real point lights: at this distance an emissive sphere and a lit one
  // are indistinguishable, and lights are the expensive thing.
  const bowlGeo = keep(new THREE.CylinderGeometry(0.34, 0.18, 0.34, 10));
  const stemGeo = keep(new THREE.CylinderGeometry(0.08, 0.14, 2.9, 8));
  const ironMat = keep(new THREE.MeshStandardMaterial({ color: 0x1c1f27, roughness: 0.7, metalness: 0.5 }));
  const flameMat = keep(new THREE.MeshBasicMaterial({ color: 0xffa23c, transparent: true, opacity: 0.92 }));
  const coreMat = keep(new THREE.MeshBasicMaterial({ color: 0xfff0c4, transparent: true, opacity: 0.95 }));
  const flameGeo = keep(new THREE.SphereGeometry(0.22, 10, 8));
  const flames: THREE.Mesh[] = [];
  const fires: THREE.PointLight[] = [];
  const firePos: THREE.Vector3[] = [];
  L.braziers.forEach(({ x, z }, i) => {
    firePos.push(new THREE.Vector3(x, 3.1, z));
    const iron = own(ironMat);
    const fm = own(flameMat);
    const cm = own(coreMat);
    const stem = new THREE.Mesh(stemGeo, iron);
    stem.position.set(x, 1.45, z);
    const bowl = new THREE.Mesh(bowlGeo, iron);
    bowl.position.set(x, 3.0, z);
    const fl = new THREE.Mesh(flameGeo, fm);
    fl.position.set(x, 3.2, z);
    fl.scale.set(1, 1.4, 1);
    const core = new THREE.Mesh(flameGeo, cm);
    core.position.set(x, 3.14, z);
    core.scale.setScalar(0.5);
    flames.push(fl);
    group.add(stem, bowl, fl, core);
    fadeable("brazier", [iron, fm, cm]);
    if (i === 0 || i === 3) {
      const pl = new THREE.PointLight(0xff8a3d, 40, 30, 2);
      pl.position.set(x, 3.5, z);
      fires.push(pl);
      group.add(pl);
    }
  });

  // the fadeables in the order pieces() lists them, so the i-th test drives the i-th piece
  const shapes = pieces(R);
  const fades = (["pillar", "brazier", "statue", "throne", "banner", "arch"] as Kind[]).flatMap((k) => fadeByKind[k]);
  if (fades.length !== shapes.length || shapes.some((s, i) => fadeByKind[s.kind].indexOf(fades[i]) < 0)) {
    throw new Error("arenaScene: the fading pieces do not line up with sightline.pieces()");
  }

  // ---------------------------------------------------------------- embers
  // Embers rise from the bowls and die out. They are the single cheapest thing that makes a room
  // feel like it is burning rather than lit.
  const N_EMBER = 220;
  const ePos = new Float32Array(N_EMBER * 3);
  const eVel = new Float32Array(N_EMBER * 3);
  const eLife = new Float32Array(N_EMBER);
  const seatEmber = (i: number) => {
    const src = firePos[(Math.random() * firePos.length) | 0];
    ePos[i * 3] = src.x + (Math.random() - 0.5) * 0.4;
    ePos[i * 3 + 1] = src.y + Math.random() * 0.3;
    ePos[i * 3 + 2] = src.z + (Math.random() - 0.5) * 0.4;
    eVel[i * 3] = (Math.random() - 0.5) * 0.5;
    eVel[i * 3 + 1] = 0.7 + Math.random() * 1.5;
    eVel[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    eLife[i] = 1.4 + Math.random() * 2.6;
  };
  for (let i = 0; i < N_EMBER; i++) {
    seatEmber(i);
    eLife[i] = Math.random() * 3; // stagger the first cycle so they do not all pop at t=0
  }
  const emberGeo = keep(new THREE.BufferGeometry());
  emberGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  const embers = new THREE.Points(
    emberGeo,
    keep(
      new THREE.PointsMaterial({
        color: 0xff9c42,
        size: 0.08,
        map: keep(blobTexture()),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );
  group.add(embers);

  // dust, drifting up through the firelight
  const N_DUST = 300;
  const pos = new Float32Array(N_DUST * 3);
  const rise = new Float32Array(N_DUST);
  for (let i = 0; i < N_DUST; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = Math.cos(a) * r;
    rise[i] = 0.12 + Math.random() * 0.34;
  }
  const dustGeo = keep(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeo,
    keep(
      new THREE.PointsMaterial({
        color: 0xffc98a,
        size: 0.045,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );
  group.add(dust);

  // ---------------------------------------------------------------- light
  group.add(new THREE.HemisphereLight(0x8fa0c4, 0x1a1e26, 0.95));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.0);
  key.position.set(5, 14, 6);
  group.add(key);
  // A cold RIM from behind and above. This is the one light doing the most work: it puts a bright
  // edge on both fighters so a dark silhouette never dissolves into a dark room.
  const rim = new THREE.DirectionalLight(0x9dc0ff, 1.5);
  rim.position.set(-6, 9, -11);
  group.add(rim);
  // a low warm bounce off the flagstones, so the fighters are not cut-outs from below
  const bounce = new THREE.DirectionalLight(0xffb070, 0.42);
  bounce.position.set(0, -1, 3);
  group.add(bounce);

  const tick = (t: number, dt: number) => {
    for (let i = 0; i < flames.length; i++) {
      const f = 1 + 0.16 * Math.sin(t * 9 + i * 2.1) + 0.1 * Math.sin(t * 23.3 + i);
      flames[i].scale.set(f, 1.45 * f, f);
    }
    for (let i = 0; i < fires.length; i++) {
      fires[i].intensity = 40 * (1 + 0.2 * Math.sin(t * 11 + i * 3.7) + 0.1 * Math.sin(t * 27 + i));
    }

    const ep = emberGeo.getAttribute("position") as THREE.BufferAttribute;
    const ea = ep.array as Float32Array;
    for (let i = 0; i < N_EMBER; i++) {
      eLife[i] -= dt;
      if (eLife[i] <= 0) {
        seatEmber(i);
      } else {
        ea[i * 3] += eVel[i * 3] * dt;
        ea[i * 3 + 1] += eVel[i * 3 + 1] * dt;
        ea[i * 3 + 2] += eVel[i * 3 + 2] * dt;
        eVel[i * 3 + 1] -= 0.25 * dt; // they cool and slow as they climb
      }
    }
    ep.needsUpdate = true;

    const p = dustGeo.getAttribute("position") as THREE.BufferAttribute;
    const arr = p.array as Float32Array;
    for (let i = 0; i < N_DUST; i++) {
      arr[i * 3 + 1] += rise[i] * dt;
      if (arr[i * 3 + 1] > 7.5) arr[i * 3 + 1] = 0;
    }
    p.needsUpdate = true;

    for (let i = 0; i < banners.length; i++) {
      banners[i].rotation.z = 0.05 * Math.sin(t * 0.9 + i * 1.7) + 0.02 * Math.sin(t * 2.3 + i);
    }
  };

  // ---------------------------------------------------------------- clearing the view
  const GHOST = 0.14; // what is left of a piece in the way: enough to keep the room readable
  const clearView = (cam: THREE.Vector3, px: number, pz: number, bx: number, bz: number, dt: number) => {
    for (let i = 0; i < shapes.length; i++) {
      const f = fades[i];
      // once faded, a piece stays faded until it is clearly out of the way, so it does not flicker
      // while the camera grazes its edge
      const inWay = hides(shapes[i], cam, px, pz, bx, bz, f.alpha < 0.99 ? 0.3 : 0);
      const target = inWay ? GHOST : 1;
      if (f.alpha === target) continue;
      const rate = inWay ? 14 : 5; // get out of the way fast, come back gently
      f.alpha += (target - f.alpha) * (1 - Math.exp(-rate * dt));
      if (Math.abs(f.alpha - target) < 0.004) f.alpha = target;
      for (const { m, base } of f.mats) {
        m.opacity = base * f.alpha;
        m.depthWrite = f.alpha === 1;
      }
    }
  };

  const owned = junk.slice();
  const dispose = () => owned.forEach((o) => o.dispose());
  return { group, tick, clearView, dispose };
}
