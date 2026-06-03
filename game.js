/* =====================================================
   INTO DARKNESS — STABILITY & LOGIC FIX (FINAL)
   ===================================================== */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ------------------ CANVAS SAFETY ------------------
function resize() {
  canvas.width = window.innerWidth || 800;
  canvas.height = window.innerHeight || 600;
}
window.addEventListener("resize", resize);
resize();

// ------------------ CONSTANTS ------------------
const PLAYER_RADIUS = 12;
const ENEMY_RADIUS = 12;
const BULLET_RADIUS = 3;
const PICKUP_RADIUS = 20;
const HIT_COOLDOWN = 20;

// ------------------ INPUT ------------------
let keys = {};
let mouse = { x: 0, y: 0, down: false, click: false };

addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener("mousedown", () => {
  mouse.down = true;
  mouse.click = true;
});
canvas.addEventListener("mouseup", () => mouse.down = false);

// ------------------ PLAYER ------------------
const player = {
  x: 0, y: 0,
  hp: 150, maxHp: 150,
  baseDmg: 6,
  speed: 3,
  gold: 0,
  cooldown: 0,
  hitCooldown: 0,
  equip: { weapon: null, chest: null }
};

// ------------------ WORLD ------------------
let world = { x: 0, y: 0 };
let enemies = [];
let bullets = [];
let enemyBullets = [];
let loot = [];
let boss = null;
let gameOver = false;

// ------------------ ITEMS ------------------
const WEAPONS = [
  { name: "Iron Sword", slot: "weapon", dmg: 3 },
  { name: "Phoenix Staff", slot: "weapon", dmg: 5, fire: true }
];
const ARMOUR = [
  { name: "Chainmail", slot: "chest", armour: 0.25 }
];

// ------------------ NPCs ------------------
const blacksmith = { x: 200, y: 200, open: false };
const enchanter = { x: 400, y: 200, open: false };

// ------------------ SPAWN ------------------
function spawnRoom() {
  enemies = [];
  bullets = [];
  enemyBullets = [];
  loot = [];
  boss = null;
  gameOver = false;

  player.x = canvas.width / 2 + (Math.random() * 40 - 20);
  player.y = canvas.height / 2 + (Math.random() * 40 - 20);
  player.hp = player.maxHp;

  // Boss room reachable ✅
  if (world.y === -1) {
    boss = { x: canvas.width / 2, y: 140, hp: 300, phase: 1, cd: 60 };
    return;
  }

  if (world.x === 0 && world.y === 0) return;

  const difficulty = Math.abs(world.x) + Math.abs(world.y);
  for (let i = 0; i < 3 + difficulty; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      hp: 30 + difficulty * 5,
      atk: 6 + difficulty,
      hitCooldown: 0
    });
  }
}
spawnRoom();

