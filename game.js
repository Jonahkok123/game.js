const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let player = {
    x: 100,
    y: 200
};

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, 40, 40);

    requestAnimationFrame(loop);
}

loop();
