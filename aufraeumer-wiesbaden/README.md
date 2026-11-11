# Die Aufräumer Wiesbaden – Website

Eigenständige, statische Website für Die Aufräumer Wiesbaden (Inhaber Paul Hansen, Luxemburgplatz 5, 65185 Wiesbaden).
Dieser Ordner ist unabhängig vom übrigen Repository und braucht keine Abhängigkeiten außer Node.js für den Build.

## Ansehen

- `vorschau.html` per Doppelklick öffnen. Alles steckt in dieser einen Datei.
- `index.html` ist die Fassung für den Server. Sie lädt die Schriften aus `fonts/` und gehört zusammen mit diesem Ordner hochgeladen.

## Ändern und neu bauen

```
node build.mjs
```

| Was | Wo |
| --- | --- |
| Telefonnummer, Formular-Empfänger | `src/app.js`, Block `CONFIG` ganz oben |
| Preise des Rechners | `src/app.js`, Block `PREISE` |
| Texte und Abschnitte | `src/partials/*.html` |
| Farben, Schrift, Abstände | `src/styles.css`, Block `:root` |
| Orte im Einsatzgebiet | `src/data/towns.mjs` |
| Titel, Beschreibung, strukturierte Daten | `src/head.html` |
| Hero-Illustration, Karte | `src/illustrations/*.mjs` |

## Vor dem Livegang

Belegt sind nur Name, Inhaber, Anschrift, Branche, Einsatzgebiet und Zielgruppen. Alles andere ist ein Vorschlag
und auf der Seite mit „Demo“ markiert. Die vollständige Liste steht auf der Seite unter „Annahmen dieser Vorschau“.

1. Echte Telefonnummer eintragen und `phoneIsDemo` auf `false` setzen. Die Anruf-Links werden dann automatisch zu `tel:`-Links.
2. `formEndpoint` setzen. Die drei Formulare senden dann JSON per POST an diese Adresse. Ohne Adresse wird nichts versendet.
3. Preise im Rechner durch die eigene Kalkulation ersetzen.
4. Zusagen, Erreichbarkeit und das Zitat von Paul Hansen prüfen.
5. Echte Fotos und echte Google-Bewertungen einsetzen. Die Platzhalter sind dafür vorbereitet.
6. Impressum und Datenschutzerklärung vervollständigen.
7. Demo-Markierungen entfernen: Vorschau-Leiste und `<span class="demo">` in den Partials löschen.

## Technik in Kürze

- Reines HTML, CSS und JavaScript, keine Laufzeit-Abhängigkeiten, keine Cookies, kein Tracking.
- Schriften liegen lokal (Bricolage Grotesque, Atkinson Hyperlegible Next und Mono, alle SIL Open Font License).
- Helles und dunkles Farbschema, bedienbar per Tastatur, Bewegung richtet sich nach der Systemeinstellung.
