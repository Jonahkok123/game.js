// ===== INTO DARKNESS - With Asset Error Handling =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

let frame = 0;
let gameState = "selecting";
let playerClass = "wizard";
let assetsLoaded = false;
let assetErrors = [];

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ===== LOAD ASSETS WITH ERROR HANDLING =====
let loaded = 0;
let totalAssets = 3;

function loadImage(src, name) {
  const img = new Image();
  img.src = src;
  
  img.onload = () => {
    loaded++;
    checkLoading();
  };
  
  img.onerror = () => {
    console.warn(`Failed to load asset: ${name} (${src})`);
    assetErrors.push(name);
    loaded++; // Still count it so game doesn't get stuck
    checkLoading();
  };
  
  return img;
}

function checkLoading() {
  if (loaded >= totalAssets) {
    assetsLoaded = true;
    if (assetErrors.length > 0) {
      console.log("Some assets failed to load:", assetErrors);
    }
  }
}

const wizardSheet = loadImage("assets/wizard_sheet.png", "wizard_sheet");
const skeletonSheet = loadImage("assets/skeleton_sheet.png", "skeleton_sheet");
const tiles = loadImage("assets/tiles.png", "tiles");

// ===== GAME STATE =====
let currentSpell = "fire";
let level = 1;
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
  anim: "idle",
  animFrame: 0,
  animTimer: 0
};

let keys = {};
let bullets = [];
let enemies = [];
let doors = [];
let items = [];
let mouse = { x: 0, y: 0 };

// ===== CLASS SELECTION =====
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

// ===== INPUT =====
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
  if (gameState === "playing") attack();
});

// ===== ATTACK =====
function attack() {
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const d = Math.hypot(dx, dy) || 1;

  player.anim = "attack";
  player.animFrame = 0;
  player.animTimer = 0;

  if (playerClass === "wizard") {
    if (currentSpell === "fire" && player.mana >= 5) {
      player.mana -= 5;
      bullets.push({ x: player.x, y: player.y, dx: dx/d*8, dy: dy/d*8, dmg: 1 });
    }
    if (currentSpell === "lightning" && player.mana >= 18) {
      player.mana -= 18;
      enemies.forEach(e => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 500) e.hp -= 4;
      });
    }
    if (currentSpell === "stun" && player.mana >= 12) {
      player.mana -= 12;
      enemies.forEach(e => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 100) e.stun = 45;
      });
    }
  } else if (playerClass === "warrior") {
    enemies.forEach(e => {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 75) {
        e.hp -= 6;
        e.hitFlash = 6;
      }
    });
  } else if (playerClass === "archer") {
    bullets.push({ x: player.x, y: player.y, dx: dx/d*10, dy: dy/d*10, dmg: 1.6 });
  }
}

// ===== SPAWN =====
function spawn() {
  enemies = [];
  doors = [];
  items = [];

  const count = level % 5 === 0 ? 1 : 4 + level;

  for (let i = 0; i < count; i++) {
    enemies.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      hp: level % 5 === 0 ? 50 + level * 8 : 2 + level,
      maxHp: level % 5 === 0 ? 50 + level * 8 : 2 + level,
      speed: level % 5 === 0 ? 1.2 : 1,
      isBoss: level % 5 === 0,
      size: level % 5 === 0 ? 60 : 36,
      stun: 0,
      hitFlash: 0,
      animFrame: 0
    });
  }
}
spawn();

