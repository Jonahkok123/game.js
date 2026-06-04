/* =====================================================
   INTO DARKNESS — FINAL POLISHED CORE (GAMEPLAY + GRAPHICS)
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
const BOSS_RADIUS = 24;
const PICKUP_RADIUS = 20;
const ENEMY_HIT_COOLDOWN = 0.4;
const PLAYER_SHOOT_COOLDOWN = 0.25;
const DEATH_GOLD_PENALTY = 4;
const ENEMY_SHOOT_COOLDOWN = 1.5;
const ROOM_TRANSITION_COOLDOWN = 0.2;

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
  equip: { weapon: null, chest: null, boots: null }
};

/* ---------- ITEMS ---------- */
const WEAPONS = [
  { name: "Iron Sword", slot: "weapon", dmg: 3, cost: 10 },
  { name: "Phoenix Staff", slot: "weapon", dmg: 4, fire: true, cost: 25 },
  { name: "Obsidian Blade", slot: "weapon", dmg: 6, cost: 50 }
];
const ARMOUR = [
  { name: "Chainmail", slot: "chest", armour: 0.25, cost: 20 },
  { name: "Dragon Plate", slot: "chest", armour: 0.4, cost: 60 }
];
const BOOTS = [
  { name: "Sprint Boots", slot: "boots", speed: 1.5, cost: 15 },
  { name: "Wind Treads", slot: "boots", speed: 2.5, cost: 40 }
];
const inventory = [];

/* ---------- NPC ---------- */
const NPCS = [
  { name: "Blacksmith", x: 200, y: 220, shop: [...WEAPONS, ...ARMOUR, ...BOOTS] }
];
let activeNPC = null;
let shopOpen = false;

/* ---------- WORLD ---------- */
let world = { x: 0, y: 0 };
let worldTransitionCD = 0;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let loot = [];
let boss = null;
let particles = [];
let bloodSplats = [];

/* ---------- DEATH & PROGRESSION ---------- */
let deathFade = 0;
let deathCount = 0;
let showTutorial = true;
const graves = [];

/* ---------- BLOOD SPLATS ---------- */
function spawnBloodSplats(x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 15;
    bloodSplats.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: 2 + Math.random() * 4,
      life: 3 + Math.random() * 2
    });
  }
}

/* ---------- PARTICLES ---------- */
function spawnParticles(x, y, color = "red", count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    particles.push({
      x, y,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 0.3,
      color
    });
  }
}

/* ---------- SPAWN ---------- */
function spawnRoom() {
  enemies.length = bullets.length = enemyBullets.length = loot.length = 0;
  boss = null;
  shopOpen = false;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (world.y === -1) {
    boss = {
      x: canvas.width / 2,
      y: 140,
      hp: 320 + deathCount * 15,
      maxHp: 320 + deathCount * 15,
      cd: 1
    };
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
      hitCD: 0,
      shootCD: 0,
      hitFlash: 0
    });
  }
}

/* ---------- RETURN TO TOWN ON DEATH ---------- */
function handleDeath() {
  graves.push({ x: player.x, y: player.y, roomX: world.x, roomY: world.y });
  spawnBloodSplats(player.x, player.y, 15);
  player.gold = Math.max(0, player.gold - DEATH_GOLD_PENALTY);
  deathCount++;
  world.x = 0;
  world.y = 0;
  player.hp = player.maxHp;
  spawnRoom();
}

/* ---------- SHOP PURCHASE ---------- */
function buyItem(item) {
  if (player.gold >= item.cost) {
    player.gold -= item.cost;
    player.equip[item.slot] = item;
    shopOpen = false;
  }
}

