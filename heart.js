/* ============================================================
   HUMAN HEART SIMULATION — heart.js
   Full 3D anatomical heart using Three.js r128
   ============================================================ */

'use strict';

// ─── GLOBALS ─────────────────────────────────────────────────
let scene, camera, renderer, heartGroup, clock;
let animFrameId, isBeating = true, showBlood = true;
let currentBPM = 75, beatPhase = 0, beatTimer = 0;
let currentView = 'full';
let xrayMode = false, showLabels = true;
let isDragging = false, prevMouse = { x: 0, y: 0 };
let touchStartDistance = 0;
let touchStartRadius = 0;
let sphericalAngle = { theta: 0.3, phi: Math.PI / 2 };
let cameraRadius = getDefaultCameraRadius();
let beatCount = 0, totalBeatsToday = 0;
let journeyStep = 0, journeyTimer = 0;
let phaseIsSysteme = false;
let heartObjects = {};
let labelSprites = [];
let bloodParticles = [];
let coronaryObjects = [];
let loadProgress = 0;

function getDefaultCameraRadius() {
  return window.matchMedia('(max-width: 560px)').matches ? 4.2 : 5;
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

// Part info database
const PART_INFO = {
  'left_atrium': {
    icon: '🫀',
    title: 'Left Atrium',
    text: 'The upper-left chamber. It receives oxygen-rich (red) blood coming back from the lungs through the pulmonary veins. Think of it as the "receiving room" for fresh blood from the lungs.',
    badge: 'Upper-left chamber',
    badgeColor: '#e03a3a'
  },
  'right_atrium': {
    icon: '🫀',
    title: 'Right Atrium',
    text: 'The upper-right chamber. It collects used (oxygen-poor, blue) blood from the entire body through two large veins. It is the first stop for blood returning from the body.',
    badge: 'Upper-right chamber',
    badgeColor: '#2e6db4'
  },
  'left_ventricle': {
    icon: '💪',
    title: 'Left Ventricle',
    text: 'The strongest pumping chamber! It has thick muscular walls (about 1.2 cm thick) because it must push blood all the way around the body. When doctors measure your blood pressure, they\'re measuring the force of this chamber.',
    badge: 'Main pumping chamber — strongest!',
    badgeColor: '#e03a3a'
  },
  'right_ventricle': {
    icon: '🫁',
    title: 'Right Ventricle',
    text: 'The lower-right pumping chamber. It sends blood to the lungs — a much shorter distance than the left ventricle travels, so its walls are thinner. It works together with the right atrium on the right side of the heart.',
    badge: 'Pumps blood to the lungs',
    badgeColor: '#3498db'
  },
  'aorta': {
    icon: '🩸',
    title: 'Aorta',
    text: 'The largest blood vessel in the human body! About 2–3 cm wide (like a garden hose). It carries oxygen-rich blood from the left ventricle and branches into smaller arteries that supply every organ and tissue in your body.',
    badge: 'Largest artery in the body',
    badgeColor: '#e03a3a'
  },
  'pulmonary_artery': {
    icon: '🫁',
    title: 'Pulmonary Artery',
    text: 'The only artery that carries oxygen-poor (blue) blood! It takes blood from the right ventricle to the lungs. Here blood drops off carbon dioxide and picks up fresh oxygen. Fun fact: "pulmonary" means relating to the lungs.',
    badge: 'Only artery carrying blue blood',
    badgeColor: '#3498db'
  },
  'pulmonary_veins': {
    icon: '🌬️',
    title: 'Pulmonary Veins',
    text: 'Four veins (two from each lung) that bring freshly oxygenated blood back from the lungs into the left atrium. These are the only veins in the body that carry red (oxygen-rich) blood — most veins carry blue blood!',
    badge: 'Carry fresh oxygen from lungs',
    badgeColor: '#e03a3a'
  },
  'vena_cava': {
    icon: '🔵',
    title: 'Vena Cava (Superior & Inferior)',
    text: 'Two of the largest veins in the body. The Superior (upper) Vena Cava brings blood from the upper body (head, arms). The Inferior (lower) Vena Cava brings blood from the lower body (legs, organs). Both empty into the right atrium.',
    badge: 'Returns blood from the whole body',
    badgeColor: '#2e6db4'
  },
  'mitral_valve': {
    icon: '🚪',
    title: 'Mitral Valve (Bicuspid)',
    text: 'A two-leaflet valve between the left atrium and left ventricle. It opens to let blood flow down, then snaps shut to prevent backflow when the ventricle squeezes. Named "mitral" because it looks like a bishop\'s hat (mitre).',
    badge: 'Left side gate — 2 leaflets',
    badgeColor: '#f39c12'
  },
  'tricuspid_valve': {
    icon: '🚪',
    title: 'Tricuspid Valve',
    text: 'A three-leaflet valve between the right atrium and right ventricle. "Tri" means three! It works exactly like the mitral valve but on the right side, ensuring blood flows only downward and doesn\'t leak back up.',
    badge: 'Right side gate — 3 leaflets',
    badgeColor: '#f39c12'
  },
  'coronary': {
    icon: '⭐',
    title: 'Coronary Arteries',
    text: 'The heart\'s own blood supply! These small arteries sit on the surface of the heart and supply the heart muscle itself with oxygen and nutrients. If a coronary artery gets blocked, that part of the heart muscle dies — this is a heart attack (myocardial infarction).',
    badge: 'The heart feeds itself first',
    badgeColor: '#f39c12'
  }
};

// ─── INIT ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  simulateLoading(() => {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('app').style.flexDirection = 'column';
    initThreeJS();
    buildHeart();
    buildBloodParticles();
    buildLabels();
    setupEvents();
    animate();
    startJourneyAnimation();
    updateStatsBPM(75);
    hideDragHint();
  });
});

