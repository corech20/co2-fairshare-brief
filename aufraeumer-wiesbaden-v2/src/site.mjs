// Zentrale Unternehmensdaten. Jede Angabe steht nur hier und wird von allen Seiten,
// den strukturierten Daten, llms.txt und dem Formular verwendet.
// Quelle der Angaben: bestehende Website dieaufraeumer.com (Stand November 2026), sofern nicht anders vermerkt.

export const SITE = {
  name: 'Die Aufräumer Wiesbaden',
  shortName: 'Die Aufräumer',
  owner: 'Paul Hansen',
  ownerRole: 'Inhaber',
  domain: 'https://dieaufraeumer.com',
  street: 'Luxemburgplatz 5',
  zip: '65185',
  city: 'Wiesbaden',
  region: 'Hessen',
  geo: { lat: 50.0715, lon: 8.2378 },
  phone: '01514 6254168',              // wie auf der bestehenden Website und im Branchenbuch
  phoneIntl: '+4915146254168',
  email: 'info@dieaufraeumer.com',
  // Zeiten laut strukturierten Daten der bestehenden Website. Gelbe Seiten nennt abweichend 10–20 / 14–18 Uhr.
  hours: [
    { days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], label: 'Montag bis Freitag', open: '09:00', close: '19:00' },
    { days: ['Sa', 'Su'], label: 'Samstag und Sonntag', open: '12:00', close: '17:00' },
  ],
  hoursShort: 'Mo–Fr 9–19 Uhr, Sa–So 12–17 Uhr',
  payment: ['Rechnung', 'PayPal'],     // laut Branchenbuch-Eintrag
  radiusKm: 50,
  // Öffentlich nachprüfbare Bewertung: Google-Profil, abgelesen über werkenntdenbesten.de
  rating: { value: '5,0', count: 8, source: 'Google', asOf: '28.09.2026', url: 'https://www.google.de/maps?cid=2923815097281138418' },
  mapsUrl: 'https://www.google.de/maps?cid=2923815097281138418',
};

// Hauptnavigation
export const NAV = [
  { href: 'leistungen', label: 'Leistungen' },
  { href: 'entruempelung-kosten', label: 'Kosten' },
  { href: 'index#einsatzgebiet', label: 'Einsatzgebiet' },
  { href: 'ueber-uns', label: 'Über uns' },
  { href: 'kontakt', label: 'Kontakt' },
];
