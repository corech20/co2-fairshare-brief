import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Scale, BarChart3, FileText, Building2, Flame, ListChecks, FileDown } from 'lucide-react';
import { useState } from 'react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left font-medium text-foreground hover:text-primary transition-colors text-sm"
      >
        <span>{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-foreground tracking-tight">CO2-Kostenaufteilung</span>
          </div>
          <Button variant="default" size="sm" onClick={() => navigate('/rechner')}>
            Berechnung starten
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <div className="space-y-5">
            <div className="inline-block rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground tracking-wide uppercase">
              Gemäß CO2KostAufG
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-tight">
              CO2-Kosten zwischen Mieter und Vermieter aufteilen
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              Berechnen Sie die gesetzliche Aufteilung der CO2-Kosten nach dem CO2KostAufG –
              nachvollziehbar, strukturiert und als PDF dokumentiert.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="cta" size="lg" onClick={() => navigate('/rechner')}>
                Berechnung starten
              </Button>
              <Button variant="ctaOutline" size="lg" onClick={() => {
                document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Mehr erfahren
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="info" className="px-4 py-12 md:py-16 bg-secondary/40">
        <div className="container-wide">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Schnelle Berechnung',
                desc: 'In wenigen Schritten berechnen Sie die gesetzliche Aufteilung der CO2-Kosten nach dem 10-Stufen-Modell.',
              },
              {
                icon: Scale,
                title: 'Nachvollziehbar',
                desc: 'Die Berechnung orientiert sich an den Vorgaben des CO2KostAufG und den gesetzlich festgelegten CO2-Preisen.',
              },
              {
                icon: FileText,
                title: 'PDF-Dokumentation',
                desc: 'Erhalten Sie ein strukturiertes Berechnungsblatt als PDF – zur Dokumentation, Weitergabe oder als Anlage zur Abrechnung.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-card-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality indicators */}
      <section className="px-4 py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: 'Wohn- & Nichtwohngebäude' },
              { icon: Flame, label: 'Erdgas, Heizöl, Fernwärme u.\u00A0a.' },
              { icon: ListChecks, label: 'Schritt für Schritt' },
              { icon: FileDown, label: 'PDF-Ergebnis' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-2">
                <item.icon className="h-5 w-5 text-primary mx-auto" />
                <div className="text-sm font-medium text-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 md:py-16 bg-secondary/40">
        <div className="container-narrow">
          <h2 className="text-xl font-bold mb-8">Häufige Fragen</h2>
          <div>
            <FAQItem
              question="Was ist das CO2KostAufG?"
              answer="Das Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) regelt seit dem 1. Januar 2023 die Aufteilung der CO2-Kosten zwischen Vermieter und Mieter. Ziel ist es, Anreize für klimafreundliches Verhalten und energetische Sanierung zu schaffen."
            />
            <FAQItem
              question="Wie funktioniert das 10-Stufen-Modell?"
              answer="Bei Wohngebäuden werden die CO2-Emissionen pro Quadratmeter und Jahr berechnet. Je höher die Emissionen, desto größer ist der Anteil des Vermieters an den CO2-Kosten – von 0 % bei unter 12 kg CO2/m²/a bis zu 95 % bei über 52 kg CO2/m²/a."
            />
            <FAQItem
              question="Welche Unterlagen brauche ich?"
              answer="Sie benötigen Ihre Heizkosten- oder Brennstoffabrechnung mit Angaben zum Abrechnungszeitraum und der Verbrauchsmenge (z. B. kWh, Liter). Außerdem die Wohn- bzw. Gebäudefläche. Bei Fernwärme ist zusätzlich der Emissionsfaktor Ihres Versorgers erforderlich."
            />
            <FAQItem
              question="Gilt das auch bei Fernwärme?"
              answer="Ja. Bei Fernwärme benötigen Sie den individuellen Emissionsfaktor Ihres Wärmeversorgers, der in der Regel in der Abrechnung ausgewiesen ist."
            />
            <FAQItem
              question="Wie wird bei Nichtwohngebäuden gerechnet?"
              answer="Bei Nichtwohngebäuden gilt im Regelfall eine hälftige Aufteilung (50/50) der CO2-Kosten. Liegen bestimmte öffentlich-rechtliche Einschränkungen vor, kann die Aufteilung abweichen."
            />
            <FAQItem
              question="Was ist, wenn der Abrechnungszeitraum über zwei Jahre läuft?"
              answer="Der Rechner erkennt jahresübergreifende Zeiträume automatisch. Sie geben die Verbrauchsmengen getrennt nach Kalenderjahren ein, damit die jeweils geltenden CO2-Preise korrekt berücksichtigt werden."
            />
            <FAQItem
              question="Kann ich das Ergebnis direkt als Schreiben verwenden?"
              answer="Sie können ein PDF-Dokument mit den Berechnungsergebnissen erstellen, das als Grundlage für die Kommunikation mit Ihrem Vermieter oder Mieter dienen kann. Das Dokument ersetzt jedoch keine rechtliche oder steuerliche Beratung."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 py-10 bg-background">
        <div className="container-narrow">
          <div className="rounded-lg border border-border bg-muted/50 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Rechtlicher Hinweis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dieser Rechner dient ausschließlich der unverbindlichen Information und ersetzt keine
              rechtliche oder steuerliche Beratung. Die Ergebnisse basieren auf den von Ihnen
              eingegebenen Daten und den gesetzlichen Vorgaben des CO2KostAufG. Für die Richtigkeit
              und Vollständigkeit der Berechnung wird keine Gewähr übernommen.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6">
        <div className="container-wide px-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CO2-Kostenaufteilungsrechner · Alle Angaben ohne Gewähr</p>
        </div>
      </footer>
    </div>
  );
}
