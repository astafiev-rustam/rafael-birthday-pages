"use strict";

const poemVideo = byId("poem-video");
const poemPlayer = byId("poem-player");
const poemStart = byId("poem-start");
const punchline = byId("poem-punchline");
const poemError = byId("poem-error");

function celebrateGift() {
  const panel = byId("gift-panel");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = byId("confetti");
  const colors = ["#ffb96f", "#ff8399", "#fbe5a7", "#b5dcac", "#8abbeb", "#d5b1ed"];
  panel.classList.add("gift-celebrating");
  for (let i = 0; i < 72; i++) {
    const piece = document.createElement("i");
    const direction = i % 2 ? -1 : 1;
    piece.style.setProperty("--x", direction * (32 + Math.random() * 60) + "cqw");
    piece.style.setProperty("--rise", -(45 + Math.random() * 165) + "px");
    piece.style.setProperty("--fall", (150 + Math.random() * 170) + "px");
    piece.style.setProperty("--spin", direction * (280 + Math.random() * 520) + "deg");
    piece.style.setProperty("--delay", Math.random() * 300 + "ms");
    piece.style.backgroundColor = colors[i % colors.length];
    confetti.append(piece);
  }
  window.setTimeout(() => {
    confetti.replaceChildren();
    panel.classList.remove("gift-celebrating");
  }, 2150);
}

function loadPoem() {
  if (!poemVideo.getAttribute("src")) poemVideo.src = "assets/poem.mp4";
  poemPlayer.hidden = false;
}

poemStart.addEventListener("click", () => {
  if (!giftUnlocked() || currentScreen !== "gift") return;
  loadPoem();
  poemError.hidden = true;
  if (poemVideo.ended) poemVideo.currentTime = 0;
  poemVideo.play().catch(() => { poemError.hidden = false; });
  poemVideo.scrollIntoView({ block: "nearest" });
});

poemVideo.addEventListener("playing", () => { poemError.hidden = true; });
poemVideo.addEventListener("error", () => { poemError.hidden = false; });
poemVideo.addEventListener("ended", () => {
  if (!giftUnlocked()) return;
  state.poemWatched = true;
  punchline.hidden = false;
  save();
  if (currentScreen === "gift") punchline.scrollIntoView({ block: "nearest" });
});

function onGiftRoute() {
  if (currentScreen !== "gift") {
    if (!poemVideo.paused) poemVideo.pause();
    return;
  }
  if (!giftUnlocked()) return;
  if (!state.giftSeen) {
    state.giftSeen = true;
    save();
    celebrateGift();
  }
  if (state.poemWatched) {
    loadPoem();
    punchline.hidden = false;
  }
}

document.addEventListener("game-route", onGiftRoute);
onGiftRoute();