function simulateLoading(cb) {
  const fill = document.getElementById('loader-fill');
  const txt = document.getElementById('loader-text');
  const steps = [
    [15, 'Loading Three.js engine...'],
    [35, 'Building heart chambers...'],
    [55, 'Adding blood vessels...'],
    [70, 'Animating heartbeat...'],
    [85, 'Setting up valves...'],
    [100, 'Ready!']
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) { setTimeout(cb, 200); return; }
    fill.style.width = steps[i][0] + '%';
    txt.textContent = steps[i][1];
    i++;
    setTimeout(tick, 260);
  };
  tick();
}

function hideDragHint() {
  setTimeout(() => {
    const h = document.getElementById('drag-hint');
    if (h) h.style.opacity = '0';
  }, 4000);
}

// ─── THREE.JS SETUP ──────────────────────────────────────────
function initThreeJS() {
  const canvas = document.getElementById('heart-canvas');
  const W = canvas.clientWidth, H = canvas.clientHeight;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080a0e, 0.12);

  camera = new THREE.PerspectiveCamera(50, W / H, 0.01, 100);
  camera.position.set(0, 0, cameraRadius);

  clock = new THREE.Clock();

  // Lighting — clean 3-point setup so the heart's shape reads clearly
  // instead of being muddled by too many competing colored lights.
  const ambient = new THREE.AmbientLight(0x2a1414, 1.3);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff2ea, 2.4);
  keyLight.position.set(3, 4, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x3a5fa0, 0.7);
  fillLight.position.set(-3.5, -1, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xff6a55, 1.0);
  rimLight.position.set(-1, -3, -3.5);
  scene.add(rimLight);

  const warmPoint = new THREE.PointLight(0xffab8a, 1.1, 8);
  warmPoint.position.set(0.5, 2.6, 1.5);
  scene.add(warmPoint);

  // Subtle background particles (like floating blood cells)
  addBackgroundDust();

  window.addEventListener('resize', onResize);
}

function onResize() {
  const canvas = document.getElementById('heart-canvas');
  if (!canvas) return;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  renderer.setSize(W, H);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
}

// ─── HEART GEOMETRY ──────────────────────────────────────────
function buildHeart() {
  heartGroup = new THREE.Group();
  scene.add(heartGroup);

  buildPericardium();
  buildHeartShell();
  buildLeftAtrium();
  buildRightAtrium();
  buildLeftVentricle();
  buildRightVentricle();
  buildSeptum();
  buildAorta();
  buildPulmonaryArtery();
  buildPulmonaryVeins();
  buildVenaCava();
  buildCoronaryArteries();
  buildValves();
}

function heartMat(color, opacity = 1, emissive = 0x000000, rough = 0.6, metal = 0.1) {
  return new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity: 0.15,
    roughness: rough, metalness: metal,
    transparent: opacity < 1, opacity,
    side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
  });
}

// ─── SMOOTH HEART FIELD ────────────────────────────────────────
// Instead of four separate spheres bolted together (which is what made
// the old heart look like a cluster of balls), we describe each chamber
// as an ellipsoid "lobe" and blend all four into ONE continuous radius
// field. Sampling that field over a single high-res sphere produces one
// seamless, organic heart-shaped mesh — no visible seams, no clutter.
const HEART_LOBES = [
  // id,           center                 semi-axes(x,yUp,yDown,z)      color
  { id: 'lv', c: [-0.18, -0.20, 0.00], ax: 0.656, ayU: 0.820, ayD: 1.312, az: 0.615, color: 0xc0392b },
  { id: 'rv', c: [0.42, -0.15, 0.00], ax: 0.476, ayU: 0.680, ayD: 0.952, az: 0.442, color: 0x2980b9 },
  { id: 'la', c: [-0.30, 0.65, -0.10], ax: 0.527, ayU: 0.434, ayD: 0.434, az: 0.496, color: 0xe74c3c },
  { id: 'ra', c: [0.60, 0.55, -0.05], ax: 0.476, ayU: 0.418, ayD: 0.418, az: 0.452, color: 0x3498db },
  { id: 'laur', c: [-0.75, 0.55, 0.20], ax: 0.264, ayU: 0.154, ayD: 0.154, az: 0.132, color: 0xd44040 },
  { id: 'raur', c: [0.90, 0.60, 0.15], ax: 0.220, ayU: 0.130, ayD: 0.130, az: 0.110, color: 0x5ba0d0 },
];
const HEART_BLEND_POWER = 5;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Along direction `dir` from the origin, find how far each ellipsoid
// lobe extends (0 if the ray misses it entirely).
function lobeRadiusAlong(dir, lobe) {
  const [cx, cy, cz] = lobe.c;
  const ax = lobe.ax, ay = dir.y < 0 ? lobe.ayD : lobe.ayU, az = lobe.az;
  const dx = dir.x / ax, dy = dir.y / ay, dz = dir.z / az;
  const ex = cx / ax, ey = cy / ay, ez = cz / az;
  const A = dx * dx + dy * dy + dz * dz;
  const B = -2 * (dx * ex + dy * ey + dz * ez);
  const C = ex * ex + ey * ey + ez * ez - 1;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return 0;
  const sq = Math.sqrt(disc);
  const t = Math.max((-B + sq) / (2 * A), (-B - sq) / (2 * A));
  return t > 0 ? t : 0;
}

// Smoothly blend all lobes together (soft union) and carve in the two
// anatomical grooves (interventricular + coronary sulcus) so the single
// mesh still visually reads as a heart rather than a smooth blob.
// Smooth, continuous "organic" noise built from a handful of overlapping
// sine waves. Unlike random per-vertex jitter, this has no sharp jumps —
// it reads as real fleshy, dimpled muscle texture instead of static.
function fleshNoise(x, y, z, freq, seed) {
  return (
    Math.sin(x * freq * 1.0 + y * freq * 0.7 + seed) * 0.5 +
    Math.sin(y * freq * 1.3 - z * freq * 0.9 + seed * 1.7) * 0.3 +
    Math.sin(z * freq * 1.6 + x * freq * 1.1 - seed * 0.6) * 0.2
  );
}

