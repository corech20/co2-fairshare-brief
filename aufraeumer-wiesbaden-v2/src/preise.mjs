// Rechenbasis des Kostenrechners. Eine Quelle für Website, Beispielrechnungen und Tests.
// Die Sätze entsprechen dem bisherigen Online-Rechner auf dieaufraeumer.com (Stand November 2026)
// und werden mit dem Inhaber noch kalibriert. Zum Ändern genügt diese Datei, danach `node build.mjs`.

export const PREISE = {
  satzProM2: { 1: 25, 2: 45, 3: 65, 4: 80 },      // Euro je m² nach Füllgrad: fast leer, normal, sehr voll, überfüllt
  spanne: 0.10,                                    // Darstellung als Rahmen von ±10 % um den Rechenwert
  etageOhneAufzug: 0.05,                           // Zuschlag je Etage ohne Aufzug
  etageMax: 0.25,                                  // höchstens fünf Etagen werden berechnet
  nebenraumM2: { keller: 10, dach: 20, garage: 15 } // angesetzte Fläche, wenn ein Nebenraum mit angekreuzt wird
};

// Welche Objektarten kennen Nebenräume und Etagen?
export const TYPEN = {
  wohnung: { addons: true, etage: true },
  haus: { addons: true, etage: false },
  keller: { addons: false, etage: false },
  dach: { addons: false, etage: true },
  garage: { addons: false, etage: false },
  gewerbe: { addons: true, etage: true }
};

/** Angaben -> unverbindlicher Kostenrahmen. Reine Funktion, läuft im Build und im Browser. */
export function kalkuliere(s, P, T) {
  var t = T[s.typ], flaeche = s.flaeche, neben = [];
  if (t.addons) ['keller', 'dach', 'garage'].forEach(function (k) { if (s[k]) { flaeche += P.nebenraumM2[k]; neben.push(k); } });
  var zuschlag = (t.etage && !s.aufzug) ? Math.min(P.etageMax, s.etage * P.etageOhneAufzug) : 0;
  var mitte = flaeche * P.satzProM2[s.fuell] * (1 + zuschlag);
  var r10 = function (n) { return Math.round(n / 10) * 10; };
  return { flaeche: flaeche, neben: neben, zuschlag: zuschlag, mitte: Math.round(mitte), lo: r10(mitte * (1 - P.spanne)), hi: r10(mitte * (1 + P.spanne)) };
}
