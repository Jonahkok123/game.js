const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== LOAD SYSTEM =====
let loaded = 0;
const TOTAL = 3;

function load(src){
    const img = new Image();
    img.src = src;
    img.onload = () => loaded++;
    img.onerror = () => console.log("FAILED:", src);
    return img;
}

const wizard = load("assets/wizard.png");
const skeleton = load("assets/skeleton.png");
const tiles = load("assets/tiles.png");

// ===== PLAYER =====
let player = { x: 600, y: 350, speed: 3, dir: 1 };

let keys = {};
let enemies = [];
let bullets = [];
let mouse = {x:0,y:0};

// INPUT
document.addEventListener("keydown", e => keys[e.key]=true);
document.addEventListener("keyup", e => keys[e.key]=false);

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
        x: player.x,
        y: player.y - 10,
        dx: dx/d * 6,
        dy: dy/d * 6
    });
}

// SPAWN
function spawn(){
    enemies = [];
    for(let i=0;i<5;i++){
        enemies.push({
            x: Math.random()*1100+50,
            y: Math.random()*600+50,
            speed: 1
        });
    }
}
spawn();

// UPDATE
function update(){

    let mx=0,my=0;

    if(keys["w"]) my--;
    if(keys["s"]) my++;
    if(keys["a"]){ mx--; player.dir=-1; }
    if(keys["d"]){ mx++; player.dir=1; }

    let m = Math.hypot(mx,my)||1;
    mx/=m;
    my/=m;

    player.x += mx*player.speed;
    player.y += my*player.speed;

    bullets.forEach(b=>{
        b.x += b.dx;
        b.y += b.dy;
    });

    enemies.forEach(e=>{
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let d = Math.hypot(dx,dy)||1;

        e.x += dx/d * e.speed;
        e.y += dy/d * e.speed;
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.dead=true;
                b.dead=true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if(enemies.length===0) spawn();
}

// DRAW FLOOR
function drawMap(){
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            ctx.drawImage(tiles,x,y,32,32);
        }
    }
}

// DRAW PLAYER
function drawPlayer(){
    let w=48,h=48;

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(player.x,player.y+14,14,5,0,0,Math.PI*2);
    ctx.fill();

    if(player.dir===-1){
        ctx.save();
        ctx.scale(-1,1);
        ctx.drawImage(wizard,-player.x-w/2,player.y-h,w,h);
        ctx.restore();
    } else {
        ctx.drawImage(wizard,player.x-w/2,player.y-h,w,h);
    }
}

// DRAW ENEMY
function drawEnemy(e){
    let w=28,h=48;

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(e.x,e.y+14,12,5,0,0,Math.PI*2);
    ctx.fill();

    ctx.drawImage(skeleton,e.x-w/2,e.y-h/2,w,h);
}

// DRAW
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // ✅ FIX: only wait until images are loaded
    if(loaded < TOTAL){
        ctx.fillStyle="white";
        ctx.font="22px Arial";
        ctx.fillText("Loading assets...", 500, 300);
        return;
    }

    drawMap();

    enemies.forEach(drawEnemy);

    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,Math.PI*2);
        ctx.fill();
    });

    drawPlayer();
}

// LOOP
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
