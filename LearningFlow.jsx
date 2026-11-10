import React, { useEffect } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./LearningFlow.css";

export default function LearningFlow() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Three.js + GSAP animation after the React DOM is mounted.
gsap.registerPlugin(ScrollTrigger);

/* ---------- step content ---------- */
const STEPS = [
  { tag: 'Profile & Planner', k: 'Profile complete', num: 100, fmt: n => n + '%',        pct: 100 },
  { tag: 'Baseline',          k: 'Baseline score',   num: 62,  fmt: n => n + ' / 100',  pct: 62  },
  { tag: 'Learning Plan',     k: 'Modules planned',  num: 12,  fmt: n => n + ' modules',pct: 70  },
  { tag: 'Post-Assessment',   k: 'Improvement',      num: 18,  fmt: n => '+' + n + ' pts', pct: 88 },
  { tag: 'ESG-score',         k: 'ESG score',        num: 74,  fmt: n => n + ' / 100',  pct: 74  },
  { tag: 'Certificate',       k: 'Status',           num: 100, fmt: () => 'Issued',     pct: 100 }
];

/* ---------- palette & helpers ---------- */
const C = { bg: 0xf4faf7, ink: 0x0a4d40, deep: 0x0f6b5a, mid: 0x1f9c7e, soft: 0xbfe6da, sage: 0xa7cfc3, paper: 0xffffff };
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rand = mulberry32(11);
const clamp01 = x => Math.max(0, Math.min(1, x));
const E = {
  out:   gsap.parseEase('power3.out'),
  back:  gsap.parseEase('back.out(1.8)'),
  bounce:gsap.parseEase('bounce.out'),
  io:    gsap.parseEase('power2.inOut')
};

/* ---------- viewport, renderer, camera ---------- */
const viewport = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(C.bg, 1);
viewport.insertBefore(renderer.domElement, viewport.firstChild);

const scene = new THREE.Scene();
const FRUSTUM = 9.5;
let camera;
function vpSize(){ return { w: viewport.clientWidth, h: viewport.clientHeight }; }
function makeCamera(){
  const { w, h } = vpSize();
  const a = w / h;
  const halfH = a >= 1 ? FRUSTUM/2 : FRUSTUM/(2*a);
  const halfW = halfH * a;
  camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -100, 100);
  camera.position.set(12, 12, 12);
  camera.lookAt(0, 1.0, 0);
  camera.updateProjectionMatrix();
}
function sizeRenderer(){ const { w, h } = vpSize(); renderer.setSize(w, h); makeCamera(); }
sizeRenderer();

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.55);
sun.position.set(-4, 10, 6);
scene.add(sun);

/* ---------- materials ---------- */
const matInk   = new THREE.MeshLambertMaterial({ color: C.ink });
const matPaper = new THREE.MeshLambertMaterial({ color: C.paper });
const matSage  = new THREE.MeshLambertMaterial({ color: C.sage });
const matMid   = new THREE.MeshLambertMaterial({ color: C.mid });
const matDeep  = new THREE.MeshLambertMaterial({ color: C.deep });
const matSoft  = new THREE.MeshLambertMaterial({ color: C.soft });
const matGlow  = new THREE.MeshBasicMaterial({ color: C.mid, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
const matRing  = new THREE.MeshBasicMaterial({ color: C.mid, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false });
const edgeMat  = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.85 });
function outlined(mesh){ mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat)); return mesh; }

/* ---------- base layers ---------- */
function slab(size, thick){ return outlined(new THREE.Mesh(new THREE.BoxGeometry(size, thick, size), matPaper)); }

function voxelGrid(n, cell, gap, heightFn, baseY, decals){
  const group = new THREE.Group(); const tiles = [];
  const step = cell + gap; const off = (n-1)*step/2;
  for (let i=0;i<n;i++) for (let j=0;j<n;j++){
    const h = heightFn(i,j); if (h<=0) continue;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(cell,h,cell), matInk.clone());
    tile.position.set(i*step-off, baseY+h/2, j*step-off);
    tile.userData = { i, j, baseY: tile.position.y };
    outlined(tile);
    if (decals && rand() < 0.35){
      const d = new THREE.Mesh(new THREE.PlaneGeometry(cell*0.34, cell*0.34), matPaper);
      d.rotation.x = -Math.PI/2; d.position.y = h/2 + 0.01; tile.add(d);
    }
    group.add(tile); tiles.push(tile);
  }
  return { group, tiles };
}

