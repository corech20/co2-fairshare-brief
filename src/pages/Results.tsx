import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { FileText, RotateCcw, ArrowRight, Info, AlertTriangle, Building2, Flame, CalendarDays } from 'lucide-react';
import { generatePDF } from '@/lib/calculator/pdf';
import { getDocumentCase, getHeatSupplyLabel, getBuildingTypeLabel, fmt } from '@/lib/calculator/pdf-helpers';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, wizardData, reset } = useCalculator();

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Keine Berechnung vorhanden.</p>
          <Button onClick={() => navigate('/rechner')}>Zur Berechnung<ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  const handleNewCalculation = () => { reset(); navigate('/rechner'); };
  const handleGeneratePDF = () => { generatePDF(wizardData, result); };

  const formatCurrency = (n: number) => fmt.currency(n);
  const formatNumber = (n: number, decimals = 2) => fmt.number(n, decimals);

  const docCase = getDocumentCase(wizardData);
  const isTenantClaim = docCase === 'C' || docCase === 'D';

  const allocationExplanation = result.isResidential
    ? result.stufenmodellStep > 0 ? `Stufe ${result.stufenmodellStep} des 10-Stufen-Modells nach §5 CO2KostAufG` : ''
    : result.restrictionApplied === 'fall1und2'
      ? 'Bei Vorliegen beider öffentlich-rechtlicher Einschränkungen trägt der Mieter die CO2-Kosten vollständig (100 % / 0 %).'
      : 'Hälftige Aufteilung (50/50) nach §8 CO2KostAufG für Nichtwohngebäude';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container-narrow flex h-16 items-center px-4">
          <span className="font-semibold text-foreground">Ergebnis Ihrer Berechnung</span>
        </div>
      </header>

      <main className="section-padding">
        <div className="container-narrow px-4 space-y-8 animate-fade-in">
          {/* Summary */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <p className="text-lg font-medium text-foreground leading-relaxed">
              Nach Ihren Angaben entfallen <strong className="text-primary">{result.landlordPercent}&nbsp;% der CO2-Kosten auf den Vermieter</strong> und <strong className="text-accent">{result.tenantPercent}&nbsp;% auf den Mieter</strong>.
            </p>
            {allocationExplanation && <p className="text-sm text-muted-foreground mt-2">{allocationExplanation}</p>}
          </div>

          {/* Context chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
              <Building2 className="h-3 w-3" />{getBuildingTypeLabel(wizardData)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
              <Flame className="h-3 w-3" />{getHeatSupplyLabel(wizardData)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {fmt.date(wizardData.billingPeriodStart)} – {fmt.date(wizardData.billingPeriodEnd)}
            </span>
            {result.isCrossYear && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-amber-700 dark:text-amber-400">
                <CalendarDays className="h-3 w-3" />Jahresübergreifend
              </span>
            )}
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Gesamte CO2-Kosten</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(result.totalCO2Cost)}</div>
              {result.usedDirectCost && <div className="text-xs text-muted-foreground mt-1">(direkt eingegeben)</div>}
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Anteil Vermieter</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(result.landlordShare)}</div>
              <div className="text-sm text-primary font-medium mt-1">{result.landlordPercent} %</div>
            </div>
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Anteil Mieter</div>
              <div className="text-3xl font-bold text-accent">{formatCurrency(result.tenantShare)}</div>
              <div className="text-sm text-accent font-medium mt-1">{result.tenantPercent} %</div>
            </div>
          </div>

          {/* Tenant reimbursement claim */}
          {isTenantClaim && (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-foreground leading-relaxed">
                <p className="font-semibold">Möglicher Erstattungsanspruch gegenüber dem Vermieter</p>
                <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(result.landlordShare)}</p>
                <p className="text-muted-foreground mt-1">
                  Dieser Betrag kann beim Vermieter zur Erstattung geltend gemacht werden.
                </p>
              </div>
            </div>
          )}

          {/* Non-residential explicit notes */}
          {!result.isResidential && result.restrictionApplied === 'fall3' && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 flex gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Für Nichtwohngebäude gilt im Regelfall eine hälftige Aufteilung (50/50) der CO2-Kosten zwischen Mieter und Vermieter gemäß §8 CO2KostAufG.
              </p>
            </div>
          )}
          {!result.isResidential && result.restrictionApplied === 'fall1und2' && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 flex gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Da beide öffentlich-rechtlichen Einschränkungen vorliegen, trägt der Mieter die CO2-Kosten vollständig.
              </p>
            </div>
          )}

          {/* Cross-year segment details */}
          {result.isCrossYear && result.segmentResults && result.segmentResults.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />Jahresabschnitte
              </h3>
              <div className="space-y-2">
                {result.segmentResults.map((seg, i) => (
                  <div key={i} className="grid grid-cols-2 gap-1 text-sm border-l-2 border-accent/30 pl-3 py-1">
                    <span className="text-muted-foreground">{seg.year}</span>
                    <span className="text-right text-foreground font-medium">{formatCurrency(seg.co2CostGross)}</span>
                    <span className="text-xs text-muted-foreground">
                      {fmt.date(seg.periodStart)} – {fmt.date(seg.periodEnd)}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                      CO2-Preis: {seg.co2PricePerTon} €/t
                    </span>
                    <span className="text-xs text-muted-foreground">Menge: {formatNumber(seg.amount, 0)}</span>
                    <span className="text-xs text-muted-foreground text-right">{formatNumber(seg.co2Kg, 1)} kg CO2</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5% reduction note */}
          {result.reimbursementReductionApplied && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-5 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <p className="font-medium">5 % Kürzung angewendet</p>
                <p>Der Erstattungsanspruch gegenüber dem Vermieter wurde pauschal um {result.reimbursementReductionPercent} % gekürzt (zusätzliches Gasgerät ohne eigenen Zähler).</p>
                {result.landlordShareBeforeReduction != null && (
                  <p className="mt-1">Vor Kürzung: {formatCurrency(result.landlordShareBeforeReduction)}</p>
                )}
              </div>
            </div>
          )}

          {/* Restriction note */}
          {result.restrictionNote && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-5 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{result.restrictionNote}</p>
            </div>
          )}

          {/* Notes */}
          {result.notes.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-1">
              {result.notes.map((note, i) => (
                <p key={i} className="text-sm text-muted-foreground flex gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  {note}
                </p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="cta" size="lg" className="flex-1" onClick={handleGeneratePDF}>
              <FileText className="h-5 w-5" />PDF-Schreiben erstellen
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleNewCalculation}>
              <RotateCcw className="h-5 w-5" />Neue Berechnung
            </Button>
          </div>

          {/* Technical details */}
          <details className="rounded-xl border border-border bg-card shadow-sm">
            <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-card-foreground hover:bg-muted/50 rounded-xl transition-colors">
              Technische Details anzeigen
            </summary>
            <div className="px-6 pb-6 pt-2 space-y-3 text-muted-foreground text-sm leading-relaxed">
              <div className="grid grid-cols-2 gap-2">
                <span>Gebäudetyp:</span>
                <span className="text-foreground font-medium text-right">{getBuildingTypeLabel(wizardData)}</span>
                <span>Wärmeversorgung:</span>
                <span className="text-foreground font-medium text-right">{getHeatSupplyLabel(wizardData)}</span>
                <span>CO2-Ausstoß gesamt:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.totalEmissionsKg, 1)} kg</span>
                <span>CO2 pro m²/Jahr:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.emissionsPerSqmYear)} kg/m²</span>
                {result.isResidential && result.stufenmodellStep > 0 && (
                  <>
                    <span>Stufe (10-Stufen-Modell):</span>
                    <span className="text-foreground font-medium text-right">Stufe {result.stufenmodellStep}</span>
                  </>
                )}
                <span>Brennstoff:</span>
                <span className="text-foreground font-medium text-right">{result.fuelLabel}</span>
                {result.fuelResults.length > 1 && (
                  <>
                    <span>Gewichteter Emissionsfaktor:</span>
                    <span className="text-foreground font-medium text-right">{formatNumber(result.weightedEmissionFactor, 5)} kg CO2/kWh</span>
                  </>
                )}
                <span>Emissionsfaktor:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.emissionFactor, 4)} kg CO2/kWh</span>
                {!result.isCrossYear && (
                  <>
                    <span>CO2-Preis:</span>
                    <span className="text-foreground font-medium text-right">{formatCurrency(result.co2PricePerTon)}/Tonne</span>
                  </>
                )}
                <span>Abrechnungsjahr:</span>
                <span className="text-foreground font-medium text-right">{result.billingYear}</span>
                <span>Bezugsfläche:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.relevantArea, 0)} m²</span>
                <span>Gesamtenergie (Heizwert):</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.totalEnergyHeatingValueKwh, 0)} kWh</span>
                {result.restrictionApplied !== 'fall3' && result.isResidential && (
                  <>
                    <span>Basis-Aufteilung (vor Einschränkung):</span>
                    <span className="text-foreground font-medium text-right">{result.baseTenantPercent} % / {result.baseLandlordPercent} %</span>
                  </>
                )}
              </div>

              {/* Multi-fuel details */}
              {result.fuelResults.length > 1 && (
                <div className="mt-4 border-t border-border pt-3 space-y-2">
                  <p className="font-semibold text-foreground text-xs">Einzelne Brennstoffe:</p>
                  {result.fuelResults.map((fr, i) => (
                    <div key={i} className="grid grid-cols-2 gap-1 text-xs pl-2 border-l-2 border-accent/30 ml-1">
                      <span className="font-medium text-foreground">{fr.fuelLabel}</span>
                      <span className="text-right">{formatNumber(fr.co2Kg, 1)} kg CO2</span>
                      <span>Energie (Heizwert):</span>
                      <span className="text-right">{formatNumber(fr.energyHeatingValueKwh, 0)} kWh</span>
                      <span>CO2-Kosten brutto:</span>
                      <span className="text-right">{formatCurrency(fr.co2CostGross)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          {/* Pellets note */}
          {result.fuelResults.some(fr => fr.fuelType === 'pellets' || fr.fuelType === 'hackschnitzel') && (
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Hinweis Biomasse:</strong> Holzpellets und Holzhackschnitzel haben einen Emissionsfaktor, sind jedoch nicht BEHG-pflichtig. Die CO2-Kosten betragen daher 0,00 EUR.
            </div>
          )}

          {/* Legal note */}
          <div className="rounded-xl bg-muted/50 border border-border p-6 text-sm text-muted-foreground">
            <strong className="text-foreground">Hinweis:</strong> Diese Berechnung dient der unverbindlichen Information.
            Für rechtsverbindliche Auskünfte konsultieren Sie bitte einen Rechtsanwalt oder Steuerberater.
          </div>
        </div>
      </main>
    </div>
  );
}
