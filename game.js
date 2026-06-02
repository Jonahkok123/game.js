const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

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

// ===== PLAYER =====
let player = {
    x: 600,
    y: 350,
    speed: 3,
    dir: 1
};

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

// ===== SHOOT =====
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

// ===== SPAWN =====
function spawn(){

    enemies = [];

    // normal enemies
    for(let i=0;i<4;i++){
        enemies.push({
            x: Math.random()*1000+100,
            y: Math.random()*500+100,
            speed: 1,
            hp: 1,
            boss: false
        });
    }

    // ✅ BOSS (big skeleton)
    enemies.push({
        x: 600,
        y: 150,
        speed: 0.6,
        hp: 10,
        boss: true
    });
}
spawn();

// ===== UPDATE =====
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

    // ✅ WALL BOUNDS (BORDER SYSTEM)
    player.x = Math.max(40, Math.min(canvas.width-40, player.x));
    player.y = Math.max(40, Math.min(canvas.height-40, player.y));

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

    // collisions
    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.hp--;
                b.dead=true;

                if(e.hp <= 0){
                    e.dead=true;
                }
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if(enemies.length===0) spawn();
}

// ===== DRAW FLOOR =====
function drawMap(){
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            ctx.drawImage(tiles,x,y,32,32);
        }
    }
}

// ===== DRAW WALLS =====
function drawWalls(){

    ctx.fillStyle = "#1a1a1a";

    // top
    ctx.fillRect(0,0,canvas.width,40);
    // bottom
    ctx.fillRect(0,canvas.height-40,canvas.width,40);
    // left
    ctx.fillRect(0,0,40,canvas.height);
    // right
    ctx.fillRect(canvas.width-40,0,40,canvas.height);
}

// ===== PLAYER =====
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
    }else{
        ctx.drawImage(wizard,player.x-w/2,player.y-h,w,h);
    }
}

// ===== ENEMIES =====
function drawEnemy(e){

    let w = e.boss ? 80 : 28;
    let h = e.boss ? 80 : 48;

    // boss tint
    if(e.boss){
        ctx.fillStyle="rgba(255,0,0,0.3)";
        ctx.beginPath();
        ctx.arc(e.x,e.y,50,0,6.28);
        ctx.fill();
    }

    ctx.drawImage(skeleton,e.x-w/2,e.y-h/2,w,h);

    // HP bar for boss
    if(e.boss){
        ctx.fillStyle="red";
        ctx.fillRect(e.x-40,e.y-60,e.hp*8,6);
    }
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(loaded < TOTAL){
        ctx.fillStyle="white";
        ctx.fillText("Loading...",550,300);
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

    drawWalls(); // ✅ walls drawn last
}

// LOOP
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
``
