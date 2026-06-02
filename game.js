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

// ===== GAME =====
let level = 1;
let gameState = "menu";
let currentSpell = "fire";

let player = {
    x: canvas.width/2,
    y: canvas.height/2,
    hp: 100,
    mana: 100,
    speed: 3
};

let keys={}, bullets=[], bossBullets=[], enemies=[], effects=[];
let mouse={x:0,y:0}, gate={x:0,y:0}, shake=0;

// INPUT
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
    let r=canvas.getBoundingClientRect();
    mouse.x=e.clientX-r.left;
    mouse.y=e.clientY-r.top;
});

canvas.addEventListener("click", cast);

// ===== RESTART =====
function restart(){
    level=1;
    player.hp=100;
    player.mana=100;
    spawn();
    gameState="playing";
}

// ===== SPELL =====
function cast(){

    let dx=mouse.x-player.x;
    let dy=mouse.y-player.y;
    let d=Math.hypot(dx,dy)||1;

    // fire
    if(currentSpell==="fire" && player.mana>=5){
        player.mana-=5;

        bullets.push({
            x:player.x,y:player.y,
            dx:dx/d*7,dy:dy/d*7,
            dmg:1
        });
    }

    // lightning beam
    if(currentSpell==="lightning" && player.mana>=20){
        player.mana-=20;
        shake=15;

        let nx=dx/d, ny=dy/d;
        let length=800;

        effects.push({x:player.x,y:player.y,dx:nx,dy:ny,length,type:"beam",life:10});

        enemies.forEach(e=>{
            let px=e.x-player.x;
            let py=e.y-player.y;

            let proj=px*nx+py*ny;

            if(proj>0 && proj<length){
                let dist=Math.abs(px*ny - py*nx);

                if(dist < (e.boss?70:20)){
                    e.hp-=4;
                }
            }
        });
    }

    // stun
    if(currentSpell==="stun" && player.mana>=15){
        player.mana-=15;

        enemies.forEach(e=>{
            if(Math.hypot(player.x-e.x,player.y-e.y)<120){
                e.stun=60;
            }
        });
    }
}

// ===== SPAWN =====
function spawn(){
    enemies=[];

    for(let i=0;i<3+level;i++){
        enemies.push({
            x:Math.random()*(canvas.width-100)+50,
            y:Math.random()*(canvas.height-100)+50,
            hp:1,
            speed:1
        });
    }

    if(level%5===0){

        enemies.push({
            x:canvas.width/2,
            y:120,
            hp:30,
            speed:0.5,
            boss:true,
            cooldown:0,
            phase:1
        });
    }

    gate={
        x:Math.random()*(canvas.width-120)+60,
        y:Math.random()*(canvas.height-120)+60
    };
}
spawn();

// ===== UPDATE =====
function update(){

    if(gameState!=="playing") return;

    // movement
    let mx=0,my=0;
    if(keys["w"])my--;
    if(keys["s"])my++;
    if(keys["a"])mx--;
    if(keys["d"])mx++;

    let m=Math.hypot(mx,my)||1;
    player.x+=mx/m*player.speed;
    player.y+=my/m*player.speed;

    player.x=Math.max(50,Math.min(canvas.width-50,player.x));
    player.y=Math.max(50,Math.min(canvas.height-50,player.y));

    player.mana=Math.min(100,player.mana+0.08);

    bullets.forEach(b=>{b.x+=b.dx; b.y+=b.dy;});

    // ===== ENEMIES =====
    enemies.forEach(e=>{

        if(e.stun>0){e.stun--;return;}

        let dx=player.x-e.x;
        let dy=player.y-e.y;
        let d=Math.hypot(dx,dy)||1;

        e.x+=dx/d*e.speed;
        e.y+=dy/d*e.speed;

        if(e.boss){

            // PHASE SWITCH
            if(e.hp<20) e.phase=2;
            if(e.hp<10) e.phase=3;

            e.cooldown--;

            // 🔴 AIMED SHOT
            if(e.cooldown<=0){
                if(e.phase===1){
                    e.cooldown=80;
                    bossBullets.push({x:e.x,y:e.y,dx:dx/d*4,dy:dy/d*4});
                }

                if(e.phase===2){
                    e.cooldown=50;

                    // spread shot
                    for(let i=-1;i<=1;i++){
                        let angle=Math.atan2(dy,dx)+i*0.2;
                        bossBullets.push({
                            x:e.x,y:e.y,
                            dx:Math.cos(angle)*4,
                            dy:Math.sin(angle)*4
                        });
                    }
                }

                if(e.phase===3){
                    e.cooldown=40;

                    // radial burst
                    for(let i=0;i<8;i++){
                        let angle=i*(Math.PI*2/8);
                        bossBullets.push({
                            x:e.x,y:e.y,
                            dx:Math.cos(angle)*4,
                            dy:Math.sin(angle)*4
                        });
                    }
                }
            }

            // dash
            if(Math.random()<0.01*e.phase){
                e.x+=dx/d*150;
                e.y+=dy/d*150;
                shake=12;
            }
        }

        if(Math.hypot(player.x-e.x,player.y-e.y)<30){
            player.hp-= e.boss?1:0.3;
        }
    });

    // boss bullets
    bossBullets.forEach(b=>{
        b.x+=b.dx;
        b.y+=b.dy;

        if(Math.hypot(player.x-b.x,player.y-b.y)<20){
            player.hp-=5;
            b.dead=true;
        }
    });

    bossBullets=bossBullets.filter(b=>!b.dead);

    // player bullets
    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<(e.boss?60:20)){
                e.hp-=b.dmg;
                b.dead=true;
                shake=8;
            }
        });
    });

    bullets=bullets.filter(b=>!b.dead);
    enemies=enemies.filter(e=>e.hp>0);

    // NEXT LEVEL
    if(enemies.length===0 && Math.hypot(player.x-gate.x,player.y-gate.y)<30){
        level++;
        spawn();
    }

    if(player.hp<=0) gameState="dead";
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.save();
    if(shake>0){
        ctx.translate(Math.random()*shake-shake/2,Math.random()*shake-shake/2);
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

    // walls
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

    // boss bullets
    bossBullets.forEach(b=>{
        ctx.fillStyle="red";
        ctx.beginPath();
        ctx.arc(b.x,b.y,5,0,6.28);
        ctx.fill();
    });

    // player bullets
    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,6.28);
        ctx.fill();
    });

    // beam
    effects.forEach(f=>{
        if(f.type==="beam"){
            ctx.strokeStyle="white";
            ctx.lineWidth=4;
            ctx.beginPath();
            ctx.moveTo(f.x,f.y);
            ctx.lineTo(f.x+f.dx*f.length,f.y+f.dy*f.length);
            ctx.stroke();

            f.life--;
        }
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
        ctx.fillText("YOU DIED - R",400,300);
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
``
