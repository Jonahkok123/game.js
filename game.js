const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let state = "menu";

let player = { x: 300, y: 250, speed: 3, hp: 100 };
let keys = {}, bullets = [], enemies = [], particles = [];
let boss = null;
let mouse = {x:0,y:0};
let gameOver = false;

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
 shoot();
});

// START
function startGame(){
 state="game";
 player.hp=100;
 bullets=[]; enemies=[]; particles=[];
 boss=null; gameOver=false;
 spawnEnemies();
}

// SHOOT MAGIC
function shoot(){
 let dx=mouse.x-player.x;
 let dy=mouse.y-player.y;
 let d=Math.hypot(dx,dy);

 bullets.push({
  x:player.x+20,y:player.y+20,
  dx:dx/d*6, dy:dy/d*6
 });

 // particles ✨
 for(let i=0;i<5;i++){
  particles.push({
   x:player.x+20,y:player.y+20,
   dx:(Math.random()-0.5)*2,
   dy:(Math.random()-0.5)*2,
   life:20
  });
 }
}

// SPAWN
function spawnEnemies(){
 for(let i=0;i<5;i++){
  enemies.push({
   x:Math.random()*800,
   y:Math.random()*500,
   speed:1
  });
 }
}

// SPAWN BOSS
function spawnBoss(){
 boss={
  x:450,y:100,
  hp:200,
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

 player.x=Math.max(0,Math.min(canvas.width-40,player.x));
 player.y=Math.max(0,Math.min(canvas.height-40,player.y));

 bullets.forEach(b=>{
  b.x+=b.dx;
  b.y+=b.dy;
 });

 // particles
 particles.forEach(p=>{
  p.x+=p.dx;
  p.y+=p.dy;
  p.life--;
 });
 particles=particles.filter(p=>p.life>0);

 // enemies
 enemies.forEach(e=>{
  let dx=player.x-e.x, dy=player.y-e.y;
  let d=Math.hypot(dx,dy);
  e.x+=dx/d*e.speed;
  e.y+=dy/d*e.speed;
  if(d<30) player.hp-=0.3;
 });

 // boss attacks ⚡
 if(boss){
  boss.timer++;
  let dx=player.x-boss.x;
  let dy=player.y-boss.y;
  let d=Math.hypot(dx,dy);

  boss.x+=dx/d*0.6;

  if(boss.timer>60){
    boss.timer=0;
    bullets.push({
      x:boss.x,y:boss.y,
      dx:-dx/d*5,dy:-dy/d*5,
      enemy:true
    });
  }
 }

 // collisions
 bullets.forEach(b=>{
  enemies.forEach(e=>{
    if(Math.hypot(b.x-e.x,b.y-e.y)<30){
      e.dead=true; b.dead=true;

      // explosion ✨
      for(let i=0;i<10;i++){
        particles.push({
          x:e.x,y:e.y,
          dx:(Math.random()-0.5)*3,
          dy:(Math.random()-0.5)*3,
          life:30
        });
      }
    }
  });

  if(boss && Math.hypot(b.x-boss.x,b.y-boss.y)<40 && !b.enemy){
    boss.hp-=5;
    b.dead=true;
  }

  if(b.enemy && Math.hypot(b.x-player.x,b.y-player.y)<20){
    player.hp-=5;
  }
 });

 bullets=bullets.filter(b=>!b.dead);
 enemies=enemies.filter(e=>!e.dead);

 // spawn boss
 if(enemies.length===0 && !boss) spawnBoss();

 if(player.hp<=0) gameOver=true;
}

// DRAW WIZARD
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

 ctx.fillStyle="#b366ff";
 ctx.beginPath();
 ctx.arc(x+25,y+20,5,0,6.28);
 ctx.fill();
}

// DRAW SKELETON
function drawSkeleton(e){
 ctx.fillStyle="#ddd";
 ctx.fillRect(e.x-10,e.y-15,20,15);
 ctx.fillRect(e.x-5,e.y,10,20);
}

// DRAW BOSS 💀
function drawBoss(){
 ctx.fillStyle="purple";
 ctx.beginPath();
 ctx.arc(boss.x,boss.y,25,0,6.28);
 ctx.fill();

 ctx.fillStyle="white";
 ctx.fillText("BOSS",boss.x-20,boss.y-30);
}

// DRAW
function draw(){
 ctx.fillStyle="#121220";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 // tiled dungeon
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

  // glow
  ctx.globalAlpha=0.2;
  ctx.beginPath();
  ctx.arc(b.x,b.y,10,0,6.28);
  ctx.fill();
  ctx.globalAlpha=1;
 });

 enemies.forEach(drawSkeleton);

 if(boss) drawBoss();

 // particles ✨
 ctx.fillStyle="violet";
 particles.forEach(p=>{
   ctx.fillRect(p.x,p.y,3,3);
 });

 // HP
 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);

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
