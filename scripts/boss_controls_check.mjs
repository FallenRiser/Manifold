// boss_controls_check.mjs -- do both arenas' controls move the knight the way the screen says, does the
// boss's floor wedge point where the boss faces, and does the room get out of the camera's way?
//
// Measured, not reasoned. The key and roll rules are the ones both labs import (controls.ts), the step is
// each world's real simulation, the camera is placed with the constants read out of each lab's source,
// and every displacement is dotted with the camera's own +x (screen right) and ground-projected forward
// (screen up). Both arenas once shipped with left and right mirrored; this is the check that catches it.
//
//     node scripts/boss_controls_check.mjs
//
// Node 22+ strips the types, so this imports the .ts files directly.
import { readFileSync } from "node:fs";
import * as THREE from "three";
import * as V1 from "../src/components/boss/duelSim.ts";
import * as V2 from "../src/components/boss/duelSimV2.ts";
import { moveEighth, rollQuarter } from "../src/components/boss/controls.ts";
import { pieces, blocking, hides, facingIn, alongRing, layout } from "../src/components/boss/sightline.ts";

const read = (f) => readFileSync(new URL(`../src/components/boss/${f}`, import.meta.url), "utf8");
let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL " + msg); };

// what the screen promises for each held combination: [screen right, screen up]
const COMBOS = { w: [1, 0], s: [-1, 0], d: [0, 1], a: [0, -1], "w+d": [1, 1], "w+a": [1, -1], "s+d": [-1, 1], "s+a": [-1, -1] };
const MOVE_WANT = { w: [0, 1], s: [0, -1], d: [1, 0], a: [-1, 0], "w+d": [1, 1], "w+a": [-1, 1], "s+d": [1, -1], "s+a": [-1, -1] };
// a roll has four directions: any sideways key wins, forward alone rolls in, back or nothing rolls back
const ROLL_WANT = { none: [0, -1], w: [0, 1], s: [0, -1], d: [1, 0], a: [-1, 0], "w+d": [1, 0], "w+a": [-1, 0], "s+d": [1, 0], "s+a": [-1, 0] };

function cameraFor(e, back, up) {
  // the lab's camera at rest (its lerp converges here): behind the knight, looking at the midpoint
  const bk = new THREE.Vector3(e.px - e.bx, 0, e.pz - e.bz).normalize();
  const cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 240);
  cam.position.set(e.px, 0, e.pz).add(bk.clone().multiplyScalar(back + 0.62 * e.d));
  cam.position.y = up + 0.32 * e.d;
  cam.lookAt((e.px + e.bx) / 2, 1.5, (e.pz + e.bz) / 2);
  cam.updateMatrixWorld();
  const m = cam.matrixWorld.elements;
  return { right: new THREE.Vector3(m[0], m[1], m[2]), fwd: new THREE.Vector3(-m[8], 0, -m[10]).normalize() };
}

// the screen direction of one step with action `act`, from 60 different starts
function screenOf(W, back, up, act) {
  const out = [];
  for (let seed = 0; seed < 60; seed++) {
    const e = new W.Duel({ oracle: W.rngOracle(1000 + seed) });
    for (let t = 0; t < seed % 7; t++) e.step(0); // a few idle frames so the angle varies
    const { right, fwd } = cameraFor(e, back, up);
    const x0 = e.px, z0 = e.pz;
    e.step(act);
    const dv = new THREE.Vector3(e.px - x0, 0, e.pz - z0);
    if (dv.lengthSq() < 1e-12) continue;
    dv.normalize();
    out.push([Math.sign(Math.round(dv.dot(right) * 1e6)), Math.sign(Math.round(dv.dot(fwd) * 1e6))]);
  }
  return out;
}
const agrees = (got, want) => got.filter(([r, u]) => r === want[0] && u === want[1]).length;

const WORLDS = [
  { name: "v1, the first fight", W: V1, lab: "DuelArenaLab.tsx" },
  { name: "v2, the harder fight", W: V2, lab: "DuelArenaLabV2.tsx" },
];

