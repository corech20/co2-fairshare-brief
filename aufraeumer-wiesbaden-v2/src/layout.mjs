// Gemeinsames Seitengerüst: Kopf, Navigation, Fuß, mobile Leiste.
import { SITE, NAV } from './site.mjs';
import { LEISTUNGEN } from './content/leistungen.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

const logo = (ctx) => `<a class="logo" href="${ctx.url('index')}" aria-label="${SITE.name}, zur Startseite"><img class="logo__img" src="${ctx.asset('img/logo.png')}" width="${ctx.logo.width}" height="${ctx.logo.height}" alt="${SITE.name}"></a>`;

function header(page, ctx) {
  const calc = page.slug === 'index' ? '#kostenrechner' : ctx.url('entruempelung-kosten');
  const item = (n) => `<a href="${ctx.url(n.href)}"${n.href === page.slug || n.href === page.parent ? ' aria-current="page"' : ''}>${n.label}</a>`;
  return `<header class="hdr">
  <div class="wrap hdr__in">
    ${logo(ctx)}
    <nav class="nav" aria-label="Hauptnavigation">
      ${NAV.map(item).join('\n      ')}
      <a class="nav__b2b" href="${ctx.url('makler-hausverwaltungen')}"${page.slug === 'makler-hausverwaltungen' ? ' aria-current="page"' : ''}>Für Makler &amp; Verwalter</a>
    </nav>
    <div class="hdr__cta">
      <a class="hdr__phone" href="tel:${SITE.phoneIntl}">${icon('i-phone')}<span>${SITE.phone}</span></a>
      <a class="btn btn--gold btn--sm hdr__btn" href="${calc}">Kosten berechnen</a>
      <button type="button" class="hdr__menu" aria-expanded="false" aria-controls="mnav">${icon('i-menu')}<span class="hdr__menulabel">Menü</span></button>
    </div>
  </div>
  <div class="mnav" id="mnav" hidden>
    <nav class="wrap mnav__in" aria-label="Mobile Navigation">
      <a href="${ctx.url('index')}">Startseite</a>
      ${NAV.map(item).join('\n      ')}
      <a href="${ctx.url('makler-hausverwaltungen')}">Für Makler &amp; Verwalter</a>
      <a class="mnav__tel" href="tel:${SITE.phoneIntl}">${icon('i-phone')}${SITE.phone}</a>
    </nav>
  </div>
</header>`;
}

function footer(page, ctx) {
  const orte = ctx.orte.map((o) => `<a href="${ctx.url(o.slug)}">Entrümpelung ${o.nav}</a>`).join('\n      ');
  return `<footer class="ftr">
  <div class="wrap ftr__in">
    <div class="ftr__brand">
      ${logo(ctx)}
      <p>Entrümpelung, Haushaltsauflösung, Rückbau und Umzüge in Wiesbaden und dem Rhein-Main-Gebiet. Inhabergeführt von ${SITE.owner}.</p>
      <p><a class="ftr__rating" href="${SITE.rating.url}" target="_blank" rel="noopener">${SITE.rating.value} von 5 Sternen bei ${SITE.rating.count} ${SITE.rating.source}-Bewertungen</a><br><span class="ftr__asof">Stand ${SITE.rating.asOf}</span></p>
    </div>
    <nav class="ftr__col" aria-label="Leistungen">
      <h2>Leistungen</h2>
      ${LEISTUNGEN.map((l) => `<a href="${ctx.url(l.slug)}">${l.nav}</a>`).join('\n      ')}
    </nav>
    <nav class="ftr__col" aria-label="Einsatzgebiet">
      <h2>Einsatzgebiet</h2>
      <a href="${ctx.url('index')}">Entrümpelung Wiesbaden</a>
      ${orte}
      <h2 class="ftr__h2">Unternehmen</h2>
      <a href="${ctx.url('entruempelung-kosten')}">Kosten &amp; Rechner</a>
      <a href="${ctx.url('ueber-uns')}">Über uns</a>
      <a href="${ctx.url('makler-hausverwaltungen')}">Makler &amp; Verwalter</a>
    </nav>
    <div class="ftr__col">
      <h2>Kontakt</h2>
      <p>${SITE.street}<br>${SITE.zip} ${SITE.city}</p>
      <a class="ftr__tel" href="tel:${SITE.phoneIntl}">${SITE.phone}</a>
      <a href="mailto:${SITE.email}">${SITE.email}</a>
      <p>${SITE.hours.map((h) => `${h.label}<br>${parseInt(h.open, 10)} bis ${parseInt(h.close, 10)} Uhr`).join('<br>')}</p>
    </div>
  </div>
  <div class="wrap ftr__base">
    <p>© ${ctx.year} ${SITE.name}</p>
    <p><a href="${ctx.url('kontakt')}">Kontakt</a><a href="${ctx.url('impressum')}">Impressum</a><a href="${ctx.url('datenschutzerklaerung')}">Datenschutz</a>${ctx.preview ? '<button type="button" data-open-drawer>Offene Punkte</button>' : ''}</p>
  </div>
</footer>`;
}

