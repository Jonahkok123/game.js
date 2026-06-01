const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== PLAYER =====
let player = { x: 300, y: 250, speed: 3, hp: 100 };

// ===== STATE =====
let keys = {}, bullets = [], enemies = [], boss = null;
let mouse = {x:0,y:0}, gameOver = false, bossLevel = 1;

// INPUT
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e=>{
 let r = canvas.getBoundingClientRect();
 mouse.x = e.clientX - r.left;
 mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", shoot);

// SHOOT
function shoot(){
 let dx = mouse.x - player.x;
 let dy = mouse.y - player.y;
 let d = Math.hypot(dx,dy)||1;

 bullets.push({
   x: player.x+20,
   y: player.y+20,
   dx: dx/d*7,
   dy: dy/d*7
 });
}

// SPAWN
function spawnEnemies(){
 for(let i=0;i<5;i++){
  enemies.push({
    x: Math.random()*800,
    y: Math.random()*500,
    speed: 1,
    frame: 0,
    state: "walk",
    dead: false
  });
 }
}
spawnEnemies();

function spawnBoss(){
 boss = {
   x:400,
   y:120,
   hp:5+(bossLevel-1)*4,
   frame:0,
   timer:0
 };
}

// UPDATE
function update(){

 // movement
 if(keys["w"]) player.y -= player.speed;
 if(keys["s"]) player.y += player.speed;
 if(keys["a"]) player.x -= player.speed;
 if(keys["d"]) player.x += player.speed;

 player.x = Math.max(0,Math.min(canvas.width-40,player.x));
 player.y = Math.max(0,Math.min(canvas.height-64,player.y));

 // bullets
 bullets.forEach(b=>{
   b.x+=b.dx;
   b.y+=b.dy;
 });

 // enemies
 enemies.forEach(e=>{
   if(e.dead){ e.frame++; return; }

   let dx = player.x - e.x;
   let dy = player.y - e.y;
   let d = Math.hypot(dx,dy)||1;

   e.frame++;

   if(d<45){
     e.state="attack";
     player.hp -= 0.2;
   } else {
     e.state="walk";
     e.x += dx/d * e.speed;
     e.y += dy/d * e.speed;
   }
 });

 // boss
 if(boss){
   boss.frame++;
   boss.timer++;

   let dx = player.x - boss.x;
   let dy = player.y - boss.y;
   let d = Math.hypot(dx,dy)||1;

   boss.x += dx/d * 0.4;

   if(boss.timer > 30){
     boss.timer = 0;
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
     if(!e.dead && Math.hypot(b.x-e.x,b.y-e.y)<20){
       e.dead=true;
       e.state="dead";
       e.frame=0;
       b.dead=true;
     }
   });

   if(boss && !b.enemy && Math.hypot(b.x-boss.x,b.y-boss.y)<40){
     boss.hp--;
     b.dead=true;
   }

   if(b.enemy && Math.hypot(b.x-player.x,b.y-player.y)<20){
     player.hp -= 5;
   }
 });

 bullets = bullets.filter(b=>!b.dead);
 enemies = enemies.filter(e=>!(e.state==="dead" && e.frame>40));

 if(enemies.length===0 && !boss) spawnBoss();

 if(boss && boss.hp<=0){
   boss=null;
   bossLevel++;
   spawnEnemies();
 }

 if(player.hp<=0) gameOver=true;
}

// ===== DRAW PLAYER (MOONLIGHTER STYLE WIZARD) =====
function drawPlayer(){

 let x=player.x, y=player.y;

 // shadow
 ctx.fillStyle="rgba(0,0,0,0.4)";
 ctx.beginPath();
 ctx.ellipse(x+20,y+60,16,6,0,0,6.28);
 ctx.fill();

 // robe
 ctx.fillStyle="#1f2a44";
 ctx.fillRect(x+10,y+20,20,40);

 ctx.fillStyle="#2e3f6e";
 ctx.fillRect(x+12,y+25,16,30);

 // gold trim
 ctx.fillStyle="#f2c94c";
 ctx.fillRect(x+18,y+25,3,30);

 // head shadow
 ctx.fillStyle="#111";
 ctx.fillRect(x+14,y+8,12,14);

 // glowing eyes
 ctx.fillStyle="#fff";
 ctx.fillRect(x+17,y+14,2,2);
 ctx.fillRect(x+21,y+14,2,2);

 // hat
 ctx.fillStyle="#1f2a44";
 ctx.beginPath();
 ctx.moveTo(x+5,y+20);
 ctx.lineTo(x+20,y-10);
 ctx.lineTo(x+35,y+20);
 ctx.fill();

 ctx.fillRect(x+5,y+18,30,6);

 // staff
 ctx.fillStyle="#8b5a2b";
 ctx.fillRect(x+2,y+5,4,60);

 // flame glow
 ctx.fillStyle="#ffae00";
 ctx.beginPath();
 ctx.arc(x+4,y+2,6,0,6.28);
 ctx.fill();

 ctx.globalAlpha=0.3;
 ctx.beginPath();
 ctx.arc(x+4,y+2,12,0,6.28);
 ctx.fill();
 ctx.globalAlpha=1;
}

// ===== DRAW ENEMY =====
function drawEnemy(e){

 let x=e.x, y=e.y;

 if(e.state==="dead"){
   ctx.fillStyle="#555";
   ctx.fillRect(x-10,y+20,20,6);
   return;
 }

 // shadow
 ctx.fillStyle="rgba(0,0,0,0.4)";
 ctx.fillRect(x-12,y+35,24,4);

 // skull
 ctx.fillStyle="#eaeaea";
 ctx.fillRect(x-8,y-15,16,12);

 ctx.fillStyle="black";
 ctx.fillRect(x-4,y-12,2,2);
 ctx.fillRect(x+2,y-12,2,2);

 // body
 ctx.fillStyle="#bfbfbf";
 ctx.fillRect(x-5,y,10,20);
}

// ===== DRAW BOSS =====
function drawBoss(){

 let x=boss.x, y=boss.y;

 // shadow
 ctx.fillStyle="rgba(0,0,0,0.5)";
 ctx.fillRect(x-30,y+50,60,6);

 // body
 ctx.fillStyle="#ddd";
 ctx.fillRect(x-20,y-30,40,50);

 // skull
 ctx.fillStyle="#fff";
 ctx.fillRect(x-15,y-50,30,20);

 // HP bar
 ctx.fillStyle="red";
 ctx.fillRect(x-40,y-70,boss.hp*10,6);
}

// ===== DRAW =====
function draw(){

 // dungeon floor
 ctx.fillStyle="#141c2f";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 // tile effect
 ctx.fillStyle="#1c2744";
 for(let x=0;x<canvas.width;x+=40){
  for(let y=0;y<canvas.height;y+=40){
    ctx.fillRect(x,y,38,38);
  }
 }

 drawPlayer();

 bullets.forEach(b=>{
  ctx.fillStyle=b.enemy?"red":"orange";
  ctx.fillRect(b.x,b.y,6,4);
 });

 enemies.forEach(drawEnemy);

 if(boss) drawBoss();

 // HP
 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);

 if(gameOver){
  ctx.fillStyle="red";
  ctx.font="40px Arial";
  ctx.fillText("GAME OVER",260,250);
 }
}

// LOOP
function loop(){
 update();
 draw();
 requestAnimationFrame(loop);
}
loop();