/* ---------- UPDATE ---------- */
function update(dt) {
  const click = mouse.click;
  mouse.click = false;

  if (deathFade > 0) {
    deathFade -= dt * 1.5;
    if (deathFade <= 0) handleDeath();
    return;
  }

  /* Tutorial dismiss */
  if (showTutorial && click) {
    showTutorial = false;
  }

  /* World movement */
  if (worldTransitionCD > 0) worldTransitionCD -= dt;
  if (worldTransitionCD <= 0 && !shopOpen) {
    if (keys.arrowup) { world.y--; worldTransitionCD = ROOM_TRANSITION_COOLDOWN; spawnRoom(); }
    if (keys.arrowdown) { world.y++; worldTransitionCD = ROOM_TRANSITION_COOLDOWN; spawnRoom(); }
    if (keys.arrowleft) { world.x--; worldTransitionCD = ROOM_TRANSITION_COOLDOWN; spawnRoom(); }
    if (keys.arrowright) { world.x++; worldTransitionCD = ROOM_TRANSITION_COOLDOWN; spawnRoom(); }
  }

  /* Player move */
  let mx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  let my = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
  let mag = Math.hypot(mx, my) || 1;
  const speedBoost = (player.equip.boots?.speed || 1);
  player.x += (mx / mag) * player.speed * speedBoost * dt;
  player.y += (my / mag) * player.speed * speedBoost * dt;

  /* Clamp player to canvas */
  player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

  /* Shooting */
  if (player.shootCD > 0) player.shootCD -= dt;
  if (mouse.down && player.shootCD <= 0 && !shopOpen) {
    const a = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const dmg = player.baseDmg + (player.equip.weapon?.dmg || 0);
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(a) * 8,
      dy: Math.sin(a) * 8,
      dmg,
      used: false
    });
    player.shootCD = PLAYER_SHOOT_COOLDOWN;
  }

  bullets.forEach(b => { b.x += b.dx * dt; b.y += b.dy * dt; });

  /* Enemies update + loot on death */
  enemies = enemies.filter(e => {
    if (e.hitCD > 0) e.hitCD -= dt;
    if (e.shootCD > 0) e.shootCD -= dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += dx / d * 1.2 * dt;
    e.y += dy / d * 1.2 * dt;

    if (d < PLAYER_RADIUS + ENEMY_RADIUS && e.hitCD <= 0) {
      const armour = Math.min(0.9, Math.max(0, player.equip.chest?.armour || 0));
      player.hp -= e.atk * (1 - armour);
      e.hitCD = ENEMY_HIT_COOLDOWN;
      spawnBloodSplats(player.x, player.y, 5);
    }

    /* Enemy shooting */
    if (e.shootCD <= 0) {
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      enemyBullets.push({
        x: e.x,
        y: e.y,
        dx: Math.cos(ang) * 5,
        dy: Math.sin(ang) * 5,
        dmg: 3,
        used: false
      });
      e.shootCD = ENEMY_SHOOT_COOLDOWN;
    }

    if (e.hp <= 0) {
      spawnBloodSplats(e.x, e.y, 12);
      spawnParticles(e.x, e.y, "#ff5555", 8);
      loot.push({ x: e.x, y: e.y, gold: 5 + Math.floor(deathCount * 1.5) });
      return false;
    }
    return true;
  });

  /* Bullet collision */
  bullets.forEach(b => {
    if (b.used) return;
    for (const e of enemies) {
      if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_RADIUS) {
        e.hp -= b.dmg;
        e.hitFlash = 0.1;
        b.used = true;
        spawnBloodSplats(b.x, b.y, 6);
        spawnParticles(e.x, e.y, "yellow", 4);
        break;
      }
    }
    if (boss && !b.used && Math.hypot(b.x - boss.x, b.y - boss.y) < BOSS_RADIUS) {
      boss.hp -= b.dmg;
      b.used = true;
      spawnBloodSplats(b.x, b.y, 8);
      spawnParticles(boss.x, boss.y, "orange", 5);
    }
  });
  bullets = bullets.filter(b => !b.used && b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20);

  /* Boss fight */
  if (boss) {
    boss.cd -= dt;
    if (boss.cd <= 0) {
      const ang = Math.atan2(player.y - boss.y, player.x - boss.x);
      for (let i = -2; i <= 2; i++) {
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          dx: Math.cos(ang + i * 0.3) * 6,
          dy: Math.sin(ang + i * 0.3) * 6,
          dmg: 6,
          used: false
        });
      }
      boss.cd = 1;
    }
    if (boss.hp <= 0) {
      spawnBloodSplats(boss.x, boss.y, 20);
      spawnParticles(boss.x, boss.y, "purple", 15);
      loot.push({ x: boss.x, y: boss.y, gold: 50 + deathCount * 10 });
      boss = null;
    }
  }

  /* Enemy bullets */
  enemyBullets.forEach(b => {
    b.x += b.dx * dt;
    b.y += b.dy * dt;
    if (!b.used && Math.hypot(b.x - player.x, b.y - player.y) < PLAYER_RADIUS) {
      const armour = Math.min(0.9, Math.max(0, player.equip.chest?.armour || 0));
      player.hp -= b.dmg * (1 - armour);
      b.used = true;
      spawnBloodSplats(player.x, player.y, 6);
      spawnParticles(player.x, player.y, "red", 4);
    }
  });
  enemyBullets = enemyBullets.filter(b => !b.used && b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20);

  /* Loot pickup */
  loot = loot.filter(l => {
    if (Math.hypot(l.x - player.x, l.y - player.y) < PICKUP_RADIUS) {
      player.gold += l.gold;
      spawnParticles(player.x, player.y, "gold", 6);
      return false;
    }
    return true;
  });

  /* Particles update */
  particles = particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 5 * dt; /* gravity */
    p.life -= dt;
    return p.life > 0;
  });

  /* Blood splats fade */
  bloodSplats = bloodSplats.filter(b => {
    b.life -= dt;
    return b.life > 0;
  });

  if (player.hp <= 0 && deathFade <= 0) deathFade = 1;

  /* NPC interaction */
  if (click && !shopOpen) {
    for (const npc of NPCS) {
      if (Math.hypot(mouse.x - npc.x, mouse.y - npc.y) < 40) {
        activeNPC = npc;
        shopOpen = true;
      }
    }
  }

  /* Close shop on click outside */
  if (click && shopOpen) {
    if (mouse.x < 250 || mouse.x > 550 || mouse.y < 50 || mouse.y > 350) {
      shopOpen = false;
    }
  }
}

