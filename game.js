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
    x: 400,
    y: 300,
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
        y: player.y,
        dx: dx/d * 7,
        dy: dy/d * 7
    });
}

// ===== SPAWN =====
function spawn(){
    enemies = [];
    for(let i=0;i<5;i++){
        enemies.push({
            x: Math.random()*700+50,
            y: Math.random()*400+50,
            speed: 1
        });
    }
}
spawn();

// ===== UPDATE =====
function update(){

    // movement
    if(keys["w"]) player.y -= player.speed;
    if(keys["s"]) player.y += player.speed;
    if(keys["a"]){ player.x -= player.speed; player.dir = -1; }
    if(keys["d"]){ player.x += player.speed; player.dir = 1; }

    // keep inside screen
    player.x = Math.max(32, Math.min(canvas.width-32, player.x));
    player.y = Math.max(32, Math.min(canvas.height-32, player.y));

    // bullets
    bullets.forEach(b=>{
        b.x += b.dx;
        b.y += b.dy;
    });

    // enemies follow player
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
            if(Math.hypot(b.x - e.x, b.y - e.y) < 20){
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if(enemies.length === 0) spawn();
}

// ===== DRAW FLOOR (YOUR TILE) =====
function drawMap(){
    for(let x=0; x<canvas.width; x+=32){
        for(let y=0; y<canvas.height; y+=32){
            ctx.drawImage(tiles, x, y, 32, 32);
        }
    }
}

// ===== DRAW PLAYER =====
function drawPlayer(){

    // shadow
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y+20, 16, 6, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.save();

    if(player.dir === -1){
        ctx.scale(-1,1);
        ctx.drawImage(
            wizard,
            -player.x-32,
            player.y-32,
            64,64
        );
    } else {
        ctx.drawImage(
            wizard,
            player.x-32,
            player.y-32,
            64,64
        );
    }

    ctx.restore();
}

// ===== DRAW ENEMY =====
function drawEnemy(e){

    // shadow
    ctx.fillStyle="rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y+12, 12, 5, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.drawImage(
        skeleton,
        e.x-20,
        e.y-20,
        40,
        40
    );
}

// ===== DRAW =====
function draw(){

    if(loaded < 3){
        ctx.fillStyle="white";
        ctx.font="20px Arial";
        ctx.fillText("Loading...",350,250);
        return;
    }

    ctx.fillStyle="#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

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
