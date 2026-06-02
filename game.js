 const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== FULLSCREEN =====
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== AUDIO (simple built-in sounds) =====
function play(freq){
    let ctxA = new AudioContext();
    let osc = ctxA.createOscillator();
    let gain = ctxA.createGain();

    osc.connect(gain);
    gain.connect(ctxA.destination);

    osc.frequency.value = freq;
    gain.gain.value = 0.1;

    osc.start();
    osc.stop(ctxA.currentTime + 0.1);
}

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

// ===== GAME =====
let gameState = "menu";
let level = 1;
let currentSpell = "fire";

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
let shake = 0;
let gate = {x:0,y:0};

document.addEventListener("keydown", e=>{
    keys[e.key]=true;

    if(gameState==="menu" && e.key==="Enter") gameState="playing";
    if(gameState==="dead" && e.key==="r") restart();

    if(e.key==="1") currentSpell="fire";
    if(e.key==="2") currentSpell="lightning";
    if(e.key==="3") currentSpell="stun";
});

document.addEventListener("keyup", e=>keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
    let r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

let mouse={x:0,y:0};

canvas.addEventListener("click", cast);

// ===== RESTART =====
function restart(){
    level=1;
    player.hp=100;
    player.mana=100;
    spawn();
    gameState="playing";
}

// ===== CAST SPELL =====
function cast(){

    let dx = mouse.x-player.x;
    let dy = mouse.y-player.y;
    let d = Math.hypot(dx,dy)||1;

    if(currentSpell==="fire" && player.mana>=5){
        player.mana -= 5;
        play(600);

        bullets.push({
            x:player.x,
            y:player.y,
            dx:dx/d*7,
            dy:dy/d*7,
            dmg:1
        });
    }

    if(currentSpell==="lightning" && player.mana>=20){
        player.mana -= 20;
        play(200);
        shake=15;

        enemies.forEach(e=>{
            if(Math.hypot(player.x-e.x,player.y-e.y)<150){
                e.hp-=3;
                effects.push({x:e.x,y:e.y,type:"light",life:15});
            }
        });
    }

    if(currentSpell==="stun" && player.mana>=15){
        player.mana -= 15;
        play(100);

        enemies.forEach(e=>{
            if(Math.hypot(player.x-e.x,player.y-e.y)<120){
                e.stun=60;
                effects.push({x:e.x,y:e.y,type:"stun",life:15});
            }
        });
    }
}

// ===== SPAWN =====
function spawn(){
    enemies=[];

    let count = 3 + level;

    for(let i=0;i<count;i++){
        enemies.push({
            x:Math.random()*canvas.width,
            y:Math.random()*canvas.height,
            hp:1,
            speed:1
        });
    }

    if(level%5===0){
        enemies.push({
            x:canvas.width/2,
            y:120,
            hp:15,
            speed:0.6,
            boss:true
        });
    }

    gate={
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height
    };
}
spawn();

// ===== UPDATE =====
function update(){

    if(gameState!=="playing") return;

    let mx=0,my=0;

    if(keys["w"]) my--;
    if(keys["s"]) my++;
    if(keys["a"]) mx--;
    if(keys["d"]) mx++;

    let m=Math.hypot(mx,my)||1;
    mx/=m; my/=m;

    player.x+=mx*player.speed;
    player.y+=my*player.speed;

    // walls
    player.x=Math.max(50,Math.min(canvas.width-50,player.x));
    player.y=Math.max(50,Math.min(canvas.height-50,player.y));

    // mana regen
    player.mana=Math.min(100,player.mana+0.1);

    bullets.forEach(b=>{
        b.x+=b.dx;
        b.y+=b.dy;
    });

    enemies.forEach(e=>{
        if(e.stun>0){ e.stun--; return; }

        let dx=player.x-e.x;
        let dy=player.y-e.y;
        let d=Math.hypot(dx,dy)||1;

        e.x+=dx/d*e.speed;
        e.y+=dy/d*e.speed;

        if(Math.hypot(player.x-e.x,player.y-e.y)<30){
            player.hp-= e.boss?1:0.3;
            shake=5;
        }
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){

                e.hp-=b.dmg;
                shake=8;
                play(300);

                // knockback
                let dx=e.x-b.x;
                let dy=e.y-b.y;
                let d=Math.hypot(dx,dy)||1;
                e.x+=dx/d*10;
                e.y+=dy/d*10;

                effects.push({x:e.x,y:e.y,type:"hit",life:10});

                b.dead=true;
            }
        });
    });

    enemies=enemies.filter(e=>e.hp>0);
    bullets=bullets.filter(b=>!b.dead);

    if(enemies.length===0 && Math.hypot(player.x-gate.x,player.y-gate.y)<30){
        level++;
        spawn();
    }

    if(player.hp<=0) gameState="dead";
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // screen shake
    ctx.save();
    if(shake>0){
        ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2);
        shake*=0.9;
    }

    if(loaded<3){
        ctx.fillStyle="white";
        ctx.fillText("Loading...",300,300);
        ctx.restore();
        return;
    }

    if(gameState==="menu"){
        ctx.fillStyle="white";
        ctx.fillText("ENTER TO START",400,300);
        ctx.restore();
        return;
    }

    // floor
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            ctx.drawImage(tiles,x,y,32,32);
        }
    }

    // borders
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,40);
    ctx.fillRect(0,canvas.height-40,canvas.width,40);
    ctx.fillRect(0,0,40,canvas.height);
    ctx.fillRect(canvas.width-40,0,40,canvas.height);

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
        let color="yellow";
        if(f.type==="stun") color="cyan";
        if(f.type==="light") color="white";

        ctx.fillStyle=color;
        ctx.beginPath();
        ctx.arc(f.x,f.y,8,0,6.28);
        ctx.fill();

        f.life--;
    });

    effects=effects.filter(f=>f.life>0);

    // player
    ctx.drawImage(wizard,player.x-24,player.y-48,48,48);

    // UI
    ctx.fillStyle="red";
    ctx.fillRect(20,20,player.hp*2,10);

    ctx.fillStyle="blue";
    ctx.fillRect(20,40,player.mana*2,10);

    ctx.fillStyle="white";
    ctx.fillText("Level: "+level,20,70);
    ctx.fillText("Spell: "+currentSpell,20,90);

    if(gameState==="dead"){
        ctx.fillStyle="red";
        ctx.fillText("YOU DIED - R TO RESTART",400,300);
    }

    ctx.restore();
}

// LOOP
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
