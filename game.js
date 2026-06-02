const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD =====
let loaded = 0;
function load(src){
  const img = new Image();
  img.src = src;
  img.onload = () => loaded++;
  return img;
}

const wizard = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== STATE =====
let gameState = "playing";
let currentSpell = "fire";
let level = 1;

// ===== PLAYER =====
let player = {
  x: canvas.width/2,
  y: canvas.height/2,
  hp: 100,
  maxHp: 100,
  mana: 100,
  speed: 3,
  dash: 0,
  dashCooldown: 0
};

// ===== DATA =====
let keys={}, bullets=[], enemies=[], effects=[];
let mouse={x:0,y:0};

// INPUT
document.addEventListener("keydown", e=>{
  keys[e.key]=true;

  if(e.key==="1") currentSpell="fire";
  if(e.key==="2") currentSpell="lightning";
  if(e.key==="3") currentSpell="stun";

  // ✅ DASH (SHIFT)
  if(e.key==="Shift" && player.dashCooldown<=0){
    player.dash = 12;
    player.dashCooldown = 40;
  }
});
document.addEventListener("keyup", e=>keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
  let r=canvas.getBoundingClientRect();
  mouse.x=e.clientX-r.left;
  mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click", shoot);

// ===== SHOOT =====
function shoot(){

  let dx=mouse.x-player.x;
  let dy=mouse.y-player.y;
  let d=Math.hypot(dx,dy)||1;

  // fire
  if(currentSpell==="fire" && player.mana>=5){
    player.mana -= 5;

    bullets.push({
      x:player.x,
      y:player.y,
      dx:dx/d*8,
      dy:dy/d*8,
      dmg:1
    });
  }

  // lightning
  if(currentSpell==="lightning" && player.mana>=20){
    player.mana -= 20;

    let nx=dx/d, ny=dy/d;
    let length=800;

    effects.push({
      type:"beam",
      x:player.x,
      y:player.y,
      dx:nx,
      dy:ny,
      length,
      life:10
    });

    enemies.forEach(e=>{
      let px=e.x-player.x;
      let py=e.y-player.y;
      let proj=px*nx+py*ny;

      if(proj>0 && proj<length){
        let dist=Math.abs(px*ny - py*nx);
        if(dist < 25){
          e.hp -= 3;
        }
      }
    });
  }

  // stun
  if(currentSpell==="stun" && player.mana>=15){
    player.mana -= 15;

    enemies.forEach(e=>{
      if(Math.hypot(player.x-e.x,player.y-e.y)<120){
        e.stun = 60;
      }
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
      hp:2 + level,
      speed:1
    });
  }
}
spawn();

// ===== UPDATE =====
function update(){

  // movement
  let mx=0,my=0;
  if(keys["w"]) my--;
  if(keys["s"]) my++;
  if(keys["a"]) mx--;
  if(keys["d"]) mx++;

  let mag=Math.hypot(mx,my)||1;

  let speed = player.dash > 0 ? 8 : player.speed;

  player.x += (mx/mag)*speed;
  player.y += (my/mag)*speed;

  // dash timers
  if(player.dash>0) player.dash--;
  if(player.dashCooldown>0) player.dashCooldown--;

  // clamp to screen
  player.x=Math.max(50, Math.min(canvas.width-50, player.x));
  player.y=Math.max(50, Math.min(canvas.height-50, player.y));

  // mana regen
  player.mana = Math.min(100, player.mana + 0.1);

  // bullets
  bullets.forEach(b=>{
    b.x+=b.dx;
    b.y+=b.dy;
  });

  // enemies
  enemies.forEach(e=>{
    if(e.stun>0){ e.stun--; return; }

    let dx=player.x-e.x;
    let dy=player.y-e.y;
    let d=Math.hypot(dx,dy)||1;

    e.x += dx/d * e.speed;
    e.y += dy/d * e.speed;

    if(Math.hypot(player.x-e.x,player.y-e.y)<25){
      player.hp -= 0.2;
    }
  });

  // collisions
  bullets.forEach(b=>{
    enemies.forEach(e=>{
      if(Math.hypot(b.x-e.x,b.y-e.y)<20){
        e.hp -= b.dmg;
        b.dead=true;
      }
    });
  });

  bullets = bullets.filter(b=>!b.dead);
  enemies = enemies.filter(e=>e.hp>0);

  // level progression
  if(enemies.length===0){
    level++;
    spawn();
  }

  if(player.hp<=0){
    player.hp = player.maxHp;
    spawn();
  }
}

// ===== DRAW =====
function draw(){

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(loaded<3){
    ctx.fillStyle="white";
    ctx.fillText("Loading...",200,200);
    return;
  }

  // floor
  for(let x=0;x<canvas.width;x+=32){
    for(let y=0;y<canvas.height;y+=32){
      ctx.drawImage(tiles,x,y,32,32);
    }
  }

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

  // beam
  effects.forEach(f=>{
    if(f.type==="beam"){
      ctx.strokeStyle="white";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(f.x,f.y);
      ctx.lineTo(f.x+f.dx*f.length,f.y+f.dy*f.length);
      ctx.stroke();
      f.life--;
    }
  });

  effects = effects.filter(f=>f.life>0);

  // UI
  ctx.fillStyle="red";
  ctx.fillRect(20,20,(player.hp/player.maxHp)*200,10);

  ctx.fillStyle="blue";
  ctx.fillRect(20,40,player.mana*2,10);

  ctx.fillStyle="white";
  ctx.fillText("Level: "+level,20,70);
  ctx.fillText("Spell: "+currentSpell,20,90);
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
