import * as THREE from "./three.module.js";
import { GLTFLoader } from "./GLTFLoader.js";


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x32465f);
scene.fog = new THREE.Fog(0x32465f, 22, 78);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  140
);
const ARENA_FLOOR_Y = -0.16;
const ARENA_SURFACE_Y = 0;
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.24;
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xd6e6ff, 0x44566a, 0.95);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff3d8, 1.7);
sun.position.set(9, 16, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
scene.add(sun);

function createArenaFloorTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, "#7f8898");
  base.addColorStop(1, "#5f6878");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const tile = 64;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const shade = 92 + ((x / tile + y / tile) % 2) * 12;
      ctx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 14})`;
      ctx.fillRect(x, y, tile, tile);
      ctx.strokeStyle = "rgba(40,45,54,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
    }
  }

  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = Math.random() * Math.PI * 2;
    const len = 4 + Math.random() * 12;
    ctx.strokeStyle = `rgba(30, 34, 40, ${0.06 + Math.random() * 0.08})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 2.2);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createPillarTexture() {
  const width = 256;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "#8e9198");
  grad.addColorStop(0.5, "#a7aab1");
  grad.addColorStop(1, "#7e828a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 96) {
    ctx.strokeStyle = "rgba(56,60,68,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y + 10);
    ctx.lineTo(width, y + 10);
    ctx.stroke();
  }

  for (let i = 0; i < 700; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 8 + Math.random() * 18;
    ctx.strokeStyle = `rgba(70,74,82,${0.08 + Math.random() * 0.09})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, y + len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1.6);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

const arenaFloorTexture = createArenaFloorTexture();
const pillarTexture = createPillarTexture();

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(17, 17.5, 0.3, 36),
  new THREE.MeshStandardMaterial({
    map: arenaFloorTexture,
    color: 0xc8cfdb,
    roughness: 0.92,
    metalness: 0.03,
  })
);
ground.position.y = ARENA_FLOOR_Y;
ground.receiveShadow = true;
scene.add(ground);

const runeRing = new THREE.Mesh(
  new THREE.TorusGeometry(16.2, 0.08, 8, 64),
  new THREE.MeshStandardMaterial({
    color: 0x96bfff,
    emissive: 0x24477d,
    emissiveIntensity: 0.7,
    roughness: 0.4,
    metalness: 0.2,
  })
);
runeRing.rotation.x = Math.PI / 2;
runeRing.position.y = 0.03;
scene.add(runeRing);

const arenaColumns = new THREE.Group();
const arenaPillars = [];
const occluderMeshes = [];
const pillarGeo = new THREE.CylinderGeometry(0.52, 0.62, 3.8, 8);
const pillarMat = new THREE.MeshStandardMaterial({
  map: pillarTexture,
  color: 0xb8bec9,
  roughness: 0.82,
  metalness: 0.06,
});
for (let i = 0; i < 10; i += 1) {
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.material = pillarMat.clone();
  pillar.material.transparent = true;
  pillar.material.opacity = 1;
  const angle = (i / 10) * Math.PI * 2;
  pillar.position.set(Math.sin(angle) * 15.4, 1.9, Math.cos(angle) * 15.4);
  pillar.castShadow = false;
  pillar.receiveShadow = true;
  arenaPillars.push(pillar);
  occluderMeshes.push(pillar);
  arenaColumns.add(pillar);
}
scene.add(arenaColumns);

const arenaWall = new THREE.Mesh(
  new THREE.CylinderGeometry(20.2, 20.8, 6.4, 40, 1, true),
  new THREE.MeshStandardMaterial({
    color: 0x7c8089,
    roughness: 0.88,
    metalness: 0.06,
    side: THREE.DoubleSide,
  })
);
arenaWall.position.y = 2.8;
arenaWall.material.transparent = true;
arenaWall.material.opacity = 1;
arenaWall.receiveShadow = true;
scene.add(arenaWall);
occluderMeshes.push(arenaWall);

const innerTrim = new THREE.Mesh(
  new THREE.TorusGeometry(19.5, 0.16, 10, 64),
  new THREE.MeshStandardMaterial({
    color: 0xd2b46f,
    roughness: 0.5,
    metalness: 0.35,
    emissive: 0x463719,
    emissiveIntensity: 0.15,
  })
);
innerTrim.rotation.x = Math.PI / 2;
innerTrim.position.y = 0.2;
scene.add(innerTrim);

const stands = new THREE.Group();
for (let i = 0; i < 4; i += 1) {
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(19 + i * 1.25, 19.6 + i * 1.25, 0.65, 36, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x6a707a,
      roughness: 0.86,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  );
  stand.position.y = 0.45 + i * 0.68;
  stand.receiveShadow = true;
  stands.add(stand);
}
scene.add(stands);

const bannerGroup = new THREE.Group();
for (let i = 0; i < 8; i += 1) {
  const angle = (i / 8) * Math.PI * 2;
  const x = Math.sin(angle) * 18.6;
  const z = Math.cos(angle) * 18.6;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8),
    new THREE.MeshStandardMaterial({
      color: 0xc9a869,
      roughness: 0.35,
      metalness: 0.62,
    })
  );
  pole.position.set(x, 4.7, z);
  pole.castShadow = true;
  bannerGroup.add(pole);

  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.8),
    new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0x942f2f : 0x2d4f8e,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );
  cloth.position.set(x, 3.9, z);
  cloth.lookAt(0, 3.9, 0);
  cloth.castShadow = false;
  bannerGroup.add(cloth);
}
scene.add(bannerGroup);

const slamRangeIndicator = new THREE.Mesh(
  new THREE.RingGeometry(2.95, 3.25, 48),
  new THREE.MeshBasicMaterial({
    color: 0xff5b5b,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
slamRangeIndicator.rotation.x = -Math.PI / 2;
slamRangeIndicator.position.y = 0.045;
slamRangeIndicator.visible = false;
scene.add(slamRangeIndicator);

const chargeLaneIndicator = new THREE.Mesh(
  new THREE.PlaneGeometry(1.8, 1),
  new THREE.MeshBasicMaterial({
    color: 0xff9248,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
chargeLaneIndicator.rotation.x = -Math.PI / 2;
chargeLaneIndicator.position.y = 0.05;
chargeLaneIndicator.visible = false;
scene.add(chargeLaneIndicator);

const slamImpactRing = new THREE.Mesh(
  new THREE.RingGeometry(0.55, 0.88, 40),
  new THREE.MeshBasicMaterial({
    color: 0xffb37f,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
slamImpactRing.rotation.x = -Math.PI / 2;
slamImpactRing.position.y = 0.052;
slamImpactRing.visible = false;
scene.add(slamImpactRing);

const hudHeroHp = document.getElementById("hero-hp");
const hudMinotaurHp = document.getElementById("minotaur-hp");
const statusEl = document.getElementById("status");

const outcomeOverlay = document.createElement("div");
outcomeOverlay.style.position = "fixed";
outcomeOverlay.style.inset = "0";
outcomeOverlay.style.pointerEvents = "none";
outcomeOverlay.style.opacity = "0";
outcomeOverlay.style.transition = "opacity 260ms ease";
outcomeOverlay.style.background =
  "radial-gradient(circle at center, rgba(255,255,255,0.0) 0%, rgba(10,14,18,0.0) 60%, rgba(0,0,0,0.0) 100%)";
outcomeOverlay.style.zIndex = "12";
document.body.appendChild(outcomeOverlay);

const outcomeText = document.createElement("div");
outcomeText.style.position = "fixed";
outcomeText.style.left = "50%";
outcomeText.style.top = "38%";
outcomeText.style.transform = "translate(-50%, -50%) scale(0.9)";
outcomeText.style.fontFamily = "Georgia, serif";
outcomeText.style.fontSize = "56px";
outcomeText.style.fontWeight = "700";
outcomeText.style.letterSpacing = "0.1em";
outcomeText.style.color = "#ffffff";
outcomeText.style.textShadow = "0 0 18px rgba(255,255,255,0.3)";
outcomeText.style.opacity = "0";
outcomeText.style.transition = "opacity 300ms ease, transform 300ms ease";
outcomeText.style.pointerEvents = "none";
outcomeText.style.zIndex = "13";
document.body.appendChild(outcomeText);

const warningBanner = document.createElement("div");
warningBanner.style.position = "fixed";
warningBanner.style.left = "50%";
warningBanner.style.top = "14%";
warningBanner.style.transform = "translate(-50%, -50%) scale(0.92)";
warningBanner.style.padding = "10px 18px";
warningBanner.style.border = "2px solid rgba(255,210,120,0.9)";
warningBanner.style.background = "rgba(24,14,10,0.82)";
warningBanner.style.color = "#ffe9c6";
warningBanner.style.fontFamily = "Georgia, serif";
warningBanner.style.fontSize = "22px";
warningBanner.style.fontWeight = "700";
warningBanner.style.letterSpacing = "0.04em";
warningBanner.style.textShadow = "0 0 10px rgba(255,180,120,0.35)";
warningBanner.style.opacity = "0";
warningBanner.style.transition = "opacity 120ms linear, transform 140ms ease";
warningBanner.style.pointerEvents = "none";
warningBanner.style.zIndex = "16";
warningBanner.textContent = "";
document.body.appendChild(warningBanner);

const hitFlash = document.createElement("div");
hitFlash.style.position = "fixed";
hitFlash.style.inset = "0";
hitFlash.style.pointerEvents = "none";
hitFlash.style.opacity = "0";
hitFlash.style.background = "rgba(255,255,255,0.0)";
hitFlash.style.transition = "opacity 80ms linear";
hitFlash.style.zIndex = "14";
document.body.appendChild(hitFlash);

const fxCanvas = document.createElement("canvas");
fxCanvas.style.position = "fixed";
fxCanvas.style.inset = "0";
fxCanvas.style.pointerEvents = "none";
fxCanvas.style.zIndex = "15";
document.body.appendChild(fxCanvas);
const fxCtx = fxCanvas.getContext("2d");

function createDebugRing(color) {
  return new THREE.Mesh(
    new THREE.RingGeometry(0.98, 1.02, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
}

const heroColliderDebug = createDebugRing(0x67d0ff);
heroColliderDebug.rotation.x = -Math.PI / 2;
heroColliderDebug.position.y = 0.08;
heroColliderDebug.visible = false;
scene.add(heroColliderDebug);

const minotaurColliderDebug = createDebugRing(0xff975f);
minotaurColliderDebug.rotation.x = -Math.PI / 2;
minotaurColliderDebug.position.y = 0.08;
minotaurColliderDebug.visible = false;
scene.add(minotaurColliderDebug);

const debugDistanceLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78 })
);
debugDistanceLine.visible = false;
scene.add(debugDistanceLine);

const debugForwardArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(),
  1.4,
  0xffe16f,
  0.35,
  0.2
);
debugForwardArrow.visible = false;
scene.add(debugForwardArrow);

const debugPanel = document.createElement("div");
debugPanel.style.position = "fixed";
debugPanel.style.right = "14px";
debugPanel.style.bottom = "14px";
debugPanel.style.padding = "8px 10px";
debugPanel.style.border = "1px solid rgba(120,170,220,0.75)";
debugPanel.style.borderRadius = "6px";
debugPanel.style.background = "rgba(8,14,22,0.82)";
debugPanel.style.color = "#e8f6ff";
debugPanel.style.fontFamily = "monospace";
debugPanel.style.fontSize = "12px";
debugPanel.style.lineHeight = "1.35";
debugPanel.style.whiteSpace = "pre";
debugPanel.style.pointerEvents = "none";
debugPanel.style.zIndex = "20";
debugPanel.style.display = "none";
document.body.appendChild(debugPanel);

const keyState = Object.create(null);
let attackQueued = false;
let heavyAttackQueued = false;
let jumpQueued = false;
let mouseLeftDown = false;
let mouseLeftDownAt = 0;
let outcomeState = "none";
let outcomePulse = 0;
let previousOutcomeState = "none";
let hitFlashAlpha = 0;
let cameraShakeTime = 0;
let cameraShakeStrength = 0;
let hitStopTimer = 0;
let slamShockwaveTimer = 0;
let debugViewEnabled = false;

let audioCtx = null;
let audioMaster = null;
let audioMusicGain = null;
let audioSfxGain = null;
let musicStarted = false;
let musicStep = 0;
let musicIntervalId = null;
const MUSIC_GAIN_TARGET = 0.85;
const MAX_FX_PARTICLES = 220;
const HEAVY_HOLD_THRESHOLD = 0.38;
const HERO_REFERENCE_HEIGHT = 1.45;
const HERO_MODEL_YAW_OFFSET = 0;
const HERO_TARGET_WORLD_HEIGHT = 0.68;
const HERO_VISUAL_GROUND_BIAS = -0.045;
const MINOTAUR_MODEL_YAW_OFFSET = 0;
const MINOTAUR_TARGET_WORLD_HEIGHT = 2.25;
const MINOTAUR_VISUAL_GROUND_BIAS = 0.015;
const HERO_CAMERA_SCALE = 1;
const CAMERA_THIRD_PERSON_DISTANCE = 8.8;
const CAMERA_THIRD_PERSON_HEIGHT = 3.8;
const CAMERA_THIRD_PERSON_SIDE = 0;
const CAMERA_THIRD_PERSON_LOOK_HEIGHT = 0.72;
const HERO_COLLIDER_RADIUS = 0.18;
const MINOTAUR_COLLIDER_RADIUS = 0.34;
const HERO_LIGHT_ATTACK_EDGE_RANGE = 0.24;
const HERO_HEAVY_ATTACK_EDGE_RANGE = 0.5;
const MINOTAUR_ATTACK_EDGE_RANGE = 0.28;
const MINOTAUR_CHARGE_EDGE_RANGE = 0.32;
const MINOTAUR_SLAM_EDGE_RANGE = 0.72;
const DEBUG_TOGGLE_KEY = "F3";

const HERO_MESHY_ASSETS = {
  idle: "./assets/Meshy_AI_biped/Meshy_AI_Animation_Idle_withSkin.glb",
  run: "./assets/Meshy_AI_biped/Meshy_AI_Animation_Running_withSkin.glb",
  walk: "./assets/Meshy_AI_biped/Meshy_AI_Animation_Walking_withSkin.glb",
  heavyAttack: "./assets/Meshy_AI_biped/Meshy_AI_Animation_Attack_withSkin.glb",
  dead: "./assets/Meshy_AI_biped/Meshy_AI_Animation_Dead_withSkin.glb",
};

const MINOTAUR_MESHY_ASSETS = {
  idle: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Slow_Orc_Walk_withSkin.glb",
  run: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Running_withSkin.glb",
  walk: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Walking_withSkin.glb",
  attack: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Attack_withSkin.glb",
  combo: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Triple_Combo_Attack_withSkin.glb",
  slam: "./assets/minotaur_meshy/Meshy_AI_biped/Meshy_AI_Animation_Skill_01_withSkin.glb",
};

const gltfLoader = new GLTFLoader();
const tmpQuatA = new THREE.Quaternion();
const tmpEulerA = new THREE.Euler();

const fxParticles = [];
let winFireworkTimer = 0;
let loseDriftTimer = 0;

window.addEventListener("keydown", (event) => {
  ensureAudio();
  if (event.code === DEBUG_TOGGLE_KEY) {
    debugViewEnabled = !debugViewEnabled;
    return;
  }
  keyState[event.code] = true;
  if (event.code === "KeyJ") {
    attackQueued = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    jumpQueued = true;
  }
  if (event.code === "KeyR") {
    resetBattle();
  }
});

window.addEventListener("keyup", (event) => {
  keyState[event.code] = false;
});

window.addEventListener("mousedown", (event) => {
  ensureAudio();
  if (event.button === 0) {
    mouseLeftDown = true;
    mouseLeftDownAt = performance.now();
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button !== 0 || !mouseLeftDown) {
    return;
  }

  const holdMs = performance.now() - mouseLeftDownAt;
  if (holdMs >= HEAVY_HOLD_THRESHOLD * 1000) {
    heavyAttackQueued = true;
  } else {
    attackQueued = true;
  }
  mouseLeftDown = false;
});

window.addEventListener("blur", () => {
  mouseLeftDown = false;
});

window.addEventListener("touchstart", () => {
  ensureAudio();
}, { passive: true });

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const tmpVecC = new THREE.Vector3();
const tmpVecD = new THREE.Vector3();
const tmpGroundBox = new THREE.Box3();
const occlusionRaycaster = new THREE.Raycaster();
const upAxis = new THREE.Vector3(0, 1, 0);
const moveInput = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraDesiredPosition = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();
const toEnemyFlat = new THREE.Vector3();
const CAMERA_MAX_RADIUS = 30.0;

function clampVectorXZ(vec, maxRadius) {
  const lenSq = vec.x * vec.x + vec.z * vec.z;
  const maxSq = maxRadius * maxRadius;
  if (lenSq <= maxSq) {
    return;
  }
  const len = Math.sqrt(lenSq);
  const scale = maxRadius / len;
  vec.x *= scale;
  vec.z *= scale;
}

function getEdgeDistanceBetweenFighters(directionOut) {
  directionOut.subVectors(minotaur.mesh.position, hero.mesh.position);
  directionOut.y = 0;
  const centerDistance = directionOut.length();
  if (centerDistance > 1e-6) {
    directionOut.multiplyScalar(1 / centerDistance);
  } else {
    directionOut.set(0, 0, 1);
  }
  const edgeDistance = centerDistance - (hero.colliderRadius + minotaur.colliderRadius);
  return { centerDistance, edgeDistance };
}

function resolveCharacterSeparation() {
  tmpVecA.subVectors(hero.mesh.position, minotaur.mesh.position);
  tmpVecA.y = 0;
  let centerDistance = tmpVecA.length();
  if (centerDistance < 1e-6) {
    tmpVecA.set(1, 0, 0);
    centerDistance = 0;
  } else {
    tmpVecA.multiplyScalar(1 / centerDistance);
  }

  const minDistance = HERO_COLLIDER_RADIUS + MINOTAUR_COLLIDER_RADIUS;
  if (centerDistance >= minDistance - 0.04) {
    return;
  }

  const overlap = Math.min(0.05, minDistance - centerDistance);
  const heroPushWeight = hero.dead ? 0 : minotaur.dead ? 1 : 0.58;
  const minotaurPushWeight = 1 - heroPushWeight;

  hero.mesh.position.addScaledVector(tmpVecA, overlap * heroPushWeight);
  minotaur.mesh.position.addScaledVector(tmpVecA, -overlap * minotaurPushWeight);
  clampToArena(hero.mesh, 15.8);
  clampToArena(minotaur.mesh, 15.4);
}

function resizeFxCanvas() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}

resizeFxCanvas();

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  audioCtx = new AudioContextClass();
  audioMaster = audioCtx.createGain();
  audioMaster.gain.value = 0.6;
  audioMaster.connect(audioCtx.destination);

  audioMusicGain = audioCtx.createGain();
  audioMusicGain.gain.value = MUSIC_GAIN_TARGET;
  audioMusicGain.connect(audioMaster);

  audioSfxGain = audioCtx.createGain();
  audioSfxGain.gain.value = 1.0;
  audioSfxGain.connect(audioMaster);

  if (!musicStarted) {
    startBackgroundMusic();
  }
}

function playTone(frequency, startAt, duration, volume, type) {
  if (!audioCtx || !audioSfxGain) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(audioSfxGain);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.03);
}

function playNoiseBurst(startAt, duration, volume) {
  if (!audioCtx || !audioSfxGain) {
    return;
  }

  const sampleRate = audioCtx.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
  }

  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  filter.type = "highpass";
  filter.frequency.value = 680;
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioSfxGain);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

function playHitSound(isHeavy) {
  ensureAudio();
  if (!audioCtx) {
    return;
  }
  const now = audioCtx.currentTime;
  if (isHeavy) {
    playTone(110, now, 0.16, 0.42, "triangle");
    playTone(180, now + 0.008, 0.12, 0.3, "square");
    playTone(72, now, 0.2, 0.26, "sine");
    playNoiseBurst(now, 0.12, 0.34);
    return;
  }

  playTone(168, now, 0.11, 0.28, "triangle");
  playTone(262, now + 0.01, 0.08, 0.18, "square");
  playNoiseBurst(now, 0.07, 0.2);
}

function playOutcomeStinger(kind) {
  ensureAudio();
  if (!audioCtx) {
    return;
  }

  const now = audioCtx.currentTime;
  if (kind === "win") {
    playTone(392, now, 0.28, 0.14, "triangle");
    playTone(523.25, now + 0.14, 0.28, 0.14, "triangle");
    playTone(659.25, now + 0.28, 0.36, 0.18, "triangle");
    return;
  }

  playTone(220, now, 0.28, 0.13, "sawtooth");
  playTone(196, now + 0.16, 0.34, 0.13, "sawtooth");
  playTone(174.61, now + 0.36, 0.48, 0.14, "sawtooth");
}

function startBackgroundMusic() {
  if (!audioCtx || musicIntervalId !== null) {
    return;
  }
  musicStarted = true;
  const now = audioCtx.currentTime;
  audioMusicGain.gain.cancelScheduledValues(now);
  audioMusicGain.gain.setValueAtTime(Math.max(0.0001, audioMusicGain.gain.value), now);
  audioMusicGain.gain.exponentialRampToValueAtTime(MUSIC_GAIN_TARGET, now + 0.45);

  const melody = [261.63, 311.13, 392.0, 466.16, 523.25, 466.16, 392.0, 349.23];
  const bass = [98.0, 110.0, 87.31, 98.0, 123.47, 110.0, 98.0, 87.31];
  const stepDuration = 0.3;

  musicIntervalId = window.setInterval(() => {
    if (!audioCtx || !audioMusicGain) {
      return;
    }
    const now = audioCtx.currentTime;
    const note = melody[musicStep % melody.length];
    const bassNote = bass[musicStep % bass.length];

    const oscA = audioCtx.createOscillator();
    const oscB = audioCtx.createOscillator();
    const gainA = audioCtx.createGain();
    const gainB = audioCtx.createGain();

    oscA.type = "triangle";
    oscB.type = "sine";
    oscA.frequency.setValueAtTime(note, now);
    oscB.frequency.setValueAtTime(bassNote, now);

    gainA.gain.setValueAtTime(0.0001, now);
    gainA.gain.exponentialRampToValueAtTime(0.085, now + 0.04);
    gainA.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration);

    gainB.gain.setValueAtTime(0.0001, now);
    gainB.gain.exponentialRampToValueAtTime(0.055, now + 0.05);
    gainB.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration);

    oscA.connect(gainA);
    oscB.connect(gainB);
    gainA.connect(audioMusicGain);
    gainB.connect(audioMusicGain);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + stepDuration + 0.05);
    oscB.stop(now + stepDuration + 0.05);

    musicStep += 1;
  }, stepDuration * 1000);
}

function stopBackgroundMusic() {
  if (!audioCtx || !audioMusicGain) {
    return;
  }

  if (musicIntervalId !== null) {
    window.clearInterval(musicIntervalId);
    musicIntervalId = null;
  }

  const now = audioCtx.currentTime;
  audioMusicGain.gain.cancelScheduledValues(now);
  audioMusicGain.gain.setValueAtTime(Math.max(0.0001, audioMusicGain.gain.value), now);
  audioMusicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  musicStarted = false;
}

function triggerHitImpact(strength, flashColor) {
  hitStopTimer = Math.max(hitStopTimer, 0.045 + strength * 0.03);
  cameraShakeTime = Math.max(cameraShakeTime, 0.08 + strength * 0.05);
  cameraShakeStrength = Math.max(cameraShakeStrength, 0.08 + strength * 0.13);
  hitFlashAlpha = Math.max(hitFlashAlpha, 0.12 + strength * 0.28);
  hitFlash.style.background = flashColor;
}

function spawnFxParticle(x, y, vx, vy, life, size, color, gravity) {
  if (fxParticles.length >= MAX_FX_PARTICLES) {
    return;
  }
  fxParticles.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity: gravity || 0 });
}

function spawnVictoryBurst() {
  const cx = fxCanvas.width * 0.5 + (Math.random() - 0.5) * (fxCanvas.width * 0.38);
  const cy = fxCanvas.height * (0.28 + Math.random() * 0.24);
  const colors = ["#ffe785", "#ffd26e", "#fff1bf", "#8fd7ff"];
  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 38) * Math.PI * 2;
    const speed = 90 + Math.random() * 220;
    spawnFxParticle(
      cx,
      cy,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0.85 + Math.random() * 0.7,
      1.5 + Math.random() * 2.5,
      colors[i % colors.length],
      120
    );
  }
}

function spawnDefeatDrift() {
  const x = Math.random() * fxCanvas.width;
  const speed = 45 + Math.random() * 95;
  spawnFxParticle(
    x,
    -12,
    (Math.random() - 0.5) * 18,
    speed,
    1.8 + Math.random() * 1.4,
    1.5 + Math.random() * 1.5,
    "#8eb6d8",
    18
  );
}

function updateFxParticles(dt) {
  if (!fxCtx) {
    return;
  }
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

  for (let i = fxParticles.length - 1; i >= 0; i -= 1) {
    const p = fxParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      fxParticles.splice(i, 1);
      continue;
    }

    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const alpha = Math.max(0, p.life / p.maxLife);
    fxCtx.globalAlpha = alpha;
    fxCtx.fillStyle = p.color;
    fxCtx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
  }

  fxCtx.globalAlpha = 1;
}

function loadGlbAsset(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

function createRotationOnlyClip(clip) {
  if (!clip) {
    return null;
  }
  const cloned = clip.clone();
  cloned.tracks = cloned.tracks.filter((track) => !track.name.toLowerCase().endsWith(".position"));
  return cloned;
}

function findBoneByAliases(root, aliases) {
  let found = null;
  root.traverse((obj) => {
    if (found || !obj.isBone || !obj.name) {
      return;
    }
    const lowered = obj.name.toLowerCase();
    if (aliases.some((alias) => lowered.includes(alias))) {
      found = obj;
    }
  });
  return found;
}

function applyBoneOffset(bone, baseQuaternion, x, y, z) {
  if (!bone || !baseQuaternion) {
    return;
  }
  tmpEulerA.set(x, y, z, "XYZ");
  tmpQuatA.setFromEuler(tmpEulerA);
  bone.quaternion.copy(baseQuaternion).multiply(tmpQuatA);
}

function createHeroRuntimeSword() {
  const swordGroup = new THREE.Group();

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.9, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xf4f7ff,
      metalness: 0.78,
      roughness: 0.24,
      emissive: 0x1b2f52,
      emissiveIntensity: 0.08,
    })
  );
  blade.position.set(0, -0.48, 0);
  blade.castShadow = true;
  swordGroup.add(blade);

  const hilt = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.045, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x8c9bb6,
      roughness: 0.34,
      metalness: 0.56,
    })
  );
  hilt.position.set(0, -0.07, 0);
  hilt.castShadow = true;
  swordGroup.add(hilt);

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.22, 10),
    new THREE.MeshStandardMaterial({
      color: 0x2a2b33,
      roughness: 0.76,
      metalness: 0.12,
    })
  );
  grip.rotation.z = Math.PI * 0.5;
  grip.position.set(0, 0.03, 0);
  grip.castShadow = true;
  swordGroup.add(grip);

  return swordGroup;
}

function playHeroAction(actionName, options = {}) {
  if (!hero.model.enabled || !hero.model.actions[actionName]) {
    return;
  }

  const {
    fade = 0.12,
    restart = false,
    loop = THREE.LoopRepeat,
    repetitions = Infinity,
    clampWhenFinished = false,
    timeScale = 1,
  } = options;

  if (hero.model.currentAction === actionName && !restart) {
    const current = hero.model.actions[actionName];
    current.timeScale = timeScale;
    return;
  }

  Object.entries(hero.model.actions).forEach(([name, action]) => {
    if (!action) {
      return;
    }
    if (name === actionName) {
      return;
    }
    action.fadeOut(fade);
  });

  const next = hero.model.actions[actionName];
  if (restart) {
    next.reset();
  }
  next.enabled = true;
  next.setLoop(loop, repetitions);
  next.clampWhenFinished = clampWhenFinished;
  next.timeScale = timeScale;
  next.fadeIn(fade).play();
  hero.model.currentAction = actionName;
}

function playMinotaurAction(actionName, options = {}) {
  if (!minotaur.model.enabled || !minotaur.model.actions[actionName]) {
    return;
  }

  const {
    fade = 0.12,
    restart = false,
    loop = THREE.LoopRepeat,
    repetitions = Infinity,
    clampWhenFinished = false,
    timeScale = 1,
  } = options;

  if (minotaur.model.currentAction === actionName && !restart) {
    const current = minotaur.model.actions[actionName];
    current.timeScale = timeScale;
    return;
  }

  Object.entries(minotaur.model.actions).forEach(([name, action]) => {
    if (!action || name === actionName) {
      return;
    }
    action.fadeOut(fade);
  });

  const next = minotaur.model.actions[actionName];
  if (restart) {
    next.reset();
  }
  next.enabled = true;
  next.setLoop(loop, repetitions);
  next.clampWhenFinished = clampWhenFinished;
  next.timeScale = timeScale;
  next.fadeIn(fade).play();
  minotaur.model.currentAction = actionName;
}

function updateMinotaurModelAnimation() {
  if (!minotaur.model.enabled || !minotaur.model.mixer) {
    return;
  }

  if (minotaur.state === "dead") {
    if (minotaur.model.actions.idle) {
      playMinotaurAction("idle", { fade: 0.18, timeScale: 0.22 });
    }
    return;
  }

  if (minotaur.state === "attack") {
    const isNewAttack = minotaur.model.currentAction !== "attack";
    playMinotaurAction("attack", {
      fade: 0.09,
      restart: isNewAttack,
      loop: THREE.LoopOnce,
      clampWhenFinished: true,
      timeScale: 1,
    });
    return;
  }

  if (minotaur.state === "slam" || minotaur.state === "slam_windup") {
    const isNewSlam = minotaur.model.currentAction !== "slam";
    playMinotaurAction("slam", {
      fade: 0.1,
      restart: isNewSlam,
      loop: THREE.LoopOnce,
      clampWhenFinished: true,
      timeScale: minotaur.state === "slam_windup" ? 0.84 : 1.05,
    });
    return;
  }

  if (minotaur.state === "charge" || minotaur.state === "charge_windup" || minotaur.state === "run" || minotaur.state === "strafe") {
    playMinotaurAction("run", {
      fade: 0.12,
      timeScale: minotaur.state === "charge" ? 1.18 : 1.04,
    });
    return;
  }

  playMinotaurAction("idle", { fade: 0.14, timeScale: 0.55 });
}

function keepMinotaurModelGrounded() {
  if (!minotaur.model.enabled || !minotaur.model.visualRoot) {
    return;
  }

  const targetMinY = ARENA_SURFACE_Y + MINOTAUR_VISUAL_GROUND_BIAS;
  const bones = minotaur.model.bones;
  let currentMinY = Infinity;

  if (bones && (bones.leftFoot || bones.rightFoot)) {
    if (bones.leftFoot) {
      bones.leftFoot.getWorldPosition(tmpVecC);
      currentMinY = Math.min(currentMinY, tmpVecC.y);
    }
    if (bones.rightFoot) {
      bones.rightFoot.getWorldPosition(tmpVecD);
      currentMinY = Math.min(currentMinY, tmpVecD.y);
    }
  } else {
    tmpGroundBox.setFromObject(minotaur.model.visualRoot);
    currentMinY = tmpGroundBox.min.y;
  }

  if (!Number.isFinite(currentMinY)) {
    return;
  }

  const deltaY = targetMinY - currentMinY;
  if (Math.abs(deltaY) > 1e-5) {
    minotaur.model.visualRoot.position.y += deltaY;
  }
}

function recoverHeroProceduralBones(blendRate) {
  if (!hero.model.enabled || !hero.model.basePose || !hero.model.bones) {
    return;
  }

  Object.entries(hero.model.bones).forEach(([key, bone]) => {
    const base = hero.model.basePose[key];
    if (!bone || !base) {
      return;
    }
    bone.quaternion.slerp(base, Math.min(1, blendRate));
  });
}

function applyHeroShortAttackProcedural(progress) {
  if (!hero.model.enabled || !hero.model.basePose || !hero.model.bones) {
    return;
  }

  const windupEnd = 0.34;
  let torsoYaw;
  let torsoPitch;
  let armLift;
  let forearmLift;
  let handTwist;

  if (progress < windupEnd) {
    const t = progress / windupEnd;
    torsoYaw = -0.36 * t;
    torsoPitch = 0.08 * t;
    armLift = -1.28 * t;
    forearmLift = -0.74 * t;
    handTwist = -0.15 * t;
  } else {
    const t = Math.min(1, (progress - windupEnd) / (1 - windupEnd));
    torsoYaw = -0.36 + t * 0.9;
    torsoPitch = 0.08 - t * 0.14;
    armLift = -1.28 + t * 2.35;
    forearmLift = -0.74 + t * 1.45;
    handTwist = -0.15 + t * 0.42;
  }

  applyBoneOffset(
    hero.model.bones.spine,
    hero.model.basePose.spine,
    torsoPitch,
    torsoYaw,
    0
  );
  applyBoneOffset(
    hero.model.bones.chest,
    hero.model.basePose.chest,
    torsoPitch * 0.65,
    torsoYaw * 0.72,
    0
  );
  applyBoneOffset(
    hero.model.bones.rightUpperArm,
    hero.model.basePose.rightUpperArm,
    armLift,
    0.16,
    -0.22
  );
  applyBoneOffset(
    hero.model.bones.rightForeArm,
    hero.model.basePose.rightForeArm,
    forearmLift,
    0,
    0.12
  );
  applyBoneOffset(
    hero.model.bones.rightHand,
    hero.model.basePose.rightHand,
    0,
    0,
    handTwist
  );
}

function updateHeroModelAnimation(dt) {
  if (!hero.model.enabled || !hero.model.mixer) {
    return;
  }

  if (hero.state === "dead") {
    if (hero.model.actions.dead) {
      playHeroAction("dead", {
        fade: 0.15,
        loop: THREE.LoopOnce,
        clampWhenFinished: true,
      });
    }
    recoverHeroProceduralBones(0.18);
    return;
  }

  if (hero.state === "attack" && hero.attackType === "heavy") {
    if (hero.model.actions.heavy) {
      playHeroAction("heavy", {
        fade: 0.1,
        loop: THREE.LoopOnce,
        clampWhenFinished: true,
      });
    }
    recoverHeroProceduralBones(0.16);
    return;
  }

  if (hero.state === "run") {
    if (hero.model.actions.run) {
      playHeroAction("run", { fade: 0.12, timeScale: 1.04 });
    } else if (hero.model.actions.walk) {
      playHeroAction("walk", { fade: 0.12, timeScale: 1.12 });
    }
  } else if (hero.model.actions.idle) {
    playHeroAction("idle", { fade: 0.14, timeScale: 1 });
  }

  if (hero.state === "attack" && hero.attackType === "light") {
    const progress = 1 - hero.attackTimer / Math.max(hero.attackDuration, 0.001);
    applyHeroShortAttackProcedural(progress);
  } else {
    recoverHeroProceduralBones(0.22);
  }
}

async function loadHeroFromMeshyPack() {
  try {
    statusEl.textContent = "주인공 모델 로딩 중...";

    const [idleGltf, runGltf, walkGltf, attackGltf, deadGltf] = await Promise.all([
      loadGlbAsset(HERO_MESHY_ASSETS.idle),
      loadGlbAsset(HERO_MESHY_ASSETS.run),
      loadGlbAsset(HERO_MESHY_ASSETS.walk),
      loadGlbAsset(HERO_MESHY_ASSETS.heavyAttack),
      loadGlbAsset(HERO_MESHY_ASSETS.dead),
    ]);

    const visualRoot = idleGltf.scene;
    visualRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
    });

    while (hero.mesh.children.length > 0) {
      hero.mesh.remove(hero.mesh.children[0]);
    }
    hero.mesh.add(visualRoot);
    visualRoot.rotation.y = HERO_MODEL_YAW_OFFSET;

    const preScaleBox = new THREE.Box3().setFromObject(visualRoot);
    const preSize = preScaleBox.getSize(new THREE.Vector3());
    if (preSize.y > 1e-6) {
      const targetHeight = HERO_TARGET_WORLD_HEIGHT;
      const scale = targetHeight / preSize.y;
      visualRoot.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(visualRoot);
    hero.model.height = Math.max(0.001, scaledBox.max.y - scaledBox.min.y);
    const minotaurHeightNow = new THREE.Box3().setFromObject(minotaur.mesh).getSize(new THREE.Vector3()).y;
    const heroToMinotaurRatio = minotaurHeightNow > 1e-6 ? hero.model.height / minotaurHeightNow : 0;
    hero.colliderRadius = Math.max(0.08, hero.model.height * 0.12);
    const center = scaledBox.getCenter(new THREE.Vector3());
    visualRoot.position.x -= center.x;
    visualRoot.position.z -= center.z;
    visualRoot.position.y -= scaledBox.min.y;
    visualRoot.position.y += HERO_VISUAL_GROUND_BIAS;

    const mixer = new THREE.AnimationMixer(hero.mesh);
    const actionMap = {};

    const idleClip = idleGltf.animations[0] || null;
    const runClip = runGltf.animations[0] || null;
    const walkClip = walkGltf.animations[0] || null;
    const heavyClip = attackGltf.animations[0] || null;
    const deadClip = deadGltf.animations[0] || null;

    if (idleClip) {
      actionMap.idle = mixer.clipAction(idleClip, hero.mesh);
    }
    if (runClip) {
      actionMap.run = mixer.clipAction(runClip, hero.mesh);
    }
    if (walkClip) {
      actionMap.walk = mixer.clipAction(walkClip, hero.mesh);
    }
    if (heavyClip) {
      actionMap.heavy = mixer.clipAction(heavyClip, hero.mesh);
      hero.heavyAttackDuration = Math.max(0.68, Math.min(1.55, heavyClip.duration || 0.95));
    }
    if (deadClip) {
      actionMap.dead = mixer.clipAction(deadClip, hero.mesh);
    }

    const bones = {
      spine: findBoneByAliases(hero.mesh, ["spine2", "spine_02", "spine1", "spine", "chest"]),
      chest: findBoneByAliases(hero.mesh, ["chest", "upperchest", "spine3", "spine_03"]),
      rightUpperArm: findBoneByAliases(hero.mesh, ["rightupperarm", "upperarm_r", "arm_r", "r_arm", "rightarm"]),
      rightForeArm: findBoneByAliases(hero.mesh, ["rightforearm", "lowerarm_r", "forearm_r", "r_forearm"]),
      rightHand: findBoneByAliases(hero.mesh, ["righthand", "hand_r", "r_hand"]),
    };

    hero.model.enabled = true;
    hero.model.mixer = mixer;
    hero.model.actions = actionMap;
    hero.model.currentAction = "";
    hero.model.bones = bones;
    hero.model.basePose = {
      spine: bones.spine ? bones.spine.quaternion.clone() : null,
      chest: bones.chest ? bones.chest.quaternion.clone() : null,
      rightUpperArm: bones.rightUpperArm ? bones.rightUpperArm.quaternion.clone() : null,
      rightForeArm: bones.rightForeArm ? bones.rightForeArm.quaternion.clone() : null,
      rightHand: bones.rightHand ? bones.rightHand.quaternion.clone() : null,
    };

    const runtimeSword = createHeroRuntimeSword();
    runtimeSword.name = "RuntimeHeroSword";
    const swordAttachTarget = bones.rightHand || bones.rightForeArm || bones.rightUpperArm;
    if (swordAttachTarget) {
      swordAttachTarget.add(runtimeSword);
      runtimeSword.position.set(0.03, -0.02, 0.05);
      runtimeSword.rotation.set(-1.35, 0.18, 0.08);
    } else {
      hero.mesh.add(runtimeSword);
      runtimeSword.position.set(0.2, 1.1, 0.1);
      runtimeSword.rotation.set(-1.35, 0.18, 0.08);
    }
    hero.model.sword = runtimeSword;

    if (hero.model.actions.idle) {
      playHeroAction("idle", { fade: 0.01, restart: true });
    }

    hero.mesh.visible = true;

    console.info(
      "[Character Scale] heroHeight=",
      hero.model.height.toFixed(3),
      "minotaurHeight=",
      minotaurHeightNow.toFixed(3),
      "ratio=",
      heroToMinotaurRatio.toFixed(3)
    );

    statusEl.textContent = "모델 적용 완료 - 좌클릭 길게 강공격";
  } catch (error) {
    console.error("[Hero Model Load Error]", error);
    hero.mesh.visible = true;
    statusEl.textContent = "모델 로드 실패. 플레이스홀더로 진행";
  }
}

async function loadMinotaurFromMeshyPack() {
  try {
    const [idleGltf, runGltf, walkGltf, attackGltf, comboGltf, slamGltf] = await Promise.all([
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.idle),
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.run),
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.walk),
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.attack),
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.combo),
      loadGlbAsset(MINOTAUR_MESHY_ASSETS.slam),
    ]);

    const visualRoot = idleGltf.scene;
    visualRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
    });

    while (minotaur.mesh.children.length > 0) {
      minotaur.mesh.remove(minotaur.mesh.children[0]);
    }
    minotaur.mesh.add(visualRoot);

    visualRoot.rotation.y = MINOTAUR_MODEL_YAW_OFFSET;

    const preScaleBox = new THREE.Box3().setFromObject(visualRoot);
    const preSize = preScaleBox.getSize(new THREE.Vector3());
    if (preSize.y > 1e-6) {
      const targetHeight = MINOTAUR_TARGET_WORLD_HEIGHT;
      const scale = targetHeight / preSize.y;
      visualRoot.scale.setScalar(scale);
    }

    const scaledBox = new THREE.Box3().setFromObject(visualRoot);
    const minotaurHeight = Math.max(0.001, scaledBox.max.y - scaledBox.min.y);
    const center = scaledBox.getCenter(new THREE.Vector3());
    visualRoot.position.x -= center.x;
    visualRoot.position.z -= center.z;
    visualRoot.position.y -= scaledBox.min.y;
    visualRoot.position.y += MINOTAUR_VISUAL_GROUND_BIAS;

    minotaur.colliderRadius = Math.max(0.1, minotaurHeight * 0.045);

    const mixer = new THREE.AnimationMixer(minotaur.mesh);
    const actionMap = {};
    const idleClip = createRotationOnlyClip(idleGltf.animations[0] || walkGltf.animations[0] || null);
    const runClip = createRotationOnlyClip(runGltf.animations[0] || walkGltf.animations[0] || null);
    const attackClip = createRotationOnlyClip(attackGltf.animations[0] || comboGltf.animations[0] || null);
    const slamClip = createRotationOnlyClip(slamGltf.animations[0] || comboGltf.animations[0] || null);

    if (idleClip) {
      actionMap.idle = mixer.clipAction(idleClip, minotaur.mesh);
    }
    if (runClip) {
      actionMap.run = mixer.clipAction(runClip, minotaur.mesh);
    }
    if (attackClip) {
      actionMap.attack = mixer.clipAction(attackClip, minotaur.mesh);
    }
    if (slamClip) {
      actionMap.slam = mixer.clipAction(slamClip, minotaur.mesh);
    }

    const bones = {
      leftFoot: findBoneByAliases(minotaur.mesh, ["leftfoot", "foot_l", "l_foot", "ankle_l", "leftankle"]),
      rightFoot: findBoneByAliases(minotaur.mesh, ["rightfoot", "foot_r", "r_foot", "ankle_r", "rightankle"]),
    };

    minotaur.model.enabled = true;
    minotaur.model.mixer = mixer;
    minotaur.model.actions = actionMap;
    minotaur.model.currentAction = "";
    minotaur.model.visualRoot = visualRoot;
    minotaur.model.bones = bones;

    if (minotaur.model.actions.idle) {
      playMinotaurAction("idle", { fade: 0.01, restart: true });
    }

    keepMinotaurModelGrounded();
    minotaur.mesh.visible = true;
  } catch (error) {
    console.error("[Minotaur Model Load Error]", error);
    minotaur.mesh.visible = true;
  }
}

function createBone(length, radius, color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 10),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.1,
    })
  );
  mesh.position.y = -length * 0.5;
  mesh.castShadow = true;
  return mesh;
}

function createJoint(radius, color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 10),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.3,
    })
  );
  mesh.castShadow = true;
  return mesh;
}

function createHeroPlaceholder() {
  const root = new THREE.Group();
  const rig = {};

  const hips = new THREE.Group();
  hips.position.y = 1.05;
  root.add(hips);
  rig.hips = hips;

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.74, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0x79a9ff,
      roughness: 0.55,
      metalness: 0.2,
    })
  );
  torso.position.y = 0.42;
  torso.castShadow = true;
  hips.add(torso);
  rig.torso = torso;

  const head = createJoint(0.18, 0xdbe8ff);
  head.position.y = 0.9;
  hips.add(head);
  rig.head = head;

  const heroVisor = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.08, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0x173055,
      roughness: 0.35,
      metalness: 0.4,
      emissive: 0x0b1f3f,
      emissiveIntensity: 0.4,
    })
  );
  heroVisor.position.set(0, 0.91, 0.17);
  heroVisor.castShadow = true;
  hips.add(heroVisor);

  const heroChestMark = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.2, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0xe6f0ff,
      roughness: 0.3,
      metalness: 0.65,
      emissive: 0x304f82,
      emissiveIntensity: 0.35,
    })
  );
  heroChestMark.position.set(0, 0.5, 0.16);
  heroChestMark.castShadow = true;
  hips.add(heroChestMark);

  const leftLegUpper = new THREE.Group();
  leftLegUpper.position.set(-0.15, 0, 0);
  leftLegUpper.add(createJoint(0.08, 0xb8c9e9));
  leftLegUpper.add(createBone(0.5, 0.07, 0xb8c9e9));
  hips.add(leftLegUpper);

  const leftLegLower = new THREE.Group();
  leftLegLower.position.y = -0.5;
  leftLegLower.add(createJoint(0.07, 0x9dafd4));
  leftLegLower.add(createBone(0.5, 0.06, 0x9dafd4));
  leftLegUpper.add(leftLegLower);

  const rightLegUpper = new THREE.Group();
  rightLegUpper.position.set(0.15, 0, 0);
  rightLegUpper.add(createJoint(0.08, 0xb8c9e9));
  rightLegUpper.add(createBone(0.5, 0.07, 0xb8c9e9));
  hips.add(rightLegUpper);

  const rightLegLower = new THREE.Group();
  rightLegLower.position.y = -0.5;
  rightLegLower.add(createJoint(0.07, 0x9dafd4));
  rightLegLower.add(createBone(0.5, 0.06, 0x9dafd4));
  rightLegUpper.add(rightLegLower);

  const leftArmUpper = new THREE.Group();
  leftArmUpper.position.set(0.3, 0.65, 0);
  leftArmUpper.add(createJoint(0.07, 0xb6cbff));
  leftArmUpper.add(createBone(0.42, 0.055, 0xb6cbff));
  hips.add(leftArmUpper);

  const leftArmLower = new THREE.Group();
  leftArmLower.position.y = -0.42;
  leftArmLower.add(createJoint(0.06, 0x9eb7f2));
  leftArmLower.add(createBone(0.38, 0.05, 0x9eb7f2));
  leftArmUpper.add(leftArmLower);

  const rightArmUpper = new THREE.Group();
  rightArmUpper.position.set(-0.3, 0.65, 0);
  rightArmUpper.add(createJoint(0.07, 0xb6cbff));
  rightArmUpper.add(createBone(0.42, 0.055, 0xb6cbff));
  hips.add(rightArmUpper);

  const rightArmLower = new THREE.Group();
  rightArmLower.position.y = -0.42;
  rightArmLower.add(createJoint(0.06, 0x9eb7f2));
  rightArmLower.add(createBone(0.38, 0.05, 0x9eb7f2));
  rightArmUpper.add(rightArmLower);

  const sword = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.78, 0.09),
    new THREE.MeshStandardMaterial({
      color: 0xeff5ff,
      metalness: 0.72,
      roughness: 0.25,
    })
  );
  sword.position.set(0.07, -0.28, 0.12);
  sword.rotation.set(-0.35, 0, 0.12);
  sword.castShadow = true;
  rightArmLower.add(sword);

  const hilt = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x6d7e97,
      roughness: 0.35,
      metalness: 0.5,
    })
  );
  hilt.position.set(0.07, -0.01, 0.13);
  hilt.rotation.copy(sword.rotation);
  hilt.castShadow = true;
  rightArmLower.add(hilt);

  rig.leftLegUpper = leftLegUpper;
  rig.rightLegUpper = rightLegUpper;
  rig.leftLegLower = leftLegLower;
  rig.rightLegLower = rightLegLower;
  rig.leftArmUpper = leftArmUpper;
  rig.rightArmUpper = rightArmUpper;
  rig.leftArmLower = leftArmLower;
  rig.rightArmLower = rightArmLower;
  rig.weapon = sword;

  return { root, rig };
}

function createMinotaurPlaceholder() {
  const root = new THREE.Group();
  const rig = {};

  const hips = new THREE.Group();
  hips.position.y = 1.3;
  root.add(hips);
  rig.hips = hips;

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 1.1, 0.52),
    new THREE.MeshStandardMaterial({
      color: 0x8f5b46,
      roughness: 0.85,
      metalness: 0.03,
    })
  );
  torso.position.y = 0.62;
  torso.castShadow = true;
  hips.add(torso);
  rig.torso = torso;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.46, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x75513f,
      roughness: 0.8,
      metalness: 0.05,
    })
  );
  head.position.y = 1.28;
  head.castShadow = true;
  hips.add(head);
  rig.head = head;

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.14, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x5e4033,
      roughness: 0.85,
      metalness: 0.02,
    })
  );
  snout.position.set(0, 1.2, 0.26);
  snout.castShadow = true;
  hips.add(snout);

  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffb36b,
      emissive: 0x8a3d00,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.1,
    })
  );
  leftEye.position.set(-0.1, 1.29, 0.22);
  leftEye.castShadow = true;
  hips.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.1;
  hips.add(rightEye);

  const hornGeo = new THREE.ConeGeometry(0.08, 0.34, 8);
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xe7dbb3,
    roughness: 0.6,
    metalness: 0.05,
  });

  const leftHorn = new THREE.Mesh(hornGeo, hornMat);
  leftHorn.position.set(-0.2, 1.46, 0.06);
  leftHorn.rotation.z = Math.PI / 3.1;
  leftHorn.rotation.x = Math.PI / 2.4;
  leftHorn.castShadow = true;
  hips.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMat);
  rightHorn.position.set(0.2, 1.46, 0.06);
  rightHorn.rotation.z = -Math.PI / 3.1;
  rightHorn.rotation.x = Math.PI / 2.4;
  rightHorn.castShadow = true;
  hips.add(rightHorn);

  const leftLegUpper = new THREE.Group();
  leftLegUpper.position.set(-0.23, 0, 0);
  leftLegUpper.add(createJoint(0.11, 0x8f6b58));
  leftLegUpper.add(createBone(0.7, 0.12, 0x8f6b58));
  hips.add(leftLegUpper);

  const leftLegLower = new THREE.Group();
  leftLegLower.position.y = -0.7;
  leftLegLower.add(createJoint(0.09, 0x7b5c4d));
  leftLegLower.add(createBone(0.62, 0.1, 0x7b5c4d));
  leftLegUpper.add(leftLegLower);

  const rightLegUpper = new THREE.Group();
  rightLegUpper.position.set(0.23, 0, 0);
  rightLegUpper.add(createJoint(0.11, 0x8f6b58));
  rightLegUpper.add(createBone(0.7, 0.12, 0x8f6b58));
  hips.add(rightLegUpper);

  const rightLegLower = new THREE.Group();
  rightLegLower.position.y = -0.7;
  rightLegLower.add(createJoint(0.09, 0x7b5c4d));
  rightLegLower.add(createBone(0.62, 0.1, 0x7b5c4d));
  rightLegUpper.add(rightLegLower);

  const leftArmUpper = new THREE.Group();
  leftArmUpper.position.set(-0.54, 1.02, 0);
  leftArmUpper.add(createJoint(0.11, 0x94654f));
  leftArmUpper.add(createBone(0.62, 0.1, 0x94654f));
  hips.add(leftArmUpper);

  const leftArmLower = new THREE.Group();
  leftArmLower.position.y = -0.62;
  leftArmLower.add(createJoint(0.09, 0x7a5545));
  leftArmLower.add(createBone(0.56, 0.086, 0x7a5545));
  leftArmUpper.add(leftArmLower);

  const rightArmUpper = new THREE.Group();
  rightArmUpper.position.set(0.54, 1.02, 0);
  rightArmUpper.add(createJoint(0.11, 0x94654f));
  rightArmUpper.add(createBone(0.62, 0.1, 0x94654f));
  hips.add(rightArmUpper);

  const rightArmLower = new THREE.Group();
  rightArmLower.position.y = -0.62;
  rightArmLower.add(createJoint(0.09, 0x7a5545));
  rightArmLower.add(createBone(0.56, 0.086, 0x7a5545));
  rightArmUpper.add(rightArmLower);

  const axeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.08, 8),
    new THREE.MeshStandardMaterial({
      color: 0x553a27,
      roughness: 0.9,
      metalness: 0.05,
    })
  );
  axeHandle.position.y = -0.56;
  axeHandle.castShadow = true;
  rightArmLower.add(axeHandle);

  const axeHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.18, 0.14),
    new THREE.MeshStandardMaterial({
      color: 0xc8cedb,
      roughness: 0.2,
      metalness: 0.75,
    })
  );
  axeHead.position.set(0.2, -1.02, 0);
  axeHead.castShadow = true;
  rightArmLower.add(axeHead);

  rig.leftLegUpper = leftLegUpper;
  rig.rightLegUpper = rightLegUpper;
  rig.leftLegLower = leftLegLower;
  rig.rightLegLower = rightLegLower;
  rig.leftArmUpper = leftArmUpper;
  rig.rightArmUpper = rightArmUpper;
  rig.leftArmLower = leftArmLower;
  rig.rightArmLower = rightArmLower;
  rig.weapon = axeHead;

  return { root, rig };
}

function clampToArena(object3D, radius) {
  const lenSq = object3D.position.x ** 2 + object3D.position.z ** 2;
  const maxSq = radius ** 2;
  if (lenSq <= maxSq) {
    return;
  }
  const len = Math.sqrt(lenSq);
  object3D.position.x = (object3D.position.x / len) * radius;
  object3D.position.z = (object3D.position.z / len) * radius;
}

function computeChargeDistanceFrom(origin, dir, arenaRadius, maxDistance) {
  const ox = origin.x;
  const oz = origin.z;
  const dx = dir.x;
  const dz = dir.z;
  const a = dx * dx + dz * dz;
  const b = 2 * (ox * dx + oz * dz);
  const c = ox * ox + oz * oz - arenaRadius * arenaRadius;
  const disc = b * b - 4 * a * c;

  if (disc <= 0 || a <= 1e-6) {
    return maxDistance;
  }

  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  let edgeDistance = maxDistance;

  if (t1 > 0 && t1 < edgeDistance) {
    edgeDistance = t1;
  }
  if (t2 > 0 && t2 < edgeDistance) {
    edgeDistance = t2;
  }

  return Math.max(1.4, Math.min(maxDistance, edgeDistance - 0.3));
}

function beginMinotaurCharge(targetPosition) {
  minotaur.state = "charge_windup";
  minotaur.chargeWindup = 0.48;
  minotaur.chargeCooldown = 5.2;
  minotaur.attackCooldown = Math.max(minotaur.attackCooldown, 0.8);

  minotaur.chargeOrigin.copy(minotaur.mesh.position);
  minotaur.chargeDir.subVectors(targetPosition, minotaur.mesh.position);
  minotaur.chargeDir.y = 0;
  if (minotaur.chargeDir.lengthSq() < 1e-6) {
    minotaur.chargeDir.set(Math.sin(minotaur.mesh.rotation.y), 0, Math.cos(minotaur.mesh.rotation.y));
  } else {
    minotaur.chargeDir.normalize();
  }

  minotaur.chargeDistance = computeChargeDistanceFrom(minotaur.chargeOrigin, minotaur.chargeDir, 15.4, 9.6);
  minotaur.chargeRemaining = minotaur.chargeDistance;
  minotaur.mesh.rotation.y = Math.atan2(minotaur.chargeDir.x, minotaur.chargeDir.z);
}

const heroVisual = createHeroPlaceholder();
const minotaurVisual = createMinotaurPlaceholder();
heroVisual.root.visible = false;
minotaurVisual.root.visible = false;
scene.add(heroVisual.root);
scene.add(minotaurVisual.root);

const hero = {
  mesh: heroVisual.root,
  rig: heroVisual.rig,
  maxHp: 120,
  hp: 120,
  speed: 4.4,
  runMultiplier: 1.55,
  colliderRadius: HERO_COLLIDER_RADIUS,
  state: "idle",
  hurtTimer: 0,
  attackTimer: 0,
  attackDuration: 0.36,
  lightAttackDuration: 0.28,
  heavyAttackDuration: 1.0,
  attackType: "light",
  attackCooldown: 0,
  attackDidHit: false,
  stunTimer: 0,
  jumpVelocity: 7.1,
  gravity: 19,
  verticalVelocity: 0,
  isJumping: false,
  dead: false,
  model: {
    enabled: false,
    mixer: null,
    actions: {},
    currentAction: "",
    bones: null,
    basePose: null,
    sword: null,
    height: HERO_REFERENCE_HEIGHT,
  },
};

const minotaur = {
  mesh: minotaurVisual.root,
  rig: minotaurVisual.rig,
  maxHp: 260,
  hp: 260,
  speed: 3.2,
  colliderRadius: MINOTAUR_COLLIDER_RADIUS,
  state: "idle",
  hurtTimer: 0,
  attackTimer: 0,
  attackDuration: 0.74,
  attackCooldown: 0,
  attackDidHit: false,
  chargeWindup: 0,
  chargeTimer: 0,
  chargeCooldown: 0,
  chargeDidHit: false,
  chargeDir: new THREE.Vector3(0, 0, 1),
  chargeOrigin: new THREE.Vector3(0, 0, 0),
  chargeDistance: 9.6,
  chargeRemaining: 0,
  slamWindup: 0,
  slamTimer: 0,
  slamCooldown: 0,
  slamDidHit: false,
  aiDecisionTimer: 0,
  strafeTimer: 0,
  strafeDir: 1,
  burstTimer: 0,
  retreatTimer: 0,
  desiredRange: 0.85,
  dead: false,
  model: {
    enabled: false,
    mixer: null,
    actions: {},
    currentAction: "",
    visualRoot: null,
    bones: null,
  },
};

function resetBattle() {
  hero.hp = hero.maxHp;
  hero.hurtTimer = 0;
  hero.attackTimer = 0;
  hero.attackCooldown = 0;
  hero.attackDidHit = false;
  hero.attackType = "light";
  hero.attackDuration = hero.lightAttackDuration;
  hero.stunTimer = 0;
  hero.verticalVelocity = 0;
  hero.isJumping = false;
  hero.state = "idle";
  hero.dead = false;
  hero.mesh.position.set(0, 0, 5.8);

  minotaur.hp = minotaur.maxHp;
  minotaur.hurtTimer = 0;
  minotaur.attackTimer = 0;
  minotaur.attackCooldown = 0;
  minotaur.attackDidHit = false;
  minotaur.chargeWindup = 0;
  minotaur.chargeTimer = 0;
  minotaur.chargeCooldown = 0;
  minotaur.chargeDidHit = false;
  minotaur.chargeDir.set(0, 0, 1);
  minotaur.chargeOrigin.copy(minotaur.mesh.position);
  minotaur.chargeDistance = 9.6;
  minotaur.chargeRemaining = 0;
  minotaur.slamWindup = 0;
  minotaur.slamTimer = 0;
  minotaur.slamCooldown = 0;
  minotaur.slamDidHit = false;
  minotaur.aiDecisionTimer = 0;
  minotaur.strafeTimer = 0;
  minotaur.strafeDir = Math.random() < 0.5 ? -1 : 1;
  minotaur.burstTimer = 0;
  minotaur.retreatTimer = 0;
  minotaur.desiredRange = 0.85;
  minotaur.state = "idle";
  minotaur.dead = false;
  minotaur.mesh.position.set(0, 0, -5.8);
  minotaur.mesh.rotation.set(0, 0, 0);

  const startYaw = Math.atan2(
    minotaur.mesh.position.x - hero.mesh.position.x,
    minotaur.mesh.position.z - hero.mesh.position.z
  );
  hero.mesh.rotation.set(0, startYaw, 0);

  outcomeState = "none";
  outcomePulse = 0;
  previousOutcomeState = "none";
  winFireworkTimer = 0;
  loseDriftTimer = 0;
  hitFlashAlpha = 0;
  cameraShakeTime = 0;
  cameraShakeStrength = 0;
  hitStopTimer = 0;
  fxParticles.length = 0;
  outcomeOverlay.style.opacity = "0";
  outcomeText.style.opacity = "0";
  outcomeText.style.transform = "translate(-50%, -50%) scale(0.9)";
  outcomeText.textContent = "";
  hitFlash.style.opacity = "0";
  slamShockwaveTimer = 0;
  slamRangeIndicator.visible = false;
  chargeLaneIndicator.visible = false;
  slamImpactRing.visible = false;
  warningBanner.style.opacity = "0";
  warningBanner.style.transform = "translate(-50%, -50%) scale(0.92)";
  warningBanner.textContent = "";
  jumpQueued = false;
  heavyAttackQueued = false;
  mouseLeftDown = false;

  if (hero.model.enabled) {
    hero.model.currentAction = "";
    playHeroAction("idle", { fade: 0.01, restart: true });
    recoverHeroProceduralBones(1);
  }

  if (minotaur.model.enabled) {
    minotaur.model.currentAction = "";
    playMinotaurAction("idle", { fade: 0.01, restart: true });
  }

  if (audioCtx) {
    startBackgroundMusic();
  }

  updateCamera();
  statusEl.textContent = "전투 시작";
}

resetBattle();
loadHeroFromMeshyPack();
loadMinotaurFromMeshyPack();

function setStatus(text) {
  statusEl.textContent = text;
}

function takeHeroDamage(amount) {
  if (hero.dead) {
    return;
  }
  hero.hp = Math.max(0, hero.hp - amount);
  hero.hurtTimer = 0.2;
  if (hero.hp <= 0) {
    hero.dead = true;
    hero.state = "dead";
    outcomeState = "lose";
    outcomePulse = 0;
    outcomeText.textContent = "DEFEAT";
    setStatus("패배! R로 재시작");
  }
}

function takeMinotaurDamage(amount) {
  if (minotaur.dead) {
    return;
  }
  minotaur.hp = Math.max(0, minotaur.hp - amount);
  minotaur.hurtTimer = 0.18;
  if (minotaur.hp <= 0) {
    minotaur.dead = true;
    minotaur.state = "dead";
    outcomeState = "win";
    outcomePulse = 0;
    outcomeText.textContent = "VICTORY";
    setStatus("승리! R로 재시작");
  }
}

function updateHeroJump(dt) {
  const canStartJump =
    jumpQueued && !hero.isJumping && hero.attackTimer <= 0 && hero.hurtTimer <= 0 && !hero.dead;

  if (canStartJump) {
    hero.isJumping = true;
    hero.verticalVelocity = hero.jumpVelocity;
    jumpQueued = false;
    playTone(480, audioCtx ? audioCtx.currentTime : 0, 0.08, 0.07, "triangle");
  }

  if (!hero.isJumping && hero.mesh.position.y <= 0) {
    hero.mesh.position.y = 0;
    hero.verticalVelocity = 0;
    return;
  }

  hero.verticalVelocity -= hero.gravity * dt;
  hero.mesh.position.y += hero.verticalVelocity * dt;

  if (hero.mesh.position.y <= 0) {
    hero.mesh.position.y = 0;
    hero.verticalVelocity = 0;
    hero.isJumping = false;
  }
}

function tryHeroAttack(type = "light") {
  if (
    hero.dead ||
    minotaur.dead ||
    hero.attackCooldown > 0 ||
    hero.attackTimer > 0 ||
    hero.isJumping
  ) {
    return;
  }

  const wantsHeavy = type === "heavy";
  const canHeavy = wantsHeavy && hero.model.enabled && !!hero.model.actions.heavy;
  hero.attackType = canHeavy ? "heavy" : "light";
  hero.attackDuration = hero.attackType === "heavy"
    ? hero.heavyAttackDuration
    : hero.lightAttackDuration;
  hero.state = "attack";
  hero.attackTimer = hero.attackDuration;
  hero.attackCooldown = hero.attackType === "heavy" ? 1.02 : 0.46;
  hero.attackDidHit = false;

  if (hero.model.enabled && hero.attackType === "heavy") {
    playHeroAction("heavy", {
      fade: 0.08,
      restart: true,
      loop: THREE.LoopOnce,
      clampWhenFinished: true,
      timeScale: 1,
    });
  }
}

function performHeroHitCheck() {
  const isHeavy = hero.attackType === "heavy";
  const { edgeDistance } = getEdgeDistanceBetweenFighters(tmpVecA);
  if (edgeDistance > (isHeavy ? HERO_HEAVY_ATTACK_EDGE_RANGE : HERO_LIGHT_ATTACK_EDGE_RANGE)) {
    return;
  }
  tmpVecB.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y));
  const dot = tmpVecB.dot(tmpVecA);
  if (dot < (isHeavy ? 0.28 : 0.45)) {
    return;
  }

  const damage = isHeavy ? 58 : 34;
  const knockback = isHeavy ? 0.46 : 0.24;
  takeMinotaurDamage(damage);
  minotaur.mesh.position.addScaledVector(tmpVecA, knockback);

  if (isHeavy) {
    triggerHitImpact(1.05, "rgba(255,198,135,0.95)");
    playHitSound(true);
    playNoiseBurst(audioCtx ? audioCtx.currentTime : 0, 0.1, 0.16);
  } else {
    triggerHitImpact(0.62, "rgba(255,240,210,0.9)");
    playHitSound(false);
  }
}

function performMinotaurHitCheck() {
  const { edgeDistance, centerDistance } = getEdgeDistanceBetweenFighters(tmpVecA);
  if (edgeDistance > MINOTAUR_ATTACK_EDGE_RANGE) {
    return;
  }
  const centerRangeCap = hero.colliderRadius + minotaur.colliderRadius + 0.34;
  if (centerDistance > centerRangeCap) {
    return;
  }
  tmpVecA.multiplyScalar(-1);
  tmpVecB.set(Math.sin(minotaur.mesh.rotation.y), 0, Math.cos(minotaur.mesh.rotation.y));
  if (tmpVecB.dot(tmpVecA) < 0.1) {
    return;
  }
  takeHeroDamage(24);
  hero.mesh.position.addScaledVector(tmpVecA, 0.28);
  triggerHitImpact(0.92, "rgba(255,125,125,0.92)");
  playHitSound(true);
}

function performMinotaurChargeHitCheck() {
  const { edgeDistance } = getEdgeDistanceBetweenFighters(tmpVecA);
  if (edgeDistance > MINOTAUR_CHARGE_EDGE_RANGE) {
    return;
  }
  tmpVecA.multiplyScalar(-1);
  tmpVecB.copy(minotaur.chargeDir);
  if (tmpVecB.dot(tmpVecA) < 0.28) {
    return;
  }

  takeHeroDamage(30);
  hero.mesh.position.addScaledVector(tmpVecA, 0.52);
  triggerHitImpact(1.05, "rgba(255,110,110,0.95)");
  playHitSound(true);
}

function applyHeroStun(duration) {
  hero.stunTimer = Math.max(hero.stunTimer, duration);
}

function performMinotaurSlamHitCheck() {
  const { edgeDistance } = getEdgeDistanceBetweenFighters(tmpVecA);
  if (edgeDistance > MINOTAUR_SLAM_EDGE_RANGE) {
    return;
  }
  tmpVecA.multiplyScalar(-1);

  takeHeroDamage(20);
  applyHeroStun(0.9);
  slamShockwaveTimer = 0.42;
  hero.mesh.position.addScaledVector(tmpVecA, 0.42);
  triggerHitImpact(1.15, "rgba(255,95,95,0.96)");
  playHitSound(true);
  playNoiseBurst(audioCtx ? audioCtx.currentTime : 0, 0.14, 0.22);
}

function normalizeAngle(angle) {
  let wrapped = angle;
  while (wrapped > Math.PI) {
    wrapped -= Math.PI * 2;
  }
  while (wrapped < -Math.PI) {
    wrapped += Math.PI * 2;
  }
  return wrapped;
}

function rotateYawToward(currentYaw, targetYaw, maxStep) {
  const delta = normalizeAngle(targetYaw - currentYaw);
  const clamped = Math.max(-maxStep, Math.min(maxStep, delta));
  return currentYaw + clamped;
}

function animateHero(time, dt) {
  if (hero.model.enabled) {
    updateHeroModelAnimation(dt);
    return;
  }

  const rig = hero.rig;

  if (hero.state === "dead") {
    rig.hips.rotation.x = 0.08;
    rig.hips.rotation.z = 0;
    rig.torso.rotation.y = 0;
    rig.leftArmUpper.rotation.x = -0.35;
    rig.rightArmUpper.rotation.x = -0.2;
    rig.leftLegUpper.rotation.x = 0.05;
    rig.rightLegUpper.rotation.x = -0.05;
    return;
  }

  rig.hips.rotation.x = 0;
  rig.hips.rotation.z = 0;

  const speedFactor = hero.state === "run" ? 1 : 0;
  const cycle = Math.sin(time * 9);
  rig.hips.position.y = 1.05 + speedFactor * Math.abs(cycle) * 0.04;
  rig.leftLegUpper.rotation.x = cycle * 0.8 * speedFactor;
  rig.rightLegUpper.rotation.x = -cycle * 0.8 * speedFactor;
  rig.leftLegLower.rotation.x = Math.max(0, -cycle) * 0.75 * speedFactor;
  rig.rightLegLower.rotation.x = Math.max(0, cycle) * 0.75 * speedFactor;

  rig.leftArmUpper.rotation.x = -cycle * 0.7 * speedFactor;
  rig.rightArmUpper.rotation.x = cycle * 0.7 * speedFactor;
  rig.leftArmLower.rotation.x = 0;
  rig.rightArmLower.rotation.x = 0;

  if (hero.isJumping) {
    rig.hips.position.y = 1.08;
    rig.leftLegUpper.rotation.x = -0.28;
    rig.rightLegUpper.rotation.x = -0.12;
    rig.leftLegLower.rotation.x = 0.58;
    rig.rightLegLower.rotation.x = 0.52;
    rig.leftArmUpper.rotation.x = -0.18;
    rig.rightArmUpper.rotation.x = -0.35;
    rig.torso.rotation.y = 0;
    rig.torso.rotation.z = 0;
    rig.torso.rotation.x = -0.05;
    return;
  }

  if (hero.state === "stun") {
    rig.hips.position.y = 1.03;
    rig.torso.rotation.z = Math.sin(time * 34) * 0.1;
    rig.torso.rotation.x = -0.04;
    rig.leftArmUpper.rotation.x = -0.35;
    rig.rightArmUpper.rotation.x = -0.3;
    rig.leftLegUpper.rotation.x = -0.08;
    rig.rightLegUpper.rotation.x = 0.08;
    return;
  }

  if (hero.state === "hurt") {
    rig.torso.rotation.z = Math.sin(time * 70) * 0.07;
    return;
  }

  rig.torso.rotation.z = 0;

  if (hero.state === "attack") {
    const progress = 1 - hero.attackTimer / hero.attackDuration;
    if (progress < 0.42) {
      const windup = progress / 0.42;
      rig.rightArmUpper.rotation.x = -2.15 + windup * 0.15;
      rig.rightArmLower.rotation.x = -1.05 + windup * 0.12;
      rig.torso.rotation.y = -0.42;
      rig.torso.rotation.x = 0.1;
    } else {
      const swing = Math.min(1, (progress - 0.42) / 0.58);
      rig.rightArmUpper.rotation.x = -2.0 + swing * 2.85;
      rig.rightArmLower.rotation.x = -0.95 + swing * 1.65;
      rig.torso.rotation.y = -0.2 + swing * 0.85;
      rig.torso.rotation.x = 0.1 - swing * 0.2;
    }
    rig.leftArmUpper.rotation.x = -0.2;
    return;
  }

  rig.torso.rotation.y = 0;
  rig.torso.rotation.x = 0;
  rig.rightArmUpper.rotation.z = 0;
}

function animateMinotaur(time, dt) {
  if (minotaur.model.enabled) {
    updateMinotaurModelAnimation();
    return;
  }

  const rig = minotaur.rig;

  if (minotaur.state === "dead") {
    rig.hips.rotation.x = 0.05;
    rig.hips.rotation.z = 0;
    rig.torso.rotation.y = 0;
    rig.rightArmUpper.rotation.x = -0.25;
    rig.leftArmUpper.rotation.x = -0.2;
    rig.rightLegUpper.rotation.x = 0.04;
    rig.leftLegUpper.rotation.x = -0.04;
    return;
  }

  rig.hips.rotation.x = 0;
  rig.hips.rotation.z = 0;

  const runFactor = minotaur.state === "run" || minotaur.state === "strafe" ? 1 : 0;
  const cycle = Math.sin(time * 7);
  rig.hips.position.y = 1.3 + runFactor * Math.abs(cycle) * 0.06;
  rig.leftLegUpper.rotation.x = cycle * 0.65 * runFactor;
  rig.rightLegUpper.rotation.x = -cycle * 0.65 * runFactor;
  rig.leftLegLower.rotation.x = Math.max(0, -cycle) * 0.62 * runFactor;
  rig.rightLegLower.rotation.x = Math.max(0, cycle) * 0.62 * runFactor;
  rig.leftArmUpper.rotation.x = -cycle * 0.45 * runFactor;
  rig.rightArmUpper.rotation.x = cycle * 0.45 * runFactor;
  rig.torso.rotation.y = 0;
  rig.torso.rotation.x = 0;
  rig.head.rotation.x = 0;

  if (minotaur.state === "hurt") {
    rig.torso.rotation.z = Math.sin(time * 60) * 0.06;
    return;
  }

  rig.torso.rotation.z = 0;

  if (minotaur.state === "charge_windup") {
    rig.hips.position.y = 1.2;
    rig.torso.rotation.x = 0.28;
    rig.torso.rotation.y = 0;
    rig.head.rotation.x = -0.18;
    rig.leftArmUpper.rotation.x = -0.48;
    rig.rightArmUpper.rotation.x = -0.62;
    rig.leftLegUpper.rotation.x = -0.3;
    rig.rightLegUpper.rotation.x = -0.3;
    return;
  }

  if (minotaur.state === "charge") {
    const gallop = Math.sin(time * 18);
    rig.hips.position.y = 1.22 + Math.abs(gallop) * 0.08;
    rig.torso.rotation.x = 0.15;
    rig.head.rotation.x = -0.12;
    rig.leftLegUpper.rotation.x = gallop * 0.95;
    rig.rightLegUpper.rotation.x = -gallop * 0.95;
    rig.leftLegLower.rotation.x = Math.max(0, -gallop) * 0.85;
    rig.rightLegLower.rotation.x = Math.max(0, gallop) * 0.85;
    rig.leftArmUpper.rotation.x = -0.45 - gallop * 0.25;
    rig.rightArmUpper.rotation.x = -0.45 + gallop * 0.25;
    return;
  }

  if (minotaur.state === "slam_windup") {
    rig.hips.position.y = 1.28;
    rig.torso.rotation.x = 0.12;
    rig.leftArmUpper.rotation.x = -0.5;
    rig.rightArmUpper.rotation.x = -0.6;
    rig.leftArmLower.rotation.x = -0.25;
    rig.rightArmLower.rotation.x = -0.3;
    rig.leftLegUpper.rotation.x = -0.74;
    rig.leftLegLower.rotation.x = 0.58;
    rig.rightLegUpper.rotation.x = 0.26;
    rig.rightLegLower.rotation.x = 0.08;
    return;
  }

  if (minotaur.state === "slam") {
    const progress = 1 - minotaur.slamTimer / 0.48;
    if (progress < 0.58) {
      const lift = progress / 0.58;
      rig.hips.position.y = 1.3 - lift * 0.08;
      rig.torso.rotation.x = 0.16 - lift * 0.08;
      rig.leftLegUpper.rotation.x = -0.74 + lift * 0.18;
      rig.leftLegLower.rotation.x = 0.58 - lift * 0.2;
      rig.rightLegUpper.rotation.x = 0.24 + lift * 0.06;
    } else {
      const stomp = Math.min(1, (progress - 0.58) / 0.42);
      rig.hips.position.y = 1.22 - stomp * 0.18;
      rig.torso.rotation.x = 0.08 + stomp * 0.28;
      rig.leftLegUpper.rotation.x = -0.56 + stomp * 1.18;
      rig.leftLegLower.rotation.x = 0.38 - stomp * 0.56;
      rig.rightLegUpper.rotation.x = 0.3 - stomp * 0.24;
    }
    rig.leftArmUpper.rotation.x = -0.45;
    rig.rightArmUpper.rotation.x = -0.55;
    rig.leftArmLower.rotation.x = -0.2;
    rig.rightArmLower.rotation.x = -0.25;
    return;
  }

  if (minotaur.state === "attack") {
    const progress = 1 - minotaur.attackTimer / minotaur.attackDuration;
    if (progress < 0.42) {
      rig.rightArmUpper.rotation.x = -0.9;
      rig.rightArmLower.rotation.x = -0.5;
      rig.leftArmUpper.rotation.x = -0.55;
      rig.torso.rotation.y = -0.55;
    } else {
      const strike = Math.min(1, (progress - 0.42) / 0.58);
      rig.rightArmUpper.rotation.x = 1.65 - strike * 0.35;
      rig.rightArmLower.rotation.x = 0.7;
      rig.leftArmUpper.rotation.x = 0.4;
      rig.torso.rotation.y = 0.88 - strike * 0.1;
    }
  }
}

function updateMinotaurAiTimers(dt) {
  minotaur.aiDecisionTimer = Math.max(0, minotaur.aiDecisionTimer - dt);
  minotaur.strafeTimer = Math.max(0, minotaur.strafeTimer - dt);
  minotaur.burstTimer = Math.max(0, minotaur.burstTimer - dt);
  minotaur.retreatTimer = Math.max(0, minotaur.retreatTimer - dt);
  minotaur.chargeCooldown = Math.max(0, minotaur.chargeCooldown - dt);
  minotaur.slamCooldown = Math.max(0, minotaur.slamCooldown - dt);

  if (minotaur.aiDecisionTimer <= 0) {
    minotaur.aiDecisionTimer = 0.65 + Math.random() * 0.45;
    if (Math.random() < 0.28) {
      minotaur.strafeDir *= -1;
    }
    minotaur.desiredRange = 0.78 + Math.random() * 0.18;
  }

  if (minotaur.strafeTimer <= 0) {
    minotaur.strafeTimer = 0.6 + Math.random() * 0.8;
    minotaur.strafeDir = Math.random() < 0.5 ? -1 : 1;
  }
}

function updateHero(dt, time) {
  if (hero.dead) {
    hero.isJumping = false;
    hero.verticalVelocity = 0;
    hero.mesh.position.y = 0;
    jumpQueued = false;
    animateHero(time, dt);
    return;
  }

  updateHeroJump(dt);

  if (hero.model.enabled && hero.model.mixer) {
    hero.model.mixer.update(dt);
  }

  hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);

  if (hero.stunTimer > 0) {
    hero.stunTimer = Math.max(0, hero.stunTimer - dt);
    hero.state = "stun";
    jumpQueued = false;
    animateHero(time, dt);
    return;
  }

  if (hero.hurtTimer > 0) {
    hero.hurtTimer = Math.max(0, hero.hurtTimer - dt);
    hero.state = "hurt";
    animateHero(time, dt);
    return;
  }

  if (heavyAttackQueued) {
    tryHeroAttack("heavy");
    heavyAttackQueued = false;
  }

  if (attackQueued) {
    tryHeroAttack("light");
    attackQueued = false;
  }

  if (hero.attackTimer > 0) {
    hero.state = "attack";
    hero.attackTimer = Math.max(0, hero.attackTimer - dt);
    const progress = 1 - hero.attackTimer / hero.attackDuration;
    const hitTiming = hero.attackType === "heavy" ? 0.64 : 0.48;
    if (!hero.attackDidHit && progress >= hitTiming) {
      hero.attackDidHit = true;
      performHeroHitCheck();
    }
    const attackStep = hero.attackType === "heavy" ? 1.85 : 1.4;
    hero.mesh.position.addScaledVector(
      tmpVecA.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y)),
      dt * attackStep
    );
    clampToArena(hero.mesh, 15.8);
    animateHero(time, dt);
    return;
  }

  const inputForward = (keyState.KeyW ? 1 : 0) - (keyState.KeyS ? 1 : 0);
  const inputRight = (keyState.KeyD ? 1 : 0) - (keyState.KeyA ? 1 : 0);
  moveInput.set(inputRight, 0, inputForward);
  const lockOnActive = !hero.dead && !minotaur.dead;
  const hasMoveInput = moveInput.lengthSq() > 0;

  if (hasMoveInput) {
    computeCameraRelativeMoveVector(moveInput.x, moveInput.z, tmpVecA);

    const isRunning = !!keyState.ShiftLeft || !!keyState.ShiftRight;
    const speed = hero.speed * (isRunning ? hero.runMultiplier : 1);
    hero.mesh.position.addScaledVector(tmpVecA, speed * dt);
    hero.state = "run";
    clampToArena(hero.mesh, 15.8);

    if (!lockOnActive) {
      const moveYaw = Math.atan2(tmpVecA.x, tmpVecA.z);
      hero.mesh.rotation.y = rotateYawToward(hero.mesh.rotation.y, moveYaw, dt * 12.5);
    }
  } else {
    hero.state = hero.isJumping ? "jump" : "idle";
  }

  if (lockOnActive) {
    toEnemyFlat.subVectors(minotaur.mesh.position, hero.mesh.position);
    toEnemyFlat.y = 0;
    if (toEnemyFlat.lengthSq() > 1e-6) {
      const targetYaw = Math.atan2(toEnemyFlat.x, toEnemyFlat.z);
      hero.mesh.rotation.y = rotateYawToward(hero.mesh.rotation.y, targetYaw, dt * 8.2);
    }
  }

  if (hero.isJumping && hero.state !== "attack" && hero.state !== "hurt") {
    hero.state = "jump";
  }

  animateHero(time, dt);
}

function computeCameraRelativeMoveVector(inputRight, inputForward, outVector) {
  outVector.set(0, 0, 0);
  if (inputRight === 0 && inputForward === 0) {
    return outVector;
  }

  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  if (cameraForward.lengthSq() < 1e-6) {
    cameraForward.set(0, 0, -1);
  } else {
    cameraForward.normalize();
  }

  cameraRight.crossVectors(cameraForward, upAxis).normalize();
  outVector
    .addScaledVector(cameraRight, inputRight)
    .addScaledVector(cameraForward, inputForward);

  if (outVector.lengthSq() > 0) {
    outVector.normalize();
  }
  return outVector;
}

function updateMinotaur(dt, time) {
  if (minotaur.model.enabled && minotaur.model.mixer) {
    minotaur.model.mixer.update(dt);
  }

  if (minotaur.dead) {
    animateMinotaur(time, dt);
    return;
  }
  if (hero.dead) {
    minotaur.state = "idle";
    animateMinotaur(time, dt);
    return;
  }

  minotaur.attackCooldown = Math.max(0, minotaur.attackCooldown - dt);
  updateMinotaurAiTimers(dt);

  if (minotaur.hurtTimer > 0) {
    minotaur.hurtTimer = Math.max(0, minotaur.hurtTimer - dt);
    minotaur.state = "hurt";
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.chargeWindup > 0) {
    minotaur.state = "charge_windup";
    minotaur.chargeWindup = Math.max(0, minotaur.chargeWindup - dt);
    if (minotaur.chargeWindup <= 0) {
      minotaur.state = "charge";
      minotaur.chargeTimer = 0.92;
      minotaur.chargeDidHit = false;
      minotaur.chargeRemaining = minotaur.chargeDistance;
    }
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.chargeTimer > 0) {
    minotaur.state = "charge";
    minotaur.chargeTimer = Math.max(0, minotaur.chargeTimer - dt);

    const plannedStep = minotaur.speed * 2.2 * dt;
    const step = Math.min(plannedStep, Math.max(0, minotaur.chargeRemaining));
    const beforeX = minotaur.mesh.position.x;
    const beforeZ = minotaur.mesh.position.z;
    minotaur.mesh.position.addScaledVector(minotaur.chargeDir, step);
    clampToArena(minotaur.mesh, 15.4);
    const moved = Math.hypot(minotaur.mesh.position.x - beforeX, minotaur.mesh.position.z - beforeZ);
    minotaur.chargeRemaining = Math.max(0, minotaur.chargeRemaining - moved);

    if (moved < plannedStep * 0.35 || minotaur.chargeRemaining <= 0.02) {
      minotaur.chargeTimer = 0;
    }

    if (!minotaur.chargeDidHit) {
      performMinotaurChargeHitCheck();
      if (hero.hurtTimer > 0 || hero.dead) {
        minotaur.chargeDidHit = true;
        minotaur.chargeTimer = Math.min(minotaur.chargeTimer, 0.2);
      }
    }
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.slamWindup > 0) {
    minotaur.state = "slam_windup";
    minotaur.slamWindup = Math.max(0, minotaur.slamWindup - dt);
    if (minotaur.slamWindup <= 0) {
      minotaur.state = "slam";
      minotaur.slamTimer = 0.48;
      minotaur.slamDidHit = false;
    }
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.slamTimer > 0) {
    minotaur.state = "slam";
    minotaur.slamTimer = Math.max(0, minotaur.slamTimer - dt);
    const slamProgress = 1 - minotaur.slamTimer / 0.48;
    if (!minotaur.slamDidHit && slamProgress >= 0.62) {
      minotaur.slamDidHit = true;
      performMinotaurSlamHitCheck();
    }
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.attackTimer > 0) {
    minotaur.state = "attack";
    minotaur.attackTimer = Math.max(0, minotaur.attackTimer - dt);

    tmpVecD.subVectors(hero.mesh.position, minotaur.mesh.position);
    tmpVecD.y = 0;
    if (tmpVecD.lengthSq() > 1e-6) {
      const attackFacingYaw = Math.atan2(tmpVecD.x, tmpVecD.z);
      minotaur.mesh.rotation.y = rotateYawToward(minotaur.mesh.rotation.y, attackFacingYaw, dt * 7.5);
    }

    tmpVecB.set(Math.sin(minotaur.mesh.rotation.y), 0, Math.cos(minotaur.mesh.rotation.y));
    minotaur.mesh.position.addScaledVector(tmpVecB, dt * 0.55);
    clampToArena(minotaur.mesh, 15.4);

    const progress = 1 - minotaur.attackTimer / minotaur.attackDuration;
    if (!minotaur.attackDidHit && progress >= 0.58) {
      minotaur.attackDidHit = true;
      performMinotaurHitCheck();
    }
    animateMinotaur(time, dt);
    return;
  }

  tmpVecA.subVectors(hero.mesh.position, minotaur.mesh.position);
  tmpVecA.y = 0;
  const centerDistance = tmpVecA.length();
  if (centerDistance > 1e-6) {
    tmpVecA.multiplyScalar(1 / centerDistance);
  } else {
    tmpVecA.set(0, 0, 1);
  }
  const edgeDistance = centerDistance - (hero.colliderRadius + minotaur.colliderRadius);
  const facingYaw = Math.atan2(tmpVecA.x, tmpVecA.z);
  minotaur.mesh.rotation.y = rotateYawToward(minotaur.mesh.rotation.y, facingYaw, dt * 5.2);

  const pressureFactor = hero.attackTimer > 0 ? 1.12 : 1;
  const canCharge =
    minotaur.chargeCooldown <= 0 &&
    edgeDistance > 3.6 &&
    edgeDistance < 10.0 &&
    hero.isJumping === false &&
    hero.attackTimer <= 0;

  const canSlam = minotaur.slamCooldown <= 0 && edgeDistance > 0.35 && edgeDistance < 3.0;
  const closePressure = edgeDistance < 1.2;
  const slamChance = closePressure ? 0.03 + dt * 1.7 : 0.012 + dt * 0.8;

  if (edgeDistance < 0.72 && minotaur.attackCooldown <= 0 && minotaur.slamWindup <= 0) {
    minotaur.state = "attack";
    minotaur.attackTimer = minotaur.attackDuration;
    minotaur.attackCooldown = 0.58 + Math.random() * 0.26;
    minotaur.attackDidHit = false;
    animateMinotaur(time, dt);
    return;
  }

  if (canSlam && Math.random() < slamChance) {
    minotaur.state = "slam_windup";
    minotaur.slamWindup = 0.78;
    minotaur.slamCooldown = closePressure ? 2.9 : 4.4;
    minotaur.attackCooldown = Math.max(minotaur.attackCooldown, 0.9);
    animateMinotaur(time, dt);
    return;
  }

  if (canCharge && Math.random() < 0.008 + dt * 0.75) {
    beginMinotaurCharge(hero.mesh.position);
    animateMinotaur(time, dt);
    return;
  }

  if (edgeDistance > minotaur.desiredRange + 2.6) {
    if (minotaur.burstTimer <= 0 && Math.random() < 0.18) {
      minotaur.burstTimer = 0.42;
    }
    const chaseSpeed = minotaur.speed * (minotaur.burstTimer > 0 ? 1.35 : 1.05) * pressureFactor;
    minotaur.mesh.position.addScaledVector(tmpVecA, chaseSpeed * dt);
    minotaur.state = "run";
    clampToArena(minotaur.mesh, 15.4);
  } else if (edgeDistance > minotaur.desiredRange + 0.45) {
    tmpVecC.crossVectors(tmpVecA, upAxis).normalize();
    const forwardStep = minotaur.speed * 0.62;
    const strafeStep = minotaur.speed * 0.92;
    minotaur.mesh.position.addScaledVector(tmpVecA, forwardStep * dt);
    minotaur.mesh.position.addScaledVector(tmpVecC, strafeStep * minotaur.strafeDir * dt);
    minotaur.state = "strafe";
    clampToArena(minotaur.mesh, 15.4);
  } else if (edgeDistance < minotaur.desiredRange - 0.65) {
    if (minotaur.retreatTimer <= 0 && Math.random() < 0.35) {
      minotaur.retreatTimer = 0.28 + Math.random() * 0.28;
    }
    if (minotaur.retreatTimer > 0) {
      tmpVecC.crossVectors(tmpVecA, upAxis).normalize();
      const retreatSpeed = minotaur.speed * 0.75;
      minotaur.mesh.position.addScaledVector(tmpVecA, -retreatSpeed * dt);
      minotaur.mesh.position.addScaledVector(tmpVecC, minotaur.strafeDir * retreatSpeed * 0.55 * dt);
      minotaur.state = "strafe";
      clampToArena(minotaur.mesh, 15.4);
    } else if (minotaur.attackCooldown <= 0) {
      minotaur.state = "attack";
      minotaur.attackTimer = minotaur.attackDuration;
      minotaur.attackCooldown = 1.05 + Math.random() * 0.55;
      minotaur.attackDidHit = false;
    } else {
      minotaur.state = "idle";
    }
  } else if (minotaur.attackCooldown <= 0) {
    minotaur.state = "attack";
    minotaur.attackTimer = minotaur.attackDuration;
    minotaur.attackCooldown = 1.0 + Math.random() * 0.45;
    minotaur.attackDidHit = false;
  } else {
    tmpVecC.crossVectors(tmpVecA, upAxis).normalize();
    minotaur.mesh.position.addScaledVector(tmpVecC, minotaur.strafeDir * minotaur.speed * 0.65 * dt);
    minotaur.state = "strafe";
    clampToArena(minotaur.mesh, 15.4);
  }

  animateMinotaur(time, dt);
}

function updateCamera() {
  const shakeOffsetX = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength : 0;
  const shakeOffsetY = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength * 0.6 : 0;
  const shakeOffsetZ = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength : 0;
  const lockOnActive = !hero.dead && !minotaur.dead;
  const camScale = HERO_CAMERA_SCALE;
  const followDistance = CAMERA_THIRD_PERSON_DISTANCE * camScale;
  const followHeight = CAMERA_THIRD_PERSON_HEIGHT * camScale;
  const sideOffset = CAMERA_THIRD_PERSON_SIDE * camScale;
  const lookHeightBase = CAMERA_THIRD_PERSON_LOOK_HEIGHT * camScale;
  const dynamicLookHeight = hero.model.enabled
    ? Math.max(0.5, Math.min(lookHeightBase, hero.model.height * 0.55))
    : lookHeightBase;

  tmpVecD.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y));
  if (tmpVecD.lengthSq() < 1e-6) {
    tmpVecD.set(0, 0, 1);
  } else {
    tmpVecD.normalize();
  }
  cameraRight.crossVectors(tmpVecD, upAxis).normalize();

  cameraDesiredPosition
    .copy(hero.mesh.position)
    .addScaledVector(tmpVecD, -followDistance)
    .addScaledVector(cameraRight, sideOffset);
  cameraDesiredPosition.y = hero.mesh.position.y + followHeight;

  cameraLookTarget
    .copy(hero.mesh.position)
    .addScaledVector(tmpVecD, 0.72)
    .addScaledVector(upAxis, dynamicLookHeight);

  if (lockOnActive) {
    cameraLookTarget.lerp(
      tmpVecA.copy(minotaur.mesh.position).addScaledVector(upAxis, 1.25),
      0.08
    );
  }

  clampVectorXZ(cameraDesiredPosition, CAMERA_MAX_RADIUS);
  camera.position.copy(cameraDesiredPosition);
  camera.position.x += shakeOffsetX;
  camera.position.y += shakeOffsetY;
  camera.position.z += shakeOffsetZ;
  camera.lookAt(cameraLookTarget);
}

function updateCameraOcclusion() {
  for (let i = 0; i < arenaPillars.length; i += 1) {
    arenaPillars[i].material.opacity = 1;
  }
  arenaWall.material.opacity = 1;

  tmpVecA.copy(camera.position);
  tmpVecB.copy(hero.mesh.position).addScaledVector(upAxis, 1.05);
  tmpVecC.subVectors(tmpVecB, tmpVecA);
  const rayDistance = tmpVecC.length();
  if (rayDistance < 1e-4) {
    return;
  }
  tmpVecC.multiplyScalar(1 / rayDistance);

  occlusionRaycaster.set(tmpVecA, tmpVecC);
  const hits = occlusionRaycaster.intersectObjects(occluderMeshes, false);
  for (let i = 0; i < hits.length; i += 1) {
    if (hits[i].distance >= rayDistance - 0.15) {
      continue;
    }
    const mesh = hits[i].object;
    if (!mesh.material) {
      continue;
    }
    mesh.material.opacity = mesh === arenaWall ? 0.18 : 0.28;
  }
}

function updateDebugView() {
  if (!debugViewEnabled) {
    heroColliderDebug.visible = false;
    minotaurColliderDebug.visible = false;
    debugDistanceLine.visible = false;
    debugForwardArrow.visible = false;
    debugPanel.style.display = "none";
    return;
  }

  const toEnemy = tmpVecA.subVectors(minotaur.mesh.position, hero.mesh.position);
  toEnemy.y = 0;
  const centerDistance = toEnemy.length();
  const edgeDistance = centerDistance - (hero.colliderRadius + minotaur.colliderRadius);
  if (toEnemy.lengthSq() > 1e-6) {
    toEnemy.normalize();
  } else {
    toEnemy.set(0, 0, 1);
  }

  const minotaurForward = tmpVecB.set(Math.sin(minotaur.mesh.rotation.y), 0, Math.cos(minotaur.mesh.rotation.y));
  const minotaurFacingDot = minotaurForward.dot(tmpVecC.copy(toEnemy).multiplyScalar(-1));

  heroColliderDebug.visible = true;
  heroColliderDebug.position.set(hero.mesh.position.x, 0.08, hero.mesh.position.z);
  heroColliderDebug.scale.setScalar(hero.colliderRadius);

  minotaurColliderDebug.visible = true;
  minotaurColliderDebug.position.set(minotaur.mesh.position.x, 0.08, minotaur.mesh.position.z);
  minotaurColliderDebug.scale.setScalar(minotaur.colliderRadius);

  const linePos = debugDistanceLine.geometry.attributes.position;
  linePos.setXYZ(0, hero.mesh.position.x, 0.1, hero.mesh.position.z);
  linePos.setXYZ(1, minotaur.mesh.position.x, 0.1, minotaur.mesh.position.z);
  linePos.needsUpdate = true;
  debugDistanceLine.visible = true;

  debugForwardArrow.position.set(minotaur.mesh.position.x, 0.12, minotaur.mesh.position.z);
  debugForwardArrow.setDirection(tmpVecD.copy(minotaurForward).normalize());
  debugForwardArrow.setLength(1.4, 0.35, 0.2);
  debugForwardArrow.visible = true;

  debugPanel.style.display = "block";
  debugPanel.textContent =
    `DEBUG ON (${DEBUG_TOGGLE_KEY})\n` +
    `centerDist: ${centerDistance.toFixed(3)}\n` +
    `edgeDist:   ${edgeDistance.toFixed(3)}\n` +
    `heroCol:    ${hero.colliderRadius.toFixed(3)}\n` +
    `minoCol:    ${minotaur.colliderRadius.toFixed(3)}\n` +
    `minoDot:    ${minotaurFacingDot.toFixed(3)}\n` +
    `atkEdgeMax: ${MINOTAUR_ATTACK_EDGE_RANGE.toFixed(3)}`;
}

const testMoveVec = new THREE.Vector3();

window.__AegisTestAPI = {
  resetBattle,
  step(dt, time) {
    if (hitStopTimer > 0) {
      hitStopTimer = Math.max(0, hitStopTimer - dt);
    } else {
      updateHero(dt, time);
      updateMinotaur(dt, time);
      resolveCharacterSeparation();
    }
    updateCombatFeedback(dt);
    keepMinotaurModelGrounded();
    updateCamera();
    updateCameraOcclusion();
    updateDebugView();
    updateSkillTelegraphs(dt, time);
    updateHud();
    updateOutcomeEffects(dt, time);
  },
  setKeys(nextKeys) {
    Object.keys(keyState).forEach((key) => {
      keyState[key] = false;
    });
    Object.keys(nextKeys).forEach((key) => {
      keyState[key] = !!nextKeys[key];
    });
  },
  setHeroDead() {
    hero.hp = 0;
    hero.dead = true;
    hero.state = "dead";
  },
  setMinotaurDead() {
    minotaur.hp = 0;
    minotaur.dead = true;
    minotaur.state = "dead";
  },
  setHeroPosition(x, z) {
    hero.mesh.position.set(x, 0, z);
  },
  setHeroRotationY(yaw) {
    hero.mesh.rotation.y = yaw;
  },
  setMinotaurPosition(x, z) {
    minotaur.mesh.position.set(x, 0, z);
  },
  setCamera(position, lookAt) {
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  },
  getHeroPosition() {
    return hero.mesh.position.clone();
  },
  getHeroDeadPose() {
    return {
      hipsX: hero.rig.hips.rotation.x,
      hipsZ: hero.rig.hips.rotation.z,
    };
  },
  getMinotaurDeadPose() {
    return {
      hipsX: minotaur.rig.hips.rotation.x,
      hipsZ: minotaur.rig.hips.rotation.z,
    };
  },
  getCameraForward() {
    return camera.getWorldDirection(new THREE.Vector3());
  },
  computeMoveVector(inputRight, inputForward) {
    return computeCameraRelativeMoveVector(inputRight, inputForward, testMoveVec).clone();
  },
};

function updateHud() {
  const heroRatio = (hero.hp / hero.maxHp) * 100;
  const minotaurRatio = (minotaur.hp / minotaur.maxHp) * 100;
  hudHeroHp.style.width = `${heroRatio}%`;
  hudMinotaurHp.style.width = `${minotaurRatio}%`;

  if (!hero.dead && !minotaur.dead) {
    if (hero.attackTimer > 0) {
      setStatus(hero.attackType === "heavy" ? "강공격 발동" : "약공격 발동");
    } else if (minotaur.state === "slam_windup") {
      setStatus("미노타우르스 지면 강타 준비!");
    } else if (minotaur.state === "slam") {
      setStatus("충격파 범위 이탈!");
    } else if (minotaur.state === "charge_windup") {
      setStatus("미노타우르스 돌격 준비!");
    } else if (minotaur.state === "charge") {
      setStatus("돌격 회피!");
    } else if (minotaur.attackTimer > 0) {
      setStatus("미노타우르스 공격 대비");
    } else if (hero.state === "run") {
      setStatus("접근해서 공격해봐");
    } else {
      setStatus("좌클릭 짧게 약공격 / 길게 강공격");
    }
  }
}

function updateCombatFeedback(dt) {
  if (cameraShakeTime > 0) {
    cameraShakeTime = Math.max(0, cameraShakeTime - dt);
    cameraShakeStrength = Math.max(0, cameraShakeStrength - dt * 1.4);
  }

  if (hitFlashAlpha > 0) {
    hitFlashAlpha = Math.max(0, hitFlashAlpha - dt * 3.4);
    hitFlash.style.opacity = String(hitFlashAlpha);
  } else {
    hitFlash.style.opacity = "0";
  }
}

function updateSkillTelegraphs(dt, elapsed) {
  const showSlamWarning = minotaur.state === "slam_windup";
  const showChargeWarning = minotaur.state === "charge_windup";
  const showChargeActive = minotaur.state === "charge";

  if (showSlamWarning) {
    const pulse = 0.78 + Math.sin(elapsed * 18) * 0.16;
    slamRangeIndicator.visible = true;
    slamRangeIndicator.position.x = minotaur.mesh.position.x;
    slamRangeIndicator.position.z = minotaur.mesh.position.z;
    slamRangeIndicator.material.opacity = pulse;
    warningBanner.style.opacity = "1";
    warningBanner.style.transform = "translate(-50%, -50%) scale(1)";
    warningBanner.style.borderColor = "rgba(255,110,110,0.92)";
    warningBanner.style.background = "rgba(42,12,12,0.84)";
    warningBanner.style.color = "#ffd0d0";
    warningBanner.textContent = "지면 강타 주의";
  } else {
    slamRangeIndicator.visible = false;
  }

  if (showChargeWarning || showChargeActive) {
    const pulse = showChargeWarning ? 0.62 + Math.sin(elapsed * 14) * 0.15 : 0.56;
    chargeLaneIndicator.visible = true;
    const dir = tmpVecC.copy(minotaur.chargeDir).normalize();
    const laneLength = Math.max(1.6, minotaur.chargeDistance || 9.6);
    tmpVecD.copy(minotaur.chargeOrigin).addScaledVector(dir, laneLength);
    chargeLaneIndicator.scale.set(1, laneLength, 1);
    chargeLaneIndicator.position.copy(minotaur.chargeOrigin).lerp(tmpVecD, 0.5);
    chargeLaneIndicator.position.y = 0.05;
    chargeLaneIndicator.rotation.y = Math.atan2(dir.x, dir.z);
    chargeLaneIndicator.material.opacity = pulse;

    if (!showSlamWarning) {
      warningBanner.style.opacity = "1";
      warningBanner.style.transform = "translate(-50%, -50%) scale(1)";
      warningBanner.style.borderColor = "rgba(255,186,116,0.92)";
      warningBanner.style.background = "rgba(45,24,8,0.84)";
      warningBanner.style.color = "#ffe6c8";
      warningBanner.textContent = showChargeWarning ? "돌진 준비" : "돌진! 옆으로 회피";
    }
  } else {
    chargeLaneIndicator.visible = false;
  }

  if (!showSlamWarning && !showChargeWarning && !showChargeActive) {
    warningBanner.style.opacity = "0";
    warningBanner.style.transform = "translate(-50%, -50%) scale(0.92)";
    warningBanner.textContent = "";
  }

  if (slamShockwaveTimer > 0) {
    slamShockwaveTimer = Math.max(0, slamShockwaveTimer - dt);
    const progress = 1 - slamShockwaveTimer / 0.42;
    slamImpactRing.visible = true;
    slamImpactRing.position.x = minotaur.mesh.position.x;
    slamImpactRing.position.z = minotaur.mesh.position.z;
    slamImpactRing.scale.setScalar(1 + progress * 5.2);
    slamImpactRing.material.opacity = Math.max(0, 0.88 - progress * 0.88);
  } else {
    slamImpactRing.visible = false;
  }
}

function updateOutcomeEffects(dt, elapsed) {
  if (outcomeState !== previousOutcomeState) {
    if (outcomeState === "win") {
      stopBackgroundMusic();
      playOutcomeStinger("win");
      for (let i = 0; i < 1; i += 1) {
        spawnVictoryBurst();
      }
    } else if (outcomeState === "lose") {
      stopBackgroundMusic();
      playOutcomeStinger("lose");
      for (let i = 0; i < 24; i += 1) {
        spawnDefeatDrift();
      }
    }
    previousOutcomeState = outcomeState;
  }

  if (outcomeState === "none") {
    outcomeOverlay.style.opacity = "0";
    outcomeText.style.opacity = "0";
    updateFxParticles(dt);
    return;
  }

  outcomePulse = Math.min(1.6, outcomePulse + dt);
  const pulse = 0.5 + Math.sin(elapsed * 6.2) * 0.5;

  if (outcomeState === "win") {
    winFireworkTimer -= dt;
    if (winFireworkTimer <= 0) {
      spawnVictoryBurst();
      winFireworkTimer = 0.5 + Math.random() * 0.35;
    }

    outcomeOverlay.style.background =
      "radial-gradient(circle at center, rgba(255,232,154,0.35) 0%, rgba(255,214,112,0.16) 45%, rgba(16,20,26,0.05) 100%)";
    outcomeOverlay.style.opacity = String(Math.min(0.88, 0.3 + outcomePulse * 0.35));
    outcomeText.style.color = "#ffe28f";
    outcomeText.style.textShadow = "0 0 22px rgba(255,225,120,0.65)";
    outcomeText.style.opacity = "1";
    outcomeText.style.transform = `translate(-50%, -50%) scale(${1 + pulse * 0.04})`;
    updateFxParticles(dt);
    return;
  }

  loseDriftTimer -= dt;
  if (loseDriftTimer <= 0) {
    spawnDefeatDrift();
    loseDriftTimer = 0.1;
  }

  outcomeOverlay.style.background =
    "radial-gradient(circle at center, rgba(255,120,120,0.1) 0%, rgba(110,18,18,0.38) 52%, rgba(20,0,0,0.72) 100%)";
  outcomeOverlay.style.opacity = String(Math.min(0.92, 0.42 + outcomePulse * 0.3));
  outcomeText.style.color = "#ff9a9a";
  outcomeText.style.textShadow = "0 0 20px rgba(255,90,90,0.55)";
  outcomeText.style.opacity = "1";
  outcomeText.style.transform = `translate(-50%, -50%) scale(${1 + pulse * 0.03})`;
  updateFxParticles(dt);
}

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  if (hitStopTimer > 0) {
    hitStopTimer = Math.max(0, hitStopTimer - dt);
  } else {
    updateHero(dt, elapsed);
    updateMinotaur(dt, elapsed);
    resolveCharacterSeparation();
  }

  updateCombatFeedback(dt);
  keepMinotaurModelGrounded();
  updateCamera();
  updateCameraOcclusion();
  updateDebugView();
  updateSkillTelegraphs(dt, elapsed);
  updateHud();
  updateOutcomeEffects(dt, elapsed);

  runeRing.material.emissiveIntensity = 0.6 + Math.sin(elapsed * 2.2) * 0.15;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
  resizeFxCanvas();
});

// Replace guide:
// - heroVisual.root and minotaurVisual.root are placeholder groups.
// - When your GLB is ready, remove placeholder children and attach loaded model root.
