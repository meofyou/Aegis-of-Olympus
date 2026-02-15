if (!window.THREE) {
  const status = document.getElementById("status");
  if (status) {
    status.textContent =
      "Three.js 로드 실패. 인터넷 연결 확인 후 새로고침하거나 로컬 서버로 실행해 주세요.";
  }
  throw new Error("THREE global not found");
}

const THREE = window.THREE;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x32465f);
scene.fog = new THREE.Fog(0x32465f, 22, 78);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 50;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(17, 17.5, 0.3, 48),
  new THREE.MeshStandardMaterial({
    color: 0x2a2e39,
    roughness: 0.9,
    metalness: 0.05,
  })
);
ground.position.y = -0.16;
ground.receiveShadow = true;
scene.add(ground);

const runeRing = new THREE.Mesh(
  new THREE.TorusGeometry(16.2, 0.08, 8, 96),
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
const pillarGeo = new THREE.CylinderGeometry(0.52, 0.62, 3.8, 8);
const pillarMat = new THREE.MeshStandardMaterial({
  color: 0x666f84,
  roughness: 0.78,
  metalness: 0.1,
});
for (let i = 0; i < 10; i += 1) {
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  const angle = (i / 10) * Math.PI * 2;
  pillar.position.set(Math.sin(angle) * 15.4, 1.9, Math.cos(angle) * 15.4);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  arenaColumns.add(pillar);
}
scene.add(arenaColumns);

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

const keyState = Object.create(null);
let attackQueued = false;
let outcomeState = "none";
let outcomePulse = 0;
let previousOutcomeState = "none";
let hitFlashAlpha = 0;
let cameraShakeTime = 0;
let cameraShakeStrength = 0;
let hitStopTimer = 0;

let audioCtx = null;
let audioMaster = null;
let audioMusicGain = null;
let audioSfxGain = null;
let musicStarted = false;
let musicStep = 0;
let musicIntervalId = null;

const fxParticles = [];
let winFireworkTimer = 0;
let loseDriftTimer = 0;

window.addEventListener("keydown", (event) => {
  ensureAudio();
  keyState[event.code] = true;
  if (event.code === "KeyJ") {
    attackQueued = true;
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
    attackQueued = true;
  }
});

window.addEventListener("touchstart", () => {
  ensureAudio();
}, { passive: true });

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const upAxis = new THREE.Vector3(0, 1, 0);
const moveInput = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraDesiredPosition = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();
const toEnemyFlat = new THREE.Vector3();

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
  audioMaster.gain.value = 0.5;
  audioMaster.connect(audioCtx.destination);

  audioMusicGain = audioCtx.createGain();
  audioMusicGain.gain.value = 0.85;
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
  const base = isHeavy ? 140 : 200;
  playTone(base, now, 0.11, isHeavy ? 0.2 : 0.15, "triangle");
  playTone(base * 1.6, now + 0.01, 0.08, isHeavy ? 0.13 : 0.1, "square");
  playNoiseBurst(now, isHeavy ? 0.09 : 0.06, isHeavy ? 0.16 : 0.1);
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
  if (!audioCtx || musicStarted) {
    return;
  }
  musicStarted = true;

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

function triggerHitImpact(strength, flashColor) {
  hitStopTimer = Math.max(hitStopTimer, 0.03 + strength * 0.02);
  cameraShakeTime = Math.max(cameraShakeTime, 0.11 + strength * 0.07);
  cameraShakeStrength = Math.max(cameraShakeStrength, 0.12 + strength * 0.22);
  hitFlashAlpha = Math.max(hitFlashAlpha, 0.12 + strength * 0.28);
  hitFlash.style.background = flashColor;
}

function spawnFxParticle(x, y, vx, vy, life, size, color, gravity) {
  fxParticles.push({ x, y, vx, vy, life, maxLife: life, size, color, gravity: gravity || 0 });
}

function spawnVictoryBurst() {
  const cx = fxCanvas.width * 0.5 + (Math.random() - 0.5) * (fxCanvas.width * 0.38);
  const cy = fxCanvas.height * (0.28 + Math.random() * 0.24);
  const colors = ["#ffe785", "#ffd26e", "#fff1bf", "#8fd7ff"];
  for (let i = 0; i < 38; i += 1) {
    const angle = (i / 38) * Math.PI * 2;
    const speed = 90 + Math.random() * 220;
    spawnFxParticle(
      cx,
      cy,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0.85 + Math.random() * 0.7,
      2 + Math.random() * 3,
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
    2 + Math.random() * 2,
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
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fxCtx.fill();
  }

  fxCtx.globalAlpha = 1;
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

const heroVisual = createHeroPlaceholder();
const minotaurVisual = createMinotaurPlaceholder();
scene.add(heroVisual.root);
scene.add(minotaurVisual.root);

const hero = {
  mesh: heroVisual.root,
  rig: heroVisual.rig,
  maxHp: 120,
  hp: 120,
  speed: 4.4,
  runMultiplier: 1.55,
  state: "idle",
  hurtTimer: 0,
  attackTimer: 0,
  attackDuration: 0.36,
  attackCooldown: 0,
  attackDidHit: false,
  dead: false,
};

const minotaur = {
  mesh: minotaurVisual.root,
  rig: minotaurVisual.rig,
  maxHp: 260,
  hp: 260,
  speed: 3.2,
  state: "idle",
  hurtTimer: 0,
  attackTimer: 0,
  attackDuration: 0.74,
  attackCooldown: 0,
  attackDidHit: false,
  dead: false,
};

function resetBattle() {
  hero.hp = hero.maxHp;
  hero.hurtTimer = 0;
  hero.attackTimer = 0;
  hero.attackCooldown = 0;
  hero.attackDidHit = false;
  hero.state = "idle";
  hero.dead = false;
  hero.mesh.position.set(0, 0, 8);
  hero.mesh.rotation.set(0, Math.PI, 0);

  minotaur.hp = minotaur.maxHp;
  minotaur.hurtTimer = 0;
  minotaur.attackTimer = 0;
  minotaur.attackCooldown = 0;
  minotaur.attackDidHit = false;
  minotaur.state = "idle";
  minotaur.dead = false;
  minotaur.mesh.position.set(0, 0, -7);
  minotaur.mesh.rotation.set(0, 0, 0);

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

  statusEl.textContent = "전투 시작";
}

resetBattle();

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

function tryHeroAttack() {
  if (hero.dead || minotaur.dead || hero.attackCooldown > 0 || hero.attackTimer > 0) {
    return;
  }
  hero.state = "attack";
  hero.attackTimer = hero.attackDuration;
  hero.attackCooldown = 0.58;
  hero.attackDidHit = false;
}

function performHeroHitCheck() {
  tmpVecA.subVectors(minotaur.mesh.position, hero.mesh.position);
  const distance = tmpVecA.length();
  if (distance > 2.4) {
    return;
  }
  tmpVecA.normalize();
  tmpVecB.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y));
  const dot = tmpVecB.dot(tmpVecA);
  if (dot < 0.2) {
    return;
  }
  takeMinotaurDamage(34);
  minotaur.mesh.position.addScaledVector(tmpVecA, 0.4);
  triggerHitImpact(0.62, "rgba(255,240,210,0.9)");
  playHitSound(false);
}

function performMinotaurHitCheck() {
  tmpVecA.subVectors(hero.mesh.position, minotaur.mesh.position);
  const distance = tmpVecA.length();
  if (distance > 2.9) {
    return;
  }
  tmpVecA.normalize();
  tmpVecB.set(Math.sin(minotaur.mesh.rotation.y), 0, Math.cos(minotaur.mesh.rotation.y));
  if (tmpVecB.dot(tmpVecA) < 0.15) {
    return;
  }
  takeHeroDamage(24);
  hero.mesh.position.addScaledVector(tmpVecA, 0.45);
  triggerHitImpact(0.92, "rgba(255,125,125,0.92)");
  playHitSound(true);
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

  const runFactor = minotaur.state === "run" ? 1 : 0;
  const cycle = Math.sin(time * 7);
  rig.hips.position.y = 1.3 + runFactor * Math.abs(cycle) * 0.06;
  rig.leftLegUpper.rotation.x = cycle * 0.65 * runFactor;
  rig.rightLegUpper.rotation.x = -cycle * 0.65 * runFactor;
  rig.leftLegLower.rotation.x = Math.max(0, -cycle) * 0.62 * runFactor;
  rig.rightLegLower.rotation.x = Math.max(0, cycle) * 0.62 * runFactor;
  rig.leftArmUpper.rotation.x = -cycle * 0.45 * runFactor;
  rig.rightArmUpper.rotation.x = cycle * 0.45 * runFactor;
  rig.torso.rotation.y = 0;

  if (minotaur.state === "hurt") {
    rig.torso.rotation.z = Math.sin(time * 60) * 0.06;
    return;
  }

  rig.torso.rotation.z = 0;

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

function updateHero(dt, time) {
  if (hero.dead) {
    animateHero(time, dt);
    return;
  }

  hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);

  if (hero.hurtTimer > 0) {
    hero.hurtTimer = Math.max(0, hero.hurtTimer - dt);
    hero.state = "hurt";
    animateHero(time, dt);
    return;
  }

  if (attackQueued) {
    tryHeroAttack();
    attackQueued = false;
  }

  if (hero.attackTimer > 0) {
    hero.state = "attack";
    hero.attackTimer = Math.max(0, hero.attackTimer - dt);
    const progress = 1 - hero.attackTimer / hero.attackDuration;
    if (!hero.attackDidHit && progress >= 0.55) {
      hero.attackDidHit = true;
      performHeroHitCheck();
    }
    hero.mesh.position.addScaledVector(
      tmpVecA.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y)),
      dt * 1.4
    );
    clampToArena(hero.mesh, 15.8);
    animateHero(time, dt);
    return;
  }

  const inputForward = (keyState.KeyW ? 1 : 0) - (keyState.KeyS ? 1 : 0);
  const inputRight = (keyState.KeyD ? 1 : 0) - (keyState.KeyA ? 1 : 0);
  moveInput.set(inputRight, 0, inputForward);
  const lockOnActive = !hero.dead && !minotaur.dead;

  if (moveInput.lengthSq() > 0) {
    computeCameraRelativeMoveVector(moveInput.x, moveInput.z, tmpVecA);

    const isRunning = !!keyState.ShiftLeft || !!keyState.ShiftRight;
    const speed = hero.speed * (isRunning ? hero.runMultiplier : 1);
    hero.mesh.position.addScaledVector(tmpVecA, speed * dt);
    hero.state = "run";
    clampToArena(hero.mesh, 15.8);

    if (!lockOnActive) {
      hero.mesh.rotation.y = Math.atan2(tmpVecA.x, tmpVecA.z);
    }
  } else {
    hero.state = "idle";
  }

  if (lockOnActive) {
    toEnemyFlat.subVectors(minotaur.mesh.position, hero.mesh.position);
    toEnemyFlat.y = 0;
    if (toEnemyFlat.lengthSq() > 1e-6) {
      const targetYaw = Math.atan2(toEnemyFlat.x, toEnemyFlat.z);
      hero.mesh.rotation.y = rotateYawToward(hero.mesh.rotation.y, targetYaw, dt * 8.2);
    }
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

  if (minotaur.hurtTimer > 0) {
    minotaur.hurtTimer = Math.max(0, minotaur.hurtTimer - dt);
    minotaur.state = "hurt";
    animateMinotaur(time, dt);
    return;
  }

  if (minotaur.attackTimer > 0) {
    minotaur.state = "attack";
    minotaur.attackTimer = Math.max(0, minotaur.attackTimer - dt);
    const progress = 1 - minotaur.attackTimer / minotaur.attackDuration;
    if (!minotaur.attackDidHit && progress >= 0.58) {
      minotaur.attackDidHit = true;
      performMinotaurHitCheck();
    }
    animateMinotaur(time, dt);
    return;
  }

  tmpVecA.subVectors(hero.mesh.position, minotaur.mesh.position);
  const distance = tmpVecA.length();

  if (distance > 2.8) {
    tmpVecA.normalize();
    minotaur.mesh.position.addScaledVector(tmpVecA, minotaur.speed * dt);
    minotaur.mesh.rotation.y = Math.atan2(tmpVecA.x, tmpVecA.z);
    minotaur.state = "run";
    clampToArena(minotaur.mesh, 15.4);
  } else if (minotaur.attackCooldown <= 0) {
    minotaur.state = "attack";
    minotaur.attackTimer = minotaur.attackDuration;
    minotaur.attackCooldown = 1.55;
    minotaur.attackDidHit = false;
  } else {
    minotaur.state = "idle";
  }

  animateMinotaur(time, dt);
}

