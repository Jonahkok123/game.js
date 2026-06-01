const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== PLAYER =====
let player = {
    x: 300,
    y: 250,
    speed: 3,
    hp: 100
};

// ===== STATE =====
let keys = {};
let bullets = [];
let enemies = [];
let gameOver = false;
let mouse = {x: 0, y: 0};

// ===== INPUT =====
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("mousemove", e => {
    let r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});

// ===== SHOOT =====
canvas.addEventListener("click", () => {
    if (gameOver) return;

    let dx = mouse.x - player.x;
    let dy = mouse.y - player.y;
    let dist = Math.hypot(dx, dy);

    bullets.push({
        x: player.x + 20,
        y: player.y + 20,
        dx: dx/dist * 6,
        dy: dy/dist * 6
    });
});

// ===== SPAWN ENEMIES =====
function spawn() {
    enemies = [];
    for (let i = 0; i < 6; i++) {
        enemies.push({
            x: Math.random() * 800,
            y: Math.random() * 500,
            size: 45, // 🔥 BIGGER HITBOX
            speed: 1 + Math.random()
        });
    }
}
spawn();

// ===== UPDATE =====
function update() {
    if (gameOver) return;

    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // stay in bounds
    player.x = Math.max(0, Math.min(canvas.width - 40, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 40, player.y));

    // bullets
    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
    });

    // enemies follow player
    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += dx / dist * e.speed;
            e.y += dy / dist * e.speed;
        }

        // damage
        if (dist < 35) player.hp -= 0.3;
    });

    // collisions (BIGGER HITBOX ✅)
    bullets.forEach(b => {
        enemies.forEach(e => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);

    if (enemies.length === 0) spawn();

    if (player.hp <= 0) gameOver = true;
}

// ===== DRAW WIZARD (UPGRADED VISUAL) =====
function drawPlayer() {
    let x = player.x;
    let y = player.y;

    // robe shading
    ctx.fillStyle = "#3d1d70";
    ctx.fillRect(x+8, y+12, 24, 24);

    ctx.fillStyle = "#6a35c0";
    ctx.fillRect(x+10, y+15, 20, 20);

    // head
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(x+14, y+6, 12, 10);

    // hat
    ctx.fillStyle = "#8c4fff";
    ctx.beginPath();
    ctx.moveTo(x+5, y+15);
    ctx.lineTo(x+20, y-8);
    ctx.lineTo(x+35, y+15);
    ctx.fill();

    // staff
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(x+2, y+12, 4, 25);

    // glowing orb ✨
    ctx.fillStyle = "#b366ff";
    ctx.beginPath();
    ctx.arc(x+4, y+5, 5, 0, Math.PI * 2);
    ctx.fill();

    // glow effect
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(x+4, y+5, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

// ===== DRAW =====
function draw() {
    // dungeon background
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid tiles
    ctx.fillStyle = "#1c1c2b";
    for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.fillRect(x, y, 38, 38);
        }
    }

    drawPlayer();

    // bullets (magic look ✨)
    bullets.forEach(b => {
        ctx.fillStyle = "#ff9900";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // enemies (better visuals)
    enemies.forEach(e => {
        // body
        ctx.fillStyle = "#aa2222";
        ctx.fillRect(e.x - 15, e.y - 15, 30, 30);

        // glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "red";
        ctx.fillRect(e.x - 20, e.y - 20, 40, 40);
        ctx.globalAlpha = 1;
    });

    // HP bar
    ctx.fillStyle = "black";
    ctx.fillRect(20, 20, 200, 12);

    ctx.fillStyle = "lime";
    ctx.fillRect(20, 20, player.hp * 2, 12);

    // game over
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 280, 260);
    }
}

// ===== LOOP =====
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
