import { useCalculator } from '@/context/CalculatorContext';
import { validateBillingPeriod } from '@/lib/calculator/engine';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

/** Hard date bounds for the inputs. Pilotversion: nur Zeiträume innerhalb
 *  der Jahre 2024–2026 zulässig (z. B. 01.02.2025 – 31.01.2026). */
const MIN_DATE = '2024-01-01';
const MAX_DATE = '2026-12-31';

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
  const startMax = end ?? MAX_DATE;
  const endMin = start ?? MIN_DATE;
  const endMaxBounded = endMax && endMax < MAX_DATE ? endMax : MAX_DATE;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abrechnungszeitraum</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Für welchen Abrechnungszeitraum möchten Sie die Berechnung durchführen?
        </p>
      </div>

      <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bitte tragen Sie den Zeitraum genau so ein, wie er in Ihrer Heizkosten-, Brennstoff- oder Wärmelieferabrechnung angegeben ist. Eine Aufteilung nach Kalenderjahren ist nicht erforderlich. Im Standardmodus werden aktuell nur die Jahre 2024 und 2025 berücksichtigt, da frühere Zeiträume in typischen Erstattungsfällen regelmäßig nicht mehr fristgerecht geltend gemacht werden können.
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
                max={endMaxBounded}
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