/* ---------- step props (each has its own animated parts) ---------- */

// 1. Profile & Planner: person with a profile card and orbiting dots
function person(){
  const g = new THREE.Group();
  const torso = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.22,0.42,18), matSage)); torso.position.y = 0.3;
  const head  = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.15,18,14), matSage)); head.position.y = 0.66;
  const card  = outlined(new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.34), matPaper));
  card.position.set(0.55, 0.78, 0.2); card.rotation.y = -0.4; card.scale.set(0.001,0.001,0.001);
  const cardBar = new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.06), matMid); cardBar.position.set(0,-0.05,0.01); card.add(cardBar);
  const orbit = new THREE.Group(); orbit.position.y = 0.55;
  const orbs = [0,1,2].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06,12,10), matMid); orbit.add(s); return s; });
  g.add(torso, head, card, orbit);
  g.userData = { card, orbit, orbs };
  return g;
}

// 2. Baseline: three bars that grow from zero
const BAR_H = [0.3, 0.62, 0.45];
function bars(){
  const g = new THREE.Group(); const list = [];
  [-0.24, 0, 0.24].forEach((x, i) => {
    const m = i === 1 ? matInk : (i === 0 ? matPaper : matSage);
    const b = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.17,1,0.17), m));
    b.position.set(x, 0, 0); b.scale.y = 0.001; g.add(b); list.push(b);
  });
  g.userData = { bars: list };
  return g;
}

// 3. Learning Plan: books that drop in and stack
const BOOK_Y = [0.06, 0.18, 0.30], BOOK_R = [0.2, -0.15, 0.1];
function books(){
  const g = new THREE.Group(); const list = [];
  [matPaper, matSage, matInk].forEach((m, i) => {
    const b = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.55,0.12,0.4), m));
    b.position.y = BOOK_Y[i]; b.rotation.y = BOOK_R[i];
    g.add(b); list.push(b);
  });
  g.userData = { books: list };
  return g;
}

// 4. Post-Assessment: target with a dart and ripples
function target(){
  const g = new THREE.Group();
  const stand = outlined(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.4,8), matInk)); stand.position.y = 0.2;
  const ring  = outlined(new THREE.Mesh(new THREE.TorusGeometry(0.32,0.06,12,40), matPaper)); ring.position.y = 0.55;
  const bull  = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.04,24), matMid); bull.rotation.x = Math.PI/2; bull.position.set(0,0.55,0.02);
  const dart  = new THREE.Mesh(new THREE.SphereGeometry(0.05,12,10), matDeep);
  g.add(stand, ring, bull, dart);
  g.userData = { dart };
  return g;
}

// 5. ESG-score: spinning globe with orbit ring
function globe(){
  const g = new THREE.Group();
  const ball = outlined(new THREE.Mesh(new THREE.SphereGeometry(0.36,24,18), matSage)); ball.position.y = 0.55;
  const ring = outlined(new THREE.Mesh(new THREE.TorusGeometry(0.5,0.02,8,48), matInk));
  ring.position.y = 0.55; ring.rotation.x = Math.PI/2.3;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05,10,8), matMid);
  dot.position.set(0.5, 0.55, 0);
  g.add(ball, ring, dot);
  g.userData = { ball, ring, dot };
  return g;
}

// 6. Certificate: sheet that flips in, with a seal
function certificate(){
  const g = new THREE.Group();
  const sheet = outlined(new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.55), matPaper)); sheet.position.set(0,0.6,0);
  const seal  = new THREE.Mesh(new THREE.CircleGeometry(0.1,24), matMid); seal.position.set(0.2,0.5,0.01);
  const rib1  = new THREE.Mesh(new THREE.PlaneGeometry(0.1,0.24), matDeep); rib1.position.set(0.16,0.2,0);
  const rib2  = rib1.clone(); rib2.position.set(0.24,0.2,0);
  g.add(sheet, seal, rib1, rib2);
  g.userData = { sheet, seal };
  return g;
}

const PROP_MAKERS = [person, bars, books, target, globe, certificate];

