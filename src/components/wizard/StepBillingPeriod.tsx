import { useCalculator } from '@/context/CalculatorContext';
import { validateBillingPeriod, isCrossYearPeriod } from '@/lib/calculator/engine';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

/** Hard lower bound for the date inputs. Cross-year periods like
 *  01.10.2023 – 30.09.2024 remain valid; the actual bounds are enforced
 *  in validateBillingPeriod() in engine.ts. */
const MIN_DATE = '2023-01-01';

/** Add days to a YYYY-MM-DD string and return the same format. */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
/** Subtract days. */
function subDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

export default function StepBillingPeriod() {
  const { wizardData, setWizardField } = useCalculator();

  const start = wizardData.billingPeriodStart;
  const end = wizardData.billingPeriodEnd;
  const validationError = start && end ? validateBillingPeriod(start, end) : null;
  const crossYear = start && end && !validationError ? isCrossYearPeriod(start, end) : false;
  const isTenant = wizardData.userRole === 'mieter';
  const calcNoun = isTenant ? 'Erstattungsbeträge' : 'CO2-Kostenaufteilung';

  // Cleanup: legacy yearly segment data is no longer used in the standard flow.
  useEffect(() => {
    if (wizardData.yearlySegments) {
      setWizardField('yearlySegments', undefined);
    }
  }, [wizardData.yearlySegments, setWizardField]);

  // Enforce 365-day window directly on the date inputs.
  // - "Bis" max is start + 364 days (so end - start <= 364 → period <= 365 days inclusive)
  // - "Von" min/max constrain to keep window <= 365 days when an end is already set
  const endMax = start ? addDays(start, 364) : undefined;
  const startMinFromEnd = end ? subDays(end, 364) : undefined;
  const startMin = MIN_DATE > (startMinFromEnd ?? MIN_DATE) ? MIN_DATE : (startMinFromEnd ?? MIN_DATE);
  const startMax = end ?? undefined;
  const endMin = start ?? MIN_DATE;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abrechnungszeitraum</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Für welches Abrechnungsjahr möchten Sie die Berechnung durchführen?
        </p>
      </div>

      <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Das Tool berechnet {calcNoun} für 2024 und 2025
              (CO2-Preis: 45 €/t in 2024, 55 €/t in 2025).
            </p>
            <p className="text-xs text-muted-foreground">
              Frühere Jahre: Erstattungsansprüche müssen innerhalb von 12 Monaten nach Abrechnung geltend gemacht werden.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Bitte tragen Sie den Zeitraum genau so ein, wie er in Ihrer Heizkosten- oder Brennstoffabrechnung angegeben ist.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Von</label>
              <input
                type="date"
                min={startMin}
                max={startMax}
                value={start ?? ''}
                onChange={e => setWizardField('billingPeriodStart', e.target.value)}
                className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bis</label>
              <input
                type="date"
                min={endMin}
                max={endMax}
                value={end ?? ''}
                onChange={e => setWizardField('billingPeriodEnd', e.target.value)}
                className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {validationError && (
            <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-3 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{validationError}</p>
            </div>
          )}
      </div>
    </div>
  );
}
