// ===== MOONLIGHTER-STYLE GAME =====
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

let frame = 0;
let floorPattern = null;
let gameState = "selecting";
let playerClass = "wizard";

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
const wizardImg = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== STATE =====
let currentSpell = "fire";
let level = 1;
let currentMap = 1;
let mapType = 1;
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
  dashCooldown: 0,
  attackAnim: 0,
  shootFlash: 0
};

let keys = {}, bullets = [], enemies = [], effects = [], doors = [], items = [], particles = [];
let mouse = { x: 0, y: 0 };

// ===== SHOP =====
function getShopItems() {
  if (playerClass === "wizard") {
    return [
      { name: "+40 Max Mana", cost: 90, effect: () => player.mana = Math.min(150, player.mana + 40) },
      { name: "Stronger Magic", cost: 160, effect: () => {} },
      { name: "Mana Regen Up", cost: 120, effect: () => {} },
      { name: "Full Restore", cost: 75, effect: () => { player.hp = player.maxHp; player.mana = 150; } }
    ];
  } else if (playerClass === "warrior") {
    return [
      { name: "+45 Max HP", cost: 100, effect: () => player.maxHp += 45 },
      { name: "Stronger Melee", cost: 150, effect: () => {} },
      { name: "Dash Upgrade", cost: 110, effect: () => player.dashCooldown = Math.max(18, player.dashCooldown - 12) },
      { name: "Full Heal", cost: 80, effect: () => player.hp = player.maxHp }
    ];
  } else {
    return [
      { name: "Arrow Speed Up", cost: 95, effect: () => {} },
      { name: "Double Shot", cost: 140, effect: () => {} },
      { name: "+Speed", cost: 130, effect: () => player.speed += 0.5 },
      { name: "Full Restore", cost: 70, effect: () => { player.hp = player.maxHp; player.mana = 100; } }
    ];
  }
}

let shopItems = [];

function openShop() {
  gameState = "shop";
  shopItems = getShopItems();
}

function closeShop() {
  gameState = "playing";
  level++;
  currentMap = Math.floor((level-1)/5) + 1;
  mapType = ((currentMap-1) % 5) + 1;
  spawn();
}

// ===== CLASS SELECTION =====
function selectClass(cls) {
  playerClass = cls;
  gameState = "playing";

  if (cls === "wizard") { player.hp = 90; player.maxHp = 90; player.mana = 100; player.speed = 3.2; }
  else if (cls === "warrior") { player.hp = 150; player.maxHp = 150; player.mana = 0; player.speed = 2.7; }
  else if (cls === "archer") { player.hp = 105; player.maxHp = 105; player.mana = 70; player.speed = 3.9; }

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  score = 0;
  level = 1;
  currentMap = 1;
  mapType = 1;
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
      player.dash = 14; player.dashCooldown = 45;
    }
  }
  if (e.key.toLowerCase() === "e" && gameState === "shop") closeShop();
});
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", e => {
  if (gameState === "selecting") handleClassSelection(e);
  else if (gameState === "shop") handleShopClick(e);
  else attack();
});

function handleClassSelection(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (y > 280 && y < 360) {
    if (x > 200 && x < 450) selectClass("wizard");
    if (x > 500 && x < 750) selectClass("warrior");
    if (x > 800 && x < 1050) selectClass("archer");
  }
}

function handleShopClick(e) {
  const r = canvas.getBoundingClientRect();
  const clickX = e.clientX - r.left;
  const clickY = e.clientY - r.top;

  shopItems.forEach((item, i) => {
    const y = 220 + i * 70;
    if (clickX > 300 && clickX < 700 && clickY > y && clickY < y + 55 && score >= item.cost) {
      score -= item.cost;
      item.effect();
    }
  });

  if (clickX > 500 && clickX < 700 && clickY > 520 && clickY < 570) closeShop();
}

