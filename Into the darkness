const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// ===== ASSETS =====
const sprites = new Image();
sprites.src = "assets/sprites.png";

const shootSound = new Audio("assets/shoot.wav");

// ===== PLAYER =====
const player = {
    x: 400,
    y: 250,
    speed: 3,
    hp: 120,
    frame: 0,
    inventory: ["Potion", "Potion"]
};

// ===== GAME STATE =====
let keys = {};
let enemies = [];
let bullets = [];
let boss = null;

// ===== INPUT =====
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("click", shoot);

// ===== SPAWN =====
function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: Math.random() * 800 + 50,
            y: Math.random() * 400 + 50,
            hp: 40,
            frame: 0
        });
    }
}

function spawnBoss() {
    boss = {
        x: 450,
        y: 100,
        hp: 300,
        phase: 1,
        timer: 0
    };
}

// ===== SHOOT =====
function shoot() {
    shootSound.currentTime = 0;
    shootSound.play();

    bullets.push({
        x: player.x,
        y: player.y,
        dx: 5,
        dy: 0
    });
}

// ===== UPDATE =====
function update() {
    player.frame++;

    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    enemies.forEach(e => {
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let d = Math.hypot(dx, dy);

        e.x += dx / d;
        e.y += dy / d;

        if (d < 20) player.hp -= 0.2;
    });

    // boss
    if (boss) {
        let dx = player.x - boss.x;
        let dy = player.y - boss.y;
        let d = Math.hypot(dx, dy);

        boss.timer++;

        if (boss.phase === 1) {
            boss.x += dx / d;
        }

        if (boss.hp < 150) boss.phase = 2;

        if (boss.phase === 2 && boss.timer > 60) {
            boss.timer = 0;
            bullets.push({
                x: boss.x,
                y: boss.y,
                dx: -dx / d * 4,
                dy: -dy / d * 4,
                enemy: true
            });
        }
    }

    // bullets
    bullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;

        enemies.forEach(e => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < 15) {
                e.hp -= 20;
                b.hit = true;
            }
        });

        if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < 20) {
            boss.hp -= 10;
            b.hit = true;
        }

        if (b.enemy && Math.hypot(b.x - player.x, b.y - player.y) < 15) {
            player.hp -= 5;
        }
    });

    bullets = bullets.filter(b => !b.hit);
    enemies = enemies.filter(e => e.hp > 0);

    if (enemies.length === 0 && !boss) {
        spawnBoss();
    }
}

// ===== DRAW =====
function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 900, 500);

    // player
    let frame = Math.floor(player.frame / 10) % 4;
    ctx.drawImage(sprites, frame * 32, 0, 32, 32, player.x, player.y, 32, 32);

    // enemies
    enemies.forEach(e => {
        let f = Math.floor(e.frame / 15) % 4;
        ctx.drawImage(sprites, f * 32, 32, 32, 32, e.x, e.y, 32, 32);
    });

    // boss
    if (boss) {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText("BOSS HP: " + boss.hp, 350, 20);
    }

    // bullets
    ctx.fillStyle = "orange";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 5));

    drawUI();
}

// ===== UI =====
function drawUI() {
    ctx.fillStyle = "black";
    ctx.fillRect(10, 10, 200, 120);

    ctx.fillStyle = "white";
    ctx.fillText("HP: " + Math.floor(player.hp), 20, 30);

    ctx.fillText("Inventory:", 20, 60);
    player.inventory.forEach((item, i) => {
        ctx.fillText("- " + item, 20, 80 + i * 15);
    });
}

// ===== LOOP =====
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// ===== START =====
spawnEnemies();
loop();
``
