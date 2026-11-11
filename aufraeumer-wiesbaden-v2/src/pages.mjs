// Alle Seiten der Website. Jede Seite liefert Slug, Metadaten, Inhalt und strukturierte Daten.
import { SITE } from './site.mjs';
import { LEISTUNGEN } from './content/leistungen.mjs';
import { esc, icon } from './layout.mjs';
import { PREISE, TYPEN, kalkuliere } from './preise.mjs';

const eur = (n) => n.toLocaleString('de-DE');
const ID = `${SITE.domain}/#unternehmen`;
const abs = (slug) => `${SITE.domain}${slug === 'index' ? '/' : `/${slug}/`}`;

/* ---------- Strukturierte Daten ---------- */
const businessLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': ID,
  name: SITE.name,
  url: `${SITE.domain}/`,
  telephone: SITE.phoneIntl,
  email: SITE.email,
  image: `${SITE.domain}/assets/img/og-die-aufraeumer-wiesbaden.jpg`,
  logo: `${SITE.domain}/assets/img/logo.png`,
  founder: { '@type': 'Person', name: SITE.owner },
  address: { '@type': 'PostalAddress', streetAddress: SITE.street, postalCode: SITE.zip, addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: 'DE' },
  geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lon },
  hasMap: SITE.mapsUrl,
  openingHoursSpecification: SITE.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map((d) => ({ Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' })[d]), opens: h.open, closes: h.close })),
  paymentAccepted: SITE.payment.join(', '),
  areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lon }, geoRadius: SITE.radiusKm * 1000 },
  knowsAbout: ['Entrümpelung', 'Haushaltsauflösung', 'Wohnungsauflösung', 'Hausentrümpelung', 'Kellerentrümpelung', 'Messie-Räumung', 'Betriebsauflösung', 'Rückbau', 'Umzug'],
});
const crumbsLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, slug], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(slug) })) });
const faqLd = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) });
const serviceLd = (p, area) => ({ '@context': 'https://schema.org', '@type': 'Service', name: p.h1, serviceType: p.nav, description: p.description, url: abs(p.slug), provider: { '@id': ID, '@type': 'LocalBusiness', name: SITE.name }, areaServed: area || 'Wiesbaden und Rhein-Main-Gebiet' });

