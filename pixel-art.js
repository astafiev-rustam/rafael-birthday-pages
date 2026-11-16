"use strict";

const VIEW_W = 384;
const VIEW_H = 224;
const PALETTES = {
  office: { sky: "#a5a5ba", floor: "#65556b", edge: "#c9a2a3", tile: "#77667e", accent: "#ffd38d" },
  park: { sky: "#a9cbb9", floor: "#6e514c", edge: "#789457", tile: "#856353", accent: "#fff2af" },
  city: { sky: "#272644", floor: "#4b3d54", edge: "#9b6c83", tile: "#63516b", accent: "#ff9e9c" },
};

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function label(ctx, value, x, y, { size = 8, color = "#fff0d6", background = "#292138", align = "center" } = {}) {
  ctx.font = "bold " + size + "px sans-serif";
  ctx.textBaseline = "top";
  ctx.textAlign = align;
  const width = Math.ceil(ctx.measureText(value).width);
  if (background) rect(ctx, background, x - (align === "center" ? width / 2 : 0) - 3, y - 2, width + 6, size + 4);
  ctx.fillStyle = color;
  ctx.fillText(value, Math.floor(x), Math.floor(y));
}

function backdrop(ctx, level, camera, tick) {
  const palette = PALETTES[level.theme];
  rect(ctx, palette.sky, 0, 0, VIEW_W, VIEW_H);
  if (level.theme === "office") {
    rect(ctx, "#d5ccd2", 0, 22, VIEW_W, 17);
    rect(ctx, "#95869f", 0, 132, VIEW_W, 59);
    for (let x = -((camera * .45) % 104); x < VIEW_W + 104; x += 104) {
      rect(ctx, "#5d5c79", x + 12, 43, 78, 72);
      rect(ctx, "#c4d3d4", x + 17, 48, 68, 60);
      rect(ctx, "#acbbc8", x + 17, 83, 68, 25);
      rect(ctx, "#919db1", x + 25, 74, 16, 34);
      rect(ctx, "#9dabb9", x + 53, 66, 19, 42);
      rect(ctx, "#f1ded8", x + 50, 48, 3, 60);
      rect(ctx, "#dec7ca", x + 2, 119, 90, 4);
      rect(ctx, "#ffdcae", x + 25, 28, 34, 5);
    }
    for (let x = 78 - (camera % 153); x < VIEW_W; x += 153) {
      rect(ctx, "#55465c", x, 164, 61, 5);
      rect(ctx, "#645269", x + 4, 169, 4, 21);
      rect(ctx, "#645269", x + 52, 169, 4, 21);
      rect(ctx, "#544c65", x + 14, 149, 22, 13);
      rect(ctx, "#76b8b7", x + 17, 151, 16, 7);
      rect(ctx, "#ddc3a4", x + 45, 155, 5, 9);
    }
  } else if (level.theme === "park") {
    rect(ctx, "#f6e6ac", 267 - camera * .09, 29, 34, 33);
    rect(ctx, "#f6e6ac", 261 - camera * .09, 36, 46, 18);
    for (let x = -(camera * .28 % 74); x < VIEW_W + 52; x += 74) {
      rect(ctx, "#8bab88", x, 100, 91, 90);
      rect(ctx, "#8bab88", x + 15, 85, 52, 50);
    }
    for (let x = 26 - (camera * .66 % 112); x < VIEW_W + 62; x += 112) {
      rect(ctx, "#66554e", x + 31, 104, 10, 90);
      rect(ctx, "#647753", x, 84, 78, 32);
      rect(ctx, "#708857", x + 10, 69, 56, 40);
      rect(ctx, "#91a364", x + 13, 70, 35, 13);
      rect(ctx, "#a2b273", x + 58, 99, 11, 6);
    }
    for (let x = 40 - camera % 187; x < VIEW_W; x += 187) {
      rect(ctx, "#78554f", x, 170, 58, 5);
      rect(ctx, "#78554f", x + 6, 173, 4, 17);
      rect(ctx, "#78554f", x + 46, 173, 4, 17);
      rect(ctx, "#aa7861", x + 7, 161, 43, 5);
      rect(ctx, "#ede29c", x + 56, 185, 3, 3);
      rect(ctx, "#efb5ac", x + 64, 182, 3, 3);
    }
  } else {
    for (let i = 0; i < 27; i++) rect(ctx, i % 3 ? "#776887" : "#e5a995", (i * 61 + 900 - Math.floor(camera * .12)) % VIEW_W, 9 + i * 13 % 76, 2, 1);
    rect(ctx, "#dca79f", 286 - camera * .10, 27, 29, 24);
    rect(ctx, "#dca79f", 291 - camera * .10, 22, 19, 34);
    for (let x = -(camera * .32 % 89); x < VIEW_W + 62; x += 89) {
      rect(ctx, "#373049", x + 9, 76, 58, 116);
      rect(ctx, "#373049", x + 18, 70, 41, 8);
      for (let i = 0; i < 6; i++) rect(ctx, "#625172", x + 16 + i % 3 * 15, 85 + Math.floor(i / 3) * 18, 7, 9);
    }
    for (let x = -(camera % 135); x < VIEW_W + 80; x += 135) {
      rect(ctx, "#624458", x, 108, 103, 81);
      rect(ctx, "#986478", x - 3, 108, 110, 5);
      rect(ctx, "#815871", x + 7, 119, 88, 3);
      rect(ctx, "#342b42", x + 16, 151, 18, 38);
      rect(ctx, "#7e485d", x + 44, 153, 42, 24);
      rect(ctx, "#d28383", x + 47, 156, 36, 16);
      rect(ctx, "#8c5b71", x + 62, 156, 2, 16);
      rect(ctx, "#9f776f", x + 113, 156, 3, 34);
      rect(ctx, tick % 120 < 100 ? "#eab286" : "#aa7985", x + 110, 152, 9, 5);
    }
  }
}

