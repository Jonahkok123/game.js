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
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// ===== SHOOT TOWARD MOUSE 🎯
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

    // stay in screen
    player.x = Math.max(0, Math.min(canvas.width - 40, player.x));
    player.y = Math.max(0, Math.min(canvas.height - 40, player.y));

    // bullets move
    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
    });

    // enemies follow
    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += dx / dist * e.speed;
            e.y += dy / dist * e.speed;
        }

        // damage
        if (dist < 30) player.hp -= 0.2;
    });

    // collisions
    bullets.forEach(b => {
        enemies.forEach(e => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
                e.dead = true;
                b.dead = true;
            }
        });
    });

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);

    // respawn enemies when cleared
    if (enemies.length === 0) spawn();

    // game over
    if (player.hp <= 0) gameOver = true;
}

// ===== DRAW PLAYER (WIZARD STYLE) 🎨
function drawPlayer() {
    let x = player.x;
    let y = player.y;

    // robe
    ctx.fillStyle = "#5a2ca0";
    ctx.fillRect(x+10, y+15, 20, 20);

    // head
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(x+12, y+8, 16, 10);

    // hat
    ctx.fillStyle = "#8b3dff";
    ctx.beginPath();
    ctx.moveTo(x+5, y+15);
    ctx.lineTo(x+20, y-5);
    ctx.lineTo(x+35, y+15);
    ctx.fill();

    // staff
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(x+2, y+12, 4, 25);

    // magic orb ✨
    ctx.fillStyle = "violet";
    ctx.beginPath();
    ctx.arc(x+4, y+5, 5, 0, Math.PI * 2);
    ctx.fill();

    // glow
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x+4, y+5, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

// ===== DRAW =====
function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawPlayer();

    // bullets
    ctx.fillStyle = "orange";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 8, 4);
    });

    // enemies
    ctx.fillStyle = "red";
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, 30, 30);
    });

    // HP bar ❤️
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, player.hp * 2, 10);
    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 200, 10);

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
``