/* ---------- layers ---------- */
const layers = { top: new THREE.Group(), mid: new THREE.Group(), bot: new THREE.Group() };
const rig = new THREE.Group();
rig.add(layers.top, layers.mid, layers.bot);
scene.add(rig);

const REST    = { top: 2.7, mid: 1.35, bot: 0 };
const EXPLODE = { top: 6.2, mid: 3.3, bot: -1.4 };

// Top: 5x5 voxel grid
layers.top.add(slab(6.0, 0.14));
const topGrid = voxelGrid(5, 0.82, 0.1, () => 0.32, 0.07, false);
layers.top.add(topGrid.group);

// Middle: slab with six props
layers.mid.add(slab(6.6, 0.14));
const PROP_POS = [[-2.1,-0.9],[0,-0.9],[2.1,-0.9],[-2.1,0.9],[0,0.9],[2.1,0.9]];
const props = PROP_MAKERS.map((make, i) => {
  const g = new THREE.Group();
  const plinth = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.75,0.14,0.75), matInk));
  plinth.position.y = 0.07;
  const icon = make();
  g.add(plinth, icon);
  g.userData.icon = icon;
  g.position.set(PROP_POS[i][0], 0.07, PROP_POS[i][1]);
  g.scale.set(0.0001,0.0001,0.0001);
  layers.mid.add(g);
  return g;
});

// Glow ring under the active plinth (follows the active step)
const glow = new THREE.Mesh(new THREE.RingGeometry(0.42,0.5,48), matGlow);
glow.rotation.x = -Math.PI/2; layers.mid.add(glow);

// Target ripples on the plinth
const ripples = [0,1,2].map(() => {
  const r = new THREE.Mesh(new THREE.RingGeometry(0.2,0.24,40), matRing.clone());
  r.rotation.x = -Math.PI/2; layers.mid.add(r); return r;
});

// Certificate burst ring
const burstRing = new THREE.Mesh(new THREE.RingGeometry(0.1,0.13,48), matRing.clone());
burstRing.rotation.x = -Math.PI/2; layers.mid.add(burstRing);

// Bottom: 7x7 voxel field + ghost plates
layers.bot.add(slab(7.6, 0.14));
[-0.26,-0.52].forEach((y,k) => {
  const ghost = outlined(new THREE.Mesh(new THREE.BoxGeometry(7.2-k*0.5,0.12,7.2-k*0.5), matPaper));
  ghost.position.y = y; layers.bot.add(ghost);
});
const botGrid = voxelGrid(7, 0.76, 0.1, () => { const r = rand(); return r < 0.22 ? 0 : r < 0.6 ? 0.2 : 0.4; }, 0.07, true);
layers.bot.add(botGrid.group);

// Baseline scan beam (sweeps across the bottom grid)
const beam = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.22), matRing.clone());
beam.rotation.x = -Math.PI/2; beam.position.y = 0.95; beam.visible = false;
layers.bot.add(beam);

// Confetti pieces for the certificate step
const CONF_COLORS = [C.mid, C.deep, C.soft, C.paper, 0x7fd3b8];
const confetti = [];
for (let i = 0; i < 60; i++){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09,0.05), new THREE.MeshBasicMaterial({ color: CONF_COLORS[i % CONF_COLORS.length], side: THREE.DoubleSide }));
  m.userData = { vx: (rand()-0.5)*2.4, vy: 1.2 + rand()*2.2, vz: (rand()-0.5)*2.4, spin: (rand()-0.5)*10 };
  m.visible = false; scene.add(m); confetti.push(m);
}

// Ambient floating particles across the viewport
const AMB_N = 140;
const ambPos = new Float32Array(AMB_N * 3);
for (let i = 0; i < AMB_N; i++){
  ambPos[i*3] = rand()*16 - 8; ambPos[i*3+1] = rand()*10 - 3; ambPos[i*3+2] = rand()*16 - 8;
}
const ambGeo = new THREE.BufferGeometry();
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
const ambient = new THREE.Points(ambGeo, new THREE.PointsMaterial({ color: C.mid, size: 0.07, transparent: true, opacity: 0.5, depthWrite: false }));
scene.add(ambient);

// Start exploded
layers.top.position.y = EXPLODE.top;
layers.mid.position.y = EXPLODE.mid;
layers.bot.position.y = EXPLODE.bot;

