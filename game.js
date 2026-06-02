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

// ===== GAME STATE =====
let gameState = "menu"; // menu, playing, shop, dead

// ===== PLAYER =====
let player = {
    x: canvas.width/2,
    y: canvas.height/2,
    hp: 100,
    maxHp: 100,
    mana: 100,
    damage: 1,
    manaRegen: 0.1,
    speed: 3
};

let level = 1;
let keys={}, bullets=[], enemies=[], enemyBullets=[];
let mouse={x:0,y:0};
let gate={x:0,y:0};

// ===== SAVE =====
function saveGame(){
    localStorage.setItem("save", JSON.stringify({
        level,
        player
    }));
}

function loadGame(){
    let data = localStorage.getItem("save");
    if(data){
        let s = JSON.parse(data);
        level = s.level;
        player = s.player;
    }
}
loadGame();

// ===== INPUT =====
document.addEventListener("keydown", e=>{
    keys[e.key]=true;

    if(gameState==="menu" && e.key==="Enter") gameState="playing";

    if(gameState==="dead" && e.key==="r"){
        player.hp = player.maxHp; // ✅ restart SAME level
        spawn();
        gameState="playing";
    }

    if(gameState==="shop"){
        if(e.key==="1"){ upgrade("hp"); }
        if(e.key==="2"){ upgrade("dmg"); }
        if(e.key==="3"){ upgrade("mana"); }
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
    if(gameState!=="playing") return;

    let dx = mouse.x-player.x;
    let dy = mouse.y-player.y;
    let d = Math.hypot(dx,dy)||1;

    if(player.mana>=5){
        player.mana -= 5;

        bullets.push({
            x:player.x,
            y:player.y,
            dx:dx/d*8,
            dy:dy/d*8
        });
    }
}

// ===== UPGRADE SYSTEM =====
function upgrade(type){

    if(type==="hp"){
        player.maxHp += 20;
        player.hp = player.maxHp;
    }

    if(type==="dmg"){
        player.damage += 0.5;
    }

    if(type==="mana"){
        player.manaRegen += 0.05;
    }

    saveGame();
    spawn();
    gameState="playing";
}

// ===== SPAWN =====
function spawn(){

    enemies=[];
    enemyBullets=[];

    for(let i=0;i<3+level;i++){

        let ranged = Math.random()<0.3;

        enemies.push({
            x:Math.random()*(canvas.width-100)+50,
            y:Math.random()*(canvas.height-100)+50,
            hp:2 + level,
            speed:1,
            ranged,
            cooldown:0
        });
    }

    gate = {
        x:Math.random()*(canvas.width-120)+60,
        y:Math.random()*(canvas.height-120)+60
    };
}

// ===== UPDATE =====
function update(){

    if(gameState!=="playing") return;

    let mx=0,my=0;

    if(keys["w"])my--;
    if(keys["s"])my++;
    if(keys["a"])mx--;
    if(keys["d"])mx++;

    let m = Math.hypot(mx,my)||1;

    player.x += mx/m * player.speed;
    player.y += my/m * player.speed;

    player.x=Math.max(50,Math.min(canvas.width-50,player.x));
    player.y=Math.max(50,Math.min(canvas.height-50,player.y));

    player.mana=Math.min(100, player.mana + player.manaRegen);

    bullets.forEach(b=>{
        b.x+=b.dx;
        b.y+=b.dy;
    });

    enemies.forEach(e=>{

        let dx = player.x-e.x;
        let dy = player.y-e.y;
        let d = Math.hypot(dx,dy)||1;

        e.cooldown--;

        if(e.ranged && e.cooldown<=0){
            e.cooldown=120;

            enemyBullets.push({
                x:e.x,
                y:e.y,
                dx:dx/d*4,
                dy:dy/d*4
            });
        }

        if(!e.ranged){
            e.x += dx/d * e.speed;
            e.y += dy/d * e.speed;
        }

        if(Math.hypot(player.x-e.x,player.y-e.y)<30){
            player.hp -= 0.5;
        }
    });

    enemyBullets.forEach(b=>{
        b.x+=b.dx;
        b.y+=b.dy;

        if(Math.hypot(player.x-b.x,player.y-b.y)<20){
            player.hp -= 2;
        }
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.hp -= player.damage;
                b.dead=true;
            }
        });
    });

    enemies = enemies.filter(e=>e.hp>0);
    bullets = bullets.filter(b=>!b.dead);

    // ✅ LEVEL COMPLETE → SHOP
    if(enemies.length===0){
        gameState="shop";
    }

    // ✅ NEXT LEVEL
    if(gameState==="playing" && enemies.length===0 &&
       Math.hypot(player.x-gate.x,player.y-gate.y)<30){

        level++;
        saveGame();
        spawn();
    }

    if(player.hp<=0){
        gameState="dead";
    }
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(loaded<3){
        ctx.fillText("Loading...",200,200);
        return;
    }

    if(gameState==="menu"){
        ctx.fillText("ENTER TO START",200,200);
        return;
    }

    // floor
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            ctx.drawImage(tiles,x,y,32,32);
        }
    }

    // walls
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,40);
    ctx.fillRect(0,canvas.height-40,canvas.width,40);
    ctx.fillRect(0,0,40,canvas.height);
    ctx.fillRect(canvas.width-40,0,40,canvas.height);

    // enemies
    enemies.forEach(e=>{
        ctx.drawImage(skeleton,e.x-20,e.y-20,40,40);
    });

    // player bullets
    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,6.28);
        ctx.fill();
    });

    // enemy bullets
    enemyBullets.forEach(b=>{
        ctx.fillStyle="red";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,6.28);
        ctx.fill();
    });

    // player
    ctx.drawImage(wizard,player.x-24,player.y-48,48,48);

    // UI
    ctx.fillStyle="red";
    ctx.fillRect(20,20,(player.hp/player.maxHp)*200,10);

    ctx.fillStyle="blue";
    ctx.fillRect(20,40,player.mana*2,10);

    ctx.fillText("Level: "+level,20,70);

    // SHOP UI
    if(gameState==="shop"){
        ctx.fillStyle="white";
        ctx.fillText("CHOOSE UPGRADE:",400,250);
        ctx.fillText("1: +HP",400,280);
        ctx.fillText("2: +Damage",400,310);
        ctx.fillText("3: +Mana Regen",400,340);
    }

    if(gameState==="dead"){
        ctx.fillStyle="red";
        ctx.fillText("YOU DIED - R to retry",300,300);
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
