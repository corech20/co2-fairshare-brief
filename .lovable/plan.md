
## Scope

Two cleanup tasks across UI (`DetailedCalculationView.tsx`) and PDF (`pdf.ts` + helpers).

## Task 1 — Remove broken intermediate line + unbold two lines

**File: `src/components/DetailedCalculationView.tsx`** (Section 2, Stufenmodell block)
- Delete the paragraph rendering: „Der spezifische CO2-Ausstoß von … liegt im Bereich von …" — remove that `<p>` entirely. No replacement.
- Change `Row` calls for "Einstufung:" and "Basis-Aufteilung nach Stufenmodell:" to non-bold (drop the `bold` prop / set to false). All other rows in Section 2 stay as they are.

**File: `src/lib/calculator/pdf.ts`** (Section 2, Stufenmodell block, lines ~308–316)
- Remove the `bodyText("Der spezifische CO2-Ausstoß von … liegt im Bereich von …")` call entirely.
- Change `detailRow('Einstufung:', …, 2, true)` → `detailRow('Einstufung:', …, 2)` (drop bold flag).
- Change `detailRow('Basis-Aufteilung nach Stufenmodell:', …, 2, true)` → drop bold flag.

## Task 2 — KWK-specific energy label

**Detection rule:** A KWK heat-share case = the fuel result is `erdgas_kwk` (or any future `*_kwk` fuel) where the displayed kWh value is the heat-allocated share, not the full fuel energy. Inspect `pdf-helpers.ts → getFuelCalculationSteps` and `engine.ts` to confirm exact field used.

**Files to update (label only, no logic):**
- `src/lib/calculator/pdf-helpers.ts` — in `getFuelCalculationSteps`, when `fr.fuelType === 'erdgas_kwk'` (or similar KWK marker), emit the energy step with the long label „Energiegehalt (Heizwert, bezogen auf den Wärmeanteil bei KWK)". Otherwise keep existing „Energiegehalt (Heizwert)".
- `src/lib/calculator/pdf.ts` — cross-year segment block uses `detailRow('Energie (Heizwert):', …)`. Make this conditional on the segment's fuel being KWK; if so use the long label.
- `src/components/DetailedCalculationView.tsx` — wherever the energy/Heizwert row is rendered per fuel, apply the same KWK-conditional label.

**Out of scope:** Non-KWK fuels keep „Energiegehalt (Heizwert)". Wizard input labels untouched. No layout changes unless overflow appears (the long label fits within standard PDF column width and the UI row uses flex with truncation tolerance — verify after edit, adjust only if needed).

## Verification step (after edits)
Re-read both files to confirm, then ask user to visually check `/ergebnis` and a freshly generated PDF.