/* ---------- overlays ---------- */
const aTag   = document.getElementById('aTag');
const aCard  = document.getElementById('aCard');
const tagEl  = aTag.querySelector('.tag');
const cardEl = aCard.querySelector('.card');
const cardK  = cardEl.querySelector('.k');
const cardV  = cardEl.querySelector('.v');
const cardBar= cardEl.querySelector('.bar i');
gsap.set([tagEl, cardEl], { xPercent: -50, yPercent: -50 });

const stepEls = [...document.querySelectorAll('.step')];
const rail    = document.querySelector('.rail i');

let activeIdx = -1;
const counter = { n: 0 };
const tmp = new THREE.Vector3();

function placeOver(anchorEl, obj, off){
  const { w, h } = vpSize();
  obj.getWorldPosition(tmp); tmp.add(off).project(camera);
  anchorEl.style.transform = `translate(${(tmp.x*0.5+0.5)*w}px, ${(-tmp.y*0.5+0.5)*h}px)`;
}

function setActive(idx){
  if (idx === activeIdx) return;
  activeIdx = idx;
  stepEls.forEach((el, i) => el.classList.toggle('active', i === idx));
  const num = stepEls[idx].querySelector('.n');
  num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
  rail.style.height = (idx / (STEPS.length - 1)) * 100 + '%';

  const s = STEPS[idx];
  tagEl.textContent = s.tag;
  cardK.textContent = s.k;
  gsap.killTweensOf(counter);
  gsap.to(counter, { n: s.num, duration: 1, ease: 'power2.out',
    onUpdate: () => { cardV.textContent = s.fmt(Math.round(counter.n)); } });
  gsap.killTweensOf(cardBar);
  gsap.to(cardBar, { width: s.pct + '%', duration: 0.9, ease: 'power2.out' });
}

/* ---------- main scroll timeline (layout & shared motion) ---------- */
const INTRO = 0.6, STEP = 1.0, OUTRO = 0.6;
const TOTAL = INTRO + STEPS.length * STEP + OUTRO;

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroller', start: 'top top', end: 'bottom bottom', scrub: 1,
    onUpdate: self => {
      const t = self.progress * TOTAL;
      setActive(Math.max(0, Math.min(STEPS.length-1, Math.floor((t - INTRO) / STEP))));
    }
  }
});

// Intro: stack drops into place, props pop in
tl.fromTo(layers.top.position, { y: EXPLODE.top }, { y: REST.top, duration: INTRO, ease: 'power3.out' }, 0);
tl.fromTo(layers.mid.position, { y: EXPLODE.mid }, { y: REST.mid, duration: INTRO, ease: 'power3.out' }, 0.05);
tl.fromTo(layers.bot.position, { y: EXPLODE.bot }, { y: REST.bot, duration: INTRO, ease: 'power3.out' }, 0.1);
tl.to(props.map(p => p.scale), { x: 0.8, y: 0.8, z: 0.8, duration: 0.4, ease: 'back.out(2)', stagger: 0.04 }, INTRO * 0.5);

