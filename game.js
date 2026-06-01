const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== TILEMAP =====
const TILE = 40;

const map = [
 "####################",
 "#.................#",
 "#...##.....##.....#",
 "#.................#",
 "#.....#####.......#",
 "#.................#",
 "#.................#",
 "#.................#",
 "#.................#",
 "####################"
];

// ===== PLAYER =====
let player = {
 x: 400,
 y: 260,
 speed: 3,
 hp: 100,
 dir: 1,
 attacking: false,
 attackTimer: 0
};

// ===== STATE =====
let keys = {};
let enemies = [];
let damageNumbers = [];

document.addEventListener("keydown", e => keys[e.key]=true);
document.addEventListener("keyup", e => keys[e.key]=false);

// ===== SPAWN ENEMIES =====
function spawn(){
 for(let i=0;i<6;i++){
  enemies.push({
    x: Math.random()*700+50,
    y: Math.random()*400+50,
    hp: 3,
    hitTimer: 0
  });
 }
}
spawn();

// ===== ATTACK =====
canvas.addEventListener("click", ()=>{
 player.attacking = true;
 player.attackTimer = 15;
});

// ===== UPDATE =====
function update(){

 // movement
 let dx=0, dy=0;
 if(keys["w"]) dy=-1;
 if(keys["s"]) dy=1;
 if(keys["a"]){ dx=-1; player.dir=-1; }
 if(keys["d"]){ dx=1; player.dir=1; }

 player.x += dx*player.speed;
 player.y += dy*player.speed;

 // attack timer
 if(player.attackTimer>0){
  player.attackTimer--;
 } else {
  player.attacking=false;
 }

 // enemies
 enemies.forEach(e=>{
   let dx = player.x - e.x;
   let dy = player.y - e.y;
   let d = Math.hypot(dx,dy)||1;

   e.x += dx/d * 1.2;
   e.y += dy/d * 1.2;

   // take damage
   if(player.attacking && Math.hypot(player.x-e.x,player.y-e.y)<40){
      if(e.hitTimer<=0){
        e.hp--;
        e.hitTimer=20;

        damageNumbers.push({
          x:e.x,
          y:e.y,
          value: Math.floor(Math.random()*20+10),
          life:40
        });
      }
   }

   if(e.hitTimer>0) e.hitTimer--;
 });

 enemies = enemies.filter(e=>e.hp>0);
 if(enemies.length===0) spawn();

 // damage numbers animation
 damageNumbers.forEach(d=>{
   d.y -= 1;
   d.life--;
 });
 damageNumbers = damageNumbers.filter(d=>d.life>0);
}

// ===== DRAW TILEMAP =====
function drawMap(){

 for(let y=0;y<map.length;y++){
   for(let x=0;x<map[y].length;x++){

     let tile = map[y][x];

     if(tile==="#"){
       // wall
       ctx.fillStyle="#2b2e3b";
       ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
     }else{
       // floor (moonlighter tone)
       ctx.fillStyle="#2d4f4f";
       ctx.fillRect(x*TILE,y*TILE,TILE,TILE);

       // variation
       if((x+y)%3===0){
         ctx.fillStyle="#355f5f";
         ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
       }
     }
   }
 }
}

// ===== SHADOW =====
function shadow(x,y){
 ctx.fillStyle="rgba(0,0,0,0.4)";
 ctx.beginPath();
 ctx.ellipse(x,y,18,6,0,0,6.28);
 ctx.fill();
}

// ===== PLAYER DRAW =====
function drawPlayer(){

 shadow(player.x,player.y+16);

 // body
 ctx.fillStyle="#c8a97e";
 ctx.fillRect(player.x-10,player.y-12,20,20);

 // head
 ctx.fillStyle="#fff";
 ctx.fillRect(player.x-6,player.y-20,12,10);

 // sword attack
 if(player.attacking){
   ctx.fillStyle="white";
   ctx.fillRect(player.x + player.dir*15, player.y-5, 12,4);
 }
}

// ===== ENEMY DRAW =====
function drawEnemy(e){

 shadow(e.x,e.y+10);

 ctx.fillStyle = e.hitTimer>0 ? "red" : "#7ed7c1";
 ctx.fillRect(e.x-8,e.y-10,16,20);
}

// ===== DAMAGE NUMBERS =====
function drawDamage(){
 ctx.fillStyle="red";
 ctx.font="16px Arial";

 damageNumbers.forEach(d=>{
   ctx.fillText(d.value, d.x, d.y);
 });
}

// ===== DRAW =====
function draw(){

 ctx.fillStyle="#0f1c1c";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 drawMap();

 enemies.forEach(drawEnemy);
 drawPlayer();

 drawDamage();

 // HP
 ctx.fillStyle="red";
 ctx.fillRect(20,20,player.hp*2,10);
}

// LOOP
function loop(){
 update();
 draw();
 requestAnimationFrame(loop);
}
loop();
