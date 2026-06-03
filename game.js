// ===== UPGRADED GAME - Bosses + Portals + Animations =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

let frame = 0;
let floorPattern = null;

// Resize handling
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.x = Math.max(50, Math.min(canvas.width - 50, player.x));
  player.y = Math.max(50, Math.min(canvas.height - 50, player.y));
});

// ===== LOAD =====
let loaded = 0;
function load(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => loaded++;
  img.onerror = () => loaded++;
  return img;
}
const wizard = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== STATE =====
let currentSpell = "fire";
let level = 1;
let currentMap = 1;
let score = 0;

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
let portals = [];
let particles = [];
let mouse = { x: 0, y: 0 };

// ===== INPUT =====
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "1") currentSpell = "fire";
  if (e.key === "2") currentSpell = "lightning";
  if (e.key === "3") currentSpell = "stun";

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

  if (currentSpell === "fire" && player.mana >= 5) {
    player.mana -= 5;
    bullets.push({ x: player.x, y: player.y, dx: dx/d*8, dy: dy/d*8, dmg: 1, dead: false });
  }

  if (currentSpell === "lightning" && player.mana >= 20) {
    player.mana -= 20;
    const nx = dx / d, ny = dy / d;
    effects.push({ type: "beam", x: player.x, y: player.y, dx: nx, dy: ny, length: 800, life: 10 });

    enemies.forEach(e => {
      const px = e.x - player.x, py = e.y - player.y;
      const proj = px * nx + py * ny;
      if (proj > 0 && proj < 800) {
        if (Math.abs(px * ny - py * nx) < 25) e.hp -= 4;
      }
    });
  }

  if (currentSpell === "stun" && player.mana >= 15) {
    player.mana -= 15;
    enemies.forEach(e => {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 130) e.stun = 70;
    });
  }
}

// ===== SPAWN =====
function spawn() {
  enemies = [];
  portals = [];

  if (level % 5 === 0) {
    // === BOSS ===
    enemies.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 500,
      y: canvas.height / 2 + (Math.random() - 0.5) * 400,
      hp: 50 + level * 10,
      maxHp: 50 + level * 10,
      speed: 1.4,
      isBoss: true,
      size: 75,
      stun: 0,
      attackCooldown: 0
    });
  } else {
    // Normal enemies
    for (let i = 0; i < 3 + level; i++) {
      let ex, ey, dist, tries = 0;
      do {
        ex = Math.random() * canvas.width;
        ey = Math.random() * canvas.height;
        dist = Math.hypot(ex - player.x, ey - player.y);
        tries++;
      } while (dist < 90 && tries < 20);

      enemies.push({
        x: ex, y: ey,
        hp: 2 + level,
        speed: 1,
        stun: 0
      });
    }
  }
}
spawn();