function terrain(ctx, level, camera) {
  const p = PALETTES[level.theme];
  for (const [start, end] of level.ground) {
    const x = start - camera;
    rect(ctx, p.floor, x, GROUND, end - start, VIEW_H - GROUND);
    rect(ctx, p.edge, x, GROUND, end - start, 4);
    for (let block = Math.max(start + 5, Math.floor(camera / 24) * 24 + 5); block < Math.min(end - 7, camera + VIEW_W + 24); block += 24) {
      rect(ctx, p.tile, block - camera, 201 + Math.floor(block / 24) % 3 * 4, 7, 3);
    }
  }
  for (const [worldX, y, w] of level.platforms) {
    const x = worldX - camera;
    rect(ctx, p.floor, x, y, w, 9);
    rect(ctx, p.edge, x, y, w, 3);
    rect(ctx, p.tile, x + 5, y + 5, w - 10, 2);
  }
}

function door(ctx, level, camera, open) {
  const x = level.gate - camera;
  const p = PALETTES[level.theme];
  if (level.theme === "city") {
    rect(ctx, "#312739", x - 39, 110, 79, 80);
    rect(ctx, "#825567", x - 42, 105, 85, 6);
    rect(ctx, open ? "#a34c57" : "#57394e", x - 38, 119, 77, 18);
    rect(ctx, "#bd7276", x - 33, 138, 67, 3);
    rect(ctx, "#15121f", x - 16, 143, 32, 47);
    if (open) rect(ctx, "#cc6c65", x - 9, 151, 18, 38);
    label(ctx, "НЕБАР", x, 121, { size: 11, color: open ? "#fff0b2" : "#db9a9f", background: null });
  } else {
    rect(ctx, "#4b405a", x - 21, 131, 42, 59);
    rect(ctx, open ? "#756354" : "#3b354d", x - 16, 136, 32, 54);
    if (open) rect(ctx, "#b89268", x - 10, 140, 20, 50);
    rect(ctx, p.accent, x + 9, 160, 3, 6);
    label(ctx, level.exit, x, 119);
  }
}

function pixelPerson(ctx, who, x, bottom, facing = 1, step = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(bottom));
  ctx.scale(facing, 1);
  const dark = "#292233";
  const walk = step === 1 ? 2 : step === 2 ? -2 : 0;
  rect(ctx, dark, -7, -24, 13, 13);
  rect(ctx, who.skin, -5, -22, 10, 10);
  rect(ctx, who.hair, -7, -25, 12, 5);
  rect(ctx, who.hair, -7, -21, 3, 4);
  if (who.cut) {
    rect(ctx, who.hair, -6, -27, who.cut === "part" ? 10 : 13, 3);
    rect(ctx, who.hair, 3, -22, 3, 2);
  }
  if (who.beard) rect(ctx, who.hair, -4, -14, 9, 3);
  rect(ctx, dark, 0, -18, 2, 1);
  rect(ctx, dark, 4, -18, 2, 1);
  if (who.glasses) {
    rect(ctx, who.glasses, -2, -19, 9, 1);
    rect(ctx, who.glasses, -2, -18, 1, 3);
    rect(ctx, who.glasses, 6, -18, 1, 3);
    rect(ctx, who.glasses, -2, -16, 9, 1);
  }
  rect(ctx, dark, -7, -12, 14, 9);
  rect(ctx, who.shirt, -6, -12, 12, 8);
  rect(ctx, who.detail, -3, -11, who.suit ? 6 : 3, who.suit ? 4 : 6);
  if (who.stripe) rect(ctx, who.detail, -6, -9, 12, 2);
  if (who.robe) rect(ctx, who.shirt, -5, -6, 10, 5);
  if (who.bag) rect(ctx, who.detail, -6, -7, 5, 5);
  if (who.mic) {
    rect(ctx, "#423855", 7, -13, 2, 6);
    rect(ctx, "#9f91a1", 6, -14, 4, 3);
  }
  rect(ctx, "#262334", -6 - walk, -4, 5, 4);
  rect(ctx, "#262334", 1 + walk, -4, 5, 4);
  ctx.restore();
}

