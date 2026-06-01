const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== CREATE BUILT-IN SPRITE (NO FILES) =====
const spriteCanvas = document.createElement("canvas");
spriteCanvas.width = 192;
spriteCanvas.height = 144;
const sctx = spriteCanvas.getContext("2d");

// ----- DRAW WALK ROW -----
for (let i = 0; i < 6; i++) {
  let x = i * 32;

  // skull
  sctx.fillStyle = "#ddd";
  sctx.fillRect(x + 10, 8, 12, 8);

  // eyes
  sctx.fillStyle = "black";
  sctx.fillRect(x + 12, 10, 3, 3);
  sctx.fillRect(x + 17, 10, 3, 3);

  // body
  sctx.fillStyle = "#bbb";
  sctx.fillRect(x + 12, 16, 8, 12);

  // legs (simple animation)
  sctx.fillRect(x + 10 + (i % 2), 28, 4, 8);
  sctx.fillRect(x + 18 - (i % 2), 28, 4, 8);
}

// ----- DRAW ATTACK ROW -----
for (let i = 0; i < 6; i++) {
  let x = i * 32;

  sctx.fillStyle = "#ddd";
  sctx.fillRect(x + 10, 8, 12, 8);

  sctx.fillStyle = "#bbb";
  sctx.fillRect(x + 12, 16, 8, 12);

  // attack arm up
  sctx.fillRect(x + 5, 12 - i, 8, 4);
}

// ----- DRAW DEATH ROW -----
for (let i = 0; i < 6; i++) {
  let x = i * 32;

  sctx.fillStyle = "#888";
  sctx.fillRect(x + 8 + i * 2, 28 - i * 2, 16, 8);
}

// ===== SETTINGS =====
const FRAME_W = 32;
const FRAME_H = 32;
const ROW_ATTACK = 1;
const ROW_WALK = 0;
const ROW_DEAD = 2;

// ===== GAME =====
let state = "menu";

let player = { x: 300, y: 250, speed: 3, hp: 100 };
let bossLevel = 1;

let keys = {}, bullets = [], enemies = [];
let boss = null, mouse = { x: 0, y: 0 }, gameOver = false;

// INPUT
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
  let r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", () => {
  if (state === "menu") { start(); return; }
  if (gameOver) { state = "menu"; return; }
  shoot();
});

// START
function start() {
  state = "game";
  player.hp = 100;
  enemies = [];
  bullets = [];
  boss = null;
  bossLevel = 1;
  spawnEnemies();
}

// SHOOT
function shoot() {
  let dx = mouse.x - player.x;
  let dy = mouse.y - player.y;
  let d = Math.hypot(dx, dy) || 1;

  bullets.push({
    x: player.x + 20,
    y: player.y + 20,
    dx: dx / d * 7,
    dy: dy / d * 7
  });
}

// SPAWN
function spawnEnemies() {
  for (let i = 0; i < 5; i++) {
    enemies.push({
      x: Math.random() * 800,
      y: Math.random() * 500,
      speed: 1,
      frame: 0,
      state: "walk",
      dead: false
    });
  }
}

function spawnBoss() {
  boss = {
    x: 450,
    y: 120,
    hp: 5 + (bossLevel - 1) * 4,
    frame: 0,
    timer: 0
  };
}

// UPDATE
function update() {
  if (state !== "game" || gameOver) return;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - 32, player.x));
  player.y = Math.max(0, Math.min(canvas.height - 32, player.y));

  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });

  enemies.forEach(e => {
    if (e.dead) {
      e.frame++;
      return;
    }

    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d = Math.hypot(dx, dy) || 1;

    e.frame++;

    if (d < 40) {
      e.state = "attack";
      player.hp -= 0.3;
    } else {
      e.state = "walk";
      e.x += dx / d * e.speed;
      e.y += dy / d * e.speed;
    }
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < 20) {
        e.dead = true;
        e.state = "dead";
        e.frame = 0;
        b.dead = true;
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => !(e.state === "dead" && e.frame > 40));

  if (enemies.length === 0 && !boss) spawnBoss();
}

// DRAW SKELETON
function drawSkeleton(e) {
  let frame, row;

  if (e.state === "walk") {
    frame = Math.floor(e.frame / 8) % 6;
    row = ROW_WALK;
  } else if (e.state === "attack") {
    frame = Math.floor(e.frame / 6) % 6;
    row = ROW_ATTACK;
  } else {
    frame = Math.min(Math.floor(e.frame / 6), 5);
    row = ROW_DEAD;
  }

  ctx.drawImage(
    spriteCanvas,
    frame * FRAME_W,
    row * FRAME_H,
    FRAME_W,
    FRAME_H,
    e.x - 32,
    e.y - 32,
    64,
    64
  );
}

// DRAW
function draw() {
  ctx.fillStyle = "#0e0e18";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === "menu") {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Dungeon Game", 250, 200);
    ctx.fillText("Click to Start", 280, 260);
    return;
  }

  ctx.fillStyle = "purple";
  ctx.fillRect(player.x, player.y, 30, 30);

  bullets.forEach(b => {
    ctx.fillStyle = "orange";
    ctx.fillRect(b.x, b.y, 6, 4);
  });

  enemies.forEach(drawSkeleton);

  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, player.hp * 2, 10);
}

// LOOP
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
