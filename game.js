const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let player = {
    x: 100,
    y: 200,
    speed: 3
};

let keys = {};
let bullets = [];

// input
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// click to shoot
canvas.addEventListener("click", () => {
    bullets.push({
        x: player.x,
        y: player.y,
        speed: 5
    });
});

function update() {
    // movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // move bullets
    bullets.forEach(b => {
        b.x += b.speed;
    });
}

function draw() {
    // background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // player
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, 40, 40);

    // bullets
    ctx.fillStyle = "orange";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 10, 5);
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
