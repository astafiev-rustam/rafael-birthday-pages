"use strict";

const ui = Object.fromEntries([
  "stage", "overlay", "overlay-title", "overlay-text", "advance", "pause", "status",
  "level-index", "level-name", "friend-count", "left", "right", "jump",
].map((id) => [id, document.getElementById(id)]));
const context = ui.stage.getContext("2d");
const input = new Set();
const pointerInput = new Map();
const rescued = new Set(state.platform.rescued);
const TRAIL_STEP = 7;
const TRAIL_MAX = (CREW.length + 1) * TRAIL_STEP;
const START_X = 31;
const STEP_MS = 1000 / 60;
let levelIndex = 0;
let level = LEVELS[0];
let platforms;
let player;
let trail = [];
let enemies = [];
let camera = 0;
let tick = 0;
let mode = "ready";
let checkpoint = START_X;
let jumpBuffer = 0;
let endingTick = 0;
let endingPositions = [];
let exitHintShown = false;

const clamp = (x, low, high) => Math.max(low, Math.min(x, high));
const localReady = () => level.friends.every((friend) => rescued.has(friend.id));
const active = (action) => input.has(action) || [...pointerInput.values()].includes(action);

function announce(message) {
  if (ui.status.textContent !== message) ui.status.textContent = message;
}

function refreshHud() {
  ui["level-index"].textContent = (levelIndex + 1) + " / " + LEVELS.length;
  ui["level-name"].textContent = level.name;
  ui["friend-count"].textContent = rescued.size + " / " + CREW.length;
  ui.pause.disabled = mode !== "playing";
}

function resetControls() {
  input.clear();
  pointerInput.clear();
  jumpBuffer = 0;
  for (const action of ["left", "right", "jump"]) ui[action].classList.remove("pressed");
}

function showOverlay(title, message, button) {
  ui["overlay-title"].textContent = title;
  ui["overlay-text"].textContent = message;
  ui.advance.textContent = button;
  ui.overlay.hidden = false;
}

function savePlatform(cleared = false) {
  state.platform = { level: levelIndex, checkpoint: checkpoint !== START_X, cleared, rescued: [...rescued] };
  save();
}

function loadLevel(index, atCheckpoint = false) {
  levelIndex = index;
  level = LEVELS[index];
  platforms = [...level.ground.map(([start, end]) => [start, GROUND, end - start]), ...level.platforms];
  checkpoint = atCheckpoint ? level.checkpoint : START_X;
  tick = 0;
  mode = "ready";
  camera = clamp(checkpoint - VIEW_W * .4, 0, level.length - VIEW_W);
  exitHintShown = false;
  enemies = level.foes.map((foe) => enemyAt(foe, tick));
  resetControls();
  placePlayer(checkpoint);
  refreshHud();
  const quest = [
    "Перепрыгивай офисные неприятности. Лифт откроется, когда найдёшь обоих друзей.",
    "Переберись через овраги и забери ещё двоих. Под тучей можно проскочить, когда дождь кончится.",
    "Осталось трое друзей. Собери всех и подойди к двери под вывеской «НЕБАР».",
  ];
  showOverlay(level.name, quest[index], index === 0 ? "Играть" : "Вперёд");
  announce("На уровне друзей: " + level.friends.length + ".");
  draw();
}

function placePlayer(x) {
  player = { x, y: GROUND, vy: 0, grounded: true, facing: 1, moving: false, immunity: 0 };
  trail = Array.from({ length: TRAIL_MAX }, (_, i) => ({ x: x - i * .82, y: GROUND, facing: 1, step: 0 }));
}

function resume() {
  mode = "playing";
  ui.overlay.hidden = true;
  refreshHud();
  ui.advance.blur();
}

function pause(shouldFocus = true) {
  if (mode !== "playing") return;
  mode = "paused";
  resetControls();
  refreshHud();
  showOverlay("Пауза", "Компания подождёт.", "Продолжить");
  if (shouldFocus) ui.advance.focus({ preventScroll: true });
}

function bump(message) {
  placePlayer(checkpoint);
  player.immunity = 75;
  camera = clamp(checkpoint - VIEW_W * .4, 0, level.length - VIEW_W);
  jumpBuffer = 0;
  announce(message + " Друзья всё ещё с тобой.");
}

