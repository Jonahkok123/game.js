const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let x = 100;

// GAME LOOP
function loop() {
    // clear screen
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw moving square
    ctx.fillStyle = "red";
    ctx.fillRect(x, 200, 50, 50);

    x += 2;

    requestAnimationFrame(loop);
}

// start game
loop();
