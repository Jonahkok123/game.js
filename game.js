/* =====================================================
   INTO DARKNESS — FULL FEATURE RPG CORE
   ===================================================== */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

/* ================= RESIZE ================= */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ================= AUDIO ================= */
const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.addEventListener("click", () => AudioCtx.resume(), { once: true });

function sfx(f = 400, d = 0.08, v = 0.12, t = "square") {
  if (AudioCtx.state !== "running") return;
  const o = AudioCtx.createOscillator();
  const g = AudioCtx.createGain();
  o.type = t;
  o.frequency.value = f;
  g.gain.value = v;
  o.connect(g).connect(AudioCtx.destination);
  o.start();
  o.stop(AudioCtx.currentTime + d);
}

/* ---- background music loop ---- */
const music = AudioCtx.createOscillator();
const musicGain = AudioCtx.createGain();
music.type = "sawtooth";
music.frequency.value = 60;
musicGain.gain.value = 0.04;
music.connect(musicGain).connect(AudioCtx.destination);

/* ================= INPUT ================= */
let keys = {}, mouse = { x: 0, y: 0, down: false, click: false };
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

function gamepad() {
  const g = navigator.getGamepads()[0];
  if (!g) return { mx: 0, my: 0, fire: false };
  return { mx: g.axes[0], my: g.axes[1], fire: g.buttons[7].pressed };
}

/* ================= PLAYER ================= */
const player = {
  x: 0, y: 0,
  hp: 160, maxHp: 160,
  speed: 3,
  baseDmg: 6,
  gold: 0,
  cooldown: 0,
  equipment: {
    weapon: null,
    helmet: null,
    chest: null,
    boots: null
  }
};

/* ================= ITEMS ================= */
const RARITY = ["common", "rare", "epic"];
const rarityColour = { common: "white", rare: "cyan", epic: "violet" };

const WEAPONS = [
  { name: "Phoenix Staff", slot: "weapon", rarity: "epic",
    dmg: 6, fireWave: true },
  { name: "Storm Wand", slot: "weapon", rarity: "rare",
    dmg: 4, chain: true },
  { name: "Iron Sword", slot: "weapon", rarity: "common",
    dmg: 3 }
];

const ARMOUR = [
  { name: "Chainmail Chestplate", slot: "chest", rarity: "rare",
    armour: 0.25 },
  { name: "Leather Boots", slot: "boots", rarity: "common",
    speed: 0.4 },
  { name: "Knight Helm", slot: "helmet", rarity: "rare",
    armour: 0.15 }
];

const inventory = [];
function addItem(item) {
  inventory.push(item);
}

/* ================= WORLD ================= */
let world = { x: 0, y: 0 };
let explored = {};
let enemies = [];
let bullets = [];
let enemyBullets = [];
let loot = [];
let boss = null;

/* ================= QUESTS ================= */
let quests = [
  { title: "Skeleton Slayers", need: 5, done: 0, reward: 20, finished: false }
];

/* ================= NPCS ================= */
const blacksmith = {
  x: 200, y: 280,
  name: "Blacksmith",
  stock: ARMOUR
};

const enchanter = {
  x: 400, y: 280,
  name: "Enchanter",
  stock: WEAPONS
};

let talkingTo = null;

/* ================= SPAWN ================= */
function spawnRoom() {
  enemies = [];
  bullets = [];
  enemyBullets = [];
  loot = [];
  boss = null;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  explored[`${world.x},${world.y}`] = true;

  if (world.x === 0 && world.y === -1) {
    boss = { x: canvas.width / 2, y: 160, hp: 400, phase: 1, cd: 60 };
    return;
  }

  if (world.x === 0 && world.y === 0) return;

  for (let i = 0; i < 4; i++) {
    enemies.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      hp: 40
    });
  }
}
spawnRoom();

