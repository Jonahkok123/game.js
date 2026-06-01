const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let state = "menu";

let player = { x: 300, y: 250, speed: 3, hp: 100 };
let bossLevel = 1;

let keys = {}, bullets = [], enemies = [], particles = [];
let boss = null, mouse = {x:0,y:0}, gameOver = false;

// ===== INPUT =====
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e=>{
 let r=canvas.getBoundingClientRect();
 mouse.x=e.clientX-r.left;
 mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click", ()=>{
 if(state==="menu"){ startGame(); return; }
 if(gameOver){ state="menu"; return; }
 castSpell();
});

// ===== START =====
function startGame(){
 state="game";
 player.hp=100;
 player.x=300;
 player.y=250;
 bullets=[]; enemies=[]; particles=[];
 boss=null; gameOver=false;
 bossLevel=1;
 spawnEnemies();
}

// ===== SPELL =====
function castSpell(){
 let dx=mouse.x-player.x;
 let dy=mouse.y-player.y;
 let d=Math.hypot(dx,dy);

 bullets.push({
  x:player.x+20,y:player.y+20,
  dx:dx/d*7,dy:dy/d*7
 });

 // particles
 for(let i=0;i<6;i++){
  particles.push({
   x:player.x+20,y:player.y+20,
   dx:(Math.random()-0.5)*3,
   dy:(Math.random()-0.5)*3,
   life:20
  });
 }
}

// ===== SPAWN =====
function spawnEnemies(){
 for(let i=0;i<5;i++){
   enemies.push({
     x:Math.random()*800,
     y:Math.random()*500,
     speed:1+Math.random()
   });
 }
}

function spawnBoss(){
 boss={
  x:450,y:120,
  hp:5+(bossLevel-1)*4,
  timer:0
 };
}

// ===== UPDATE =====
function update(){
 if(state!=="game"||gameOver) return;

 if(keys["w"]) player.y-=player.speed;
 if(keys["s"]) player.y+=player.speed;
 if(keys["a"]) player.x-=player.speed;
 if(keys["d"]) player.x+=player.speed;

 player.x=Math.max(0,Math.min(canvas.width-40,player.x));
 player.y=Math.max(0,Math.min(canvas.height-40,player.y));

 bullets.forEach(b=>{
  b.x+=b.dx;
  b.y+=b.dy;
 });

 particles.forEach(p=>{
  p.x+=p.dx;
  p.y+=p.dy;
  p.life--;
 });
 particles=particles.filter(p=>p.life>0);

 // enemies
 enemies.forEach(e=>{
  let dx=player.x-e.x,dy=player.y-e.y;
  let d=Math.hypot(dx,dy);
  e.x+=dx/d*e.speed;
  e.y+=dy/d*e.speed;
  if(d<35) player.hp-=0.3;
 });

 // boss
 if(boss){
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

 // collisions
 bullets.forEach(b=>{
  enemies.forEach(e=>{
    if(Math.hypot(b.x-e.x,b.y-e.y)<35){
      e.dead=true;
      b.dead=true;

      // explosion
      for(let i=0;i<10;i++){
        particles.push({
         x:e.x,y:e.y,
         dx:(Math.random()-0.5)*4,
         dy:(Math.random()-0.5)*4,
         life:30
        });
      }
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
 enemies=enemies.filter(e=>!e.dead);

 if(enemies.length===0 && !boss) spawnBoss();

 if(boss && boss.hp<=0){
  boss=null;
  bossLevel++;
  spawnEnemies();
 }

 if(player.hp<=0) gameOver=true;
}

// ===== DRAW PLAYER =====
function drawPlayer(){
 let x=player.x,y=player.y;

 // shadow
 ctx.fillStyle="rgba(0,0,0,0.4)";
 ctx.beginPath();
 ctx.ellipse(x+20,y+35,12,6,0,0,6.28);
 ctx.fill();

 ctx.fillStyle="#3d1d70";
 ctx.fillRect(x+10,y+14,20,22);

 ctx.fillStyle="#6a35c0";
 ctx.fillRect(x+12,y+16,16,18);

 ctx.fillStyle="#ffe0bd";
 ctx.fillRect(x+14,y+6,12,10);

 ctx.fillStyle="#8c4fff";
 ctx.beginPath();
 ctx.moveTo(x+4,y+16);
 ctx.lineTo(x+20,y-10);
 ctx.lineTo(x+36,y+16);
 ctx.fill();

 ctx.fillStyle="#b366ff";
 ctx.beginPath();
 ctx.arc(x+32,y+18,5,0,6.28);
 ctx.fill();

 ctx.globalAlpha=0.25;
 ctx.beginPath();
 ctx.arc(x+32,y+18,14,0,6.28);
 ctx.fill();
 ctx.globalAlpha=1;
}

// ===== DRAW ENEMY =====
function drawSkeleton(e){

 // glow
 ctx.globalAlpha=0.2;
 ctx.fillStyle="white";
 ctx.fillRect(e.x-18,e.y-20,36,40);
 ctx.globalAlpha=1;

 ctx.fillStyle="#e0e0e0";
 ctx.fillRect(e.x-8,e.y-15,16,12);

 ctx.fillStyle="black";
 ctx.fillRect(e.x-4,e.y-12,2,2);
 ctx.fillRect(e.x+2,e.y-12,2,2);

 ctx.fillStyle="#cfcfcf";
 ctx.fillRect(e.x-5,e.y,10,18);
}

// ===== DRAW BOSS =====
function drawBoss(){
 ctx.fillStyle="#9900ff";
 ctx.beginPath();
 ctx.arc(boss.x,boss.y,30,0,6.28);
 ctx.fill();

 // glow
 ctx.globalAlpha=0.2;
 ctx.beginPath();
 ctx.arc(boss.x,boss.y,50,0,6.28);
 ctx.fill();
 ctx.globalAlpha=1;

 // hp bar
 ctx.fillStyle="red";
 ctx.fillRect(boss.x-30,boss.y-50,boss.hp*10,6);
}

// ===== DRAW =====
function draw(){

 // dark dungeon
 ctx.fillStyle="#0d0d18";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 // tiled floor
 ctx.fillStyle="#1c1c2b";
 for(let x=0;x<canvas.width;x+=40){
  for(let y=0;y<canvas.height;y+=40){
    ctx.fillRect(x,y,38,38);
  }
 }

 if(state==="menu"){
  ctx.fillStyle="white";
  ctx.font="40px Arial";
  ctx.fillText("Dungeon Game",250,200);
  ctx.font="20px Arial";
  ctx.fillText("Click to Start",340,260);
  return;
 }

 drawPlayer();

 bullets.forEach(b=>{
  ctx.fillStyle=b.enemy?"red":"orange";
  ctx.beginPath();
  ctx.arc(b.x,b.y,5,0,6.28);
  ctx.fill();

  ctx.globalAlpha=0.2;
  ctx.beginPath();
  ctx.arc(b.x,b.y,12,0,6.28);
  ctx.fill();
  ctx.globalAlpha=1;
 });

 enemies.forEach(drawSkeleton);

 if(boss) drawBoss();

 // particles
 ctx.fillStyle="violet";
 particles.forEach(p=>{
   ctx.fillRect(p.x,p.y,3,3);
 });

 // hp
 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);

 ctx.fillStyle="white";
 ctx.fillText("Boss Level: "+bossLevel,20,45);

 if(gameOver){
  ctx.fillStyle="red";
  ctx.font="40px Arial";
  ctx.fillText("GAME OVER",280,260);
 }
}

// LOOP
function loop(){
 update();
 draw();
 requestAnimationFrame(loop);
}
loop();
