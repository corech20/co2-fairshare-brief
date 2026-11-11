# Migrationsplan: von WordPress zur neuen Website

Dieser Plan beschreibt den Umzug von `dieaufraeumer.com`. **Es wurde nichts veröffentlicht.**
Der Ordner `site/` ist die fertige Website. Sie geht erst live, wenn der Inhaber sie hochlädt.

## 1. Grundsatz

Die alte Website hat acht Adressen. Fünf davon behalten ihre Adresse, damit vorhandene Suchmaschinen-Signale
ohne Umweg weiterwirken. Nur eine Adresse wird umgeleitet, ein Beispielbeitrag wird entfernt.

## 2. Adressen alt → neu

| Alte Adresse | Neu | Antwort | Begründung |
|---|---|---|---|
| `/` | `/` | 200 | bleibt, weiterhin Zielseite für „Entrümpelung Wiesbaden“ |
| `/kontakt/` | `/kontakt/` | 200 | bleibt |
| `/ueber-uns/` | `/ueber-uns/` | 200 | bleibt, jetzt mit Inhalt |
| `/impressum/` | `/impressum/` | 200 | bleibt |
| `/datenschutzerklaerung/` | `/datenschutzerklaerung/` | 200 | bleibt |
| `/danke/` | `/danke/` | 200, noindex | bleibt als Bestätigungsseite, raus aus dem Index |
| `/leistungen-in-wiesbaden-die-aufraeumer/` | `/leistungen/` | 301 | kürzere Adresse, Inhalt entspricht der Übersicht |
| `/hello-world/` | – | 410 | WordPress-Beispielbeitrag ohne Nachfolger |
| `/author/…`, `/category/…`, `/feed/`, `/wp-json/…`, `/wp-login.php` | – | 410 | WordPress-Reste |
| `/sitemap_index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml` | `/sitemap.xml` | 301 | neue Sitemap |
| `http://…`, `www.…` | `https://dieaufraeumer.com/…` | 301 | eine einzige Schreibweise |

Alle Regeln stehen fertig in `site/.htaccess`. Neue Adressen (Leistungs- und Standortseiten) brauchen keine Weiterleitung.

Bilder der alten Website (`/wp-content/uploads/…`) liefern nach dem Umzug 404. Das ist unkritisch,
weil keine davon nennenswert verlinkt ist. Die Fotos liegen unter neuen, sprechenden Namen in `/assets/img/`.

## 3. Voraussetzungen beim Hosting

- Apache mit `mod_rewrite` und `mod_headers` (für `.htaccess`), PHP 8.1 oder neuer mit `mail()` und `fileinfo`.
- PHP-Grenzen für Uploads: `upload_max_filesize` mindestens 10M, `post_max_size` mindestens 30M, `max_file_uploads` mindestens 10.
- Läuft der Server mit nginx, müssen die Regeln aus `.htaccess` in die Serverkonfiguration übertragen werden. Das erledigt der Hoster oder ich auf Zuruf.
- Die bisherige Website läuft auf WordPress, PHP ist dort also vorhanden.

## 4. Vor dem Umzug

1. **Vollständiges Backup der WordPress-Website:** Dateien und Datenbank über das Hosting-Panel sichern und herunterladen. Das ist der Rückweg.
2. **Google Search Console einrichten**, falls noch nicht geschehen: Property `dieaufraeumer.com` als Domain-Property anlegen. Dafür trägt der Inhaber beim Domain-Anbieter einen TXT-Eintrag ein, den Google anzeigt.
3. **Ausgangswerte sichern:** In Search Console unter „Leistung“ die letzten 3 Monate exportieren (Suchanfragen und Seiten). So lässt sich später vergleichen.
4. Offene Punkte aus `AUDIT.md`, Abschnitt 7 klären. Mindestens Telefonnummer, Zeiten und Impressum.

## 5. Umzug, Schritt für Schritt

