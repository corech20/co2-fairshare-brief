// Build-Zeit-Generator für die Hero-Illustration:
// ein Wiesbadener Altbau im Schnitt, vom Dachboden bis zum Keller, plus Garage und Transporter.
// Jede Zone trägt die CSS-Variable --t (0 = voll, 1 = geräumt); app.js steuert sie über den Regler.

const n = (v) => Math.round(v * 10) / 10;
const at = (o = {}) => Object.entries(o).map(([k, v]) => ` ${k}="${v}"`).join('');
const R = (x, y, w, h, o) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${at(o)}/>`;
const L = (x1, y1, x2, y2, o) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${at(o)}/>`;
const C = (cx, cy, r, o) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${at(o)}/>`;
const P = (d, o) => `<path d="${d}"${at(o)}/>`;
const PG = (pts, o) => `<polygon points="${pts.map((p) => `${n(p[0])},${n(p[1])}`).join(' ')}"${at(o)}/>`;

/* ---------- Gegenstände (x = linke Kante, yb = Fußboden) ---------- */
const box = (x, yb, w, h) =>
  R(x, yb - h, w, h, { class: 'k', rx: 1 }) +
  L(x + w / 2, yb - h, x + w / 2, yb - h + h * 0.4, { class: 'kt' }) +
  R(x + w * 0.6, yb - h * 0.48, w * 0.26, h * 0.24, { class: 'kl' });

const wardrobe = (x, yb, w, h) =>
  R(x, yb - h, w, h - 4) +
  R(x - 2, yb - h - 3, w + 4, 4, { rx: 1 }) +
  L(x + w / 2, yb - h + 1, x + w / 2, yb - 4) +
  C(x + w / 2 - 4, yb - h / 2, 1.4, { class: 'dot' }) +
  C(x + w / 2 + 4, yb - h / 2, 1.4, { class: 'dot' }) +
  R(x + 2, yb - 4, w - 4, 4);

const bed = (x, yb, w) =>
  R(x, yb - 44, 5, 44, { rx: 2 }) +
  R(x + w - 4, yb - 24, 4, 24, { rx: 1.5 }) +
  R(x + 5, yb - 23, w - 9, 11, { rx: 2, class: 'w' }) +
  R(x + 8, yb - 30, 22, 8, { rx: 4, class: 'w' }) +
  P(`M${n(x + 32)} ${n(yb - 23)} q${n((w - 40) / 2)} -8 ${n(w - 40)} 0 v8 h${n(-(w - 40))}z`, { class: 'lb' }) +
  R(x + 5, yb - 12, w - 9, 6) +
  L(x + 9, yb - 6, x + 9, yb) + L(x + w - 9, yb - 6, x + w - 9, yb);

const nightstand = (x, yb) =>
  R(x, yb - 22, 20, 22, { rx: 1 }) + L(x, yb - 11, x + 20, yb - 11) +
  C(x + 10, yb - 16.5, 1.2, { class: 'dot' }) + C(x + 10, yb - 5.5, 1.2, { class: 'dot' }) +
  L(x + 10, yb - 22, x + 10, yb - 32) +
  PG([[x + 3, yb - 32], [x + 17, yb - 32], [x + 13.5, yb - 43], [x + 6.5, yb - 43]], { class: 'w' });

const frame = (x, y, w, h) =>
  R(x, y, w, h, { class: 'w' }) + R(x + 3, y + 3, w - 6, h - 6, { class: 'lb' }) +
  P(`M${n(x + 3)} ${n(y + h - 3)} l${n((w - 6) * 0.35)} ${n(-(h - 6) * 0.5)} l${n((w - 6) * 0.25)} ${n((h - 6) * 0.25)} l${n((w - 6) * 0.15)} ${n(-(h - 6) * 0.15)} l${n((w - 6) * 0.25)} ${n((h - 6) * 0.4)}`, { class: 'n' });

const shelf = (x, yb, w, h, rows, kind = 'books') => {
  let s = R(x, yb - h, w, h, { class: 'd' });
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    const fy = yb - h + rh * (r + 1);
    let cx = x + 2.5; let j = 0;
    while (cx < x + w - 7) {
      if (kind === 'books') {
        const bw = [4, 3, 5, 3, 4, 6, 3][(r * 3 + j) % 7];
        const bh = rh * [0.78, 0.6, 0.72, 0.84, 0.56, 0.74][(r + j * 2) % 6];
        s += R(cx, fy - bh, bw, bh, { class: ['lb', 'w', 'mb', 'g', 'lb', 'mb'][(j + r) % 6], 'stroke-width': 0.7 });
        cx += bw + ((j + r) % 5 === 4 ? 5 : 0.9);
      } else if (kind === 'jars') {
        const bw = [7, 6, 8][(r + j) % 3]; const bh = rh * [0.62, 0.5, 0.7][(r * 2 + j) % 3];
        s += R(cx, fy - bh, bw, bh, { rx: 2, class: ['lb', 'w', 'g'][(j + r * 2) % 3], 'stroke-width': 0.7 }) + L(cx + 1, fy - bh - 1.5, cx + bw - 1, fy - bh - 1.5);
        cx += bw + 3;
      } else {
        const bw = [14, 10, 12][(r + j) % 3]; const bh = rh * [0.66, 0.5, 0.74][(r + j) % 3];
        s += R(cx, fy - bh, bw, bh, { class: (j + r) % 3 === 1 ? 'mb' : 'k', rx: 0.8, 'stroke-width': 0.8 });
        cx += bw + 2.5;
      }
      j++;
    }
    if (r < rows - 1) s += L(x, fy, x + w, fy);
  }
  return s;
};

const desk = (x, yb, w) =>
  R(x + 10, yb - 56, 24, 16, { rx: 1.5, class: 'd' }) + L(x + 22, yb - 40, x + 22, yb - 34) +
  R(x, yb - 34, w, 4, { rx: 1 }) + L(x + 3, yb - 30, x + 3, yb) + L(x + w - 3, yb - 30, x + w - 3, yb) +
  R(x + w - 21, yb - 30, 18, 18) + L(x + w - 21, yb - 21, x + w - 3, yb - 21);

const chair = (x, yb, flip = false) => {
  const bx = flip ? x : x + 14;
  return R(bx, yb - 38, 3, 22, { rx: 1 }) + R(x, yb - 19, 17, 3.5, { rx: 1 }) +
    L(x + 2, yb - 15, x + 1, yb) + L(x + 15, yb - 15, x + 16, yb);
};

const sofa = (x, yb, w) =>
  R(x + 4, yb - 41, w - 8, 27, { rx: 6 }) +
  R(x + 10, yb - 23, w - 20, 15, { rx: 3, class: 'lb' }) + L(x + w / 2, yb - 23, x + w / 2, yb - 8) +
  R(x, yb - 29, 12, 25, { rx: 5 }) + R(x + w - 12, yb - 29, 12, 25, { rx: 5 }) +
  L(x + 6, yb - 4, x + 6, yb) + L(x + w - 6, yb - 4, x + w - 6, yb);

const floorLamp = (x, yb, h) =>
  L(x, yb, x, yb - h + 12) + L(x - 6, yb, x + 6, yb) +
  PG([[x - 9, yb - h + 14], [x + 9, yb - h + 14], [x + 5, yb - h], [x - 5, yb - h]], { class: 'w' });

const pendant = (x, yt, len) =>
  L(x, yt, x, yt + len) + P(`M${n(x - 9)} ${n(yt + len + 8)} q9 -15 18 0z`, { class: 'w' });

const chandelier = (x, yt) =>
  L(x, yt, x, yt + 10) +
  P(`M${n(x - 14)} ${n(yt + 12)} q7 9 14 0 q7 9 14 0`, { class: 'n' }) +
  C(x - 14, yt + 11, 1.6, { class: 'g' }) + C(x, yt + 11, 1.6, { class: 'g' }) + C(x + 14, yt + 11, 1.6, { class: 'g' });

const piano = (x, yb) =>
  R(x, yb - 50, 52, 50, { rx: 2 }) + L(x + 6, yb - 40, x + 46, yb - 40) +
  R(x - 2, yb - 28, 56, 6, { rx: 1, class: 'w' }) +
  [8, 14, 24, 30, 36, 46].map((d) => L(x + d, yb - 28, x + d, yb - 24.5, { 'stroke-width': 1.6, class: 'ks' })).join('') +
  L(x + 22, yb - 4, x + 22, yb) + L(x + 30, yb - 4, x + 30, yb);

const clock = (x, yb) =>
  R(x, yb - 82, 18, 82, { rx: 2 }) + C(x + 9, yb - 68, 6, { class: 'w' }) +
  L(x + 9, yb - 68, x + 9, yb - 72, { class: 'ks' }) + L(x + 9, yb - 68, x + 12, yb - 67, { class: 'ks' }) +
  R(x + 4, yb - 54, 10, 36, { class: 'd' }) + L(x + 9, yb - 54, x + 9, yb - 32) + C(x + 9, yb - 30, 3, { class: 'g' });

const plant = (x, yb, k = 1) =>
  [-38, -12, 14, 40].map((r, i) => `<ellipse cx="${n(x + 7 * k)}" cy="${n(yb - 26 * k)}" rx="${n(4 * k)}" ry="${n([11, 13, 12, 10][i] * k)}" transform="rotate(${r} ${n(x + 7 * k)} ${n(yb - 14 * k)})" class="pl"/>`).join('') +
  PG([[x, yb - 14 * k], [x + 14 * k, yb - 14 * k], [x + 11.5 * k, yb], [x + 2.5 * k, yb]], { class: 'w' });

const rug = (x, yb, w) => R(x, yb - 2.6, w, 2.6, { rx: 1.3, class: 'lb' });

const kitchen = (x, yb, cols) => {
  const cw = 33; let s = '';
  s += R(x - 32, yb - 74, 28, 74, { rx: 2, class: 'w' }) + L(x - 32, yb - 46, x - 4, yb - 46) +
    L(x - 9, yb - 62, x - 9, yb - 52) + L(x - 9, yb - 40, x - 9, yb - 26);
  for (let i = 0; i < cols; i++) {
    const cx = x + i * cw;
    s += R(cx, yb - 36, cw, 36);
    if (i === 1) s += R(cx + 5, yb - 26, cw - 10, 18, { rx: 1.5, class: 'd' }) + L(cx + 6, yb - 31, cx + cw - 6, yb - 31);
    else s += L(cx + cw / 2 - 5, yb - 30, cx + cw / 2 + 5, yb - 30);
  }
  s += R(x - 2, yb - 40, cols * cw + 4, 4, { rx: 1, class: 'w' });
  s += P(`M${n(x + cw * 2.5)} ${n(yb - 40)} v-10 q0 -5 6 -5`, { class: 'n' });
  for (let i = 0; i < cols; i++) {
    const cx = x + 6 + i * (cw - 3);
    s += R(cx, yb - 90, cw - 3, 28) + L(cx + cw / 2 - 6, yb - 66, cx + cw / 2 + 2, yb - 66);
  }
  return s;
};

const washer = (x, yb) =>
  R(x, yb - 36, 30, 36, { rx: 2, class: 'w' }) + L(x, yb - 29, x + 30, yb - 29) +
  C(x + 15, yb - 14, 9, { class: 'd' }) + C(x + 15, yb - 14, 5.5, { class: 'n' }) + C(x + 24, yb - 32.5, 1.3, { class: 'dotd' });

const bike = (x, yb) =>
  C(x + 14, yb - 14, 14, { class: 'n' }) + C(x + 50, yb - 14, 14, { class: 'n' }) +
  P(`M${n(x + 14)} ${n(yb - 14)} L${n(x + 27)} ${n(yb - 34)} L${n(x + 44)} ${n(yb - 34)} L${n(x + 50)} ${n(yb - 14)} M${n(x + 27)} ${n(yb - 34)} L${n(x + 33)} ${n(yb - 14)} L${n(x + 14)} ${n(yb - 14)} M${n(x + 33)} ${n(yb - 14)} L${n(x + 44)} ${n(yb - 34)} l-2 -9 l7 -2 M${n(x + 22)} ${n(yb - 38)} h10`, { class: 'n' });

const tires = (x, yb, count) =>
  Array.from({ length: count }, (_, i) => R(x, yb - 9 * (i + 1) + 0.5, 30, 8.5, { rx: 4, class: 'd' })).join('');

const can = (x, yb) => R(x, yb - 12, 10, 12, { rx: 1, class: 'w' }) + P(`M${n(x + 1)} ${n(yb - 12)} q4 -7 8 0`, { class: 'n' });

const crate = (x, yb) =>
  [5, 12, 19].map((d) => L(x + d + 2, yb - 16, x + d + 2, yb - 21, { 'stroke-width': 2 })).join('') +
  R(x, yb - 16, 28, 16, { rx: 1, class: 'mb' }) + L(x + 9.5, yb - 16, x + 9.5, yb) + L(x + 18.5, yb - 16, x + 18.5, yb);

const ladder = (x, yb, h, dx) =>
  L(x, yb, x + dx, yb - h) + L(x + 8, yb, x + dx + 8, yb - h) +
  Array.from({ length: Math.floor(h / 11) }, (_, i) => { const f = (i + 1) / (Math.floor(h / 11) + 1); return L(x + dx * f, yb - h * f, x + dx * f + 8, yb - h * f); }).join('');

const skis = (x, yb, h, dx) =>
  P(`M${n(x)} ${n(yb)} L${n(x + dx)} ${n(yb - h)} q${dx > 0 ? 2 : -2} -5 ${dx > 0 ? 5 : -5} -5 M${n(x + 5)} ${n(yb)} L${n(x + dx + 5)} ${n(yb - h)} q${dx > 0 ? 2 : -2} -5 ${dx > 0 ? 5 : -5} -5`, { class: 'n', 'stroke-width': 2 });

const trunk = (x, yb, w, h) =>
  P(`M${n(x)} ${n(yb)} v${n(-(h - 8))} q0 -8 8 -8 h${n(w - 16)} q8 0 8 8 v${n(h - 8)}z`, { class: 'mb' }) +
  L(x, yb - h * 0.6, x + w, yb - h * 0.6) + L(x + w * 0.22, yb - h, x + w * 0.22, yb) + L(x + w * 0.78, yb - h, x + w * 0.78, yb) +
  R(x + w / 2 - 3, yb - h * 0.6 - 2, 6, 7, { rx: 1, class: 'g' });

const suitcase = (x, yb, w, h) =>
  P(`M${n(x + w / 2 - 5)} ${n(yb - h)} q5 -7 10 0`, { class: 'n' }) + R(x, yb - h, w, h, { rx: 3 }) +
  L(x + w * 0.25, yb - h, x + w * 0.25, yb) + L(x + w * 0.75, yb - h, x + w * 0.75, yb);

const carpetRoll = (x, yb, w) => R(x, yb - 9, w, 9, { rx: 4.5, class: 'lb' }) + C(x + w - 4.5, yb - 4.5, 2.2, { class: 'n' }) + L(x + w * 0.3, yb - 9, x + w * 0.3, yb) + L(x + w * 0.6, yb - 9, x + w * 0.6, yb);

const cobweb = (cx, cy, dir = 1) =>
  P(`M${cx} ${cy} l${22 * dir} 4 M${cx} ${cy} l${17 * dir} 14 M${cx} ${cy} l${6 * dir} 21 M${cx + 10 * dir} ${cy + 1.8} q${2 * dir} 6 ${-7.2 * dir} 8.2 M${cx + 17 * dir} ${cy + 3} q${3 * dir} 11 ${-12.2 * dir} 14.5`, { class: 'web' });

const mower = (x, yb) =>
  P(`M${n(x + 30)} ${n(yb - 12)} L${n(x + 50)} ${n(yb - 44)} h-9`, { class: 'n' }) +
  R(x + 8, yb - 23, 14, 9, { rx: 2, class: 'w' }) + R(x, yb - 15, 36, 10, { rx: 3, class: 'g' }) +
  C(x + 6, yb - 5, 5, { class: 'd' }) + C(x + 30, yb - 5, 5, { class: 'd' });

const bench = (x, yb, w) =>
  R(x, yb - 30, w, 4, { rx: 1 }) + L(x + 3, yb - 26, x + 3, yb) + L(x + w - 3, yb - 26, x + w - 3, yb) + L(x + 3, yb - 10, x + w - 3, yb - 10) +
  R(x + 5, yb - 38, 10, 8, { class: 'w' }) + L(x + 15, yb - 34, x + 21, yb - 34) +
  box(x + 14, yb - 10, 16, 12);

const hose = (cx, cy) => C(cx, cy, 10, { class: 'n', 'stroke-width': 2.4 }) + C(cx, cy, 5.5, { class: 'n', 'stroke-width': 2 });

const tools = (x, y) =>
  L(x, y, x + 46, y) +
  P(`M${x + 6} ${y} v16 M${x + 2} ${y + 16} h8 v5 h-8z`, { class: 'n' }) +
  P(`M${x + 20} ${y} v8 l-4 12 h8 l-4 -12`, { class: 'n' }) +
  P(`M${x + 34} ${y} v6 M${x + 30} ${y + 6} h8 l4 14 h-10z`, { class: 'n' });

const broom = (x, yb) =>
  L(x + 2, yb - 9, x + 13, yb - 60, { class: 'bh' }) +
  PG([[x - 6, yb], [x + 9, yb], [x + 6.5, yb - 9], [x - 2.5, yb - 11]], { class: 'bb' });

const sparkle = (x, y, s) =>
  P(`M${n(x)} ${n(y - s)} L${n(x + s * 0.26)} ${n(y - s * 0.26)} L${n(x + s)} ${n(y)} L${n(x + s * 0.26)} ${n(y + s * 0.26)} L${n(x)} ${n(y + s)} L${n(x - s * 0.26)} ${n(y + s * 0.26)} L${n(x - s)} ${n(y)} L${n(x - s * 0.26)} ${n(y - s * 0.26)}Z`, { class: 'sp' });

/* ---------- Geometrie des Hauses ---------- */
const XL = 212, XR = 588;                 // Außenkanten
const G = 466;                            // Geländelinie
const ROOF = [[XL - 14, 224], [XL + 34, 116], [XR - 34, 116], [XR + 14, 224]];
const ATTIC = [[XL + 5, 216], [XL + 43, 124], [XR - 43, 124], [XR - 5, 216]];
const rooms = {
  ogL: [219, 224, 424, 328], ogR: [430, 224, 581, 328],
  egL: [219, 336, 398, 440], egR: [404, 336, 581, 440],
  keL: [219, 448, 366, 540], keR: [372, 448, 581, 540],
  gar: [628, 396, 764, 466],
};
const rr = ([x1, y1, x2, y2], o) => R(x1, y1, x2 - x1, y2 - y1, o);

export const ZONES = [
  { id: 'dach', label: 'Dachboden' },
  { id: 'og', label: 'Wohnung' },
  { id: 'eg', label: 'Nachlass' },
  { id: 'kueche', label: 'Küche' },
  { id: 'keller', label: 'Keller' },
  { id: 'garage', label: 'Garage' },
];

/** Fortschritt p (0..1) -> lokales t je Zone. Wird identisch in app.js verwendet. */
export const zoneT = (p, i, count = ZONES.length) => {
  const span = 1 / count;
  return Math.max(0, Math.min(1, (p - i * span) / span));
};

const door = (x, yb, w, h, dbl = false) =>
  R(x, yb - h, w, h, { class: 'bw' }) + (dbl ? L(x + w / 2, yb - h, x + w / 2, yb, { class: 'bw' }) + C(x + w / 2 - 3, yb - h * 0.45, 1, { class: 'bwd' }) + C(x + w / 2 + 3, yb - h * 0.45, 1, { class: 'bwd' }) : C(x + w - 4, yb - h * 0.45, 1, { class: 'bwd' }));
const backWin = (x, y, w, h) => R(x, y, w, h, { class: 'bw' }) + L(x + w / 2, y, x + w / 2, y + h, { class: 'bw' }) + L(x, y + h * 0.38, x + w, y + h * 0.38, { class: 'bw' });
const floorOf = ([x1, , x2, y2]) => R(x1, y2 - 4, x2 - x1, 4, { class: 'fl' });
const skirt = ([x1, , x2, y2]) => L(x1, y2 - 8, x2, y2 - 8, { class: 'bw' });

function zone(id, t, shapes, items, extras = '', back = '') {
  const its = items.map((s, i) => `<g class="it" style="--i:${i}">${s}</g>`).join('');
  return `<g class="zone" data-zone="${id}" style="--t:${n(t)};--n:${items.length}">` +
    `<g class="rooms">${shapes('h-room')}</g>` +
    `<g class="lit">${shapes('h-glow')}${extras}</g>` +
    `<g class="back">${back}</g>` +
    `<g class="items">${its}</g>` +
    `<g class="zo">${shapes('h-outline')}</g></g>`;
}

export function house({ rest = 0.4 } = {}) {
  const T = ZONES.map((_, i) => zoneT(rest, i));
  let s = '';

  /* Himmel */
  s += `<g class="sky">` +
    [[58, 110, 1.3], [118, 168, 1], [176, 96, 1.5], [96, 250, 1], [640, 150, 1.2], [742, 214, 1], [608, 262, 1], [706, 300, 1.3], [30, 310, 1], [770, 120, 1.1]].map(([x, y, r]) => C(x, y, r, { class: 'star' })).join('') +
    P('M700 104 a22 22 0 1 0 22 30 a17 17 0 1 1 -22 -30z', { class: 'moon' }) + `</g>`;

  /* Gelände, Baum, Büsche */
  s += `<g class="green wide">` + R(712, 330, 5, 70) + C(714, 318, 40) + C(686, 342, 22) + C(742, 346, 24) +
    P(`M2 ${G} q14 -34 34 -8 q10 -18 22 8z`) + P(`M596 ${G} q10 -22 22 0z`) + `</g>`;
  s += [[20, 500], [70, 540], [130, 512], [170, 560], [640, 520], [700, 556], [760, 506], [610, 566], [96, 584], [736, 590]].map(([x, y]) => L(x, y, x + 9, y, { class: 'soil' })).join('');

  /* Geländelinie, liegt hinter den Baukörpern */
  s += L(0, G, 800, G, { class: 'ground' });

  /* Baukörper: Dach, Wände, Decken (Putzweiß), Schornstein */
  s += `<g class="st">` + R(XR - 120, 88, 22, 40) + R(XR - 123, 84, 28, 6) + PG(ROOF) + R(XL, 216, XR - XL, 332) + `</g>`;
  s += L(XL - 20, 226, XL + 2, 226, { class: 'gutter' }) + L(XR - 2, 226, XR + 20, 226, { class: 'gutter' });

  /* Fenster in der Außenwand (Glas), vor den Zonen gezeichnet */
  const win = (x, y, h) => R(x, y, 7, h, { class: 'gl' }) + L(x - 3, y + h + 0.5, x + 10, y + h + 0.5, { class: 'sill' });
  s += win(XL, 250, 48) + win(XR - 7, 250, 48) + win(XL, 362, 48) + win(XR - 7, 362, 48) + R(XL, 451, 7, 12, { class: 'gl' }) + R(XR - 7, 451, 7, 12, { class: 'gl' });

  /* Zonen */
  const litWin = (x, y, h) => R(x, y, 7, h, { class: 'glw' });

  // Dachboden
  s += zone('dach', T[0],
    (k) => PG(ATTIC, { class: k }),
    [
      skis(548, 216, 62, -16),
      box(226, 216, 20, 13) + box(555, 216, 20, 13),
      box(480, 216, 36, 28) + box(520, 216, 26, 20) + box(486, 188, 26, 20),
      floorLamp(452, 216, 62) + carpetRoll(408, 216, 62),
      suitcase(366, 216, 32, 22) + suitcase(370, 194, 24, 15),
      `<g transform="rotate(-11 340 216)">${frame(326, 180, 26, 36)}</g><g transform="rotate(-17 352 216)">${frame(340, 186, 22, 30)}</g>`,
      trunk(280, 216, 44, 30),
      box(248, 216, 30, 24) + box(252, 192, 24, 18) + box(256, 174, 16, 12),
      cobweb(XL + 46, 127) + cobweb(XR - 46, 127, -1),
    ],
    R(XL + 9, 212, XR - XL - 18, 4, { class: 'fl' }) + sparkle(300, 160, 7) + sparkle(318, 176, 3.5) + sparkle(500, 168, 5),
    C(400, 166, 15, { class: 'bw' }) + L(400, 151, 400, 181, { class: 'bw' }) + L(385, 166, 415, 166, { class: 'bw' }));

  // Obergeschoss: Wohnung (Schlafzimmer + Arbeitszimmer)
  s += zone('og', T[1],
    (k) => rr(rooms.ogL, { class: k }) + rr(rooms.ogR, { class: k }),
    [
      pendant(340, 224, 14) + pendant(505, 224, 14),
      frame(312, 250, 28, 21) + frame(346, 246, 19, 27) + frame(498, 250, 24, 18),
      box(556, 328, 22, 20) + box(558, 308, 18, 16),
      desk(492, 328, 58) + chair(500, 328, true),
      shelf(436, 328, 48, 86, 4, 'books') + plant(456, 242, 0.42),
      nightstand(398, 328),
      bed(296, 328, 98) + rug(290, 328, 110),
      box(236, 239, 30, 14),
      wardrobe(226, 328, 60, 86),
    ],
    floorOf(rooms.ogL) + floorOf(rooms.ogR) + litWin(XL, 250, 48) + litWin(XR - 7, 250, 48) + sparkle(250, 262, 6) + sparkle(266, 276, 3) + sparkle(548, 258, 5),
    skirt(rooms.ogL) + skirt(rooms.ogR) + door(386, 328, 26, 62) + backWin(288, 252, 40, 44) + door(440, 328, 26, 62) + backWin(506, 252, 40, 44));

  // Erdgeschoss links: Wohnzimmer / Nachlass
  s += zone('eg', T[2],
    (k) => rr(rooms.egL, { class: k }),
    [
      chandelier(288, 336),
      frame(256, 358, 30, 22) + frame(292, 354, 20, 28),
      box(350, 390, 24, 15),
      piano(340, 440),
      floorLamp(326, 440, 66),
      sofa(248, 440, 72) + rug(242, 440, 88),
      clock(224, 440),
    ],
    floorOf(rooms.egL) + litWin(XL, 362, 48) + sparkle(252, 372, 6) + sparkle(268, 388, 3) + broom(366, 436),
    skirt(rooms.egL) + door(286, 440, 46, 76, true) + P('M286 364 q23 -12 46 0', { class: 'bw' }));

  // Erdgeschoss rechts: Küche (Rückbau)
  s += zone('kueche', T[3],
    (k) => rr(rooms.egR, { class: k }),
    [
      pendant(430, 336, 20),
      box(412, 440, 24, 18),
      kitchen(474, 440, 3),
    ],
    floorOf(rooms.egR) + litWin(XR - 7, 362, 48) + sparkle(540, 368, 5.5) + sparkle(554, 384, 3),
    skirt(rooms.egR) + door(412, 440, 26, 62) + backWin(486, 362, 44, 40));

  // Keller
  s += zone('keller', T[4],
    (k) => rr(rooms.keL, { class: k }) + rr(rooms.keR, { class: k }),
    [
      box(548, 540, 30, 24) + box(552, 516, 22, 18),
      shelf(490, 540, 52, 76, 3, 'boxes'),
      tires(452, 540, 4),
      bike(384, 540),
      can(340, 540) + can(352, 540) + crate(322, 528) ,
      crate(318, 540),
      washer(282, 540),
      shelf(224, 540, 52, 80, 4, 'jars'),
    ],
    R(XL, 451, 7, 12, { class: 'glw' }) + R(XR - 7, 451, 7, 12, { class: 'glw' }) + sparkle(250, 480, 5.5) + sparkle(264, 494, 3) + sparkle(540, 478, 5),
    door(344, 540, 0.1, 0.1) + P('M219 470 h147 M372 470 h209', { class: 'bw', 'stroke-dasharray': '2 5' }));

  // Garage (eigener Baukörper)
  s += `<g class="st wide">` + R(616, 384, 160, 7) + R(622, 390, 148, G - 390) + `</g>`;
  s += zone('garage', T[5],
    (k) => rr(rooms.gar, { class: k }),
    [
      ladder(748, 466, 62, 8),
      hose(728, 418) + tools(634, 404),
      tires(712, 466, 3),
      mower(668, 466),
      bench(632, 466, 34),
    ],
    sparkle(700, 420, 5) + sparkle(712, 434, 3));

  /* Transporter + Sackkarre */
  const wy = G - 11;
  s += `<g class="van wide">` +
    L(18, G, 42, G - 30, { class: 'ramp' }) +
    R(40, G - 88, 98, 66, { rx: 3, class: 'vb' }) +
    P(`M138 ${G - 72} h20 q4 0 6 4 l12 18 q6 2 6 8 v20 h-44z`, { class: 'vb' }) +
    P(`M143 ${G - 67} h13 l11 17 h-24z`, { class: 'vg' }) +
    R(40, G - 46, 98, 6, { class: 'vs' }) +
    P(`M52 ${G - 62} v-12 h12 v5 M52 ${G - 62} h5 M57 ${G - 62} a7 7 0 0 0 7 -7`, { class: 'vl' }) +
    `<text x="70" y="${G - 63}" class="vt">Die Aufräumer</text>` +
    R(176, G - 30, 8, 5, { rx: 1, class: 'vs' }) +
    C(72, wy, 11, { class: 'wh' }) + C(72, wy, 4, { class: 'whc' }) + C(152, wy, 11, { class: 'wh' }) + C(152, wy, 4, { class: 'whc' }) +
    `</g>`;
  s += `<g class="cart wide">` + box(192, G - 3, 16, 14) + box(193, G - 17, 14, 12) +
    P(`M186 ${G - 2} h20 M190 ${G - 2} L201 ${G - 46} l5 -2`, { class: 'n' }) + C(190, G - 5, 5, { class: 'wh' }) + `</g>`;

  return `<svg class="house__svg" viewBox="0 64 800 512" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="house-title" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="house-title">Illustration: Ein Altbau im Schnitt. Dachboden, Wohnung, Wohnzimmer, Küche, Keller und Garage werden nacheinander leer geräumt und leuchten danach.</title>` +
    `<defs><linearGradient id="lit-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEBBD"/><stop offset="1" stop-color="#F7C559"/></linearGradient><linearGradient id="ground-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="800" y2="0"><stop offset="0" stop-color="#E3ECFF" stop-opacity="0"/><stop offset=".14" stop-color="#E3ECFF" stop-opacity=".5"/><stop offset=".86" stop-color="#E3ECFF" stop-opacity=".5"/><stop offset="1" stop-color="#E3ECFF" stop-opacity="0"/></linearGradient></defs>` +
    s + `</svg>`;
}