function heartField(dir) {
  let sumP = 0, colR = 0, colG = 0, colB = 0, wSum = 0;
  const weights = {};
  for (const lobe of HEART_LOBES) {
    const r = lobeRadiusAlong(dir, lobe);
    const w = Math.pow(r, HEART_BLEND_POWER);
    sumP += w;
    weights[lobe.id] = r;
    const c = lobe.color;
    const cr = (c >> 16 & 255) / 255, cg = (c >> 8 & 255) / 255, cb = (c & 255) / 255;
    colR += cr * w; colG += cg * w; colB += cb * w; wSum += w;
  }
  let R = Math.pow(sumP, 1 / HEART_BLEND_POWER) + 0.035;
  if (wSum > 0) { colR /= wSum; colG /= wSum; colB /= wSum; }
  else { colR = 0.55; colG = 0.16; colB = 0.14; }

  let pos = { x: dir.x * R, y: dir.y * R, z: dir.z * R };

  // Interventricular sulcus — subtle vertical crease on the front face
  // between the two ventricles.
  const bandV = smoothstep(-1.25, -0.9, pos.y) * smoothstep(0.4, 0.0, pos.y);
  const frontV = smoothstep(0.0, 0.3, pos.z);
  const groove1 = 0.07 * Math.exp(-((pos.x - 0.08) ** 2) / (2 * 0.11 * 0.11)) * bandV * frontV;

  // Coronary sulcus — the horizontal groove separating atria from ventricles.
  const groove2 = 0.055 * Math.exp(-((pos.y - 0.30) ** 2) / (2 * 0.09 * 0.09));

  const shrink = clamp01(1 - groove1 - groove2);
  R *= shrink;

  // Fine muscle-fiber texture — real hearts are dimpled and fibrous, not
  // glassy-smooth. This is fused into the same surface (no separate bumps
  // stuck on top), so it stays seamless while still looking organic.
  const bumpFine = fleshNoise(dir.x, dir.y, dir.z, 26, 1.3) * 0.011;
  const bumpMed = fleshNoise(dir.x, dir.y, dir.z, 9, 4.1) * 0.018;
  R *= (1 + bumpFine + bumpMed);

  pos = { x: dir.x * R, y: dir.y * R, z: dir.z * R };

  // Subtle mottling in color too, echoing the same texture, so lighting
  // and color variation agree with each other.
  const mottle = 1 + fleshNoise(dir.x * 1.4, dir.y * 1.4, dir.z * 1.4, 14, 7.7) * 0.09;

  return { R, x: pos.x, y: pos.y, z: pos.z, color: [colR * mottle, colG * mottle, colB * mottle], groove: groove1 + groove2 };
}

function buildPericardium() {
  // Thin outer sac — a faint glowing silhouette just outside the heart
  // itself, built from the same smooth field so it always fits perfectly.
  const geo = new THREE.SphereGeometry(1, 64, 48);
  const pos = geo.attributes.position;
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    dir.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const f = heartField(dir);
    pos.setXYZ(i, f.x * 1.14, f.y * 1.1 + 0.04, f.z * 1.14);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xcc4444, transparent: true, opacity: 0.05,
    roughness: 0.3, metalness: 0, side: THREE.BackSide,
    depthWrite: false
  });
  mat._origOpacity = 0.05;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'pericardium';
  heartGroup.add(mesh);
  heartObjects.pericardium = mesh;
}

function buildHeartShell() {
  // The single continuous heart-muscle surface — this replaces the old
  // four separate sphere "blobs" that used to overlap and look cluttered.
  const geo = new THREE.IcosahedronGeometry(1, 4);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dir = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    dir.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    const f = heartField(dir);
    pos.setXYZ(i, f.x, f.y, f.z);
    // Blend the chamber-color tint with a deep muscle base, and darken
    // slightly inside the grooves for a subtle carved, sculpted look.
    const base = [0.47, 0.13, 0.12];
    const mix = 0.62;
    let r = base[0] * (1 - mix) + f.color[0] * mix;
    let g = base[1] * (1 - mix) + f.color[1] * mix;
    let b = base[2] * (1 - mix) + f.color[2] * mix;
    const shade = 1 - 0.35 * clamp01(f.groove);
    colors[i * 3] = r * shade;
    colors[i * 3 + 1] = g * shade;
    colors[i * 3 + 2] = b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const MatCtor = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
  const mat = new MatCtor({
    vertexColors: true,
    roughness: 0.62, metalness: 0.0,
    clearcoat: 0.1, clearcoatRoughness: 0.65,
    emissive: 0x1a0505, emissiveIntensity: 0.08,
    transparent: false, opacity: 1,
    side: THREE.FrontSide,
  });
  mat._origOpacity = 1;

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'heart_body';
  mesh.castShadow = true; mesh.receiveShadow = true;
  // Intentionally NOT userData.clickable — clicks pass through to the
  // (invisible but still raycastable) chamber meshes just behind it, so
  // "click a part to learn about it" keeps working exactly as before.
  heartGroup.add(mesh);
  heartObjects.heartBody = mesh;
}

function buildLeftVentricle() {
  // Largest, most muscular — bottom-left, dominant. Kept as an invisible
  // "hit region" so clicking/labelling still works; the smooth heart_body
  // shell is what's actually visible now (see buildHeartShell).
  const geo = new THREE.SphereGeometry(0.82, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0) y *= 1.6;
    x *= 0.8; z *= 0.75;
    const bulge = 1 + 0.05 * Math.sin(y * 2);
    pos.setXYZ(i, x * bulge - 0.18, y - 0.2, z * bulge);
  }
  geo.computeVertexNormals();
  const mat = heartMat(0xc0392b, 1, 0x8b0000, 0.55, 0.12);
  mat.roughness = 0.55;
  mat.transparent = true; mat.opacity = 0; mat._origOpacity = 0;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'left_ventricle';
  mesh.userData = { partId: 'left_ventricle', clickable: true };
  heartGroup.add(mesh);
  heartObjects.leftVentricle = mesh;
}

