const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// PLAYER
let player = {
    x: 100,
    y: 200,
    speed: 3,
    hp: 100
};

// STATE
let keys = {};
let bullets = [];
let enemies = [];
let gameOver = false;

// INPUT
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// SHOOT
canvas.addEventListener("click", () => {
    if (gameOver) return;
    bullets.push({
        x: player.x + 30,
        y: player.y + 20,
        dx: 6
    });
});

// SPAWN ENEMIES
for (let i = 0; i < 5; i++) {
    enemies.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        speed: 1
    });
}

// UPDATE
function update() {
    if (gameOver) return;

    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // inside screen
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > canvas.width - 40) player.x = canvas.width - 40;
    if (player.y > canvas.height - 40) player.y = canvas.height - 40;

    // bullets
    for (let b of bullets) {
        b.x += b.dx;
    }

    // enemies
    for (let e of enemies) {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += dx / dist * e.speed;
            e.y += dy / dist * e.speed;
        }

        if (dist < 30) {
            player.hp -= 0.2;
        }
    }

    // collisions
    for (let b of bullets) {
        for (let e of enemies) {
            let d = Math.hypot(b.x - e.x, b.y - e.y);
            if (d < 20) {
                e.dead = true;
                b.dead = true;
            }
        }
    }

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);

    // game over
    if (player.hp <= 0) gameOver = true;
}

// 🎨 DRAW WIZARD (your sprite style)
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
    ctx.fillStyle = "#7a3bd1";
    ctx.beginPath();
    ctx.moveTo(x+5, y+15);
    ctx.lineTo(x+20, y-5);
    ctx.lineTo(x+35, y+15);
    ctx.fill();

    // staff
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(x+2, y+12, 4, 25);

    // magic orb
    ctx.fillStyle = "purple";
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

// DRAW
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawPlayer();

    // bullets
    ctx.fillStyle = "orange";
    for (let b of bullets) {
        ctx.fillRect(b.x, b.y, 10, 5);
    }

    // enemies
    ctx.fillStyle = "red";
    for (let e of enemies) {
        ctx.fillRect(e.x, e.y, 30, 30);
    }

    // HP
    ctx.fillStyle = "white";
    ctx.fillText("HP: " + Math.floor(player.hp), 20, 20);

    // GAME OVER
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 300, 250);
    }
}

// LOOP
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
``
