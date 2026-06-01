const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let x = 100;

function loop() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.fillRect(x, 200, 50, 50);

    x += 2;

    requestAnimationFrame(loop);
}

loop();