function buildRightVentricle() {
  const geo = new THREE.SphereGeometry(0.68, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0) y *= 1.4;
    x *= 0.7; z *= 0.65;
    pos.setXYZ(i, x + 0.42, y - 0.15, z);
  }
  geo.computeVertexNormals();
  const mat = heartMat(0x2980b9, 1, 0x1a4a7a, 0.6, 0.1);
  mat.transparent = true; mat.opacity = 0; mat._origOpacity = 0;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'right_ventricle';
  mesh.userData = { partId: 'right_ventricle', clickable: true };
  heartGroup.add(mesh);
  heartObjects.rightVentricle = mesh;
}

function buildLeftAtrium() {
  const geo = new THREE.SphereGeometry(0.62, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    y *= 0.7; x *= 0.85; z *= 0.8;
    pos.setXYZ(i, x - 0.3, y + 0.65, z - 0.1);
  }
  geo.computeVertexNormals();
  const mat = heartMat(0xe74c3c, 1, 0x7a1a1a, 0.58, 0.1);
  mat.transparent = true; mat.opacity = 0; mat._origOpacity = 0;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'left_atrium';
  mesh.userData = { partId: 'left_atrium', clickable: true };
  heartGroup.add(mesh);
  heartObjects.leftAtrium = mesh;
  // Note: the left auricle (ear-like appendage) is now sculpted directly
  // into the heart_body shell instead of being a separate floating bump.
}

function buildRightAtrium() {
  const geo = new THREE.SphereGeometry(0.58, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    y *= 0.72; x *= 0.82; z *= 0.78;
    pos.setXYZ(i, x + 0.6, y + 0.55, z - 0.05);
  }
  geo.computeVertexNormals();
  const mat = heartMat(0x3498db, 1, 0x1a4a7a, 0.62, 0.1);
  mat.transparent = true; mat.opacity = 0; mat._origOpacity = 0;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'right_atrium';
  mesh.userData = { partId: 'right_atrium', clickable: true };
  heartGroup.add(mesh);
  heartObjects.rightAtrium = mesh;
  // Note: the right auricle is now sculpted directly into the heart_body
  // shell instead of being a separate floating bump.
}

function buildSeptum() {
  // Interventricular septum — wall between ventricles (subtle, internal)
  const geo = new THREE.BoxGeometry(0.06, 1.0, 0.7);
  const mat = heartMat(0xa03030, 0.5, 0x000000, 0.7, 0.05);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.22, -0.18, 0);
  heartGroup.add(mesh);
}

function buildAorta() {
  // Ascending aorta arch — characteristic arch shape
  const points = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const x = -0.25 + t * (-0.5);
    const y = 0.9 + Math.sin(t * Math.PI) * 0.7;
    const z = -0.1 + t * 0.1;
    points.push(new THREE.Vector3(x, y, z));
  }
  // Add descending part
  for (let t = 0; t <= 1; t += 0.1) {
    points.push(new THREE.Vector3(-0.75 + t * 0.0, 1.2 - t * 1.8, 0));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.12, 12, false);
  const mat = heartMat(0xd63031, 1, 0x8b0000, 0.45, 0.2);
  const mesh = new THREE.Mesh(tubeGeo, mat);
  mesh.name = 'aorta';
  mesh.userData = { partId: 'aorta', clickable: true };
  heartGroup.add(mesh);
  heartObjects.aorta = mesh;

  // Aortic knob (bulge at arch)
  const bulgeGeo = new THREE.SphereGeometry(0.14, 16, 16);
  const bMat = heartMat(0xc0392b, 1, 0x7a0000, 0.4, 0.2);
  const bulge = new THREE.Mesh(bulgeGeo, bMat);
  bulge.position.set(-0.65, 1.56, -0.05);
  heartGroup.add(bulge);

  // Brachiocephalic branches (smaller arteries off arch)
  addArterialBranch(-0.3, 1.65, 0, -0.4, 2.0, 0.15, 0.055);   // Brachiocephalic
  addArterialBranch(-0.5, 1.7, 0, -0.6, 2.1, 0.05, 0.045);    // Left common carotid
  addArterialBranch(-0.62, 1.65, 0, -0.8, 1.95, -0.1, 0.04);  // Left subclavian
}

function buildPulmonaryArtery() {
  const points = [
    new THREE.Vector3(0.42, 0.4, 0.3),
    new THREE.Vector3(0.3, 0.85, 0.35),
    new THREE.Vector3(0.1, 1.1, 0.2),
    new THREE.Vector3(-0.15, 1.15, 0.1),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 24, 0.1, 10, false);
  const mat = heartMat(0x2980b9, 1, 0x1a4a7a, 0.5, 0.15);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'pulmonary_artery';
  mesh.userData = { partId: 'pulmonary_artery', clickable: true };
  heartGroup.add(mesh);
  heartObjects.pulmonaryArtery = mesh;

  // Bifurcation — splits to left and right lung
  addBlueVessel(-0.15, 1.15, 0.1, -0.45, 1.05, 0.4, 0.065);  // Left PA
  addBlueVessel(-0.15, 1.15, 0.1, 0.15, 1.05, 0.45, 0.065);  // Right PA
}

function buildPulmonaryVeins() {
  // 4 pulmonary veins — bring oxygenated blood from lungs
  const veins = [
    [[-0.55, 0.8, -0.4], [-0.35, 0.7, -0.1]],
    [[-0.55, 0.5, -0.35], [-0.35, 0.55, -0.1]],
    [[0.3, 0.8, -0.45], [0.15, 0.65, -0.1]],   // corrected - into left atrium
    [[0.35, 0.5, -0.4], [0.15, 0.55, -0.1]],
  ];
  veins.forEach(([start, end]) => {
    const pts = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 10, 0.052, 8, false);
    const mat = heartMat(0xe74c3c, 1, 0x7a0000, 0.55, 0.1);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'pulmonary_veins';
    mesh.userData = { partId: 'pulmonary_veins', clickable: true };
    heartGroup.add(mesh);
  });
}

