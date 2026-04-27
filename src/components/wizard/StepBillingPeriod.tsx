import { useCalculator } from '@/context/CalculatorContext';
import { validateBillingPeriod, isCrossYearPeriod } from '@/lib/calculator/engine';
import { AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';

/** Hard lower bound for the date inputs. Cross-year periods like
 *  01.10.2023 – 30.09.2024 remain valid; the actual bounds are enforced
 *  in validateBillingPeriod() in engine.ts. */
const MIN_DATE = '2023-01-01';

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
                min={MIN_DATE}
                value={start ?? ''}
                onChange={e => setWizardField('billingPeriodStart', e.target.value)}
                className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bis</label>
              <input
                type="date"
                min={MIN_DATE}
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

          {crossYear && !validationError && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 flex gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Jahresübergreifender Zeitraum</p>
                <p className="mt-1">
                  Bitte geben Sie die Gesamtwerte für den gesamten Rechnungszeitraum ein.
                </p>
              </div>
            </div>
          )}

          {!crossYear && !validationError && start && end && (
            <p className="text-xs text-muted-foreground">
              Der Abrechnungszeitraum darf maximal 365 Tage umfassen. Erstreckt sich der Zeitraum über mehrere Kalenderjahre, werden die Verbrauchsmengen getrennt nach Jahren erfasst.
            </p>
          )}
      </div>
    </div>
  );
}
