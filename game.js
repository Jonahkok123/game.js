const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== GAME STATE =====
let state = "menu"; // menu or game

// PLAYER
let player = {
    x: 300,
    y: 250,
    speed: 3,
    hp: 100
};

// INPUT
let keys = {};
let mouse = {x:0,y:0};
let bullets = [];
let enemies = [];
let gameOver = false;

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
    let r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

// CLICK
canvas.addEventListener("click", () => {
    if (state === "menu") {
        state = "game";
        startGame();
        return;
    }

    if (gameOver) {
        state = "menu";
        return;
    }

    shoot();
});

// ===== GAME FUNCTIONS =====
function startGame() {
    player.hp = 100;
    player.x = 300;
    player.y = 250;
    bullets = [];
    enemies = [];
    gameOver = false;
    spawn();
}

function shoot() {
    let dx = mouse.x - player.x;
    let dy = mouse.y - player.y;
    let d = Math.hypot(dx,dy);

    bullets.push({
        x: player.x+20,
        y: player.y+20,
        dx: dx/d*6,
        dy: dy/d*6
    });
}

function spawn() {
    for (let i=0;i<5;i++) {
        enemies.push({
            x: Math.random()*800,
            y: Math.random()*500,
            speed: 1 + Math.random()
        });
    }
}

// ===== UPDATE =====
function update() {
    if (state !== "game" || gameOver) return;

    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width-40, player.x));
    player.y = Math.max(0, Math.min(canvas.height-40, player.y));

    bullets.forEach(b=>{
        b.x += b.dx;
        b.y += b.dy;
    });

    // enemies move
    enemies.forEach(e=>{
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let d = Math.hypot(dx,dy);

        e.x += dx/d * e.speed;
        e.y += dy/d * e.speed;

        if (d < 35) player.hp -= 0.3;
    });

    // collisions
    bullets.forEach(b=>{
        enemies.forEach(e=>{
            if (Math.hypot(b.x-e.x,b.y-e.y) < 30) {
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b=>!b.dead);
    enemies = enemies.filter(e=>!e.dead);

    if (enemies.length === 0) spawn();

    if (player.hp <= 0) gameOver = true;
}

// ===== DRAW WIZARD =====
function drawPlayer() {
    let x=player.x,y=player.y;

    ctx.fillStyle="#5a2ca0";
    ctx.fillRect(x+10,y+15,20,20);

    ctx.fillStyle="#ffe0bd";
    ctx.fillRect(x+14,y+6,12,10);

    ctx.fillStyle="#8c4fff";
    ctx.beginPath();
    ctx.moveTo(x+5,y+15);
    ctx.lineTo(x+20,y-8);
    ctx.lineTo(x+35,y+15);
    ctx.fill();

    ctx.fillStyle="#8b5a2b";
    ctx.fillRect(x+2,y+12,4,25);

    ctx.fillStyle="violet";
    ctx.beginPath();
    ctx.arc(x+4,y+5,5,0,6.28);
    ctx.fill();
}

// ===== DRAW SKELETON ENEMY 💀 =====
function drawSkeleton(e) {
    let x=e.x,y=e.y;

    // skull
    ctx.fillStyle="#eee";
    ctx.fillRect(x-8,y-15,16,12);

    // eyes
    ctx.fillStyle="black";
    ctx.fillRect(x-5,y-12,3,3);
    ctx.fillRect(x+2,y-12,3,3);

    // body
    ctx.fillStyle="#ccc";
    ctx.fillRect(x-5,y-3,10,20);

    // arms
    ctx.fillRect(x-12,y+5,6,3);
    ctx.fillRect(x+6,y+5,6,3);

    // legs
    ctx.fillRect(x-6,y+18,4,10);
    ctx.fillRect(x+2,y+18,4,10);

    // glow aura
    ctx.globalAlpha=0.2;
    ctx.fillStyle="white";
    ctx.fillRect(x-20,y-20,40,50);
    ctx.globalAlpha=1;
}

// ===== DRAW =====
function draw() {

    // background
    ctx.fillStyle="#0f0f1a";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // menu
    if (state==="menu") {
        ctx.fillStyle="white";
        ctx.font="40px Arial";
        ctx.fillText("DUNGEON GAME",250,200);

        ctx.font="20px Arial";
        ctx.fillText("Click to Start",340,270);
        return;
    }

    // game
    drawPlayer();

    bullets.forEach(b=>{
        ctx.fillStyle="orange";
        ctx.beginPath();
        ctx.arc(b.x,b.y,5,0,6.28);
        ctx.fill();
    });

    enemies.forEach(drawSkeleton);

    // HP bar
    ctx.fillStyle="red";
    ctx.fillRect(20,20,player.hp*2,10);
    ctx.strokeRect(20,20,200,10);

    // game over
    if (gameOver) {
        ctx.fillStyle="red";
        ctx.font="40px Arial";
        ctx.fillText("GAME OVER",280,260);

        ctx.font="16px Arial";
        ctx.fillText("Click to return to menu",260,300);
    }
}

// LOOP
function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