function updateCamera() {
  const shakeOffsetX = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength : 0;
  const shakeOffsetY = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength * 0.6 : 0;
  const shakeOffsetZ = cameraShakeTime > 0 ? (Math.random() - 0.5) * cameraShakeStrength : 0;
  const lockOnActive = !hero.dead && !minotaur.dead;

  if (lockOnActive) {
    toEnemyFlat.subVectors(minotaur.mesh.position, hero.mesh.position);
    toEnemyFlat.y = 0;

    if (toEnemyFlat.lengthSq() < 1e-6) {
      toEnemyFlat.set(Math.sin(hero.mesh.rotation.y), 0, Math.cos(hero.mesh.rotation.y));
    } else {
      toEnemyFlat.normalize();
    }

    cameraRight.crossVectors(toEnemyFlat, upAxis).normalize();

    cameraDesiredPosition
      .copy(hero.mesh.position)
      .addScaledVector(toEnemyFlat, -7.4)
      .addScaledVector(cameraRight, 1.2);
    cameraDesiredPosition.y = hero.mesh.position.y + 4.6;

    cameraLookTarget
      .copy(hero.mesh.position)
      .addScaledVector(toEnemyFlat, 2.6)
      .addScaledVector(upAxis, 1.25);

    camera.position.lerp(cameraDesiredPosition, 0.12);
    camera.position.x += shakeOffsetX;
    camera.position.y += shakeOffsetY;
    camera.position.z += shakeOffsetZ;
    camera.lookAt(cameraLookTarget);
    return;
  }

  tmpVecA.set(0, 5.4, 8.6).applyAxisAngle(upAxis, hero.mesh.rotation.y);
  tmpVecB.copy(hero.mesh.position).add(tmpVecA);
  camera.position.lerp(tmpVecB, 0.09);
  camera.position.x += shakeOffsetX;
  camera.position.y += shakeOffsetY;
  camera.position.z += shakeOffsetZ;
  camera.lookAt(hero.mesh.position.x, hero.mesh.position.y + 1.2, hero.mesh.position.z);
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
    }
    updateCombatFeedback(dt);
    updateCamera();
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
      setStatus("영웅 공격 중");
    } else if (minotaur.attackTimer > 0) {
      setStatus("미노타우르스 공격 대비");
    } else if (hero.state === "run") {
      setStatus("접근해서 공격해봐");
    } else {
      setStatus("J 또는 좌클릭으로 공격");
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

function updateOutcomeEffects(dt, elapsed) {
  if (outcomeState !== previousOutcomeState) {
    if (outcomeState === "win") {
      playOutcomeStinger("win");
      for (let i = 0; i < 2; i += 1) {
        spawnVictoryBurst();
      }
    } else if (outcomeState === "lose") {
      playOutcomeStinger("lose");
      for (let i = 0; i < 45; i += 1) {
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
    loseDriftTimer = 0.05;
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
  }

  updateCombatFeedback(dt);
  updateCamera();
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resizeFxCanvas();
});

// Replace guide:
// - heroVisual.root and minotaurVisual.root are placeholder groups.
// - When your GLB is ready, remove placeholder children and attach loaded model root.
