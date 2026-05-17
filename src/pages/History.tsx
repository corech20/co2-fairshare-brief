import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Trash2, Building2, Flame, Calculator as CalculatorIcon } from 'lucide-react';
import { listHistory, deleteHistoryEntry, clearHistory, type HistoryEntry } from '@/lib/calculator/historyStore';
import { fmt, getBuildingTypeLabel } from '@/lib/calculator/pdf-helpers';
import { useCalculator } from '@/context/CalculatorContext';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';

const FUEL_LABELS: Record<string, string> = {
  erdgas: 'Erdgas', heizoel: 'Heizöl', fernwaerme: 'Fernwärme', fluessiggas: 'Flüssiggas',
  pellets: 'Holzpellets', hackschnitzel: 'Holzhackschnitzel', braunkohle: 'Braunkohlebriketts',
  erdgas_kwk: 'Erdgas (KWK)', fluessiggas_kwk: 'Flüssiggas (KWK)', heizoel_kwk: 'Heizöl (KWK)',
};

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fuelDisplay(entry: HistoryEntry): string {
  const fr = entry.result.fuelResults;
  if (fr && fr.length > 0) {
    return fr.map(f => FUEL_LABELS[f.fuelType] ?? f.fuelLabel).join(', ');
  }
  return entry.wizardData.fuelType ? (FUEL_LABELS[entry.wizardData.fuelType] ?? entry.wizardData.fuelType) : '–';
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { loadFromHistory } = useCalculator();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(listHistory());
  }, []);

  const handleOpen = (calcId: string) => {
    if (loadFromHistory(calcId)) {
      navigate(`/ergebnis?id=${encodeURIComponent(calcId)}`);
    }
  };

  const handleDelete = (calcId: string) => {
    deleteHistoryEntry(calcId);
    setEntries(listHistory());
  };

  const handleClearAll = () => {
    if (window.confirm('Alle gespeicherten Berechnungen löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearHistory();
      setEntries([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Berechnungsverlauf — CO2-Rechner"
        description="Lokal gespeicherte CO2-Kostenaufteilungs-Berechnungen einsehen, erneut öffnen oder löschen."
        path="/verlauf"
      />
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container-narrow flex h-14 items-center px-4 gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Start</span>
          </Button>
          <span className="text-sm font-semibold text-foreground">Verlauf der Berechnungen</span>
          <div className="ml-auto" />
          {entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Alle löschen</span>
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-8 md:py-10">
        <div className="container-narrow space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gespeicherte Berechnungen</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Berechnungen werden lokal in diesem Browser gespeichert. Beim Löschen des Browser-Speichers
              gehen sie verloren. Es werden bis zu 100 Einträge aufbewahrt.
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-10 text-center space-y-4">
              <CalculatorIcon className="h-10 w-10 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Noch keine Berechnungen vorhanden</p>
                <p className="text-xs text-muted-foreground">
                  Sobald Sie eine Berechnung abschließen, erscheint sie hier mit ihrer Berechnungs-ID.
                </p>
              </div>
              <Button variant="cta" onClick={() => navigate('/rechner')}>
                Neue Berechnung starten
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map(entry => (
                <li
                  key={entry.calcId}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                          {entry.calcId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatSavedAt(entry.savedAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          <Building2 className="h-3 w-3" />{getBuildingTypeLabel(entry.wizardData)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          <Flame className="h-3 w-3" />{fuelDisplay(entry)}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          {fmt.date(entry.wizardData.billingPeriodStart)} – {fmt.date(entry.wizardData.billingPeriodEnd)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Gesamt brutto:</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {fmt.currency(entry.result.totalCO2Cost)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          Vermieter {fmt.currency(entry.result.landlordShare)} · Mieter {fmt.currency(entry.result.tenantShare)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Button variant="cta" size="sm" onClick={() => handleOpen(entry.calcId)}>
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Öffnen</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.calcId)}
                        aria-label="Berechnung löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}