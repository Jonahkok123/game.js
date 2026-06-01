const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== LOAD SPRITE =====
const skelly = new Image();
skelly.src = "assets/skeleton.png";

let loaded = false;
skelly.onload = () => loaded = true;

// ===== STATE =====
let state = "menu";

let player = {x:300,y:250,speed:3,hp:100};
let bossLevel = 1;

let keys={}, bullets=[], enemies=[];
let boss=null, mouse={x:0,y:0}, gameOver=false;

// INPUT
document.addEventListener("keydown", e=>keys[e.key]=true);
document.addEventListener("keyup", e=>keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
 let r=canvas.getBoundingClientRect();
 mouse.x=e.clientX-r.left;
 mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click", ()=>{
 if(state==="menu"){ start(); return; }
 if(gameOver){ state="menu"; return; }
 shoot();
});

// START
function start(){
 state="game";
 player.hp=100;
 bullets=[]; enemies=[];
 boss=null; bossLevel=1; gameOver=false;
 spawnEnemies();
}

// SHOOT
function shoot(){
 let dx=mouse.x-player.x;
 let dy=mouse.y-player.y;
 let d=Math.hypot(dx,dy);

 bullets.push({
  x:player.x+20,y:player.y+20,
  dx:dx/d*7,dy:dy/d*7
 });
}

// SPAWN
function spawnEnemies(){
 for(let i=0;i<5;i++){
  enemies.push({
   x:Math.random()*800,
   y:Math.random()*500,
   speed:1,
   frame:0,
   state:"walk",
   dead:false
  });
 }
}

function spawnBoss(){
 boss={
  x:450,y:120,
  hp:5+(bossLevel-1)*4,
  frame:0,
  timer:0
 };
}

// UPDATE
function update(){
 if(state!=="game"||gameOver) return;

 if(keys["w"]) player.y-=player.speed;
 if(keys["s"]) player.y+=player.speed;
 if(keys["a"]) player.x-=player.speed;
 if(keys["d"]) player.x+=player.speed;

 player.x=Math.max(0,Math.min(canvas.width-32,player.x));
 player.y=Math.max(0,Math.min(canvas.height-32,player.y));

 bullets.forEach(b=>{
  b.x+=b.dx;
  b.y+=b.dy;
 });

 // ENEMIES
 enemies.forEach(e=>{
  if(e.dead){
    e.frame++;
    return;
  }

  let dx=player.x-e.x;
  let dy=player.y-e.y;
  let d=Math.hypot(dx,dy);

  e.frame++;

  if(d<50){
    e.state="attack";
    player.hp-=0.3;
  } else {
    e.state="walk";
    e.x+=dx/d*e.speed;
    e.y+=dy/d*e.speed;
  }
 });

 // BOSS
 if(boss){
  boss.frame++;
  boss.timer++;

  let dx=player.x-boss.x;
  let dy=player.y-boss.y;
  let d=Math.hypot(dx,dy);

  boss.x+=dx/d*0.5;

  if(boss.timer>40){
    boss.timer=0;
    bullets.push({
      x:boss.x,y:boss.y,
      dx:dx/d*6,dy:dy/d*6,
      enemy:true
    });
  }
 }

 // COLLISION
 bullets.forEach(b=>{
  enemies.forEach(e=>{
   if(!e.dead && Math.hypot(b.x-e.x,b.y-e.y)<25){
    e.dead=true;
    e.state="dead";
    e.frame=0;
    b.dead=true;
   }
  });

  if(boss && !b.enemy && Math.hypot(b.x-boss.x,b.y-boss.y)<45){
    boss.hp--;
    b.dead=true;
  }

  if(b.enemy && Math.hypot(b.x-player.x,b.y-player.y)<25){
    player.hp-=5;
  }
 });

 bullets=bullets.filter(b=>!b.dead);

 // REMOVE DEAD AFTER ANIMATION
 enemies=enemies.filter(e=>{
  if(e.state==="dead" && e.frame>50) return false;
  return true;
 });

 if(enemies.length===0 && !boss) spawnBoss();

 if(boss && boss.hp<=0){
  boss=null;
  bossLevel++;
  spawnEnemies();
 }

 if(player.hp<=0) gameOver=true;
}

// DRAW SKELETON
function drawSkeleton(e){
 let frame, sx, sy;

 if(e.state==="walk"){
  frame=Math.floor(e.frame/8)%6;
  sy=64;
 }
 else if(e.state==="attack"){
  frame=Math.floor(e.frame/6)%6;
  sy=0;
 }
 else if(e.state==="dead"){
  frame=Math.min(Math.floor(e.frame/6),6);
  sy=256;
 }

 sx=frame*64;

 ctx.drawImage(
  skelly,
  sx,sy,64,64,
  e.x-32,e.y-32,64,64
 );
}

// DRAW
function draw(){
 ctx.fillStyle="#0e0e18";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 // WAIT FOR SPRITE
 if(!loaded){
  ctx.fillStyle="white";
  ctx.fillText("Loading...",350,250);
  return;
 }

 if(state==="menu"){
  ctx.fillStyle="white";
  ctx.font="40px Arial";
  ctx.fillText("Dungeon Game",250,200);
  ctx.fillText("Click to Start",280,260);
  return;
 }

 // PLAYER
 ctx.fillStyle="purple";
 ctx.fillRect(player.x,player.y,30,30);

 // BULLETS
 bullets.forEach(b=>{
  ctx.fillStyle=b.enemy?"red":"orange";
  ctx.fillRect(b.x,b.y,6,4);
 });

 // ENEMIES
 enemies.forEach(drawSkeleton);

 // BOSS
 if(boss){
  let frame=Math.floor(boss.frame/8)%6;
  let sx=frame*64;
  let sy=64;

  ctx.drawImage(
    skelly,
    sx,sy,64,64,
    boss.x-48,boss.y-48,96,96
  );

  ctx.fillStyle="red";
  ctx.fillRect(boss.x-50,boss.y-60,boss.hp*10,6);
 }

 // UI
 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);

 ctx.fillStyle="white";
 ctx.fillText("Boss Level: "+bossLevel,20,45);

 if(gameOver){
  ctx.fillStyle="red";
  ctx.font="40px Arial";
  ctx.fillText("GAME OVER",250,250);
 }
}

// LOOP
function loop(){
 update();
 draw();
 requestAnimationFrame(loop);
}
loop();