/* ---------- Bausteine ---------- */
export function components(ctx) {
  const u = ctx.url;
  const rating = SITE.rating;
  const stars = `<span class="stars" aria-hidden="true">${'<svg viewBox="0 0 20 20"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.700l5.800-.8z"/></svg>'.repeat(5)}</span>`;
  const ratingChip = `<a class="rating" href="${rating.url}" target="_blank" rel="noopener">${stars}<span><strong>${rating.value}</strong><span class="sr-only"> von 5 Sternen</span> bei ${rating.count} ${rating.source}-Bewertungen<span class="sr-only">, Stand ${rating.asOf}, öffnet Google Maps</span></span></a>`;

  const crumbs = (items) => `<nav class="crumbs" aria-label="Brotkrumen"><ol>${items.map(([name, slug], i) => i < items.length - 1 ? `<li><a href="${u(slug)}">${name}</a></li>` : `<li aria-current="page">${name}</li>`).join('')}</ol></nav>`;

  const pageHero = ({ eyebrow, h1, lead, trail, primary = ['Kosten berechnen', u('entruempelung-kosten')], secondary = ['Rückruf vereinbaren', '#kontakt'] }) => `<section class="subhero band" aria-labelledby="page-h1">
  <div class="wrap subhero__in">
    ${crumbs(trail)}
    <h1 id="page-h1"><span class="eyebrow eyebrow--band">${eyebrow}</span>${h1}</h1>
    <p class="hero__lead">${lead}</p>
    <div class="hero__actions">
      ${primary ? `<a class="btn btn--gold btn--lg" href="${primary[1]}">${primary[0]}${icon('i-arrow')}</a>` : ''}
      ${secondary ? `<a class="btn btn--line btn--lg" href="${secondary[1]}">${secondary[0]}</a>` : ''}
    </div>
    <p class="hero__note">Lieber telefonieren? <a class="hero__tel" href="tel:${SITE.phoneIntl}">${SITE.phone}</a><span class="hero__hours">${SITE.hoursShort}</span></p>
  </div>
</section>`;

  const glyph = (l) => l.icon
    ? `<span class="glyph glyph--icon" aria-hidden="true">${icon(l.icon)}</span>`
    : `<svg class="glyph" aria-hidden="true" style="${Object.keys(l.glyph).map((k) => `--z-${k}:var(--gold)`).join(';')}"><use href="#g-house"/></svg>`;
  const svcGrid = (h = 'h3') => `<ul class="svc">
${LEISTUNGEN.map((l) => `      <li class="svc__item"><a class="svc__link" href="${u(l.slug)}">${glyph(l)}<${h}>${l.nav}</${h}><p>${l.teaser}</p><span class="svc__more">Mehr erfahren${icon('i-arrow')}</span></a></li>`).join('\n')}
    </ul>`;

  const faqBlock = (faq, { title = 'Häufige Fragen', lead = 'Ihre Frage fehlt? Rufen Sie an, wir beantworten sie gern.', id = 'fragen', name = 'faq' } = {}) => `<section class="sec" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap faq">
    <header class="sec__head faq__head">
      <p class="eyebrow">Häufige Fragen</p>
      <h2 id="${id}-h">${title}</h2>
      <p class="sec__lead">${lead}</p>
      <a class="btn btn--line-ink" href="tel:${SITE.phoneIntl}">${icon('i-phone')}${SITE.phone}</a>
    </header>
    <div class="faq__list">
${faq.map((f, i) => `      <details class="faq__item" name="${name}"${i === 0 ? ' open' : ''}>
        <summary>${f.q}${icon('i-chev')}</summary>
        <div class="faq__a"><p>${f.a}</p></div>
      </details>`).join('\n')}
    </div>
  </div>
</section>`;

  const pic = (name, alt, { sizes = '(min-width: 1000px) 560px, 92vw', lazy = true, cls = '' } = {}) => {
    const im = ctx.images[name];
    if (!im) return '';
    const set = (ext) => im.widths.map((w) => `${ctx.asset(`img/${im.base}-${w}.${ext}`)} ${w}w`).join(', ');
    return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${ctx.asset(`img/${im.base}-${im.widths[1] || im.widths[0]}.jpg`)}" srcset="${set('jpg')}" sizes="${sizes}" width="${im.width}" height="${im.height}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}></picture>`;
  };

  const beforeAfter = (pair) => {
    const p = ctx.pairs[pair];
    if (!p || !ctx.images[p.vorher] || !ctx.images[p.nachher]) return '';
    return `<figure class="ba" style="--pos:50%">
      <div class="ba__frame">
        ${pic(p.nachher, p.altNachher, { cls: 'ba__img' })}
        ${pic(p.vorher, p.altVorher, { cls: 'ba__img ba__img--before' })}
        <span class="ba__tag ba__tag--before">Vorher</span><span class="ba__tag ba__tag--after">Nachher</span>
        <span class="ba__line" aria-hidden="true"></span>
        <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="${esc(p.label)}: Regler zwischen vorher und nachher">
      </div>
      <figcaption>${p.caption}</figcaption>
    </figure>`;
  };

  const gallery = (h = 'h2') => `<section class="sec sec--tint" id="vorher-nachher" aria-labelledby="ba-h">
  <div class="wrap">
    <header class="sec__head">
      <p class="eyebrow">Echte Einsätze</p>
      <${h} id="ba-h">Vorher voll, nachher frei.</${h}>
      <p class="sec__lead">Drei Räume aus unseren Aufträgen. Ziehen Sie den Regler über das Bild.</p>
    </header>
    <div class="ba-grid">
      ${Object.keys(ctx.pairs).map(beforeAfter).join('\n      ')}
    </div>
  </div>
</section>`;

  const asideCard = () => `<aside class="reach" aria-label="So erreichen Sie uns">
      <p class="reach__k">Direkt anfragen</p>
      <a class="reach__tel" href="tel:${SITE.phoneIntl}">${icon('i-phone')}${SITE.phone}</a>
      <p class="reach__hours">${SITE.hoursShort}</p>
      <a class="btn btn--gold btn--block" href="${u('entruempelung-kosten')}">Kosten berechnen</a>
      <a class="btn btn--line-ink btn--block" href="#kontakt">Rückruf vereinbaren</a>
      <ul class="reach__facts">
        <li>${icon('i-check')}Besichtigung kostenlos</li>
        <li>${icon('i-check')}Festpreis nach Besichtigung</li>
        <li>${icon('i-check')}Besenreine Übergabe</li>
      </ul>
      ${ratingChip}
    </aside>`;

  const inhaber = () => `<section class="sec" id="inhaber" aria-labelledby="inhaber-h">
  <div class="wrap owner">
    <figure class="owner__photo">
      ${ctx.images['paul-hansen'] ? pic('paul-hansen', `${SITE.owner}, ${SITE.ownerRole} von ${SITE.name}`, { sizes: '(min-width: 880px) 380px, 62vw' }) : `<div class="owner__mark"><img src="${ctx.asset('img/logo-quadrat.png')}" width="320" height="333" alt="Logo ${SITE.name}" loading="lazy" decoding="async"></div>`}
    </figure>
    <div class="owner__text">
      <p class="eyebrow">Inhabergeführt</p>
      <h2 id="inhaber-h">Sie sprechen mit dem, der am Ende dafür geradesteht.</h2>
      <blockquote class="owner__quote">
        <p>Ob Keller, Dachboden, Garage, ganze Wohnungen oder auch Umzüge: Die Aufräumer Wiesbaden sind gründlich, diskret und zuverlässig im Einsatz.</p>
        <footer><strong>${SITE.owner}</strong>, ${SITE.ownerRole}</footer>
      </blockquote>
      <dl class="owner__facts">
        <div><dt>Sitz</dt><dd>${SITE.street}<br>${SITE.zip} ${SITE.city}</dd></div>
        <div><dt>Einsatzgebiet</dt><dd>Wiesbaden und<br>${SITE.radiusKm} km Umkreis</dd></div>
        <div><dt>Bewertung</dt><dd>${ratingChip}<span class="owner__asof">Stand ${rating.asOf}</span></dd></div>
      </dl>
    </div>
  </div>
</section>`;

  return { ratingChip, crumbs, pageHero, svcGrid, faqBlock, pic, beforeAfter, gallery, asideCard, inhaber };
}

/* ---------- Seiten ---------- */
export function buildPages(ctx) {
  const c = components(ctx);
  const u = ctx.url;
  const P = (name, extra = {}) => ctx.partial(name, extra);
  const kontakt = () => P('kontakt-band');
  const pages = [];

  /* Startseite */
  const faqHome = [
    { q: 'Was kostet eine Entrümpelung?', a: `Das hängt vor allem von Fläche und Füllgrad ab, dazu kommen Etage und Zusatzarbeiten. Der <a href="#kostenrechner">Kostenrechner</a> zeigt Ihnen einen unverbindlichen Rahmen für Ihren Fall. Verbindlich wird der Preis nach der kostenlosen Besichtigung.` },
    { q: 'Muss ich bei der Räumung dabei sein?', a: 'Nein. Viele Auftraggeber wohnen nicht in der Nähe. Nach der Besichtigung genügt die Schlüsselübergabe. Sie legen fest, was bleiben soll, und erhalten auf Wunsch Fotos vom Ergebnis.' },
    { q: 'Rechnen Sie Möbel oder Wertgegenstände an?', a: 'Eine allgemeine Wertanrechnung bieten wir nicht an. Außergewöhnlich wertvolle Gegenstände können wir im Einzelfall individuell besprechen. Persönliche Funde wie Dokumente, Schmuck oder Bargeld legen wir für Sie beiseite.' },
    { q: 'Wie schnell bekomme ich einen Termin?', a: 'Das hängt von der Auslastung ab. Nennen Sie uns Ihre Frist gleich bei der Anfrage. Wir sagen Ihnen offen, ob wir sie halten können.' },
    { q: 'Kann ich die Kosten von der Steuer absetzen?', a: 'Für Arbeiten im eigenen, selbst bewohnten Haushalt oft ja. Als haushaltsnahe Dienstleistung mindern 20 Prozent der Arbeitskosten Ihre Einkommensteuer, höchstens 4.000 Euro im Jahr (§ 35a EStG). Voraussetzung sind eine Rechnung und die unbare Zahlung. Ob das in Ihrem Fall gilt, klärt Ihre Steuerberatung.' },
    { q: 'Reicht nicht auch der Sperrmüll der Stadt?', a: 'Für einzelne Möbelstücke ist die Sperrmüllabfuhr der ELW oft die günstigste Lösung, und das sagen wir Ihnen auch. Sie holt allerdings nur ab, was an der Straße steht. Tragen, Demontieren, Sortieren und die besenreine Übergabe bleiben bei Ihnen.' },
    { q: 'Was bedeutet besenrein genau?', a: 'Alle Räume sind leer und grob gereinigt, also gefegt und frei von Müll. Eine Grundreinigung mit Fenstern, Bad und Küche ist das nicht.' },
    { q: 'Wie wird bezahlt?', a: `Sie erhalten eine Rechnung und zahlen per Überweisung oder PayPal.` },
  ];
  pages.push({
    slug: 'index', hasContact: true,
    title: 'Entrümpelung Wiesbaden & Haushaltsauflösung | Die Aufräumer',
    ogTitle: 'Die Aufräumer Wiesbaden: Wir räumen. Sie atmen auf.',
    description: 'Entrümpelung und Haushaltsauflösung in Wiesbaden und Umgebung: kostenlose Besichtigung, Festpreis, besenreine Übergabe. Jetzt Kosten berechnen oder anrufen.',
    body: [
      P('home-10-hero', { RATING_CHIP: c.ratingChip }),
      P('home-20-anlaesse'),
      P('home-30-leistungen', { SVC_GRID: c.svcGrid('h3') }),
      P('kostenrechner', { CALC_H: 'h2' }),
      P('home-60-vertrauen', { INHABER: '' }),
      c.gallery('h2'),
      c.inhaber(),
      P('home-80-gebiet', { FAQ_HOME: c.faqBlock(faqHome, { title: 'Ehrliche Antworten, bevor Sie fragen müssen.' }), KONTAKT_BAND: kontakt() }),
    ].join('\n'),
    jsonld: [businessLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: `${SITE.domain}/`, inLanguage: 'de' }, faqLd(faqHome)],
  });

  /* Leistungsübersicht */
  pages.push({
    slug: 'leistungen', hasContact: true,
    title: 'Leistungen: Entrümpelung, Auflösung, Rückbau, Umzug',
    description: 'Alle Leistungen der Aufräumer Wiesbaden: Haushalts- und Wohnungsauflösung, Hausentrümpelung, Keller und Dachboden, Messie-Räumung, Betriebsauflösung, Rückbau, Umzug.',
    body: [
      c.pageHero({ eyebrow: 'Leistungen', h1: 'Vom Dachboden bis zum Keller, in einem Auftrag.', lead: 'Ein Team, ein Ansprechpartner, ein Preis. Wählen Sie die Leistung, die zu Ihrem Anlass passt.', trail: [['Startseite', 'index'], ['Leistungen', 'leistungen']] }),
      `<section class="sec"><div class="wrap">${c.svcGrid('h2')}</div></section>`,
      `<section class="sec sec--tint" aria-labelledby="orte-h"><div class="wrap">
        <header class="sec__head"><p class="eyebrow">Einsatzgebiet</p><h2 id="orte-h">Wiesbaden und ${SITE.radiusKm} Kilometer drumherum.</h2></header>
        <ul class="linklist">${[{ slug: 'index', nav: 'Wiesbaden' }, ...ctx.orte].map((o) => `<li><a href="${u(o.slug)}">Entrümpelung ${o.nav}${icon('i-arrow')}</a></li>`).join('')}</ul>
      </div></section>`,
      kontakt(),
    ].join('\n'),
    jsonld: [crumbsLd([['Startseite', 'index'], ['Leistungen', 'leistungen']])],
  });

  /* Leistungsseiten */
  const photoFor = { 'haushaltsaufloesung-wiesbaden': 'wohnzimmer', 'wohnungsaufloesung-wiesbaden': 'schlafzimmer', 'hausentruempelung-wiesbaden': 'arbeitszimmer' };
  const byslug = Object.fromEntries(LEISTUNGEN.map((l) => [l.slug, l]));
  for (const l of LEISTUNGEN) {
    const trail = [['Startseite', 'index'], ['Leistungen', 'leistungen'], [l.nav, l.slug]];
    const ba = photoFor[l.slug] ? c.beforeAfter(photoFor[l.slug]) : '';
    pages.push({
      slug: l.slug, parent: 'leistungen', hasContact: true, title: l.title, description: l.description,
      body: [
        c.pageHero({ eyebrow: 'Leistung', h1: l.h1, lead: l.lead, trail }),
        `<section class="sec"><div class="wrap split">
    <div class="prose">
      ${l.intro.map((p) => `<p>${p}</p>`).join('\n      ')}
      <h2>Das übernehmen wir</h2>
      <ul class="ticks">${l.includes.map((i) => `<li>${i}</li>`).join('')}</ul>
      ${l.sections.map((s) => `<h2>${s.h}</h2>\n      ${s.p.map((p) => `<p>${p}</p>`).join('')}`).join('\n      ')}
      ${ba ? `<h2>So sieht das Ergebnis aus</h2>\n      ${ba}` : ''}
    </div>
    ${c.asideCard()}
  </div></section>`,
        `<section class="sec sec--tint" aria-labelledby="kosten-h"><div class="wrap costbox">
    <div><p class="eyebrow">Kosten</p><h2 id="kosten-h">Was kostet das?</h2><p>${l.costs}</p></div>
    <a class="btn btn--ink btn--lg" href="${l.slug === 'umzug-wiesbaden' ? '#kontakt' : u('entruempelung-kosten')}">${l.slug === 'umzug-wiesbaden' ? 'Umzug anfragen' : 'Zum Kostenrechner'}${icon('i-arrow')}</a>
  </div></section>`,
        c.faqBlock(l.faq, { title: `Fragen zur ${l.nav}`.replace('zur Keller, Dachboden & Garage', 'zu Keller, Dachboden und Garage').replace('zur Rückbau', 'zum Rückbau').replace('zur Umzug & Transport', 'zu Umzug und Transport').replace('zur Betriebs- & Büroauflösung', 'zur Betriebs- und Büroauflösung') }),
        `<section class="sec sec--tint" aria-labelledby="mehr-h"><div class="wrap">
    <header class="sec__head"><p class="eyebrow">Passt dazu</p><h2 id="mehr-h">Weitere Leistungen</h2></header>
    <ul class="linklist">${l.related.map((s) => `<li><a href="${u(s)}">${byslug[s].nav}${icon('i-arrow')}</a></li>`).join('')}${ctx.orte.slice(0, 2).map((o) => `<li><a href="${u(o.slug)}">Entrümpelung ${o.nav}${icon('i-arrow')}</a></li>`).join('')}</ul>
  </div></section>`,
        kontakt(),
      ].join('\n'),
      jsonld: [serviceLd(l), crumbsLd(trail), faqLd(l.faq)],
    });
  }

  /* Standortseiten */
  for (const o of ctx.orte) {
    const trail = [['Startseite', 'index'], ['Einsatzgebiet', 'index#einsatzgebiet'], [o.nav, o.slug]];
    pages.push({
      slug: o.slug, hasContact: true, title: o.title, description: o.description,
      body: [
        c.pageHero({ eyebrow: 'Einsatzgebiet', h1: o.h1, lead: o.lead, trail }),
        `<section class="sec"><div class="wrap split split--map">
    <div class="prose">
      ${o.sections.map((s) => `<h2>${s.h}</h2>\n      ${s.p.map((p) => `<p>${p}</p>`).join('')}`).join('\n      ')}
      <h2>${o.placesLabel}, in denen wir räumen</h2>
      <ul class="places">${o.places.map((p) => `<li>${p}</li>`).join('')}</ul>
    </div>
    <figure class="map">${ctx.map(o.town)}<figcaption>Schematische Karte. Der Kreis zeigt 50 km Luftlinie ab ${SITE.street}.</figcaption></figure>
  </div></section>`,
        `<section class="sec sec--tint" aria-labelledby="lst-h"><div class="wrap">
    <header class="sec__head"><p class="eyebrow">Leistungen</p><h2 id="lst-h">Das übernehmen wir ${o.wo}</h2></header>
    ${c.svcGrid('h3')}
  </div></section>`,
        c.faqBlock(o.faq, { title: `Fragen zur Entrümpelung ${o.wo}` }),
        kontakt(),
      ].join('\n'),
      jsonld: [serviceLd({ ...o, nav: 'Entrümpelung und Haushaltsauflösung' }, o.places.slice(0, 8).join(', ')), crumbsLd([['Startseite', 'index'], [o.nav, o.slug]]), faqLd(o.faq)],
    });
  }

  /* Kosten */
  const ex = (label, s) => { const k = kalkuliere(s, PREISE, TYPEN); return `<tr><th scope="row">${label}</th><td>${eur(k.lo)} – ${eur(k.hi)} €</td></tr>`; };
  const faqKosten = [
    { q: 'Ist der Kostenrahmen verbindlich?', a: 'Nein. Er ist eine unverbindliche Orientierung. Den verbindlichen Festpreis nennen wir nach der kostenlosen Besichtigung, weil erst dann Menge, Tragewege und Zusatzarbeiten feststehen.' },
    { q: 'Was ist im Preis enthalten?', a: 'Räumung, Abtransport, fachgerechte Entsorgung und die besenreine Übergabe. Die Anfahrt berechnen wir je nach Entfernung separat. Zusatzarbeiten wie der Abbau einer Einbauküche stehen gesondert im Angebot.' },
    { q: 'Warum kostet eine höhere Etage mehr?', a: 'Ohne Aufzug muss jedes Stück durchs Treppenhaus getragen werden. Dafür setzen wir je Etage 5 Prozent an.' },
    { q: 'Rechnen Sie Wertgegenstände an?', a: 'Eine allgemeine Wertanrechnung bieten wir nicht an. Außergewöhnlich wertvolle Gegenstände können wir im Einzelfall individuell besprechen.' },
    { q: 'Kann ich die Kosten absetzen?', a: 'Im eigenen, selbst bewohnten Haushalt können 20 Prozent der Arbeitskosten als haushaltsnahe Dienstleistung die Einkommensteuer mindern, höchstens 4.000 Euro im Jahr (§ 35a EStG). Voraussetzung sind Rechnung und unbare Zahlung. Bitte klären Sie Ihren Fall mit Ihrer Steuerberatung.' },
  ];
  pages.push({
    slug: 'entruempelung-kosten', hasContact: true,
    title: 'Entrümpelung Kosten Wiesbaden: Rechner & Beispiele',
    description: 'Was kostet eine Entrümpelung in Wiesbaden? Rechner mit unverbindlichem Kostenrahmen nach Fläche, Füllgrad und Etage, dazu Beispielrechnungen.',
    body: [
      c.pageHero({ eyebrow: 'Kosten', h1: 'Was kostet eine Entrümpelung in Wiesbaden?', lead: 'Der Rechner zeigt einen unverbindlichen Kostenrahmen für Ihren Fall. Den verbindlichen Festpreis erhalten Sie nach der kostenlosen Besichtigung.', trail: [['Startseite', 'index'], ['Kosten', 'entruempelung-kosten']], primary: ['Zum Rechner', '#kostenrechner'] }),
      P('kostenrechner', { CALC_H: 'h2' }),
      `<section class="sec" aria-labelledby="faktoren-h"><div class="wrap split">
    <div class="prose">
      <h2 id="faktoren-h">Wovon der Preis abhängt</h2>
      <p>Vier Dinge bestimmen den Aufwand: die Fläche, der Füllgrad, der Weg nach draußen und zusätzliche Arbeiten.</p>
      <ul class="ticks">
        <li><strong>Fläche und Füllgrad.</strong> Eine fast leere Wohnung ist schnell geräumt. Eine über Jahrzehnte bewohnte braucht deutlich länger.</li>
        <li><strong>Etage und Aufzug.</strong> Ohne Aufzug kommen je Etage 5 Prozent hinzu.</li>
        <li><strong>Nebenräume.</strong> Keller, Dachboden und Garage zählen als eigene Flächen.</li>
        <li><strong>Zusatzarbeiten.</strong> Einbauküche abbauen, Böden oder Tapeten entfernen: Das steht gesondert im Angebot.</li>
        <li><strong>Anfahrt.</strong> Sie wird je nach Entfernung separat berechnet.</li>
      </ul>
      <h2>Beispielrechnungen</h2>
      <p>Die Beispiele sind mit demselben Rechner ermittelt und ebenso unverbindlich.</p>
      <div class="tablewrap"><table class="pricetable">
        <thead><tr><th scope="col">Beispiel</th><th scope="col">Kostenrahmen</th></tr></thead>
        <tbody>
          ${ex('Kellerabteil, 10 m², sehr voll', { typ: 'keller', flaeche: 10, fuell: 3, etage: 0, aufzug: false })}
          ${ex('2-Zimmer-Wohnung, 55 m², normal möbliert, Erdgeschoss', { typ: 'wohnung', flaeche: 55, fuell: 2, etage: 0, aufzug: false })}
          ${ex('3-Zimmer-Wohnung, 75 m², normal möbliert, 3. Etage ohne Aufzug', { typ: 'wohnung', flaeche: 75, fuell: 2, etage: 3, aufzug: false })}
          ${ex('3-Zimmer-Wohnung, 75 m², sehr voll, mit Aufzug', { typ: 'wohnung', flaeche: 75, fuell: 3, etage: 3, aufzug: true })}
          ${ex('Einfamilienhaus, 140 m², normal möbliert, mit Keller und Garage', { typ: 'haus', flaeche: 140, fuell: 2, etage: 0, aufzug: false, keller: true, garage: true })}
        </tbody>
      </table></div>
      <p class="fineprint">Alle Angaben unverbindlich, für Räumung und Entsorgung, zuzüglich Anfahrt und Zusatzarbeiten.</p>
    </div>
    ${c.asideCard()}
  </div></section>`,
      c.faqBlock(faqKosten, { title: 'Fragen zu den Kosten' }),
      kontakt(),
    ].join('\n'),
    jsonld: [crumbsLd([['Startseite', 'index'], ['Kosten', 'entruempelung-kosten']]), faqLd(faqKosten)],
  });

  /* Über uns */
  pages.push({
    slug: 'ueber-uns', hasContact: true,
    title: 'Über uns: Paul Hansen & Die Aufräumer Wiesbaden',
    description: 'Die Aufräumer Wiesbaden: inhabergeführt von Paul Hansen, Sitz am Luxemburgplatz, Einsatz in Wiesbaden und 50 km Umkreis. Mit echten Vorher-Nachher-Fotos.',
    body: [
      c.pageHero({ eyebrow: 'Über uns', h1: 'Inhabergeführt, in Wiesbaden zu Hause.', lead: 'Die Aufräumer Wiesbaden übernehmen Entrümpelungen aller Art: schnell, diskret und zuverlässig. Von der Haushaltsauflösung bis zur Messie-Räumung.', trail: [['Startseite', 'index'], ['Über uns', 'ueber-uns']] }),
      c.inhaber().replace('<h2 id="inhaber-h">', '<h2 id="inhaber-h">'),
      `<section class="sec sec--tint" aria-labelledby="arbeit-h"><div class="wrap">
    <header class="sec__head"><p class="eyebrow">So arbeiten wir</p><h2 id="arbeit-h">Vier Dinge, auf die Sie sich verlassen können.</h2></header>
    <ul class="b2bgrid">
      <li>${icon('i-calendar', 'i i--lg')}<h3>Fester Termin, klarer Ablauf</h3><p>Der Räumungstermin steht im Angebot. Sie wissen vorher, wann wir kommen und wann die Räume leer sind.</p></li>
      <li>${icon('i-user', 'i i--lg')}<h3>Ein Ansprechpartner</h3><p>Von der Anfrage bis zur Abnahme sprechen Sie mit derselben Person.</p></li>
      <li>${icon('i-recycle', 'i i--lg')}<h3>Fachgerechte Entsorgung</h3><p>Wir trennen und entsorgen nachvollziehbar, auf Wunsch mit Nachweis.</p></li>
      <li>${icon('i-camera', 'i i--lg')}<h3>Besenrein, auf Wunsch dokumentiert</h3><p>Am Ende sind die Räume leer und gefegt. Auf Wunsch erhalten Sie Fotos vom Ergebnis.</p></li>
    </ul>
  </div></section>`,
      c.gallery('h2'),
      kontakt(),
    ].join('\n'),
    jsonld: [businessLd(), crumbsLd([['Startseite', 'index'], ['Über uns', 'ueber-uns']])],
  });

  /* Kontakt */
  pages.push({
    slug: 'kontakt', hasContact: true,
    title: 'Kontakt: Die Aufräumer Wiesbaden anrufen oder schreiben',
    description: `Die Aufräumer Wiesbaden: Telefon ${SITE.phone}, E-Mail ${SITE.email}. ${SITE.hoursShort}. Rückruf vereinbaren.`,
    body: [
      c.pageHero({ eyebrow: 'Kontakt', h1: 'Anrufen, schreiben oder Rückruf vereinbaren.', lead: `Am schnellsten geht es am Telefon: ${SITE.phone}. Wir sind ${SITE.hoursShort.replace('Mo–Fr', 'montags bis freitags von').replace('Sa–So', 'samstags und sonntags von').replace(/(\d+)–(\d+) Uhr/g, '$1 bis $2 Uhr')} erreichbar.`, trail: [['Startseite', 'index'], ['Kontakt', 'kontakt']], primary: [`Anrufen: ${SITE.phone}`, `tel:${SITE.phoneIntl}`], secondary: ['Rückruf vereinbaren', '#kontakt'] }),
      kontakt(),
      `<section class="sec" aria-labelledby="weg-h"><div class="wrap split">
    <div class="prose">
      <h2 id="weg-h">Sitz und Einsatzgebiet</h2>
      <p>${SITE.name}<br>${SITE.street}<br>${SITE.zip} ${SITE.city}</p>
      <p>Besichtigungen finden bei Ihnen vor Ort statt. Unser Einsatzgebiet reicht rund ${SITE.radiusKm} Kilometer um Wiesbaden.</p>
      <p><a class="textlink" href="${SITE.mapsUrl}" target="_blank" rel="noopener">Auf Google Maps ansehen</a></p>
      <p><a class="textlink" href="${u('index#einsatzgebiet')}">Ort im Einsatzgebiet prüfen</a></p>
    </div>
    ${c.asideCard()}
  </div></section>`,
    ].join('\n'),
    jsonld: [businessLd(), crumbsLd([['Startseite', 'index'], ['Kontakt', 'kontakt']])],
  });

  /* Makler & Hausverwaltungen */
  pages.push({
    slug: 'makler-hausverwaltungen', hasContact: true,
    title: 'Entrümpelung für Makler & Hausverwaltungen Wiesbaden',
    description: 'Für Makler und Hausverwaltungen in Wiesbaden und Rhein-Main: Objekt leer bis zum Übergabetermin, Räumung ohne Ihre Anwesenheit, Fotodokumentation.',
    body: [
      c.pageHero({ eyebrow: 'Für Makler &amp; Hausverwaltungen', h1: 'Sie nennen den Termin. Wir übergeben das Objekt leer.', lead: 'Räumung, Rückbau und Entsorgung aus einer Hand, auf Wunsch dokumentiert für Eigentümer, Erben und Akte. Ein Ansprechpartner von der Objektmeldung bis zur Übergabe.', trail: [['Startseite', 'index'], ['Makler & Hausverwaltungen', 'makler-hausverwaltungen']], primary: ['Objekt anfragen', '#objektanfrage'] }),
      `<section class="sec" aria-labelledby="b2b-v-h"><div class="wrap">
    <header class="sec__head"><p class="eyebrow">Zusammenarbeit</p><h2 id="b2b-v-h">Was Sie von uns erwarten können.</h2></header>
    <ul class="b2bgrid">
      <li>${icon('i-calendar', 'i i--lg')}<h3>Termin mit Zusage</h3><p>Der Räumungstermin steht im Angebot. Wird er eng, erfahren Sie es vorher.</p></li>
      <li>${icon('i-key', 'i i--lg')}<h3>Räumung ohne Ihre Anwesenheit</h3><p>Nach der Besichtigung genügt die Schlüsselübergabe.</p></li>
      <li>${icon('i-camera', 'i i--lg')}<h3>Fotodokumentation</h3><p>Auf Wunsch dokumentieren wir den Zustand vor und nach der Räumung.</p></li>
      <li>${icon('i-doc', 'i i--lg')}<h3>Angebot je Objekt</h3><p>Festpreis nach Besichtigung und ordentliche Rechnung an WEG, Eigentümer oder Erbengemeinschaft.</p></li>
      <li>${icon('i-tools', 'i i--lg')}<h3>Rückbau im selben Einsatz</h3><p>Einbauküchen, Teppichböden, Tapeten und Einbauten entfernen wir gleich mit.</p></li>
      <li>${icon('i-user', 'i i--lg')}<h3>Ein Ansprechpartner</h3><p>${SITE.owner} ist für Sie, Ihre Eigentümer und die Erben direkt erreichbar.</p></li>
    </ul>
  </div></section>`,
      `<section class="sec sec--tint" aria-labelledby="b2b-f-h"><div class="wrap split">
    <div class="prose">
      <p class="eyebrow">Typische Aufträge</p>
      <h2 id="b2b-f-h">Vier Situationen, in denen Sie uns anrufen.</h2>
      <h3>Nachlassobjekt vor dem Verkauf</h3><p>Die Erben wohnen verstreut, das Haus steht voll. Wir räumen, legen Persönliches für die Familie beiseite und machen das Objekt fototauglich.</p>
      <h3>Mieterwechsel mit Frist</h3><p>Zwischen Auszug und Neuvermietung liegen wenige Tage. Wir räumen Zurückgelassenes und bauen Einbauten zurück.</p>
      <h3>Zurückgelassener Hausrat</h3><p>Nach einer Räumung, einem Auszug ohne Übergabe oder im Kellerabteil. Auf Wunsch dokumentieren wir den Zustand, bevor wir etwas bewegen.</p>
      <h3>Gewerbe und Gemeinschaftsflächen</h3><p>Büro, Lager, Fahrradkeller oder Dachboden der Eigentümergemeinschaft.</p>
    </div>
    <div>${c.beforeAfter('arbeitszimmer')}</div>
  </div></section>`,
      `<section class="sec" id="objektanfrage" aria-labelledby="objekt-h"><div class="wrap lead lead--b2b">
    <div class="lead__intro">
      <p class="eyebrow">Objektanfrage</p>
      <h2 id="objekt-h">Objekt melden, Angebot erhalten.</h2>
      <p>Adresse, Frist und Zugang genügen für den Anfang. Fotos oder ein Exposé können Sie nachreichen.</p>
      <ol class="lead__next"><li><strong>Rückmeldung</strong> per Telefon oder E-Mail</li><li><strong>Besichtigung</strong> vor Ort, kostenlos</li><li><strong>Festpreis</strong> je Objekt, schriftlich</li></ol>
    </div>
    <form class="lead__form" id="b2b-form" novalidate data-art="objektanfrage">
      <div class="lead__grid">
        <label class="field" for="b2b-firma"><span class="field__l">Unternehmen</span><input type="text" id="b2b-firma" name="firma" autocomplete="organization" required><span class="field__err" data-err="firma"></span></label>
        <label class="field" for="b2b-name"><span class="field__l">Ansprechperson</span><input type="text" id="b2b-name" name="name" autocomplete="name" required><span class="field__err" data-err="name"></span></label>
        <label class="field" for="b2b-tel"><span class="field__l">Telefon</span><input type="tel" id="b2b-tel" name="tel" autocomplete="tel" inputmode="tel" required><span class="field__err" data-err="tel"></span></label>
        <label class="field" for="b2b-mail"><span class="field__l">E-Mail</span><input type="email" id="b2b-mail" name="mail" autocomplete="email" required><span class="field__err" data-err="mail"></span></label>
        <label class="field" for="b2b-objekt"><span class="field__l">Objektadresse</span><input type="text" id="b2b-objekt" name="objekt" placeholder="Straße, PLZ, Ort" required><span class="field__err" data-err="objekt"></span></label>
        <label class="field" for="b2b-frist"><span class="field__l">Leer bis <em>freiwillig</em></span><input type="date" id="b2b-frist" name="frist"></label>
      </div>
      <label class="field" for="b2b-msg"><span class="field__l">Hinweise <em>freiwillig</em></span><textarea id="b2b-msg" name="nachricht" rows="3" maxlength="3000" placeholder="Zum Beispiel: Umfang, Rückbau, Zugang, Rechnungsempfänger"></textarea></label>
      <div class="field">
        <span class="field__l" id="b2b-fotos-l">Fotos <em>freiwillig, bis zu 8</em></span>
        <label class="drop" for="b2b-fotos">${icon('i-camera', 'i i--lg')}<span>Fotos des Objekts auswählen.</span><input type="file" id="b2b-fotos" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple aria-labelledby="b2b-fotos-l" data-fotos></label>
        <ul class="fotos" data-fotos-list aria-live="polite"></ul><span class="field__err" data-err="fotos"></span>
      </div>
      <div class="hp" aria-hidden="true"><label>Bitte leer lassen <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="check" for="b2b-ok"><input type="checkbox" id="b2b-ok" name="ok" required><span>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden. Mehr dazu im <a href="${u('datenschutzerklaerung')}">Datenschutz</a>.</span></label>
      <span class="field__err" data-err="ok"></span>
      <div class="lead__send"><button class="btn btn--gold btn--lg" type="submit">Objektanfrage senden</button><p>Kostenlos und unverbindlich.</p></div>
      <p class="form__status" role="status" data-status></p>
    </form>
    <div class="lead__done" id="b2b-done" hidden tabindex="-1">
      <span class="lead__donemark" aria-hidden="true">${icon('i-check')}</span>
      <h3>Danke. Die Objektanfrage ist bei uns.</h3>
      <p class="lead__demo" data-done-note>Wir melden uns schnellstmöglich bei Ihnen.</p>
      <div class="lead__send"><button class="textlink" type="button" data-again>Weiteres Objekt melden</button></div>
    </div>
  </div></section>`,
      kontakt(),
    ].join('\n'),
    jsonld: [serviceLd({ h1: 'Entrümpelung für Makler und Hausverwaltungen', nav: 'Entrümpelung für Geschäftskunden', description: 'Räumung, Rückbau und Entsorgung für Makler und Hausverwaltungen in Wiesbaden und Rhein-Main.', slug: 'makler-hausverwaltungen' }), crumbsLd([['Startseite', 'index'], ['Makler & Hausverwaltungen', 'makler-hausverwaltungen']])],
  });

  /* Rechtliches und Systemseiten */
  const legal = (h1, inner) => `<section class="sec legal"><div class="wrap legal__in">${c.crumbs([['Startseite', 'index'], [h1, 'x']])}<h1>${h1}</h1>${inner}</div></section>`;
  pages.push({
    slug: 'impressum', title: 'Impressum | Die Aufräumer Wiesbaden', description: 'Impressum der Aufräumer Wiesbaden, Inhaber Paul Hansen, Luxemburgplatz 5, 65185 Wiesbaden.',
    body: legal('Impressum', `
      <h2>Angaben gemäß § 5 DDG</h2>
      <p><strong>${SITE.name}</strong><br>Inhaber: ${SITE.owner}<br>${SITE.street}<br>${SITE.zip} ${SITE.city}<br>Deutschland</p>
      <h2>Kontakt</h2>
      <p>Telefon: <a href="tel:${SITE.phoneIntl}">${SITE.phone}</a><br>E-Mail: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <h2>Tätigkeit</h2>
      <p>Entrümpelung, Haushaltsauflösung, Rückbau und Umzüge.</p>
      ${ctx.preview ? `<div class="legal__todo"><p><strong>Nur in der Vorschau sichtbar: vor dem Livegang zu ergänzen</strong></p><ul><li>Umsatzsteuer-Identifikationsnummer oder Hinweis auf die Kleinunternehmerregelung</li><li>Hinweis zur Verbraucherstreitbeilegung (§ 36 VSBG)</li><li>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV), falls redaktionelle Inhalte folgen</li><li>Welche Telefonnummer gilt: Die bestehende Website nennt im Impressum 0179 4285761, sonst überall ${SITE.phone}.</li></ul></div>` : ''}`),
  });
  pages.push({
    slug: 'datenschutzerklaerung', title: 'Datenschutz | Die Aufräumer Wiesbaden', description: 'Datenschutzerklärung der Aufräumer Wiesbaden: welche Daten diese Website verarbeitet und wofür.',
    body: legal('Datenschutz', `
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website: ${SITE.owner}, ${SITE.name}, ${SITE.street}, ${SITE.zip} ${SITE.city}, ${SITE.email}.</p>
      <h2>Das Wichtigste in Kürze</h2>
      <ul>
        <li>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste.</li>
        <li>Schriften, Bilder und Skripte liegen auf dem eigenen Server. Es werden keine Inhalte von Drittanbietern nachgeladen.</li>
        <li>Wenn Sie ein Formular absenden, verwenden wir Ihre Angaben und Fotos ausschließlich, um Ihre Anfrage zu bearbeiten.</li>
      </ul>
      <h2>Aufruf der Website</h2>
      <p>Beim Aufruf verarbeitet der Hosting-Anbieter technisch notwendige Daten wie IP-Adresse, Zeitpunkt, aufgerufene Seite und Browsertyp in Server-Protokollen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im sicheren und stabilen Betrieb der Website.</p>
      <h2>Anfrage- und Rückrufformular</h2>
      <p>Ihre Angaben (Name, Telefonnummer, optional E-Mail-Adresse, Ort, Nachricht, Angaben zum Objekt und hochgeladene Fotos) werden per E-Mail an uns übermittelt und zur Bearbeitung Ihrer Anfrage verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen). Fotos werden nicht dauerhaft auf dem Webserver gespeichert. Zum Schutz vor Missbrauch speichert der Server für kurze Zeit eine gekürzte Prüfsumme der IP-Adresse.</p>
      <p>Wir löschen Anfragen, sobald sie erledigt sind und keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
      <h2>Kontakt per Telefon oder E-Mail</h2>
      <p>Wenn Sie uns anrufen oder schreiben, verarbeiten wir Ihre Angaben zur Beantwortung Ihres Anliegens (Art. 6 Abs. 1 lit. b und f DSGVO).</p>
      <h2>Links zu Google Maps</h2>
      <p>Wir verlinken auf unser Profil bei Google Maps. Erst wenn Sie den Link anklicken, werden Daten an Google übertragen.</p>
      <h2>Ihre Rechte</h2>
      <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, in Hessen beim Hessischen Beauftragten für Datenschutz und Informationsfreiheit.</p>
      ${ctx.preview ? `<div class="legal__todo"><p><strong>Nur in der Vorschau sichtbar: vor dem Livegang zu prüfen</strong></p><ul><li>Dieser Text ist ein auf die Technik dieser Website zugeschnittener Entwurf und ersetzt keine Rechtsberatung.</li><li>Name und Anschrift des Hosting-Anbieters sowie der Auftragsverarbeitungsvertrag fehlen.</li><li>Falls später Analyse, Karten oder Bewertungs-Widgets eingebunden werden, muss der Text ergänzt werden.</li></ul></div>` : ''}`),
  });
  pages.push({
    slug: 'danke', noindex: true, title: 'Danke für Ihre Anfrage | Die Aufräumer Wiesbaden', description: 'Ihre Anfrage ist bei uns eingegangen.',
    body: `<section class="sec legal"><div class="wrap legal__in"><h1>Danke. Ihre Anfrage ist bei uns.</h1><p>Wir melden uns schnellstmöglich bei Ihnen. Wenn es eilt, erreichen Sie uns telefonisch unter <a href="tel:${SITE.phoneIntl}">${SITE.phone}</a>.</p><p><a class="btn btn--ink" href="${u('index')}">Zur Startseite</a></p></div></section>`,
  });
  pages.push({
    slug: '404', noindex: true, title: 'Seite nicht gefunden | Die Aufräumer Wiesbaden', description: 'Diese Seite gibt es nicht mehr.',
    body: `<section class="sec legal"><div class="wrap legal__in"><h1>Diese Seite haben wir wohl mit ausgeräumt.</h1><p>Die Adresse gibt es nicht oder nicht mehr. Hier geht es weiter:</p><ul class="linklist"><li><a href="${u('index')}">Startseite${icon('i-arrow')}</a></li><li><a href="${u('leistungen')}">Leistungen${icon('i-arrow')}</a></li><li><a href="${u('entruempelung-kosten')}">Kosten berechnen${icon('i-arrow')}</a></li><li><a href="${u('kontakt')}">Kontakt${icon('i-arrow')}</a></li></ul></div></section>`,
  });
  return pages;
}
