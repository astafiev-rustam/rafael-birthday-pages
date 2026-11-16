"use strict";

const GROUND = 190;
const CREW = [
  { name: "Ростик", hair: "#e6b36b", cut: "sweep", shirt: "#767b9d", detail: "#fff2dc", skin: "#f2b98a", suit: true },
  { name: "Валера", hair: "#8e583b", cut: "sweep", shirt: "#222738", detail: "#719dda", skin: "#e0a17c", glasses: "#252330", beard: true, bag: true },
  { name: "Валера", hair: "#3b292c", cut: "sweep", shirt: "#272735", detail: "#ddd4bf", skin: "#dda47b", beard: true, stripe: true },
  { name: "Кирюша", hair: "#3c2828", cut: "sweep", shirt: "#282a40", detail: "#fff0d2", skin: "#e9a477", suit: true, glasses: "#caad75", beard: true },
  { name: "Дима", hair: "#392631", cut: "part", shirt: "#6fc4dc", detail: "#e5eff5", skin: "#eeb087", robe: true },
  { name: "Егор", hair: "#4a3433", shirt: "#262536", detail: "#c9c3b1", skin: "#e9aa81", glasses: "#302633", stripe: true },
  { name: "Рустам", hair: "#51372f", shirt: "#9baabd", detail: "#fff0d7", skin: "#e5a47b", suit: true, mic: true },
];
const RAFAEL = { hair: "#312331", shirt: "#a65940", detail: "#c17653", skin: "#eeb082", glasses: "#a86739", beard: true };

const LEVELS = [
  {
    name: "Офис", exit: "Лифт", theme: "office", length: 1300, gate: 1205, checkpoint: 570,
    ground: [[0, 384], [426, 781], [827, 1300]],
    platforms: [[155, 158, 51], [290, 149, 56], [476, 152, 68], [642, 151, 61], [921, 154, 67], [1081, 149, 65]],
    friends: [{ id: 1, x: 509, y: 152 }, { id: 4, x: 1030, y: GROUND }],
    foes: [
      { type: "calendar", name: "5/2", x: 246, range: 38, period: 145 },
      { type: "boss", name: "Начальник дурак", x: 695, range: 39, period: 180, phase: 45 },
      { type: "wallet", name: "Мало ЗП", x: 949, range: 15, period: 147, phase: 30 },
    ],
  },
  {
    name: "Парк", exit: "К метро", theme: "park", length: 1390, gate: 1290, checkpoint: 630,
    ground: [[0, 346], [391, 818], [870, 1102], [1148, 1390]],
    platforms: [[165, 153, 57], [410, 153, 52], [535, 149, 72], [703, 153, 73], [916, 150, 61], [1190, 150, 66]],
    friends: [{ id: 3, x: 563, y: 149 }, { id: 6, x: 990, y: GROUND }],
    foes: [
      { type: "squirrel", name: "Белка в лесу", x: 249, range: 43, period: 130 },
      { type: "cloud", name: "Дождь", x: 723, range: 50, period: 175, phase: 20 },
      { type: "coal", name: "Сгоревший шашлык", x: 1044, range: 32, period: 116, phase: 30 },
    ],
  },
  {
    name: "Китай-город", exit: "НЕБАР", theme: "city", length: 1550, gate: 1432, checkpoint: 749,
    ground: [[0, 424], [471, 854], [901, 1163], [1214, 1550]],
    platforms: [[174, 153, 64], [325, 148, 59], [503, 152, 64], [675, 150, 59], [924, 151, 75], [1074, 149, 65], [1260, 151, 68]],
    friends: [{ id: 5, x: 362, y: 148 }, { id: 2, x: 783, y: GROUND }, { id: 0, x: 1293, y: 151 }],
    foes: [
      { type: "fish", name: "Золотая вобла", x: 256, range: 48, period: 142 },
      { type: "shots", name: "Се*с шотов", x: 604, range: 40, period: 159, phase: 20 },
      { type: "karaoke", name: "Караоке", x: 992, range: 53, period: 150, phase: 30 },
    ],
  },
];

function enemyAt(foe, tick) {
  const phase = (tick + (foe.phase ?? 0)) % foe.period / foe.period;
  const wave = Math.sin(phase * Math.PI * 2);
  const hop = Math.sin(phase * Math.PI);
  const body = { ...foe, center: foe.x + wave * foe.range, phase, width: 23, height: 17, bottom: GROUND };
  switch (foe.type) {
    case "boss":
      body.center = foe.x + (phase < .55 ? -1 : Math.cos((phase - .55) / .45 * Math.PI * 2) * -1) * foe.range;
      body.height = phase > .43 && phase < .55 ? 23 : 17;
      break;
    case "wallet":
      body.bottom -= phase < .45 ? Math.round(90 * (1 - (phase / .45) ** 2)) : Math.round(Math.abs(Math.sin((phase - .45) * 12)) * 15);
      break;
    case "squirrel":
      body.bottom -= 12 + hop * 42;
      break;
    case "cloud":
      body.bottom = 123;
      body.width = 38;
      body.raining = phase > .25 && phase < .67;
      break;
    case "coal":
    case "fish":
      body.bottom -= Math.abs(Math.sin(phase * Math.PI * 2)) * (foe.type === "fish" ? 42 : 17);
      break;
    case "shots":
      body.width = 54;
      body.height = 13;
      break;
    case "karaoke":
      body.bottom -= 21;
      body.center = foe.x;
      body.note = phase > .25 && phase < .82 ? { x: foe.x - (phase - .25) * 140, y: GROUND - 19 } : null;
      break;
  }
  return body;
}
