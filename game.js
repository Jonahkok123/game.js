const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== FULLSCREEN =====
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD =====
let loaded = 0;
const TOTAL = 3;

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
let gameState = "menu";
let level = 1;

// ===== PLAYER =====
let player = {
    x: canvas.width/2,
    y: canvas.height/2,
    speed: 3,
    hp: 100,
    mana: 100,
    dir: 1
};

let keys = {};
let enemies = [];
let bullets = [];
let effects = [];
let mouse = {x:0,y:0};

// ===== INPUT =====
document.addEventListener("keydown", e=>{
    keys[e.key] = true;

    if(gameState==="menu" && e.key==="Enter") gameState="playing";
    if(gameState==="dead" && e.key==="r") restart();
});

document.addEventListener("keyup", e=> keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", shoot);

// ===== RESTART =====
function restart(){
    player.hp = 100;
    player.mana = 100;
    level = 1;
    spawn();
    gameState="playing";
}

// ===== SPELLS =====
document.addEventListener("keydown", e=>{
    if(gameState!=="playing") return;

    // ⚡ lightning
    if(e.key==="q" && player.mana>=20){
        player.mana -= 20;

        enemies.forEach(e=>{
            if(Math.hypot(player.x-e.x, player.y-e.y) < 150){
                e.hp -= 3;
                effects.push({x:e.x,y:e.y,type:"light"});
            }
        });
    }

    // 🌀 stun
    if(e.key==="e" && player.mana>=15){
        player.mana -= 15;

        enemies.forEach(e=>{
            if(Math.hypot(player.x-e.x, player.y-e.y) < 120){
                e.stun = 60;
                effects.push({x:e.x,y:e.y,type:"stun"});
            }
        });
    }
});

// ===== SHOOT =====
function shoot(){
    if(gameState!=="playing") return;

    const dx = mouse.x-player.x;
    const dy = mouse.y-player.y;
    const d = Math.hypot(dx,dy)||1;

    bullets.push({
        x:player.x,
        y:player.y,
        dx:dx/d*7,
        dy:dy/d*7
    });
}

// ===== SPAWN =====
let gate = {x:0,y:0};

function spawn(){
    enemies=[];

    let count = 3 + level;

    for(let i=0;i<count;i++){
        enemies.push({
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height,
            hp:1,
            speed:1,
            boss:false
        });
    }

    // ✅ boss every 5 levels
    if(level % 5 === 0){
        enemies.push({
            x:canvas.width/2,
            y:100,
            hp:12,
            speed:0.6,
            boss:true
        });
    }

    // ✅ exit gate
    gate = {
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height
    };
}
spawn();

// ===== UPDATE =====
function update(){

    if(gameState!=="playing") return;

    // ✅ FIX drift (no velocity accumulation)
    let mx=0,my=0;

    if(keys["w"]) my--;
    if(keys["s"]) my++;
    if(keys["a"]) mx--;
    if(keys["d"]) mx++;

    let m = Math.hypot(mx,my)||1;
    mx/=m; my/=m;

    player.x += mx*player.speed;
    player.y += my*player.speed;

    // mana regen
    player.mana = Math.min(100, player.mana + 0.05);

    bullets.forEach(b=>{
        b.x+=b.dx;
        b.y+=b.dy;
    });

    enemies.forEach(e=>{
        if(e.stun>0){
            e.stun--;
            return;
        }

        let dx=player.x-e.x;
        let dy=player.y-e.y;
        let d=Math.hypot(dx,dy)||1;

        e.x+=dx/d*e.speed;
        e.y+=dy/d*e.speed;

        if(Math.hypot(player.x-e.x,player.y-e.y)<30){
            player.hp -= e.boss ? 1 : 0.3;
        }
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.hp--;
                b.dead=true;
            }
        });
    });

    enemies = enemies.filter(e=>e.hp>0);
    bullets = bullets.filter(b=>!b.dead);

    // ✅ NEXT LEVEL GATE
    if(enemies.length===0 && Math.hypot(player.x-gate.x,player.y-gate.y)<30){
        level++;
        spawn();
    }

    if(player.hp<=0){
        gameState="dead";
    }
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(loaded<TOTAL){
        ctx.fillStyle="white";
        ctx.fillText("Loading...",300,300);
        return;
    }

    if(gameState==="menu"){
        ctx.fillStyle="white";
        ctx.fillText("Press ENTER to Start",400,300);
        return;
    }

    // floor
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            ctx.drawImage(tiles,x,y,32,32);
        }
    }

    // gate
    if(enemies.length===0){
        ctx.fillStyle="purple";
        ctx.fillRect(gate.x-10,gate.y-10,20,20);
    }

    // enemies
    enemies.forEach(e=>{
        let w=e.boss?80:28;
        let h=e.boss?80:48;
        ctx.drawImage(skeleton,e.x-w/2,e.y-h/2,w,h);
    });

    // bullets
    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,6.28);
        ctx.fill();
    });

    // effects
    effects.forEach(f=>{
        ctx.fillStyle = f.type==="light"?"yellow":"cyan";
        ctx.beginPath();
        ctx.arc(f.x,f.y,10,0,6.28);
        ctx.fill();
    });

    // player
    ctx.drawImage(wizard,player.x-24,player.y-48,48,48);

    // UI
    ctx.fillStyle="red";
    ctx.fillRect(20,20,player.hp*2,10);

    ctx.fillStyle="blue";
    ctx.fillRect(20,40,player.mana*2,10);

    ctx.fillStyle="white";
    ctx.fillText("Level: "+level,20,70);

    if(gameState==="dead"){
        ctx.fillStyle="red";
        ctx.fillText("YOU DIED - Press R",400,300);
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