function buildVenaCava() {
  // Superior Vena Cava (from top)
  const svcPts = [
    new THREE.Vector3(0.72, 1.65, 0),
    new THREE.Vector3(0.7, 1.2, 0),
    new THREE.Vector3(0.65, 0.85, 0),
  ];
  const svcCurve = new THREE.CatmullRomCurve3(svcPts);
  const svcGeo = new THREE.TubeGeometry(svcCurve, 16, 0.09, 10, false);
  const vcMat = heartMat(0x2471a3, 1, 0x1a3a6a, 0.55, 0.1);
  const svc = new THREE.Mesh(svcGeo, vcMat.clone());
  svc.name = 'vena_cava';
  svc.userData = { partId: 'vena_cava', clickable: true };
  heartGroup.add(svc);
  heartObjects.venaCava = svc;

  // Inferior Vena Cava (from bottom)
  const ivcPts = [
    new THREE.Vector3(0.58, -1.2, 0.1),
    new THREE.Vector3(0.62, -0.4, 0.05),
    new THREE.Vector3(0.63, 0.22, 0),
  ];
  const ivcCurve = new THREE.CatmullRomCurve3(ivcPts);
  const ivcGeo = new THREE.TubeGeometry(ivcCurve, 16, 0.085, 10, false);
  const ivc = new THREE.Mesh(ivcGeo, vcMat.clone());
  heartGroup.add(ivc);
}

function buildCoronaryArteries() {
  coronaryObjects = [];
  // Left main coronary artery
  const lmca = [
    [-0.1, 0.75, 0.55],
    [-0.3, 0.55, 0.65],
    [-0.55, 0.2, 0.62],
    [-0.65, -0.2, 0.55],
    [-0.5, -0.55, 0.45],
  ];
  const lmcaMesh = addCoronaryPath(lmca, 0.038);
  coronaryObjects.push(lmcaMesh);

  // Right coronary artery
  const rca = [
    [0.15, 0.72, 0.5],
    [0.42, 0.42, 0.58],
    [0.62, 0.05, 0.48],
    [0.55, -0.35, 0.38],
    [0.35, -0.65, 0.28],
  ];
  const rcaMesh = addCoronaryPath(rca, 0.035);
  coronaryObjects.push(rcaMesh);

  // LAD (Left Anterior Descending)
  const lad = [
    [-0.2, 0.62, 0.6],
    [-0.22, 0.2, 0.72],
    [-0.18, -0.2, 0.72],
    [-0.15, -0.65, 0.65],
    [-0.1, -1.0, 0.5],
  ];
  const ladMesh = addCoronaryPath(lad, 0.028);
  coronaryObjects.push(ladMesh);
}

function addCoronaryPath(pointsArr, radius) {
  const pts = pointsArr.map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 20, radius, 7, false);
  const mat = heartMat(0xf39c12, 1, 0xb37800, 0.4, 0.3);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'coronary';
  mesh.userData = { partId: 'coronary', clickable: true };
  heartGroup.add(mesh);
  return mesh;
}

function buildValves() {
  buildValveAt(-0.15, 0.28, 0, 'mitral_valve', 0xf0c040, 'Mitral');   // Mitral
  buildValveAt(0.42, 0.2, 0, 'tricuspid_valve', 0xf0a020, 'Tricuspid'); // Tricuspid
  buildValveAt(-0.18, 0.88, 0.15, 'aortic_valve', 0xffcc00, 'Aortic');  // Aortic
  buildValveAt(0.38, 0.78, 0.2, 'pulmonary_valve', 0xffaa00, 'Pulm.');  // Pulmonary
}

function buildValveAt(x, y, z, name, color, label) {
  const group = new THREE.Group();
  // Three cusps (leaflets)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leafGeo = new THREE.SphereGeometry(0.085, 8, 8, 0, Math.PI);
    const leafMat = heartMat(color, 0.85, 0x885500, 0.4, 0.2);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 0.07, 0, Math.sin(angle) * 0.07);
    leaf.rotation.y = angle;
    group.add(leaf);
  }
  // Annulus ring
  const ringGeo = new THREE.TorusGeometry(0.1, 0.018, 8, 20);
  const ringMat = heartMat(color, 0.9, 0x885500, 0.35, 0.3);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  group.position.set(x, y, z);
  group.name = name;
  group.userData = { partId: name, clickable: true };
  heartGroup.add(group);
  heartObjects[name] = group;
}

// Helpers for vessels
function addArterialBranch(x1, y1, z1, x2, y2, z2, r) {
  const pts = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 8, r, 8, false);
  const mat = heartMat(0xcc3333, 1, 0x880000, 0.45, 0.2);
  heartGroup.add(new THREE.Mesh(geo, mat));
}

function addBlueVessel(x1, y1, z1, x2, y2, z2, r) {
  const pts = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 8, r, 8, false);
  const mat = heartMat(0x2471a3, 1, 0x1a3060, 0.5, 0.15);
  heartGroup.add(new THREE.Mesh(geo, mat));
}

