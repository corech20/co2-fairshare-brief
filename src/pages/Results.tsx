import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { FileText, RotateCcw, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container-narrow flex h-16 items-center px-4">
          <span className="font-semibold text-foreground">Ergebnis Ihrer Berechnung</span>
        </div>
      </header>

      <main className="section-padding">
        <div className="container-narrow px-4 space-y-8 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
              <div className="text-sm text-muted-foreground mb-1">Gesamte CO2-Kosten</div>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(result.totalCO2Cost)}</div>
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

          {/* Explanation */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground">Erläuterung</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Ihr Gebäude hat einen CO2-Ausstoß von <strong className="text-foreground">{formatNumber(result.emissionsPerSqmYear)} kg CO2/m²</strong> pro Jahr.
                {result.stufenmodellStep > 0 ? (
                  <> Das entspricht <strong className="text-foreground">Stufe {result.stufenmodellStep}</strong> des 10-Stufen-Modells nach §5 CO2KostAufG.</>
                ) : (
                  <> Bei Nichtwohngebäuden gilt eine hälftige Aufteilung (50/50) nach §8 CO2KostAufG.</>
                )}
              </p>
              <p>
                Brennstoff: <strong className="text-foreground">{result.fuelLabel}</strong> · 
                Emissionsfaktor: <strong className="text-foreground">{formatNumber(result.emissionFactor, 3)} kg CO2/kWh</strong> · 
                CO2-Preis: <strong className="text-foreground">{formatCurrency(result.co2PricePerTon)}/Tonne</strong>
              </p>
              <p>
                Gesamtemissionen: <strong className="text-foreground">{formatNumber(result.totalEmissionsKg, 1)} kg CO2</strong> ({formatNumber(result.totalEmissionsKg / 1000, 2)} Tonnen)
              </p>
            </div>
          </div>

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
