const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== BUILT-IN COLOURED SKELETON SPRITE =====
const spriteCanvas = document.createElement("canvas");
spriteCanvas.width = 192;
spriteCanvas.height = 144;
const sctx = spriteCanvas.getContext("2d");

// WALK ROW (0)
for(let i=0;i<6;i++){
  let x=i*32;

  // skull
  sctx.fillStyle="#eee";
  sctx.fillRect(x+10,8,12,10);

  // eyes
  sctx.fillStyle="black";
  sctx.fillRect(x+12,10,2,2);
  sctx.fillRect(x+18,10,2,2);

  // body
  sctx.fillStyle="#cfcfcf";
  sctx.fillRect(x+12,18,8,10);

  // legs (step animation)
  sctx.fillRect(x+10+(i%2),28,4,8);
  sctx.fillRect(x+18-(i%2),28,4,8);
}

// ATTACK ROW (1)
for(let i=0;i<6;i++){
  let x=i*32;

  sctx.fillStyle="#eee";
  sctx.fillRect(x+10,8,12,10);

  sctx.fillStyle="#cfcfcf";
  sctx.fillRect(x+12,18,8,10);

  // attack arm (animated)
  sctx.fillStyle="lime";
  sctx.fillRect(x+4,12-i,10,4);
}

// DEATH ROW (2)
for(let i=0;i<6;i++){
  let x=i*32;

  sctx.fillStyle="#888";
  sctx.fillRect(x+10+i*2,28-i*2,16,6);
}

// SETTINGS
const FRAME_W=32, FRAME_H=32;

// ===== GAME =====
let player={x:300,y:250,speed:3,hp:100};
let keys={}, bullets=[], enemies=[];
let boss=null, mouse={x:0,y:0}, gameOver=false;
let bossLevel=1;

// INPUT
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

canvas.addEventListener("mousemove",e=>{
  let r=canvas.getBoundingClientRect();
  mouse.x=e.clientX-r.left;
  mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click",shoot);

// SHOOT
function shoot(){
  let dx=mouse.x-player.x;
  let dy=mouse.y-player.y;
  let d=Math.hypot(dx,dy)||1;

  bullets.push({
    x:player.x+15,
    y:player.y+15,
    dx:dx/d*7,
    dy:dy/d*7
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
spawnEnemies();

function spawnBoss(){
  boss={
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
  if(keys["w"])player.y-=player.speed;
  if(keys["s"])player.y+=player.speed;
  if(keys["a"])player.x-=player.speed;
  if(keys["d"])player.x+=player.speed;

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
    let d=Math.hypot(dx,dy)||1;

    e.frame++;

    if(d<45){
      e.state="attack";
      player.hp-=0.2;
    }else{
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
    let d=Math.hypot(dx,dy)||1;

    boss.x+=dx/d*0.4;

    if(boss.timer>30){
      boss.timer=0;
      bullets.push({
        x:boss.x,
        y:boss.y,
        dx:dx/d*6,
        dy:dy/d*6,
        enemy:true
      });
    }
  }

  // COLLISION
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
      player.hp-=5;
    }
  });

  bullets=bullets.filter(b=>!b.dead);

  enemies=enemies.filter(e=>!(e.state==="dead" && e.frame>40));

  // ✅ FIX: waves always continue
  if(enemies.length===0 && !boss){
    spawnBoss();
  }

  if(boss && boss.hp<=0){
    boss=null;
    bossLevel++;
    spawnEnemies();
  }
}

// DRAW SKELETON
function drawSkeleton(e){

  let frame,row;

  if(e.state==="walk"){
    frame=Math.floor(e.frame/8)%6;
    row=0;
  }else if(e.state==="attack"){
    frame=Math.floor(e.frame/5)%6;
    row=1;
  }else{
    frame=Math.min(Math.floor(e.frame/6),5);
    row=2;
  }

  ctx.drawImage(
    spriteCanvas,
    frame*FRAME_W,row*FRAME_H,
    FRAME_W,FRAME_H,
    e.x-32,e.y-32,64,64
  );
}

// DRAW
function draw(){
  ctx.fillStyle="#0e0e18";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // player
  ctx.fillStyle="purple";
  ctx.fillRect(player.x,player.y,30,30);

  // bullets
  bullets.forEach(b=>{
    ctx.fillStyle=b.enemy?"red":"orange";
    ctx.fillRect(b.x,b.y,6,4);
  });

  enemies.forEach(drawSkeleton);

  // ✅ BIG SKELETON BOSS
  if(boss){
    let f=Math.floor(boss.frame/6)%6;

    ctx.drawImage(
      spriteCanvas,
      f*FRAME_W,0,
      FRAME_W,FRAME_H,
      boss.x-64,boss.y-64,128,128
    );

    ctx.fillStyle="red";
    ctx.fillRect(boss.x-40,boss.y-70,boss.hp*10,6);
  }

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
