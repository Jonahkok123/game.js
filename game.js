const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let state = "menu";

let player = { x: 300, y: 250, speed: 3, hp: 100 };

// ✅ NEW: boss progression
let bossLevel = 1;

let keys = {}, bullets = [], enemies = [], particles = [];
let boss = null, mouse = {x:0,y:0}, gameOver = false;

// INPUT
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

function startGame(){
 state="game";
 player.hp=100;
 bullets=[]; enemies=[]; particles=[];
 boss=null; gameOver=false;

 bossLevel = 1; // reset scaling

 spawnEnemies();
}

// SHOOT
function castSpell(){
 let dx=mouse.x-player.x;
 let dy=mouse.y-player.y;
 let d=Math.hypot(dx,dy);

 bullets.push({
  x:player.x+20,y:player.y+20,
  dx:dx/d*7,dy:dy/d*7
 });
}

// ENEMIES
function spawnEnemies(){
 for(let i=0;i<6;i++){
   enemies.push({
     x:Math.random()*800,
     y:Math.random()*500,
     speed:1+Math.random()
   });
 }
}

// ✅ FIXED BOSS SPAWN
function spawnBoss(){
 boss = {
  x:450,
  y:120,
  hp: 5 + (bossLevel - 1) * 4, // ✅ scaling health
  timer:0
 };
}

// UPDATE
function update(){
 if(state!=="game"||gameOver) return;

 // movement
 if(keys["w"]) player.y-=player.speed;
 if(keys["s"]) player.y+=player.speed;
 if(keys["a"]) player.x-=player.speed;
 if(keys["d"]) player.x+=player.speed;

 player.x=Math.max(0,Math.min(canvas.width-40,player.x));
 player.y=Math.max(0,Math.min(canvas.height-40,player.y));

 // bullets
 bullets.forEach(b=>{
  b.x+=b.dx;
  b.y+=b.dy;
 });

 // enemies follow
 enemies.forEach(e=>{
  let dx=player.x-e.x,dy=player.y-e.y;
  let d=Math.hypot(dx,dy);
  e.x+=dx/d*e.speed;
  e.y+=dy/d*e.speed;
  if(d<35) player.hp-=0.3;
 });

 // ✅ BOSS LOGIC (SMART AIMING)
 if(boss){
  boss.timer++;

  let dx = player.x - boss.x;
  let dy = player.y - boss.y;
  let d = Math.hypot(dx, dy);

  // slow movement
  boss.x += dx/d * 0.6;

  // ✅ GOOD AIM SHOTS
  if(boss.timer > 40){
    boss.timer = 0;

    bullets.push({
      x: boss.x,
      y: boss.y,
      dx: dx/d * 6,  // ✅ accurate aim
      dy: dy/d * 6,
      enemy: true
    });
  }
 }

 // collisions
 bullets.forEach(b=>{
  enemies.forEach(e=>{
    if(Math.hypot(b.x-e.x,b.y-e.y)<35){
      e.dead=true;
      b.dead=true;
    }
  });

  // ✅ boss damage
  if(boss && !b.enemy && Math.hypot(b.x-boss.x,b.y-boss.y)<45){
    boss.hp--;
    b.dead=true;
  }

  // ✅ player hit
  if(b.enemy && Math.hypot(b.x-player.x,b.y-player.y)<25){
    player.hp-=5;
  }
 });

 bullets=bullets.filter(b=>!b.dead);
 enemies=enemies.filter(e=>!e.dead);

 // ✅ next phase logic
 if(enemies.length===0 && !boss){
   spawnBoss();
 }

 // ✅ BOSS DEFEATED → NEXT LEVEL
 if(boss && boss.hp <= 0){
   boss = null;
   bossLevel++; // ⬅ increases difficulty
   spawnEnemies();
 }

 if(player.hp<=0) gameOver=true;
}

// DRAW PLAYER
function drawPlayer(){
 let x=player.x,y=player.y;

 ctx.fillStyle="#4b0082";
 ctx.fillRect(x+10,y+15,20,20);

 ctx.fillStyle="#ffe0bd";
 ctx.fillRect(x+14,y+6,12,10);

 ctx.fillStyle="#7f00ff";
 ctx.beginPath();
 ctx.moveTo(x+5,y+15);
 ctx.lineTo(x+20,y-8);
 ctx.lineTo(x+35,y+15);
 ctx.fill();
}

// DRAW ENEMY
function drawSkeleton(e){
 ctx.fillStyle="#ddd";
 ctx.fillRect(e.x-10,e.y-15,20,15);
 ctx.fillRect(e.x-5,e.y,10,20);
}

// ✅ DRAW BOSS WITH HP
function drawBoss(){
 ctx.fillStyle="#9900ff";
 ctx.beginPath();
 ctx.arc(boss.x,boss.y,30,0,6.28);
 ctx.fill();

 // boss hp bar
 ctx.fillStyle="red";
 ctx.fillRect(boss.x-30,boss.y-50,boss.hp*10,6);
}

// DRAW
function draw(){
 ctx.fillStyle="#121220";
 ctx.fillRect(0,0,canvas.width,canvas.height);

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
 });

 enemies.forEach(drawSkeleton);

 if(boss) drawBoss();

 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);

 ctx.fillStyle="white";
 ctx.fillText("Boss Level: " + bossLevel, 20, 50);

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
``
