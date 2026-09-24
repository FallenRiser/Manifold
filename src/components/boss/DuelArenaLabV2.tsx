"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  A_ATK, A_GUARD, A_HEAVY, A_IDLE, A_MOVE0, A_PARRY, A_ROLL0,
  ARENA, ATK_COST, ATK2_COST, ATK2_SEG, ATK_SEG, B_HP_MAX, B_POISE_MAX, ENGAGE, FPS,
  GUARDBREAK, HITSTUN, MOVES, P_HP_MAX, P_ST_MAX, PAR_I0, PARRY_COST, PARRY_HEAT, PARRY_LEN,
  PARRY_STEP, PARRY_WIN, RIPOSTE_MULT, ROLL_COST, ROLL_LEN, SCRIPTED, STAGGER, ACTION_NAMES,
  Duel, framesToActive, phaseAt, rngOracle, windowIfPressedNow,
} from "./duelSimV2";
import { blobTexture, buildArena, envMap } from "./arenaScene";
import {
  SKIN, buildBoss, buildKnight, disposeFighters, poseBoss, poseKnight, type PoseRules,
} from "./fighters";
import { decodeNet, qValues, top2, type NetV2 } from "./trainedPolicyV2";
import { asset } from "@/lib/asset";

// The v2 duel you can stand in. The simulation is duelSimV2.ts, which
// scripts/boss_port_check_v2.mjs checks frame for frame against BOSS_SETUP_V2; this file only
// draws it and reads buttons.
//
// The room and the two rigs are the SAME code the v1 arena uses (arenaScene.ts, fighters.ts).
// They are parameterised rather than copied, so a visual improvement lands in both fights, and
// the 11m ring here gets a proportionally bigger room without a line of set dressing changing.
//
// What this lab has that v1's does not, because v2 has mechanics v1 did not:
//   - a PARRY WINDOW meter. The window is six frames and shrinks by two for every press
//     inside PARRY_HEAT frames of the last. You can watch yourself spend it.
//   - an UNBLOCKABLE telegraph. The eruption ignores guard and parry; the only answer is to
//     leave, so it is drawn in a colour nothing else uses.

const DECIDE_EVERY = 3;

const POSE: PoseRules = {
  MOVES, ATK_SEG, ATK2_SEG,
  A_ATK, A_HEAVY, A_MOVE0, A_PARRY, A_ROLL0,
  ROLL_LEN, PARRY_LEN, PAR_I0, PAR_I1: PAR_I0 + PARRY_WIN - 1,
  ENGAGE, HITSTUN, GUARDBREAK,
};

const PLAY = "you have the controls";
const AGENT = "the trained net";
const WATCHERS = ["patient parry", "mash parry", "roll, punish", "hold guard"];

// 80,145 float32 from `boss_v2_train.py dqn --decisions 6000000`, fetched only if somebody asks
// to watch it. scripts/boss_policy_check_v2.mjs proves this file computes what torch computed,
// on the same observation, for the same button -- including that the WORLD hash still matches.
const NET_URL = "/boss/v2_dqn_6000k_s0.bin";

// How decided a choice is, encoded against the MEASURED spread rather than each frame's own
// min and max. scripts/boss_qspread_v2.mjs over 28,877 decisions: p10 0.004, median 0.024,
// p90 0.167 -- a 46x range. The v1 arena rescaled per frame and made every decision look
// identical, which is the one thing a confidence readout must not do.
const TIE = 0.02;      // at or below the median: the top two are interchangeable
const DECIDED = 0.17;  // at or above p90: a real call

function decisiveness(m: number) {
  if (m <= TIE) return { label: "near-tie", colour: "#8a8a8a" };
  if (m >= DECIDED) return { label: "decided", colour: "#4ade80" };
  return { label: "leaning", colour: "#e2c07a" };
}

type Held = { w: boolean; a: boolean; s: boolean; d: boolean; guard: boolean };