// ─── BLOOD PARTICLES ─────────────────────────────────────────
function buildBloodParticles() {
  bloodParticles = [];

  // Define flow paths: [points, color, type]
  const paths = [
    // Body → right atrium (blue)
    { pts: [[0.72, 1.5, 0], [0.65, 0.85, 0], [0.6, 0.35, 0]], color: 0x2980b9, type: 'vein' },
    // Right atrium → right ventricle (blue)
    { pts: [[0.6, 0.35, 0], [0.5, 0.05, 0], [0.42, -0.3, 0]], color: 0x2980b9, type: 'vein' },
    // Right ventricle → pulmonary artery (blue)
    { pts: [[0.42, -0.3, 0], [0.42, 0.3, 0.3], [0.1, 1.0, 0.2], [-0.3, 1.0, 0.2]], color: 0x2271a0, type: 'vein' },
    // Pulmonary veins → left atrium (red, from lungs)
    { pts: [[-0.6, 0.8, -0.4], [-0.35, 0.7, -0.1], [-0.3, 0.6, 0.05]], color: 0xe03a3a, type: 'artery' },
    // Left atrium → left ventricle (red)
    { pts: [[-0.3, 0.65, 0], [-0.25, 0.2, 0.05], [-0.18, -0.3, 0]], color: 0xe03a3a, type: 'artery' },
    // Left ventricle → aorta (red)
    { pts: [[-0.18, -0.3, 0], [-0.2, 0.4, 0], [-0.25, 1.1, 0], [-0.65, 1.55, 0]], color: 0xff3333, type: 'artery' },
    // Aorta → body (red)
    { pts: [[-0.65, 1.55, 0], [-0.75, 0.6, 0], [-0.72, -0.8, 0]], color: 0xdd2222, type: 'artery' },
    // Coronary flow (yellow)
    { pts: [[-0.1, 0.75, 0.55], [-0.4, 0.35, 0.62], [-0.55, -0.4, 0.5]], color: 0xf39c12, type: 'coronary' },
  ];

  paths.forEach((path, pi) => {
    const pts = path.pts.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(pts);
    // Stagger particles along each path
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.028, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: path.color,
        emissive: path.color,
        emissiveIntensity: 0.7,
        roughness: 0.3, metalness: 0.1,
        transparent: true, opacity: 0.85
      });
      const mesh = new THREE.Mesh(geo, mat);
      const t = (i / 12);
      const pos = curve.getPoint(t);
      mesh.position.copy(pos);
      scene.add(mesh);
      bloodParticles.push({
        mesh, curve,
        t: t,
        speed: 0.004 + Math.random() * 0.003,
        type: path.type,
        pathIdx: pi
      });
    }
  });
}

// ─── LABELS ──────────────────────────────────────────────────
function buildLabels() {
  labelSprites = [];
  const labelDefs = [
    { text: 'Left Ventricle', pos: [-0.55, -0.55, 0.9] },
    { text: 'Right Ventricle', pos: [0.75, -0.45, 0.85] },
    { text: 'Left Atrium', pos: [-0.6, 0.85, 0.7] },
    { text: 'Right Atrium', pos: [1.0, 0.8, 0.6] },
    { text: 'Aorta', pos: [-0.85, 1.65, 0] },
    { text: 'Pulmonary Artery', pos: [0.6, 1.2, 0.5] },
    { text: 'Vena Cava', pos: [1.1, 1.4, 0] },
    { text: 'Coronary Arteries', pos: [-0.5, -0.3, 0.95] },
  ];

  labelDefs.forEach(def => {
    const sprite = createTextSprite(def.text);
    sprite.position.set(...def.pos);
    sprite.name = 'label';
    scene.add(sprite);
    labelSprites.push(sprite);
  });
}

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10,12,16,0.75)';
  roundRect(ctx, 0, 0, 256, 64, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0, 0, 256, 64, 12);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.22, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── BACKGROUND DUST ─────────────────────────────────────────
function addBackgroundDust() {
  const geo = new THREE.BufferGeometry();
  const count = 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 14;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x331111, size: 0.04, transparent: true, opacity: 0.4 });
  scene.add(new THREE.Points(geo, mat));
}

// ─── ANIMATION ───────────────────────────────────────────────
function animate() {
  animFrameId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Beat timing
  const beatInterval = 60 / currentBPM;
  beatTimer += delta;

  const beatProgress = (beatTimer % beatInterval) / beatInterval;
  // Systole: 0–0.35, Diastole: 0.35–1.0
  const isSysteme = beatProgress < 0.35;

  // Update phase display
  if (isSysteme !== phaseIsSysteme) {
    phaseIsSysteme = isSysteme;
    updatePhase(isSysteme);
    if (!isSysteme) {
      // New beat triggered
      beatCount++;
      flashBeat();
      updateJourneyStep();
    }
  }

  // Heartbeat scale animation
  if (isBeating && heartGroup) {
    let scale;
    if (isSysteme) {
      // Systole — contract (gets smaller as it squeezes out blood)
      const t = beatProgress / 0.35;
      scale = 1.0 - 0.06 * Math.sin(t * Math.PI);
    } else {
      // Diastole — relax and fill (slightly larger)
      const t = (beatProgress - 0.35) / 0.65;
      scale = 0.94 + 0.06 * (1 - Math.exp(-t * 4));
    }
    heartGroup.scale.setScalar(scale);

    // Slight rotation drift (natural anatomical movement)
    heartGroup.rotation.y = elapsed * 0.12;
    heartGroup.rotation.x = Math.sin(elapsed * 0.08) * 0.04;
  }

  // Valve animation
  animateValves(beatProgress);

  // Blood particles
  if (showBlood) animateBloodParticles(delta);

  // Camera orbit from drag
  updateCamera();

  // Update today's beat count in stat
  totalBeatsToday = Math.floor(beatCount + elapsed / (60 / currentBPM));
  document.getElementById('stat-beats').textContent = formatNum(currentBPM * 60 * 24);

  renderer.render(scene, camera);
}

function animateValves(beatProgress) {
  // Open/close valves in sync with cardiac cycle
  // Systole: AV valves (mitral, tricuspid) close; Semilunar (aortic, pulm) open
  const avOpen = beatProgress > 0.35; // open during diastole
  const slOpen = beatProgress < 0.35; // open during systole

  const valveScale = (open) => open ? 0.7 : 1.0;
  if (heartObjects.mitral_valve) heartObjects.mitral_valve.scale.setScalar(valveScale(avOpen));
  if (heartObjects.tricuspid_valve) heartObjects.tricuspid_valve.scale.setScalar(valveScale(avOpen));
  if (heartObjects.aortic_valve) heartObjects.aortic_valve.scale.setScalar(valveScale(slOpen));
  if (heartObjects.pulmonary_valve) heartObjects.pulmonary_valve.scale.setScalar(valveScale(slOpen));
}

