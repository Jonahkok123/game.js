const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== LOAD IMAGES =====
function loadImage(src){
    const img = new Image();
    img.src = src;

    img.onload = () => console.log(src + " loaded");
    img.onerror = () => console.log(src + " FAILED");

    return img;
}

const wizard = loadImage("assets/wizard.png");
const skeleton = loadImage("assets/skeleton.png");
const tiles = loadImage("assets/tiles.png");

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
    const dist = Math.hypot(dx,dy) || 1;

    bullets.push({
        x: player.x,
        y: player.y - 10,
        dx: dx/dist * 6,
        dy: dy/dist * 6
    });
}

// ===== SPAWN =====
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

// ===== UPDATE =====
function update(){

    let moveX = 0;
    let moveY = 0;

    if(keys["w"]) moveY -= 1;
    if(keys["s"]) moveY += 1;
    if(keys["a"]){ moveX -= 1; player.dir = -1; }
    if(keys["d"]){ moveX += 1; player.dir = 1; }

    const mag = Math.hypot(moveX, moveY) || 1;
    moveX /= mag;
    moveY /= mag;

    player.x += moveX * player.speed;
    player.y += moveY * player.speed;

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

        e.x += (dx/d) * e.speed;
        e.y += (dy/d) * e.speed;
    });

    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y)<20){
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if(enemies.length === 0) spawn();
}

// ===== DRAW MAP =====
function drawMap(){
    for(let x=0;x<canvas.width;x+=32){
        for(let y=0;y<canvas.height;y+=32){
            if(tiles.complete){
                ctx.drawImage(tiles,x,y,32,32);
            }
        }
    }
}

// ===== DRAW PLAYER =====
function drawPlayer(){
    const w = 48;
    const h = 48;

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y+14, 14, 5, 0, 0, Math.PI*2);
    ctx.fill();

    if(wizard.complete){
        if(player.dir === -1){
            ctx.save();
            ctx.scale(-1,1);
            ctx.drawImage(wizard, -player.x-w/2, player.y-h, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(wizard, player.x-w/2, player.y-h, w, h);
        }
    }
}

// ===== DRAW ENEMY =====
function drawEnemy(e){
    const w = 28;
    const h = 48;

    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y+14, 12, 5, 0, 0, Math.PI*2);
    ctx.fill();

    if(skeleton.complete){
        ctx.drawImage(skeleton, e.x-w/2, e.y-h/2, w, h);
    }
}

// ===== DRAW =====
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

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