// ===== UPDATE =====
function update() {
  if (gameState !== "playing") return;
  frame++;

  let mx = 0, my = 0;
  if (keys["w"] || keys["W"]) my--;
  if (keys["s"] || keys["S"]) my++;
  if (keys["a"] || keys["A"]) mx--;
  if (keys["d"] || keys["D"]) mx++;

  const mag = Math.hypot(mx, my) || 1;
  const spd = player.dash > 0 ? 7.5 : player.speed;

  player.x += (mx / mag) * spd;
  player.y += (my / mag) * spd;

  if (player.dash > 0) player.dash--;
  if (player.dashCooldown > 0) player.dashCooldown--;

  player.x = Math.max(40, Math.min(canvas.width - 40, player.x));
  player.y = Math.max(40, Math.min(canvas.height - 40, player.y));

  const isMoving = mx !== 0 || my !== 0;

  if (player.anim === "attack") {
    player.animTimer++;
    if (player.animTimer > 4) {
      player.animFrame++;
      player.animTimer = 0;
    }
    if (player.animFrame > 5) {
      player.anim = isMoving ? "walk" : "idle";
      player.animFrame = 0;
    }
  } else {
    player.anim = isMoving ? "walk" : "idle";
    player.animTimer++;
    if (player.animTimer > 6) {
      player.animFrame = (player.animFrame + 1) % 6;
      player.animTimer = 0;
    }
  }

  if (playerClass !== "warrior") {
    player.mana = Math.min(100, player.mana + 0.1);
  }

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  enemies.forEach(e => {
    if (e.stun > 0) { e.stun--; return; }
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * e.speed;
    e.y += (dy / d) * e.speed;

    if (Math.hypot(player.x - e.x, player.y - e.y) < 25) {
      player.hp -= 0.25;
    }
    e.animFrame = (e.animFrame + 1) % 8;
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
        e.hp -= b.dmg || 1;
        b.dead = true;
        e.hitFlash = 5;
        if (e.hp <= 0) score += e.isBoss ? 40 : 8;
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  if (enemies.length === 0 && doors.length === 0) {
    doors.push({ x: canvas.width / 2, y: 45 });
    doors.push({ x: canvas.width / 2, y: canvas.height - 45 });
  }

  doors.forEach(door => {
    if (Math.hypot(player.x - door.x, player.y - door.y) < 45) {
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

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Show loading or errors
  if (!assetsLoaded) {
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("Loading...", 200, 200);

    if (assetErrors.length > 0) {
      ctx.fillStyle = "#ff6666";
      ctx.font = "16px sans-serif";
      ctx.fillText("Missing assets: " + assetErrors.join(", "), 200, 240);
      ctx.fillText("Please upload wizard_sheet.png and skeleton_sheet.png to assets/", 200, 265);
    }
    return;
  }

  // Floor
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw tiles if loaded
  if (tiles.complete) {
    ctx.drawImage(tiles, 0, 0, canvas.width, canvas.height);
  }

  // ===== PLAYER =====
  const isMoving = keys["w"] || keys["s"] || keys["a"] || keys["d"];
  let row = 0;
  if (player.anim === "idle") row = 0;
  if (player.anim === "walk") row = 1;
  if (player.anim === "attack") row = 3;

  const frameW = 48;
  const frameH = 64;

  if (wizardSheet.complete && wizardSheet.width > 0) {
    const sx = player.animFrame * frameW;
    const sy = row * frameH;
    ctx.drawImage(wizardSheet, sx, sy, frameW, frameH, player.x - 24, player.y - 48, 48, 64);
  } else {
    // Fallback if wizard sheet missing
    ctx.fillStyle = playerClass === "warrior" ? "#cc5533" : playerClass === "archer" ? "#44aa55" : "#4455cc";
    ctx.fillRect(player.x - 20, player.y - 40, 40, 60);
  }

  // Enemies
  enemies.forEach(e => {
    const size = e.isBoss ? 56 : 36;
    if (skeletonSheet.complete && skeletonSheet.width > 0) {
      const ex = Math.floor(e.animFrame % 6) * 32;
      ctx.drawImage(skeletonSheet, ex, 0, 32, 48, e.x - size/2, e.y - size/2, size, size);
    } else {
      ctx.fillStyle = "#aaffaa";
      ctx.fillRect(e.x - size/2, e.y - size/2, size, size);
    }
  });

  // Bullets
  ctx.fillStyle = "#ffaa33";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Doors
  ctx.fillStyle = "#8B4513";
  doors.forEach(d => {
    ctx.fillRect(d.x - 28, d.y - 28, 56, 56);
  });

  // UI
  ctx.fillStyle = "#ff3333";
  ctx.fillRect(20, 20, (player.hp / player.maxHp) * 200, 12);
  ctx.fillStyle = "#3399ff";
  ctx.fillRect(20, 38, player.mana * 2, 12);

  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.fillText("Level: " + level, 20, 65);
  ctx.fillText("Class: " + playerClass.toUpperCase(), 20, 85);
  ctx.fillText("Score: " + score, 20, 105);

  // Show missing assets warning
  if (assetErrors.length > 0) {
    ctx.fillStyle = "rgba(255,100,100,0.8)";
    ctx.fillRect(20, canvas.height - 50, 400, 35);
    ctx.fillStyle = "white";
    ctx.font = "14px sans-serif";
    ctx.fillText("Missing: " + assetErrors.join(", ") + " (check assets folder)", 30, canvas.height - 30);
  }
}

// Game Loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();