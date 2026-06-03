document.addEventListener("click", () => {
  if (AudioCtx.state === "suspended") {
    AudioCtx.resume();
  }
}, { once: true });

/* ==========================================================
   FULL ROGUELIKE CANVAS GAME — ROOMS, BOSS, AUDIO, MOBILE
   ========================================================== */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

/* ===================== SETUP ===================== */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

const TAU = Math.PI * 2;

/* ===================== AUDIO ===================== */
const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq = 440, dur = 0.08, vol = 0.15) {
  const o = AudioCtx.createOscillator();
  const g = AudioCtx.createGain();
  o.frequency.value = freq;
  o.type = "square";
  g.gain.value = vol;
  o.connect(g).connect(AudioCtx.destination);
  o.start();
  o.stop(AudioCtx.currentTime + dur);
}

/* ===================== INPUT ===================== */
let keys = {};
let mouse = { x: 0, y: 0, down: false };

addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener("mousedown", () => mouse.down = true);
canvas.addEventListener("mouseup", () => mouse.down = false);

/* ===== Mobile joystick ===== */
let touchMove = { x: 0, y: 0 };
addEventListener("touchmove", e => {
  let t = e.touches[0];
  touchMove.x = (t.clientX - innerWidth / 2) / 80;
  touchMove.y = (t.clientY - innerHeight / 2) / 80;
});

/* ===================== PLAYER ===================== */
const player = {
  x: 0, y: 0, r: 14,
  hp: 100, maxHp: 100,
  mana: 100,
  speed: 3.2,
  dmg: 1,
  regen: 0.15,
  hitCD: 0
};

/* ===================== WORLD ===================== */
let roomX = 0, roomY = 0;
let enemies = [], bullets = [], particles = [];
let level = 1;
let shake = 0;

/* ===================== SPRITES ===================== */
function drawWizard(x, y) {
  ctx.fillStyle = "#cfa";
  ctx.fillRect(x - 6, y - 14, 12, 14);
  ctx.fillStyle = "#345";
  ctx.fillRect(x - 10, y - 20, 20, 6);
}

function drawSkeleton(x, y, boss = false) {
  ctx.strokeStyle = boss ? "#f55" : "#ddd";
  ctx.lineWidth = boss ? 4 : 2;
  ctx.beginPath();
  ctx.arc(x, y, boss ? 18 : 12, 0, TAU);
  ctx.stroke();
}

/* ===================== SPAWN ===================== */
function spawnRoom() {
  enemies.length = 0;
  bullets.length = 0;
  particles.length = 0;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if ((roomX + roomY) % 5 === 0) {
    enemies.push({
      x: canvas.width / 2,
      y: 120,
      hp: 80 + level * 10,
      speed: 1,
      boss: true
    });
  } else {
    for (let i = 0; i < 4 + level; i++) {
      enemies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        hp: 6 + level,
        speed: 1.2
      });
    }
  }
}
spawnRoom();

/* ===================== UPDATE ===================== */
function update(dt) {
  let mx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + touchMove.x;
  let my = (keys.s ? 1 : 0) - (keys.w ? 1 : 0) + touchMove.y;
  let m = Math.hypot(mx, my) || 1;

  player.x += mx / m * player.speed * dt;
  player.y += my / m * player.speed * dt;

  player.mana = Math.min(100, player.mana + player.regen * dt);
  if (player.hitCD > 0) player.hitCD -= dt;

  if (mouse.down && player.mana > 4) {
    let dx = mouse.x - player.x;
    let dy = mouse.y - player.y;
    let d = Math.hypot(dx, dy) || 1;
    bullets.push({
      x: player.x,
      y: player.y,
      dx: dx / d * 9,
      dy: dy / d * 9,
      dmg: player.dmg
    });
    player.mana -= 4;
    beep(600);
    mouse.down = false;
  }

  bullets.forEach(b => {
    b.x += b.dx * dt;
    b.y += b.dy * dt;
  });

  bullets = bullets.filter(b =>
    b.x > 0 && b.y > 0 && b.x < canvas.width && b.y < canvas.height
  );

  enemies.forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = Math.hypot(dx, dy) || 1;
    e.x += dx / d * e.speed * dt;
    e.y += dy / d * e.speed * dt;

    if (d < player.r + 16 && player.hitCD <= 0) {
      player.hp -= e.boss ? 18 : 8;
      player.hitCD = 40;
      shake = 12;
      beep(120);
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (Math.hypot(bullets[i].x - enemies[j].x, bullets[i].y - enemies[j].y) < 16) {
        enemies[j].hp -= bullets[i].dmg;
        bullets.splice(i, 1);
        beep(300, 0.05);
        break;
      }
    }
  }

  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      for (let i = 0; i < 20; i++)
        particles.push({
          x: e.x, y: e.y,
          dx: (Math.random() - 0.5) * 4,
          dy: (Math.random() - 0.5) * 4,
          life: 30
        });
      return false;
    }
    return true;
  });

  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  if (!enemies.length) {
    roomX++;
    level++;
    spawnRoom();
  }

  shake *= 0.85;
}

/* ===================== DRAW ===================== */
function draw() {
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    ctx.fillStyle = "orange";
    ctx.fillRect(p.x, p.y, 2, 2);
  });

  drawWizard(player.x, player.y);

  enemies.forEach(e => drawSkeleton(e.x, e.y, e.boss));

  bullets.forEach(b => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, TAU);
    ctx.fill();
  });

  ctx.restore();

  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, (player.hp / player.maxHp) * 200, 10);
  ctx.fillStyle = "blue";
  ctx.fillRect(20, 36, player.mana * 2, 8);
  ctx.fillStyle = "white";
  ctx.fillText(`Room ${roomX}  Level ${level}`, 20, 60);
}

/* ===================== LOOP ===================== */
let last = 0;
function loop(t) {
  let dt = Math.min((t - last) / 16.6, 2);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
