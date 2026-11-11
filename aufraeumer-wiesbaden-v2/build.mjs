// Baut die Website aus src/ und assets/.
//   node build.mjs            -> site/      fertige Website für den Server (saubere Adressen, Sitemap, Formular-Endpunkt)
//   node build.mjs --preview  -> vorschau/  dieselben Seiten als flache Dateien zum Ansehen, ohne Versand
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SITE } from './src/site.mjs';
import { house, ZONES } from './src/illustrations/house.mjs';
import { map, townList } from './src/illustrations/map.mjs';
import { ORTE } from './src/content/orte.mjs';
import { LEISTUNGEN } from './src/content/leistungen.mjs';
import { PREISE, TYPEN, kalkuliere } from './src/preise.mjs';
import { shell } from './src/layout.mjs';
import { buildPages } from './src/pages.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(root, PREVIEW ? 'vorschau' : 'site');
const A = PREVIEW ? OUT : path.join(OUT, 'assets');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
const REST = 0.4;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(A, 'img'), { recursive: true });

/* ---------- Adressen ---------- */
const url = (target) => {
  const [slug, hash] = target.split('#');
  const h = hash ? `#${hash}` : '';
  if (PREVIEW) return `${slug}.html${h}`;
  return (slug === 'index' ? '/' : `/${slug}/`) + h;
};
const ver = {};
const asset = (p) => (PREVIEW ? p : `/assets/${p}${ver[p] ? `?v=${ver[p]}` : ''}`);

/* ---------- Bilder ---------- */
const WIDTHS = [480, 800, 1200];
const images = {};
const fotoDir = path.join(root, 'assets/fotos');
const manifest = JSON.parse(read('assets/fotos/fotos.json'));
for (const f of fs.readdirSync(fotoDir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n))) {
  const name = f.replace(/\.[^.]+$/, '');
  const src = sharp(path.join(fotoDir, f)).rotate();
  const meta = await src.metadata();
  const widths = WIDTHS.filter((w) => w <= meta.width);
  const base = `entruempelung-${name}`;
  for (const w of widths) {
    await src.clone().resize({ width: w }).webp({ quality: 72 }).toFile(path.join(A, 'img', `${base}-${w}.webp`));
    await src.clone().resize({ width: w }).jpeg({ quality: 74, mozjpeg: true }).toFile(path.join(A, 'img', `${base}-${w}.jpg`));
  }
  const top = widths[widths.length - 1];
  images[name] = { base, widths, width: top, height: Math.round((top * meta.height) / meta.width) };
}
// Logo, Favicon, Vorschaubild für soziale Netzwerke
const logoSrc = path.join(root, 'assets/logo/logo.png');
const logoInfo = await sharp(logoSrc).trim().png({ compressionLevel: 9 }).toFile(path.join(A, 'img/logo.png'));
await sharp(path.join(root, 'assets/logo/logo-quadrat.png')).resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(path.join(A, 'img/logo-quadrat.png'));
const mark = sharp(logoSrc).extract({ left: 78, top: 22, width: 66, height: 82 }).flatten({ background: '#ffffff' }).extend({ top: 14, bottom: 14, left: 22, right: 22, background: '#ffffff' });
await mark.clone().resize(180, 180, { fit: 'contain', background: '#ffffff' }).png().toFile(path.join(A, 'img/apple-touch-icon.png'));
await mark.clone().resize(48, 48, { fit: 'contain', background: '#ffffff' }).png().toFile(path.join(A, 'img/favicon-48.png'));
await sharp(path.join(fotoDir, manifest.og)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(A, 'img/og-die-aufraeumer-wiesbaden.jpg'));

/* ---------- Schriften, Styles, Skript ---------- */
const FONTS = [
  { family: 'Bricolage Grotesque', file: 'bricolage-grotesque.woff2', weight: '200 800', stretch: '75% 100%' },
  { family: 'Atkinson Hyperlegible Next', file: 'atkinson-next.woff2', weight: '200 800' },
  { family: 'Atkinson Hyperlegible Mono', file: 'atkinson-mono.woff2', weight: '200 800' },
];
const fontFace = (inline) => FONTS.map((f) => {
  const src = inline ? `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, 'fonts', f.file)).toString('base64')})` : `url(/assets/fonts/${f.file})`;
  return `@font-face{font-family:'${f.family}';font-style:normal;font-display:swap;font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ''}src:${src} format('woff2')}`;
}).join('\n');
const css = read('src/styles.css');
const towns = townList();
const js = read('src/app.js')
  .replace('/*__CONFIG__*/{}', JSON.stringify({ phone: SITE.phone, endpoint: PREVIEW ? '' : '/anfrage.php', preview: PREVIEW }))
  .replace('/*__PREISE__*/{}', JSON.stringify(PREISE))
  .replace('/*__TYPEN__*/{}', JSON.stringify(TYPEN))
  .replace('/*__KALKULIERE__*/', kalkuliere.toString())
  .replace('/*__TOWNS__*/[]', JSON.stringify(towns))
  .replace('/*__ZONES__*/[]', JSON.stringify(ZONES.map((z) => z.id)));
