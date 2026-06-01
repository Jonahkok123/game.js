const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let player = {
    x: 100,
    y: 200,
    speed: 3
};

let keys = {};

// input
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

function update() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, 40, 40);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
