// Baut die Website aus src/ zusammen.
//   node build.mjs                  -> index.html (für den Server, Schriften aus ./fonts)
//                                      vorschau.html (alles in einer Datei, per Doppelklick zu öffnen)
//   node build.mjs --preview <pfad> -> zusätzlich ein Fragment ohne <html>-Gerüst für die veröffentlichte Vorschau
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { house, ZONES } from './src/illustrations/house.mjs';
import { map, townList } from './src/illustrations/map.mjs';
import { RADIUS_KM } from './src/data/towns.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const REST = 0.4; // Ruhezustand des Hero-Reglers: Dachboden und Wohnung sind geräumt

const FONTS = [
  { family: 'Bricolage Grotesque', file: 'bricolage-grotesque.woff2', weight: '200 800', stretch: '75% 100%' },
  { family: 'Atkinson Hyperlegible Next', file: 'atkinson-next.woff2', weight: '200 800' },
  { family: 'Atkinson Hyperlegible Mono', file: 'atkinson-mono.woff2', weight: '200 800' },
];
const fontFace = (inline) => FONTS.map((f) => {
  const src = inline
    ? `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, 'fonts', f.file)).toString('base64')})`
    : `url(fonts/${f.file})`;
  return `@font-face{font-family:'${f.family}';font-style:normal;font-display:swap;font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ''}src:${src} format('woff2')}`;
}).join('\n');

// Partials in fester Reihenfolge
const partials = fs.readdirSync(path.join(root, 'src/partials')).filter((f) => f.endsWith('.html')).sort();
let body = partials.map((f) => read(`src/partials/${f}`)).join('\n');

// Miniatur-Räume für die Füllgrad-Auswahl: Kartonstapel je Spalte
const fillSvg = (cols) => {
  let r = '<rect class="fr" x="1" y="1" width="78" height="46" rx="2"/>';
  cols.forEach((h, i) => { for (let j = 0; j < h; j++) r += `<rect class="fb" x="${6 + i * 14}" y="${44 - (j + 1) * 9.6}" width="12" height="8.6" rx=".8"/>`; });
  return `<svg class="fill__svg" viewBox="0 0 80 48" aria-hidden="true">${r}<line class="ff" x1="1" y1="44.5" x2="79" y2="44.5"/></svg>`;
};

const tokens = {
  HOUSE: house({ rest: REST }),
  MAP: map(),
  REST: String(Math.round(REST * 100)),
  RADIUS: String(RADIUS_KM),
  FILL_1: fillSvg([1, 0, 0, 0, 1]),
  FILL_2: fillSvg([2, 1, 0, 1, 2]),
  FILL_3: fillSvg([3, 2, 3, 2, 3]),
  FILL_4: fillSvg([4, 4, 4, 4, 4]),
  ZONE_BUTTONS: ZONES.map((z) => `<li><button type="button" class="clear__zone" data-zone="${z.id}">${z.label}</button></li>`).join(''),
};
body = body.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
const left = body.match(/\{\{\w+\}\}/g);
if (left) throw new Error('Unaufgelöste Platzhalter: ' + [...new Set(left)].join(', '));

const css = read('src/styles.css');
const js = read('src/app.js')
  .replace('/*__TOWNS__*/[]', JSON.stringify(townList()))
  .replace('/*__ZONES__*/[]', JSON.stringify(ZONES.map((z) => z.id)));

const page = ({ inlineFonts }) => `<style>\n${fontFace(inlineFonts)}\n${css}\n</style>\n${body}\n<script>\n${js}\n</script>`;

// 1) Eigenständige Seite
const head = read('src/head.html');
const preload = `<link rel="preload" href="fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="fonts/atkinson-next.woff2" as="font" type="font/woff2" crossorigin>`;
fs.writeFileSync(path.join(root, 'index.html'),
  `<!doctype html>\n<html lang="de">\n<head>\n${head}\n${preload}\n</head>\n<body>\n${page({ inlineFonts: false })}\n</body>\n</html>\n`);

// 2) Eigenständige Vorschau-Datei: Schriften eingebettet, lässt sich per Doppelklick öffnen
fs.writeFileSync(path.join(root, 'vorschau.html'),
  `<!doctype html>\n<html lang="de">\n<head>\n${head}\n</head>\n<body>\n${page({ inlineFonts: true })}\n</body>\n</html>\n`);

// 3) Fragment für die veröffentlichte Vorschau (ohne <html>/<head>/<body>)
const i = process.argv.indexOf('--preview');
if (i > -1 && process.argv[i + 1]) {
  const out = path.resolve(process.argv[i + 1]);
  fs.writeFileSync(out, `<title>Die Aufräumer Wiesbaden</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${page({ inlineFonts: true })}\n`);
  console.log('Vorschau:', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}
console.log('index.html', (fs.statSync(path.join(root, 'index.html')).size / 1024).toFixed(0) + ' KB');