// Each step: its prop rises, others sink, top column lights, layers pulse, camera turns
STEPS.forEach((_, k) => {
  const t0 = INTRO + k * STEP;
  const litCol = Math.min(k, 4);

  props.forEach((p, i) => {
    const active = i === k;
    tl.to(p.position, { y: active ? 0.97 : 0.07, duration: 0.45, ease: 'power3.out' }, t0);
    const s = active ? 1.15 : 0.8;
    tl.to(p.scale, { x: s, y: s, z: s, duration: 0.45, ease: 'power3.out' }, t0);
  });

  topGrid.tiles.forEach(t => {
    const lit = t.userData.i === litCol;
    tl.to(t.position, { y: t.userData.baseY + (lit ? 0.3 : 0), duration: 0.4, ease: 'sine.inOut' }, t0);
    const c = lit ? 0.72 : 0.04;
    tl.to(t.material.color, { r: lit ? 0.12 : 0.04, g: lit ? 0.61 : 0.3, b: lit ? 0.5 : 0.25, duration: 0.4 }, t0);
  });

  tl.to(layers.top.position, { y: REST.top + 0.3, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t0);
  tl.to(layers.mid.position, { y: REST.mid + 0.12, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t0 + 0.1);

  tl.to(tagEl,  { opacity: 1, duration: 0.3 }, t0 + 0.1);
  tl.to(cardEl, { opacity: 1, duration: 0.3 }, t0 + 0.2);
  tl.to(tagEl,  { opacity: 0, duration: 0.25 }, t0 + STEP - 0.25);
  tl.to(cardEl, { opacity: 0, duration: 0.25 }, t0 + STEP - 0.25);

  tl.to(rig.rotation, { y: (k - 2.5) * 0.08, duration: STEP, ease: 'sine.inOut' }, t0);
});

// Outro: props settle up together, layers separate
const tOut = INTRO + STEPS.length * STEP;
tl.to(props.map(p => p.position), { y: 0.57, duration: OUTRO, ease: 'power2.inOut' }, tOut);
tl.to(props.map(p => p.scale), { x: 1, y: 1, z: 1, duration: OUTRO, ease: 'power2.inOut' }, tOut);
tl.to(layers.top.position, { y: REST.top + 0.5, duration: OUTRO, ease: 'power2.out' }, tOut);
tl.to(layers.mid.position, { y: REST.mid + 0.15, duration: OUTRO, ease: 'power2.out' }, tOut);
tl.to(cardEl, { opacity: 0, duration: 0.2 }, tOut);
tl.to(tagEl,  { opacity: 0, duration: 0.2 }, tOut);

/* ---------- step-specific effects (driven by the scroll timeline time) ---------- */
// Returns 0..1 progress inside the current step, or 1 when the step is not active.
// Used so every step's effect settles into its end state outside its own segment.
function applyStepFx(k, L, now){
  const pe = kk => (k === kk ? L : 1);

  // Ambient particles drift upward and wrap
  const pos = ambGeo.attributes.position.array;
  for (let i = 0; i < AMB_N; i++){
    pos[i*3+1] += 0.004 + (i % 5) * 0.001;
    if (pos[i*3+1] > 7) pos[i*3+1] = -3;
  }
  ambGeo.attributes.position.needsUpdate = true;
  ambient.rotation.y = now * 0.02;

  // Active plinth glow
  const pp = PROP_POS[Math.max(0, activeIdx)];
  glow.position.set(pp[0], 0.17, pp[1]);
  glow.scale.setScalar(1 + 0.06 * Math.sin(now * 3));

  // 1. Profile & Planner: card pops, dots orbit the person
  const person = props[0].userData.icon;
  const pc = person.userData;
  pc.card.scale.setScalar(Math.max(0.001, E.back(clamp01(pe(0) / 0.5))));
  pc.orbit.visible = k === 0;
  if (k === 0) pc.orbs.forEach((s, i) => {
    const a = L * Math.PI * 2 + i * (Math.PI * 2 / 3);
    s.position.set(Math.cos(a) * 0.55, Math.sin(a * 2) * 0.08, Math.sin(a) * 0.55);
  });

  // 2. Baseline: bars grow, scan beam sweeps
  const bd = props[1].userData.icon.userData;
  bd.bars.forEach((b, i) => {
    const p = E.out(clamp01((pe(1) - i * 0.12) / 0.5));
    const h = Math.max(0.001, BAR_H[i] * p);
    b.scale.y = h; b.position.y = h / 2;
  });
  beam.visible = k === 1;
  if (k === 1){
    beam.position.z = -3.4 + 6.8 * L;
    beam.material.opacity = 0.45 * Math.sin(L * Math.PI);
  }

  // 3. Learning Plan: books drop in one by one and stack
  props[2].userData.icon.userData.books.forEach((b, i) => {
    const p = E.bounce(clamp01((pe(2) - i * 0.18) / 0.45));
    b.position.y = BOOK_Y[i] + (1 - p) * 1.8;
    b.rotation.y = BOOK_R[i] + (1 - p) * 2.4;
  });

  // 4. Post-Assessment: dart flies into the bullseye, ripples expand
  const td = props[3].userData.icon.userData;
  const dp = E.out(clamp01(pe(3) / 0.6));
  td.dart.position.set(-1.6 * (1 - dp), 0.55 + 1.5 * (1 - dp), 1.2 * (1 - dp) + 0.05);
  td.dart.visible = k === 3 || k > 3 || k < 0;
  ripples.forEach((r, i) => {
    const pos = PROP_POS[3];
    r.position.set(pos[0], 0.155, pos[1]);
    const ph = (now * 0.7 + i / 3) % 1;
    const on = k === 3 ? 1 : 0;
    r.scale.setScalar(0.9 + ph * 2.4);
    r.material.opacity = on * (1 - ph) * 0.6;
  });

  // 5. ESG-score: globe spins a full turn, orbit dot circles
  const gd = props[4].userData.icon.userData;
  gd.ball.rotation.y = k === 4 ? L * Math.PI * 2 : 0;
  gd.dot.position.set(Math.cos(L * Math.PI * 2 + 1) * 0.5, 0.55, Math.sin(L * Math.PI * 2 + 1) * 0.5);
  gd.dot.visible = k === 4;

  // 6. Certificate: sheet flips in, seal pulses, confetti bursts
  const cd = props[5].userData.icon.userData;
  cd.sheet.rotation.y = k === 5 ? (1 - E.out(clamp01(L / 0.5))) * Math.PI : 0;
  cd.seal.scale.setScalar(1 + 0.12 * Math.sin(now * 4));

  const burstT = k === 5 ? clamp01((L - 0.45) / 0.55) : 0;
  burstRing.position.set(PROP_POS[5][0], 0.155, PROP_POS[5][1]);
  burstRing.scale.setScalar(0.5 + burstT * 9);
  burstRing.material.opacity = k === 5 ? Math.max(0, 0.8 * (1 - burstT)) : 0;

  const origin = new THREE.Vector3();
  props[5].getWorldPosition(origin);
  origin.y += 1.4;
  const e = Math.max(0, (L - 0.45) * 2.2);
  confetti.forEach(m => {
    const u = m.userData;
    const on = k === 5 && L > 0.45;
    m.visible = on;
    if (!on) return;
    m.position.set(origin.x + u.vx * e, origin.y + u.vy * e - 1.6 * e * e, origin.z + u.vz * e);
    m.rotation.set(u.spin * e, u.spin * e * 0.5, 0);
    m.material.opacity = 1;
  });
}

// Initial state
setActive(0);
gsap.set(tagEl, { opacity: 0 }); gsap.set(cardEl, { opacity: 0 });

/* ---------- click / keyboard navigation to a step ---------- */
function goToStep(k) {
  const st = tl.scrollTrigger;
  if (!st) return;

  // Stop autoplay
  if (autoTween) {
    autoTween.kill();
    autoTween = null;
  }

  if (resumeTimer) window.clearTimeout(resumeTimer);
  userPausedAuto = true;

  // Calculate the selected step's scroll position
  const t = INTRO + k * STEP + STEP * 0.5;
  const progress = t / TOTAL;
  const y = st.start + (st.end - st.start) * progress;

  setActive(k);

  // Move directly to the selected step
  st.scroll(y);
  st.update();

  // Resume autoplay after 5 seconds
  resumeTimer = window.setTimeout(() => {
    userPausedAuto = false;
    startAutoScroll();
  }, 2000);
}
stepEls.forEach((el, i) => {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.addEventListener('click', () => goToStep(i));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToStep(i); }
  });
});

