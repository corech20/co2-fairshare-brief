(function () {
  'use strict';

  /* =====================================================================
     Stellschrauben für den Inhaber. Alles, was vor dem Livegang
     angepasst werden muss, steht in diesen beiden Blöcken.
     ===================================================================== */
  var CONFIG = {
    phone: '0611 000 000',     // Demo-Platzhalter. Echte Nummer eintragen, dann phoneIsDemo auf false.
    phoneIsDemo: true,
    formEndpoint: ''           // Adresse, an die Formulare gesendet werden. Leer = Vorschau, es wird nichts versendet.
  };

  // Demo-Kalkulation nach öffentlich genannten Marktspannen (Stand der Recherche: 2026).
  var PREISE = {
    grund: [180, 240],                         // Anfahrt und Rüstzeit, Euro
    proM3: [42, 60],                           // Euro je Kubikmeter Räumgut inklusive Entsorgung
    m3ProM2: { 1: 0.3, 2: 0.5, 3: 0.8, 4: 1.2 },  // Kubikmeter je Quadratmeter nach Füllgrad
    zusatzM3: { keller: 8, dach: 10, garage: 8 },  // Nebenräume bei normalem Füllgrad
    zusatzFaktor: { 1: 0.6, 2: 1, 3: 1.5, 4: 2 },
    etageOhneAufzug: 0.05,                     // Zuschlag je Etage ohne Aufzug
    etageMax: 0.25,
    kueche: [220, 380],                        // Einbauküche demontieren
    bodenProM2: [7, 11],                       // Teppich oder Laminat entfernen
    reinigungProM2: [3.5, 5.5],                // Grundreinigung
    m3ProTag: 32                               // Leistung eines Teams pro Tag
  };

  var TOWNS = /*__TOWNS__*/[];
  var ZONES = /*__ZONES__*/[];
  var RADIUS = 50;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var site = $('#site');
  document.documentElement.lang = 'de';

  /* ---------- Hinweis-Einblendung ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 5200);
  }

  /* ---------- Telefon ---------- */
  $$('[data-phone]').forEach(function (el) { el.textContent = CONFIG.phone; });
  $$('[data-call]').forEach(function (el) {
    if (CONFIG.phoneIsDemo) {
      el.addEventListener('click', function () {
        toast('Demo: Auf der Live-Seite startet hier der Anruf. Bis dahin führt der Link zum Rückruf-Formular.');
      });
    } else {
      el.setAttribute('href', 'tel:' + CONFIG.phone.replace(/[^\d+]/g, ''));
    }
  });
  function copyText(text, okMsg) {
    var done = function () { toast(okMsg); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Kopieren nicht möglich. Bitte den Text markieren und kopieren.'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  $$('[data-copy-phone]').forEach(function (b) {
    b.addEventListener('click', function () { copyText(CONFIG.phone, 'Nummer kopiert: ' + CONFIG.phone); });
  });

  /* ---------- Ansichten und Sprungmarken ---------- */
  var views = $$('.view');
  var viewNames = views.map(function (v) { return v.getAttribute('data-view'); });
  var mnav = $('#mnav'), menuBtn = $('.hdr__menu');
  function setMenu(open) {
    if (!mnav) return;
    mnav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });

  var skipHash = false;
  function showView(name) {
    views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
  }
  function go(id, opts) {
    opts = opts || {};
    setMenu(false);
    var target = null, view = 'start';
    if (viewNames.indexOf(id) > -1 && id !== 'start') { view = id; }
    else if (id) {
      target = document.getElementById(id);
      if (target) { var v = target.closest('.view'); if (v) view = v.getAttribute('data-view'); }
    }
    var current = views.filter(function (v) { return !v.hidden; })[0];
    var changed = !current || current.getAttribute('data-view') !== view;
    showView(view);
    var behavior = (opts.instant || changed || reduced) ? 'auto' : 'smooth';
    if (target && id !== 'start') target.scrollIntoView({ behavior: behavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior: behavior });
    if (!opts.silent && location.hash !== '#' + id) { skipHash = true; try { location.hash = id; } catch (e) { skipHash = false; } }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    var preset = a.getAttribute('data-preset');
    if (preset) { try { applyPreset(JSON.parse(preset)); } catch (err) { /* Voreinstellung überspringen */ } }
    go(id);
  });
  window.addEventListener('hashchange', function () {
    if (skipHash) { skipHash = false; return; }   // eigene Änderung, Ansicht steht schon
    go(location.hash.slice(1) || 'start', { silent: true });
  });
  if (location.hash.length > 1) go(location.hash.slice(1), { silent: true, instant: true });

  /* ---------- Überschrift räumt sich auf ---------- */
  (function tidy() {
    var el = $('[data-tidy]');
    if (!el || reduced) return;
    var label = Array.prototype.map.call(el.childNodes, function (n) { return n.nodeType === 3 ? n.textContent : ' '; }).join('').replace(/\s+/g, ' ').trim();
    var d = 0, rnd = function (seed) { var x = Math.sin(seed * 99.13) * 43758.5453; return x - Math.floor(x); };
    var out = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 1) { out.appendChild(node.cloneNode()); return; }
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        part.split('').forEach(function (ch) {
          var s = document.createElement('span'); s.className = 'ch'; s.textContent = ch;
          s.style.setProperty('--d', d);
          s.style.setProperty('--mx', ((rnd(d + 1) - .5) * 22).toFixed(1) + 'px');
          s.style.setProperty('--my', ((rnd(d + 7) - .5) * 30).toFixed(1) + 'px');
          s.style.setProperty('--mr', ((rnd(d + 13) - .5) * 26).toFixed(1) + 'deg');
          d++; w.appendChild(s);
        });
        out.appendChild(w);
      });
    });
    var original = el.innerHTML;
    var holder = document.createElement('span');
    holder.setAttribute('aria-hidden', 'true');
    holder.appendChild(out);
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label;
    el.appendChild(sr); el.appendChild(holder);
    el.classList.add('tidy', 'is-messy');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('is-messy'); }); });
    // Danach wieder der schlichte Text: gleiche Laufweite wie ohne Bewegung, weniger Elemente
    setTimeout(function () { el.innerHTML = original; el.classList.remove('tidy'); }, 950 + d * 26 + 200);
  })();

  /* ---------- Haus: Regler von voll zu frei ---------- */
  (function house() {
    var range = $('#clear-range'), svg = $('.house__svg'), status = $('#clear-status');
    if (!range || !svg) return;
    var zoneEls = {}, btns = {};
    ZONES.forEach(function (id) {
      zoneEls[id] = $('.zone[data-zone="' + id + '"]', svg);
      btns[id] = $('.clear__zone[data-zone="' + id + '"]');
    });
    var narrow = window.matchMedia('(max-width: 640px)');
    var active = function () { return narrow.matches ? ZONES.slice(0, ZONES.length - 1) : ZONES; };
    var rest = Number(range.value) / 100, raf = 0, hovered = null;

    function render(p) {
      var list = active(), span = 1 / list.length, done = 0, current = null;
      list.forEach(function (id, i) {
        var t = Math.max(0, Math.min(1, (p - i * span) / span));
        zoneEls[id].style.setProperty('--t', t.toFixed(3));
        if (t >= 0.999) done++;
        else if (t > 0 && !current) current = id;
        if (btns[id]) btns[id].classList.toggle('is-done', t >= 0.999);
      });
      if (list.length < ZONES.length) {   // schmale Ansicht: Garage ist nicht im Bild und läuft mit dem Keller mit
        var last = ZONES[ZONES.length - 1], prev = ZONES[ZONES.length - 2];
        zoneEls[last].style.setProperty('--t', zoneEls[prev].style.getPropertyValue('--t'));
      }
      ZONES.forEach(function (id) {
        var on = (hovered || current) === id;
        zoneEls[id].classList.toggle('is-active', on);
        if (btns[id]) btns[id].classList.toggle('is-active', on);
      });
      range.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      var text = done === 0 ? 'Noch ist alles voll' : done >= list.length ? 'Alles geräumt und besenrein' : done + ' von ' + list.length + ' Bereichen geräumt';
      status.textContent = text;
      range.setAttribute('aria-valuetext', text);
    }
    function animateTo(to, ms) {
      cancelAnimationFrame(raf);
      var from = Number(range.value) / 100, t0 = performance.now();
      if (reduced) { range.value = Math.round(to * 100); render(to); return; }
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var p = from + (to - from) * e;
        range.value = Math.round(p * 100); render(p);
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function stopHint() { cancelAnimationFrame(raf); range.classList.remove('is-hinting'); }

    range.addEventListener('input', function () { stopHint(); render(Number(range.value) / 100); });
    ['pointerdown', 'keydown'].forEach(function (ev) { range.addEventListener(ev, stopHint); });
    ZONES.forEach(function (id) {
      var jump = function () {
        stopHint();
        var list = active(), i = Math.min(list.indexOf(id) > -1 ? list.indexOf(id) : list.length - 1, list.length - 1);
        animateTo((i + 1) / list.length, 700);
      };
      zoneEls[id].addEventListener('click', jump);
      if (btns[id]) {
        btns[id].addEventListener('click', jump);
        btns[id].addEventListener('mouseenter', function () { hovered = id; render(Number(range.value) / 100); });
        btns[id].addEventListener('mouseleave', function () { hovered = null; render(Number(range.value) / 100); });
      }
    });
    if (narrow.addEventListener) narrow.addEventListener('change', function () { render(Number(range.value) / 100); });

    // Auftakt: das Haus räumt sich bis zum Ruhezustand, danach lädt der Regler zum Ziehen ein
    if (reduced) { render(rest); }
    else {
      range.value = 0; render(0);
      setTimeout(function () { animateTo(rest, 2300); }, 350);
      setTimeout(function () { range.classList.add('is-hinting'); }, 2900);
    }
  })();

  /* ---------- Anlässe (Reiter) ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      if (window.matchMedia('(max-width: 919px)').matches) {
        var top = tab.getBoundingClientRect().top;
        if (top < 80 || top > window.innerHeight * 0.6) tab.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    }
    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------- Festpreis-Rechner ---------- */
  var calc = $('#calc');
  var TYP = {
    wohnung: { name: 'Wohnung', min: 20, max: 200, step: 5, def: 70, help: 'Die Wohnfläche aus dem Mietvertrag genügt. Geschätzt ist völlig in Ordnung.', addons: true, etage: true },
    haus: { name: 'Haus', min: 60, max: 400, step: 10, def: 140, help: 'Wohnfläche aller Etagen zusammen, grob geschätzt.', addons: true, etage: false },
    keller: { name: 'Keller', min: 4, max: 80, step: 2, def: 14, help: 'Grundfläche des Raums. Ein Kellerabteil hat meist 5 bis 15 m².', addons: false, etage: false },
    dach: { name: 'Dachboden', min: 4, max: 120, step: 2, def: 30, help: 'Begehbare Grundfläche, grob geschätzt.', addons: false, etage: true },
    garage: { name: 'Garage / Schuppen', min: 4, max: 80, step: 2, def: 16, help: 'Eine Einzelgarage hat rund 15 bis 18 m².', addons: false, etage: false },
    gewerbe: { name: 'Büro / Gewerbe', min: 20, max: 600, step: 10, def: 120, help: 'Nutzfläche, grob geschätzt.', addons: true, etage: true }
  };
  var FUELL = { 1: 'fast leer', 2: 'normal möbliert', 3: 'sehr voll', 4: 'überfüllt' };
  var ETAGE = ['Erdgeschoss', '1. Etage', '2. Etage', '3. Etage', '4. Etage', '5. Etage oder höher'];
  var TERMIN = { flexibel: 'zeitlich flexibel', bald: 'in den nächsten zwei Wochen', eilig: 'so schnell wie möglich' };
  var memo = {}, lastTyp = 'wohnung', lastPrice = '';
  var fmt = function (n) { return Math.round(n).toLocaleString('de-DE'); };
  var round10 = function (n) { return Math.round(n / 10) * 10; };

  function readCalc() {
    var f = calc.elements;
    return {
      typ: f.typ.value, flaeche: Number(f.flaeche.value), fuell: Number(f.fuell.value),
      etage: Number(f.etage.value), aufzug: f.aufzug.checked,
      keller: f.keller.checked, dach: f.dach.checked, garage: f.garage.checked,
      kueche: f.kueche.checked, boden: f.boden.checked, reinigung: f.reinigung.checked, wert: f.wert.checked,
      termin: f.termin.value
    };
  }
  /** Reine Rechenfunktion: Angaben -> Volumen, Preisrahmen, Einsatzdauer */
  function kalkuliere(s) {
    var t = TYP[s.typ];
    var m3 = s.flaeche * PREISE.m3ProM2[s.fuell];
    if (t.addons) ['keller', 'dach', 'garage'].forEach(function (k) { if (s[k]) m3 += PREISE.zusatzM3[k] * PREISE.zusatzFaktor[s.fuell]; });
    var zuschlag = (t.etage && !s.aufzug) ? Math.min(PREISE.etageMax, s.etage * PREISE.etageOhneAufzug) : 0;
    var lo = (PREISE.grund[0] + m3 * PREISE.proM3[0]) * (1 + zuschlag);
    var hi = (PREISE.grund[1] + m3 * PREISE.proM3[1]) * (1 + zuschlag);
    if (s.kueche) { lo += PREISE.kueche[0]; hi += PREISE.kueche[1]; }
    if (s.boden) { lo += s.flaeche * PREISE.bodenProM2[0]; hi += s.flaeche * PREISE.bodenProM2[1]; }
    if (s.reinigung) { lo += s.flaeche * PREISE.reinigungProM2[0]; hi += s.flaeche * PREISE.reinigungProM2[1]; }
    var tage = m3 / PREISE.m3ProTag;
    var einsatz = tage <= 0.3 ? 'ca. 2 bis 3 Stunden' : tage <= 0.62 ? 'ca. ein halber Tag' : tage <= 1.2 ? 'ca. 1 Tag' : tage <= 2.3 ? 'ca. 2 Tage' : tage <= 3.4 ? 'ca. 3 Tage' : 'mehrere Tage';
    return { m3: Math.round(m3), lo: round10(lo), hi: round10(hi), einsatz: einsatz };
  }
  function describe(s) {
    var t = TYP[s.typ], extra = [];
    if (t.addons) { if (s.keller) extra.push('Keller'); if (s.dach) extra.push('Dachboden'); if (s.garage) extra.push('Garage'); }
    var zusatz = [];
    if (s.kueche) zusatz.push('Küche abbauen');
    if (s.boden) zusatz.push('Boden entfernen');
    if (s.reinigung) zusatz.push('Grundreinigung');
    return {
      objekt: t.name + ', ' + s.flaeche + ' m²' + (extra.length ? ' + ' + extra.join(', ') : ''),
      fuell: FUELL[s.fuell],
      zugang: !t.etage ? 'ebenerdig' : ETAGE[s.etage] + (s.etage > 0 ? (s.aufzug ? ', mit Aufzug' : ', ohne Aufzug') : ''),
      zusatz: zusatz.length ? zusatz.join(', ') : 'keine'
    };
  }
  function renderCalc() {
    var f = calc.elements, typ = f.typ.value, t = TYP[typ], fl = f.flaeche;
    if (typ !== lastTyp) {
      memo[lastTyp] = Number(fl.value);
      fl.min = t.min; fl.max = t.max; fl.step = t.step;
      fl.value = memo[typ] || t.def;
      lastTyp = typ;
    }
    $('#calc-addons').hidden = !t.addons;
    $('#calc-etage').closest('fieldset').hidden = !t.etage;
    $('#calc-aufzug').closest('.switch').hidden = Number(f.etage.value) === 0;
    $$('fieldset', calc).filter(function (fs) { return !fs.hidden; }).forEach(function (fs, i) { $('.calc__no', fs).textContent = i + 1; });
    $('#calc-flaeche-help').textContent = t.help;
    $('#calc-flaeche-out').textContent = fl.value + ' m²';
    fl.style.setProperty('--p', ((fl.value - fl.min) / (fl.max - fl.min) * 100).toFixed(1) + '%');

    var s = readCalc(), k = kalkuliere(s), d = describe(s);
    $('#q-objekt').textContent = d.objekt;
    $('#q-fuell').textContent = d.fuell;
    $('#q-vol').textContent = 'ca. ' + k.m3 + ' m³';
    $('#q-zugang').textContent = d.zugang;
    $('#q-extras').textContent = d.zusatz;
    $('#q-einsatz').textContent = k.einsatz;
    $('#q-wert-row').hidden = !s.wert;
    var price = fmt(k.lo) + ' – ' + fmt(k.hi) + ' €';
    var priceEl = $('#q-preis');
    if (price !== lastPrice) {
      priceEl.textContent = price;
      if (lastPrice && !reduced) { priceEl.classList.remove('is-bump'); void priceEl.offsetWidth; priceEl.classList.add('is-bump'); }
      lastPrice = price;
    }
    var mp = $('#mbar-preis'); if (mp) mp.textContent = price;
    $('#q-hint').textContent = s.typ === 'gewerbe'
      ? 'Für gewerbliche Flächen erstellen wir das Angebot netto und weisen die Umsatzsteuer aus.'
      : s.termin === 'eilig'
        ? 'Wenn es eilt, geht es am Telefon am schnellsten. Nennen Sie uns gleich Ihren Termin.'
        : s.wert
          ? 'Verwertbares schätzen wir bei der Besichtigung. Der Betrag wird im Angebot abgezogen.'
          : 'Bei privat genutztem Wohnraum lassen sich 20 % der Arbeitskosten steuerlich absetzen (§ 35a EStG).';
    return { s: s, k: k, d: d, price: price };
  }
  function applyPreset(p) {
    if (!calc) return;
    var f = calc.elements;
    if (p.typ) { f.typ.value = p.typ; renderCalc(); }
    ['keller', 'dach', 'garage', 'kueche', 'boden', 'reinigung', 'wert'].forEach(function (k) { f[k].checked = !!p[k]; });
    if (p.flaeche) f.flaeche.value = p.flaeche;
    if (p.fuell) f.fuell.value = String(p.fuell);
    f.termin.value = p.termin || 'flexibel';
    renderCalc();
  }
  if (calc) {
    calc.addEventListener('input', renderCalc);
    calc.addEventListener('change', renderCalc);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    renderCalc();
  }

  /* ---------- Ortscheck ---------- */
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  TOWNS.forEach(function (t) { t.key = norm(t.n); });
  function findTown(q) {
    var raw = String(q).trim(), n = norm(raw);
    if (n.length < 3) return null;
    if (/^\d+$/.test(n)) {
      var hits = TOWNS.filter(function (t) { return t.plz.some(function (p) { return n.length >= p.length ? n.indexOf(p) === 0 : p.indexOf(n) === 0; }); });
      if (hits.length) return hits.sort(function (a, b) { return a.km - b.km; })[0];
      if (n.length === 5) return { unknown: true, region: ['65', '55', '60', '61', '63', '64'].indexOf(n.slice(0, 2)) > -1, q: raw };
      return null;
    }
    var starts = TOWNS.filter(function (t) { return t.key.indexOf(n) === 0; });
    if (starts.length) return starts[0];
    var inc = TOWNS.filter(function (t) { return t.key.indexOf(n) > -1 || t.id.indexOf(n.replace(/ /g, '-')) > -1; });
    if (inc.length) return inc[0];
    return n.length >= 4 ? { unknown: true, region: false, name: true, q: raw } : null;
  }
  function townMessage(t) {
    if (!t) return null;
    if (t.unknown) {
      if (t.name) return { state: 'unknown', html: '<strong>' + esc(t.q) + '</strong> kennt der Ortscheck noch nicht. Fragen Sie einfach an, wir sagen Ihnen sofort Bescheid.' };
      return t.region
        ? { state: 'unknown', html: 'Die PLZ <strong>' + esc(t.q) + '</strong> kennt der Ortscheck nicht, sie liegt aber in unserer Region. Fragen Sie an, wir prüfen das sofort.' }
        : { state: 'out', html: 'Die PLZ <strong>' + esc(t.q) + '</strong> liegt voraussichtlich außerhalb unseres Gebiets. Für größere Aufträge lohnt die Anfrage trotzdem.' };
    }
    if (t.km <= 3) return { state: 'in', id: t.id, html: '<strong>' + esc(t.n) + '</strong> ist unser Zuhause. Kürzer wird die Anfahrt nicht.' };
    if (t.km <= RADIUS) return { state: 'in', id: t.id, html: '<strong>' + esc(t.n) + '</strong> liegt im Einsatzgebiet, rund ' + t.km + ' km Luftlinie vom Luxemburgplatz.' };
    if (t.km <= RADIUS + 8) return { state: 'edge', id: t.id, html: '<strong>' + esc(t.n) + '</strong> liegt mit rund ' + t.km + ' km am Rand unseres Gebiets. Fragen Sie an, meist finden wir eine Lösung.' };
    return { state: 'out', id: t.id, html: '<strong>' + esc(t.n) + '</strong> liegt mit rund ' + t.km + ' km außerhalb unseres üblichen Gebiets. Für größere Aufträge kommen wir nach Absprache.' };
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  (function areaCheck() {
    var form = $('#areacheck'); if (!form) return;
    var input = $('#area-input'), out = $('#area-result'), icon = '<svg class="i" aria-hidden="true"><use href="#i-check"/></svg>', info = '<svg class="i" aria-hidden="true"><use href="#i-info"/></svg>';
    function mark(id) {
      $$('.map__svg .is-hit').forEach(function (g) { g.classList.remove('is-hit'); });
      if (!id) return;
      var g = $('.map__svg [data-town="' + id + '"]'); if (g) g.classList.add('is-hit');
    }
    function check(final) {
      var q = input.value, m = townMessage(findTown(q));
      if (!m) {
        if (final) { out.setAttribute('data-state', 'unknown'); out.innerHTML = info + '<span>Bitte geben Sie mindestens drei Zeichen ein, zum Beispiel 65185 oder Eltville.</span>'; mark(null); }
        return;
      }
      out.setAttribute('data-state', m.state);
      out.innerHTML = (m.state === 'in' ? icon : info) + '<span>' + m.html + '</span>';
      mark(m.id);
    }
    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { check(false); }, 220); });
    form.addEventListener('submit', function (e) { e.preventDefault(); check(true); });
    mark('mainz');
  })();

  /* ---------- Formulare ---------- */
  var RULES = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.'; },
    firma: function (v) { return v.trim().length >= 2 ? '' : 'Bitte nennen Sie Ihr Unternehmen.'; },
    tel: function (v) { return v.replace(/\D/g, '').length >= 6 ? '' : 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.'; },
    mail: function (v, el) { return (!v && !el.required) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Bitte prüfen Sie die E-Mail-Adresse.'; },
    ort: function (v) { return v.trim().length >= 3 ? '' : 'Bitte nennen Sie PLZ oder Ort des Objekts.'; },
    objekt: function (v) { return v.trim().length >= 6 ? '' : 'Bitte geben Sie die Objektadresse an.'; },
    ok: function (v, el) { return el.checked ? '' : 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.'; }
  };
  function validate(form) {
    var first = null;
    Object.keys(RULES).forEach(function (name) {
      var el = form.elements[name]; if (!el || el.length) return;
      var msg = RULES[name](el.value, el), slot = $('[data-err="' + name + '"]', form);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (slot) slot.textContent = msg;
      if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  function send(payload) {
    if (!CONFIG.formEndpoint) return Promise.resolve('demo');
    return fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('Versand fehlgeschlagen'); return 'ok'; });
  }
  function wireForm(opts) {
    var form = $(opts.form), done = $(opts.done); if (!form || !done) return;
    form.addEventListener('input', function (e) {
      var el = e.target; if (el.getAttribute && el.getAttribute('aria-invalid') === 'true' && RULES[el.name]) {
        var msg = RULES[el.name](el.value, el), slot = $('[data-err="' + el.name + '"]', form);
        el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (slot) slot.textContent = msg;
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var data = opts.collect(form), btn = $('[type="submit"]', form);
      btn.disabled = true;
      send(data.payload).then(function () {
        if (opts.summary) $(opts.summary).textContent = data.text;
        if (opts.heading) $(opts.heading).textContent = 'Danke, ' + data.payload.name.trim().split(' ')[0] + '. ' + opts.headingTail;
        form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
        done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }).catch(function () {
        toast('Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie an: ' + CONFIG.phone);
      }).then(function () { btn.disabled = false; });
    });
    if (opts.again) $(opts.again).addEventListener('click', function () { done.hidden = true; form.hidden = false; (form.querySelector('input') || form).focus(); });
  }
  var ZEIT = { egal: 'jederzeit', vormittags: 'vormittags', nachmittags: 'nachmittags', abends: 'abends', heute: 'heute noch' };

  wireForm({
    form: '#lead-form', done: '#lead-done', summary: '#lead-summary', heading: '#lead-done-h', headingTail: 'Ihre Anfrage ist vollständig.', again: '#lead-again',
    collect: function (form) {
      var f = form.elements, r = renderCalc(), fotos = f.fotos.files ? f.fotos.files.length : 0;
      var lines = [
        'Anfrage an Die Aufräumer Wiesbaden', '',
        'Objekt:        ' + r.d.objekt,
        'Füllgrad:      ' + r.d.fuell,
        'Volumen:       ca. ' + r.k.m3 + ' m³',
        'Zugang:        ' + r.d.zugang,
        'Zusatz:        ' + r.d.zusatz,
        'Verwertbares:  ' + (r.s.wert ? 'ja' : 'nein'),
        'Termin:        ' + TERMIN[r.s.termin],
        'Kostenrahmen:  ' + r.price + ' (Demo-Kalkulation)', '',
        'Name:          ' + f.name.value.trim(),
        'Telefon:       ' + f.tel.value.trim(),
        f.mail.value ? 'E-Mail:        ' + f.mail.value.trim() : null,
        'Ort:           ' + f.ort.value.trim(),
        'Erreichbar:    ' + ZEIT[f.zeit.value],
        fotos ? 'Fotos:         ' + fotos + (fotos === 1 ? ' Datei' : ' Dateien') : null,
        f.msg.value.trim() ? '' : null,
        f.msg.value.trim() ? 'Nachricht: ' + f.msg.value.trim() : null
      ].filter(function (l) { return l !== null; });
      return { text: lines.join('\n'), payload: { art: 'festpreis', name: f.name.value, tel: f.tel.value, mail: f.mail.value, ort: f.ort.value, zeit: f.zeit.value, nachricht: f.msg.value, angaben: r.s, kostenrahmen: [r.k.lo, r.k.hi], fotos: fotos } };
    }
  });
  wireForm({
    form: '#callback-form', done: '#callback-done', heading: '#callback-done-h', headingTail: 'Der Rückruf ist notiert.', again: '#callback-again',
    collect: function (form) {
      var f = form.elements;
      return { text: '', payload: { art: 'rueckruf', name: f.name.value, tel: f.tel.value, thema: f.thema.value, zeit: f.zeit.value } };
    }
  });
  wireForm({
    form: '#b2b-form', done: '#b2b-done', summary: '#b2b-summary', again: '#b2b-again',
    collect: function (form) {
      var f = form.elements;
      var frist = f.frist.value ? new Date(f.frist.value + 'T12:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'keine Angabe';
      var lines = [
        'Objektanfrage an Die Aufräumer Wiesbaden', '',
        'Unternehmen:   ' + f.firma.value.trim(),
        'Ansprechperson: ' + f.name.value.trim(),
        'Telefon:       ' + f.tel.value.trim(),
        'E-Mail:        ' + f.mail.value.trim(),
        'Objekt:        ' + f.objekt.value.trim(),
        'Leer bis:      ' + frist,
        'Zugang:        ' + f.zugang.value,
        f.msg.value.trim() ? 'Hinweise:      ' + f.msg.value.trim() : null
      ].filter(function (l) { return l !== null; });
      return { text: lines.join('\n'), payload: { art: 'objekt', firma: f.firma.value, name: f.name.value, tel: f.tel.value, mail: f.mail.value, objekt: f.objekt.value, frist: f.frist.value, zugang: f.zugang.value, hinweise: f.msg.value } };
    }
  });

  var copyBtn = $('#lead-copy');
  if (copyBtn) copyBtn.addEventListener('click', function () { copyText($('#lead-summary').textContent, 'Zusammenfassung kopiert. Sie können sie jetzt in eine E-Mail oder Nachricht einfügen.'); });

  var fotos = $('#lead-fotos');
  if (fotos) fotos.addEventListener('change', function () {
    var n = fotos.files.length;
    $('#lead-fotos-info').textContent = n ? (n === 1 ? '1 Foto ausgewählt.' : n + ' Fotos ausgewählt.') + ' Zum Ändern erneut tippen.' : 'Fotos auswählen oder aufnehmen. Ein Bild pro Raum reicht meist.';
  });
  var leadOrt = $('#lead-ort');
  if (leadOrt) leadOrt.addEventListener('input', function () {
    var m = townMessage(findTown(leadOrt.value)), info = $('#lead-ort-info');
    info.innerHTML = m ? m.html : '';
    info.setAttribute('data-state', m ? m.state : '');
  });

  /* ---------- Schublade mit den Annahmen ---------- */
  (function drawer() {
    var el = $('#drawer'); if (!el) return;
    var panel = $('.drawer__panel', el), opener = null;
    function open(e) { opener = e.currentTarget; el.hidden = false; panel.focus(); document.addEventListener('keydown', onKey); }
    function close() { el.hidden = true; document.removeEventListener('keydown', onKey); if (opener) opener.focus(); }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button, a[href], input', panel), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    $$('[data-open-drawer]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-close-drawer]', el).forEach(function (b) { b.addEventListener('click', close); });
    var toggle = $('#demo-toggle');
    toggle.addEventListener('change', function () { site.classList.toggle('no-demo', !toggle.checked); });
  })();

  /* ---------- Mobile Leiste: weicht der Tastatur, zeigt beim Rechnen den Preis ---------- */
  (function mbar() {
    var bar = $('.mbar'); if (!bar) return;
    var main = $('#mbar-main'), form = $('#calc'), sum = $('.quote__sum'), lead = $('#anfrage');
    if (form && sum && 'IntersectionObserver' in window) {
      var seen = { form: false, sum: false, lead: false }, std = main.innerHTML;
      var update = function () {
        var on = seen.form && !seen.sum && !seen.lead;
        if (bar.classList.contains('is-price') === on) return;
        bar.classList.toggle('is-price', on);
        main.setAttribute('href', on ? '#anfrage' : '#festpreis');
        if (on) main.textContent = 'Festpreis anfordern'; else main.innerHTML = std;
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { seen[en.target === form ? 'form' : en.target === sum ? 'sum' : 'lead'] = en.isIntersecting; });
        update();
      }, { rootMargin: '-80px 0px -90px 0px' });
      io.observe(form); io.observe(sum); io.observe(lead);
    }
    document.addEventListener('focusin', function (e) { bar.classList.toggle('is-away', /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox' && e.target.type !== 'radio'); });
    document.addEventListener('focusout', function () { bar.classList.remove('is-away'); });
  })();
})();
