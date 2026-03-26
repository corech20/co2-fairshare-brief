import { useCalculator } from '@/context/CalculatorContext';
import { validateBillingPeriod, isCrossYearPeriod, getYearBoundaries, getCO2PriceForYear } from '@/lib/calculator/engine';
import { AlertTriangle, Info } from 'lucide-react';
import type { YearlySegment } from '@/lib/calculator/types';
import { useEffect } from 'react';

export default function StepBillingPeriod() {
  const { wizardData, setWizardField } = useCalculator();

  const start = wizardData.billingPeriodStart;
  const end = wizardData.billingPeriodEnd;
  const validationError = validateBillingPeriod(start, end);
  const crossYear = start && end && !validationError ? isCrossYearPeriod(start, end) : false;
  const yearBoundaries = crossYear && start && end ? getYearBoundaries(start, end) : [];

  // Auto-initialize yearly segments when cross-year is detected
  useEffect(() => {
    if (crossYear && yearBoundaries.length > 0) {
      const existing = wizardData.yearlySegments;
      // Only initialize if not already set or segment count changed
      if (!existing || existing.length !== yearBoundaries.length) {
        const segments: YearlySegment[] = yearBoundaries.map(b => ({
          year: b.year,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          amount: 0,
          co2PricePerTon: getCO2PriceForYear(b.year),
        }));
        setWizardField('yearlySegments', segments);
      }
    } else if (!crossYear && wizardData.yearlySegments) {
      setWizardField('yearlySegments', undefined);
    }
  }, [crossYear, yearBoundaries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSegmentAmount = (index: number, amount: number) => {
    const segments = [...(wizardData.yearlySegments ?? [])];
    segments[index] = { ...segments[index], amount };
    setWizardField('yearlySegments', segments);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abrechnungszeitraum</h2>
        <p className="text-muted-foreground mt-2">
          Bitte tragen Sie den Zeitraum genau so ein, wie er in Ihrer Heizkosten- oder Brennstoffabrechnung angegeben ist.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Von</label>
          <input
            type="date"
            value={start ?? ''}
            onChange={e => setWizardField('billingPeriodStart', e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bis</label>
          <input
            type="date"
            value={end ?? ''}
            onChange={e => setWizardField('billingPeriodEnd', e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive font-medium">{validationError}</p>
        </div>
      )}

      {/* Cross-year info + segment inputs */}
      {crossYear && !validationError && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium">Jahresübergreifender Abrechnungszeitraum</p>
              <p className="mt-1">
                Da sich der Zeitraum über mehrere Kalenderjahre erstreckt und unterschiedliche CO2-Preise gelten, müssen die Verbrauchsmengen getrennt nach Jahren eingegeben werden.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {yearBoundaries.map((seg, i) => {
              const co2Price = getCO2PriceForYear(seg.year);
              const segAmount = wizardData.yearlySegments?.[i]?.amount ?? 0;
              return (
                <div key={seg.year} className="rounded-xl border-2 border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Segment {seg.year}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      CO2-Preis: {co2Price} €/Tonne
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(seg.periodStart).toLocaleDateString('de-DE')} – {new Date(seg.periodEnd).toLocaleDateString('de-DE')}
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Verbrauchsmenge für {seg.year}</label>
                    <input
                      type="number"
                      value={segAmount || ''}
                      onChange={e => updateSegmentAmount(i, parseFloat(e.target.value) || 0)}
                      placeholder="z. B. 25000"
                      className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!crossYear && !validationError && (
        <p className="text-sm text-muted-foreground">
          In vielen Fällen umfasst der Abrechnungszeitraum 12 Monate. Wenn Ihre Abrechnung davon abweicht, übernehmen Sie bitte trotzdem den tatsächlichen Zeitraum aus der Abrechnung.
        </p>
      )}
    </div>
  );
}
