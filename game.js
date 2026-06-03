Detailed Bug List with Line Numbers and Code Context
BUG #1: Early Return Skips Mouse Click Reset
Lines: 112 and 277 Severity: High - Causes stuck shoot input after death

JavaScript
// Line 112
if (gameOver) return;  // ← Returns early when dead

// ... rest of update code ...

// Line 277
mouse.click = false;  // ← This never executes when gameOver is true
Problem: When gameOver is true, the function returns at line 112, so mouse.click = false at line 277 never runs. This means the mouse click persists into the next frame after respawn.

Fix: Move the reset before the early return:

JavaScript
mouse.click = false;  // Move to line 113
if (gameOver) return;
BUG #2: Enemy Hit Cooldown Uses Frame-Based Decrement Instead of Time-Based
Line: 166 Severity: Medium - Causes inconsistent enemy attack timing

JavaScript
enemies.forEach(e => {
  if (e.hitCooldown > 0) e.hitCooldown--;  // ← Always decrements by 1 per frame
Problem: This decrements by 1 per frame regardless of delta time. At 60 FPS it's ~16.6ms per decrement, but if framerate drops, enemies attack faster. Should use dt like player cooldown does at line 155.

Fix:

JavaScript
if (e.hitCooldown > 0) e.hitCooldown -= dt;
BUG #3: Boss Hit Collision Radius Mismatch
Lines: 193 vs 310 Severity: Medium - Unfair collision detection

JavaScript
// Line 193 - Bullet collision check
if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < 30) {

// Line 310 - Boss drawing
ctx.fillRect(boss.x - 24, boss.y - 24, 48, 48);  // ← 48×48 square, radius should be 24
Problem: Boss is drawn as a 48×48 square (±24 pixels from center), but bullet collision uses radius 30. This creates an asymmetrical hit box that extends beyond the visual sprite.

Fix:

JavaScript
if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < 24) {
BUG #4: Single Bullet Can Damage Multiple Enemies
Lines: 186-197 Severity: High - Bullets are overpowered

JavaScript
bullets.forEach(b => {
  enemies.forEach(e => {
    if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_RADIUS) {
      e.hp -= b.dmg;
      b.dead = true;  // ← Marks as dead but doesn't exit inner loop
    }
  });
  // Loop continues checking other enemies with same bullet
Problem: The inner loop continues iterating after b.dead = true. A bullet can damage multiple enemies in the same frame before being filtered out.

Fix: Add a break statement:

JavaScript
if (Math.hypot(b.x - e.x, b.y - e.y) < ENEMY_RADIUS) {
  e.hp -= b.dmg;
  b.dead = true;
  break;  // ← Exit inner loop
}
BUG #5: Unused Constant
Line: 19 Severity: Low - Code cleanliness

JavaScript
const BULLET_RADIUS = 3;  // ← Never used anywhere in code
Problem: This constant is defined but bullets are drawn as 4×4 squares (line 315), not circles, and no collision detection uses this radius.

Fix: Remove the line or use it consistently:

JavaScript
// Remove line 19, or change bullet rendering to use it
BUG #6: Undefined ARMOUR Array Never Used
Lines: 67-69 Severity: Low - Dead code

JavaScript
const ARMOUR = [
  { name: "Chainmail", slot: "chest", armour: 0.25 }
];  // ← Defined but never used
Problem: The ARMOUR array is never referenced. There's no shop or loot system that drops armor, so this data is unused.

Fix: Either implement an armor drop system or remove the definition.

BUG #7: NPC Objects Have No Functionality
Lines: 72-73 Severity: Low - Dead code

JavaScript
const blacksmith = { x: 200, y: 200, open: false };
const enchanter  = { x: 400, y: 200, open: false };
Problem: NPCs are drawn (lines 288-291) but have no collision detection, no shop, and their open property is never checked.

Fix: Either implement shop mechanics or remove NPC rendering.

BUG #8: No Null/Undefined Check for Canvas Element
Lines: 5-6 Severity: High - Runtime crash if HTML is missing

JavaScript
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");  // ← Crashes if canvas is null
Problem: If no element with ID "c" exists in the HTML, canvas is null and calling .getContext() throws: TypeError: Cannot read property 'getContext' of null

Fix:

JavaScript
const canvas = document.getElementById("c");
if (!canvas) throw new Error("Canvas element with id 'c' not found");
const ctx = canvas.getContext("2d");
BUG #9: Enemy Bullet Multiple Damage Per Frame
Lines: 251-263 Severity: High - Enemy bullets deal inconsistent damage

JavaScript
enemyBullets.forEach(b => {
  b.x += b.dx * dt;
  b.y += b.dy * dt;
  if (Math.hypot(b.x - player.x, b.y - player.y) < PLAYER_RADIUS) {
    player.hp -= b.dmg;
    b.dead = true;  // ← Marked dead but still in array during this iteration
  }
});
Problem: If multiple enemy bullets hit the player in the same frame, all collision checks run before filtering happens at line 259. The damage values stack before bullets are removed.

Fix: Separate collision detection from damage application or use break equivalent:

JavaScript
enemyBullets.forEach(b => {
  b.x += b.dx * dt;
  b.y += b.dy * dt;
  if (!b.dead && Math.hypot(b.x - player.x, b.y - player.y) < PLAYER_RADIUS) {
    player.hp -= b.dmg;
    b.dead = true;
  }
});
BUG #10: Health Bar HUD Has No Visual Border
Line: 325 Severity: Low - UI clarity issue

JavaScript
ctx.fillStyle = "red";
ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 8);
Problem: The health bar is a solid red rectangle. When HP reaches 0, it disappears completely with no visual indication. No border distinguishes it from the background.

Fix:

JavaScript
ctx.fillStyle = "red";
ctx.fillRect(20, 20, Math.max(0, (player.hp / player.maxHp) * 200), 8);
ctx.strokeStyle = "white";
ctx.strokeRect(20, 20, 200, 8);  // ← Add border
