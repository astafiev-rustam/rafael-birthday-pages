"use strict";

// Timelines use milliseconds, and all artwork uses a 480 × 300 stage.
const CARTOONS = [
  { title: "Мокрое дело", duration: 6100, moment: 4260, color: "#211b39", draw: museum },
  { title: "Кот на дереве", duration: 6000, moment: 4320, color: "#cfdf9e", draw: rescue },
  { title: "Портал в отпуск", duration: 5900, moment: 3600, color: "#f6bc79", draw: vacation },
];

function motion(time, points) {
  for (let index = 1; index < points.length; index++) {
    const [end, to] = points[index];
    if (time > end) continue;
    const [start, from] = points[index - 1];
    const progress = Math.max(0, (time - start) / (end - start));
    const eased = progress * progress * (3 - 2 * progress);
    return from + eased * (to - from);
  }
  return points.at(-1)[1];
}

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx, points, color, width = 4) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

function shape(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function locally(ctx, x, y, angle, draw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  draw();
  ctx.restore();
}

function stick(ctx, x, y, { tilt = 0, mask = false, hat = false, pose = "stand", face = "#fff0cc" } = {}) {
  const ink = "#211c29";
  locally(ctx, x, y, tilt, () => {
    line(ctx, [[0, 16], [0, 51]], ink, 7);
    const arms = pose === "cling" ? [[-24, 1], [-15, 25], [0, 25], [17, 18], [30, 4]]
      : pose === "sneak" ? [[-22, 10], [-17, 25], [0, 25], [18, 37], [26, 24]]
      : [[-20, 43], [-14, 30], [0, 25], [16, 29], [28, 20]];
    const legs = pose === "cling" ? [[-20, 51], [-16, 65], [0, 51], [16, 65], [27, 50]]
      : pose === "jump" ? [[-26, 65], [-16, 50], [0, 51], [17, 63], [28, 58]]
      : [[-19, 81], [-13, 65], [0, 51], [10, 67], [19, 81]];
    line(ctx, arms, ink, 6);
    line(ctx, legs, ink, 6);
    oval(ctx, 0, 0, 20, 19, ink);
    oval(ctx, 0, 0, 16, 15, mask ? "#4c4359" : face);
    if (mask) oval(ctx, 5, -3, 12, 5, "#fff0cc");
    oval(ctx, 4, -3, 2.3, 3, ink);
    oval(ctx, 13, -3, 2.3, 3, ink);
    if (!mask) oval(ctx, 9, 7, pose === "cling" || pose === "jump" ? 4 : 2.5, 3, ink);
    if (hat) {
      oval(ctx, 0, -13, 18, 9, "#e77b28");
      line(ctx, [[-22, -9], [23, -9]], "#ffbe44", 6);
    }
  });
}

function swirl(ctx, x, y, scale, color, light) {
  oval(ctx, x, y, 25 * scale, 8 * scale, color);
  oval(ctx, x - 1 * scale, y - 8 * scale, 18 * scale, 9 * scale, color);
  oval(ctx, x + 2 * scale, y - 16 * scale, 12 * scale, 9 * scale, color);
  shape(ctx, [[x, y - 28 * scale], [x + 10 * scale, y - 16 * scale], [x - 7 * scale, y - 17 * scale]], color);
  line(ctx, [[x - 12 * scale, y - 2 * scale], [x + 8 * scale, y - 2 * scale]], light, 2 * scale);
}

function rays(ctx, x, y, color, scale = 1) {
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const dx = Math.cos(angle) * scale;
    const dy = Math.sin(angle) * scale;
    line(ctx, [[x + dx * 22, y + dy * 22], [x + dx * 35, y + dy * 35]], color, 2.5);
  }
}