function animateBloodParticles(delta) {
  const speedMult = currentBPM / 75;
  bloodParticles.forEach(bp => {
    // Only show arteries/veins based on toggles
    if (bp.type === 'artery' && !document.getElementById('tog-arteries').checked) {
      bp.mesh.visible = false; return;
    }
    if (bp.type === 'vein' && !document.getElementById('tog-veins').checked) {
      bp.mesh.visible = false; return;
    }
    if (bp.type === 'coronary' && !document.getElementById('tog-coronary').checked) {
      bp.mesh.visible = false; return;
    }
    bp.mesh.visible = true;
    bp.t += bp.speed * speedMult * delta * 60;
    if (bp.t > 1) bp.t -= 1;
    const pos = bp.curve.getPoint(bp.t);
    bp.mesh.position.copy(pos);
  });
}

function updateCamera() {
  const x = cameraRadius * Math.sin(sphericalAngle.phi) * Math.sin(sphericalAngle.theta);
  const y = cameraRadius * Math.cos(sphericalAngle.phi);
  const z = cameraRadius * Math.sin(sphericalAngle.phi) * Math.cos(sphericalAngle.theta);
  camera.position.set(x, y, z);
  camera.lookAt(0, 0.1, 0);
}

function updatePhase(systole) {
  const name = document.getElementById('phase-name');
  const desc = document.getElementById('phase-desc');
  const stat = document.getElementById('stat-phase');
  if (systole) {
    name.textContent = 'Systole';
    name.style.color = '#e03a3a';
    desc.textContent = 'Heart contracts — pumping blood out!';
    stat.textContent = 'Systole';
  } else {
    name.textContent = 'Diastole';
    name.style.color = '#3498db';
    desc.textContent = 'Heart relaxes & fills with blood';
    stat.textContent = 'Diastole';
  }
}

function flashBeat() {
  const ind = document.getElementById('beat-indicator');
  if (!ind) return;
  ind.classList.add('pulse');
  setTimeout(() => ind.classList.remove('pulse'), 120);
}

// ─── JOURNEY ANIMATION ───────────────────────────────────────
function startJourneyAnimation() {
  setInterval(() => {
    journeyStep = (journeyStep + 1) % 7;
    document.querySelectorAll('.journey-step').forEach((el, i) => {
      el.classList.toggle('active', i === journeyStep);
    });
  }, 3500);
}

function updateJourneyStep() {
  // Already handled by interval
}

// ─── EVENTS ──────────────────────────────────────────────────
function setupEvents() {
  const canvas = document.getElementById('heart-canvas');

  // Mouse drag to rotate
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    sphericalAngle.theta -= dx * 0.01;
    sphericalAngle.phi = Math.max(0.2, Math.min(Math.PI - 0.2, sphericalAngle.phi + dy * 0.01));
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  // Touch drag
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchStartDistance = 0;
    } else if (e.touches.length >= 2) {
      isDragging = false;
      touchStartDistance = getTouchDistance(e.touches);
      touchStartRadius = cameraRadius;
    }
  }, { passive: false });
  window.addEventListener('touchend', () => isDragging = false);
  window.addEventListener('touchmove', e => {
    if (e.touches.length >= 2) {
      const currentDistance = getTouchDistance(e.touches);
      if (touchStartDistance > 0 && currentDistance > 0) {
        const scale = touchStartDistance / currentDistance;
        cameraRadius = Math.max(2, Math.min(10, touchStartRadius * scale));
      }
      e.preventDefault();
      return;
    }

    if (!isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    sphericalAngle.theta -= dx * 0.012;
    sphericalAngle.phi = Math.max(0.2, Math.min(Math.PI - 0.2, sphericalAngle.phi + dy * 0.012));
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }, { passive: false });

  // Scroll zoom
  canvas.addEventListener('wheel', e => {
    cameraRadius = Math.max(2, Math.min(10, cameraRadius + e.deltaY * 0.005));
    e.preventDefault();
  }, { passive: false });

  // Click to identify part
  canvas.addEventListener('click', e => {
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(heartGroup.children, true);
    if (hits.length > 0) {
      // Find first clickable hit
      let hit = null;
      for (const h of hits) {
        let obj = h.object;
        while (obj) {
          if (obj.userData && obj.userData.clickable && obj.userData.partId) {
            hit = obj.userData.partId;
            break;
          }
          obj = obj.parent;
        }
        if (hit) break;
      }
      if (hit && PART_INFO[hit]) {
        showPartInfo(hit);
        highlightPart(hit);
      }
    }
  });

  // BPM Slider
  const bpmSlider = document.getElementById('bpm-slider');
  bpmSlider.addEventListener('input', () => {
    currentBPM = parseInt(bpmSlider.value);
    document.getElementById('bpm-val').textContent = currentBPM;
    updateStatsBPM(currentBPM);
  });

  // View buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      setViewMode(currentView);
    });
  });

  // Header buttons
  document.getElementById('btn-labels').addEventListener('click', function () {
    showLabels = !showLabels;
    this.classList.toggle('active', showLabels);
    labelSprites.forEach(s => s.visible = showLabels);
  });

  document.getElementById('btn-xray').addEventListener('click', function () {
    xrayMode = !xrayMode;
    this.classList.toggle('active', xrayMode);
    setXRayMode(xrayMode);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    isDragging = false;
    touchStartDistance = 0;
    touchStartRadius = 0;
    sphericalAngle = { theta: 0.3, phi: Math.PI / 2 };
    cameraRadius = getDefaultCameraRadius();
    heartGroup.rotation.set(0, 0, 0);
    currentView = 'full';
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === 'full');
    });
    setViewMode('full');
    xrayMode = false;
    const xrayButton = document.getElementById('btn-xray');
    if (xrayButton) xrayButton.classList.remove('active');
    setXRayMode(false);
  });

  // Blood/beat toggles
  document.getElementById('tog-blood').addEventListener('change', e => {
    showBlood = e.target.checked;
    bloodParticles.forEach(bp => { bp.mesh.visible = showBlood; });
  });
  document.getElementById('tog-beat').addEventListener('change', e => {
    isBeating = e.target.checked;
    if (!isBeating && heartGroup) heartGroup.scale.setScalar(1);
  });

  // Glossary terms
  document.querySelectorAll('.glos-term').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('glos-popup-title').textContent = el.textContent;
      document.getElementById('glos-popup-def').textContent = el.dataset.def;
      document.getElementById('glos-popup').style.display = 'flex';
    });
  });
  document.getElementById('glos-close').addEventListener('click', () => {
    document.getElementById('glos-popup').style.display = 'none';
  });
  document.getElementById('glos-popup').addEventListener('click', e => {
    if (e.target === document.getElementById('glos-popup'))
      document.getElementById('glos-popup').style.display = 'none';
  });
}