// ===== ATTACK =====
function attack() {
  if (gameState !== "playing") return;

  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const d = Math.hypot(dx, dy) || 1;

  player.attackAnim = 18;
  player.shootFlash = 6;

  if (playerClass === "wizard") {
    if (currentSpell === "fire" && player.mana >= 5) {
      player.mana -= 5;
      bullets.push({ x: player.x, y: player.y, dx: dx/d*9, dy: dy/d*9, dmg: 1, dead: false });
      // Magic particles
      for (let i = 0; i < 6; i++) {
        particles.push({ x: player.x, y: player.y, dx: (Math.random()-0.5)*3, dy: (Math.random()-0.5)*3, life: 12, color: "#aaffff" });
      }
    }
    if (currentSpell === "lightning" && player.mana >= 20) {
      player.mana -= 20;
      const nx = dx / d, ny = dy / d;
      effects.push({ type: "beam", x: player.x, y: player.y, dx: nx, dy: ny, length: 850, life: 8 });
      enemies.forEach(e => {
        const px = e.x - player.x, py = e.y - player.y;
        const proj = px * nx + py * ny;
        if (proj > 0 && proj < 850 && Math.abs(px * ny - py * nx) < 28) {
          e.hp -= 5; e.hitFlash = 8;
        }
      });
    }
    if (currentSpell === "stun" && player.mana >= 15) {
      player.mana -= 15;
      enemies.forEach(e => {
        if (Math.hypot(player.x - e.x, player.y - e.y) < 140) {
          e.stun = 75; e.hitFlash = 8;
        }
      });
    }
  } 
  else if (playerClass === "warrior") {
    enemies.forEach(e => {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 95) {
        e.hp -= 5;
        e.hitFlash = 12;
        const kx = (e.x - player.x) / 6;
        const ky = (e.y - player.y) / 6;
        e.x += kx; e.y += ky;
      }
    });
  } 
  else if (playerClass === "archer") {
    const arrowSpeed = 12.5;
    bullets.push({ x: player.x, y: player.y, dx: dx/d*arrowSpeed, dy: dy/d*arrowSpeed, dmg: 1.8, dead: false, isArrow: true });
    if (Math.random() < 0.45) {
      bullets.push({
        x: player.x, y: player.y,
        dx: (dx/d*arrowSpeed) + (Math.random()-0.5)*4,
        dy: (dy/d*arrowSpeed) + (Math.random()-0.5)*4,
        dmg: 1.3, dead: false, isArrow: true
      });
    }
  }
}

// ===== SPAWN + ITEMS =====
function spawn() {
  enemies = []; doors = []; items = [];
  if (level % 5 === 0) {
    enemies.push({
      x: canvas.width/2 + (Math.random()-0.5)*400,
      y: canvas.height/2 + (Math.random()-0.5)*300,
      hp: 55 + level * 12, maxHp: 55 + level * 12,
      speed: 1.35, isBoss: true, size: 78, stun: 0, hitFlash: 0, attackCooldown: 60
    });
  } else {
    for (let i = 0; i < 3 + level; i++) {
      let ex, ey, dist, tries = 0;
      do {
        ex = Math.random() * canvas.width;
        ey = Math.random() * canvas.height;
        dist = Math.hypot(ex - player.x, ey - player.y);
        tries++;
      } while (dist < 85 && tries < 20);
      enemies.push({ x: ex, y: ey, hp: 2 + level, speed: 1, stun: 0, hitFlash: 0 });
    }
  }
}
spawn();

