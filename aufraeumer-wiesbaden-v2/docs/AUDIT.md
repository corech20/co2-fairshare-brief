# Audit: Die Aufräumer Wiesbaden

Stand: 11. November 2026. Geprüft wurden die Live-Website `dieaufraeumer.com` (WordPress, alle 8 Adressen der Sitemap)
und der erste Neuentwurf (`aufraeumer-wiesbaden/`, Version 1). Version 2 liegt in `aufraeumer-wiesbaden-v2/`.

Unterschieden wird zwischen **Fehlern** (schaden Auffindbarkeit, Vertrauen oder Funktion) und **optionalen Verbesserungen**.

## 1. Live-Website dieaufraeumer.com

### Fehler, nach Wirkung geordnet

| # | Befund | Beleg | In Version 2 |
|---|---|---|---|
| 1 | **Keine Zielseiten für die wichtigsten Suchen.** Alle Leistungen stehen auf einer Seite, Standortseiten fehlen. Für „Haushaltsauflösung Wiesbaden“ oder „Entrümpelung Mainz“ gibt es keine Seite, die ranken könnte. | Sitemap: 7 Seiten, davon 1 Leistungsseite | 8 Leistungsseiten, 4 Standortseiten, Kostenseite |
| 2 | **Zwei SEO-Plugins arbeiten gleichzeitig.** Yoast schreibt die robots.txt, Rank Math die Sitemap. Jede Seite enthält zwei widersprüchliche Blöcke strukturierter Daten. Das Logo ist darin einmal leer und einmal eine PDF-Datei. | robots.txt, Quelltext jeder Seite | Ein sauberer Datensatz je Seite |
| 3 | **Widersprüchliche Unternehmensdaten.** Telefon: überall 01514 6254168, im Impressum 0179 4285761. Öffnungszeiten: Website 9–19 und 12–17 Uhr, Gelbe Seiten 10–20 und 14–18 Uhr. Schreibfehler „Luxenburgplatz“ und „WIesbaden“. | Impressum, strukturierte Daten, Gelbe Seiten | Eine Quelle (`src/site.mjs`), Abweichungen als offene Punkte |
| 4 | **Wertanrechnung wird versprochen**, obwohl sie nicht angeboten wird: „kümmern uns um Wertanrechnung“. | Leistungsseite, Abschnitt Haushaltsauflösung | Entfernt, ersetzt durch klare Absage mit Einzelfall-Hinweis |
| 5 | **WordPress-Beispielbeitrag und Danke-Seite sind indexierbar** und stehen in der Sitemap. | `/hello-world/`, `/danke/` | 410 für den Beitrag, Danke-Seite auf noindex |
| 6 | **Rechner widerspricht sich.** Überschrift „individuellen Festpreis“, Ergebnis „Unverbindlicher Richtpreis“. Ein Foto ist Pflicht, das schreckt ab. | Startseite, Schritt 5 und 6 | Durchgehend „unverbindlicher Kostenrahmen“, Fotos freiwillig |
| 7 | **Impressum unvollständig.** Angabe zur Umsatzsteuer und Hinweis zur Streitbeilegung fehlen. | `/impressum/` | Vorbereitet, Angaben muss der Inhaber liefern |
| 8 | **Dünne Seiten.** „Über uns“ besteht aus einem Satz und hat keine Beschreibung. „Kontakt“ hat drei H1-Überschriften. | Quelltext | Eigenständige Inhalte, je Seite genau eine H1 |
| 9 | **Bilder ohne Aussage für Suchmaschinen.** Das Hauptbild ist ein Stockfoto. Referenzfotos haben leere Alt-Texte. Ein Portal-Abzeichen ist als „Entrümpelung Zertifikat“ beschriftet. | Startseite | Echte Fotos mit beschreibenden Alt-Texten, kein Stockfoto |
| 10 | **„Deutschlandweit im Einsatz“** steht neben der lokalen Ausrichtung auf Wiesbaden. Das verwässert das lokale Signal. | Startseite, Kontakt | Einsatzgebiet einheitlich: Wiesbaden und 50 km |