function movePlayer() {
  const dx = Number(active("right")) - Number(active("left"));
  player.moving = dx !== 0;
  if (dx) player.facing = dx;
  player.x = clamp(player.x + dx * 2.65, 8, level.length - 8);
  if (jumpBuffer > 0 && player.grounded) {
    jumpBuffer = 0;
    player.vy = -6.45;
    player.grounded = false;
  }
  if (jumpBuffer > 0) jumpBuffer--;
  const previousY = player.y;
  player.vy = Math.min(8.5, player.vy + .34);
  player.y += player.vy;
  player.grounded = false;
  if (player.vy >= 0) {
    let landing = Infinity;
    for (const [x, y, width] of platforms) {
      if (player.x + 4 > x && player.x - 4 < x + width && previousY <= y && player.y >= y) {
        landing = Math.min(landing, y);
      }
    }
    if (Number.isFinite(landing)) {
      player.y = landing;
      player.vy = 0;
      player.grounded = true;
    }
  }
}

function overlaps(x, bottom, width, height) {
  return Math.abs(player.x - x) < width / 2 + 5 && player.y > bottom - height && player.y - 21 < bottom;
}

function hazard() {
  for (const enemy of enemies) {
    if (overlaps(enemy.center, enemy.bottom, enemy.width, enemy.height)) return enemy.name;
    if (enemy.raining && overlaps(enemy.center, GROUND, enemy.width - 8, GROUND - enemy.bottom)) return enemy.name;
    if (enemy.note && overlaps(enemy.note.x, enemy.note.y, 10, 12)) return enemy.name;
  }
  return "";
}

function rememberPose() {
  trail.unshift({ x: player.x, y: player.y, facing: player.facing, step: player.moving ? 1 + Math.floor(tick / 6) % 2 : 0 });
  trail.length = TRAIL_MAX;
}

function update() {
  if (mode === "ending") {
    endingTick++;
    if (endingTick === 158) win();
    return;
  }
  if (mode !== "playing") return;
  tick++;
  enemies = level.foes.map((foe) => enemyAt(foe, tick));
  movePlayer();
  if (player.y > VIEW_H + 19) {
    bump("Падение!");
    return;
  }
  if (player.immunity) player.immunity--;
  const collision = player.immunity ? "" : hazard();
  if (collision) {
    bump("На пути: «" + collision + "».");
    return;
  }
  if (checkpoint === START_X && player.x >= level.checkpoint) {
    checkpoint = level.checkpoint;
    savePlatform();
    announce("Контрольная точка.");
  }
  for (const friend of level.friends) {
    if (!rescued.has(friend.id) && overlaps(friend.x, friend.y, 16, 27)) {
      rescued.add(friend.id);
      savePlatform();
      refreshHud();
      announce(CREW[friend.id].name + " с тобой. " + (localReady() ? "Теперь к выходу!" : "Ищи остальных."));
    }
  }
  rememberPose();
  camera = clamp(player.x - VIEW_W * .4, 0, level.length - VIEW_W);
  if (Math.abs(player.x - level.gate) < 16 && player.y >= GROUND - 6) {
    if (localReady()) finishLevel();
    else if (!exitHintShown) {
      exitHintShown = true;
      announce("До выхода дошли не все. Забери друзей на этом уровне.");
    }
  } else {
    exitHintShown = false;
  }
}

function finishLevel() {
  resetControls();
  if (levelIndex < LEVELS.length - 1) {
    mode = "clear";
    savePlatform(true);
    refreshHud();
    showOverlay("Все на месте", "Друзья с этого уровня идут дальше с тобой.", "Следующий уровень");
    ui.advance.focus({ preventScroll: true });
    return;
  }
  mode = "ending";
  endingTick = 0;
  endingPositions = [trail[0], ...[...rescued].map((_, i) => trail[(i + 1) * TRAIL_STEP])];
  refreshHud();
  announce("Вся компания у «НЕБАРА»!");
}

function win() {
  mode = "won";
  refreshHud();
  state.friendsWon = true;
  savePlatform();
  renderCollection();
  location.replace("#friends-reward");
}