export function DuelArenaLabV2() {
  const mount = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState(PLAY);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [over, setOver] = useState(false);
  const [tally, setTally] = useState({ duels: 0, wins: 0, deaths: 0, clock: 0 });
  const [counts, setCounts] = useState({ parries: 0, mashes: 0, dead: 0, poiseBreaks: 0, erupt: 0 });

  // HUD nodes, written straight from the simulation every frame
  const hp = useRef<HTMLDivElement>(null);
  const hpGhost = useRef<HTMLDivElement>(null);
  const hpNum = useRef<HTMLSpanElement>(null);
  const st = useRef<HTMLDivElement>(null);
  const bhp = useRef<HTMLDivElement>(null);
  const bhpGhost = useRef<HTMLDivElement>(null);
  const poise = useRef<HTMLDivElement>(null);
  const stag = useRef<HTMLDivElement>(null);
  const stagWrap = useRef<HTMLDivElement>(null);
  const rip = useRef<HTMLDivElement>(null);
  const ripWrap = useRef<HTMLDivElement>(null);
  const clockTxt = useRef<HTMLDivElement>(null);
  const geoTxt = useRef<HTMLDivElement>(null);
  const tellTxt = useRef<HTMLDivElement>(null);
  const bossPhase = useRef<HTMLDivElement>(null);
  const toast = useRef<HTMLDivElement>(null);
  const endTxt = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const warn = useRef<HTMLDivElement>(null);
  // the parry panel
  const pwPips = useRef<HTMLDivElement>(null);
  const pwHeat = useRef<HTMLDivElement>(null);
  const pwNote = useRef<HTMLDivElement>(null);
  // the "what it is thinking" panel, only written while the net is driving
  const [netState, setNetState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const agPick = useRef<HTMLSpanElement>(null);
  const agVs = useRef<HTMLSpanElement>(null);
  const agTag = useRef<HTMLSpanElement>(null);
  const agBar = useRef<HTMLDivElement>(null);
  const agNum = useRef<HTMLSpanElement>(null);
  const agBars = useRef<HTMLDivElement>(null);

  // everything the animation loop needs that must not re-create the scene when it changes
  const box = useRef({
    mode: PLAY, running: false, speed: 1, queued: -1,
    held: { w: false, a: false, s: false, d: false, guard: false } as Held,
    reset: false,
    net: null as NetV2 | null,
  });
  box.current.mode = mode;
  box.current.running = running;
  box.current.speed = speed;

  const restart = (m?: string) => {
    if (m) setMode(m);
    box.current.reset = true;
    setOver(false);
    setRunning(true);
  };

  // 320 KB, fetched on demand rather than on page load: most readers play the fight themselves
  // and never ask to watch the net at all.
  useEffect(() => {
    if (mode !== AGENT || box.current.net || netState !== "idle") return;
    setNetState("loading");
    fetch(asset(NET_URL))
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((b) => { box.current.net = decodeNet(b); setNetState("ready"); })
      .catch(() => setNetState("error"));
  }, [mode, netState]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1015);
    // the ring is 11m now, so the far plane and the fog both sit further out than v1's
    scene.fog = new THREE.Fog(0x0e1015, 26, 74);

    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 240);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";

    const env = envMap(renderer);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.55;

    const arena = buildArena(ARENA);
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
    // The eruption gets its own colour because it is the one move no button answers.
    const arcMat = new THREE.MeshBasicMaterial({ color: 0xe8b84b, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
    const arcGeos = MOVES.map((m) => {
      const g = new THREE.RingGeometry(0.4, m.reach, 72, 1, -m.arc, 2 * m.arc);
      g.rotateX(-Math.PI / 2);
      return g;
    });
    const arcMesh = new THREE.Mesh(arcGeos[0], arcMat);
    arcMesh.position.y = 0.035;
    arcMesh.visible = false;
    scene.add(arcMesh);

    const reachMat = new THREE.MeshBasicMaterial({ color: 0x9ecbff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const reachGeo = new THREE.RingGeometry(1.9, 2.0, 64);
    reachGeo.rotateX(-Math.PI / 2);
    const reachMesh = new THREE.Mesh(reachGeo, reachMat);
    reachMesh.position.y = 0.04;
    scene.add(reachMesh);

    // the i-frame / parry flash under the player
    const flashMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), flashMat);
    flash.rotation.x = -Math.PI / 2;
    scene.add(flash);

    // the shockwave the slam and the eruption drive out of the floor
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xff7a3c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const shockGeo = new THREE.RingGeometry(0.82, 1, 64);
    shockGeo.rotateX(-Math.PI / 2);
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.position.y = 0.05;
    scene.add(shock);

    // the frame strip: the last three seconds of the boss
    const stripCells: HTMLDivElement[] = [];
    if (strip.current) {
      strip.current.replaceChildren();
      for (let i = 0; i < 90; i++) {
        const c = document.createElement("div");
        c.className = "dv-cell";
        strip.current.appendChild(c);
        stripCells.push(c);
      }
    }

    // the parry window: three pips, one per frame of window, that go out as you spend them
    const pips: HTMLDivElement[] = [];
    if (pwPips.current) {
      pwPips.current.replaceChildren();
      for (let i = 0; i < PARRY_WIN; i++) {
        const p = document.createElement("div");
        p.className = "dv-pip";
        pwPips.current.appendChild(p);
        pips.push(p);
      }
    }

    let e = new Duel({ oracle: rngOracle((Math.random() * 1e6) | 0) });
    const B = box.current;
    let acc = 0;
    let decision = A_IDLE;
    let ghostP = P_HP_MAX;
    let ghostB = B_HP_MAX;
    let shockR = 0;
    let shake = 0;
    let toastT = 0;
    const camPos = new THREE.Vector3(0, 5, 9);
    const camAim = new THREE.Vector3(0, 1.45, 0);
    const hist: string[] = [];

    // One row per button, in a FIXED order. Fixed matters: if the rows re-sorted by value you
    // could not see the landscape shift during a windup, which is the whole point of watching.
    // Built on FIRST USE, not here: this effect runs once at mount, when the mode is still
    // "you have the controls" and the panel is not in the DOM at all, so agBars.current is null.
    let qRows: HTMLDivElement[] = [];
    const ensureRows = () => {
      if (qRows.length || !agBars.current) return;
      agBars.current.innerHTML = "";
      qRows = [];
      for (let i = 0; i < ACTION_NAMES.length; i++) {
        const row = document.createElement("div");
        row.className = "dv-qrow";
        const name = document.createElement("span");
        name.className = "dv-qname";
        name.textContent = ACTION_NAMES[i];
        const track = document.createElement("div");
        track.className = "dv-qtrack";
        const fill = document.createElement("div");
        fill.className = "dv-qfill";
        track.appendChild(fill);
        row.appendChild(name);
        row.appendChild(track);
        agBars.current.appendChild(row);
        qRows.push(fill);
      }
    };

    /**
     * Draw the decision. Bar length is each action's DEFICIT against the best, on the fixed
     * 0..DECIDED scale from boss_qspread_v2.mjs -- an action 0.17 behind the leader is empty,
     * the leader is full. Deliberately NOT normalised to the frame's own min and max: doing
     * that is what made the v1 panel unreadable, because it erased a 46x spread.
     */
    const paintAgent = (q: Float32Array, best: number, second: number) => {
      ensureRows();
      const m = q[best] - q[second];
      const d = decisiveness(m);
      if (agPick.current) agPick.current.textContent = ACTION_NAMES[best];
      if (agVs.current) agVs.current.textContent = ACTION_NAMES[second];
      if (agNum.current) agNum.current.textContent = m.toFixed(3);
      if (agTag.current) {
        agTag.current.textContent = d.label;
        agTag.current.style.color = d.colour;
      }
      if (agBar.current) {
        agBar.current.style.width = `${Math.min(100, (100 * m) / DECIDED)}%`;
        agBar.current.style.background = d.colour;
      }
      for (let i = 0; i < qRows.length; i++) {
        const behind = q[best] - q[i];
        qRows[i].style.width = `${Math.max(0, 100 * (1 - behind / DECIDED))}%`;
        qRows[i].style.background = i === best ? d.colour : "var(--faint)";
        qRows[i].style.opacity = i === best ? "1" : "0.55";
      }
    };

    const wanted = () => {
      if (B.mode === AGENT) {
        if (!B.net) return A_IDLE;
        const q = qValues(B.net, e.obs());
        const [best, second] = top2(q);
        paintAgent(q, best, second);
        return best;
      }
      if (B.mode !== PLAY) return SCRIPTED[B.mode](e);
      if (B.queued >= 0) {
        const q = B.queued;
        B.queued = -1;
        return q;
      }
      const h = B.held;
      const fwd = (h.w ? 1 : 0) - (h.s ? 1 : 0);
      const side = (h.d ? 1 : 0) - (h.a ? 1 : 0);
      if (fwd || side) {
        // eighths measured from "towards the boss", which is what _shift expects
        const table: Record<string, number> = {
          "1,0": 0, "1,1": 1, "0,1": 2, "-1,1": 3, "-1,0": 4, "-1,-1": 5, "0,-1": 6, "1,-1": 7,
        };
        return A_MOVE0 + table[`${fwd},${side}`];
      }
      return h.guard ? A_GUARD : A_IDLE;
    };

    const newDuel = () => {
      e = new Duel({ oracle: rngOracle((Math.random() * 1e6) | 0) });
      ghostP = P_HP_MAX;
      ghostB = B_HP_MAX;
      hist.length = 0;
      shockR = 0;
      if (endTxt.current) endTxt.current.style.opacity = "0";
    };

    const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (B.reset) { B.reset = false; newDuel(); }

      const done = e.php <= 0 || e.bhp <= 0 || e.t >= e.clock;
      if (B.running && !done) {
        acc += dt * FPS * B.speed;
        while (acc >= 1) {
          acc -= 1;
          if (e.t % DECIDE_EVERY === 0) decision = wanted();
          const before = e.bhp;
          e.step(decision);
          for (const ev of e.events) {
            if (ev === "PARRY" || ev === "POISE BREAK" || ev === "GUARD BREAK" || ev === "riposte" || ev === "ERUPTION" || ev === "parry dead") {
              if (toast.current) {
                toast.current.textContent = ev === "parry dead" ? "NO WINDOW" : ev.toUpperCase();
                toast.current.style.color = ev === "ERUPTION" || ev === "parry dead" ? "#ef4444" : ev === "PARRY" ? "#4ade80" : "#e2c07a";
              }
              toastT = 0.9;
            }
            if (ev === "hit taken" || ev === "ERUPTION") shake = ev === "ERUPTION" ? 0.4 : 0.22;
          }
          if (before !== e.bhp) shake = Math.max(shake, 0.12);
          // the strip
          const m = e.bm >= 0 && e.bStagger === 0 ? MOVES[e.bm] : null;
          hist.push(m ? phaseAt(m, e.bf)[0] : e.bStagger > 0 ? "s" : "-");
          if (hist.length > 90) hist.shift();
        }
        if (e.php <= 0 || e.bhp <= 0 || e.t >= e.clock) {
          setOver(true);
          setRunning(false);
          setCounts({
            parries: e.log.parries, mashes: e.log.parryMashes, dead: e.log.parryDead,
            poiseBreaks: e.log.poiseBreaks, erupt: e.log.hitsTaken,
          });
          setTally((t) => ({
            duels: t.duels + 1,
            wins: t.wins + (e.bhp <= 0 ? 1 : 0),
            deaths: t.deaths + (e.php <= 0 ? 1 : 0),
            clock: t.clock + (e.php > 0 && e.bhp > 0 ? 1 : 0),
          }));
          if (endTxt.current) {
            endTxt.current.textContent = e.bhp <= 0 ? "GREAT ENEMY FELLED" : e.php <= 0 ? "YOU DIED" : "TIME";
            endTxt.current.style.opacity = "1";
          }
        }
      }

      // ---- draw ----------------------------------------------------------
      knight.root.position.set(e.px, 0, e.pz);
      knight.root.rotation.y = Math.atan2(e.bx - e.px, e.bz - e.pz);
      ogre.root.position.set(e.bx, 0, e.bz);
      ogre.root.rotation.y = e.bang;
      poseKnight(knight, e, dt, POSE);
      const sh = poseBoss(ogre, e, dt, POSE);
      if (sh > 0) shockR = sh;
      else if (shockR > 0) shockR = 0;

      pBlob.position.set(e.px, 0.025, e.pz);
      bBlob.position.set(e.bx, 0.025, e.bz);

      const mv = e.bm >= 0 && e.bStagger === 0 ? MOVES[e.bm] : null;
      if (mv) {
        const [kind] = phaseAt(mv, e.bf);
        arcMesh.geometry = arcGeos[e.bm];
        arcMesh.position.set(e.bx, 0.035, e.bz);
        arcMesh.rotation.y = -e.bang;
        arcMesh.visible = true;
        // windup and delay look the same on purpose; active is the one that hurts
        const live = kind === "h";
        arcMat.color.setHex(mv.unblockable ? 0xa855f7 : live ? 0xef4444 : 0xe8b84b);
        arcMat.opacity = live ? 0.5 : kind === "r" ? 0.12 : 0.3;
      } else {
        arcMesh.visible = false;
      }

      // the unblockable banner
      if (warn.current) {
        const show = mv && mv.unblockable && phaseAt(mv, e.bf)[0] !== "r";
        warn.current.style.opacity = show ? "1" : "0";
      }

      reachMat.opacity = e.bStagger > 0 ? 0.5 : 0.16;
      reachMesh.position.set(e.px, 0.04, e.pz);

      flash.position.set(e.px, 0.045, e.pz);
      flashMat.opacity = Math.max(0, flashMat.opacity - dt * 2.2);
      const rolling = e.pa >= A_ROLL0 && e.pa <= A_ROLL0 + 3;
      const iFrames = rolling && e.pf >= 3 && e.pf <= 12;
      const parrying = e.parryLive;
      flashMat.color.setHex(iFrames || parrying ? 0x4ade80 : 0xef4444);
      if (iFrames || parrying) flashMat.opacity = Math.max(flashMat.opacity, 0.45);
      knight.skin.color.setHex(
        e.pStun > 0 ? 0x8d93a0 : iFrames ? 0x7ee6a0 : parrying ? 0x8fd8ff : SKIN.knight
      );

      if (shockR > 0) {
        shock.position.set(e.bx, 0.05, e.bz);
        shock.scale.setScalar(shockR);
        shockMat.color.setHex(mv && mv.unblockable ? 0xa855f7 : 0xff7a3c);
        shockMat.opacity = 0.7;
      } else {
        shockMat.opacity = Math.max(0, shockMat.opacity - dt * 2.2);
        shock.scale.multiplyScalar(1 + dt * 1.4);
      }

      arena.tick(now / 1000, dt);

      // ---- camera --------------------------------------------------------
      const bk = new THREE.Vector3(e.px - e.bx, 0, e.pz - e.bz);
      if (bk.lengthSq() < 1e-6) bk.set(0, 0, 1);
      bk.normalize();
      const want = new THREE.Vector3(e.px, 0, e.pz).add(bk.multiplyScalar(6.4 + 0.62 * e.d));
      want.y = 4.3 + 0.32 * e.d;
      camPos.lerp(want, 1 - Math.pow(0.0018, dt));
      camera.position.copy(camPos);
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        shake = Math.max(0, shake - dt * 1.6);
      }
      camAim.lerp(new THREE.Vector3((e.px + e.bx) / 2, 1.5, (e.pz + e.bz) / 2), 1 - Math.pow(0.002, dt));
      camera.lookAt(camAim);
      renderer.render(scene, camera);

      // ---- HUD -----------------------------------------------------------
      ghostP += (e.php - ghostP) * Math.min(1, dt * 2.2);
      ghostB += (e.bhp - ghostB) * Math.min(1, dt * 2.2);
      if (hp.current) hp.current.style.width = pct(e.php, P_HP_MAX);
      if (hpGhost.current) hpGhost.current.style.width = pct(ghostP, P_HP_MAX);
      if (hpNum.current) hpNum.current.textContent = `${Math.max(0, Math.ceil(e.php))}`;
      if (st.current) st.current.style.width = pct(e.pst, P_ST_MAX);
      if (bhp.current) bhp.current.style.width = pct(e.bhp, B_HP_MAX);
      if (bhpGhost.current) bhpGhost.current.style.width = pct(ghostB, B_HP_MAX);
      if (poise.current) poise.current.style.width = pct(e.bPoise, B_POISE_MAX);
      if (stagWrap.current) stagWrap.current.style.opacity = e.bStagger > 0 ? "1" : "0";
      if (stag.current) stag.current.style.width = pct(e.bStagger, STAGGER);
      if (ripWrap.current) ripWrap.current.style.opacity = e.bStagger > 0 ? "1" : "0.25";
      if (rip.current) rip.current.style.width = pct(e.bStagger, STAGGER);
      if (clockTxt.current) clockTxt.current.textContent = `${(e.t / FPS).toFixed(1)}s`;
      if (geoTxt.current) {
        geoTxt.current.textContent =
          `${e.d.toFixed(2)} away · ${((Math.abs(e.offAxis()) * 180) / Math.PI).toFixed(0)}° off centre`;
      }
      const k = framesToActive(e);
      if (tellTxt.current) {
        tellTxt.current.textContent = k === null ? "—" : `${k}`;
        tellTxt.current.style.color = k !== null && k <= 4 ? "#ef4444" : "var(--ink)";
      }
      if (bossPhase.current) {
        bossPhase.current.textContent = e.bStagger > 0 ? "staggered"
          : mv ? `${mv.name} · ${{ w: "windup", d: "DELAY", h: "ACTIVE", r: "recovery" }[phaseAt(mv, e.bf)[0]]}`
          : "waiting";
      }

      // ---- the parry window ---------------------------------------------
      // Live is what the CURRENT parry got; next is what the NEXT press would get. They differ
      // exactly when you have been pressing it too often, which is the whole mechanic.
      // The pips always mean "what you get if you press NOW", which is what the caption says too.
      // Showing the in-flight parry's own window here instead made the two disagree during the
      // sixteen frames of recovery, which is exactly when a reader is looking at them.
      const nextWin = windowIfPressedNow(e);
      for (let i = 0; i < pips.length; i++) {
        pips[i].className = "dv-pip"
          + (parrying && i < e.parryWin ? " live" : i < nextWin ? " on" : "");
      }
      if (pwHeat.current) pwHeat.current.style.width = pct(e.parryHeat, PARRY_HEAT);
      if (pwNote.current) {
        pwNote.current.textContent =
          e.parryHeat === 0 ? `fresh — ${PARRY_WIN} frames, ${Math.round((1000 * PARRY_WIN) / 30)}ms`
          : nextWin === 0 ? "worn to nothing — wait for it to clear"
          : `${nextWin} frame${nextWin === 1 ? "" : "s"} if you press now · ${e.parryHeat} to clear`;
        pwNote.current.style.color = nextWin === 0 ? "#ef4444" : nextWin < PARRY_WIN ? "#fb923c" : "var(--muted)";
      }

      // ---- strip ---------------------------------------------------------
      for (let i = 0; i < stripCells.length; i++) {
        const c = hist[hist.length - stripCells.length + i];
        stripCells[i].className = "dv-cell" + (c && c !== "-" ? ` k-${c}` : "");
      }

      if (toastT > 0) {
        toastT -= dt;
        if (toast.current) toast.current.style.opacity = `${Math.min(1, toastT / 0.35)}`;
      }
    };
    raf = requestAnimationFrame(frame);

    const size = () => {
      const w = el.clientWidth;
      const h = Math.round(w / (16 / 9));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      el.style.height = `${h}px`;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const KEYS: Record<string, keyof Held> = { w: "w", a: "a", s: "s", d: "d" };
    const onDown = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (KEYS[k]) { B.held[KEYS[k]] = true; ev.preventDefault(); }
      else if (k === "shift") B.held.guard = true;
      else if (k === "j") B.queued = A_ATK;
      else if (k === "l") B.queued = A_HEAVY;
      else if (k === "k") B.queued = A_PARRY;
      else if (k === " ") { B.queued = A_ROLL0 + 2; ev.preventDefault(); }
    };
    const onUp = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (KEYS[k]) B.held[KEYS[k]] = false;
      else if (k === "shift") B.held.guard = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      ro.disconnect();
      arena.dispose();
      disposeFighters();
      arcGeos.forEach((g) => g.dispose());
      [blobGeo, reachGeo, shockGeo].forEach((g) => g.dispose());
      [blobMat, arcMat, reachMat, flashMat, shockMat].forEach((m) => m.dispose());
      blobTex.dispose();
      env.dispose();
      renderer.dispose();
      el.replaceChildren();
    };
  }, []);

  const tap = (a: number) => { box.current.queued = a; };

  return (
    <div style={wrap}>
      <style>{CSS}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={head}>The arena, rebound</span>
        <span style={mono}>
          {MOVES.length} moves · a {PARRY_WIN}-frame parry that wears out · an {ARENA}m ring
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => restart(PLAY)} style={{ ...btn, ...(mode === PLAY ? on : {}) }}>{PLAY}</button>
        <button onClick={() => restart(AGENT)} style={{ ...btn, ...(mode === AGENT ? on : {}) }}>
          watch: {AGENT}
          {mode === AGENT && netState === "loading" ? " …" : ""}
        </button>
        {WATCHERS.map((w) => (
          <button key={w} onClick={() => restart(w)} style={{ ...btn, ...(mode === w ? on : {}) }}>watch: {w}</button>
        ))}
      </div>

      {mode === AGENT && (
        <div className="dv-agent">
          {netState === "error" ? (
            <div style={{ ...mono, color: "#ef4444" }}>
              could not load the weights — the arena still runs, the net does not
            </div>
          ) : netState !== "ready" ? (
            <div style={{ ...mono, color: "var(--faint)" }}>fetching 320 KB of float32…</div>
          ) : (
            <>
              <div className="dv-prow">
                <span style={head}>what it is choosing</span>
                <span style={mono}>
                  <span ref={agPick} style={{ color: "var(--fg)" }}>—</span>
                  <span style={{ color: "var(--faint)" }}> over </span>
                  <span ref={agVs}>—</span>
                  <span style={{ color: "var(--faint)" }}> by </span>
                  <span ref={agNum}>0.000</span>
                  <span> · </span>
                  <span ref={agTag}>—</span>
                </span>
              </div>
              <div className="dv-heatwrap"><div className="dv-heat" ref={agBar} /></div>
              <div className="dv-qbars" ref={agBars} />
              <div style={{ ...mono, color: "var(--faint)", marginTop: 6 }}>
                One row per button, always in the same order. A row is full when that button ties
                the leader and empty when it is {DECIDED} of Q behind — a fixed scale, not this
                frame&rsquo;s own range. Watch the bars separate during a windup and collapse back
                together during recovery: measured over 28,877 decisions, the median choice is won
                by just {TIE.toFixed(2)}, but during a windup the top tenth are won by 0.37.
              </div>
            </>
          )}
        </div>
      )}

      {/* The parry panel. This is the one instrument v1's arena had no need of. */}
      <div className="dv-parry">
        <div className="dv-prow">
          <span style={head}>parry window</span>
          <span style={mono} ref={pwNote}>
            fresh — {PARRY_WIN} frames, {Math.round((1000 * PARRY_WIN) / 30)}ms
          </span>
        </div>
        <div className="dv-pgrid">
          <div className="dv-pips" ref={pwPips} />
          <div className="dv-heatwrap">
            <div className="dv-heat" ref={pwHeat} />
          </div>
        </div>
        <div style={{ ...mono, color: "var(--faint)", marginTop: 4 }}>
          one pip per frame the parry can catch. Every press inside {PARRY_HEAT} frames of the last
          one costs {PARRY_STEP} pips — the bar is how long until it clears. A parry that lands
          clears it at once.
        </div>
      </div>

      <div className="dv-stage">
        <div ref={mount} className="dv-mount" />
        <div className="dv-vig" />

        <div className="dv-plate">
          <div className="dv-row">
            <span className="dv-cap">health</span>
            <span className="dv-num" ref={hpNum}>100</span>
          </div>
          <div className="dv-bar big">
            <div className="dv-ghost" ref={hpGhost} />
            <div className="dv-fill hp" ref={hp} />
          </div>

          <div className="dv-rip" ref={ripWrap}>
            <div className="dv-row">
              <span className="dv-cap">riposte window</span>
              <span className="dv-cap gold">×{RIPOSTE_MULT.toFixed(0)}</span>
            </div>
            <div className="dv-bar"><div className="dv-fill rip" ref={rip} /></div>
          </div>

          <div>
            <div className="dv-row"><span className="dv-cap">stamina</span></div>
            <div className="dv-bar">
              <div className="dv-fill st" ref={st} />
              {[PARRY_COST, ATK_COST, ROLL_COST, ATK2_COST].map((c) => (
                <div key={c} className="dv-tick" style={{ left: `${c}%` }} title={`${c}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="dv-read">
          <div className="dv-clock" ref={clockTxt}>0.0s</div>
          <div className="dv-geo" ref={geoTxt} />
          <div className="dv-tellwrap">
            <div className="dv-tell" ref={tellTxt} />
            <div className="dv-telllbl">frames until it can hurt you</div>
          </div>
        </div>

        <div className="dv-warn" ref={warn}>UNBLOCKABLE — LEAVE</div>
        <div className="dv-toast" ref={toast} />
        <div className="dv-end" ref={endTxt} />

        <div className="dv-boss">
          <div className="dv-bossname">The Warden of the Ring</div>
          <div className="dv-bar boss">
            <div className="dv-ghost" ref={bhpGhost} />
            <div className="dv-fill bhp" ref={bhp} />
          </div>
          <div className="dv-poiserow">
            <span className="dv-cap">poise</span>
            <div className="dv-bar thin grow">
              <div className="dv-fill poi" ref={poise} />
              <div className="dv-tick" style={{ left: "50%" }} />
            </div>
            <span className="dv-cap">2 light · 1 heavy</span>
          </div>
          <div className="dv-stag" ref={stagWrap}>
            <div className="dv-bar thin"><div className="dv-fill stag" ref={stag} /></div>
            <div className="dv-staglbl">staggered — your next hit is a riposte</div>
          </div>
          <div className="dv-phase" ref={bossPhase} />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div ref={strip} className="dv-strip" />
        <div style={{ ...mono, marginTop: 3, color: "var(--faint)" }}>
          the last three seconds of the boss — <span style={{ color: "#e8b84b" }}>windup</span>,{" "}
          <span style={{ color: "#fb923c" }}>delay</span> (identical to look at),{" "}
          <span style={{ color: "#ef4444" }}>the frames that can hurt you</span>, recovery
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={() => (over ? restart() : setRunning(!running))} style={{ ...btn, minWidth: 92 }}>
          {over ? "new duel" : running ? "pause" : "fight"}
        </button>
        <select value={speed} onChange={(ev) => setSpeed(Number(ev.target.value))} style={{ ...btn, padding: "5px 8px" }} aria-label="speed">
          <option value={1}>real time (30 fps)</option>
          <option value={0.5}>half speed</option>
          <option value={0.25}>quarter speed</option>
        </select>
        <span style={{ ...mono, color: "var(--faint)" }}>
          W A S D move · J light · L heavy · K parry · Shift guard · Space roll
        </span>
      </div>

      {mode === PLAY && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button style={btn} onClick={() => tap(A_ATK)}>light</button>
          <button style={btn} onClick={() => tap(A_HEAVY)}>heavy</button>
          <button style={btn} onClick={() => tap(A_PARRY)}>parry</button>
          <button style={btn} onClick={() => tap(A_ROLL0 + 3)}>roll right</button>
          <button style={btn} onClick={() => tap(A_ROLL0 + 1)}>roll left</button>
          <button style={btn} onClick={() => tap(A_ROLL0 + 2)}>roll back</button>
        </div>
      )}

      {(over || tally.duels > 0) && (
        <div style={{ ...mono, marginTop: 8, color: "var(--faint)" }}>
          {tally.duels} duels · {tally.wins} won · {tally.deaths} died · {tally.clock} ran out
          {over && ` — last: ${counts.parries} parries landed, ${counts.mashes} presses too soon, ${counts.dead} with no window left, ${counts.poiseBreaks} poise breaks`}
        </div>
      )}
    </div>
  );
}

const CSS = `
.dv-stage { position: relative; border-radius: 12px; overflow: hidden; background: #0e1015; }
.dv-mount { width: 100%; }
.dv-vig { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.55) 100%); }
.dv-plate { position: absolute; left: 14px; top: 12px; width: min(42%, 260px); pointer-events: none; }
.dv-row { display: flex; justify-content: space-between; align-items: baseline; }
.dv-cap { font: 10px ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(226,232,240,0.62); }
.dv-cap.gold { color: #e2c07a; }
.dv-num { font: 600 15px var(--font-display, serif); color: #fff; }
.dv-bar { position: relative; height: 7px; border-radius: 3px; background: rgba(10,12,16,0.72);
  border: 1px solid rgba(255,255,255,0.1); overflow: hidden; margin: 2px 0 7px; }
.dv-bar.big { height: 11px; }
.dv-bar.thin { height: 5px; }
.dv-bar.grow { flex: 1; margin: 0 6px; }
.dv-fill { position: absolute; inset: 0 auto 0 0; border-radius: 2px; }
.dv-ghost { position: absolute; inset: 0 auto 0 0; background: rgba(255,255,255,0.28); }
.dv-fill.hp { background: linear-gradient(90deg, #b91c1c, #ef4444); }
.dv-fill.st { background: linear-gradient(90deg, #15803d, #4ade80); }
.dv-fill.rip { background: linear-gradient(90deg, #a16207, #e2c07a); }
.dv-fill.bhp { background: linear-gradient(90deg, #7f1d1d, #dc2626); }
.dv-fill.poi { background: rgba(226,192,122,0.85); }
.dv-fill.stag { background: #e2c07a; }
.dv-tick { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.3); }
.dv-rip { transition: opacity 0.18s; }
.dv-read { position: absolute; right: 14px; top: 12px; text-align: right; pointer-events: none; }
.dv-clock { font: 600 17px var(--font-display, serif); color: #fff; }
.dv-geo { font: 10.5px ui-monospace, monospace; color: rgba(226,232,240,0.66); margin-top: 2px; }
.dv-tellwrap { margin-top: 10px; }
.dv-tell { font: 600 24px var(--font-display, serif); color: #fff; line-height: 1; }
.dv-telllbl { font: 9.5px ui-monospace, monospace; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(226,232,240,0.5); max-width: 110px; margin-left: auto; }
.dv-boss { position: absolute; left: 50%; transform: translateX(-50%); bottom: 12px;
  width: min(62%, 420px); pointer-events: none; text-align: center; }
.dv-bossname { font: 10.5px ui-monospace, monospace; letter-spacing: 0.22em; text-transform: uppercase;
  color: #e2c07a; margin-bottom: 4px; }
.dv-poiserow { display: flex; align-items: center; }
.dv-stag { transition: opacity 0.18s; }
.dv-staglbl { font: 9.5px ui-monospace, monospace; color: #e2c07a; letter-spacing: 0.06em; }
.dv-phase { font: 10.5px ui-monospace, monospace; color: rgba(226,232,240,0.7); margin-top: 3px; }
.dv-toast { position: absolute; left: 50%; top: 34%; transform: translateX(-50%);
  font: 600 22px var(--font-display, serif); letter-spacing: 0.06em;
  opacity: 0; pointer-events: none; text-shadow: 0 2px 10px rgba(0,0,0,0.9); }
.dv-warn { position: absolute; left: 50%; top: 20%; transform: translateX(-50%);
  font: 600 13px ui-monospace, monospace; letter-spacing: 0.24em; color: #d8b4fe;
  opacity: 0; transition: opacity 0.1s; pointer-events: none;
  text-shadow: 0 2px 14px rgba(0,0,0,0.95); }
.dv-end { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0;
  font: 600 40px var(--font-display, serif); letter-spacing: 0.12em;
  color: #e2c07a; text-shadow: 0 3px 22px rgba(0,0,0,0.95); pointer-events: none;
  transition: opacity 0.3s; }
.dv-strip { display: grid; grid-template-columns: repeat(90, 1fr); gap: 1px; height: 13px; }
.dv-cell { background: rgba(127,127,127,0.13); border-radius: 1px; }
.dv-cell.k-w { background: #e8b84b; }
.dv-cell.k-d { background: #fb923c; }
.dv-cell.k-h { background: #ef4444; }
.dv-cell.k-r { background: rgba(127,127,127,0.34); }
.dv-cell.k-s { background: rgba(226,192,122,0.5); }

.dv-parry { border: 1px solid var(--border); border-radius: 10px; padding: 9px 11px; margin-bottom: 9px; }
.dv-prow { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.dv-pgrid { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.dv-pips { display: flex; gap: 4px; }
.dv-pip { width: 26px; height: 10px; border-radius: 2px; background: rgba(127,127,127,0.18);
  border: 1px solid rgba(127,127,127,0.25); transition: background 0.08s; }
.dv-pip.on { background: rgba(125,170,235,0.75); border-color: rgba(125,170,235,0.9); }
.dv-pip.live { background: #4ade80; border-color: #4ade80; }
.dv-heatwrap { position: relative; flex: 1; height: 5px; border-radius: 3px;
  background: rgba(127,127,127,0.14); overflow: hidden; }
.dv-heat { position: absolute; inset: 0 auto 0 0; width: 0%; background: #fb923c; }
.dv-agent { border: 1px solid var(--border); border-radius: 10px; padding: 9px 11px; margin-bottom: 9px; }
.dv-qbars { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 14px; margin-top: 8px; }
@media (max-width: 620px) { .dv-qbars { grid-template-columns: 1fr; } }
.dv-qrow { display: grid; grid-template-columns: 88px 1fr; align-items: center; gap: 7px; }
.dv-qname { font-size: 10.5px; font-family: ui-monospace, monospace; color: var(--faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv-qtrack { position: relative; height: 6px; border-radius: 3px;
  background: rgba(127,127,127,0.12); overflow: hidden; }
.dv-qfill { position: absolute; inset: 0 auto 0 0; width: 0%; background: var(--faint);
  transition: width 0.06s linear; }
`;

const wrap: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, margin: "1.2rem 0 1.6rem" };
const head: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, color: "var(--ink)" };
const mono: React.CSSProperties = { fontSize: 11.5, fontFamily: "ui-monospace, monospace", color: "var(--muted)" };
const btn: React.CSSProperties = { borderWidth: 1, borderStyle: "solid", borderColor: "var(--border)", borderRadius: 7, cursor: "pointer", padding: "5px 11px", fontSize: 12.5, color: "var(--muted)", background: "transparent", fontFamily: "var(--font-sans, sans-serif)" };
const on: React.CSSProperties = { borderColor: "var(--c-rl)", background: "color-mix(in srgb, var(--c-rl) 14%, transparent)", color: "var(--ink)" };