### Optional

- Elementor lädt 20 externe Skripte und fünf Schriftfamilien. Die neue Website kommt mit einer CSS- und einer JS-Datei und drei Schriftdateien aus.
- Das Abzeichen „Listando Top Experte 2025“ ist kein Zertifikat. Es wurde nicht übernommen, die Datei liegt bei Bedarf vor.

## 2. Version 1 (erster Neuentwurf)

### Fehler

| # | Befund | In Version 2 |
|---|---|---|
| 1 | Alle Inhalte auf einer Adresse, Unterseiten nur per Sprungmarke. Für Suchmaschinen existierte genau eine Seite. | 20 indexierbare Seiten mit eigenen Adressen |
| 2 | Wertanrechnung an 14 Stellen (Hero, Zusagen, Anlässe, Ablauf, Rechner, Etiketten, FAQ, Metadaten). | Vollständig entfernt, per Test abgesichert |
| 3 | Rechner mit geschätzten Demo-Preisen. Schaltfläche „Festpreis berechnen“ für ein unverbindliches Ergebnis. „Inklusive Anfahrt“, obwohl die Anfahrt separat berechnet wird. | Sätze des bisherigen Rechners, „Kosten berechnen“, Anfahrt separat ausgewiesen |
| 4 | Formulare versendeten nichts. | Server-Endpunkt mit Foto-Upload, lokal getestet |
| 5 | Platzhalter statt echter Daten (Telefon, Zeiten, Logo, Fotos, Bewertung). | Echte Daten von der Live-Website und aus öffentlichen Profilen |
| 6 | Zusagen ohne Beleg: Besichtigung per Video, Spende an soziale Einrichtungen, Übergabeprotokoll, keine Vorkasse, Rückruf binnen eines Werktags, Grundreinigung. | Gestrichen oder auf belegte Aussagen zurückgeführt |
| 7 | Kleine Bedienflächen unter 44 px (Textlinks, Kopierknopf), schwacher Kontrast bei Hinweistexten. | Alle Bedienflächen mindestens 44 px, Kontrast angehoben |
| 8 | 230 KB je Seitenaufruf, weil Styles und Skripte in der Seite steckten. | Ausgelagert und zwischengespeichert |

### Bewusst unverändert

Hausillustration mit Regler, Auftakt-Animation, Typografie, Seitenaufbau der Startseite, Rechner-Bedienung, Etiketten, Karte, Schlussbild.

## 3. Geprüfte Leistungsversprechen

| Aussage | Quelle | Entscheidung |
|---|---|---|
| Kostenlose Besichtigung vor Ort | Gelbe-Seiten-Eintrag des Unternehmens | bleibt |
| Festpreis | Live-Website („transparente Festpreise“) | bleibt als „Festpreis nach Besichtigung“ |
| Besenreine Übergabe, Fotodokumentation auf Wunsch | Live-Website | bleibt, „auf Wunsch“ ergänzt |
| Entsorgung mit Nachweis | Live-Website | bleibt, „auf Wunsch“ |
| Fester Ansprechpartner, fester Termin | Live-Website | bleibt |
| Zahlung per Rechnung oder PayPal | Gelbe-Seiten-Eintrag | bleibt |
| Anfahrt wird separat berechnet | bisheriger Rechner | neu aufgenommen |
| Umzug, Auslandsumzug in Europa, Betriebsauflösung, Messie-Räumung, Rückbau | Live-Website | eigene Seiten |
| Wertanrechnung | Vorgabe des Inhabers | entfernt |
| Video-Besichtigung, Spende, Protokoll, keine Vorkasse, Grundreinigung, Rückruf binnen eines Werktags | keine | entfernt |

## 4. Suchbegriffe und Seitenzuordnung

Zahlen zum Suchvolumen lagen nicht vor (kein Zugang zu Search Console oder einem Keyword-Werkzeug). Die Zuordnung stützt sich
auf die Suchergebnisseiten und den Aufbau der sichtbaren Wettbewerber (ruempellos.de, ruempel-schmiede.de, freischaufler.de,
beraeumfix.de). Diese nutzen durchweg Adressen nach dem Muster „Leistung + Ort“.

