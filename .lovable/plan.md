
Make all currency values (€) right-aligned while keeping labels and other values left-aligned, in both the web detailed view and the PDF.

## Files to change

1. **`src/components/DetailedCalculationView.tsx`**
   - Update the `Row` helper to detect when the value contains `€` and render it right-aligned (push value to the right with `ml-auto` / `flex-1 text-right`).
   - Apply the same to Section 4 result rows (Gesamt CO2-Kosten, Anteil Vermieter, Anteil Mieter, Erstattungsanspruch).

2. **`src/pages/Results.tsx`**
   - In the compact "Ergebnis" summary, right-align the "Gesamte CO2-Kosten (brutto)" value and the Erstattungsanspruch value while keeping labels left-aligned.
   - Keep "Einstufung" left-aligned (no €).

3. **`src/lib/calculator/pdf.ts`**
   - Update `detailRow` helper: if the value string contains `€`, place it right-aligned to the right page margin instead of directly after the label. Otherwise keep the new left-aligned behavior (label + value next to each other).

## Approach

- Detection rule: `value.includes('€')` → right-align. Simple, consistent across web + PDF.
- Layout pattern (web): `<div class="flex gap-2"><dt>Label:</dt><dd class="ml-auto tabular-nums">123,45 €</dd></div>` for currency rows; current left-aligned layout for non-currency.
- PDF: compute text width of value with `doc.getTextWidth()`, draw at `pageWidth - rightMargin - valueWidth`.

## Out of scope
- No changes to calculation logic, PDF section order, or wording.
- Percentages (e.g. "50 %") remain left-aligned next to their label.

