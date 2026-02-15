(function () {
  var hudHeroHp = document.getElementById("hero-hp");
  var hudMinotaurHp = document.getElementById("minotaur-hp");
  var statusEl = document.getElementById("status");

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  var width = window.innerWidth;
  var height = window.innerHeight;

  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "0";
  document.body.appendChild(canvas);

  var ctx = canvas.getContext("2d");

  var keys = Object.create(null);
  var attackQueued = false;

  window.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code === "KeyJ") attackQueued = true;
    if (e.code === "KeyR") resetBattle();
  });

  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  window.addEventListener("mousedown", function (e) {
    if (e.button === 0) attackQueued = true;
  });

  function createHero() {
    return {
      x: width * 0.5,
      y: height * 0.7,
      r: 20,
      maxHp: 120,
      hp: 120,
      speed: 270,
      dead: false,
      hurtTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      facingX: 0,
      facingY: -1,
    };
  }

  function createMinotaur() {
    return {
      x: width * 0.5,
      y: height * 0.3,
      r: 28,
      maxHp: 260,
      hp: 260,
      speed: 190,
      dead: false,
      hurtTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
    };
  }

  var hero = createHero();
  var minotaur = createMinotaur();

  function resetBattle() {
    hero = createHero();
    minotaur = createMinotaur();
    setStatus("2D 대체 모드 전투 시작");
  }

  function updateHud() {
    var heroRatio = (hero.hp / hero.maxHp) * 100;
    var minoRatio = (minotaur.hp / minotaur.maxHp) * 100;
    if (hudHeroHp) hudHeroHp.style.width = heroRatio + "%";
    if (hudMinotaurHp) hudMinotaurHp.style.width = minoRatio + "%";
  }

  function distance(ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function tryHeroAttack() {
    if (hero.dead || minotaur.dead || hero.attackCooldown > 0 || hero.attackTimer > 0) {
      return;
    }
    hero.attackTimer = 0.28;
    hero.attackCooldown = 0.5;
  }

  function applyHeroHit() {
    if (minotaur.dead) return;
    var d = distance(hero.x, hero.y, minotaur.x, minotaur.y);
    if (d <= 92) {
      minotaur.hp = Math.max(0, minotaur.hp - 34);
      minotaur.hurtTimer = 0.14;
      if (minotaur.hp <= 0) {
        minotaur.dead = true;
        setStatus("승리! R로 재시작");
      }
    }
  }

  function applyMinotaurHit() {
    if (hero.dead) return;
    var d = distance(hero.x, hero.y, minotaur.x, minotaur.y);
    if (d <= 88) {
      hero.hp = Math.max(0, hero.hp - 24);
      hero.hurtTimer = 0.12;
      if (hero.hp <= 0) {
        hero.dead = true;
        setStatus("패배! R로 재시작");
      }
    }
  }

  function update(dt) {
    if (attackQueued) {
      tryHeroAttack();
      attackQueued = false;
    }

    hero.attackCooldown = Math.max(0, hero.attackCooldown - dt);
    minotaur.attackCooldown = Math.max(0, minotaur.attackCooldown - dt);
    hero.hurtTimer = Math.max(0, hero.hurtTimer - dt);
    minotaur.hurtTimer = Math.max(0, minotaur.hurtTimer - dt);

    if (!hero.dead) {
      var mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      var my = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
      var mLen = Math.sqrt(mx * mx + my * my);
      if (mLen > 0) {
        mx /= mLen;
        my /= mLen;
        var runMul = keys.ShiftLeft || keys.ShiftRight ? 1.55 : 1;
        hero.x += mx * hero.speed * runMul * dt;
        hero.y += my * hero.speed * runMul * dt;
        hero.facingX = mx;
        hero.facingY = my;
      }
      hero.x = clamp(hero.x, 30, width - 30);
      hero.y = clamp(hero.y, 30, height - 30);
    }

    if (hero.attackTimer > 0) {
      var prev = hero.attackTimer;
      hero.attackTimer = Math.max(0, hero.attackTimer - dt);
      if (prev > 0.14 && hero.attackTimer <= 0.14) {
        applyHeroHit();
      }
    }

    if (!minotaur.dead && !hero.dead) {
      var dx = hero.x - minotaur.x;
      var dy = hero.y - minotaur.y;
      var d = Math.sqrt(dx * dx + dy * dy);

      if (minotaur.attackTimer > 0) {
        var prevM = minotaur.attackTimer;
        minotaur.attackTimer = Math.max(0, minotaur.attackTimer - dt);
        if (prevM > 0.2 && minotaur.attackTimer <= 0.2) {
          applyMinotaurHit();
        }
      } else if (d > 86) {
        if (d > 0) {
          minotaur.x += (dx / d) * minotaur.speed * dt;
          minotaur.y += (dy / d) * minotaur.speed * dt;
        }
      } else if (minotaur.attackCooldown <= 0) {
        minotaur.attackTimer = 0.55;
        minotaur.attackCooldown = 1.4;
      }
    }

    if (!hero.dead && !minotaur.dead) {
      if (hero.attackTimer > 0) {
        setStatus("2D 대체 모드: 영웅 공격 중");
      } else if (minotaur.attackTimer > 0) {
        setStatus("2D 대체 모드: 미노타우르스 공격 대비");
      } else {
        setStatus("2D 대체 모드 실행 중 (Three.js 로드 실패)");
      }
    }

    updateHud();
  }

  function drawArena() {
    var g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#1a2432");
    g.addColorStop(1, "#0d1219");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(152, 189, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHero() {
    ctx.save();
    ctx.translate(hero.x, hero.y);
    ctx.fillStyle = hero.hurtTimer > 0 ? "#9cc5ff" : "#58a0ff";
    ctx.beginPath();
    ctx.arc(0, 0, hero.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d8ecff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(hero.facingX * 26, hero.facingY * 26);
    ctx.stroke();

    if (hero.attackTimer > 0) {
      ctx.fillStyle = "rgba(180, 220, 255, 0.26)";
      ctx.beginPath();
      ctx.arc(hero.facingX * 40, hero.facingY * 40, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawMinotaur() {
    ctx.save();
    ctx.translate(minotaur.x, minotaur.y);
    ctx.fillStyle = minotaur.hurtTimer > 0 ? "#ff9d8b" : "#e66a58";
    ctx.beginPath();
    ctx.arc(0, 0, minotaur.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffe9a8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.lineTo(-24, -30);
    ctx.moveTo(14, -20);
    ctx.lineTo(24, -30);
    ctx.stroke();

    if (minotaur.attackTimer > 0) {
      ctx.fillStyle = "rgba(255, 170, 150, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 0, minotaur.r + 24, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw() {
    drawArena();
    drawMinotaur();
    drawHero();
  }

  var last = performance.now();

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.033);
    last = now;

    update(dt);
    draw();

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", function () {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });

  window.__GAME_MODE__ = "fallback-2d";
  setStatus("2D 대체 모드 전투 시작");
  updateHud();
  requestAnimationFrame(tick);
})();
