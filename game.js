const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== LOAD IMAGES =====
const wizard = new Image();
wizard.src = "assets/wizard.png";

const skeleton = new Image();
skeleton.src = "assets/skeleton.png";

const tiles = new Image();
tiles.src = "assets/tiles.png";

// ===== LOAD CHECK =====
let loaded = 0;
function check(){ loaded++; }

wizard.onload = check;
skeleton.onload = check;
tiles.onload = check;

// ===== PLAYER =====
let player = {
    x: 600,
    y: 350,
    speed: 3,
    dir: 1
};

// ===== STATE =====
let keys = {};
let enemies = [];
let bullets = [];
let mouse = {x:0,y:0};

// INPUT
document.addEventListener("keydown", e => keys[e.key]=true);
document.addEventListener("keyup", e => keys[e.key]=false);

canvas.addEventListener("mousemove", e=>{
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

canvas.addEventListener("click", shoot);

// ===== SHOOT =====
function shoot(){
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const d = Math.hypot(dx,dy)||1;

    bullets.push({
        x: player.x,
        y: player.y - 20, // from hands
        dx: dx/d * 7,
        dy: dy/d * 7
    });
}

// ===== SPAWN =====
function spawn(){
    enemies = [];
    for(let i=0;i<5;i++){
        enemies.push({
            x: Math.random()*1100 + 50,
            y: Math.random()*600 + 50,
            speed: 1
        });
    }
}
spawn();

// ===== UPDATE =====
function update(){

    if(keys["w"]) player.y -= player.speed;
    if(keys["s"]) player.y += player.speed;
    if(keys["a"]){ player.x -= player.speed; player.dir=-1; }
    if(keys["d"]){ player.x += player.speed; player.dir=1; }

    // bounds
    player.x = Math.max(32, Math.min(canvas.width-32, player.x));
    player.y = Math.max(32, Math.min(canvas.height-32, player.y));

    bullets.forEach(b=>{
        b.x += b.dx;
        b.y += b.dy;
    });

    enemies.forEach(e=>{
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const d = Math.hypot(dx,dy)||1;

        e.x += dx/d * e.speed;
        e.y += dy/d * e.speed;
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y) < 20){
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if(enemies.length === 0) spawn();
}

// ===== DRAW FLOOR =====
function drawMap(){
    for(let x=0; x<canvas.width; x+=32){
        for(let y=0; y<canvas.height; y+=32){
            ctx.drawImage(tiles, x, y, 32, 32);
        }
    }
}

// ===== DRAW PLAYER =====
function drawPlayer(){

    const w = 64;
    const h = 64;

    // shadow
    ctx.fillStyle="rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y+20, 16, 6, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.save();

    if(player.dir === -1){
        ctx.scale(-1,1);
        ctx.drawImage(
            wizard,
            -player.x - w/2,
            player.y - h,
            w,
            h
        );
    } else {
        ctx.drawImage(
            wizard,
            player.x - w/2,
            player.y - h,
            w,
            h
        );
    }

    ctx.restore();
}

// ===== DRAW ENEMY =====
function drawEnemy(e){

    const size = 40;

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y+12, 12, 5, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.drawImage(
        skeleton,
        e.x - size/2,
        e.y - size/2,
        size,
        size
    );
}

// ===== DRAW =====
function draw(){

    if(loaded < 3){
        ctx.fillStyle="white";
        ctx.font="20px Arial";
        ctx.fillText("Loading...",600,350);
        return;
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawMap();

    enemies.forEach(drawEnemy);

    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,5,0,Math.PI*2);
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