/* ================= UPDATE ================= */
function update(dt) {
  const g = gamepad();
  let mx = (keys.d?1:0)-(keys.a?1:0)+g.mx;
  let my = (keys.s?1:0)-(keys.w?1:0)+g.my;
  let m = Math.hypot(mx,my)||1;

  player.x += mx/m * player.speed * dt;
  player.y += my/m * player.speed * dt;

  let dmg = player.baseDmg;
  let armour = 0;

  Object.values(player.equipment).forEach(it => {
    if (!it) return;
    if (it.dmg) dmg += it.dmg;
    if (it.armour) armour += it.armour;
    if (it.speed) player.speed = 3 + it.speed;
  });

  if ((mouse.down || g.fire) && player.cooldown<=0) {
    if (player.equipment.weapon?.fireWave) {
      for (let i=-2;i<=2;i++) {
        const a = Math.atan2(mouse.y-player.y,mouse.x-player.x)+i*0.2;
        bullets.push({
          x:player.x,y:player.y,
          dx:Math.cos(a)*5,
          dy:Math.sin(a)*5,
          dmg
        });
      }
    } else {
      bullets.push({
        x:player.x,y:player.y,
        dx:(mouse.x-player.x)*0.05,
        dy:(mouse.y-player.y)*0.05,
        dmg
      });
    }
    player.cooldown=10;
    sfx(500);
  }
  if(player.cooldown>0) player.cooldown-=dt;

  bullets.forEach(b=>{b.x+=b.dx*dt;b.y+=b.dy*dt;});

  enemies.forEach(e=>{
    let dx=player.x-e.x,dy=player.y-e.y;
    let d=Math.hypot(dx,dy)||1;
    e.x+=dx/d*dt;e.y+=dy/d*dt;
  });

  bullets.forEach(b=>enemies.forEach(e=>{
    if(Math.hypot(b.x-e.x,b.y-e.y)<14){
      e.hp-=b.dmg;b.dead=true;
    }
  }));

  enemies = enemies.filter(e=>{
    if(e.hp<=0){
      loot.push({x:e.x,y:e.y,gold:4});
      quests.forEach(q=>!q.finished&&(q.done++));
      return false;
    }
    return true;
  });

  loot.forEach(l=>{
    if(Math.hypot(player.x-l.x,player.y-l.y)<20){
      player.gold+=l.gold;l.pick=true;
      sfx(700);
    }
  });
  loot=loot.filter(l=>!l.pick);

  if(player.x<0){world.x--;spawnRoom();}
  if(player.x>canvas.width){world.x++;spawnRoom();}
  if(player.y<0){world.y--;spawnRoom();}
  if(player.y>canvas.height){world.y++;spawnRoom();}

  mouse.click=false;
}

/* ================= DRAW ================= */
function drawMinimap() {
  ctx.fillStyle="rgba(0,0,0,.6)";
  ctx.fillRect(canvas.width-110,10,100,100);
  for(let k in explored){
    let[x,y]=k.split(",").map(Number);
    ctx.fillStyle=(x===world.x&&y===world.y)?"yellow":"gray";
    ctx.fillRect(canvas.width-60+(x-world.x)*6,60+(y-world.y)*6,4,4);
  }
}

function drawTooltip(x,y,text){
  ctx.fillStyle="black";
  ctx.fillRect(x,y-20,ctx.measureText(text).width+10,18);
  ctx.fillStyle="white";
  ctx.fillText(text,x+5,y-6);
}

function draw() {
  ctx.fillStyle=world.x===0&&world.y===0?"#234":"#111";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // NPCs
  if(world.x===0&&world.y===0){
    ctx.fillStyle="orange";
    ctx.fillRect(blacksmith.x-10,blacksmith.y-20,20,40);
    ctx.fillStyle="purple";
    ctx.fillRect(enchanter.x-10,enchanter.y-20,20,40);
  }

  ctx.fillStyle="red";
  enemies.forEach(e=>ctx.fillRect(e.x-6,e.y-6,12,12));

  ctx.fillStyle="white";
  ctx.fillRect(player.x-4,player.y-4,8,8);

  ctx.fillStyle="orange";
  bullets.forEach(b=>ctx.fillRect(b.x-2,b.y-2,4,4));

  ctx.fillStyle="gold";
  loot.forEach(l=>ctx.fillRect(l.x-4,l.y-4,8,8));

  ctx.fillStyle="red";
  ctx.fillRect(20,20,(player.hp/player.maxHp)*200,8);
  ctx.fillStyle="white";
  ctx.fillText("Gold: "+player.gold,20,50);

  drawMinimap();
}

/* ================= LOOP ================= */
let last=0;
function loop(t){
  const dt=Math.min((t-last)/16.6,2);
  last=t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
music.start();
requestAnimationFrame(loop);
