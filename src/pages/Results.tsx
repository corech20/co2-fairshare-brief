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
  const [detailViewOpen, setDetailViewOpen] = useState(false);

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
    setDetailViewOpen(true);
    // Smooth scroll happens after render via setTimeout
    setTimeout(() => {
      document.getElementById('detailed-calculation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleBuyPdf = () => {
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

          {/* Document section — reveals the detailed document view on click */}
          {!detailViewOpen && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Dokument erstellen</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Die Berechnung ist abgeschlossen. Zur Erstellung des druckfertigen PDF-Dokuments wird zunächst die vollständige
                  Berechnungsgrundlage angezeigt.
                </p>
              </div>

              {isTenantClaim ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Erstattungsschreiben mit Berechnungsgrundlage</p>
                    <p className="text-xs text-muted-foreground">Inhalt: Schreiben · Abrechnungszeitraum · Brennstoff · CO2-Ausstoß · Kostenaufteilung · Netto/Brutto</p>
                  </div>
                  <Button variant="cta" size="default" className="w-full" onClick={() => handleRequestDocument('letter_tenant_reimbursement')}>
                    <FileText className="h-4 w-4" />Erstattungsschreiben erstellen
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Berechnungsblatt</p>
                    <p className="text-xs text-muted-foreground">Inhalt: Abrechnungszeitraum · Brennstoff · CO2-Ausstoß · Kostenaufteilung · Netto/Brutto</p>
                  </div>
                  <Button variant="cta" size="default" className="w-full" onClick={() => handleRequestDocument('calculation')}>
                    <FileText className="h-4 w-4" />Berechnungsblatt erstellen
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ═══ Detailed document view (sections 1–4) — only after explicit user request ═══ */}
          {detailViewOpen && (
            <div id="detailed-calculation" className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Vollständige Berechnungsgrundlage</h3>
                <Button variant="ghost" size="sm" onClick={() => setDetailViewOpen(false)}>
                  <ChevronUp className="h-4 w-4" />Einklappen
                </Button>
              </div>

              <DetailedCalculationView data={wizardData} result={result} />

              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      {pendingOutputType === 'letter_tenant_reimbursement'
                        ? 'Erstattungsschreiben als PDF erstellen'
                        : 'Berechnungsblatt als PDF erstellen'}
                    </p>
                    <p className="text-xs text-muted-foreground">Druckfertiges PDF · einmaliger Betrag</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">2,00 €</span>
                </div>
                <Button variant="cta" size="default" className="w-full" onClick={handleBuyPdf}>
                  <FileText className="h-4 w-4" />
                  {pendingOutputType === 'letter_tenant_reimbursement'
                    ? 'Kostenpflichtig erstellen'
                    : 'Kostenpflichtig erstellen'}
                </Button>
              </div>
            </div>
          )}

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