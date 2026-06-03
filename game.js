/* =====================================================
   INTO DARKNESS — FINAL POLISHED CORE (STABLE)
   ===================================================== */

/* ---------- CANVAS ---------- */
const canvas = document.getElementById("c");
if (!canvas) throw new Error("Canvas element with id 'c' not found");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth || 800;
  canvas.height = window.innerHeight || 600;
}
window.addEventListener("resize", resize);
resize();

/* ---------- CONSTANTS ---------- */
const PLAYER_RADIUS = 12;
const ENEMY_RADIUS = 12;
const PICKUP_RADIUS = 20;
const ENEMY_HIT_COOLDOWN = 0.4;
const PLAYER_SHOOT_COOLDOWN = 0.25;
const DEATH_GOLD_PENALTY = 4;

/* ---------- INPUT ---------- */
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

/* ---------- PLAYER ---------- */
const player = {
  x: 0, y: 0,
  hp: 150, maxHp: 150,
  baseDmg: 6,
  speed: 3,
  gold: 0,
  shootCD: 0,
  equip: { weapon: null, chest: null }
};

/* ---------- ITEMS ---------- */
const WEAPONS = [
  { name: "Iron Sword", slot: "weapon", dmg: 3, cost: 10 },
  { name: "Phoenix Staff", slot: "weapon", dmg: 4, fire: true, cost: 25 }
];
const ARMOUR = [
  { name: "Chainmail", slot: "chest", armour: 0.25, cost: 20 }
];
const inventory = [];

/* ---------- NPC ---------- */
const NPCS = [
  { name: "Blacksmith", x: 200, y: 220, shop: [...WEAPONS, ...ARMOUR] }
];
let activeNPC = null;

/* ---------- WORLD ---------- */
let world = { x: 0, y: 0 };
let enemies = [];
let bullets = [];
let enemyBullets = [];
let loot = [];
let boss = null;

/* ---------- DEATH & PROGRESSION ---------- */
let deathFade = 0;
let deathCount = 0;
const graves = []; // { x, y, roomX, roomY }

/* ---------- SPAWN ---------- */
function spawnRoom() {
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  loot.length = 0;
  boss = null;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (world.y === -1) {
    boss = { x: canvas.width / 2, y: 140, hp: 320 + deathCount * 15, phase: 1, cd: 1 };
    return;
  }

  if (world.x === 0 && world.y === 0) return;

  const difficulty = Math.abs(world.x) + Math.abs(world.y) + deathCount * 0.5;

  for (let i = 0; i < 3 + difficulty; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      hp: 30 + difficulty * 6,
      atk: 6 + difficulty * 1.2,
      hitCD: 0
    });
  }
}

/* ---------- RETURN TO TOWN ON DEATH ---------- */
function handleDeath() {
  // Drop grave marker
  graves.push({ x: player.x, y: player.y, roomX: world.x, roomY: world.y });

  // Gold penalty
  player.gold = Math.max(0, player.gold - DEATH_GOLD_PENALTY);

  // Increase difficulty slightly
  deathCount++;

  // Return to town
  world.x = 0;
  world.y = 0;

  player.hp = player.maxHp;
  spawnRoom();
}

/* ---------- UPDATE ---------- */
function update(dt) {
  const click = mouse.click;
  mouse.click = false;

  /* ---- DEATH FADE ---- */
  if (deathFade > 0) {
    deathFade -= dt * 1.5;
    if (deathFade <= 0) {
      handleDeath();
    }
    return;
  }

  /* ---- PLAYER MOVE ---- */
  let mx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  let my = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  let mag = Math.hypot(mx, my) || 1;

  player.x += (mx / mag) * player.speed * dt;
  player.y += (my / mag) * player.speed * dt;

  player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

  /* ---- SHOOT ---- */
  if (player.shootCD > 0) player.shootCD -= dt;

  if (mouse.down && player.shootCD <= 0) {
    const a = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const dmg = player.baseDmg + (player.equip.weapon?.dmg || 0);

    if (player.equip.weapon?.fire) {
      for (let i = -1; i <= 1; i++) {
        bullets.push({
          x: player.x, y: player.y,
          dx: Math.cos(a + i * 0.15) * 6,
          dy: Math.sin(a + i * 0.15) * 6,
          dmg: dmg * 0.6,
          used: false
        });
      }
    } else {
      bullets.push({
        x: player.x, y: player.y,
        dx: Math.cos(a) * 8,
        dy: Math.sin(a) * 8,
        dmg,
        used: false
      });
    }
    player.shootCD = PLAYER_SHOOT_COOLDOWN;
  }

  bullets.forEach(b => {
    b.x += b.dx * dt;
    b.y += b.dy * dt;
  });

  bullets = bullets.filter(b =>
    !b.used &&
    b.x > -50 && b.x < canvas.width + 50 &&
    b.y > -50 && b.y < canvas.height + 50
  );

  /* ---- ENEMIES ---- */
  enemies.forEach(e => {
    if (e.hitCD > 0) e.hitCD -= dt;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;

    e.x += dx / d * 1.2 * dt;
    e.y += dy / d * 1.2 * dt;

    if (d < PLAYER_RADIUS + ENEMY_RADIUS && e.hitCD <= 0) {
      const armour = Math.min(0.9, Math.max(0, player.equip.chest?.armour || 0));
      player.hp -= e.atk * (1 - armour);
      e.hitCD = ENEMY_HIT_COOLDOWN;
    }
  });

  /* ---- BULLET COLLISION ---- */
  bullets.forEach(b => {
    if (b.used) return;

    for (const e of enemies) {
      if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_RADIUS) {
        e.hp -= b.dmg;
        b.used = true;
        break;
      }
    }
  });

  enemies = enemies.filter(e => e.hp > 0);

  if (player.hp <= 0 && deathFade <= 0) {
    deathFade = 1;
  }

  /* ---- NPC INTERACTION ---- */
  if (click) {
    activeNPC = null;
    for (const npc of NPCS) {
      if (Math.hypot(mouse.x - npc.x, mouse.y - npc.y) < 40) {
        activeNPC = npc;
      }
    }
  }
}

/* ---------- DRAW ---------- */
function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px Arial";

  // Graves
  ctx.fillStyle = "gray";
  graves.forEach(g => {
    if (g.roomX === world.x && g.roomY === world.y) {
      ctx.fillRect(g.x - 4, g.y - 4, 8, 8);
    }
  });

  // NPCs
  ctx.fillStyle = "orange";
  NPCS.forEach(n => ctx.fillRect(n.x - 10, n.y - 20, 20, 40));

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

  // HUD
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 8);
  ctx.strokeStyle = "white";
  ctx.strokeRect(20, 20, 200, 8);
  ctx.fillStyle = "white";
  ctx.fillText("Gold: " + player.gold, 20, 50);

  // Fade
  if (deathFade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${deathFade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/* ---------- LOOP ---------- */
let last = 0;
function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
spawnRoom();
requestAnimationFrame(loop);