function mbar(page, ctx) {
  const calc = page.slug === 'index' || page.slug === 'entruempelung-kosten' ? '#kostenrechner' : ctx.url('entruempelung-kosten');
  const kontakt = page.hasContact ? '#kontakt' : ctx.url('kontakt');
  return `<div class="mbar" aria-label="Schnellkontakt">
  <a class="mbar__std" href="tel:${SITE.phoneIntl}">${icon('i-phone')}Anrufen</a>
  <a class="mbar__std" href="${kontakt}">${icon('i-chat')}Rückruf</a>
  <p class="mbar__price"><span>Kostenrahmen</span><strong id="mbar-preis"></strong></p>
  <a class="mbar__main" href="${calc}" id="mbar-main">Kosten<span class="mbar__more">&nbsp;berechnen</span></a>
</div>`;
}

const previewBar = (ctx) => ctx.preview ? `<div class="preview-bar" role="note">
  <div class="wrap preview-bar__in">
    <p><strong>Vorschau Version 2.</strong> Noch nicht veröffentlicht.</p>
    <button type="button" class="preview-bar__btn" data-open-drawer>Offene Punkte</button>
  </div>
</div>` : '';

const drawer = (ctx) => ctx.preview ? `<div class="drawer" id="drawer" hidden>
  <div class="drawer__scrim" data-close-drawer></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-h" tabindex="-1">
    <div class="drawer__head">
      <h2 id="drawer-h">Offene Punkte vor dem Livegang</h2>
      <button type="button" class="drawer__x" data-close-drawer>${icon('i-x')}<span class="sr-only">Schließen</span></button>
    </div>
    <p>Kontaktdaten, Leistungen, Preise, Fotos, Logo und Bewertung stammen von Ihrer bestehenden Website und aus öffentlichen Profilen. Diese Punkte brauchen noch Ihre Bestätigung:</p>
    <ul class="drawer__list">
      ${ctx.openItems.map(([t, d]) => `<li><strong>${t}</strong>${d}</li>`).join('\n      ')}
    </ul>
  </div>
</div>` : '';

/** Vollständiges Dokument. `fragment: true` liefert nur den Inhalt ohne <html>-Gerüst (für die veröffentlichte Vorschau). */
export function shell(page, ctx, { fragment = false } = {}) {
  const canonical = `${SITE.domain}${page.slug === 'index' ? '/' : page.slug === '404' ? '/404.html' : `/${page.slug}/`}`;
  const robots = page.noindex || ctx.preview ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const ld = (page.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  const body = `<div id="site" lang="de" data-page="${page.slug}">
<a class="skip" href="#main">Zum Inhalt springen</a>
${ctx.sprite}
${previewBar(ctx)}
${header(page, ctx)}
<main id="main">
${page.body}
</main>
${footer(page, ctx)}
${mbar(page, ctx)}
${drawer(ctx)}
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</div>`;
  if (fragment) {
    return `<title>${esc(SITE.name)} V2</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n${ctx.cssInline}\n</style>\n${body}\n<script>\n${ctx.js}\n</script>\n`;
  }
  const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
${page.slug === '404' ? '' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#062A49">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.domain}/assets/img/og-die-aufraeumer-wiesbaden.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ctx.asset('img/favicon-48.png')}" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="${ctx.asset('img/apple-touch-icon.png')}">
${ctx.fontPreload}
<link rel="stylesheet" href="${ctx.asset('site.css')}">
<script src="${ctx.asset('site.js')}" defer></script>
${ld}`;
  return `<!doctype html>\n<html lang="de">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
}
