// ===== CANVAS =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false; // crisp pixel art

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // keep player on screen
  player.x = Math.max(50, Math.min(canvas.width - 50, player.x));
  player.y = Math.max(50, Math.min(canvas.height - 50, player.y));
});

// ===== LOAD ASSETS =====
let loaded = 0;
let floorPattern = null;

function load(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => loaded++;
  img.onerror = () => {
    console.error("Failed to load:", src);
    loaded++; // don't get stuck forever
  };
  return img;
}

const wizard = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== GAME STATE =====
let gameState = "playing";
let currentSpell = "fire";
let level = 1;

// ===== PLAYER =====
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  hp: 100,
  maxHp: 100,
  mana: 100,
  speed: 3,
  dash: 0,
  dashCooldown: 0
};

// ===== DATA =====
let keys = {};
let bullets = [];
let enemies = [];
let effects = [];
let mouse = { x: 0, y: 0 };

// ===== INPUT =====
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === "1") currentSpell = "fire";
  if (e.key === "2") currentSpell = "lightning";
  if (e.key === "3") currentSpell = "stun";

  // DASH (Shift)
  if (e.key === "Shift" && player.dashCooldown <= 0) {
    player.dash = 12;
    player.dashCooldown = 40;
  }
});

document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", shoot);

// ===== SHOOT =====
function shoot() {
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const d = Math.hypot(dx, dy) || 1;

  // FIRE
  if (currentSpell === "fire" && player.mana >= 5) {
    player.mana -= 5;
    bullets.push({
      x: player.x,
      y: player.y,
      dx: (dx / d) * 8,
      dy: (dy / d) * 8,
      dmg: 1,
      dead: false
    });
  }

  // LIGHTNING (beam)
  if (currentSpell === "lightning" && player.mana >= 20) {
    player.mana -= 20;
    const nx = dx / d;
    const ny = dy / d;
    const length = 800;

    effects.push({
      type: "beam",
      x: player.x,
      y: player.y,
      dx: nx,
      dy: ny,
      length,
      life: 10
    });

    enemies.forEach(e => {
      const px = e.x - player.x;
      const py = e.y - player.y;
      const proj = px * nx + py * ny;
      if (proj > 0 && proj < length) {
        const dist = Math.abs(px * ny - py * nx);
        if (dist < 25) e.hp -= 3;
      }
    });
  }

  // STUN
  if (currentSpell === "stun" && player.mana >= 15) {
    player.mana -= 15;
    enemies.forEach(e => {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 120) {
        e.stun = 60;
      }
    });
  }
}

// ===== SPAWN ENEMIES =====
function spawn() {
  enemies = [];
  const count = 3 + level;

  for (let i = 0; i < count; i++) {
    let ex, ey, dist;
    let tries = 0;

    do {
      ex = Math.random() * canvas.width;
      ey = Math.random() * canvas.height;
      dist = Math.hypot(ex - player.x, ey - player.y);
      tries++;
    } while (dist < 80 && tries < 20); // avoid spawning on player

    enemies.push({
      x: ex,
      y: ey,
      hp: 2 + level,
      speed: 1,
      stun: 0
    });
  }
}

spawn();

// ===== UPDATE =====
function update() {
  // Movement
  let mx = 0, my = 0;
  if (keys["w"] || keys["W"]) my--;
  if (keys["s"] || keys["S"]) my++;
  if (keys["a"] || keys["A"]) mx--;
  if (keys["d"] || keys["D"]) mx++;

  const mag = Math.hypot(mx, my) || 1;
  const speed = player.dash > 0 ? 8 : player.speed;

  player.x += (mx / mag) * speed;
  player.y += (my / mag) * speed;

  // Dash timers
  if (player.dash > 0) player.dash--;
  if (player.dashCooldown > 0) player.dashCooldown--;

  // Clamp to screen
  player.x = Math.max(50, Math.min(canvas.width - 50, player.x));
  player.y = Math.max(50, Math.min(canvas.height - 50, player.y));

  // Mana regen
  player.mana = Math.min(100, player.mana + 0.1);

  // Move bullets + remove off-screen
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      b.dead = true;
    }
  });

  // Enemies
  enemies.forEach(e => {
    if (e.stun > 0) {
      e.stun--;
      return;
    }
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed;
    e.y += (dy / d) * e.speed;

    if (Math.hypot(player.x - e.x, player.y - e.y) < 25) {
      player.hp -= 0.2;
    }
  });

  // Bullet collisions
  bullets.forEach(b => {
    if (b.dead) return;
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
        e.hp -= b.dmg;
        b.dead = true;
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  // Level up
  if (enemies.length === 0) {
    level++;
    spawn();
  }

  // Player death → respawn wave
  if (player.hp <= 0) {
    player.hp = player.maxHp;
    spawn();
  }
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (loaded < 3) {
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("Loading...", 200, 200);
    return;
  }

  // === FLOOR (optimized with pattern) ===
  if (!floorPattern) {
    floorPattern = ctx.createPattern(tiles, "repeat");
  }
  ctx.fillStyle = floorPattern || "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.drawImage(wizard, player.x - 24, player.y - 48, 48, 48);

  // Enemies
  enemies.forEach(e => {
    ctx.drawImage(skeleton, e.x - 20, e.y - 20, 40, 40);
  });

  // Bullets
  ctx.fillStyle = "orange";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Effects (lightning beam)
  effects.forEach(f => {
    if (f.type === "beam") {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + f.dx * f.length, f.y + f.dy * f.length);
      ctx.stroke();
      f.life--;
    }
  });
  effects = effects.filter(f => f.life > 0);

  // UI
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, (player.hp / player.maxHp) * 200, 12);

  ctx.fillStyle = "blue";
  ctx.fillRect(20, 40, player.mana * 2, 12);

  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.fillText("Level: " + level, 20, 75);
  ctx.fillText("Spell: " + currentSpell.toUpperCase(), 20, 95);
  ctx.fillText("HP: " + Math.floor(player.hp) + " / " + player.maxHp, 20, 115);
}

// ===== GAME LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
