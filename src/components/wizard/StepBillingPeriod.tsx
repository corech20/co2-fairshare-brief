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

/** Validate that a string is a real calendar date in YYYY-MM-DD format. */
function isValidDateString(value: string | undefined | null): boolean {
  if (!value) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(value);
  return (
    !Number.isNaN(d.getTime()) &&
    d.getUTCFullYear() === year &&
    d.getUTCMonth() + 1 === month &&
    d.getUTCDate() === day
  );
}

export default function StepBillingPeriod() {
  const { wizardData, setWizardField } = useCalculator();

  const start = wizardData.billingPeriodStart;
  const end = wizardData.billingPeriodEnd;

  const startValid = isValidDateString(start);
  const endValid = isValidDateString(end);

  let startError: string | null = null;
  let endError: string | null = null;

  if (start && !startValid) {
    startError = 'Bitte geben Sie ein gültiges Startdatum ein.';
  }
  if (end && !endValid) {
    endError = 'Bitte geben Sie ein gültiges Enddatum ein, z. B. 30.11.2024.';
  }
  if (startValid && endValid && start! > end!) {
    endError = 'Das Enddatum darf nicht vor dem Startdatum liegen.';
  }

  const rangeError =
    startValid && endValid && !endError ? validateBillingPeriod(start!, end!) : null;
  const validationError = rangeError;

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
            Bitte tragen Sie den Abrechnungszeitraum ein. Bei einer einzelnen Rechnung übernehmen Sie den Zeitraum direkt. Bei mehreren Lieferungen ist der Zeitraum maßgeblich, für den die CO2-Emissionen und CO2-Kosten aus den jeweiligen Rechnungen zusammenzustellen sind.
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
                aria-invalid={!!startError}
                className={`w-full rounded-lg border-2 bg-card px-4 py-3 text-foreground focus:outline-none transition-colors ${
                  startError
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border focus:border-accent'
                }`}
              />
              {startError && (
                <p className="text-xs text-destructive font-medium">{startError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bis</label>
              <input
                type="date"
                min={endMin}
                max={endMaxBounded}
                value={end ?? ''}
                onChange={e => setWizardField('billingPeriodEnd', e.target.value)}
                aria-invalid={!!endError}
                className={`w-full rounded-lg border-2 bg-card px-4 py-3 text-foreground focus:outline-none transition-colors ${
                  endError
                    ? 'border-destructive focus:border-destructive'
                    : 'border-border focus:border-accent'
                }`}
              />
              {endError && (
                <p className="text-xs text-destructive font-medium">{endError}</p>
              )}
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
