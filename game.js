"use strict";

const TARGET = 20_000;
const CAMERA_TARGET = 5;
const SAVE_KEY = "rafael-birthday-v1";
const numbers = new Intl.NumberFormat("ru-RU");
const format = (value) => numbers.format(value);
const byId = (id) => document.getElementById(id);

const tapBoosts = [
  { name: "Детский труд - бесплатный труд", description: "Снять рилс с братом, сестрой или любым несовершеннолетним.", icon: "video", cost: 20, power: 3 },
  { name: "У нас есть мэдкид дома", description: "Сходить на концерт Габа и затащить туда друзей.", icon: "ticket", cost: 140, power: 8 },
  { name: "Самый лучший город Земли", description: "Улететь до серьёзки.", icon: "plane", cost: 650, power: 20 },
  { name: "Не могу говорить, няшимся", description: "Провести выходные с семьёй.", icon: "heart", cost: 2800, power: 50 },
];
const passiveBoosts = [
  { name: "Семейный чат", icon: "chat", cost: 50, power: 5 },
  { name: "Совместное фото", icon: "camera", cost: 450, power: 25 },
  { name: "Все в сборе", icon: "people", cost: 2200, power: 100 },
];

function readState() {
  const blank = { earned: 0, balance: 0, tapCount: 0, passiveCount: 0 };
  const emptyPlatform = { level: 0, checkpoint: false, cleared: false, rescued: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved && Object.keys(blank).every((key) => Number.isSafeInteger(saved[key]) && saved[key] >= 0)
      && saved.balance <= saved.earned && saved.tapCount <= tapBoosts.length
      && saved.passiveCount <= passiveBoosts.length) {
      const shots = Array.isArray(saved.shots) ? saved.shots : [];
      const platform = saved.platform;
      const validLevel = Number.isInteger(platform?.level) && Boolean(LEVELS[platform.level]);
      const rescued = new Set(Array.isArray(platform?.rescued) ? platform.rescued : []);
      const allowed = validLevel ? LEVELS.slice(0, platform.level + 1).flatMap((level) => level.friends.map((friend) => friend.id)) : [];
      const previous = validLevel ? LEVELS.slice(0, platform.level).flatMap((level) => level.friends) : [];
      const validPlatform = validLevel && previous.every((friend) => rescued.has(friend.id));
      return {
        ...blank,
        ...saved,
        platform: validPlatform ? {
          level: platform.level,
          checkpoint: platform.checkpoint === true,
          cleared: platform.cleared === true && platform.level < LEVELS.length - 1
            && LEVELS[platform.level].friends.every((friend) => rescued.has(friend.id)),
          rescued: allowed.filter((id) => rescued.has(id)),
        } : emptyPlatform,
        friendsWon: saved.friendsWon === true && CREW.every((_, id) => rescued.has(id)) && validPlatform,
        poemWatched: saved.poemWatched === true,
        giftSeen: saved.giftSeen === true,
        shots: CARTOONS.map((scene, index) => {
          const shot = shots[index];
          return shot && [1, 2].includes(shot.score) && Number.isFinite(shot.time)
            && shot.time >= 0 && shot.time <= scene.duration ? shot : null;
        }),
      };
    }
  } catch {
    // The current session is playable when browser storage is unavailable.
  }
  return { ...blank, shots: CARTOONS.map(() => null), platform: emptyPlatform };
}

const state = readState();
const completed = () => state.earned >= TARGET;
const cameraScore = () => state.shots.reduce((sum, shot) => sum + (shot?.score ?? 0), 0);
const cameraCompleted = () => cameraScore() >= CAMERA_TARGET;
const friendsCompleted = () => state.friendsWon === true;
const giftUnlocked = () => completed() && cameraCompleted() && friendsCompleted();
const tapRate = () => state.tapCount ? tapBoosts[state.tapCount - 1].power : 1;
const passiveRate = () => passiveBoosts.slice(0, state.passiveCount)
  .reduce((total, boost) => total + boost.power, 0);
const screens = [...document.querySelectorAll(".screen")];
let currentScreen = "";
let passiveClock = performance.now();

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Keep the current game available if the browser denies storage access.
  }
}

function icon(id) {
  return '<svg class="icon" aria-hidden="true"><use href="#' + id + '"/></svg>';
}

function makeShop(listId, boosts, countKey, passive) {
  const list = byId(listId);
  return boosts.map((boost, index) => {
    const item = document.createElement("li");
    item.className = "boost-row";
    const effect = passive ? "+" + boost.power + " в секунду" : boost.power + " за тап";
    const details = boost.description ? boost.description + " " + effect + "." : effect;
    item.innerHTML = icon(boost.icon)
      + '<div><strong class="boost-name"></strong><span class="boost-details"></span></div>'
      + '<div><button type="button" class="boost-buy">' + format(boost.cost) + " " + icon("heart")
      + '</button><span class="boost-state" hidden></span></div>';
    item.querySelector(".boost-name").textContent = boost.name;
    item.querySelector(".boost-details").textContent = details;
    const button = item.querySelector("button");
    button.setAttribute("aria-label", "Купить «" + boost.name + "» за " + format(boost.cost) + " сердечек");
    button.addEventListener("click", () => {
      if (completed() || state[countKey] !== index || state.balance < boost.cost) return;
      state.balance -= boost.cost;
      state[countKey]++;
      if (passive && index === 0) passiveClock = performance.now();
      byId("shop-feedback").textContent = "Куплено: «" + boost.name + "». " + effect + ".";
      save();
      render();
    });
    list.append(item);
    return { boost, button, status: item.querySelector(".boost-state"), countKey, index };
  });
}