function museum(ctx, t) {
  box(ctx, 0, 0, 480, 300, "#23203a");
  box(ctx, 0, 244, 480, 56, "#322a49");
  for (const x of [24, 128, 336, 440]) {
    box(ctx, x, 22, 38, 220, "#312b47");
    box(ctx, x - 5, 26, 48, 9, "#463955");
  }
  shape(ctx, [[206, 0], [268, 0], [345, 244], [132, 244]], "#393250");
  box(ctx, 197, 198, 82, 46, "#c5a3a4");
  box(ctx, 197, 198, 14, 46, "#927785");
  box(ctx, 187, 190, 103, 10, "#e3bab0");
  oval(ctx, 238, 189, 34, 5, "#a93864");
  const targetGone = t > 3500;
  if (!targetGone) swirl(ctx, 237, 182, .72, "#f2b944", "#ffe59a");
  if (t < 1200) rays(ctx, 237, 163, "#f2b944", .72);
  const y = motion(t, [[0, -93], [500, -83], [2000, 84], [4700, 84], [5400, 38], [6100, 26]]);
  line(ctx, [[205, 0], [205, y + 20]], "#a093ad", 2);
  stick(ctx, 205, y, { mask: true, pose: "sneak", tilt: -.2 });
  line(ctx, [[228, y + 24], [243, y + 46], [233, y + 59]], "#e7c5b9", 2);
  if (t >= 2050 && !targetGone) {
    const propX = motion(t, [[2050, 181], [2900, 217], [3500, 231]]);
    swirl(ctx, propX, y + 58, .48, "#9d5e43", "#d28d65");
  }
  const robotX = motion(t, [[0, 527], [2280, 527], [3480, 282], [5050, 282], [6100, 375]]);
  oval(ctx, robotX, 240, 34, 10, "#100d21");
  oval(ctx, robotX, 231, 33, 13, "#ddd0bb");
  oval(ctx, robotX, 226, 32, 10, "#eee0cb");
  oval(ctx, robotX + 19, 228, 4, 3, targetGone ? "#48b796" : "#c88986");
  if (t > 3520 && t < 4060) line(ctx, [[robotX - 5, 223], [robotX, 228], [robotX + 9, 218]], "#198063", 3);
  if (t >= 3950 && t < 4800) {
    const x = motion(t, [[3950, 275], [4280, 242], [4700, 206]]);
    const height = motion(t, [[3950, 216], [4280, 148], [4700, y + 32]]);
    swirl(ctx, x, height, .66, "#e8a935", "#ffe59a");
    swirl(ctx, x + 29, height + 13, .56, "#ae6647", "#e29d71");
    rays(ctx, x + 10, height, "#ffeab7", 1.2);
  } else if (t >= 4800) {
    oval(ctx, 205, y - 18, 9, 4, "#a76647");
  }
}

function cat(ctx, x, y, hat) {
  oval(ctx, x, y + 15, 14, 17, "#ef9b50");
  line(ctx, [[x - 10, y + 20], [x - 25, y + 17], [x - 28, y + 6]], "#b75f45", 5);
  shape(ctx, [[x - 11, y - 6], [x - 14, y - 24], [x - 1, y - 13], [x + 13, y - 23], [x + 13, y - 5]], "#df823f");
  oval(ctx, x, y, 15, 13, "#f3b36d");
  oval(ctx, x - 5, y, 2, 3, "#242032");
  oval(ctx, x + 6, y, 2, 3, "#242032");
  oval(ctx, x + 1, y + 6, 2, 1.5, "#9d4d42");
  if (hat) {
    oval(ctx, x, y - 10, 17, 7, "#db4f44");
    line(ctx, [[x - 18, y - 7], [x + 18, y - 7]], "#fac767");
    line(ctx, [[x + 4, y + 18], [x + 25, y + 7]], "#f3b36d", 6);
  }
}

function rescue(ctx, t) {
  box(ctx, 0, 0, 480, 300, "#d3e5af");
  oval(ctx, 362, 63, 31, 31, "#fff1b3");
  oval(ctx, 31, 249, 168, 42, "#abc789");
  oval(ctx, 407, 265, 220, 62, "#b7c990");
  box(ctx, 0, 275, 480, 25, "#8e9c77");
  line(ctx, [[126, 264], [145, 158], [140, 83]], "#786049", 31);
  line(ctx, [[145, 139], [183, 112], [227, 109]], "#786049", 15);
  oval(ctx, 111, 64, 72, 45, "#658760");
  oval(ctx, 171, 66, 78, 36, "#719865");
  oval(ctx, 153, 41, 56, 26, "#7ca26d");
  if (t < 2400) {
    const lean = motion(t, [[0, .10], [1500, .10], [2350, 1.55]]);
    locally(ctx, 111, 263, lean, () => {
      line(ctx, [[-9, 0], [-9, -142]], "#66706e", 4);
      line(ctx, [[9, 0], [9, -142]], "#66706e", 4);
      for (let step = 12; step < 142; step += 14) line(ctx, [[-9, -step], [9, -step]], "#66706e", 3);
    });
  } else {
    line(ctx, [[21, 270], [129, 270]], "#66706e", 6);
  }
  const fireY = motion(t, [[0, 180], [1450, 88], [3800, 88], [4360, 99], [4870, 112], [5900, 160]]);
  const fireX = motion(t, [[0, 97], [1450, 148], [3800, 148], [4330, 233], [5400, 233]]);
  stick(ctx, fireX, fireY, { hat: true, pose: t > 1530 && t < 4700 ? "cling" : "stand", tilt: t > 3890 && t < 4750 ? -.44 : 0 });
  const truckX = motion(t, [[0, 385], [2700, 385], [3900, 304]]);
  box(ctx, truckX - 70, 224, 97, 42, "#bf494b");
  box(ctx, truckX + 27, 210, 48, 56, "#da6257");
  box(ctx, truckX + 33, 216, 29, 22, "#f8e7bd");
  box(ctx, truckX - 67, 240, 141, 6, "#f9d58b");
  oval(ctx, truckX - 44, 267, 14, 14, "#343043");
  oval(ctx, truckX + 49, 267, 14, 14, "#343043");
  oval(ctx, truckX - 44, 267, 6, 6, "#dfb59c");
  oval(ctx, truckX + 49, 267, 6, 6, "#dfb59c");
  const lift = motion(t, [[0, 214], [3130, 214], [4120, 125], [4850, 125], [5900, 189]]);
  if (t > 3030) {
    line(ctx, [[truckX - 33, 225], [truckX + 1, lift + 43], [truckX - 57, lift + 11]], "#5c565c", 8);
    box(ctx, truckX - 83, lift, 54, 20, "#a24745");
    line(ctx, [[truckX - 83, lift], [truckX - 30, lift]], "#edbf68");
    cat(ctx, truckX - 59, lift - 12, true);
  } else {
    const catX = motion(t, [[0, 203], [1410, 203], [2180, 141], [3000, 416]]);
    const catY = motion(t, [[0, 91], [1420, 91], [2200, 217], [2960, 220]]);
    cat(ctx, catX, catY, false);
  }
  if (t > 3810) {
    stick(ctx, 431, 188, { hat: true });
    box(ctx, 398, 196, 14, 21, "#333144");
    if (t < 4720) rays(ctx, 401, 197, "#fff1ae", .55);
  }
}