const short = (t) => crypto.createHash('sha1').update(t).digest('hex').slice(0, 8);
ver['site.css'] = short(css); ver['site.js'] = short(js);
write(path.join(A, 'site.css'), `${fontFace(PREVIEW)}\n${css}`);
write(path.join(A, 'site.js'), js);
if (!PREVIEW) for (const f of FONTS) { fs.mkdirSync(path.join(A, 'fonts'), { recursive: true }); fs.copyFileSync(path.join(root, 'fonts', f.file), path.join(A, 'fonts', f.file)); }

/* ---------- Bausteine für die Seiten ---------- */
const kmOf = (name) => { const t = towns.find((x) => x.n === name); if (!t) throw new Error(`Ort fehlt in towns.mjs: ${name}`); return t.km; };
const fillSvg = (cols) => {
  let r = '<rect class="fr" x="1" y="1" width="78" height="46" rx="2"/>';
  cols.forEach((h, i) => { for (let j = 0; j < h; j++) r += `<rect class="fb" x="${6 + i * 14}" y="${44 - (j + 1) * 9.6}" width="12" height="8.6" rx=".8"/>`; });
  return `<svg class="fill__svg" viewBox="0 0 80 48" aria-hidden="true">${r}<line class="ff" x1="1" y1="44.5" x2="79" y2="44.5"/></svg>`;
};
const def = kalkuliere({ typ: 'wohnung', flaeche: 70, fuell: 2, etage: 2, aufzug: false }, PREISE, TYPEN);
const tokens = {
  HOUSE: house({ rest: REST }), MAP: map({ hit: 'mainz' }), REST: String(Math.round(REST * 100)), RADIUS: String(SITE.radiusKm),
  FILL_1: fillSvg([1, 0, 0, 0, 1]), FILL_2: fillSvg([2, 1, 0, 1, 2]), FILL_3: fillSvg([3, 2, 3, 2, 3]), FILL_4: fillSvg([4, 4, 4, 4, 4]),
  ZONE_BUTTONS: ZONES.map((z) => `<li><button type="button" class="clear__zone" data-zone="${z.id}">${z.label}</button></li>`).join(''),
  PHONE: SITE.phone, PHONE_INTL: SITE.phoneIntl, EMAIL: SITE.email, HOURS_SHORT: SITE.hoursShort, STREET: SITE.street, ZIP: SITE.zip, CITY: SITE.city,
  CALC_DEFAULT: `${def.lo.toLocaleString('de-DE')} – ${def.hi.toLocaleString('de-DE')} €`,
  THEMA_OPTIONS: [...LEISTUNGEN.map((l) => l.nav), 'Anfrage als Makler oder Hausverwaltung', 'Etwas anderes'].map((t) => `<option>${t.replace(/&/g, '&amp;')}</option>`).join(''),
};
const partial = (name, extra = {}) => {
  const all = { ...tokens, ...extra };
  let s = read(`src/partials/${name}.html`).replace('2.840 – 3.470 €', tokens.CALC_DEFAULT);
  s = s.replace(/\{\{url:([^}]+)\}\}/g, (m, t) => url(t)).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in all ? all[k] : m));
  const left = s.match(/\{\{[\w:]+\}\}/g);
  if (left) throw new Error(`Unaufgelöste Platzhalter in ${name}: ${[...new Set(left)].join(', ')}`);
  return s;
};

