const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD =====
let loaded=0;
function load(src){
  const img = new Image();
  img.src = src;
  img.onload = ()=>loaded++;
  return img;
}

const wizard = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== PLAYER =====
let player = {
  x:canvas.width/2,
  y:canvas.height/2,
  hp:100,
  maxHp:100,
  mana:100,
  speed:3,
  damage:1,
  manaRegen:0.1
};

// ===== SYSTEMS =====
let level=1;
let keys={}, bullets=[], enemies=[], items=[];
let mouse={x:0,y:0};
let showInventory=false;

// 🎒 INVENTORY
let inventory=[];

// ⚔️ EQUIPMENT
let equipment = {
  weapon:null,
  boots:null,
  artifact:null
};

// INPUT
document.addEventListener("keydown", e=>{
  keys[e.key]=true;
  if(e.key==="i") showInventory=!showInventory;
});
document.addEventListener("keyup", e=>keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
  let r=canvas.getBoundingClientRect();
  mouse.x=e.clientX-r.left;
  mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click", clickHandler);

// ===== ITEM GENERATION =====
function createItem(x,y){

  const types=["weapon","boots","artifact"];
  const rarities=["common","rare","epic"];

  let type = types[Math.floor(Math.random()*types.length)];
  let rarityChance = Math.random();

  let rarity="common";
  if(rarityChance>0.7) rarity="rare";
  if(rarityChance>0.9) rarity="epic";

  return {
    x,y,
    type,
    rarity
  };
}

// ===== ITEM POWER =====
function applyItemStats(){

  // RESET BASE
  player.damage = 1;
  player.speed = 3;
  player.manaRegen = 0.1;

  for(let slot in equipment){
    let item = equipment[slot];
    if(!item) continue;

    let mult = 1;
    if(item.rarity==="rare") mult=1.5;
    if(item.rarity==="epic") mult=2;

    if(item.type==="weapon"){
      player.damage += 1 * mult;
    }
    if(item.type==="boots"){
      player.speed += 1 * mult;
    }
    if(item.type==="artifact"){
      player.manaRegen += 0.1 * mult;
    }
  }
}

// ===== CLICK HANDLER =====
function clickHandler(e){

  if(showInventory){
    let y = 150;

    inventory.forEach((item,i)=>{
      if(mouse.x>200 && mouse.x<500 &&
         mouse.y>y+i*30 && mouse.y<y+i*30+25){

        // equip item
        equipment[item.type] = item;
        applyItemStats();
      }
    });
    return;
  }

  // shoot
  let dx=mouse.x-player.x;
  let dy=mouse.y-player.y;
  let d=Math.hypot(dx,dy)||1;

  if(player.mana>=5){
    player.mana-=5;
    bullets.push({
      x:player.x,
      y:player.y,
      dx:dx/d*8,
      dy:dy/d*8,
      dmg:player.damage
    });
  }
}

// ===== SPAWN =====
function spawn(){
  enemies=[];
  for(let i=0;i<3+level;i++){
    enemies.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      hp:2+level,
      speed:1
    });
  }
}
spawn();

// ===== UPDATE =====
function update(){

  let mx=0,my=0;

  if(keys["w"])my--;
  if(keys["s"])my++;
  if(keys["a"])mx--;
  if(keys["d"])mx++;

  let mag=Math.hypot(mx,my)||1;

  player.x += mx/mag*player.speed;
  player.y += my/mag*player.speed;

  player.x=Math.max(50,Math.min(canvas.width-50,player.x));
  player.y=Math.max(50,Math.min(canvas.height-50,player.y));

  player.mana = Math.min(100, player.mana + player.manaRegen);

  // bullets
  bullets.forEach(b=>{
    b.x+=b.dx;
    b.y+=b.dy;
  });

  // enemies
  enemies.forEach(e=>{
    let dx=player.x-e.x;
    let dy=player.y-e.y;
    let d=Math.hypot(dx,dy)||1;

    e.x+=dx/d*e.speed;
    e.y+=dy/d*e.speed;

    if(Math.hypot(player.x-e.x,player.y-e.y)<25){
      player.hp -= 0.2;
    }
  });

  // collisions
  bullets.forEach(b=>{
    enemies.forEach(e=>{
      if(Math.hypot(b.x-e.x,b.y-e.y)<20){
        e.hp-=b.dmg;
        b.dead=true;

        if(e.hp<=0 && Math.random()<0.5){
          items.push(createItem(e.x,e.y));
        }
      }
    });
  });

  // pick up items
  items.forEach(it=>{
    if(Math.hypot(player.x-it.x,player.y-it.y)<20){
      inventory.push(it);
      it.picked=true;
    }
  });

  bullets = bullets.filter(b =>
    !b.dead &&
    b.x>0 && b.x<canvas.width &&
    b.y>0 && b.y<canvas.height
  );

  enemies = enemies.filter(e=>e.hp>0);
  items = items.filter(i=>!i.picked);

  if(enemies.length===0){
    level++;
    spawn();
  }
}

// ===== DRAW =====
function draw(){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(loaded<3){
    ctx.fillText("Loading...",200,200);
    return;
  }

  // floor
  for(let x=0;x<canvas.width;x+=32){
    for(let y=0;y<canvas.height;y+=32){
      ctx.drawImage(tiles,x,y,32,32);
    }
  }

  // items
  items.forEach(it=>{
    ctx.fillStyle = it.rarity==="common"?"white":
                    it.rarity==="rare"?"blue":"purple";

    ctx.beginPath();
    ctx.arc(it.x,it.y,6,0,6.28);
    ctx.fill();
  });

  // player
  ctx.drawImage(wizard,player.x-24,player.y-48,48,48);

  // enemies
  enemies.forEach(e=>{
    ctx.drawImage(skeleton,e.x-20,e.y-20,40,40);
  });

  // bullets
  bullets.forEach(b=>{
    ctx.fillStyle="orange";
    ctx.beginPath();
    ctx.arc(b.x,b.y,4,0,6.28);
    ctx.fill();
  });

  // UI
  ctx.fillStyle="red";
  ctx.fillRect(20,20,(player.hp/player.maxHp)*200,10);

  ctx.fillStyle="blue";
  ctx.fillRect(20,40,player.mana*2,10);

  ctx.fillStyle="white";
  ctx.fillText("Level: "+level,20,70);

  // ===== INVENTORY UI =====
  if(showInventory){

    ctx.fillStyle="black";
    ctx.fillRect(150,80,450,350);

    ctx.fillStyle="white";
    ctx.fillText("INVENTORY (click to equip)",200,120);

    inventory.forEach((item,i)=>{

      let color = item.rarity==="common"?"white":
                  item.rarity==="rare"?"blue":"purple";

      ctx.fillStyle=color;
      ctx.fillText(
        item.type+" ("+item.rarity+")",
        200,
        150 + i*30
      );
    });

    // equipment display
    ctx.fillStyle="yellow";
    ctx.fillText("EQUIPMENT:",400,120);

    Object.keys(equipment).forEach((slot,i)=>{
      let item = equipment[slot];
      ctx.fillText(
        slot + ": " + (item ? item.rarity : "none"),
        400,
        150 + i*30
      );
    });
  }
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