/* ---------- render loop ---------- */
function tick(){
  const now = performance.now() / 1000;
  const T = tl.time();
  const inSteps = T >= INTRO && T < INTRO + STEPS.length * STEP;
  const k = inSteps ? Math.floor((T - INTRO) / STEP) : -1;
  const L = inSteps ? (T - INTRO) - k * STEP : 0;

  applyStepFx(k, L, now);

  renderer.render(scene, camera);
  if (activeIdx >= 0){
    const p = props[activeIdx];
    placeOver(aTag,  p, new THREE.Vector3(0, 2.1, 0));
    placeOver(aCard, p, new THREE.Vector3(0.9, 1.1, 0));
  }
  requestAnimationFrame(tick);
}
tick();


/* ---------- automatic scroll progression + manual override ---------- */
let autoTween = null;
let resumeTimer = null;
let autoStartTimer = null;
let autoScrollProxy = { y: 0 };
let userPausedAuto = false;
let autoCycle = true;

function stopAutoScroll(){
  if (autoTween) {
    autoTween.kill();
    autoTween = null;
  }
  userPausedAuto = true;
  if (resumeTimer) window.clearTimeout(resumeTimer);
  resumeTimer = window.setTimeout(() => {
    userPausedAuto = false;
    startAutoScroll();
  }, 0);
}

