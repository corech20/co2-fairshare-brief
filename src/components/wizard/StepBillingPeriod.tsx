import { useCalculator } from '@/context/CalculatorContext';
import { validateBillingPeriod, isCrossYearPeriod, getYearBoundaries, getCO2PriceForYear } from '@/lib/calculator/engine';
import { AlertTriangle, Info, ChevronDown } from 'lucide-react';
import type { YearlySegment } from '@/lib/calculator/types';
import { useEffect, useState } from 'react';
import { IntegerInput } from './IntegerInput';

/** Years shown as quick-select tiles in default mode.
 *  2023 is intentionally omitted here – it remains selectable via the
 *  "abweichender Zeitraum"-Modus (date inputs) for cross-year cases like
 *  01.10.2023 – 30.09.2024. The hard lower bound is enforced in
 *  validateBillingPeriod() in engine.ts. */
const AVAILABLE_YEARS = [2024, 2025];
const MIN_DATE = '2023-01-01';

export default function StepBillingPeriod() {
  const { wizardData, setWizardField } = useCalculator();

  // Detect if we're in "deviating period" mode
  const isDeviating = (() => {
    if (!wizardData.billingPeriodStart || !wizardData.billingPeriodEnd) return false;
    // Check if it matches a full calendar year
    const start = wizardData.billingPeriodStart;
    const end = wizardData.billingPeriodEnd;
    return !AVAILABLE_YEARS.some(y => start === `${y}-01-01` && end === `${y}-12-31`);
  })();

  const [showDeviating, setShowDeviating] = useState(isDeviating);

  const selectedYear = (() => {
    if (!wizardData.billingPeriodStart || !wizardData.billingPeriodEnd) return undefined;
    for (const y of AVAILABLE_YEARS) {
      if (wizardData.billingPeriodStart === `${y}-01-01` && wizardData.billingPeriodEnd === `${y}-12-31`) {
        return y;
      }
    }
    return undefined;
  })();

  const selectYear = (year: number) => {
    setWizardField('billingPeriodStart', `${year}-01-01`);
    setWizardField('billingPeriodEnd', `${year}-12-31`);
    setWizardField('yearlySegments', undefined);
    setShowDeviating(false);
  };

  const openDeviating = () => {
    setShowDeviating(true);
    // Clear year selection
    setWizardField('billingPeriodStart', undefined);
    setWizardField('billingPeriodEnd', undefined);
    setWizardField('yearlySegments', undefined);
  };

  const start = wizardData.billingPeriodStart;
  const end = wizardData.billingPeriodEnd;
  const validationError = showDeviating ? validateBillingPeriod(start, end) : null;
  const crossYear = start && end && !validationError ? isCrossYearPeriod(start, end) : false;
  const yearBoundaries = crossYear && start && end ? getYearBoundaries(start, end) : [];

  // Auto-initialize yearly segments when cross-year is detected
  // Serialize boundaries for comparison to detect date changes
  const boundariesKey = JSON.stringify(yearBoundaries.map(b => [b.year, b.periodStart, b.periodEnd]));

  useEffect(() => {
    if (crossYear && yearBoundaries.length > 0) {
      const existing = wizardData.yearlySegments;
      // Re-initialize if segment count changed OR if the actual dates changed
      const needsReinit = !existing || existing.length !== yearBoundaries.length ||
        existing.some((seg, i) => seg.periodStart !== yearBoundaries[i].periodStart || seg.periodEnd !== yearBoundaries[i].periodEnd);
      if (needsReinit) {
        const segments: YearlySegment[] = yearBoundaries.map((b, i) => ({
          year: b.year,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          amount: existing?.[i]?.amount ?? 0,
          co2PricePerTon: getCO2PriceForYear(b.year),
        }));
        setWizardField('yearlySegments', segments);
      }
    } else if (!crossYear && wizardData.yearlySegments) {
      setWizardField('yearlySegments', undefined);
    }
  }, [crossYear, boundariesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSegmentAmount = (index: number, amount: number) => {
    const segments = [...(wizardData.yearlySegments ?? [])];
    segments[index] = { ...segments[index], amount };
    setWizardField('yearlySegments', segments);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abrechnungszeitraum</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Für welches Abrechnungsjahr möchten Sie die Berechnung durchführen?
        </p>
      </div>

      {/* Year selection (default mode) */}
      {!showDeviating && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AVAILABLE_YEARS.map(year => (
              <button
                key={year}
                onClick={() => selectYear(year)}
                className={`rounded-lg border-2 p-4 text-center transition-all hover:shadow-md ${
                  selectedYear === year
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="font-semibold text-foreground text-lg">{year}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  CO2-Preis: {getCO2PriceForYear(year)} €/t
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Im Standardmodus werden nur aktuell praktisch relevante Abrechnungsjahre angezeigt.
            Für abweichende oder jahresübergreifende Zeiträume können frühere unterstützte Jahre
            im Sonderfall weiterhin ausgewählt werden.
          </p>

          <button
            onClick={openDeviating}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
            Abweichenden Zeitraum eingeben
          </button>
        </>
      )}

      {/* Deviating period mode */}
      {showDeviating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Abweichender Abrechnungszeitraum</span>
            <button
              onClick={() => {
                setShowDeviating(false);
                setWizardField('billingPeriodStart', undefined);
                setWizardField('billingPeriodEnd', undefined);
                setWizardField('yearlySegments', undefined);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurück zur Jahresauswahl
            </button>
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
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 flex gap-3">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Jahresübergreifender Zeitraum</p>
                  <p className="mt-1">
                    Da unterschiedliche CO2-Preise gelten, werden die Verbrauchsmengen getrennt nach Jahren erfasst.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {yearBoundaries.map((seg, i) => {
                  const co2Price = getCO2PriceForYear(seg.year);
                  const segAmount = wizardData.yearlySegments?.[i]?.amount ?? 0;
                  return (
                    <div key={seg.year} className="rounded-lg border-2 border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {seg.year}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          CO2-Preis: {co2Price} €/t
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(seg.periodStart).toLocaleDateString('de-DE')} – {new Date(seg.periodEnd).toLocaleDateString('de-DE')}
                      </p>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Verbrauchsmenge (nur ganze Zahlen)</label>
                        <IntegerInput
                          value={segAmount > 0 ? segAmount : undefined}
                          onChange={v => updateSegmentAmount(i, v ?? 0)}
                          placeholder="z. B. 25000"
                          className="px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!crossYear && !validationError && start && end && (
            <p className="text-xs text-muted-foreground">
              Der Abrechnungszeitraum darf maximal 365 Tage umfassen. Erstreckt sich der Zeitraum über mehrere Kalenderjahre, werden die Verbrauchsmengen getrennt nach Jahren erfasst.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
