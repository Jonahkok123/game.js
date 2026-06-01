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
        x: player.x + 40,
        y: player.y + 20,
        dx: 6
    });
});

// SPAWN ENEMIES
function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.random() * 800 + 50,
            y: Math.random() * 400 + 50,
            speed: 1
        });
    }
}

spawnEnemies();

// UPDATE
function update() {
    if (gameOver) return;

    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // keep inside screen
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x > canvas.width - 40) player.x = canvas.width - 40;
    if (player.y > canvas.height - 40) player.y = canvas.height - 40;

    // move bullets
    bullets.forEach(b => {
        b.x += b.dx;
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

        // damage player
        if (dist < 30) {
            player.hp -= 0.2;
        }
    });

    // bullet hits enemy
    bullets.forEach(b => {
        enemies.forEach(e => {
            let d = Math.hypot(b.x - e.x, b.y - e.y);
            if (d < 20) {
                e.dead = true;
                b.hit = true;
            }
        });
    });

    bullets = bullets.filter(b => !b.hit);
    enemies = enemies.filter(e => !e.dead);

    // game over
    if (player.hp <= 0) {
        gameOver = true;
    }
}

// DRAW
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // player
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, 40, 40);

    // bullets
    ctx.fillStyle = "orange";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 12, 5);
    });

    // enemies
    ctx.fillStyle = "red";
    enemies.forEach(e => {
        ctx.fillRect(e.x, e.y, 30, 30);
    });

    // HP UI
    ctx.fillStyle = "white";
    ctx.fillText("HP: " + Math.floor(player.hp), 20, 20);

    // game over text
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
