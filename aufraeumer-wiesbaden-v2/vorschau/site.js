(function () {
  'use strict';

  // Die folgenden Werte setzt build.mjs ein. Preise stehen in src/preise.mjs, Unternehmensdaten in src/site.mjs.
  var CONFIG = {"phone":"01514 6254168","endpoint":"","preview":true};
  var PREISE = {"satzProM2":{"1":25,"2":45,"3":65,"4":80},"spanne":0.1,"etageOhneAufzug":0.05,"etageMax":0.25,"nebenraumM2":{"keller":10,"dach":20,"garage":15}};
  var TYPEN = {"wohnung":{"addons":true,"etage":true},"haus":{"addons":true,"etage":false},"keller":{"addons":false,"etage":false},"dach":{"addons":false,"etage":true},"garage":{"addons":false,"etage":false},"gewerbe":{"addons":true,"etage":true}};
  var TOWNS = [{"id":"wiesbaden","n":"Wiesbaden","plz":["6518","6519","6520","55246","55252"],"km":1},{"id":"mainz","n":"Mainz","plz":["5511","5512","5513"],"km":9},{"id":"frankfurt-am-main","n":"Frankfurt am Main","plz":["603","604","605","6592","6593"],"km":32},{"id":"darmstadt","n":"Darmstadt","plz":["6428","6429"],"km":37},{"id":"offenbach-am-main","n":"Offenbach am Main","plz":["6306","6307"],"km":39},{"id":"ruesselsheim-am-main","n":"Rüsselsheim am Main","plz":["65428"],"km":15},{"id":"bad-homburg-v-d-hoehe","n":"Bad Homburg v. d. Höhe","plz":["6134","6135"],"km":32},{"id":"hofheim-am-taunus","n":"Hofheim am Taunus","plz":["65719"],"km":15},{"id":"taunusstein","n":"Taunusstein","plz":["65232"],"km":10},{"id":"idstein","n":"Idstein","plz":["65510"],"km":17},{"id":"eltville-am-rhein","n":"Eltville am Rhein","plz":["6534"],"km":10},{"id":"ruedesheim-am-rhein","n":"Rüdesheim am Rhein","plz":["65385"],"km":25},{"id":"bingen-am-rhein","n":"Bingen am Rhein","plz":["55411"],"km":27},{"id":"ingelheim-am-rhein","n":"Ingelheim am Rhein","plz":["55218"],"km":17},{"id":"bad-schwalbach","n":"Bad Schwalbach","plz":["65307"],"km":14},{"id":"limburg-a-d-lahn","n":"Limburg a. d. Lahn","plz":["6554","6555"],"km":37},{"id":"koenigstein-im-taunus","n":"Königstein im Taunus","plz":["61462"],"km":20},{"id":"oberursel","n":"Oberursel","plz":["61440"],"km":28},{"id":"eschborn","n":"Eschborn","plz":["65760"],"km":25},{"id":"bad-soden-am-taunus","n":"Bad Soden am Taunus","plz":["65812"],"km":21},{"id":"kelkheim","n":"Kelkheim","plz":["65779"],"km":17},{"id":"floersheim-am-main","n":"Flörsheim am Main","plz":["65439"],"km":15},{"id":"hochheim-am-main","n":"Hochheim am Main","plz":["65239"],"km":11},{"id":"gross-gerau","n":"Groß-Gerau","plz":["64521"],"km":24},{"id":"langen","n":"Langen","plz":["63225"],"km":32},{"id":"dreieich","n":"Dreieich","plz":["63303"],"km":33},{"id":"neu-isenburg","n":"Neu-Isenburg","plz":["63263"],"km":33},{"id":"moerfelden-walldorf","n":"Mörfelden-Walldorf","plz":["64546"],"km":26},{"id":"oppenheim","n":"Oppenheim","plz":["55276"],"km":26},{"id":"nieder-olm","n":"Nieder-Olm","plz":["55268"],"km":18},{"id":"alzey","n":"Alzey","plz":["55232"],"km":37},{"id":"bad-kreuznach","n":"Bad Kreuznach","plz":["5554"],"km":37},{"id":"niedernhausen","n":"Niedernhausen","plz":["65527"],"km":11},{"id":"bad-camberg","n":"Bad Camberg","plz":["65520"],"km":25},{"id":"geisenheim","n":"Geisenheim","plz":["65366"],"km":22},{"id":"oestrich-winkel","n":"Oestrich-Winkel","plz":["65375"],"km":17},{"id":"walluf","n":"Walluf","plz":["65396"],"km":7},{"id":"ginsheim-gustavsburg","n":"Ginsheim-Gustavsburg","plz":["65462"],"km":14},{"id":"bischofsheim","n":"Bischofsheim","plz":["65474"],"km":13},{"id":"hattersheim-am-main","n":"Hattersheim am Main","plz":["65795"],"km":18},{"id":"kriftel","n":"Kriftel","plz":["65830"],"km":17},{"id":"friedrichsdorf","n":"Friedrichsdorf","plz":["61381"],"km":35},{"id":"hanau","n":"Hanau","plz":["6345"],"km":50},{"id":"bad-nauheim","n":"Bad Nauheim","plz":["61231"],"km":49},{"id":"friedberg-hessen","n":"Friedberg (Hessen)","plz":["61169"],"km":47},{"id":"rodgau","n":"Rodgau","plz":["63110"],"km":46},{"id":"dieburg","n":"Dieburg","plz":["64807"],"km":47},{"id":"usingen","n":"Usingen","plz":["61250"],"km":36},{"id":"kiedrich","n":"Kiedrich","plz":["65399"],"km":11},{"id":"schlangenbad","n":"Schlangenbad","plz":["65388"],"km":10},{"id":"eppstein","n":"Eppstein","plz":["65817"],"km":13},{"id":"schwalbach-am-taunus","n":"Schwalbach am Taunus","plz":["65824"],"km":23},{"id":"kronberg-im-taunus","n":"Kronberg im Taunus","plz":["61476"],"km":23},{"id":"bad-vilbel","n":"Bad Vilbel","plz":["61118"],"km":38},{"id":"karben","n":"Karben","plz":["61184"],"km":42},{"id":"maintal","n":"Maintal","plz":["63477"],"km":43},{"id":"heusenstamm","n":"Heusenstamm","plz":["63150"],"km":40},{"id":"dietzenbach","n":"Dietzenbach","plz":["63128"],"km":39},{"id":"roedermark","n":"Rödermark","plz":["63322"],"km":43},{"id":"egelsbach","n":"Egelsbach","plz":["63329"],"km":33},{"id":"weiterstadt","n":"Weiterstadt","plz":["64331"],"km":31},{"id":"griesheim","n":"Griesheim","plz":["64347"],"km":32},{"id":"pfungstadt","n":"Pfungstadt","plz":["64319"],"km":40},{"id":"riedstadt","n":"Riedstadt","plz":["64560"],"km":32},{"id":"trebur","n":"Trebur","plz":["65468"],"km":20},{"id":"raunheim","n":"Raunheim","plz":["65479"],"km":17},{"id":"kelsterbach","n":"Kelsterbach","plz":["65451"],"km":21},{"id":"bodenheim","n":"Bodenheim","plz":["55294"],"km":17},{"id":"nackenheim","n":"Nackenheim","plz":["55299"],"km":19},{"id":"budenheim","n":"Budenheim","plz":["55257"],"km":7},{"id":"gau-algesheim","n":"Gau-Algesheim","plz":["55435"],"km":21},{"id":"woerrstadt","n":"Wörrstadt","plz":["55286"],"km":27},{"id":"aarbergen","n":"Aarbergen","plz":["65326"],"km":23},{"id":"heidenrod","n":"Heidenrod","plz":["65321"],"km":22},{"id":"lorch","n":"Lorch","plz":["65391"],"km":31},{"id":"huenstetten","n":"Hünstetten","plz":["65510"],"km":20},{"id":"diez","n":"Diez","plz":["65582"],"km":37},{"id":"bad-ems","n":"Bad Ems","plz":["56130"],"km":48},{"id":"nastaetten","n":"Nastätten","plz":["56355"],"km":31},{"id":"kirchheimbolanden","n":"Kirchheimbolanden","plz":["67292"],"km":48},{"id":"worms","n":"Worms","plz":["6754","6755"],"km":49},{"id":"koblenz","n":"Koblenz","plz":["5606","5607"],"km":56},{"id":"bensheim","n":"Bensheim","plz":["64625"],"km":52},{"id":"seligenstadt","n":"Seligenstadt","plz":["63500"],"km":53},{"id":"butzbach","n":"Butzbach","plz":["35510"],"km":51},{"id":"bad-sobernheim","n":"Bad Sobernheim","plz":["55566"],"km":52},{"id":"aschaffenburg","n":"Aschaffenburg","plz":["6373","6374"],"km":66},{"id":"giessen","n":"Gießen","plz":["3539"],"km":65},{"id":"mannheim","n":"Mannheim","plz":["681","682","683"],"km":67}];
  var ZONES = ["dach","og","eg","kueche","keller","garage"];
  var RADIUS = 50;
  function kalkuliere(s, P, T) {
  var t = T[s.typ], flaeche = s.flaeche, neben = [];
  if (t.addons) ['keller', 'dach', 'garage'].forEach(function (k) { if (s[k]) { flaeche += P.nebenraumM2[k]; neben.push(k); } });
  var zuschlag = (t.etage && !s.aufzug) ? Math.min(P.etageMax, s.etage * P.etageOhneAufzug) : 0;
  var mitte = flaeche * P.satzProM2[s.fuell] * (1 + zuschlag);
  var r10 = function (n) { return Math.round(n / 10) * 10; };
  return { flaeche: flaeche, neben: neben, zuschlag: zuschlag, mitte: Math.round(mitte), lo: r10(mitte * (1 - P.spanne)), hi: r10(mitte * (1 + P.spanne)) };
}

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.lang = 'de';

  /* ---------- Hinweis-Einblendung, Kopieren ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 5200);
  }
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
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { copyText(b.getAttribute('data-copy'), b.getAttribute('data-copied') || 'Kopiert'); });
  });

  /* ---------- Menü ---------- */
  var mnav = $('#mnav'), menuBtn = $('.hdr__menu');
  function setMenu(open) {
    if (!mnav) return;
    mnav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- Sprungmarken auf derselben Seite, Voreinstellungen für den Rechner ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1), target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    var preset = a.getAttribute('data-preset');
    if (preset) { try { applyPreset(JSON.parse(preset)); } catch (err) { /* Voreinstellung überspringen */ } }
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (err) { /* ohne Adresszeile weiter */ }
  });

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
    setTimeout(function () { el.innerHTML = original; el.classList.remove('tidy'); }, 950 + d * 26 + 200);
  })();

  /* ---------- Haus: Regler von voll zu frei ---------- */
  (function house() {
    var range = $('#clear-range'), svg = $('.house__svg'), status = $('#clear-status'), fig = $('#house');
    if (!range || !svg) return;
    var zoneEls = {}, btns = {};
    ZONES.forEach(function (id) {
      zoneEls[id] = $('.zone[data-zone="' + id + '"]', svg);
      btns[id] = $('.clear__zone[data-zone="' + id + '"]');
    });
    var narrow = window.matchMedia('(max-width: 640px)');
    var active = function () { return narrow.matches ? ZONES.slice(0, ZONES.length - 1) : ZONES; };
    var rest = Number(range.getAttribute('value')) / 100, raf = 0, hovered = null;

    function render(p) {
      var list = active(), span = 1 / list.length, done = 0, current = null;
      list.forEach(function (id, i) {
        var t = Math.max(0, Math.min(1, (p - i * span) / span));
        zoneEls[id].style.setProperty('--t', t.toFixed(3));
        if (t >= 0.999) done++;
        else if (t > 0 && !current) current = id;
        if (btns[id]) btns[id].classList.toggle('is-done', t >= 0.999);
      });
      if (list.length < ZONES.length) {
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
      if (fig) fig.classList.remove('is-booting');
      setTimeout(function () { animateTo(rest, 2300); }, 350);
      setTimeout(function () { range.classList.add('is-hinting'); }, 2900);
    }
  })();

  /* ---------- Anlässe: eine Auswahl offen, die anderen zu ---------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('.anlass__tab', root);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-expanded', String(on));
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      if (window.matchMedia('(max-width: 919px)').matches) {
        var top = tab.getBoundingClientRect().top;
        if (top < 80 || top > window.innerHeight * 0.6) tab.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------- Vorher-Nachher-Regler ---------- */
  $$('.ba').forEach(function (fig) {
    var r = $('.ba__range', fig);
    if (!r) return;
    var set = function () { fig.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', set); set();
  });

  /* ---------- Kostenrechner ---------- */
  var calc = $('#calc');
  var TYP = {
    wohnung: { name: 'Wohnung', min: 20, max: 200, step: 5, def: 70, help: 'Die Wohnfläche aus dem Mietvertrag genügt. Geschätzt ist völlig in Ordnung.' },
    haus: { name: 'Haus', min: 60, max: 300, step: 10, def: 140, help: 'Wohnfläche aller Etagen zusammen, grob geschätzt.' },
    keller: { name: 'Keller', min: 4, max: 80, step: 2, def: 14, help: 'Grundfläche des Raums. Ein Kellerabteil hat meist 5 bis 15 m².' },
    dach: { name: 'Dachboden', min: 4, max: 120, step: 2, def: 30, help: 'Begehbare Grundfläche, grob geschätzt.' },
    garage: { name: 'Garage / Schuppen', min: 4, max: 80, step: 2, def: 16, help: 'Eine Einzelgarage hat rund 15 bis 18 m².' },
    gewerbe: { name: 'Büro / Gewerbe / Lager', min: 20, max: 300, step: 10, def: 120, help: 'Nutzfläche, grob geschätzt. Größere Flächen bitte direkt anfragen.' }
  };
  var FUELL = { 1: 'fast leer', 2: 'normal möbliert', 3: 'sehr voll', 4: 'überfüllt' };
  var ETAGE = ['Erdgeschoss', '1. Etage', '2. Etage', '3. Etage', '4. Etage', '5. Etage oder höher'];
  var TERMIN = { flexibel: 'zeitlich flexibel', bald: 'in den nächsten zwei Wochen', eilig: 'so schnell wie möglich' };
  var NEBEN = { keller: 'Keller', dach: 'Dachboden', garage: 'Garage' };
  var memo = {}, lastTyp = 'wohnung', lastPrice = '';
  var fmt = function (n) { return Math.round(n).toLocaleString('de-DE'); };

  function readCalc() {
    var f = calc.elements;
    return {
      typ: f.typ.value, flaeche: Number(f.flaeche.value), fuell: Number(f.fuell.value),
      etage: Number(f.etage.value), aufzug: f.aufzug.checked,
      keller: f.keller.checked, dach: f.dach.checked, garage: f.garage.checked,
      kueche: f.kueche.checked, boden: f.boden.checked, tapete: f.tapete.checked,
      termin: f.termin.value
    };
  }
  function describe(s, k) {
    var t = TYPEN[s.typ], zusatz = [];
    if (s.kueche) zusatz.push('Küche abbauen');
    if (s.boden) zusatz.push('Boden entfernen');
    if (s.tapete) zusatz.push('Tapeten entfernen');
    return {
      objekt: TYP[s.typ].name + ', ' + s.flaeche + ' m²' + k.neben.map(function (n) { return ' + ' + NEBEN[n] + ' (' + PREISE.nebenraumM2[n] + ' m²)'; }).join(''),
      fuell: FUELL[s.fuell],
      zugang: !t.etage ? 'ebenerdig' : ETAGE[s.etage] + (s.etage > 0 ? (s.aufzug ? ', mit Aufzug' : ', ohne Aufzug') : ''),
      zusatz: zusatz.length ? zusatz.join(', ') + ' (im Angebot)' : 'keine'
    };
  }
  function renderCalc() {
    var f = calc.elements, typ = f.typ.value, t = TYPEN[typ], meta = TYP[typ], fl = f.flaeche;
    if (typ !== lastTyp) {
      memo[lastTyp] = Number(fl.value);
      fl.min = meta.min; fl.max = meta.max; fl.step = meta.step;
      fl.value = memo[typ] || meta.def;
      lastTyp = typ;
    }
    $('#calc-addons').hidden = !t.addons;
    $('#calc-etage').closest('fieldset').hidden = !t.etage;
    $('#calc-aufzug').closest('.switch').hidden = Number(f.etage.value) === 0;
    $$('fieldset', calc).filter(function (fs) { return !fs.hidden; }).forEach(function (fs, i) { $('.calc__no', fs).textContent = i + 1; });
    $('#calc-flaeche-help').textContent = meta.help;
    $('#calc-flaeche-out').textContent = fl.value + ' m²';
    fl.style.setProperty('--p', ((fl.value - fl.min) / (fl.max - fl.min) * 100).toFixed(1) + '%');

    var s = readCalc(), k = kalkuliere(s, PREISE, TYPEN), d = describe(s, k);
    $('#q-objekt').textContent = d.objekt;
    $('#q-fuell').textContent = d.fuell;
    $('#q-zugang').textContent = d.zugang;
    $('#q-extras').textContent = d.zusatz;
    var price = fmt(k.lo) + ' – ' + fmt(k.hi) + ' €';
    var priceEl = $('#q-preis');
    if (price !== lastPrice) {
      priceEl.textContent = price;
      if (lastPrice && !reduced) { priceEl.classList.remove('is-bump'); void priceEl.offsetWidth; priceEl.classList.add('is-bump'); }
      lastPrice = price;
    }
    var mp = $('#mbar-preis'); if (mp) mp.textContent = price;
    $('#q-hint').textContent = s.typ === 'gewerbe'
      ? 'Kein Angebot. Für gewerbliche Flächen erstellen wir das Angebot netto und weisen die Umsatzsteuer aus.'
      : s.fuell === 4
        ? 'Kein Angebot. Bei überfüllten Räumen schwankt der Aufwand stark. Verbindlich wird der Preis erst nach der Besichtigung.'
        : s.termin === 'eilig'
          ? 'Kein Angebot. Wenn es eilt, geht es am Telefon am schnellsten: ' + CONFIG.phone
          : 'Kein Angebot. Verbindlich wird der Preis erst nach der kostenlosen Besichtigung.';
    return { s: s, k: k, d: d, price: price };
  }
  function applyPreset(p) {
    if (!calc) return;
    var f = calc.elements;
    if (p.typ) { f.typ.value = p.typ; renderCalc(); }
    ['keller', 'dach', 'garage', 'kueche', 'boden', 'tapete'].forEach(function (k) { f[k].checked = !!p[k]; });
    if (p.flaeche) f.flaeche.value = p.flaeche;
    if (p.fuell) f.fuell.value = String(p.fuell);
    f.termin.value = p.termin || 'flexibel';
    renderCalc();
  }
  function calcSummary() {
    var r = renderCalc();
    return [
      'Objekt:       ' + r.d.objekt,
      'Füllgrad:     ' + r.d.fuell,
      'Zugang:       ' + r.d.zugang,
      'Zusatz:       ' + r.d.zusatz,
      'Termin:       ' + TERMIN[r.s.termin],
      'Kostenrahmen: ' + r.price + ' (unverbindlich, zuzüglich Anfahrt)'
    ].join('\n');
  }
  if (calc) {
    calc.addEventListener('input', renderCalc);
    calc.addEventListener('change', renderCalc);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    $$('.stepper button', calc).forEach(function (b) {
      b.addEventListener('click', function () {
        var fl = calc.elements.flaeche;
        fl.value = Math.max(Number(fl.min), Math.min(Number(fl.max), Number(fl.value) + Number(b.getAttribute('data-step')) * Number(fl.step)));
        renderCalc();
      });
    });
    renderCalc();
  }

  /* ---------- Ortscheck ---------- */
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  TOWNS.forEach(function (t) { t.key = norm(t.n); });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
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
  (function areaCheck() {
    var form = $('#areacheck'); if (!form) return;
    var input = $('#area-input'), out = $('#area-result'), icon = '<svg class="i" aria-hidden="true"><use href="#i-check"/></svg>', info = '<svg class="i" aria-hidden="true"><use href="#i-info"/></svg>';
    function mark(id) {
      $$('.map__svg .is-hit').forEach(function (g) { g.classList.remove('is-hit'); });
      if (!id) return;
      var g = $('.map__svg [data-town="' + id + '"]'); if (g) g.classList.add('is-hit');
    }
    function check(final) {
      var m = townMessage(findTown(input.value));
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
  })();
  var leadOrt = $('#lead-ort');
  if (leadOrt) leadOrt.addEventListener('input', function () {
    var m = townMessage(findTown(leadOrt.value)), info = $('#lead-ort-info');
    info.innerHTML = m ? m.html : '';
    info.setAttribute('data-state', m ? m.state : '');
  });

  /* ---------- Formulare ---------- */
  var MAX_FOTOS = 8, MAX_MB = 8, MAX_KANTE = 1800;
  var RULES = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen an.'; },
    firma: function (v) { return v.trim().length >= 2 ? '' : 'Bitte nennen Sie Ihr Unternehmen.'; },
    tel: function (v) { return v.replace(/\D/g, '').length >= 6 ? '' : 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.'; },
    mail: function (v, el) { return (!v && !el.required) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Bitte prüfen Sie die E-Mail-Adresse.'; },
    ort: function (v) { return v.trim().length >= 3 ? '' : 'Bitte nennen Sie PLZ oder Ort des Objekts.'; },
    objekt: function (v) { return v.trim().length >= 6 ? '' : 'Bitte geben Sie die Objektadresse an.'; },
    ok: function (v, el) { return el.checked ? '' : 'Bitte stimmen Sie der Verwendung Ihrer Angaben zu.'; }
  };
  function setError(form, name, msg) {
    var el = form.elements[name], slot = $('[data-err="' + name + '"]', form);
    if (slot) { slot.textContent = msg; if (!slot.id) slot.id = form.id + '-err-' + name; }
    if (el && !el.length) {
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (slot) { if (msg) el.setAttribute('aria-describedby', slot.id); else el.removeAttribute('aria-describedby'); }
    }
    return el && !el.length ? el : null;
  }
  function validate(form) {
    var first = null;
    Object.keys(RULES).forEach(function (name) {
      var el = form.elements[name]; if (!el || el.length) return;
      var msg = RULES[name](el.value, el), target = setError(form, name, msg);
      if (msg && !first) first = target;
    });
    if (first) first.focus();
    return !first;
  }
  /** Verkleinert ein Foto im Browser. So gehen auch Handyfotos über langsame Verbindungen. */
  function shrink(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file).then(function (bmp) {
      var k = Math.min(1, MAX_KANTE / Math.max(bmp.width, bmp.height));
      if (k === 1 && file.size < 1.5 * 1048576) return file;
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(function (b) { res(b && b.size < file.size ? new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.82); });
    }).catch(function () { return file; });
  }
  function wireForm(form) {
    var box = form.parentNode, done = $('.lead__done, .callback__done', box), status = $('[data-status]', form);
    var picker = $('[data-fotos]', form), list = $('[data-fotos-list]', form), picked = [];
    var started = Date.now();
    function renderFotos() {
      if (!list) return;
      list.innerHTML = '';
      picked.forEach(function (f, i) {
        var li = document.createElement('li');
        var name = document.createElement('span'); name.textContent = f.name + ' (' + (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB)';
        var rm = document.createElement('button'); rm.type = 'button'; rm.textContent = 'Entfernen'; rm.setAttribute('aria-label', f.name + ' entfernen');
        rm.addEventListener('click', function () { picked.splice(i, 1); renderFotos(); });
        li.appendChild(name); li.appendChild(rm); list.appendChild(li);
      });
    }
    if (picker) picker.addEventListener('change', function () {
      var msg = '';
      Array.prototype.forEach.call(picker.files, function (f) {
        if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { msg = 'Bitte wählen Sie nur Fotos aus.'; return; }
        if (picked.length >= MAX_FOTOS) { msg = 'Es sind höchstens ' + MAX_FOTOS + ' Fotos möglich.'; return; }
        picked.push(f);
      });
      picker.value = '';
      setError(form, 'fotos', msg);
      renderFotos();
    });
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (el.getAttribute && el.getAttribute('aria-invalid') === 'true' && RULES[el.name]) setError(form, el.name, RULES[el.name](el.value, el));
    });
    function finish(note) {
      var f = form.elements, h = $('h3', done), first = f.name ? f.name.value.trim().split(' ')[0] : '';
      if (h && first && !h.getAttribute('data-base')) h.setAttribute('data-base', h.textContent);
      if (h && first) h.textContent = h.getAttribute('data-base').replace('Danke.', 'Danke, ' + first + '.');
      var n = $('[data-done-note]', done); if (n && note) n.textContent = note;
      var sum = $('.lead__summary', done);
      if (sum) sum.textContent = (calc && form.id === 'lead-form' ? calcSummary() + '\n\n' : '') + 'Name:    ' + f.name.value.trim() + '\nTelefon: ' + f.tel.value.trim() + (f.ort ? '\nOrt:     ' + f.ort.value.trim() : '') + (picked.length ? '\nFotos:   ' + picked.length : '');
      form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) status.textContent = '';
      if (!validate(form)) return;
      // Vorschau ohne Server: ehrlich sagen, dass nichts versendet wird
      if (!CONFIG.endpoint) { finish('Dies ist die Vorschau. Es wurde nichts versendet. Auf der Live-Seite geht die Anfrage per E-Mail an uns.'); return; }
      var btn = $('[type="submit"]', form), label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Wird gesendet …';
      var fd = new FormData(form);
      fd.set('art', form.getAttribute('data-art'));
      fd.set('ts', String(started));
      if (calc && form.id === 'lead-form') fd.set('angaben', calcSummary());
      Promise.all(picked.map(shrink)).then(function (files) {
        var tooBig = files.filter(function (f) { return f.size > MAX_MB * 1048576; })[0];
        if (tooBig) throw { fields: { fotos: tooBig.name + ' ist größer als ' + MAX_MB + ' MB. Bitte entfernen Sie das Foto.' } };
        files.forEach(function (f) { fd.append('fotos[]', f, f.name); });
        return fetch(CONFIG.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false }; }).then(function (data) { if (!r.ok || !data.ok) throw data; return data; });
      }).then(function () {
        finish('');
      }).catch(function (err) {
        var fields = (err && err.fields) || {}, first = null;
        Object.keys(fields).forEach(function (name) { var el = setError(form, name, fields[name]); if (el && !first) first = el; });
        if (first) first.focus();
        if (status) status.textContent = (err && err.message ? err.message + ' ' : 'Die Anfrage konnte nicht gesendet werden. ') + 'Sie erreichen uns telefonisch unter ' + CONFIG.phone + '.';
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
    var again = $('[data-again]', done);
    if (again) again.addEventListener('click', function () { done.hidden = true; form.hidden = false; started = Date.now(); (form.querySelector('input:not([tabindex="-1"])') || form).focus(); });
    var copy = $('[data-copy-summary]', done);
    if (copy) copy.addEventListener('click', function () { copyText($('.lead__summary', done).textContent, 'Zusammenfassung kopiert.'); });
  }
  $$('form[data-art]').forEach(wireForm);

  /* ---------- Vorschau: offene Punkte ---------- */
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
  })();

  /* ---------- Mobile Leiste: weicht der Tastatur, zeigt beim Rechnen den Kostenrahmen ---------- */
  (function mbar() {
    var bar = $('.mbar'); if (!bar) return;
    var main = $('#mbar-main'), form = $('#calc'), sum = $('.quote__sum'), lead = $('#anfrage');
    if (form && sum && lead && 'IntersectionObserver' in window) {
      var seen = { form: false, sum: false, lead: false }, std = main.innerHTML, stdHref = main.getAttribute('href');
      var update = function () {
        var on = seen.form && !seen.sum && !seen.lead;
        if (bar.classList.contains('is-price') === on) return;
        bar.classList.toggle('is-price', on);
        main.setAttribute('href', on ? '#anfrage' : stdHref);
        if (on) main.textContent = 'Anfragen'; else main.innerHTML = std;
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
