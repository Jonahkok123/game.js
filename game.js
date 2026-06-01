const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let player = {
    x: 100,
    y: 200,
    speed: 3
};

let keys = {};
let bullets = [];
let enemies = [];

// INPUT
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// SHOOT
canvas.addEventListener("click", () => {
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
    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // move bullets
    bullets.forEach(b => {
        b.x += b.dx;
    });

    // move enemies toward player
    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += dx / dist * e.speed;
            e.y += dy / dist * e.speed;
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
}

// LOOP
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
