import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { FileText, RotateCcw, ArrowLeft, Info, AlertTriangle, Building2, Flame, CalendarDays, ChevronUp } from 'lucide-react';
import { generatePDF } from '@/lib/calculator/pdf';
import { getDocumentCase, getBuildingTypeLabel, fmt, getStufenmodellRangeText } from '@/lib/calculator/pdf-helpers';
import { PaymentDialog } from '@/components/PaymentDialog';
import { DetailedCalculationView } from '@/components/DetailedCalculationView';
import type { OutputType } from '@/lib/calculator/types';

function getAreaLabel(wizardData: { buildingType?: string; heatSupplyType?: string; userRole?: string }): string {
  if (wizardData.buildingType === 'nichtwohngebaeude') return 'Bezugsfläche';
  const isApartment = wizardData.heatSupplyType === 'etage' ||
    (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
  if (isApartment) return 'Wohnungswohnfläche';
  return 'Gebäudewohnfläche';
}

const FUEL_LABELS: Record<string, string> = {
  erdgas: 'Erdgas', heizoel: 'Heizöl', fernwaerme: 'Fernwärme', fluessiggas: 'Flüssiggas (LPG)',
  pellets: 'Holzpellets', hackschnitzel: 'Holzhackschnitzel', braunkohle: 'Braunkohlebriketts',
  erdgas_kwk: 'Erdgas (KWK)', fluessiggas_kwk: 'Flüssiggas (KWK)', heizoel_kwk: 'Heizöl (KWK)',
};

function getMixedVATInfo(data: { fuelType?: string; billingPeriodStart?: string; billingPeriodEnd?: string }, isCrossYear: boolean) {
  const gasFuels = new Set(['erdgas', 'erdgas_kwk', 'fernwaerme']);
  if (!data.fuelType || !gasFuels.has(data.fuelType) || isCrossYear) return null;
  const start = data.billingPeriodStart ? new Date(data.billingPeriodStart) : null;
  const end = data.billingPeriodEnd ? new Date(data.billingPeriodEnd) : null;
  const boundary = new Date('2024-04-01');
  if (!start || !end || start >= boundary || end < boundary) return null;
  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  const reducedDays = Math.round((boundary.getTime() - start.getTime()) / dayMs);
  return { reducedDays, standardDays: totalDays - reducedDays };
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, wizardData, reset } = useCalculator();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingOutputType, setPendingOutputType] = useState<OutputType>('calculation');

  // V – Fernwärme-Sonderfall: Erstanschluss ab 01.01.2023 → CO2KostAufG nicht anwendbar
  const isExcludedDistrictHeating =
    wizardData.heatSupplyType === 'fernwaerme' &&
    !!wizardData.districtHeatingConnectedAfter2023;

  if (isExcludedDistrictHeating) {
    const isTenant = wizardData.userRole === 'mieter';
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background sticky top-0 z-50">
          <div className="container-narrow flex h-14 items-center px-4">
            <span className="text-sm font-semibold text-foreground">Hinweis zur Anwendbarkeit</span>
          </div>
        </header>
        <main className="px-4 py-8 md:py-10">
          <div className="container-narrow space-y-5 animate-fade-in">
            <div className="rounded-lg border-2 border-border bg-muted/30 p-6 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Keine Anwendbarkeit des CO2KostAufG</h2>
                  <p className="text-sm text-foreground leading-relaxed">
                    Für diesen Fernwärmefall wird keine CO₂-Kostenaufteilung nach dem CO2KostAufG berechnet,
                    da ein erstmaliger Anschluss an das Wärmenetz ab dem 1. Januar 2023 vorliegt.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isTenant
                      ? 'Ein Erstattungsanspruch nach dem CO2KostAufG wird für diesen Fall nicht berechnet.'
                      : 'Eine Aufteilung der CO₂-Kosten nach dem CO2KostAufG wird für diesen Fall nicht berechnet.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" onClick={() => navigate('/rechner')}>
                <ArrowLeft className="h-4 w-4" />Zurück zur Eingabe
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="lg" onClick={() => { reset(); navigate('/rechner'); }}>
                <RotateCcw className="h-4 w-4" />Neue Berechnung
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Keine Berechnung vorhanden.</p>
          <Button onClick={() => navigate('/rechner')}>Zur Berechnung</Button>
        </div>
      </div>
    );
  }

  const handleNewCalculation = () => { reset(); navigate('/rechner'); };

  const handleRequestDocument = (outputType: OutputType) => {
    setPendingOutputType(outputType);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = () => {
    generatePDF(wizardData, result, pendingOutputType);
  };

  const formatCurrency = (n: number) => fmt.currency(n);
  const formatNumber = (n: number, decimals = 2) => fmt.number(n, decimals);

  const docCase = getDocumentCase(wizardData);
  const isTenantClaim = (docCase === 'C' || docCase === 'D') && result.landlordShare > 0;
  const isTenant = wizardData.userRole === 'mieter';
  const isLandlord = wizardData.userRole === 'vermieter';
  const mixedVAT = getMixedVATInfo(wizardData, result.isCrossYear);

  const allocationExplanation = (() => {
    if (result.isResidential && result.stufenmodellStep > 0) {
      const rangeText = getStufenmodellRangeText(result.stufenmodellStep);
      if (result.annualizationFactor && result.emissionsPerSqmAnnualized) {
        return `Stufe ${result.stufenmodellStep} – Hochgerechneter Jahreswert: ${formatNumber(result.emissionsPerSqmAnnualized)} kg CO2/m²/a (${rangeText})`;
      }
      return `Stufe ${result.stufenmodellStep} – ${rangeText}`;
    }
    if (!result.isResidential) {
      return result.restrictionApplied === 'fall1und2'
        ? 'Beide öffentlich-rechtlichen Einschränkungen liegen vor – der Mieter trägt die CO2-Kosten vollständig.'
        : 'Hälftige Aufteilung (50/50) gemäß § 8 CO2KostAufG für Nichtwohngebäude';
    }
    return '';
  })();

  // Fuel display
  const fuelDisplay = result.fuelResults.length > 1
    ? result.fuelResults.map(fr => FUEL_LABELS[fr.fuelType] || fr.fuelLabel).join(', ')
    : result.fuelLabel;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container-narrow flex h-14 items-center px-4">
          <span className="text-sm font-semibold text-foreground">Ergebnis der CO2-Kostenaufteilung</span>
        </div>
      </header>

      <main className="px-4 py-8 md:py-10">
        <div className="container-narrow space-y-4 animate-fade-in">
          {/* Context chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              <Building2 className="h-3 w-3" />{getBuildingTypeLabel(wizardData)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              <Flame className="h-3 w-3" />{fuelDisplay}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
              {fmt.date(wizardData.billingPeriodStart)} – {fmt.date(wizardData.billingPeriodEnd)}
            </span>
            {result.isCrossYear && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
                <CalendarDays className="h-3 w-3" />Jahresübergreifend
              </span>
            )}
          </div>

          {/* ═══════════ Compact result summary ═══════════ */}
          <section className="rounded-lg border-2 border-primary bg-primary/5">
            <header className="border-b border-primary/20 px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Ergebnis</h2>
            </header>
            <div className="px-5 py-5 space-y-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Gesamte CO2-Kosten (brutto)</dt>
                  <dd className="text-foreground font-semibold text-right tabular-nums">{formatCurrency(result.totalCO2Cost)}</dd>
                </div>
                {allocationExplanation && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">Einstufung</dt>
                    <dd className="text-foreground font-medium text-right">{allocationExplanation}</dd>
                  </div>
                )}
              </dl>

              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="rounded-md border border-primary/30 bg-background p-4">
                  <div className="text-xs text-muted-foreground mb-1">Anteil Vermieter</div>
                  <div className="text-2xl font-bold text-primary tabular-nums">{formatCurrency(result.landlordShare)}</div>
                  <div className="text-xs text-primary font-medium mt-1 tabular-nums">{result.landlordPercent}&nbsp;%</div>
                </div>
                <div className="rounded-md border border-accent/30 bg-background p-4">
                  <div className="text-xs text-muted-foreground mb-1">Anteil Mieter</div>
                  <div className="text-2xl font-bold text-accent tabular-nums">{formatCurrency(result.tenantShare)}</div>
                  <div className="text-xs text-accent font-medium mt-1 tabular-nums">{result.tenantPercent}&nbsp;%</div>
                </div>
              </div>

              {isTenantClaim && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground leading-relaxed">
                    <span className="font-semibold">Möglicher Erstattungsanspruch gegenüber dem Vermieter:&nbsp;</span>
                    <span className="text-primary tabular-nums font-semibold">{formatCurrency(result.landlordShare)}</span>
                  </p>
                </div>
              )}

              {result.notes.length > 0 && (
                <ul className="border-t border-primary/20 pt-3 space-y-1">
                  {result.notes.map((note, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Document section */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Dokument erstellen
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Die Berechnung ist abgeschlossen. Optional können Sie ein druckfertiges PDF-Dokument erstellen.
              </p>
            </div>

            {isTenantClaim ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Erstattungsschreiben mit Berechnungsgrundlage</p>
                    <p className="text-xs text-muted-foreground">Enthält Erstattungsschreiben und Berechnungsgrundlage als PDF.</p>
                    <p className="text-xs text-muted-foreground">Inhalt: Schreiben · Abrechnungszeitraum · Brennstoff · CO2-Ausstoß · Kostenaufteilung · Netto/Brutto</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">2,00 €</span>
                </div>
                <Button variant="cta" size="default" className="w-full" onClick={() => handleRequestDocument('letter_tenant_reimbursement')}>
                  <FileText className="h-4 w-4" />Erstattungsschreiben erstellen
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Berechnung als PDF</p>
                    <p className="text-xs text-muted-foreground">Erstellt ein druckbares PDF mit Berechnungsgrundlage und Ergebnissen.</p>
                    <p className="text-xs text-muted-foreground">Inhalt: Abrechnungszeitraum · Brennstoff · CO2-Ausstoß · Kostenaufteilung · Netto/Brutto</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">2,00 €</span>
                </div>
                <Button variant="cta" size="default" className="w-full" onClick={() => handleRequestDocument('calculation')}>
                  <FileText className="h-4 w-4" />Berechnung als PDF erstellen
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="lg" onClick={() => navigate('/rechner')}>
              <ArrowLeft className="h-4 w-4" />Zurück
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="lg" onClick={handleNewCalculation}>
              <RotateCcw className="h-4 w-4" />Neue Berechnung
            </Button>
          </div>


          {/* Technical details */}
          <details className="rounded-lg border border-border bg-card">
            <summary className="px-5 py-3 cursor-pointer text-xs font-semibold text-card-foreground hover:bg-muted/50 rounded-lg transition-colors">
              Technische Details
            </summary>
            <div className="px-5 pb-5 pt-2 space-y-2 text-muted-foreground text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-1.5">
                <span>Gebäudetyp:</span>
                <span className="text-foreground font-medium text-right">{getBuildingTypeLabel(wizardData)}</span>
                <span>Wärmeversorgung:</span>
                <span className="text-foreground font-medium text-right">{getHeatSupplyLabel(wizardData)}</span>
                <span>Brennstoff:</span>
                <span className="text-foreground font-medium text-right">{fuelDisplay}</span>
                <span>CO2-Ausstoß gesamt:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.totalEmissionsKg, 1)} kg</span>
                <span>CO2 pro m² (Abrechnungszeitraum):</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.emissionsPerSqmYear)} kg/m²</span>
                {result.annualizationFactor && result.emissionsPerSqmAnnualized && (
                  <>
                    <span>CO2 pro m²/Jahr (hochgerechnet, nur für Einstufung):</span>
                    <span className="text-foreground font-medium text-right">{formatNumber(result.emissionsPerSqmAnnualized)} kg/m²/a</span>
                  </>
                )}
                {result.isResidential && result.stufenmodellStep > 0 && (
                  <>
                    <span>Stufe (10-Stufen-Modell):</span>
                    <span className="text-foreground font-medium text-right">
                      Stufe {result.stufenmodellStep} ({getStufenmodellRangeText(result.stufenmodellStep)})
                    </span>
                  </>
                )}
                <span>Emissionsfaktor:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.emissionFactor, 4)} kg CO2/kWh</span>
                {result.fuelResults.length > 1 && (
                  <>
                    <span>Gewichteter Emissionsfaktor:</span>
                    <span className="text-foreground font-medium text-right">{formatNumber(result.weightedEmissionFactor, 5)} kg CO2/kWh</span>
                  </>
                )}
                {!result.isCrossYear && (
                  <>
                    <span>CO2-Preis:</span>
                    <span className="text-foreground font-medium text-right">{formatCurrency(result.co2PricePerTon)}/t</span>
                  </>
                )}
                <span>Abrechnungsjahr:</span>
                <span className="text-foreground font-medium text-right">{result.billingYear}</span>
                <span>{getAreaLabel(wizardData)}:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.relevantArea, 0)} m²</span>
                <span>Gesamtenergie (Heizwert):</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.totalEnergyHeatingValueKwh, 2)} kWh</span>
                <span>CO2-Kosten netto:</span>
                <span className="text-foreground font-medium text-right">{formatCurrency(result.totalCO2CostNet)}</span>
                <span>USt.-Satz:</span>
                <span className="text-foreground font-medium text-right">
                  {mixedVAT ? `7 % (${mixedVAT.reducedDays} T.) / 19 % (${mixedVAT.standardDays} T.)` : `${result.vatPercent} %`}
                </span>
                <span>CO2-Kosten brutto:</span>
                <span className="text-foreground font-medium text-right">{formatCurrency(result.totalCO2Cost)}</span>
                {result.restrictionApplied !== 'fall3' && result.isResidential && (
                  <>
                    <span>Basis-Aufteilung (vor Einschränkung):</span>
                    <span className="text-foreground font-medium text-right">{result.baseTenantPercent} % / {result.baseLandlordPercent} %</span>
                  </>
                )}
              </div>

              {result.fuelResults.length > 1 && (
                <div className="mt-3 border-t border-border pt-2 space-y-1.5">
                  <p className="font-semibold text-foreground">Einzelne Brennstoffe:</p>
                  {result.fuelResults.map((fr, i) => (
                    <div key={i} className="grid grid-cols-2 gap-1 pl-2 border-l-2 border-accent/30 ml-1">
                      <span className="font-medium text-foreground">{fr.fuelLabel}</span>
                      <span className="text-right">{formatNumber(fr.co2Kg, 1)} kg CO2</span>
                      <span>Energie (Heizwert):</span>
                      <span className="text-right">{formatNumber(fr.energyHeatingValueKwh, 2)} kWh</span>
                      <span>CO2-Kosten netto:</span>
                      <span className="text-right">{formatCurrency(fr.co2CostNet)}</span>
                      <span>CO2-Kosten brutto:</span>
                      <span className="text-right">{formatCurrency(fr.co2CostGross)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          {/* Legal note */}
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">Hinweis:</strong> Diese Berechnung dient der unverbindlichen Information.
            Für rechtsverbindliche Auskünfte konsultieren Sie bitte einen Rechtsanwalt oder Steuerberater.
          </div>
        </div>
      </main>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        documentLabel={
          pendingOutputType === 'letter_tenant_reimbursement'
            ? 'Erstattungsschreiben erstellen'
            : 'Berechnung als PDF erstellen'
        }
        documentDescription={
          pendingOutputType === 'letter_tenant_reimbursement'
            ? 'Erstellt ein druckfertiges Schreiben auf Grundlage Ihrer Berechnung. Der Betrag wird einmalig berechnet.'
            : 'Erstellt ein druckbares PDF mit vollständiger Berechnungsgrundlage und Ergebnissen. Der Betrag wird einmalig berechnet.'
        }
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}