function draw() {
  const ctx = context;
  backdrop(ctx, level, camera, tick);
  terrain(ctx, level, camera);
  door(ctx, level, camera, localReady());
  const flagX = level.checkpoint - camera;
  rect(ctx, "#302a3a", flagX, GROUND - 27, 2, 27);
  rect(ctx, checkpoint === level.checkpoint ? "#9ede8e" : "#ffc586", flagX + 2, GROUND - 27, 11, 7);
  for (const enemy of enemies) enemyArt(ctx, enemy, camera, tick);
  for (const friend of level.friends) {
    if (rescued.has(friend.id) || Math.abs(friend.x - camera - VIEW_W / 2) > VIEW_W / 2 + 24) continue;
    pixelPerson(ctx, CREW[friend.id], friend.x - camera, friend.y, -1);
    label(ctx, CREW[friend.id].name, friend.x - camera, friend.y - 39, { color: "#ffe4a9" });
  }
  if (mode === "ending" || mode === "won") {
    if (mode === "ending") drawEntrance(ctx);
    return;
  }
  const group = [...rescued];
  for (let i = group.length - 1; i >= 0; i--) {
    const pose = trail[(i + 1) * TRAIL_STEP];
    if (pose.y < VIEW_H + 12) pixelPerson(ctx, CREW[group[i]], pose.x - camera, pose.y, pose.facing, pose.step);
  }
  if (player.immunity % 12 < 8) {
    pixelPerson(ctx, RAFAEL, player.x - camera, player.y, player.facing, trail[0].step);
  }
}

function drawEntrance(ctx) {
  const group = [RAFAEL, ...[...rescued].map((id) => CREW[id])];
  for (let i = group.length - 1; i >= 0; i--) {
    const from = endingPositions[i];
    const lineupX = level.gate - (i + 1) * 16;
    const lineUp = clamp(endingTick / 29, 0, 1);
    const enter = clamp((endingTick - 30) / (12 + i * 14), 0, 1);
    if (enter === 1) continue;
    const startingX = from.x + (lineupX - from.x) * lineUp;
    const x = startingX + (level.gate - startingX) * enter;
    const y = Math.min(GROUND + 4, from.y) + (GROUND - Math.min(GROUND + 4, from.y)) * lineUp;
    pixelPerson(ctx, group[i], x - camera, y, 1, 1 + Math.floor(endingTick / 6) % 2);
  }
}

const keyActions = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump",
};

window.addEventListener("keydown", (event) => {
  if (currentScreen !== "friends") return;
  if (event.code === "Escape") {
    if (mode === "playing") pause();
    else if (mode === "paused") resume();
    return;
  }
  const action = keyActions[event.code];
  if (mode !== "playing" || !action || (event.code === "Space" && event.target.closest?.("button"))) return;
  event.preventDefault();
  input.add(action);
  if (action === "jump" && !event.repeat) jumpBuffer = 7;
});
window.addEventListener("keyup", (event) => input.delete(keyActions[event.code]));
window.addEventListener("blur", resetControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause(false);
});

for (const action of ["left", "right", "jump"]) {
  const button = ui[action];
  button.addEventListener("pointerdown", (event) => {
    if (mode !== "playing") return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pointerInput.set(event.pointerId, action);
    button.classList.add("pressed");
    if (action === "jump") jumpBuffer = 7;
  });
  for (const release of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(release, (event) => {
      pointerInput.delete(event.pointerId);
      if (!active(action)) button.classList.remove("pressed");
    });
  }
  button.addEventListener("click", (event) => {
    if (mode !== "playing" || event.detail !== 0) return;
    if (action === "jump") jumpBuffer = 7;
  });
}

ui.advance.addEventListener("click", () => {
  if (mode === "clear") {
    loadLevel(levelIndex + 1);
    savePlatform();
    ui.advance.focus({ preventScroll: true });
  } else if (mode === "ready" || mode === "paused") {
    resume();
  }
});
ui.pause.addEventListener("click", () => pause());

let previous = 0;
let accumulated = 0;
let platformFrame;
function frame(now) {
  if (previous && (mode === "playing" || mode === "ending")) accumulated += Math.min(70, now - previous);
  previous = now;
  while (accumulated >= STEP_MS) {
    accumulated -= STEP_MS;
    update();
  }
  if (mode === "playing" || mode === "ending" || mode === "won") draw();
  platformFrame = requestAnimationFrame(frame);
}

function onPlatformRoute() {
  if (currentScreen === "friends") {
    if (platformFrame === undefined) platformFrame = requestAnimationFrame(frame);
  } else {
    pause(false);
    cancelAnimationFrame(platformFrame);
    platformFrame = undefined;
    previous = 0;
    accumulated = 0;
  }
}

loadLevel(state.platform.level, state.platform.checkpoint);
if (state.platform.cleared) {
  mode = "clear";
  refreshHud();
  showOverlay("Все на месте", "Друзья с этого уровня идут дальше с тобой.", "Следующий уровень");
}
document.addEventListener("game-route", onPlatformRoute);
onPlatformRoute();
