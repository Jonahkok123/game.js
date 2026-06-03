// ===== CLEANER VERSION - Into Darkness =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

let frame = 0;
let gameState = "selecting";
let playerClass = "wizard";

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Load assets
let loaded = 0;
function load(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => loaded++;
  return img;
}
const wizardImg = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// Game state
let currentSpell = "fire";
let level = 1;
let currentMap = 1;
let score = 0;

let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  hp: 100,
  maxHp: 100,
  mana: 100,
  speed: 3,
  dash: 0,
  dashCooldown: 0,
  attackAnim: 0
};

let keys = {};
let bullets = [];
let enemies = [];
let doors = [];
let items = [];
let particles = [];
let mouse = { x: 0, y: 0 };

// Class selection
function selectClass(cls) {
  playerClass = cls;
  gameState = "playing";

  if (cls === "wizard") {
    player.hp = 90; player.maxHp = 90; player.mana = 100; player.speed = 3.2;
  } else if (cls === "warrior") {
    player.hp = 150; player.maxHp = 150; player.mana = 0; player.speed = 2.7;
  } else if (cls === "archer") {
    player.hp = 105; player.maxHp = 105; player.mana = 70; player.speed = 3.9;
  }

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  score = 0;
  level = 1;
  spawn();
}

// Input
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (gameState === "playing") {
    if (e.key === "1") currentSpell = "fire";
    if (e.key === "2") currentSpell = "lightning";
    if (e.key === "3") currentSpell = "stun";
    if (e.key === "Shift" && player.dashCooldown <= 0) {
      player.dash = 12;
      player.dashCooldown = 40;
    }
  }
});
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", () => {
  if (gameState === "selecting") {
    // Class selection logic would go here if needed
  } else {
    attack();
  }
});

// Attack function
function attack() {
  if (gameState !== "playing") return;

  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const d = Math.hypot(dx, dy) || 1;

  player.attackAnim = 15;

  if (playerClass === "wizard") {
    if (currentSpell === "fire" && player.mana >= 5) {
      player.mana -= 5;
      bullets.push({ x: player.x, y: player.y, dx: dx/d * 8, dy: dy/d * 8, dmg: 1 });
    }
    if (currentSpell === "lightning" && player.mana >= 18) {
      player.mana -= 18;
      enemies.forEach(e => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 600) {
          e.hp -= 4;
        }
      });
    }
    if (currentSpell === "stun" && player.mana >= 12) {
      player.mana -= 12;
      enemies.forEach(e => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 110) e.stun = 50;
      });
    }
  } else if (playerClass === "warrior") {
    enemies.forEach(e => {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 80) {
        e.hp -= 6;
        e.hitFlash = 8;
      }
    });
  } else if (playerClass === "archer") {
    bullets.push({ x: player.x, y: player.y, dx: dx/d * 11, dy: dy/d * 11, dmg: 1.5 });
  }
}

// Spawn enemies
function spawn() {
  enemies = [];
  doors = [];
  items = [];

  if (level % 5 === 0) {
    enemies.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      hp: 50 + level * 10,
      maxHp: 50 + level * 10,
      speed: 1.3,
      isBoss: true,
      size: 70,
      stun: 0
    });
  } else {
    for (let i = 0; i < 4 + level; i++) {
      enemies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        hp: 2 + level,
        speed: 1,
        stun: 0
      });
    }
  }
}
spawn();

// Update game
function update() {
  if (gameState !== "playing") return;
  frame++;

  // Movement
  let mx = 0, my = 0;
  if (keys["w"] || keys["W"]) my--;
  if (keys["s"] || keys["S"]) my++;
  if (keys["a"] || keys["A"]) mx--;
  if (keys["d"] || keys["D"]) mx++;

  const mag = Math.hypot(mx, my) || 1;
  const currentSpeed = player.dash > 0 ? 8 : player.speed;
  player.x += (mx / mag) * currentSpeed;
  player.y += (my / mag) * currentSpeed;

  if (player.dash > 0) player.dash--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.attackAnim > 0) player.attackAnim--;

  player.x = Math.max(40, Math.min(canvas.width - 40, player.x));
  player.y = Math.max(40, Math.min(canvas.height - 40, player.y));

  if (playerClass !== "warrior") {
    player.mana = Math.min(100, player.mana + 0.12);
  }

  // Bullets
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  // Enemies
  enemies.forEach(e => {
    if (e.stun > 0) { e.stun--; return; }
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed;
    e.y += (dy / d) * e.speed;

    if (Math.hypot(player.x - e.x, player.y - e.y) < 28) {
      player.hp -= 0.3;
    }
  });

  // Collisions
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 22) {
        e.hp -= b.dmg || 1;
        b.dead = true;
        if (e.hp <= 0) score += e.isBoss ? 50 : 10;
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  // Doors
  if (enemies.length === 0 && doors.length === 0) {
    doors.push({ x: canvas.width / 2, y: 50 });
    doors.push({ x: canvas.width / 2, y: canvas.height - 50 });
  }

  doors.forEach(door => {
    if (Math.hypot(player.x - door.x, player.y - door.y) < 50) {
      level++;
      doors = [];
      spawn();
    }
  });

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    level = 1;
    score = 0;
    spawn();
  }
}

// Draw game
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (loaded < 3) {
    ctx.fillStyle = "white";
    ctx.fillText("Loading...", 200, 200);
    return;
  }

  // Simple floor
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw tiles simply
  for (let x = 0; x < canvas.width; x += 32) {
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.drawImage(tiles, x, y, 32, 32);
    }
  }

  // Player
  ctx.drawImage(wizardImg, player.x - 24, player.y - 48, 48, 48);

  // Enemies
  enemies.forEach(e => {
    const size = e.isBoss ? 65 : 38;
    ctx.drawImage(skeleton, e.x - size/2, e.y - size/2, size, size);
  });

  // Bullets
  ctx.fillStyle = "#ffaa33";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Doors
  ctx.fillStyle = "#8B4513";
  doors.forEach(door => {
    ctx.fillRect(door.x - 30, door.y - 30, 60, 60);
  });

  // UI
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, (player.hp / player.maxHp) * 200, 12);
  ctx.fillStyle = "blue";
  ctx.fillRect(20, 38, player.mana * 2, 12);

  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.fillText("Level: " + level, 20, 70);
  ctx.fillText("Class: " + playerClass, 20, 92);
  ctx.fillText("Score: " + score, 20, 114);
}

// Game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();