function dropItem(x, y, chance = 0.38) {
  if (Math.random() > chance) return;
  const type = Math.random();
  let itemType = type < 0.4 ? "health" : type < 0.7 ? "mana" : "score";
  items.push({ x, y, type: itemType, life: 650 });
}

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
  const speed = player.dash > 0 ? 8.5 : player.speed;

  player.x += (mx / mag) * speed;
  player.y += (my / mag) * speed;

  if (player.dash > 0) player.dash--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.shootFlash > 0) player.shootFlash--;
  if (player.attackAnim > 0) player.attackAnim--;

  player.x = Math.max(50, Math.min(canvas.width-50, player.x));
  player.y = Math.max(50, Math.min(canvas.height-50, player.y));

  if (playerClass !== "warrior") player.mana = Math.min(150, player.mana + 0.14);

  // Dash particles (Moonlighter style)
  if (player.dash > 0 && frame % 2 === 0) {
    particles.push({ x: player.x, y: player.y, dx: (Math.random()-0.5)*3.5, dy: (Math.random()-0.5)*3.5, life: 10, color: "#bbddff" });
  }

  bullets.forEach(b => {
    b.x += b.dx; b.y += b.dy;
    if (b.x < -25 || b.x > canvas.width+25 || b.y < -25 || b.y > canvas.height+25) b.dead = true;
  });

  enemies.forEach(e => {
    if (e.stun > 0) { e.stun--; return; }
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    let moveSpeed = e.isBoss ? 1.55 : (e.speed || 1);
    e.x += (dx / d) * moveSpeed;
    e.y += (dy / d) * moveSpeed;

    if (!e.isBoss && Math.hypot(player.x-e.x, player.y-e.y) < 30) player.hp -= 0.3;

    if (e.isBoss) {
      e.attackCooldown--;
      if (e.attackCooldown <= 0 && Math.hypot(player.x-e.x, player.y-e.y) < 130) {
        player.hp -= 7; e.attackCooldown = 75;
      }
    }
  });

  bullets.forEach(b => {
    if (b.dead) return;
    enemies.forEach(e => {
      const size = e.isBoss ? 40 : 26;
      if (Math.hypot(b.x - e.x, b.y - e.y) < size) {
        e.hp -= b.dmg;
        b.dead = true;
        e.hitFlash = 10;
        score += e.isBoss ? 65 : 12;
        if (e.hp <= 0) dropItem(e.x, e.y, e.isBoss ? 0.92 : 0.38);
      }
    });
  });

  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => e.hp > 0);

  // Item pickup + glow particles
  items.forEach((item, i) => {
    if (Math.hypot(player.x - item.x, player.y - item.y) < 38) {
      if (item.type === "health") player.hp = Math.min(player.maxHp, player.hp + 28);
      if (item.type === "mana") player.mana = Math.min(150, player.mana + 50);
      if (item.type === "score") score += 35;
      items.splice(i, 1);
    }
    item.life--;
    if (frame % 8 === 0) {
      particles.push({ x: item.x, y: item.y, dx: 0, dy: -0.3, life: 18, color: item.type === "health" ? "#ff6666" : item.type === "mana" ? "#66aaff" : "#ffcc44" });
    }
  });
  items = items.filter(i => i.life > 0);

  particles = particles.filter(p => { p.x += p.dx; p.y += p.dy; p.life--; return p.life > 0; });

  // Doors
  if (enemies.length === 0 && doors.length === 0 && level % 5 !== 0) {
    doors.push({ x: canvas.width/2, y: 55, type: "top" });
    doors.push({ x: canvas.width/2, y: canvas.height-55, type: "bottom" });
    if (Math.random() > 0.5) doors.push({ x: 55, y: canvas.height/2, type: "left" });
    if (Math.random() > 0.5) doors.push({ x: canvas.width-55, y: canvas.height/2, type: "right" });
  }

  doors.forEach(door => {
    if (Math.hypot(player.x - door.x, player.y - door.y) < 58) {
      doors = [];
      if (level % 5 === 4) openShop();
      else {
        level++;
        currentMap = Math.floor((level-1)/5) + 1;
        mapType = ((currentMap-1) % 5) + 1;
        spawn();
      }
    }
  });

  if (player.hp <= 0) {
    player.hp = player.maxHp;
    level = 1; currentMap = 1; mapType = 1; score = 0;
    spawn();
  }
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (loaded < 3) {
    ctx.fillStyle = "white"; ctx.font = "28px sans-serif";
    ctx.fillText("Loading...", 200, 200); return;
  }

  // Moonlighter-style floor
  let floorColor = "#222";
  if (mapType === 2) floorColor = "#1a1a2e";
  if (mapType === 3) floorColor = "#3a1f1f";
  if (mapType === 4) floorColor = "#1f2a3a";
  if (mapType === 5) floorColor = "#1f3a2a";

  if (!floorPattern) floorPattern = ctx.createPattern(tiles, "repeat");
  ctx.fillStyle = floorPattern || floorColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle map atmosphere
  if (mapType === 3) { ctx.fillStyle = "rgba(255,60,0,0.07)"; ctx.fillRect(0,0,canvas.width,canvas.height); }
  if (mapType === 4) { ctx.fillStyle = "rgba(80,160,255,0.07)"; ctx.fillRect(0,0,canvas.width,canvas.height); }

  // ===== SOFT SHADOWS (Moonlighter style) =====
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 22, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  enemies.forEach(e => {
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 18, e.isBoss ? 28 : 14, e.isBoss ? 9 : 5, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 18;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-2, p.y-2, 5, 5);
  });
  ctx.globalAlpha = 1;

  // ===== CLASS SELECTION =====
  if (gameState === "selecting") {
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "52px sans-serif";
    ctx.fillText("CHOOSE YOUR CLASS", canvas.width/2 - 280, 150);

    ctx.fillStyle = "#4455cc"; ctx.fillRect(200, 280, 250, 80);
    ctx.fillStyle = "white"; ctx.font = "32px sans-serif"; ctx.fillText("WIZARD", 255, 330);

    ctx.fillStyle = "#cc5533"; ctx.fillRect(500, 280, 250, 80);
    ctx.fillStyle = "white"; ctx.fillText("WARRIOR", 540, 330);

    ctx.fillStyle = "#44aa55"; ctx.fillRect(800, 280, 250, 80);
    ctx.fillStyle = "white"; ctx.fillText("ARCHER", 860, 330);

    ctx.font = "20px sans-serif";
    ctx.fillText("Click a class to begin", canvas.width/2 - 120, 420);
    return;
  }

  // ===== PLAYER =====
  const moving = keys["w"] || keys["s"] || keys["a"] || keys["d"];
  const bob = moving ? Math.sin(frame * 0.28) * 6 : 0;
  const sway = moving ? Math.sin(frame * 0.22) * 3 : 0;

  ctx.save();
  const angleToMouse = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (player.attackAnim > 0) {
    const progress = player.attackAnim / 18;
    const leanAmount = Math.sin(progress * Math.PI) * 18;
    ctx.translate(player.x, player.y);
    ctx.rotate(angleToMouse + Math.PI / 2);
    ctx.translate(0, -leanAmount);
  } else {
    ctx.translate(player.x + sway, player.y + bob);
    if (player.dash > 0) ctx.scale(1.12, 0.88);
  }

  // Class color tint (Moonlighter style)
  if (playerClass === "warrior") ctx.filter = "hue-rotate(18deg) saturate(1.5) brightness(1.08)";
  else if (playerClass === "archer") ctx.filter = "hue-rotate(-38deg) saturate(1.35)";
  else ctx.filter = "saturate(1.15)";

  if (player.shootFlash > 0) {
    ctx.fillStyle = "rgba(255,220,100,0.5)";
    ctx.beginPath(); ctx.arc(0, -22, 20, 0, Math.PI*2); ctx.fill();
  }

  ctx.drawImage(wizardImg, -24, -48, 48, 48);
  ctx.filter = "none";
  ctx.restore();

  // Enemies
  enemies.forEach(e => {
    const bobAmount = Math.sin(frame * 0.3 + e.x) * 5;
    ctx.save();
    ctx.translate(e.x, e.y + bobAmount);
    if (e.isBoss) {
      if (e.hp < e.maxHp * 0.4) {
        const pulse = 1 + Math.sin(frame * 0.4) * 0.12;
        ctx.scale(pulse, pulse);
      }
      if (e.hitFlash > 0) { ctx.filter = "brightness(2.6)"; e.hitFlash--; }
      ctx.drawImage(skeleton, -e.size/2, -e.size/2, e.size, e.size);
      ctx.filter = "none";
      ctx.fillStyle = "#ff3333"; ctx.fillRect(-50, -e.size/2 - 24, 100, 8);
      ctx.fillStyle = "#33ff66"; ctx.fillRect(-50, -e.size/2 - 24, 100 * (e.hp / e.maxHp), 8);
    } else {
      if (e.hitFlash > 0) { ctx.filter = "brightness(2.6)"; e.hitFlash--; }
      ctx.drawImage(skeleton, -20, -20 + bobAmount * 0.3, 40, 40);
      ctx.filter = "none";
    }
    ctx.restore();
  });

  // Bullets + glow
  ctx.fillStyle = playerClass === "archer" ? "#bbff88" : "#ffaa44";
  bullets.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.isArrow ? 4.5 : 6, 0, Math.PI*2); ctx.fill();
  });

  // Lightning
  effects.forEach(f => {
    if (f.type === "beam") {
      ctx.strokeStyle = "#bbddff";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + f.dx * f.length, f.y + f.dy * f.length); ctx.stroke();
      f.life--;
    }
  });
  effects = effects.filter(f => f.life > 0);

  // ===== DOORS (Moonlighter style) =====
  doors.forEach(door => {
    ctx.fillStyle = "#5c3311";
    ctx.fillRect(door.x - 38, door.y - 38, 76, 76);
    ctx.fillStyle = "#c9a36b";
    ctx.fillRect(door.x - 32, door.y - 32, 64, 64);
    ctx.fillStyle = "#3a1f0f";
    ctx.fillRect(door.x - 8, door.y - 22, 16, 44);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(door.x - 4, door.y - 4, 8, 8);
  });

  // ===== ITEMS with glow =====
  items.forEach(item => {
    const glow = Math.sin(frame * 0.15) * 3 + 8;
    if (item.type === "health") {
      ctx.fillStyle = "rgba(255,60,60,0.4)"; ctx.beginPath(); ctx.arc(item.x, item.y, glow, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff4444"; ctx.beginPath(); ctx.arc(item.x, item.y, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "white"; ctx.fillRect(item.x-3, item.y-7, 6, 14); ctx.fillRect(item.x-7, item.y-3, 14, 6);
    }
    if (item.type === "mana") {
      ctx.fillStyle = "rgba(80,160,255,0.4)"; ctx.beginPath(); ctx.arc(item.x, item.y, glow, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#4488ff"; ctx.beginPath(); ctx.arc(item.x, item.y, 11, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "white"; ctx.fillRect(item.x-3, item.y-7, 6, 14);
    }
    if (item.type === "score") {
      ctx.fillStyle = "rgba(255,200,50,0.4)"; ctx.beginPath(); ctx.arc(item.x, item.y, glow-2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ffcc44"; ctx.beginPath(); ctx.arc(item.x, item.y, 9, 0, Math.PI*2); ctx.fill();
    }
  });

  // Shop
  if (gameState === "shop") {
    ctx.fillStyle = "rgba(15,10,5,0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffddaa";
    ctx.font = "48px sans-serif";
    ctx.fillText("SHOP - " + playerClass.toUpperCase(), canvas.width/2 - 160, 120);

    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText("Score: " + score, canvas.width/2 - 60, 160);

    shopItems.forEach((item, i) => {
      const y = 230 + i * 68;
      ctx.fillStyle = score >= item.cost ? "#2a2118" : "#1a150f";
      ctx.fillRect(280, y, 440, 52);
      ctx.fillStyle = "#ffddaa";
      ctx.fillText(item.name + "   —   " + item.cost + " pts", 300, y + 34);
    });

    ctx.fillStyle = "#448822";
    ctx.fillRect(480, 530, 240, 48);
    ctx.fillStyle = "white";
    ctx.fillText("Continue  (E)", 515, 562);
  }

  // ===== UI (Moonlighter style) =====
  if (gameState === "playing") {
    // Health bar
    ctx.fillStyle = "#3a1a1a";
    ctx.fillRect(18, 18, 240, 18);
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(20, 20, (player.hp / player.maxHp) * 236, 14);

    // Mana bar
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(18, 42, 240, 18);
    ctx.fillStyle = "#4488ff";
    ctx.fillRect(20, 44, player.mana * 2.36, 14);

    ctx.fillStyle = "#ffddaa";
    ctx.font = "18px sans-serif";
    ctx.fillText("Level " + level + "   •   Map " + currentMap, 20, 82);
    ctx.fillText(playerClass.toUpperCase(), 20, 105);
    ctx.fillText("Score: " + score, 20, 128);
  }
}

// ===== LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