const ctx = {
  preview: PREVIEW, url, asset, partial, images, logo: { width: logoInfo.width, height: logoInfo.height }, pairs: manifest.paare, year: new Date().getFullYear(),
  sprite: read('src/partials/sprite.html'), map: (hit) => map({ hit }), orte: ORTE(kmOf),
  fontPreload: PREVIEW ? '' : `<link rel="preload" href="/assets/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>\n<link rel="preload" href="/assets/fonts/atkinson-next.woff2" as="font" type="font/woff2" crossorigin>`,
  cssInline: `${fontFace(true)}\n${css}`, js,
  openItems: [
    ['Telefonnummer', `Überall steht ${SITE.phone}. Im alten Impressum steht 0179 4285761. Welche gilt?`],
    ['Erreichbarkeit', `Verwendet: ${SITE.hoursShort} (alte Website). Gelbe Seiten nennt Mo–Fr 10–20, Sa–So 14–18 Uhr.`],
    ['Preise im Rechner', 'Sätze des bisherigen Online-Rechners: 25, 45, 65 und 80 € je m², plus 5 % je Etage ohne Aufzug. Kalibrierung steht aus.'],
    ['Formularversand', 'Der Server-Endpunkt ist fertig. In der Vorschau wird nichts versendet. Empfänger-Adresse beim Hochladen eintragen.'],
    ['Bewertung', `${SITE.rating.value} bei ${SITE.rating.count} Google-Bewertungen, Stand ${SITE.rating.asOf}. Zahl bitte aktuell halten. Zitate nur mit Zustimmung der Verfasser.`],
    ['Fotos', 'Sechs Fotos von der alten Website. Liegt die Zustimmung der Kunden vor? Ein Foto von Paul Hansen fehlt.'],
    ['Logo', 'PNG mit 400 px Breite von der alten Website. Eine Vektordatei (SVG) wäre schärfer.'],
    ['Rechtstexte', 'Impressum: Umsatzsteuer-Angabe fehlt. Datenschutz ist ein Entwurf, Hosting-Anbieter eintragen.'],
    ['Zusagen', 'Festpreis nach Besichtigung, Fotodokumentation auf Wunsch, Entsorgungsnachweis: bitte bestätigen.'],
  ],
};

/* ---------- Seiten schreiben ---------- */
const pages = buildPages(ctx);
for (const page of pages) {
  const html = shell(page, ctx);
  if (PREVIEW) write(path.join(OUT, `${page.slug}.html`), html);
  else write(path.join(OUT, page.slug === 'index' ? 'index.html' : page.slug === '404' ? '404.html' : `${page.slug}/index.html`), html);
  if (PREVIEW && page.slug === 'index') write(path.join(OUT, '_fragment.html'), shell(page, ctx, { fragment: true }));
}

/* ---------- Dateien für Suchmaschinen und Server ---------- */
if (!PREVIEW) {
  const today = new Date().toISOString().slice(0, 10);
  const indexable = pages.filter((p) => !p.noindex);
  write(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map((p) => `  <url><loc>${SITE.domain}${p.slug === 'index' ? '/' : `/${p.slug}/`}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  write(path.join(OUT, 'robots.txt'), `# Alle Suchmaschinen und KI-Assistenten dürfen die Website lesen.\nUser-agent: *\nAllow: /\nDisallow: /anfrage.php\n\nSitemap: ${SITE.domain}/sitemap.xml\n`);
  write(path.join(OUT, 'llms.txt'), read('src/server/llms.txt')
    .replace('{{LEISTUNGEN}}', LEISTUNGEN.map((l) => `- [${l.nav}](${SITE.domain}/${l.slug}/): ${l.teaser}`).join('\n'))
    .replace('{{ORTE}}', ctx.orte.map((o) => `- [Entrümpelung ${o.nav}](${SITE.domain}/${o.slug}/)`).join('\n'))
    .replace(/\{\{(\w+)\}\}/g, (m, k) => ({ NAME: SITE.name, OWNER: SITE.owner, ADDRESS: `${SITE.street}, ${SITE.zip} ${SITE.city}`, PHONE: SITE.phone, EMAIL: SITE.email, HOURS: SITE.hoursShort, RADIUS: SITE.radiusKm, DOMAIN: SITE.domain, PAY: SITE.payment.join(', ') })[k] ?? m));
  for (const f of ['anfrage.php', 'anfrage-config.sample.php', '.htaccess']) fs.copyFileSync(path.join(root, 'src/server', f), path.join(OUT, f));
}

/* ---------- Kontrolle ---------- */
const size = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
const bad = pages.filter((p) => !p.noindex && (p.title.length > 62 || p.description.length > 165 || p.description.length < 70));
console.log(`${PREVIEW ? 'Vorschau' : 'Website'}: ${pages.length} Seiten in ${path.relative(root, OUT)}/ · site.css ${size(path.join(A, 'site.css'))} · site.js ${size(path.join(A, 'site.js'))} · ${Object.keys(images).length} Fotos`);
if (bad.length) console.log('Metadaten prüfen:', bad.map((p) => `${p.slug} (Titel ${p.title.length}, Beschreibung ${p.description.length})`).join('; '));
