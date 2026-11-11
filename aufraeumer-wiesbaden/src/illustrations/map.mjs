// Build-Zeit-Generator für die schematische Einsatzgebiet-Karte (50-km-Radius um den Luxemburgplatz).
import { BASE, RADIUS_KM, TOWNS, RHEIN, MAIN } from '../data/towns.mjs';

const KM_LAT = 111.32;
const KM_LON = 111.32 * Math.cos((BASE.lat * Math.PI) / 180);
const S = 5;                    // 1 km = 5 Einheiten
const W = 640, H = 580, CX = 320, CY = 290;

const n = (v) => Math.round(v * 10) / 10;
export const kmXY = (lat, lon) => [(lon - BASE.lon) * KM_LON, (lat - BASE.lat) * KM_LAT];
const px = (lat, lon) => { const [x, y] = kmXY(lat, lon); return [n(CX + x * S), n(CY - y * S)]; };
export const distKm = (lat, lon) => { const [x, y] = kmXY(lat, lon); return Math.hypot(x, y); };

const slug = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Ortsliste für den Ortscheck in app.js */
export function townList() {
  return TOWNS.map((t) => ({ id: slug(t.n), n: t.n, plz: t.plz, km: Math.round(distKm(t.lat, t.lon)) }));
}

const smooth = (pts) => {
  const p = pts.map(([la, lo]) => px(la, lo));
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = n((p[i][0] + p[i + 1][0]) / 2), my = n((p[i][1] + p[i + 1][1]) / 2);
    d += ` Q${p[i][0]} ${p[i][1]} ${mx} ${my}`;
  }
  const l = p[p.length - 1];
  return d + ` L${l[0]} ${l[1]}`;
};

export function map() {
  let s = '';
  const R = RADIUS_KM * S;
  s += `<defs><clipPath id="map-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="6"/></clipPath>` +
    `<radialGradient id="map-zone" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="var(--gold)" stop-opacity=".34"/><stop offset=".7" stop-color="var(--gold)" stop-opacity=".16"/><stop offset="1" stop-color="var(--gold)" stop-opacity=".1"/></radialGradient></defs>`;
  s += `<g clip-path="url(#map-clip)">`;
  s += `<rect width="${W}" height="${H}" class="m-bg"/>`;
  // Raster alle 10 km
  for (let k = -60; k <= 60; k += 10) {
    s += `<line x1="${CX + k * S}" y1="0" x2="${CX + k * S}" y2="${H}" class="m-grid"/><line x1="0" y1="${CY + k * S}" x2="${W}" y2="${CY + k * S}" class="m-grid"/>`;
  }
  s += `<circle cx="${CX}" cy="${CY}" r="${R}" class="m-zone"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="${25 * S}" class="m-ring"/>`;
  s += `<path d="${smooth(RHEIN)}" class="m-river"/><path d="${smooth(MAIN)}" class="m-river m-river--main"/>`;
  s += `<circle cx="${CX}" cy="${CY}" r="${R}" class="m-edge"/>`;
  // Flussnamen
  s += `<text x="${px(49.70, 8.43)[0] + 12}" y="${px(49.70, 8.43)[1]}" class="m-rivername">Rhein</text>`;
  s += `<text x="${px(50.105, 8.60)[0]}" y="${px(50.105, 8.60)[1] + 16}" class="m-rivername">Main</text>`;
  // Maßangaben
  s += `<text x="${CX}" y="${CY - R - 9}" text-anchor="middle" class="m-dim">50 km</text>`;
  s += `<text x="${CX}" y="${CY - 25 * S - 7}" text-anchor="middle" class="m-dim m-dim--soft">25 km</text>`;
  // Orte
  for (const t of TOWNS) {
    if (t.n === 'Wiesbaden') continue;
    const [x, y] = px(t.lat, t.lon);
    if (x < 6 || x > W - 6 || y < 6 || y > H - 6) continue;
    const inside = distKm(t.lat, t.lon) <= RADIUS_KM;
    const lab = t.lab ? `<text x="${n(x + t.lab[0])}" y="${n(y + t.lab[1])}" text-anchor="${t.lab[2]}" class="m-label">${t.short || t.n}</text>` : '';
    s += `<g class="m-town${inside ? '' : ' m-town--out'}${t.lab ? ' m-town--major' : ''}${t.key ? ' m-town--key' : ''}" data-town="${slug(t.n)}"><circle cx="${x}" cy="${y}" r="9" class="m-pulse"/><circle cx="${x}" cy="${y}" r="${t.lab ? 3.4 : 2.2}" class="m-dot"/>${lab}</g>`;
  }
  // Standort
  s += `<g class="m-home" data-town="wiesbaden"><circle cx="${CX}" cy="${CY}" r="16" class="m-pulse"/><circle cx="${CX}" cy="${CY}" r="7.5" class="m-homedot"/><circle cx="${CX}" cy="${CY}" r="2.6" class="m-homecore"/>` +
    `<text x="${CX + 13}" y="${CY - 9}" class="m-label m-label--home">Wiesbaden</text></g>`;
  s += `</g>`;
  return `<svg class="map__svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="map-title" xmlns="http://www.w3.org/2000/svg"><title id="map-title">Schematische Karte: Einsatzgebiet im Umkreis von 50 Kilometern um Wiesbaden, von Limburg im Norden bis Alzey im Süden, von Bingen im Westen bis Hanau im Osten.</title>${s}</svg>`;
}