| Suchabsicht | Zielseite |
|---|---|
| Entrümpelung Wiesbaden, Entrümpelungsfirma Wiesbaden | `/` |
| Haushaltsauflösung Wiesbaden, Nachlass auflösen | `/haushaltsaufloesung-wiesbaden/` |
| Wohnungsauflösung Wiesbaden, Wohnung entrümpeln | `/wohnungsaufloesung-wiesbaden/` |
| Haus entrümpeln Wiesbaden, Hausräumung | `/hausentruempelung-wiesbaden/` |
| Kellerentrümpelung, Dachboden entrümpeln, Garage räumen | `/kellerentruempelung-wiesbaden/` |
| Messie-Wohnung entrümpeln | `/messie-wohnung-entruempeln-wiesbaden/` |
| Betriebsauflösung, Büro entrümpeln | `/betriebsaufloesung-wiesbaden/` |
| Teppich entfernen, Tapeten entfernen, Rückbau | `/rueckbau-wiesbaden/` |
| Umzug Wiesbaden | `/umzug-wiesbaden/` |
| Entrümpelung Kosten, Preise | `/entruempelung-kosten/` |
| Entrümpelung Mainz | `/entruempelung-mainz/` |
| Entrümpelung Taunusstein, Idstein, Niedernhausen, Bad Schwalbach | `/entruempelung-taunusstein/` |
| Entrümpelung Eltville, Rüdesheim, Rheingau | `/entruempelung-rheingau/` |
| Entrümpelung Hofheim, Hochheim, Flörsheim | `/entruempelung-main-taunus/` |

**Warum nur vier Standortseiten:** Jede hat eigene Inhalte (Anfahrt, Bebauung, Ortsteile, berechnete Entfernung, eigene Fragen).
Eine Seite je Stadtteil oder Kleinstadt wäre austauschbar und würde von Google als Brückenseite gewertet.
Weitere Seiten lohnen erst, wenn Search Console dort Nachfrage zeigt.

## 5. Bewertungen

- Belegt: **5,0 von 5 bei 8 Google-Bewertungen**, Stand 28.09.2026, abgelesen über werkenntdenbesten.de (dort als Quelle „google.de“ ausgewiesen).
- Die Website zeigt diese Zahl mit Stand-Datum und verlinkt auf das Google-Profil.
- **Keine Zitate:** Die Bewertungstexte waren nicht abrufbar. Zitate brauchen außerdem die Zustimmung der Verfasser.
- **Keine Sterne in den strukturierten Daten:** Google wertet Bewertungen, die ein Unternehmen über sich selbst auszeichnet, nicht für Sterne im Suchergebnis und sieht sie als Richtlinienverstoß.
- Gelbe Seiten: keine Bewertungen vorhanden.

## 6. Prüfnachweise Version 2

- 257 automatisierte Prüfungen bestanden: Metadaten, Überschriften, Canonicals, strukturierte Daten, interne Links, Rechner, Formulare, Server-Schutz, Tastatur, Breiten von 320 bis 1280 px.
- Echter Formularversand mit Foto gegen den PHP-Endpunkt (Testmodus, Mail als Datei geprüft).
- Lighthouse-Werte stehen in `docs/MIGRATION.md`, sobald gemessen.

## 7. Offene Punkte (braucht der Inhaber)

1. Welche Telefonnummer gilt: 01514 6254168 oder 0179 4285761?
2. Welche Erreichbarkeit gilt? Danach Gelbe Seiten und Google-Profil angleichen.
3. Preise im Rechner kalibrieren (`src/preise.mjs`).
4. Zustimmung der Kunden zu den sechs Fotos vorhanden?
5. Logo als Vektordatei (SVG), Foto von Paul Hansen.
6. Angaben fürs Impressum, Name des Hosting-Anbieters für die Datenschutzerklärung.
7. Bestätigen: Festpreis nach Besichtigung, Fotodokumentation, Entsorgungsnachweis.