/* ---------- DRAW (GRAPHICS UPGRADE) ---------- */
function draw() {
  const t = 40;
  for (let x = 0; x < canvas.width; x += t) {
    for (let y = 0; y < canvas.height; y += t) {
      const v = 18 + Math.sin((x + y) * 0.02) * 8;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, t, t);
    }
  }

  /* Draw blood splats FIRST (behind everything) */
  bloodSplats.forEach(b => {
    ctx.globalAlpha = Math.max(0, b.life / (3 + 2)) * 0.6;
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.font = "14px Arial";

  graves.forEach(g => {
    if (g.roomX === world.x && g.roomY === world.y) {
      ctx.fillStyle = "#666";
      ctx.fillRect(g.x - 4, g.y - 6, 8, 12);
      ctx.fillRect(g.x - 7, g.y - 8, 14, 2);
    }
  });

  NPCS.forEach(n => {
    ctx.fillStyle = "#ffb347";
    ctx.beginPath();
    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.shadowColor = player.equip.weapon?.fire ? "orange" : "white";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.fillRect(-4, -2, 2, 2);
  ctx.fillRect(2, -2, 2, 2);
  ctx.restore();

  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = e.hitFlash > 0 ? "#fff" : "#8b0000";
    ctx.beginPath();
    ctx.arc(0, 0, ENEMY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff5555";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillRect(-4, 4, 8, 2);
    ctx.restore();
  });

  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#ff3333";
  enemyBullets.forEach(b => ctx.fillRect(b.x - 3, b.y - 3, 6, 6));

  if (boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.shadowColor = "purple";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#4b0082";
    ctx.beginPath();
    ctx.arc(0, 0, BOSS_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText("BOSS", -16, 4);
    /* Boss health bar */
    ctx.fillStyle = "red";
    ctx.fillRect(-BOSS_RADIUS, BOSS_RADIUS + 10, (boss.hp / boss.maxHp) * BOSS_RADIUS * 2, 4);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(-BOSS_RADIUS, BOSS_RADIUS + 10, BOSS_RADIUS * 2, 4);
    ctx.restore();
  }

  /* Draw particles */
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 0.3;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = "gold";
  loot.forEach(l => ctx.fillRect(l.x - 4, l.y - 4, 8, 8));

  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 8);
  ctx.strokeStyle = "white";
  ctx.strokeRect(20, 20, 200, 8);
  ctx.fillStyle = "white";
  ctx.fillText("HP: " + Math.ceil(player.hp) + "/" + player.maxHp, 20, 50);
  ctx.fillText("Gold: " + player.gold, 20, 70);
  ctx.fillText("Room: (" + world.x + ", " + world.y + ")", 20, 90);
  ctx.fillText("Deaths: " + deathCount, 20, 110);

  /* Equipment display */
  ctx.fillText("Equipment: ", 20, 130);
  ctx.fillStyle = "#ffff00";
  ctx.fillText((player.equip.weapon?.name || "None"), 140, 130);
  ctx.fillStyle = "#ffb347";
  ctx.fillText((player.equip.chest?.name || "None"), 140, 150);
  ctx.fillStyle = "#00ff00";
  ctx.fillText((player.equip.boots?.name || "None"), 140, 170);

  /* Boss location hint */
  if (world.y !== -1 && !shopOpen) {
    ctx.fillStyle = "#ffaa00";
    ctx.font = "12px Arial";
    ctx.fillText("↑ Go UP to face the BOSS", canvas.width - 200, 30);
  }

  if (shopOpen && activeNPC) {
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(250, 50, 300, 300);
    ctx.strokeStyle = "#ffb347";
    ctx.lineWidth = 2;
    ctx.strokeRect(250, 50, 300, 300);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText(activeNPC.name + "'s Shop", 270, 75);
    
    ctx.font = "14px Arial";
    let yOffset = 100;
    activeNPC.shop.forEach((item, idx) => {
      const canAfford = player.gold >= item.cost;
      ctx.fillStyle = canAfford ? "#fff" : "#888";
      ctx.fillText(`${idx + 1}. ${item.name} - ${item.cost}g`, 270, yOffset);
      
      /* Highlight equipped item */
      if (player.equip[item.slot] === item) {
        ctx.fillStyle = "#ffff00";
        ctx.fillText("✓", 510, yOffset);
      }
      
      yOffset += 25;
    });

    ctx.fillStyle = "#aaa";
    ctx.font = "12px Arial";
    ctx.fillText("Click item to buy (click outside to close)", 260, 330);
  }

  /* Tutorial screen */
  if (showTutorial) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffff00";
    ctx.font = "bold 24px Arial";
    ctx.fillText("INTO DARKNESS", canvas.width / 2 - 100, 100);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    const tutorial = [
      "WASD - Move",
      "Mouse - Aim",
      "Click - Shoot",
      "Arrow Keys - Change Rooms",
      "↑ UP to reach the BOSS",
      "Click Blacksmith to buy items",
      "",
      "Click anywhere to start"
    ];
    let y = 200;
    tutorial.forEach(line => {
      ctx.fillText(line, canvas.width / 2 - 100, y);
      y += 40;
    });
  }

  if (deathFade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${deathFade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/* ---------- SHOP CLICK HANDLING ---------- */
canvas.addEventListener("click", e => {
  if (!shopOpen || !activeNPC) return;
  
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  
  let yOffset = 100;
  activeNPC.shop.forEach((item, idx) => {
    const hitbox = {
      x1: 270,
      x2: 510,
      y1: yOffset - 12,
      y2: yOffset + 8
    };
    
    if (x >= hitbox.x1 && x <= hitbox.x2 && y >= hitbox.y1 && y <= hitbox.y2) {
      buyItem(item);
    }
    
    yOffset += 25;
  });
});

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