function suitcase(ctx, x, y, color) {
  line(ctx, [[x - 7, y], [x - 7, y - 7], [x + 7, y - 7], [x + 7, y]], "#30304a", 3);
  box(ctx, x - 16, y, 32, 23, color);
  box(ctx, x - 10, y, 3, 23, "#f7dcaa");
  box(ctx, x + 8, y, 3, 23, "#f7dcaa");
}

function vacation(ctx, t) {
  box(ctx, 0, 0, 480, 300, "#f8ce9a");
  oval(ctx, 85, 73, 41, 41, "#ffedac");
  oval(ctx, 119, 245, 178, 62, "#e5a574");
  oval(ctx, 386, 235, 216, 58, "#f3bb7d");
  box(ctx, 0, 248, 480, 52, "#e3a067");
  line(ctx, [[175, 247], [175, 191]], "#675260", 7);
  box(ctx, 149, 171, 52, 29, "#714b50");
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "#ffe9c6";
  ctx.fillText("МОРЕ", 157, 190);
  const portalSize = motion(t, [[0, 0], [1730, 0], [2400, 1], [4700, 1], [5370, 0]]);
  if (portalSize > 0) {
    ctx.save();
    ctx.translate(319, 155);
    ctx.scale(portalSize, portalSize);
    oval(ctx, 0, 0, 74, 105, "#594678");
    oval(ctx, 0, 0, 66, 97, "#87d5c7");
    ctx.beginPath();
    ctx.ellipse(0, 0, 63, 94, 0, 0, Math.PI * 2);
    ctx.clip();
    box(ctx, -65, 20, 130, 90, "#fbe5aa");
    box(ctx, -65, 0, 130, 22, "#58baa8");
    line(ctx, [[22, 57], [11, 37], [-24, 37], [-33, 20]], "#cf6b65", 5);
    line(ctx, [[-16, 37], [-22, 58]], "#8d6566", 3);
    line(ctx, [[36, 44], [36, 7]], "#92715d", 2);
    shape(ctx, [[21, 12], [36, 0], [50, 12]], "#e46b63");
    if (t > 3920) stick(ctx, -2, 22, { tilt: -1.2, pose: "jump" });
    ctx.restore();
  }
  if (t < 4090) {
    const x = motion(t, [[0, 39], [1640, 139], [2460, 157], [3590, 263], [4090, 333]]);
    const y = motion(t, [[0, 163], [2510, 163], [3540, 111], [4080, 158]]);
    stick(ctx, x, y, { pose: t > 2500 ? "jump" : "stand", tilt: t > 2500 ? .6 : .08 });
    suitcase(ctx, x - 22, y + 53, "#8e514b");
  }
  if (t > 2580) {
    const x = motion(t, [[2580, 325], [3570, 302], [4620, 401], [5900, 413]]);
    const y = motion(t, [[2580, 182], [3540, 104], [4520, 213]]);
    if (t > 4510) box(ctx, x - 54, 244, 93, 8, "#b95d63");
    oval(ctx, x, y, 23, 13, "#558e91");
    shape(ctx, [[x + 12, y], [x + 35, y - 13], [x + 33, y + 10]], "#47777f");
    oval(ctx, x - 11, y - 3, 6, 6, "#fbf3c8");
    oval(ctx, x - 13, y - 3, 2.5, 3, "#292738");
    suitcase(ctx, x + 17, y + 15, "#846090");
    if (t < 3990) {
      oval(ctx, x + 27, y + 27, 3, 6, "#5caba5");
      oval(ctx, x + 37, y + 27, 3, 5, "#5caba5");
    }
  }
}