for (const { name, W, lab } of WORLDS) {
  const src = read(lab);
  console.log(`${name} (${lab}, ring ${W.ARENA})`);
  if (!/import \{ moveEighth, rollQuarter \} from "\.\/controls"/.test(src)) fail("does not take its keys from controls.ts");
  if (/const table: Record<string, number>/.test(src)) fail("keeps its own key table");
  const cm = src.match(/bk\.multiplyScalar\(([\d.]+) \+ 0\.62 \* e\.d\)\)/);
  const cy = src.match(/want\.y = ([\d.]+) \+ 0\.32 \* e\.d;/);
  if (!cm || !cy) { fail("camera placement not found"); continue; }
  const back = +cm[1], up = +cy[1];

  let moveOk = 0, moveN = 0;
  for (const [k, [f, s]] of Object.entries(COMBOS)) {
    const got = screenOf(W, back, up, W.A_MOVE0 + moveEighth(f, s));
    const ok = agrees(got, MOVE_WANT[k]);
    moveOk += ok; moveN += got.length;
    if (ok !== got.length) fail(`${k} moves the wrong way (${ok}/${got.length})`);
  }
  console.log(`  W A S D, 8 combinations x 60 starts: ${moveOk}/${moveN} move the way the screen says`);

  let rollOk = 0, rollN = 0;
  for (const [k, want] of Object.entries(ROLL_WANT)) {
    const [f, s] = k === "none" ? [0, 0] : COMBOS[k];
    const got = screenOf(W, back, up, W.A_ROLL0 + rollQuarter(f, s));
    const ok = agrees(got, want);
    rollOk += ok; rollN += got.length;
    if (ok !== got.length) fail(`Space with ${k} rolls the wrong way (${ok}/${got.length})`);
  }
  console.log(`  Space, with each of 9 holds x 60 starts: ${rollOk}/${rollN} roll the way the screen says`);
  const spaceRolls = /A_ROLL0 \+ rollQuarter\(/.test(src);
  if (!spaceRolls) fail("Space does not roll through rollQuarter");

  const BUTTON_WANT = { "roll right": [1, 0], "roll left": [-1, 0], "roll back": [0, -1] };
  const buttons = [...src.matchAll(/tap\(A_ROLL0 \+ (\d)\)\}>(roll [a-z]+)</g)].map((m) => [m[2], +m[1]]);
  if (buttons.length !== 3) fail(`expected 3 roll buttons, read ${buttons.length}`);
  for (const [label, q] of buttons) {
    const got = screenOf(W, back, up, W.A_ROLL0 + q);
    const ok = agrees(got, BUTTON_WANT[label]);
    console.log(`  button "${label}": ${ok}/${got.length}`);
    if (ok !== got.length) fail(`button ${label} rolls the wrong way`);
  }

  // the wedge: RingGeometry centred on +x, laid flat, turned by the lab's formula
  const rot = src.match(/arcMesh\.rotation\.y = ([^;]+);/);
  if (!rot) { fail("no arcMesh.rotation.y"); continue; }
  const turn = new Function("e", `return ${rot[1]};`);
  let worst = 0;
  for (let i = 0; i < 64; i++) {
    const bang = -Math.PI + (i * 2 * Math.PI) / 64;
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.4, 3, 8, 1, -0.1, 0.2).rotateX(-Math.PI / 2));
    mesh.rotation.y = turn({ bang });
    mesh.updateMatrixWorld();
    const c = new THREE.Vector3(1, 0, 0).applyMatrix4(new THREE.Matrix4().extractRotation(mesh.matrixWorld));
    worst = Math.max(worst, c.angleTo(new THREE.Vector3(Math.sin(bang), 0, Math.cos(bang))));
  }
  console.log(`  the boss's wedge (${rot[1].trim()}): worst ${(worst * 180 / Math.PI).toFixed(1)} deg from its facing`);
  if (worst > 1e-6) fail("the wedge does not point where the boss faces");
}

// ---- the room ------------------------------------------------------------------------------------
console.log("the room (arenaScene.ts places every piece from sightline.ts)");
const scene = read("arenaScene.ts");
for (const [what, re] of [["banners", /b\.rotation\.y = facingIn\(c\.a\)/], ["arches", /arch\.rotation\.y = alongRing\(c\.a\)/],
  ["columns", /col\.rotation\.y = alongRing\(p\.a\)/], ["the fade", /hides\(shapes\[i\]/]]) {
  if (!re.test(scene)) fail(`arenaScene.ts does not use sightline.ts for ${what}`);
}
// facingIn turns a banner's face (local +z) to the middle; alongRing lays local +x along the tangent
let bannerWorst = 0, ringWorst = 0;
for (const b of layout(8).banners) {
  const o = new THREE.Object3D();
  o.rotation.y = facingIn(b.a);
  o.updateMatrixWorld();
  const face = new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion);
  bannerWorst = Math.max(bannerWorst, face.angleTo(new THREE.Vector3(-b.x, 0, -b.z)));
  o.rotation.y = alongRing(b.a);
  o.updateMatrixWorld();
  const x = new THREE.Vector3(1, 0, 0).applyQuaternion(o.quaternion);
  ringWorst = Math.max(ringWorst, Math.abs(x.dot(new THREE.Vector3(b.x, 0, b.z).normalize())));
}
console.log(`  banners face the middle to within ${(bannerWorst * 180 / Math.PI).toFixed(1)} deg; arches and columns lie along the ring (worst |cos| ${ringWorst.toFixed(3)})`);
if (bannerWorst > 1e-6 || ringWorst > 1e-6) fail("room pieces are not turned the way they claim");