1. Im Projekt `node build.mjs` ausführen. Der Ordner `site/` wird neu erzeugt.
2. WordPress-Dateien auf dem Server in einen Ordner außerhalb des Web-Verzeichnisses verschieben (nicht löschen).
3. Inhalt von `site/` ins Web-Verzeichnis hochladen, einschließlich der versteckten Datei `.htaccess`.
4. `anfrage-config.sample.php` nach `anfrage-config.php` kopieren. Empfänger, Absender (Adresse der eigenen Domain) und eine zufällige Zeichenfolge bei `salz` eintragen.
5. Den Ordner aus `daten_ordner` außerhalb des Web-Verzeichnisses anlegen, schreibbar für PHP.
6. **Testanfrage** mit Foto über die Live-Seite senden und prüfen, ob die E-Mail samt Anhang ankommt. Landet sie im Spam, beim Hoster SPF und DKIM für die Absender-Adresse prüfen lassen.
7. Stichprobe der Weiterleitungen: `/leistungen-in-wiesbaden-die-aufraeumer/` muss auf `/leistungen/` führen, `/hello-world/` muss 410 liefern, `http://www.dieaufraeumer.com/` muss auf `https://dieaufraeumer.com/` führen.

## 6. Nach dem Umzug

1. In Search Console `https://dieaufraeumer.com/sitemap.xml` einreichen, alte Sitemaps entfernen.
2. Startseite und zwei bis drei Leistungsseiten über die „URL-Prüfung“ zur Indexierung anmelden.
3. Nach einer Woche den Bericht „Seiten“ ansehen: unerwartete 404 nachträglich weiterleiten.
4. **Google-Unternehmensprofil** angleichen: Website-Adresse, Telefonnummer, Öffnungszeiten, Leistungen. Als Hauptkategorie die treffendste Bezeichnung für Entrümpelung wählen, „Umzugsunternehmen“ als weitere Kategorie. Für die lokale Auffindbarkeit ist das Profil mindestens so wichtig wie die Website.
5. Gelbe Seiten, 11880, Das Örtliche: Telefonnummer und Zeiten identisch eintragen.
6. Kunden nach jedem Auftrag um eine Google-Bewertung bitten. Die Zahl auf der Website steht in `src/site.mjs`.
7. Bing Webmaster Tools: Website anmelden, Sitemap einreichen (lässt sich aus Search Console importieren).

Suchmaschinen brauchen Zeit. Erste Veränderungen sind frühestens nach etwa 30 Tagen sichtbar. Eine Platzierung lässt sich nicht zusagen.

## 7. Risiken und Rückweg

| Risiko | Vorsorge |
|---|---|
| Formular-Mails kommen nicht an | Testanfrage vor Bekanntgabe, Telefonnummer steht auf jeder Seite |
| Rankings der Startseite schwanken in den ersten Wochen | Adresse, Titelthema und Hauptüberschrift bleiben gleich |
| Server ist nginx statt Apache | vor dem Umzug beim Hoster erfragen |
| Etwas geht schief | WordPress-Ordner zurückverschieben, die alte Website läuft wieder |

## 8. Messwerte der neuen Website

Lighthouse (Chromium, Mobil-Profil, lokaler Server ohne Kompression und CDN):

| Seite | Leistung | Barrierefreiheit | Best Practices | SEO | LCP | CLS | Gewicht |
|---|---|---|---|---|---|---|---|
| Startseite | 91 | 100 | 100 | 100 | 3,4 s | 0 | 430 KB |
| Kosten und Rechner | 94 | 100 | 100 | 100 | 3,0 s | 0 | 348 KB |
| Leistungsseite (Haushaltsauflösung) | 90 | 100 | 100 | 100 | 3,4 s | 0 | 416 KB |
| Standortseite (Mainz) | 92 | 100 | 100 | 100 | 3,2 s | 0 | 350 KB |

Gemessen am 11.11.2026 mit Lighthouse 12 bei simuliertem langsamem Mobilfunk. Der Testserver komprimiert nicht.
Auf dem echten Server mit aktivierter Kompression (in `.htaccess` vorbereitet) fallen Ladezeit und LCP niedriger aus.
Die Leistungsseite wurde vor der letzten Korrektur am Bewertungs-Link gemessen, der dort beanstandete Punkt ist behoben.

Noch mögliche Verbesserung: Die Überschriften-Schrift wiegt 131 KB. Eine verkleinerte Fassung spart rund 50 KB,
verändert aber das Schriftbild leicht. Deshalb bewusst nicht umgesetzt.