const shop = [
  ...makeShop("tap-shop", tapBoosts, "tapCount", false),
  ...makeShop("passive-shop", passiveBoosts, "passiveCount", true),
];

function render() {
  byId("progress").value = state.earned;
  byId("progress-count").textContent = format(Math.min(TARGET, state.earned)) + " / " + format(TARGET);
  byId("balance").textContent = format(state.balance);
  byId("tap-rate").textContent = "+" + tapRate() + " за тап";
  byId("passive-rate").textContent = "+" + passiveRate() + " в секунду";
  for (const { boost, button, status, countKey, index } of shop) {
    const count = state[countKey];
    button.disabled = completed() || count !== index || state.balance < boost.cost;
    status.hidden = count === index;
    status.textContent = count > index ? "Куплено" : "Закрыто";
  }
}

function revealImage(id, file) {
  const image = byId(id);
  if (!image.getAttribute("src")) image.src = "assets/" + file;
  image.hidden = false;
}

function unlockSlot(game, href, collected) {
  const slot = byId(game + "-slot");
  slot.href = href;
  slot.removeAttribute("aria-disabled");
  slot.classList.remove("slot-later");
  slot.classList.add("slot-current");
  byId(game + "-slot-mark").setAttribute("href", collected ? "#check" : "#arrow");
  byId(game + "-status").textContent = collected ? "Фигурка получена" : "Можно играть";
}

function renderCollection() {
  const count = Number(completed()) + Number(cameraCompleted()) + Number(friendsCompleted());
  byId("collection-count").textContent = count + " из 3 фигурок";
  byId("gift-progress").textContent = (count === 1 ? "Собрана " : "Собрано ") + count + " из 3 фигурок.";
  if (completed()) {
    unlockSlot("family", "#reward", true);
    unlockSlot("camera", cameraCompleted() ? "#camera-reward" : "#camera-game", cameraCompleted());
    byId("hero-action").href = giftUnlocked() ? "#gift" : cameraCompleted() ? "#friends" : "#camera-game";
    byId("hero-action").firstChild.textContent = giftUnlocked() ? "Открыть подарок " : "Продолжить ";
    byId("hero-silhouette").hidden = true;
    revealImage("hero-image", "rafael-family-box.png");
    revealImage("family-reward-image", "rafael-family-box.png");
    revealImage("family-slot-image", "rafael-family-box.png");
  }
  if (completed() && cameraCompleted()) {
    unlockSlot("friends", friendsCompleted() ? "#friends-reward" : "#friends", friendsCompleted());
    revealImage("camera-reward-image", "rafael-influencer-box.png");
    revealImage("camera-slot-image", "rafael-influencer-box.png");
  }
  if (friendsCompleted()) {
    revealImage("friends-reward-image", "rafael-friend-box.png");
    revealImage("friends-slot-image", "rafael-friend-box.png");
  }
  byId("gift-title").textContent = giftUnlocked() ? "Подарок открыт!" : "Основной подарок";
  byId("gift-progress").hidden = giftUnlocked();
  byId("gift-back").hidden = giftUnlocked();
  byId("poem-start").hidden = !giftUnlocked();
  byId("gift-panel").classList.toggle("gift-open", giftUnlocked());
}

function route() {
  const requested = location.hash.slice(1);
  let page = requested;
  if (page === "family" && completed()) page = "reward";
  if (page === "reward" && !completed()) page = "family";
  if (page === "camera-reward" && !cameraCompleted()) page = "camera-game";
  if ((page === "camera-game" || page === "camera-reward") && !completed()) page = "shelf";
  if (page === "friends-reward" && !friendsCompleted()) page = "friends";
  if ((page === "friends" || page === "friends-reward") && (!completed() || !cameraCompleted())) page = "shelf";
  if (page === "friends" && friendsCompleted()) page = "friends-reward";
  if (!screens.some((screen) => screen.id === page)) page = "shelf";
  if (requested && requested !== page) history.replaceState(null, "", "#" + page);
  const previousScreen = currentScreen;
  currentScreen = page;
  if (page === previousScreen) return;
  for (const screen of screens) screen.hidden = screen.id !== page;
  passiveClock = performance.now();
  window.scrollTo(0, 0);
  if (previousScreen && !byId(page).contains(document.activeElement)) {
    byId(page + "-title").focus({ preventScroll: true });
  }
  document.dispatchEvent(new Event("game-route"));
}

function collect(amount) {
  state.earned += amount;
  state.balance += amount;
  save();
  render();
  if (completed()) {
    renderCollection();
    location.replace("#reward");
  }
}

byId("tap").addEventListener("click", () => {
  if (completed()) return;
  const amount = tapRate();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.textContent = "+" + amount;
    spark.style.left = (43 + Math.random() * 15) + "%";
    byId("tap-effects").append(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  }
  collect(amount);
});

window.setInterval(() => {
  if (currentScreen !== "family" || document.hidden || completed()) return;
  const elapsedSeconds = Math.floor((performance.now() - passiveClock) / 1000);
  if (!elapsedSeconds) return;
  passiveClock += elapsedSeconds * 1000;
  const income = passiveRate() * elapsedSeconds;
  if (income) collect(income);
}, 200);

document.addEventListener("visibilitychange", () => { passiveClock = performance.now(); });
window.addEventListener("hashchange", route);
render();
renderCollection();
route();