// ------------------ UPDATE ------------------
function update(dt) {
  if (gameOver) return;

  // ---------- PLAYER MOVEMENT ----------
  let mx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  let my = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  let m = Math.hypot(mx, my) || 1;

  player.x += mx / m * player.speed * dt;
  player.y += my / m * player.speed * dt;

  // Bounds ✅
  player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

  // ---------- SHOOTING ----------
  let dmg = player.baseDmg + (player.equip.weapon?.dmg || 0);

  if (mouse.down && player.cooldown <= 0) {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const d = Math.hypot(dx, dy) || 1;

    if (player.equip.weapon?.fire) {
      // Phoenix Staff fire wave ✅
      for (let i = -2; i <= 2; i++) {
        const a = Math.atan2(dy, dx) + i * 0.2;
        bullets.push({
          x: player.x, y: player.y,
          dx: Math.cos(a) * 6,
          dy: Math.sin(a) * 6,
          dmg
        });
      }
    } else {
      bullets.push({
        x: player.x, y: player.y,
        dx: dx / d * 8,
        dy: dy / d * 8,
        dmg
      });
    }

    player.cooldown = 15;
  }
  if (player.cooldown > 0) player.cooldown -= dt;

  // ---------- BULLETS ----------
  bullets.forEach(b => { b.x += b.dx * dt; b.y += b.dy * dt; });

  // Despawn bullets ✅
  bullets = bullets.filter(b =>
    !b.dead &&
    b.x > -50 && b.x < canvas.width + 50 &&
    b.y > -50 && b.y < canvas.height + 50
  );

  // ---------- ENEMY LOGIC ----------
  enemies.forEach(e => {
    if (e.hitCooldown > 0) e.hitCooldown--;

    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy) || 1;

    // Move
    e.x += dx / dist * 1.2 * dt;
    e.y += dy / dist * 1.2 * dt;

    // Enemy bounds ✅
    e.x = Math.max(ENEMY_RADIUS, Math.min(canvas.width - ENEMY_RADIUS, e.x));
    e.y = Math.max(ENEMY_RADIUS, Math.min(canvas.height - ENEMY_RADIUS, e.y));

    // Damage with cooldown ✅
    if (dist < PLAYER_RADIUS + ENEMY_RADIUS && e.hitCooldown <= 0) {
      const armour = player.equip.chest?.armour || 0;
      player.hp -= e.atk * (1 - armour);
      e.hitCooldown = HIT_COOLDOWN;
    }
  });

  // ---------- BULLET HITS ----------
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_RADIUS) {
        e.hp -= b.dmg;
        b.dead = true;
      }
    });

    // Boss bullet damage ✅
    if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < 30) {
      boss.hp -= b.dmg;
      b.dead = true;
    }
  });

  // ---------- ENEMY DEATH & LOOT ----------
  enemies = enemies.filter(e => {
    if (e.hp <= 0) {
      loot.push({
        x: Math.min(canvas.width - 20, Math.max(20, e.x)),
        y: Math.min(canvas.height - 20, Math.max(20, e.y)),
        gold: 2 + Math.floor(Math.random() * 6)
      });
      if (Math.random() < 0.25)
        loot.push({ x: e.x + 8, y: e.y, item: WEAPONS[Math.floor(Math.random() * WEAPONS.length)] });
      return false;
    }
    return true;
  });

  // ---------- PICKUP ----------
  loot = loot.filter(l => {
    if (Math.hypot(player.x - l.x, player.y - l.y) < PICKUP_RADIUS) {
      if (l.gold) player.gold += l.gold;
      if (l.item) player.equip[l.item.slot] = l.item;
      return false;
    }
    return true;
  });

  // ---------- BOSS LOGIC ----------
  if (boss) {
    if (boss.hp < 200) boss.phase = 2;
    if (boss.hp < 100) boss.phase = 3;

    boss.cd--;
    if (boss.cd <= 0) {
      boss.cd = 60 - boss.phase * 10;
      const shots = boss.phase * 6;
      for (let i = 0; i < shots; i++) {
        const a = (Math.PI * 2 / shots) * i;
        enemyBullets.push({
          x: boss.x, y: boss.y,
          dx: Math.cos(a) * 3,
          dy: Math.sin(a) * 3,
          dmg: 6
        });
      }
    }
  }

  // Boss bullets hit player ✅
  enemyBullets.forEach(b => {
    b.x += b.dx * dt;
    b.y += b.dy * dt;
    if (Math.hypot(b.x - player.x, b.y - player.y) < PLAYER_RADIUS) {
      player.hp -= b.dmg;
      b.dead = true;
    }
  });
  enemyBullets = enemyBullets.filter(b => !b.dead);

  // ---------- GAME OVER ✅ ----------
  if (player.hp <= 0) {
    gameOver = true;
    setTimeout(() => spawnRoom(), 1000);
  }

  // ---------- BOSS WIN ✅ ----------
  if (boss && boss.hp <= 0) {
    world.y = 0;
    spawnRoom();
  }

  mouse.click = false;
}

// ------------------ DRAW ------------------
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // NPCs
  ctx.fillStyle = "orange";
  ctx.fillRect(blacksmith.x - 10, blacksmith.y - 20, 20, 40);
  ctx.fillStyle = "purple";
  ctx.fillRect(enchanter.x - 10, enchanter.y - 20, 20, 40);

  // Player
  ctx.fillStyle = player.equip.weapon?.fire ? "orange" : "white";
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, ENEMY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  });

  // Boss
  if (boss) {
    ctx.fillStyle = ["orange", "crimson", "gold"][boss.phase - 1];
    ctx.fillRect(boss.x - 24, boss.y - 24, 48, 48);
  }

  // Bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 2, 4, 4));
  ctx.fillStyle = "purple";
  enemyBullets.forEach(b => ctx.fillRect(b.x - 3, b.y - 3, 6, 6));

  // HUD
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 8);
  ctx.fillStyle = "white";
  ctx.fillText("Gold: " + player.gold, 20, 50);
  ctx.fillText("Weapon: " + (player.equip.weapon?.name || "None"), 20, 70);

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.fillText("YOU DIED", canvas.width / 2 - 30, canvas.height / 2);
  }
}

// ------------------ LOOP ------------------
let last = 0;
function loop(t) {
  const dt = Math.min((t - last) / 16.6, 2);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
