"use strict";

const EXACT_WINDOW = 260;
const CLOSE_WINDOW = 650;

function shotScore(time, moment) {
  const distance = Math.abs(time - moment);
  if (distance <= EXACT_WINDOW) return 2;
  if (distance <= CLOSE_WINDOW) return 1;
  return 0;
}

function cartoonFrame(scene, canvas, time) {
  const ctx = canvas.getContext("2d");
  if (ctx) scene.draw(ctx, time);
}

const cameraScenes = byId("camera-scenes");
const cameraPrize = byId("camera-prize");
const cameraReel = byId("camera-reel");
let activeTake;
let animationFrame;

const cameraCards = CARTOONS.map((scene, index) => {
  const card = document.createElement("article");
  card.className = "camera-card";
  card.innerHTML = '<div class="camera-card-heading"><h2></h2><span class="scene-score"></span></div>'
    + '<div class="viewfinder"><canvas width="480" height="300" aria-hidden="true"></canvas></div>'
    + '<div class="take-controls"><button type="button" class="button shutter"></button>'
    + '<p class="take-message" role="status"></p></div>';
  card.querySelector("h2").textContent = scene.title;
  const stage = card.querySelector("canvas");
  const viewfinder = card.querySelector(".viewfinder");
  viewfinder.style.backgroundColor = scene.color;
  const button = card.querySelector("button");
  const message = card.querySelector(".take-message");
  const score = card.querySelector(".scene-score");
  button.addEventListener("click", () => {
    if (activeTake?.index === index && !activeTake.shot) takeShot();
    else startTake(index);
  });
  cameraScenes.append(card);
  cartoonFrame(scene, stage, state.shots[index]?.time ?? 0);
  const result = { stage, viewfinder, button, message, score };
  updateShutter(result, scene, state.shots[index] ? "Переснять" : "Запустить");
  return result;
});

function updateShutter(card, scene, label) {
  card.button.textContent = label;
  card.button.setAttribute("aria-label", label + " — " + scene.title);
}

function updateCameraScore() {
  const total = cameraScore();
  byId("camera-total").textContent = total + " из 6 · цель 5";
  cameraCards.forEach((card, index) => {
    const points = state.shots[index]?.score ?? 0;
    card.score.textContent = points + " / 2";
    card.score.setAttribute("aria-label", "Лучший дубль: " + points + " из 2");
  });
  cameraPrize.hidden = !cameraCompleted() || Boolean(activeTake);
}

function startTake(index) {
  endTake();
  const card = cameraCards[index];
  activeTake = { index, start: performance.now(), time: 0, shot: null };
  card.message.textContent = "";
  updateShutter(card, CARTOONS[index], "Снять");
  card.viewfinder.classList.add("rolling");
  cartoonFrame(CARTOONS[index], card.stage, 0);
  updateCameraScore();
  animationFrame = requestAnimationFrame(animateTake);
}

function animateTake(now) {
  if (!activeTake) return;
  const { index, start, shot } = activeTake;
  const scene = CARTOONS[index];
  const elapsed = Math.max(0, now - start);
  if (elapsed >= scene.duration && shot) {
    endTake();
    return;
  }
  activeTake.time = elapsed % scene.duration;
  cartoonFrame(scene, cameraCards[index].stage, activeTake.time);
  animationFrame = requestAnimationFrame(animateTake);
}

function takeShot() {
  const { index, time } = activeTake;
  const scene = CARTOONS[index];
  const card = cameraCards[index];
  const score = shotScore(time, scene.moment);
  activeTake.shot = { time, score };
  // Keep the ending of the current loop when the player shoots on a later take.
  activeTake.start = performance.now() - time;
  if (score > (state.shots[index]?.score ?? 0)) {
    state.shots[index] = { time, score };
    save();
  }
  card.message.textContent = ["0 очков. Мимо!", "1 очко. Почти!", "2 очка. Точно!"][score];
  card.viewfinder.classList.remove("rolling");
  card.viewfinder.classList.remove("flash");
  // A new animation is needed even when several quick takes use the same viewfinder.
  requestAnimationFrame(() => card.viewfinder.classList.add("flash"));
  updateShutter(card, scene, "Переснять");
  renderCollection();
  updateCameraScore();
}

function endTake() {
  if (!activeTake) return;
  cancelAnimationFrame(animationFrame);
  const { index, shot } = activeTake;
  const scene = CARTOONS[index];
  const card = cameraCards[index];
  const best = state.shots[index];
  cartoonFrame(scene, card.stage, best?.time ?? (shot ? scene.duration : 0));
  card.viewfinder.classList.remove("rolling", "flash");
  updateShutter(card, scene, shot || best ? "Переснять" : "Запустить");
  activeTake = undefined;
  updateCameraScore();
}

function showReel() {
  cameraReel.replaceChildren(...CARTOONS.map((scene, index) => {
    const shot = state.shots[index];
    const frame = document.createElement("figure");
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 300;
    canvas.setAttribute("aria-hidden", "true");
    const caption = document.createElement("figcaption");
    caption.textContent = scene.title + " · " + shot.score + " / 2";
    frame.append(canvas, caption);
    cartoonFrame(scene, canvas, shot.time);
    return frame;
  }));
}

function onCameraRoute() {
  if (currentScreen !== "camera-game") endTake();
  if (currentScreen === "camera-reward") showReel();
}

document.addEventListener("game-route", onCameraRoute);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) endTake();
});
updateCameraScore();
onCameraRoute();