function startAutoScroll(){
  if (userPausedAuto || autoTween) return;
  const st = tl.scrollTrigger;
  if (!st) return;

  const current = st.scroll();
  // If the visitor is outside the animation section, wait until it is in view.
  if (current < st.start - 20 || current > st.end + 20) return;

  autoScrollProxy.y = current;
  const remaining = Math.max(0.5, (st.end - current) / Math.max(1, st.end - st.start));
  // About 4.5 seconds per learning step, plus intro/outro.
  const duration = Math.max(1.5, remaining * (INTRO + STEPS.length * 4.5 + OUTRO));

  autoTween = gsap.to(autoScrollProxy, {
    y: st.end,
    duration,
    ease: "none",
    onUpdate: () => {
      if (tl.scrollTrigger) tl.scrollTrigger.scroll(autoScrollProxy.y);
    },
    onComplete: () => {
      autoTween = null;
      if (autoCycle && !userPausedAuto) {
        // Brief pause at the end, then restart the learning journey.
        resumeTimer = window.setTimeout(() => {
          if (userPausedAuto) return;
          const trigger = tl.scrollTrigger;
          if (!trigger) return;
          trigger.scroll(trigger.start);
          autoScrollProxy.y = trigger.start;
          startAutoScroll();
        }, 1800);
      }
    }
  });
}

function onUserInteraction(){
  stopAutoScroll();
}
const manualEvents = ["wheel", "touchstart", "touchmove", "pointerdown"];
manualEvents.forEach(eventName => window.addEventListener(eventName, onUserInteraction, { passive: true }));
window.addEventListener("keydown", onUserInteraction);

autoStartTimer = window.setTimeout(() => {
  ScrollTrigger.refresh();

  const st = tl.scrollTrigger;

  if (st) {
    window.scrollTo(0, 0);
    st.scroll(st.start);
    autoScrollProxy.y = st.start;

    tl.progress(0);
    st.update();

    startAutoScroll();
  }
}, 1500);

const resizeHandler = () => { sizeRenderer(); ScrollTrigger.refresh(); };
    window.addEventListener("resize", resizeHandler);
    return () => {
      if (tl?.scrollTrigger) tl.scrollTrigger.kill();
      tl?.kill();
      if (autoTween) autoTween.kill();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      if (autoStartTimer) window.clearTimeout(autoStartTimer);
      manualEvents.forEach(eventName => window.removeEventListener(eventName, onUserInteraction));
      window.removeEventListener("keydown", onUserInteraction);
      renderer?.dispose();
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <section id="scroller">
<div id="sticky">

    <div id="left">
      <h1>Begin your structured ESG learning journey with your Personalized Programme.</h1>
      <div className="steps-wrap">
        <div className="rail"><i /></div>
        <ol id="steps">
          <li className="step"><span className="n">1</span><div><div className="t">Profile &amp; Planner</div><p className="d">Set up your learner profile and goals, then shape the plan around your time and role.</p></div></li>
          <li className="step"><span className="n">2</span><div><div className="t">Baseline</div><p className="d">Take a short baseline check to measure exactly where you are starting from.</p></div></li>
          <li className="step"><span className="n">3</span><div><div className="t">Learning Plan</div><p className="d">A personalised path of modules and milestones built from your baseline results.</p></div></li>
          <li className="step"><span className="n">4</span><div><div className="t">Post-Assessment</div><p className="d">Re-assess after learning to see what changed and where to focus next.</p></div></li>
          <li className="step"><span className="n">5</span><div><div className="t">ESG-score</div><p className="d">Your ESG score summarises progress across the programme in one clear number.</p></div></li>
          <li className="step"><span className="n">6</span><div><div className="t">Certificate</div><p className="d">Complete the journey and receive your certificate of achievement.</p></div></li>
        </ol>
      </div>
      <div id="hint">Scroll or click a step</div>
    </div>

    <div id="viewport">
      <div className="anchor" id="aTag"><div className="tag"></div></div>
      <div className="anchor" id="aCard">
        <div className="card">
          <div className="k"></div>
          <div className="v"></div>
          <div className="bar"><i /></div>
        </div>
      </div>
    </div>

  </div>
    </section>
  );
}
