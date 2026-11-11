# Die Aufräumer Wiesbaden – Website, Version 2

Mehrseitige, statische Website mit Formular-Endpunkt. Version 1 liegt unverändert als Backup in `../aufraeumer-wiesbaden/`.
**Nichts hiervon ist veröffentlicht.** Den Umzug beschreibt `docs/MIGRATION.md`, die Befunde stehen in `docs/AUDIT.md`.

## Ordner

| Ordner | Inhalt |
|---|---|
| `site/` | Fertige Website zum Hochladen (22 Seiten, Sitemap, robots.txt, llms.txt, `.htaccess`, `anfrage.php`) |
| `vorschau/` | Dieselben Seiten zum Ansehen per Doppelklick auf `index.html`. Formulare versenden hier nichts. |
| `assets/` | **Ihre Originale:** `assets/logo/` und `assets/fotos/`. Hier legen Sie neue Dateien ab. |
| `src/` | Quellen: Texte, Seiten, Styles, Logik, Server-Dateien |
| `docs/` | Audit und Migrationsplan |

## Bauen

```
npm install        # einmalig, lädt die Bildverarbeitung
node build.mjs             # erzeugt site/
node build.mjs --preview   # erzeugt vorschau/
```

## Was wo geändert wird

| Was | Wo |
|---|---|
| Telefon, E-Mail, Zeiten, Adresse, Bewertungszahl | `src/site.mjs` |
| Preise des Rechners | `src/preise.mjs` |
| Texte der Leistungsseiten | `src/content/leistungen.mjs` |
| Texte der Standortseiten | `src/content/orte.mjs` |
| Startseite | `src/partials/home-*.html` |
| Kosten, Über uns, Kontakt, Makler, Rechtliches | `src/pages.mjs` |
| Farben und Schrift | `src/styles.css`, Block `:root` |
| Orte im Ortscheck | `src/data/towns.mjs` |
| Weiterleitungen | `src/server/.htaccess` |

## Logo und Fotos austauschen

- **Logo:** `assets/logo/logo.png` ersetzen (am besten breiter als 800 px, transparenter Hintergrund) und neu bauen.
  Auf dunklem Grund wird das Logo automatisch weiß dargestellt.
- **Fotos:** Dateien nach `assets/fotos/` legen und in `assets/fotos/fotos.json` als Paar eintragen (vorher, nachher, Alt-Texte, Bildunterschrift).
  Der Build erzeugt daraus WebP und JPG in drei Größen.
- **Foto von Paul Hansen:** als `assets/fotos/paul-hansen.jpg` ablegen. Es ersetzt dann automatisch das Logo im Abschnitt „Inhabergeführt“.

## Formulare

Drei Formulare (Kostenanfrage mit Fotos, Rückruf, Objektanfrage) senden an `site/anfrage.php`.
Der Endpunkt prüft Herkunft, Pflichtfelder, Dateityp und Größe der Fotos, begrenzt Anfragen je Absender und verschickt eine E-Mail mit Anhängen.
Fotos werden im Browser verkleinert und nicht auf dem Server gespeichert.

Einrichtung auf dem Server: `anfrage-config.sample.php` nach `anfrage-config.php` kopieren und ausfüllen.
Fehlt die Datei, meldet das Formular ehrlich, dass der Versand nicht eingerichtet ist, und nennt die Telefonnummer.

## Technik in Kürze

- HTML, CSS, JavaScript ohne Laufzeit-Abhängigkeiten. Keine Cookies, kein Tracking, keine Inhalte von Drittservern.
- Je Seite eigene Metadaten, Canonical, strukturierte Daten (LocalBusiness, Service, BreadcrumbList, FAQPage).
- Helles und dunkles Farbschema, Tastaturbedienung, Bedienflächen mindestens 44 px, Bewegung nach Systemeinstellung.
- Schriften lokal: Bricolage Grotesque, Atkinson Hyperlegible Next und Mono (SIL Open Font License).