// the sightline test on cases with a known answer: a column straight between the lens and the knight,
// the same column one step to the side, and the knight in front of it
{
  const R = 8, list = pieces(R), col = list.find((p) => p.kind === "pillar");
  const out = { x: col.x0 * 1.3, y: 5, z: col.z0 * 1.3 }; // behind the column, seen from the middle
  const knight = { x: col.x0 * 0.5, z: col.z0 * 0.5 };
  const far = { x: -col.x0 * 0.5, z: -col.z0 * 0.5 };
  const side = { x: out.x + 3 * col.z0 / Math.hypot(col.x0, col.z0), y: 5, z: out.z - 3 * col.x0 / Math.hypot(col.x0, col.z0) };
  const cases = [
    ["a column between the lens and the knight hides it", hides(col, out, knight.x, knight.z, far.x, far.z), true],
    ["the lens moved aside, it does not", hides(col, side, knight.x, knight.z, -side.x, -side.z), false],
    ["a column behind the knight does not", hides(col, { x: 0, y: 5, z: 0 }, knight.x, knight.z, -knight.x, -knight.z), false],
  ];
  for (const [what, got, want] of cases) {
    console.log(`  ${what}: ${got === want ? "yes" : "NO"}`);
    if (got !== want) fail(what);
  }
}

// how often something of the room stood in the way, over scripted duels with each lab's camera (its
// lerp included): every one of those frames now has that piece faded
for (const { name, W, lab } of WORLDS) {
  const src = read(lab);
  const back = +src.match(/bk\.multiplyScalar\(([\d.]+) \+ 0\.62/)[1], up = +src.match(/want\.y = ([\d.]+) \+ 0\.32/)[1];
  const list = pieces(W.ARENA);
  let frames = 0, blocked = 0, pill = 0, outside = 0;
  for (const pl of Object.keys(W.SCRIPTED)) {
    for (let seed = 0; seed < 12; seed++) {
      const e = new W.Duel({ oracle: W.rngOracle(5000 + seed) });
      let cam = null, act = 0;
      const k = 1 - Math.pow(0.0018, 1 / 30);
      while (e.php > 0 && e.bhp > 0 && e.t < e.clock) {
        if (e.t % 3 === 0) act = W.SCRIPTED[pl](e);
        e.step(act);
        const n = Math.hypot(e.px - e.bx, e.pz - e.bz) || 1;
        const L = back + 0.62 * e.d;
        const want = { x: e.px + ((e.px - e.bx) / n) * L, y: up + 0.32 * e.d, z: e.pz + ((e.pz - e.bz) / n) * L };
        cam = cam ? { x: cam.x + (want.x - cam.x) * k, y: cam.y + (want.y - cam.y) * k, z: cam.z + (want.z - cam.z) * k } : want;
        const b = blocking(list, cam, e.px, e.pz, e.bx, e.bz);
        frames++;
        if (b.some(Boolean)) blocked++;
        if (b.some((x, i) => x && list[i].kind === "pillar")) pill++;
        if (Math.hypot(cam.x, cam.z) > W.ARENA + 2.1) outside++;
      }
    }
  }
  console.log(`  ${name}: the camera is out past the columns on ${(100 * outside / frames).toFixed(0)}% of frames; something stood in the way on ${(100 * blocked / frames).toFixed(1)}% (a column on ${(100 * pill / frames).toFixed(1)}%), all of it now faded`);
}

console.log(failures ? `\nFAIL: ${failures} problem(s)` : "\nclean: every key, roll and button moves the way the screen says in both fights, the wedge points where the boss faces, and the room gets out of the way");
process.exit(failures ? 1 : 0);