function enemyArt(ctx, enemy, camera, tick) {
  const x = Math.round(enemy.center - camera);
  const y = Math.round(enemy.bottom);
  if (x < -65 || x > VIEW_W + 65) return;
  const ink = "#3a203b";
  const gold = "#f6b15c";
  const peach = "#ffd69b";
  const w = enemy.width;
  switch (enemy.type) {
    case "calendar":
      rect(ctx, ink, x - 12, y - 17, 24, 17);
      rect(ctx, "#f2c8a2", x - 10, y - 14, 20, 12);
      rect(ctx, "#a84e57", x - 10, y - 15, 20, 4);
      label(ctx, "5/2", x, y - 10, { size: 7, background: null, color: ink });
      break;
    case "boss":
      rect(ctx, "#a65b72", x - 12, y - enemy.height, 24, enemy.height - 4);
      rect(ctx, "#a65b72", x + 4, y - 5, 5, 5);
      label(ctx, "!!", x, y - enemy.height + 3, { size: 10, background: null });
      break;
    case "wallet":
      rect(ctx, ink, x - 12, y - 15, 24, 15);
      rect(ctx, "#945753", x - 10, y - 13, 20, 11);
      rect(ctx, gold, x + 3, y - 9, 6, 4);
      break;
    case "squirrel":
      rect(ctx, "#a35945", x - 12, y - 17, 9, 14);
      rect(ctx, "#cb754c", x - 8, y - 11, 16, 11);
      rect(ctx, "#d18556", x + 1, y - 16, 10, 11);
      rect(ctx, ink, x + 7, y - 12, 2, 2);
      break;
    case "cloud":
      rect(ctx, "#727593", x - 19, y - 12, 38, 12);
      rect(ctx, "#858cac", x - 10, y - 17, 20, 8);
      if (enemy.raining) for (let i = 0; i < 8; i++) rect(ctx, "#717ab6", x - 15 + (i * 13 % 31), y + ((i * 17 + tick * 4) % 61), 2, 5);
      break;
    case "coal":
      rect(ctx, ink, x - 11, y - 12, 22, 12);
      rect(ctx, "#e17255", x - 8, y - 8, 15, 6);
      rect(ctx, gold, x - 5, y - 12, 5, 4);
      rect(ctx, "#fff0af", x + 5, y - 15, 3, 3);
      break;
    case "fish":
      rect(ctx, "#c77d52", x - 13, y - 15, 7, 13);
      rect(ctx, gold, x - 9, y - 13, 19, 11);
      rect(ctx, peach, x - 6, y - 12, 5, 7);
      rect(ctx, ink, x + 5, y - 11, 2, 2);
      break;
    case "shots":
      rect(ctx, "#ab697c", x - w / 2, y - 3, w, 3);
      for (let i = 0; i < 6; i++) {
        rect(ctx, peach, x - 25 + i * 9, y - 13, 6, 10);
        rect(ctx, i % 2 ? "#ba5a6a" : "#d48462", x - 24 + i * 9, y - 9, 4, 6);
      }
      break;
    case "karaoke":
      rect(ctx, "#846b9c", x - 7, y - 17, 14, 10);
      rect(ctx, "#a587ae", x - 5, y - 15, 10, 2);
      rect(ctx, "#7e587e", x - 3, y - 7, 6, 12);
      if (enemy.note) {
        const nx = enemy.note.x - camera;
        rect(ctx, "#f1a1bb", nx - 5, enemy.note.y - 4, 9, 5);
        rect(ctx, "#f1a1bb", nx + 1, enemy.note.y - 12, 3, 10);
        rect(ctx, "#f1a1bb", nx + 2, enemy.note.y - 12, 6, 3);
      }
      break;
  }
  if (enemy.type !== "calendar") label(ctx, enemy.name, Math.max(46, Math.min(VIEW_W - 46, x)), y - enemy.height - 10, { size: 7 });
}
