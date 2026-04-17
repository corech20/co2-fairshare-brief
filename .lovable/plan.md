
Vereinheitliche den vertikalen Rhythmus aller Sektionen (1–4) in `DetailedCalculationView.tsx`, sodass Zeilenabstand und Block-Abstände identisch sind.

## Beobachtung

In `src/components/DetailedCalculationView.tsx`:
- Section 1 nutzt `mt-3 space-y-3` als Hauptcontainer.
- Section 2 hat zwar jetzt `mt-3 space-y-3`, enthält aber ein zusätzliches großes Padding/Block-Trennung durch separate `<div>`-Wrapper (Stufenmodell-Block) – wirkt dadurch luftiger.
- Section 3 nutzt `space-y-2` (engere Absätze) – inkonsistent.
- Section 4 nutzt direkte `Row`-Aufrufe ohne Container, dazwischen `<hr className="my-2">` und `mt-2 / mt-3` – ergibt unregelmäßigen Abstand.

## Änderungen (nur `src/components/DetailedCalculationView.tsx`)

1. **Section 2**: Den zusätzlichen Block-Abstand entfernen. Statt mehrerer geschachtelter `<div>` mit Standard-Block-Margin nur `space-y-1` innerhalb der Subgruppen (Gebäude-Infos, Einstufung-Block) verwenden, sodass der Zeilenabstand exakt dem von Section 1 entspricht. Den großen Abstand vor "Einstufung" durch normalen `space-y-3`-Rhythmus ersetzen.

2. **Section 3**: `space-y-2` → `space-y-3`, plus äußeren Wrapper `mt-3` ergänzen, identisch zu Section 1/2.

3. **Section 4**: Inhalte in `<div className="mt-3 space-y-3">` einwickeln. `<hr className="my-2">` → entfernen oder durch `my-0` ersetzen, damit `space-y-3` den Abstand bestimmt. `mt-2`/`mt-3`-Sonderfälle (Erstattungsanspruch, Hinweistexte) auf 0 setzen und den Abstand vom Container regeln lassen.

4. **Row-Helper**: `py-1` bleibt unverändert – das ist der konsistente Zeilenabstand innerhalb eines Blocks.

## Out of scope
- Keine inhaltlichen Änderungen, keine Anpassung von Schriftgrößen, Farben oder PDF.
