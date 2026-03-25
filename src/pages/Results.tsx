import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { FileText, RotateCcw, ArrowRight, Info } from 'lucide-react';
import { generatePDF } from '@/lib/calculator/pdf';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { result, wizardData, reset } = useCalculator();

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Keine Berechnung vorhanden.</p>
          <Button onClick={() => navigate('/rechner')}>
            Zur Berechnung
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const handleNewCalculation = () => {
    reset();
    navigate('/rechner');
  };

  const handleGeneratePDF = () => {
    generatePDF(wizardData, result);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  const formatNumber = (n: number, decimals = 2) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

  const allocationExplanation = result.isResidential
    ? result.stufenmodellStep > 0
      ? `Stufe ${result.stufenmodellStep} des 10-Stufen-Modells nach §5 CO2KostAufG`
      : ''
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
          {/* Summary sentence */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
            <p className="text-lg font-medium text-foreground leading-relaxed">
              Nach Ihren Angaben entfallen <strong className="text-primary">{result.landlordPercent}\u00A0% der CO2-Kosten auf den Vermieter</strong> und <strong className="text-accent">{result.tenantPercent}\u00A0% auf den Mieter</strong>.
            </p>
            {allocationExplanation && (
              <p className="text-sm text-muted-foreground mt-2">{allocationExplanation}</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Gesamte CO2-Kosten</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(result.totalCO2Cost)}</div>
              {result.usedDirectCost && (
                <div className="text-xs text-muted-foreground mt-1">(direkt eingegeben)</div>
              )}
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Anteil Vermieter</div>
              <div className="text-3xl font-bold text-primary">{formatCurrency(result.landlordShare)}</div>
              <div className="text-sm text-primary font-medium mt-1">{result.landlordPercent}%</div>
            </div>
            <div className="rounded-xl border-2 border-accent bg-accent/5 p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Anteil Mieter</div>
              <div className="text-3xl font-bold text-accent">{formatCurrency(result.tenantShare)}</div>
              <div className="text-sm text-accent font-medium mt-1">{result.tenantPercent}%</div>
            </div>
          </div>

          {/* Restriction note */}
          {result.restrictionNote && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-5 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{result.restrictionNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="cta" size="lg" className="flex-1" onClick={handleGeneratePDF}>
              <FileText className="h-5 w-5" />
              PDF-Schreiben erstellen
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleNewCalculation}>
              <RotateCcw className="h-5 w-5" />
              Neue Berechnung
            </Button>
          </div>

          {/* Technical details (collapsible feel) */}
          <details className="rounded-xl border border-border bg-card shadow-sm">
            <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-card-foreground hover:bg-muted/50 rounded-xl transition-colors">
              Technische Details anzeigen
            </summary>
            <div className="px-6 pb-6 pt-2 space-y-3 text-muted-foreground text-sm leading-relaxed">
              <div className="grid grid-cols-2 gap-2">
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
                <span>Emissionsfaktor:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.emissionFactor, 4)} kg CO2/kWh</span>
                <span>CO2-Preis:</span>
                <span className="text-foreground font-medium text-right">{formatCurrency(result.co2PricePerTon)}/Tonne</span>
                <span>Abrechnungsjahr:</span>
                <span className="text-foreground font-medium text-right">{result.billingYear}</span>
                <span>Bezugsfläche:</span>
                <span className="text-foreground font-medium text-right">{formatNumber(result.relevantArea, 0)} m²</span>
                {result.restrictionApplied !== 'fall3' && result.isResidential && (
                  <>
                    <span>Basis-Aufteilung (vor Einschränkung):</span>
                    <span className="text-foreground font-medium text-right">{result.baseTenantPercent}% / {result.baseLandlordPercent}%</span>
                  </>
                )}
              </div>
            </div>
          </details>

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
