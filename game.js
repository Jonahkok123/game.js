const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== SETTINGS =====
let tileSize = 40;

// ===== PLAYER =====
let player = { x: 400, y: 250, speed: 3, hp: 100 };

// ===== STATE =====
let keys = {}, bullets = [], enemies = [];
let mouse = { x:0, y:0 };

// INPUT
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("mousemove", e => {
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
        dx: dx/d * 8,
        dy: dy/d * 8
    });
}

// ===== SPAWN =====
function spawn(){
    for(let i=0;i<6;i++){
        enemies.push({
            x: Math.random()*800,
            y: Math.random()*500,
            hp: 3
        });
    }
}
spawn();

// ===== UPDATE =====
function update(){

    // movement
    if(keys["w"]) player.y -= player.speed;
    if(keys["s"]) player.y += player.speed;
    if(keys["a"]) player.x -= player.speed;
    if(keys["d"]) player.x += player.speed;

    player.x = Math.max(20, Math.min(canvas.width-20, player.x));
    player.y = Math.max(20, Math.min(canvas.height-20, player.y));

    // bullets
    bullets.forEach(b=>{
        b.x += b.dx;
        b.y += b.dy;
    });

    // enemies
    enemies.forEach(e=>{
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let d = Math.hypot(dx,dy)||1;

        e.x += dx/d * 1.2;
        e.y += dy/d * 1.2;

        if(d < 25){
            player.hp -= 0.2;
        }
    });

    // collisions
    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if(Math.hypot(b.x-e.x,b.y-e.y) < 18){
                e.hp--;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>e.hp > 0);

    if(enemies.length === 0) spawn();
}

// ===== TILE FLOOR (MOONLIGHTER STYLE) =====
function drawFloor(){

    for(let x=0; x<canvas.width; x+=tileSize){
        for(let y=0; y<canvas.height; y+=tileSize){

            // base tile
            ctx.fillStyle = "#1c3a3a";
            ctx.fillRect(x,y,tileSize,tileSize);

            // moss variation
            if(Math.random() < 0.1){
                ctx.fillStyle = "#245050";
                ctx.fillRect(x,y,tileSize,tileSize);
            }

            // cracks
            ctx.fillStyle = "#152828";
            ctx.fillRect(x+5,y+5,5,5);
        }
    }
}

// ===== WALLS =====
function drawWalls(){

    ctx.fillStyle = "#2c2f3f";

    // top wall
    ctx.fillRect(0,0,canvas.width,30);

    // bottom wall
    ctx.fillRect(0,canvas.height-30,canvas.width,30);

    // side walls
    ctx.fillRect(0,0,30,canvas.height);
    ctx.fillRect(canvas.width-30,0,30,canvas.height);
}

// ===== SHADOW SYSTEM =====
function drawShadow(x,y){
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x,y,18,6,0,0,6.28);
    ctx.fill();
}

// ===== PLAYER (CLEAN SPRITE STYLE) =====
function drawPlayer(){

    drawShadow(player.x, player.y+18);

    // body
    ctx.fillStyle = "#2e4070";
    ctx.fillRect(player.x-10, player.y-12, 20, 24);

    // head
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x-6, player.y-20, 12, 10);

    // sword flash
    ctx.fillStyle = "white";
    ctx.fillRect(player.x+10, player.y-5, 8, 3);
}

// ===== ENEMY STYLE =====
function drawEnemy(e){

    drawShadow(e.x, e.y+16);

    // blob/skeleton hybrid style
    ctx.fillStyle = "#4ecdc4";
    ctx.fillRect(e.x-8, e.y-10, 16, 20);

    ctx.fillStyle = "#0f2a2a";
    ctx.fillRect(e.x-4, e.y-6, 3, 3);
    ctx.fillRect(e.x+1, e.y-6, 3, 3);
}

// ===== BULLETS =====
function drawBullets(){
    bullets.forEach(b=>{
        ctx.fillStyle = "#ffcc00";
        ctx.beginPath();
        ctx.arc(b.x,b.y,4,0,6.28);
        ctx.fill();

        // glow
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(b.x,b.y,10,0,6.28);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// ===== DRAW =====
function draw(){

    // background
    ctx.fillStyle="#0f1c1c";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    drawFloor();
    drawWalls();

    drawPlayer();
    enemies.forEach(drawEnemy);
    drawBullets();

    // HP bar
    ctx.fillStyle="black";
    ctx.fillRect(20,20,200,12);

    ctx.fillStyle="red";
    ctx.fillRect(20,20,player.hp*2,12);
}

// LOOP
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
