"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  A_ATK, A_GUARD, A_IDLE, A_MOVE0, A_PARRY, A_ROLL0, ATK_COST, ATK_REACH, ATK_SEG, B_HP_MAX,
  B_POISE_MAX, FPS,
  MOVES, P_HP_MAX, P_ST_MAX, PARRY_COST, ROLL_COST, RIPOSTE_MULT, STAGGER, SCRIPTED, Duel,
  framesToActive, moveLen, phaseAt, rngOracle,
} from "./duelSim";
import { ACTION_NAMES, N_OBS } from "./duelSim";
import { argmax, decodeNet, margin, qValues, type Net } from "./trainedPolicy";
import { asset } from "@/lib/asset";
import { blobTexture, buildArena, envMap } from "./arenaScene";
import { SKIN, buildBoss, buildKnight, disposeFighters, poseBoss, poseKnight } from "./fighters";

// The duel you can actually stand in. The simulation is duelSim.ts, which scripts/boss_port_check.mjs
// checks frame for frame against the shipped Python world; this file only draws it and reads buttons.
//
// Every meter below is a field of that simulation, read straight off it:
//   health   e.php / P_HP_MAX          stamina  e.pst / P_ST_MAX
//   boss     e.bhp / B_HP_MAX          stagger  e.bStagger / STAGGER
//   poise    e.bPoise / B_POISE_MAX
// There is no charge-up special in this world. What the gold meter shows is the riposte window:
// while e.bStagger is counting down, your attack multiplies by RIPOSTE_MULT, and when it hits zero
// it does not. That is the whole of it, so that is all the meter claims.

const ATK_LEN = moveLen({ seg: ATK_SEG });
const DECIDE_EVERY = 3; // the shipped decision rate: one press every three frames
// Half-width of a Q bar, in raw Q units either side of the average. Taken off the measured
// distribution (scripts/boss_qspread.mjs, 32,537 decisions): it clips 3% of bars, against the 31%
// that the old per-frame scaling pinned flat against the right-hand edge.
const Q_SPAN = 4;

const PLAY = "you have the controls";
const WATCHERS = ["patient parry", "sidestep, punish", "block, punish", "mash attack", "hold guard"];

// The net from `python scripts/boss_train.py dqn --decisions 2000000 --seed 0`, 308 KB of raw
// float32, fetched only if somebody actually asks to watch it. scripts/boss_policy_check.mjs
// proves this file plays the same duel torch scored 200/200 on.
const NET = "the trained net";
const NET_URL = "/boss/dqn_2000k_s0.bin";

type Held = { w: boolean; a: boolean; s: boolean; d: boolean };

/**
 * WASD, in the boss-relative frame the world uses: eighth 0 is straight at the boss, 4 straight
 * away, and the eighths climb the opposite way round from the screen.
 *
 * The player is locked on, so its rotation.y is the player-to-boss angle, and the camera sits
 * BEHIND it looking along the knight's local +z. Looking ALONG +z is the reverse of three.js's
 * default view, which flips the horizontal: local +x lands on the LEFT of the picture. Eighth 2
 * steps along local +x, so binding d to it walked the knight the wrong way. "Go right" is the
 * eighth that steps along local -x, which is 6.
 */
function heldToEighth(h: Held): number | null {
  const f = (h.w ? 1 : 0) - (h.s ? 1 : 0);
  const r = (h.d ? 1 : 0) - (h.a ? 1 : 0);
  if (f === 0 && r === 0) return null;
  if (f > 0 && r === 0) return 0;
  if (f > 0 && r > 0) return 7;
  if (f === 0 && r > 0) return 6;
  if (f < 0 && r > 0) return 5;
  if (f < 0 && r === 0) return 4;
  if (f < 0 && r < 0) return 3;
  if (f === 0 && r < 0) return 2;
  return 1;
}

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