function showPartInfo(partId) {
  const info = PART_INFO[partId];
  if (!info) return;
  document.getElementById('info-icon').textContent = info.icon;
  document.getElementById('info-title').textContent = info.title;
  document.getElementById('info-text').textContent = info.text;
  const badge = document.getElementById('info-badge');
  badge.style.display = 'inline-block';
  badge.textContent = info.badge;
  badge.style.background = info.badgeColor + '33';
  badge.style.color = info.badgeColor;
  badge.style.border = `1px solid ${info.badgeColor}66`;
}

const HIGHLIGHT_CENTERS = {
  left_ventricle: [-0.18, -0.6, 0],
  right_ventricle: [0.42, -0.35, 0],
  left_atrium: [-0.3, 0.65, -0.1],
  right_atrium: [0.6, 0.55, -0.05],
  aorta: [-0.65, 1.1, 0],
};

function highlightPart(partId) {
  // Since the chambers now live inside the single smooth shell (rather
  // than being separate visible blobs), we highlight by pulsing a soft
  // glow at that chamber's location instead of flashing a hidden mesh.
  const c = HIGHLIGHT_CENTERS[partId];
  if (!c || !heartGroup) return;
  const glowGeo = new THREE.SphereGeometry(0.42, 20, 20);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(c[0], c[1], c[2]);
  heartGroup.add(glow);

  const start = performance.now();
  const dur = 500;
  (function step() {
    const t = (performance.now() - start) / dur;
    if (t >= 1) {
      heartGroup.remove(glow);
      glow.geometry.dispose();
      glow.material.dispose();
      return;
    }
    glow.scale.setScalar(1 + t * 0.9);
    glowMat.opacity = 0.45 * (1 - t);
    requestAnimationFrame(step);
  })();
}

function setViewMode(mode) {
  if (!heartGroup) return;
  // Reset opacity for all
  heartGroup.traverse(obj => {
    if (obj.material) {
      obj.material.opacity = obj.material._baseOpacity || obj.material.opacity;
    }
  });

  switch (mode) {
    case 'cross':
      // Show cross-section by clipping top-left
      heartGroup.traverse(obj => {
        if (obj.isMesh && obj.material) {
          obj.material.transparent = true;
          obj.material.opacity = 0.35;
          obj.material.side = THREE.DoubleSide;
        }
      });
      break;
    case 'chambers':
      // Emphasise chambers, fade vessels
      heartGroup.traverse(obj => {
        if (!obj.isMesh) return;
        const name = obj.name;
        if (name && (name.includes('ventricle') || name.includes('atrium') || name.includes('_ventricle') || name.includes('_atrium'))) {
          if (obj.material) { obj.material.transparent = false; obj.material.opacity = 1; }
        } else if (obj.name !== 'pericardium') {
          if (obj.material) { obj.material.transparent = true; obj.material.opacity = 0.12; }
        }
      });
      break;
    case 'valves':
      heartGroup.traverse(obj => {
        if (!obj.isMesh) return;
        if (obj.parent && (obj.parent.name && obj.parent.name.includes('valve'))) {
          if (obj.material) { obj.material.transparent = false; obj.material.opacity = 1; obj.material.emissiveIntensity = 0.6; }
        } else {
          if (obj.material) { obj.material.transparent = true; obj.material.opacity = 0.1; }
        }
      });
      break;
    case 'vessels':
      heartGroup.traverse(obj => {
        if (!obj.isMesh) return;
        const name = obj.name || '';
        if (name.includes('aorta') || name.includes('vena') || name.includes('pulmonary') || name.includes('coronary')) {
          if (obj.material) { obj.material.transparent = false; obj.material.opacity = 1; }
        } else {
          if (obj.material) { obj.material.transparent = true; obj.material.opacity = 0.08; }
        }
      });
      break;
    case 'full':
    default:
      heartGroup.traverse(obj => {
        if (obj.isMesh && obj.material) {
          const baseOp = obj.material.name === 'pericardium' ? 0.06 : (obj.material._origOpacity || 1);
          obj.material.transparent = baseOp < 1;
          obj.material.opacity = baseOp;
        }
      });
      break;
  }
}

function setXRayMode(on) {
  heartGroup.traverse(obj => {
    if (!obj.isMesh) return;
    if (obj.material) {
      obj.material.transparent = true;
      obj.material.opacity = on ? 0.22 : (obj.name === 'pericardium' ? 0.06 : 1.0);
      obj.material.wireframe = false;
    }
  });
}

// ─── STATS ───────────────────────────────────────────────────
function updateStatsBPM(bpm) {
  document.getElementById('stat-bpm').textContent = bpm;
  document.getElementById('bpm-val').textContent = bpm;
  const output = (bpm / 75 * 5.2).toFixed(1);
  document.getElementById('stat-output').textContent = output;
  document.getElementById('stat-beats').textContent = formatNum(bpm * 60 * 24);

  const label = document.getElementById('bpm-label');
  if (bpm < 60) label.textContent = '🔵 Bradycardia (too slow)';
  else if (bpm <= 100) label.textContent = '🟢 Normal Resting Heart Rate';
  else if (bpm <= 150) label.textContent = '🟡 Elevated (like exercising)';
  else label.textContent = '🔴 Tachycardia (very fast)';
}

function formatNum(n) {
  return Math.round(n).toLocaleString();
}

// Expose for HTML onclick
window.setViewMode = setViewMode;
