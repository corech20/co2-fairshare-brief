
## Problem

In Section 2 von `DetailedCalculationView.tsx` weicht der Zeilenabstand weiterhin von Section 1, 3, 4 ab. Ursachen:

1. **Sub-Container nutzen `space-y-0`**: Die inneren `<div>`-Wrapper (Gebäude-Infos, Stufenmodell-Block, Nichtwohngebäude-Block) haben `space-y-0`. Dadurch kollabiert der Abstand zwischen den `Row`-Komponenten innerhalb eines Blocks – Zeilen kleben enger als in Section 1.
2. **Section 1 hat keinen solchen Sub-Container**: Dort sitzen `Row`-Aufrufe direkt im `space-y-3`-Parent, wodurch jede Zeile den vollen Rhythmus erhält. Die `py-1` im Row-Helper allein reicht nicht für den optisch gleichen Abstand.
3. **Zusätzliche Hinweistexte** (`<p className="... mt-1">`) brechen den Rhythmus zusätzlich.

## Lösung (nur `src/components/DetailedCalculationView.tsx`)

1. **Section 2 flach strukturieren** – Sub-Container `<div className="space-y-0">` entfernen. Stattdessen `Row`-Komponenten und Absätze direkt als Geschwister im `mt-3 space-y-3`-Hauptcontainer platzieren, exakt wie Section 1.
2. Die conditional-Blöcke (Stufenmodell, Nichtwohngebäude) als React-Fragments (`<>...</>`) statt `<div>`-Wrapper rendern, damit `space-y-3` gleichmäßig zwischen allen Elementen wirkt.
3. **Hinweis-Absatz** (`mt-1` unter Annualisierung) → `mt-1` entfernen, Container regelt Abstand.

## Out of scope
- Keine Änderungen an Inhalt, Section 1/3/4, PDF, Farben, Schriften.