export function DuelArenaLab({ showNet = false }: { showNet?: boolean } = {}) {
  const mount = useRef<HTMLDivElement>(null);
  const [netState, setNetState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [mode, setMode] = useState<string>(PLAY);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [tally, setTally] = useState({ duels: 0, wins: 0, deaths: 0, clock: 0 });
  const [counts, setCounts] = useState({ parries: 0, blocks: 0, dodges: 0, arcMisses: 0, guardBreaks: 0, hitsDealt: 0, poiseBreaks: 0 });

  // HUD nodes, written straight from the render loop so a 30 Hz duel never re-renders React
  const hp = useRef<HTMLDivElement>(null);
  const hpGhost = useRef<HTMLDivElement>(null);
  const hpNum = useRef<HTMLSpanElement>(null);
  const st = useRef<HTMLDivElement>(null);
  const stWrap = useRef<HTMLDivElement>(null);
  const rip = useRef<HTMLDivElement>(null);
  const ripWrap = useRef<HTMLDivElement>(null);
  const bhp = useRef<HTMLDivElement>(null);
  const bhpGhost = useRef<HTMLDivElement>(null);
  const bossPhase = useRef<HTMLDivElement>(null);
  const poise = useRef<HTMLDivElement>(null);
  const stag = useRef<HTMLDivElement>(null);
  const stagWrap = useRef<HTMLDivElement>(null);
  const clockTxt = useRef<HTMLDivElement>(null);
  const geoTxt = useRef<HTMLDivElement>(null);
  const tellTxt = useRef<HTMLDivElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const endTxt = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const qGrid = useRef<HTMLDivElement>(null);
  const qNote = useRef<HTMLSpanElement>(null);

  // everything the render loop needs, kept out of React state so it never re-renders per frame
  const box = useRef({
    duel: null as Duel | null,
    held: { w: false, a: false, s: false, d: false } as Held,
    guard: false,
    queued: null as number | null, // a one-shot press waiting for the next decision frame
    mode: PLAY,
    speed: 1,
    running: false,
    over: false,
    net: null as Net | null,
    q: null as Float32Array | null,
  });
  box.current.mode = mode;
  box.current.speed = speed;
  box.current.running = running;

  // Fetched lazily: a reader who never presses "watch the trained net" never downloads it.
  useEffect(() => {
    if (!showNet || mode !== NET || box.current.net || netState !== "idle") return;
    setNetState("loading");
    fetch(asset(NET_URL))
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((b) => { box.current.net = decodeNet(b); setNetState("ready"); })
      .catch(() => setNetState("error"));
  }, [showNet, mode, netState]);

  // ---------------------------------------------------------------- three.js
  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1015);
    scene.fog = new THREE.Fog(0x0e1015, 22, 64);

    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 220);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    // No shadow map: the two fighters get painted blob shadows instead, which suits the stylised
    // arena and keeps the light count and the fill cost down.
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    const env = envMap(renderer);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.55;

    const arena = buildArena();
    scene.add(arena.group);

    const knight = buildKnight();
    const ogre = buildBoss();
    scene.add(knight.root, ogre.root);

    // painted shadows
    const blobTex = blobTexture();
    const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
    const blobGeo = new THREE.PlaneGeometry(1, 1);
    const blob = (r: number) => {
      const b = new THREE.Mesh(blobGeo, blobMat);
      b.rotation.x = -Math.PI / 2;
      b.scale.setScalar(r);
      b.position.y = 0.025;
      scene.add(b);
      return b;
    };
    const pBlob = blob(1.5);
    const bBlob = blob(2.9);

    // --- the threat: reach AND arc, drawn on the floor. This is the exact rule, not a flourish.
    const arcMat = new THREE.MeshBasicMaterial({ color: 0xe8b84b, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
    const arcGeos = MOVES.map((m) => {
      const g = new THREE.RingGeometry(0.4, m.reach, 56, 1, -m.arc, 2 * m.arc);
      g.rotateX(-Math.PI / 2);
      return g;
    });
    const arcMesh = new THREE.Mesh(arcGeos[0], arcMat);
    arcMesh.position.y = 0.035;
    arcMesh.visible = false;
    scene.add(arcMesh);

    // the player's own reach: a full circle, because the player's hit test has no arc
    const reachMat = new THREE.MeshBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const reachGeo = new THREE.RingGeometry(ATK_REACH - 0.1, ATK_REACH, 64);
    reachGeo.rotateX(-Math.PI / 2);
    const reachMesh = new THREE.Mesh(reachGeo, reachMat);
    reachMesh.position.y = 0.04;
    scene.add(reachMesh);

    // the i-frame / parry flash under the player
    const flashMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const flashGeo = new THREE.RingGeometry(0.5, 1.0, 44);
    flashGeo.rotateX(-Math.PI / 2);
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.y = 0.045;
    scene.add(flash);

    // the slam's shockwave
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xff7a3d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const shockGeo = new THREE.RingGeometry(0.86, 1, 48);
    shockGeo.rotateX(-Math.PI / 2);
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.position.y = 0.05;
    scene.add(shock);

    // Only react to WIDTH. This callback sets the element's height, and an observer that
    // re-fired on its own height change would spin the main thread flat out.
    let lastW = -1;
    const resize = () => {
      const w = el.clientWidth || 640;
      if (w === lastW) return;
      lastW = w;
      const h = Math.max(260, Math.round(w * 0.58));
      el.style.height = `${h}px`;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ---------------------------------------------------------------- loop
    const B = box.current;
    if (!B.duel) B.duel = new Duel({ oracle: rngOracle(Math.floor(Math.random() * 1e9)) });

    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let action = A_IDLE;
    let ghostP = P_HP_MAX;
    let ghostB = B_HP_MAX;
    let shake = 0;
    let toastAt = -9;
    let poiseFlash = -9;
    const stripCells: HTMLDivElement[] = [];
    if (strip.current) {
      // Rebuilt, not appended to: this effect can run more than once (fast refresh, StrictMode),
      // and the second run has to own the nodes it is going to write to.
      strip.current.replaceChildren();
      for (let i = 0; i < 90; i++) {
        const cell = document.createElement("div");
        cell.className = "dal-cell";
        strip.current.appendChild(cell);
        stripCells.push(cell);
      }
    }
    let stripAt = 0;

    // Sixteen labelled bars, built once and then written to directly, like every other meter
    // in this lab: a duel at 30 Hz must never go through React.
    const qCells: { row: HTMLDivElement; fill: HTMLDivElement; val: HTMLSpanElement }[] = [];
    if (qGrid.current) {
      qGrid.current.replaceChildren();
      ACTION_NAMES.forEach((name) => {
        const row = document.createElement("div");
        row.className = "dal-q";
        const cap = document.createElement("span");
        cap.className = "dal-qcap";
        cap.textContent = name;
        const track = document.createElement("div");
        track.className = "dal-qtrack";
        const mid = document.createElement("div");   // the average, which every bar grows out of
        mid.className = "dal-qmid";
        const fill = document.createElement("div");
        fill.className = "dal-qfill";
        track.append(mid, fill);
        const val = document.createElement("span");
        val.className = "dal-qval";
        val.textContent = "--";
        row.append(cap, track, val);
        qGrid.current!.appendChild(row);
        qCells.push({ row, fill, val });
      });
    }

    const camPos = new THREE.Vector3(0, 6, 10);
    const camAim = new THREE.Vector3(0, 1.3, 0);

    // Reused rather than allocated: one decision every three frames, thirty frames a second.
    const obsBuf = new Float32Array(N_OBS);

    const decide = (e: Duel): number => {
      if (B.mode === NET) {
        // No epsilon and no sampling -- the greedy argmax that `evaluate()` scores in Python.
        if (!B.net) return A_IDLE;
        B.q = qValues(B.net, e.obs(obsBuf));
        return argmax(B.q);
      }
      if (B.mode !== PLAY) return SCRIPTED[B.mode](e);
      if (B.queued !== null) {
        const q = B.queued;
        B.queued = null;
        return q;
      }
      if (B.guard) return A_GUARD;
      const k = heldToEighth(B.held);
      return k === null ? A_IDLE : A_MOVE0 + k;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const e = B.duel!;

      if (B.running && !B.over) {
        acc += dt * FPS * B.speed;
        let steps = 0;
        while (acc >= 1 && steps < 8) {
          acc -= 1;
          steps++;
          if (e.t % DECIDE_EVERY === 0) action = decide(e);
          const out = e.step(action);

          const n = stripCells.length;
          if (n) {
            const cell = stripCells[stripAt % n];
            cell.style.background = STRIP[e.bm >= 0 ? "iwdhr".indexOf(phaseAt(MOVES[e.bm], e.bf)[0]) : 0];
            stripCells[(stripAt + 1) % n].style.background = "rgba(255,255,255,0.55)";
          }
          stripAt++;

          if (B.mode === NET && qCells.length) {
            const q = B.q;
            if (!q) {
              for (const c of qCells) {
                c.fill.style.left = "50%";
                c.fill.style.width = "0%";
                c.val.textContent = "--";
              }
            } else {
              // Each bar is one action's Q against the AVERAGE Q of that moment: right of the
              // centre line is better than the average button, left is worse.
              //
              // The scale is FIXED, which is the whole point. The fan between best and worst is
              // 0.84 wide in the median decision and 5.35 at the 90th percentile, so dividing by
              // it per frame -- which is what min-max normalisation does -- meant a full-width bar
              // stood for 0.84 of Q in one frame and 5.35 in the next. A fixed span makes a bar
              // mean the same thing throughout; the signed square root keeps a 0.1 difference
              // visible without letting it impersonate a 4.0 one.
              // scripts/boss_qspread.mjs is where those numbers come from.
              let lo = Infinity, hi = -Infinity, sum = 0;
              for (let i = 0; i < q.length; i++) {
                if (q[i] < lo) lo = q[i];
                if (q[i] > hi) hi = q[i];
                sum += q[i];
              }
              const mean = sum / q.length;
              const pick = argmax(q);
              for (let i = 0; i < qCells.length; i++) {
                const d = q[i] - mean;
                const u = Math.sign(d) * Math.min(1, Math.sqrt(Math.abs(d) / Q_SPAN));
                const c = qCells[i];
                c.fill.style.left = `${50 + Math.min(0, u) * 50}%`;
                c.fill.style.width = `${Math.abs(u) * 50}%`;
                c.row.className = i === pick ? "dal-q pick" : d < 0 ? "dal-q low" : "dal-q";
                c.val.textContent = q[i].toFixed(1);
              }
              if (qNote.current) {
                qNote.current.textContent =
                  `${ACTION_NAMES[pick]} — ahead by ${margin(q).toFixed(2)}, whole fan ${(hi - lo).toFixed(2)} wide`;
              }
            }
          }

          if (e.events.length) {
            // the last event that is worth saying out loud -- landing an ordinary hit is not one,
            // the boss's health bar already says it
            const ev = [...e.events].reverse().find((x) => x in TOAST);
            flashMat.opacity = 0.8;
            if (ev && toast.current) {
              toast.current.textContent = ev;
              toast.current.className = "dal-toast " + TOAST[ev];
              toastAt = t;
            }
            if (e.events.includes("POISE BREAK")) poiseFlash = t;
            if (ev === "hit taken" || ev === "GUARD BREAK") shake = 0.34;
            else if (ev === "PARRY" || ev === "riposte" || ev === "POISE BREAK") shake = 0.22;
          }
          if (out.terminated || out.truncated) {
            B.over = true;
            setOver(true);
            const ending = out.won ? "won" : out.lost ? "lost" : "clock";
            setTally((p) => ({
              duels: p.duels + 1,
              wins: p.wins + (ending === "won" ? 1 : 0),
              deaths: p.deaths + (ending === "lost" ? 1 : 0),
              clock: p.clock + (ending === "clock" ? 1 : 0),
            }));
            setCounts({
              parries: e.log.parries, blocks: e.log.blocks, dodges: e.log.dodges,
              arcMisses: e.log.arcMisses, guardBreaks: e.log.guardBreaks, hitsDealt: e.log.hitsDealt,
              poiseBreaks: e.log.poiseBreaks,
            });
            break;
          }
        }
      }

      // ---- the bodies ---------------------------------------------------
      knight.root.position.set(e.px, 0, e.pz);
      knight.root.rotation.y = Math.atan2(e.bx - e.px, e.bz - e.pz); // always squared up: lock-on
      ogre.root.position.set(e.bx, 0, e.bz);
      ogre.root.rotation.y = e.bang;
      poseKnight(knight, e, dt);
      const shockR = poseBoss(ogre, e, dt);

      pBlob.position.set(e.px, 0.025, e.pz);
      bBlob.position.set(e.bx, 0.03, e.bz);

      // ---- what can hurt whom, on the floor ------------------------------
      if (e.bm >= 0 && e.bStagger === 0) {
        const m = MOVES[e.bm];
        const [kind] = phaseAt(m, e.bf);
        arcMesh.geometry = arcGeos[e.bm];
        arcMesh.position.set(e.bx, 0.035, e.bz);
        arcMesh.rotation.y = e.bang - Math.PI / 2;
        arcMesh.visible = true;
        // Windup and delay are drawn IDENTICALLY, on purpose. The delay is the frames the boss
        // spends holding a finished-looking windup, and colouring it differently here would hand
        // the player a tell the world does not give them. Only "can hurt you now" turns red.
        arcMat.color.setHex(kind === "h" ? 0xef4444 : 0xe8b84b);
        arcMat.opacity = kind === "h" ? 0.72 : 0.32;
        ogre.edge.emissiveIntensity = kind === "h" ? 1.7 : kind === "r" ? 0 : 0.3;
        ogre.skin.color.setHex(kind === "h" ? 0x8a4a4e : SKIN.boss);
      } else {
        arcMesh.visible = false;
        ogre.edge.emissiveIntensity = 0;
        ogre.skin.color.setHex(e.bStagger > 0 ? 0x8a7a3c : SKIN.boss);
      }

      const swinging = e.pa === A_ATK && e.pf < ATK_LEN;
      const pActive = swinging && phaseAt({ seg: ATK_SEG }, e.pf)[0] === "h";
      reachMesh.position.set(e.px, 0.04, e.pz);
      reachMat.opacity = pActive ? 0.62 : swinging ? 0.18 : Math.max(0, reachMat.opacity - dt * 1.6);
      reachMat.color.setHex(e.bStagger > 0 ? 0xe8b84b : 0x9ecbff);
      knight.edge.emissiveIntensity = pActive ? (e.bStagger > 0 ? 4.5 : 2.2) : 0;

      flash.position.set(e.px, 0.045, e.pz);
      flashMat.opacity = Math.max(0, flashMat.opacity - dt * 2.2);
      const rolling = e.pa >= A_ROLL0 && e.pa <= A_ROLL0 + 3;
      const iFrames = rolling && e.pf >= 3 && e.pf <= 12;
      const parrying = e.pa === A_PARRY && e.pf >= 3 && e.pf <= 7;
      flashMat.color.setHex(iFrames || parrying ? 0x4ade80 : 0xef4444);
      if (iFrames || parrying) flashMat.opacity = Math.max(flashMat.opacity, 0.45);
      knight.skin.color.setHex(e.pStun > 0 ? 0x8d93a0 : iFrames ? 0x7ee6a0 : parrying ? 0x8fd8ff : SKIN.knight);

      if (shockR > 0) {
        shock.position.set(e.bx, 0.05, e.bz);
        shock.scale.setScalar(shockR);
        shockMat.opacity = 0.7;
      } else {
        shockMat.opacity = Math.max(0, shockMat.opacity - dt * 2.2);
        shock.scale.multiplyScalar(1 + dt * 1.4);
      }

      arena.tick(t, dt);

      // ---- camera: over the player's shoulder, the boss kept in frame -----
      const bk = new THREE.Vector3(e.px - e.bx, 0, e.pz - e.bz);
      if (bk.lengthSq() < 1e-6) bk.set(0, 0, 1);
      bk.normalize();
      // pull back and rise as the gap opens, so both fighters stay in frame at any range
      // Further back and higher than a duel strictly needs. The extra distance is what puts the
      // colonnade, the braziers and the gate behind the boss instead of off-screen: the room is
      // half of what tells you where you are standing in it.
      const want = new THREE.Vector3(e.px, 0, e.pz).add(bk.multiplyScalar(6.0 + 0.62 * e.d));
      want.y = 4.05 + 0.32 * e.d;
      camPos.lerp(want, 1 - Math.pow(0.0018, dt));
      camera.position.copy(camPos);
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        shake = Math.max(0, shake - dt * 1.6);
      }
      camAim.lerp(new THREE.Vector3((e.px + e.bx) / 2, 1.45, (e.pz + e.bz) / 2), 1 - Math.pow(0.002, dt));
      camera.lookAt(camAim);

      renderer.render(scene, camera);

      // ---- the HUD, written straight from the simulation -----------------
      ghostP += (e.php - ghostP) * Math.min(1, dt * 2.2);
      ghostB += (e.bhp - ghostB) * Math.min(1, dt * 2.2);
      if (hp.current) hp.current.style.width = pct(e.php, P_HP_MAX);
      if (hpGhost.current) hpGhost.current.style.width = pct(ghostP, P_HP_MAX);
      if (hpNum.current) hpNum.current.textContent = `${Math.max(0, Math.ceil(e.php))}`;
      if (st.current) st.current.style.width = pct(e.pst, P_ST_MAX);
      if (stWrap.current) stWrap.current.style.opacity = e.pRegenLock > 0 ? "0.62" : "1";
      if (bhp.current) bhp.current.style.width = pct(e.bhp, B_HP_MAX);
      if (bhpGhost.current) bhpGhost.current.style.width = pct(ghostB, B_HP_MAX);

      if (poise.current) {
        poise.current.style.width = pct(e.bPoise, B_POISE_MAX);
        const f = Math.max(0, 1 - (t - poiseFlash) * 2.2);
        poise.current.style.filter = f > 0 ? `brightness(${1 + 2.4 * f})` : "";
      }

      const staggered = e.bStagger > 0;
      if (ripWrap.current) ripWrap.current.style.opacity = staggered ? "1" : "0.18";
      if (rip.current) rip.current.style.width = pct(e.bStagger, STAGGER);
      if (stagWrap.current) stagWrap.current.style.opacity = staggered ? "1" : "0";
      if (stag.current) stag.current.style.width = pct(e.bStagger, STAGGER);

      if (bossPhase.current) {
        const m = e.bm >= 0 ? MOVES[e.bm] : null;
        bossPhase.current.textContent = staggered
          ? "staggered"
          : m
          ? `${m.name} · ${PHASE[["i", "w", "d", "h", "r"].indexOf(phaseAt(m, e.bf)[0])] ?? "—"}`
          : e.d > 2.9 ? "closing" : "waiting";
      }
      if (clockTxt.current) clockTxt.current.textContent = `${(e.t / FPS).toFixed(1)}s`;
      if (geoTxt.current) {
        geoTxt.current.textContent = `${e.d.toFixed(2)} away · ${Math.abs((e.offAxis() * 180) / Math.PI).toFixed(0)}° off centre`;
      }
      if (tellTxt.current) {
        const k = framesToActive(e);
        tellTxt.current.textContent = k === null ? "" : `${k}`;
        tellTxt.current.style.opacity = k === null ? "0" : k <= 4 ? "1" : "0.72";
        tellTxt.current.style.color = k !== null && k <= 4 ? "#ef4444" : "#e8b84b";
      }
      if (toast.current) toast.current.style.opacity = `${Math.max(0, 1 - (t - toastAt) * 1.5)}`;
      if (endTxt.current) {
        endTxt.current.textContent = !B.over ? "" : e.bhp <= 0 ? "BOSS FELLED" : e.php <= 0 ? "YOU DIED" : "TIME CALLED";
        endTxt.current.style.opacity = B.over ? "1" : "0";
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      arena.dispose();
      env.dispose();
      disposeFighters();
      arcGeos.forEach((g) => g.dispose());
      [reachGeo, flashGeo, shockGeo, blobGeo].forEach((g) => g.dispose());
      [arcMat, reachMat, flashMat, shockMat, blobMat].forEach((m) => m.dispose());
      blobTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // ---------------------------------------------------------------- input
  useEffect(() => {
    const B = box.current;
    const press = (code: string, down: boolean) => {
      if (code === "KeyW") B.held.w = down;
      else if (code === "KeyA") B.held.a = down;
      else if (code === "KeyS") B.held.s = down;
      else if (code === "KeyD") B.held.d = down;
      else if (code === "ShiftLeft" || code === "ShiftRight") B.guard = down;
      else if (down) {
        if (code === "KeyJ") B.queued = A_ATK;
        else if (code === "KeyK") B.queued = A_PARRY;
        else if (code === "Space") {
          const k = heldToEighth(B.held);
          const quarter = k === null ? 2 : Math.round(k / 2) % 4; // in / right / back / left
          B.queued = A_ROLL0 + quarter;
        }
      }
    };
    const KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyK", "Space", "ShiftLeft", "ShiftRight"];
    const onDown = (ev: KeyboardEvent) => {
      if (!box.current.running || box.current.mode !== PLAY) return;
      if (KEYS.includes(ev.code)) {
        ev.preventDefault();
        press(ev.code, true);
      }
    };
    const onUp = (ev: KeyboardEvent) => press(ev.code, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const restart = (newMode?: string) => {
    const B = box.current;
    B.duel = new Duel({ oracle: rngOracle(Math.floor(Math.random() * 1e9)) });
    B.over = false;
    B.queued = null;
    B.held = { w: false, a: false, s: false, d: false };
    B.guard = false;
    setOver(false);
    setCounts({ parries: 0, blocks: 0, dodges: 0, arcMisses: 0, guardBreaks: 0, hitsDealt: 0, poiseBreaks: 0 });
    if (newMode) setMode(newMode);
    setRunning(true);
  };

  const tap = (a: number) => { box.current.queued = a; };

  return (
    <div style={wrap}>
      <style>{CSS}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={head}>The arena</span>
        <span style={mono}>every meter below is a field of the simulation, read straight off it</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => restart(PLAY)} style={{ ...btn, ...(mode === PLAY ? on : {}) }}>{PLAY}</button>
        {WATCHERS.map((w) => (
          <button key={w} onClick={() => restart(w)} style={{ ...btn, ...(mode === w ? on : {}) }}>watch: {w}</button>
        ))}
        {showNet && (
          <button
            onClick={() => restart(NET)}
            style={{ ...btn, ...(mode === NET ? on : {}), borderColor: mode === NET ? undefined : "var(--c-rl)", color: mode === NET ? undefined : "var(--c-rl)" }}
          >
            watch: {NET}
          </button>
        )}
      </div>

      {/* Rendered whenever the net is available, not only while it is selected: the effect
          that builds the sixteen bars runs once at mount, so the node has to exist by then. */}
      {showNet && (
        <div className="dal-qwrap" style={{ display: mode === NET ? "block" : "none" }}>
          <div className="dal-qhead">
            <span style={head}>what it is thinking</span>
            <span style={mono} ref={qNote}>
              {netState === "loading" ? "fetching 308 KB of weights…"
                : netState === "error" ? "could not load the weights"
                : "one forward pass every three frames, sixteen Q-values out"}
            </span>
          </div>
          <div className="dal-qgrid" ref={qGrid} />
        </div>
      )}

      <div className="dal-stage">
        <div ref={mount} className="dal-mount" />
        <div className="dal-vig" />

        {/* ---- player plate: health, the riposte window, stamina ---- */}
        <div className="dal-plate">
          <div className="dal-row">
            <span className="dal-cap">health</span>
            <span className="dal-num" ref={hpNum}>100</span>
          </div>
          <div className="dal-bar big">
            <div className="dal-ghost" ref={hpGhost} />
            <div className="dal-fill hp" ref={hp} />
          </div>

          <div className="dal-rip" ref={ripWrap}>
            <div className="dal-row">
              <span className="dal-cap">riposte window</span>
              <span className="dal-cap gold">×{RIPOSTE_MULT.toFixed(0)}</span>
            </div>
            <div className="dal-bar">
              <div className="dal-fill rip" ref={rip} />
            </div>
          </div>

          <div ref={stWrap}>
            <div className="dal-row"><span className="dal-cap">stamina</span></div>
            <div className="dal-bar">
              <div className="dal-fill st" ref={st} />
              {[PARRY_COST, ATK_COST, ROLL_COST].map((c) => (
                <div key={c} className="dal-tick" style={{ left: `${c}%` }} title={`${c}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ---- readouts ---- */}
        <div className="dal-read">
          <div className="dal-clock" ref={clockTxt}>0.0s</div>
          <div className="dal-geo" ref={geoTxt} />
          <div className="dal-tellwrap">
            <div className="dal-tell" ref={tellTxt} />
            <div className="dal-telllbl">frames until it can hurt you</div>
          </div>
        </div>

        <div className="dal-toast" ref={toast} />
        <div className="dal-end" ref={endTxt} />

        {/* ---- boss plate ---- */}
        <div className="dal-boss">
          <div className="dal-bossname">The Warden of the Ring</div>
          <div className="dal-bar boss">
            <div className="dal-ghost" ref={bhpGhost} />
            <div className="dal-fill bhp" ref={bhp} />
          </div>
          <div className="dal-poiserow">
            <span className="dal-cap">poise</span>
            <div className="dal-bar thin grow">
              <div className="dal-fill poi" ref={poise} />
              <div className="dal-tick" style={{ left: "50%" }} />
            </div>
            <span className="dal-cap">2 hits</span>
          </div>
          <div className="dal-stag" ref={stagWrap}>
            <div className="dal-bar thin">
              <div className="dal-fill stag" ref={stag} />
            </div>
            <div className="dal-staglbl">staggered — your next hit is a riposte</div>
          </div>
          <div className="dal-phase" ref={bossPhase} />
        </div>

      </div>

      <div style={{ marginTop: 8 }}>
        <div ref={strip} className="dal-strip" />
        <div style={{ ...mono, marginTop: 3, color: "var(--faint)" }}>
          the last three seconds of the boss — <span style={{ color: "#e8b84b" }}>windup</span>,{" "}
          <span style={{ color: "#fb923c" }}>delay</span> (identical to look at, which is why the arena draws it the same),{" "}
          <span style={{ color: "#ef4444" }}>the frames that can hurt you</span>, recovery
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={() => (over ? restart() : setRunning(!running))} style={{ ...btn, minWidth: 92 }}>
          {over ? "new duel" : running ? "pause" : "fight"}
        </button>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ ...btn, padding: "5px 8px" }} aria-label="speed">
          <option value={1}>real time (30 fps)</option>
          <option value={0.5}>half speed</option>
          <option value={0.25}>quarter speed</option>
        </select>
        <span style={{ ...mono, color: "var(--faint)" }}>
          W A S D move · J attack · K parry · Shift guard · Space roll
        </span>
      </div>

      {mode === PLAY && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button style={btn} onClick={() => tap(A_ATK)}>attack</button>
          <button style={btn} onClick={() => tap(A_PARRY)}>parry</button>
          {/* quarter q steps along eighth 2q, so 3 is local -x: the one that reads as right */}
          <button style={btn} onClick={() => tap(A_ROLL0 + 3)}>roll right</button>
          <button style={btn} onClick={() => tap(A_ROLL0 + 1)}>roll left</button>
          <button style={btn} onClick={() => tap(A_ROLL0 + 2)}>roll back</button>
        </div>
      )}

      {(over || tally.duels > 0) && (
        <div style={{ ...mono, marginTop: 8, color: "var(--faint)" }}>
          {tally.duels} duels · {tally.wins} won · {tally.deaths} died · {tally.clock} ran out
          {over && ` — last: ${counts.parries} parries, ${counts.poiseBreaks} poise breaks, ${counts.blocks} blocks, ${counts.dodges} dodges, ${counts.guardBreaks} guard breaks, ${counts.hitsDealt} hits landed, ${counts.arcMisses} of its swings reached you and missed on angle`}
        </div>
      )}
    </div>
  );
}

const PHASE = ["idle", "windup", "delay", "ACTIVE", "recovery"];
const TOAST: Record<string, string> = {
  PARRY: "good", riposte: "good", dodge: "good", "POISE BREAK": "good",
  block: "warn", "arc miss": "warn",
  "hit taken": "bad", "GUARD BREAK": "bad",
};
const STRIP = [
  "rgba(255,255,255,0.06)",
  "#e8b84b",
  "#fb923c",
  "#ef4444",
  "rgba(255,255,255,0.20)",
];

const CSS = `
.dal-stage { position: relative; width: 100%; border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border); background: #0e1015; }
.dal-mount { width: 100%; }
.dal-stage { --hud: ui-monospace, SFMono-Regular, Menlo, monospace; }
.dal-vig { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%); }

.dal-plate { position: absolute; top: 12px; left: 14px; width: min(34%, 230px); pointer-events: none; }
.dal-row { display: flex; justify-content: space-between; align-items: baseline; }
.dal-cap { font: 500 9.5px/1.5 var(--hud); letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(226,232,240,0.62); }
.dal-cap.gold { color: #e8b84b; }
.dal-num { font: 600 13px/1 var(--hud); color: #e8eaf0; }
.dal-bar { position: relative; height: 7px; margin: 2px 0 7px; border-radius: 2px;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.13); overflow: hidden; }
.dal-bar.big { height: 11px; }
.dal-bar.thin { height: 4px; margin: 2px 0 3px; }
.dal-bar.boss { height: 9px; }
.dal-fill, .dal-ghost { position: absolute; inset: 0 auto 0 0; height: 100%; }
.dal-ghost { background: rgba(255,255,255,0.42); transition: none; }
.dal-fill.hp { background: linear-gradient(180deg, #f06a6a, #b32020); }
.dal-fill.st { background: linear-gradient(180deg, #8fe3b0, #3f9d6b); }
.dal-fill.rip { background: linear-gradient(180deg, #ffd978, #d09a1a); }
.dal-fill.bhp { background: linear-gradient(180deg, #e8c07a, #9a6b23); }
.dal-fill.stag { background: linear-gradient(180deg, #fff1c2, #e8b84b); }
.dal-fill.poi { background: linear-gradient(180deg, #cfd9e8, #6f7f99); transition: filter 0.1s; }
.dal-poiserow { display: flex; align-items: center; gap: 6px; margin-top: 1px; }
.dal-bar.grow { flex: 1; margin: 0; }
.dal-tick { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.75);
  box-shadow: 1px 0 0 rgba(255,255,255,0.22); }
.dal-rip { transition: opacity 0.18s; }

.dal-read { position: absolute; top: 12px; right: 14px; text-align: right; pointer-events: none; }
.dal-clock { font: 600 15px/1.1 var(--hud); color: #e8eaf0; }
.dal-geo { font: 400 10px/1.5 var(--hud); color: rgba(226,232,240,0.6); }
.dal-tellwrap { margin-top: 8px; }
.dal-tell { font: 700 30px/1 var(--hud); color: #e8b84b; transition: opacity 0.12s; min-height: 30px; }
.dal-telllbl { font: 400 9px/1.4 var(--hud); color: rgba(226,232,240,0.45);
  max-width: 108px; margin-left: auto; text-transform: uppercase; letter-spacing: 0.06em; }

.dal-toast { position: absolute; left: 50%; top: 34%; transform: translateX(-50%);
  font: 600 15px/1 var(--hud); letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0; pointer-events: none; text-shadow: 0 2px 10px rgba(0,0,0,0.9); }
.dal-toast.good { color: #6ee7a0; }
.dal-toast.warn { color: #fb923c; }
.dal-toast.bad  { color: #f87171; }

.dal-end { position: absolute; left: 0; right: 0; top: 44%; text-align: center; opacity: 0;
  font-family: var(--font-display, serif); font-size: clamp(22px, 5vw, 40px); letter-spacing: 0.14em;
  color: #e2c07a; text-shadow: 0 3px 22px rgba(0,0,0,0.95); pointer-events: none;
  transition: opacity 0.35s; }

.dal-boss { position: absolute; left: 50%; transform: translateX(-50%); bottom: 12px;
  width: min(62%, 420px); text-align: center; pointer-events: none; }
.dal-bossname { font: 500 10px/1.6 var(--hud); letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(232,184,75,0.85); }
.dal-stag { transition: opacity 0.15s; }
.dal-staglbl { font: 500 8.5px/1.4 var(--hud); letter-spacing: 0.1em; text-transform: uppercase;
  color: #e8b84b; margin-bottom: 3px; }
.dal-phase { font: 400 10px/1.5 var(--hud); color: rgba(226,232,240,0.62); }

.dal-strip { display: flex; gap: 1px; height: 12px; }
.dal-cell { flex: 1; background: rgba(255,255,255,0.06); }
.dal-qwrap { margin: 0 0 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-2, rgba(127,127,127,0.05)); }
.dal-qhead { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.dal-qgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(246px, 1fr)); gap: 4px 18px; }
.dal-q { display: grid; grid-template-columns: 96px 1fr 38px; align-items: center; gap: 8px; opacity: 0.85; }
.dal-q.pick { opacity: 1; }
.dal-qcap { font-size: 10.5px; font-family: ui-monospace, monospace; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dal-q.pick .dal-qcap { color: var(--c-rl); font-weight: 600; }
.dal-qtrack { position: relative; height: 9px; border-radius: 3px; background: rgba(127,127,127,0.13); overflow: hidden; }
.dal-qmid { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; z-index: 1; background: rgba(210,210,210,0.55); }
.dal-qfill { position: absolute; top: 1px; bottom: 1px; left: 50%; width: 0%; border-radius: 2px; background: rgba(125,170,235,0.75); }
.dal-q.low .dal-qfill { background: rgba(150,150,150,0.45); }
.dal-q.pick .dal-qfill { background: var(--c-rl); }
.dal-qval { font-size: 10.5px; font-family: ui-monospace, monospace; color: var(--muted); text-align: right; }
.dal-q.pick .dal-qval { color: var(--c-rl); }

@media (max-width: 560px) {
  .dal-plate { width: 44%; top: 8px; left: 9px; }
  .dal-read { top: 8px; right: 9px; }
  .dal-tell { font-size: 21px; min-height: 21px; }
  .dal-boss { width: 78%; bottom: 8px; }
}
`;

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.2rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const mono: React.CSSProperties = { fontSize: 11.5, fontFamily: "ui-monospace, monospace", color: "var(--muted)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
