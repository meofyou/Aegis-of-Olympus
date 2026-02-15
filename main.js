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
scene.background = new THREE.Color(0x0f1420);
scene.fog = new THREE.Fog(0x0f1420, 18, 62);

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
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xbad1ff, 0x0f1115, 0.55);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff2d7, 1.25);
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

const keyState = Object.create(null);
let attackQueued = false;

window.addEventListener("keydown", (event) => {
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
  if (event.button === 0) {
    attackQueued = true;
  }
});

const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
const upAxis = new THREE.Vector3(0, 1, 0);

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
  leftArmUpper.position.set(-0.3, 0.65, 0);
  leftArmUpper.add(createJoint(0.07, 0xb6cbff));
  leftArmUpper.add(createBone(0.42, 0.055, 0xb6cbff));
  hips.add(leftArmUpper);

  const leftArmLower = new THREE.Group();
  leftArmLower.position.y = -0.42;
  leftArmLower.add(createJoint(0.06, 0x9eb7f2));
  leftArmLower.add(createBone(0.38, 0.05, 0x9eb7f2));
  leftArmUpper.add(leftArmLower);

  const rightArmUpper = new THREE.Group();
  rightArmUpper.position.set(0.3, 0.65, 0);
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
  sword.position.set(0, -0.5, 0.08);
  sword.castShadow = true;
  rightArmLower.add(sword);

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
}

function animateHero(time, dt) {
  const rig = hero.rig;

  if (hero.state === "dead") {
    rig.hips.rotation.z = 1.15;
    rig.leftArmUpper.rotation.x = 0.9;
    rig.rightArmUpper.rotation.x = 0.5;
    rig.leftLegUpper.rotation.x = -0.3;
    rig.rightLegUpper.rotation.x = 0.2;
    return;
  }

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
    if (progress < 0.35) {
      rig.rightArmUpper.rotation.x = -1.2;
      rig.rightArmLower.rotation.x = -0.35;
      rig.torso.rotation.y = -0.38;
    } else {
      const swing = Math.min(1, (progress - 0.35) / 0.65);
      rig.rightArmUpper.rotation.x = 1.75 - swing * 0.3;
      rig.rightArmLower.rotation.x = 0.65;
      rig.torso.rotation.y = 0.65 - swing * 0.25;
    }
    rig.leftArmUpper.rotation.x = -0.2;
    return;
  }

  rig.torso.rotation.y = 0;
  rig.rightArmUpper.rotation.z = 0;
}

function animateMinotaur(time, dt) {
  const rig = minotaur.rig;

  if (minotaur.state === "dead") {
    rig.hips.rotation.z = -1.0;
    rig.rightArmUpper.rotation.x = 0.6;
    rig.leftArmUpper.rotation.x = 0.4;
    rig.rightLegUpper.rotation.x = 0.2;
    rig.leftLegUpper.rotation.x = -0.15;
    return;
  }

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

  const moveX = (keyState.KeyD ? 1 : 0) - (keyState.KeyA ? 1 : 0);
  const moveZ = (keyState.KeyS ? 1 : 0) - (keyState.KeyW ? 1 : 0);
  tmpVecA.set(moveX, 0, moveZ);

  if (tmpVecA.lengthSq() > 0) {
    tmpVecA.normalize();
    const isRunning = !!keyState.ShiftLeft || !!keyState.ShiftRight;
    const speed = hero.speed * (isRunning ? hero.runMultiplier : 1);
    hero.mesh.position.addScaledVector(tmpVecA, speed * dt);
    hero.mesh.rotation.y = Math.atan2(tmpVecA.x, tmpVecA.z);
    hero.state = "run";
    clampToArena(hero.mesh, 15.8);
  } else {
    hero.state = "idle";
  }

  animateHero(time, dt);
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
  tmpVecA.set(0, 5.4, 8.6).applyAxisAngle(upAxis, hero.mesh.rotation.y);
  tmpVecB.copy(hero.mesh.position).add(tmpVecA);
  camera.position.lerp(tmpVecB, 0.09);
  camera.lookAt(hero.mesh.position.x, hero.mesh.position.y + 1.2, hero.mesh.position.z);
}

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

const clock = new THREE.Clock();

function tick() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  updateHero(dt, elapsed);
  updateMinotaur(dt, elapsed);
  updateCamera();
  updateHud();

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
});

// Replace guide:
// - heroVisual.root and minotaurVisual.root are placeholder groups.
// - When your GLB is ready, remove placeholder children and attach loaded model root.
