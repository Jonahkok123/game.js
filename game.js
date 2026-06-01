const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== GAME STATE =====
let player = { x:300, y:250, speed:3, hp:100 };

let keys={}, bullets=[], enemies=[];
let mouse={x:0,y:0};

// ===== INPUT =====
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

canvas.addEventListener("mousemove",e=>{
 let r=canvas.getBoundingClientRect();
 mouse.x=e.clientX-r.left;
 mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click",shoot);

// ===== SHOOT =====
function shoot(){
 let dx=mouse.x-player.x;
 let dy=mouse.y-player.y;
 let d=Math.hypot(dx,dy)||1;

 bullets.push({
  x:player.x+20,
  y:player.y+20,
  dx:dx/d*7,
  dy:dy/d*7
 });
}

// ===== SPAWN =====
function spawn(){
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
spawn();

// ===== UPDATE =====
function update(){

 if(keys["w"])player.y-=player.speed;
 if(keys["s"])player.y+=player.speed;
 if(keys["a"])player.x-=player.speed;
 if(keys["d"])player.x+=player.speed;

 player.x=Math.max(0,Math.min(canvas.width-40,player.x));
 player.y=Math.max(0,Math.min(canvas.height-64,player.y));

 bullets.forEach(b=>{
  b.x+=b.dx;
  b.y+=b.dy;
 });

 enemies.forEach(e=>{
  if(e.dead){ e.frame++; return; }

  let dx=player.x-e.x;
  let dy=player.y-e.y;
  let d=Math.hypot(dx,dy)||1;

  e.frame++;

  if(d<50){
    e.state="attack";
    player.hp-=0.2;
  }else{
    e.state="walk";
    e.x+=dx/d*e.speed;
    e.y+=dy/d*e.speed;
  }
 });

 bullets.forEach(b=>{
  enemies.forEach(e=>{
    if(!e.dead && Math.hypot(b.x-e.x,b.y-e.y)<20){
      e.dead=true;
      e.frame=0;
      e.state="dead";
      b.dead=true;
    }
  });
 });

 bullets = bullets.filter(b=>!b.dead);
 enemies = enemies.filter(e=>!(e.state==="dead" && e.frame>40));

 if(enemies.length===0) spawn();
}

// ===== DRAW PLAYER (YOUR WIZARD STYLE) =====
function drawPlayer(){

 let x=player.x;
 let y=player.y;

 // shadow
 ctx.fillStyle="rgba(0,0,0,0.4)";
 ctx.beginPath();
 ctx.ellipse(x+20,y+60,15,6,0,0,6.28);
 ctx.fill();

 // robe base
 ctx.fillStyle="#2c3e70";
 ctx.fillRect(x+8,y+20,24,40);

 // robe highlights
 ctx.fillStyle="#3f5aa9";
 ctx.fillRect(x+10,y+25,20,30);

 // gold trim
 ctx.fillStyle="#f2c94c";
 ctx.fillRect(x+18,y+25,3,30);

 // head (hidden under hood)
 ctx.fillStyle="#1a1a1a";
 ctx.fillRect(x+14,y+8,12,12);

 // eyes glow
 ctx.fillStyle="white";
 ctx.fillRect(x+17,y+12,2,2);
 ctx.fillRect(x+21,y+12,2,2);

 // hat
 ctx.fillStyle="#2c3e70";
 ctx.beginPath();
 ctx.moveTo(x+5,y+20);
 ctx.lineTo(x+20,y-5);
 ctx.lineTo(x+35,y+20);
 ctx.fill();

 // hat brim
 ctx.fillRect(x+5,y+18,30,5);

 // staff
 ctx.fillStyle="#8b5a2b";
 ctx.fillRect(x+2,y+10,4,50);

 // fire 🔥
 ctx.fillStyle="orange";
 ctx.beginPath();
 ctx.arc(x+4,y+5,6,0,6.28);
 ctx.fill();

 ctx.globalAlpha=0.3;
 ctx.beginPath();
 ctx.arc(x+4,y+5,12,0,6.28);
 ctx.fill();
 ctx.globalAlpha=1;
}

// ===== DRAW ENEMY =====
function drawEnemy(e){

 let x=e.x, y=e.y;

 if(e.state==="dead"){
   ctx.fillStyle="#666";
   ctx.fillRect(x-10,y+20,20,8);
   return;
 }

 // skull
 ctx.fillStyle="#eee";
 ctx.fillRect(x-8,y-15,16,12);

 ctx.fillStyle="black";
 ctx.fillRect(x-4,y-12,2,2);
 ctx.fillRect(x+2,y-12,2,2);

 // body
 ctx.fillStyle="#ccc";
 ctx.fillRect(x-5,y,10,20);
}

// ===== DRAW =====
function draw(){
 ctx.fillStyle="#0e0e18";
 ctx.fillRect(0,0,canvas.width,canvas.height);

 drawPlayer();

 bullets.forEach(b=>{
  ctx.fillStyle="orange";
  ctx.fillRect(b.x,b.y,6,4);
 });

 enemies.forEach(drawEnemy);

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