// ===== UPDATE =====
function update() {
  frame++;

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

  if (player.dash > 0) player.dash--;
  if (player.dashCooldown > 0) player.dashCooldown--;

  player.x = Math.max(50, Math.min(canvas.width - 50, player.x));
  player.y = Math.max(50, Math.min(canvas.height - 50, player.y));

  player.mana = Math.min(100, player.mana + 0.12);

  // Dash particles
  if (player.dash > 0 && frame % 2 === 0) {
    particles.push({
      x: player.x, y: player.y,
      dx: (Math.random() - 0.5) * 3,
      dy: (Math.random() - 0.5) * 3,
      life: 10,
      color: "#88ffff"
    });
  }

  // Move bullets + offscreen cleanup
  bullets.forEach(b => {
    b.x += b.dx; b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) b.dead = true;
  });

  // Enemies + Boss AI
  enemies.forEach(e => {
    if (e.stun > 0) { e.stun--; return; }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    let moveSpeed = e.speed || 1;
    if (e.isBoss) moveSpeed = 1.5;

    e.x += (dx / d) * moveSpeed;
    e.y += (dy / d) * moveSpeed;

    // Normal enemy damage
    if (!e.isBoss && Math.hypot(player.x - e.x, player.y - e.y) < 28) {
      player.hp -= 0.25;
    }

    // Boss special attack
    if (e.isBoss) {
      e.attackCooldown = (e.attackCooldown || 0) - 1;
      if (e.attackCooldown <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < 120) {
        player.hp -= 6;
        e.attackCooldown = 80;
        // Boss hit particles
        for (let i = 0; i < 6; i++) {
          particles.push({
            x: player.x, y: player.y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            life: 12,
            color: "#ff6666"
          });
        }
      }
    }
  });

  // Bullet collisions
  bullets.forEach(b => {
    if (b.dead) return;
    enemies.forEach(e => {
      const hitDist = e.isBoss ? 35 : 22;
      if (Math.hypot(b.x - e.x, b.y - e.y) < hitDist) {
        e.hp -= b.dmg;
        b.dead = true;
        score += e.isBoss ? 50 : 10;

        // Hit flash effect
        e.hitFlash = 6;
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  // Update particles
  particles = particles.filter(p => {
    p.x += p.dx; p.y += p.dy;
    p.life--;
    return p.life > 0;
  });

  // === PORTAL SPAWN ===
  if (enemies.length === 0 && portals.length === 0 && level % 5 !== 0) {
    portals.push({ x: canvas.width / 2, y: canvas.height / 2 });
  }

  // Portal collision
  portals.forEach(p => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 50) {
      level++;
      currentMap = Math.floor((level - 1) / 5) + 1;
      portals = [];
      spawn();
    }
  });

  // Death
  if (player.hp <= 0) {
    player.hp = player.maxHp;
    level = 1;
    currentMap = 1;
    score = 0;
    spawn();
  }
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (loaded < 3) {
    ctx.fillStyle = "white";
    ctx.font = "28px sans-serif";
    ctx.fillText("Loading...", 200, 200);
    return;
  }

  // Floor
  if (!floorPattern) floorPattern = ctx.createPattern(tiles, "repeat");
  ctx.fillStyle = floorPattern || "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Particles (dash trail + hits)
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 12;
    ctx.fillStyle = p.color || "white";
    ctx.fillRect(p.x - 2, p.y - 2, 5, 5);
  });
  ctx.globalAlpha = 1;

  // Player with bob animation
  const isMoving = keys["w"] || keys["s"] || keys["a"] || keys["d"];
  const bob = isMoving ? Math.sin(frame * 0.25) * 5 : 0;
  ctx.drawImage(wizard, player.x - 24, player.y - 48 + bob, 48, 48);

  // Enemies + Boss
  enemies.forEach(e => {
    const flash = e.hitFlash > 0 ? e.hitFlash-- : 0;

    if (e.isBoss) {
      // Boss
      ctx.save();
      if (flash) ctx.filter = "brightness(2)";
      ctx.drawImage(skeleton, e.x - e.size/2, e.y - e.size/2, e.size, e.size);
      ctx.restore();

      // Boss health bar
      ctx.fillStyle = "red";
      ctx.fillRect(e.x - 45, e.y - e.size/2 - 20, 90, 8);
      ctx.fillStyle = "lime";
      ctx.fillRect(e.x - 45, e.y - e.size/2 - 20, 90 * (e.hp / e.maxHp), 8);
    } else {
      // Normal skeleton
      if (flash) ctx.filter = "brightness(2.5)";
      ctx.drawImage(skeleton, e.x - 20, e.y - 20, 40, 40);
      ctx.filter = "none";
    }
  });

  // Bullets
  ctx.fillStyle = currentSpell === "fire" ? "#ffaa00" : "#ff4444";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Lightning beams
  effects.forEach(f => {
    if (f.type === "beam") {
      ctx.strokeStyle = "#aaffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + f.dx * f.length, f.y + f.dy * f.length);
      ctx.stroke();
      f.life--;
    }
  });
  effects = effects.filter(f => f.life > 0);

  // === PORTALS (animated) ===
  portals.forEach(p => {
    const radius = 38 + Math.sin(frame * 0.12) * 10;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, (player.hp / player.maxHp) * 220, 14);

  ctx.fillStyle = "blue";
  ctx.fillRect(20, 42, player.mana * 2.2, 14);

  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText("Level: " + level, 20, 80);
  ctx.fillText("Map: " + currentMap, 20, 105);
  ctx.fillText("Score: " + score, 20, 130);
  ctx.fillText("Spell: " + currentSpell.toUpperCase(), 20, 155);
}

// ===== LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
