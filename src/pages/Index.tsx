import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Calculator, FileText, CheckCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left font-medium text-foreground hover:text-primary transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-5 text-muted-foreground leading-relaxed animate-fade-in">
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
        <div className="container-wide flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">CO2-Rechner</span>
          </div>
          <Button variant="cta" size="default" onClick={() => navigate('/rechner')}>
            Jetzt berechnen
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wide text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              Gemäß CO2KostAufG
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-tight">
              CO2-Kosten fair aufteilen
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Berechnen Sie schnell und rechtssicher, wie die CO2-Kosten zwischen Mieter und Vermieter
              aufgeteilt werden – und erstellen Sie direkt ein fertiges Schreiben.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="cta" size="xl" onClick={() => navigate('/rechner')}>
                Jetzt berechnen
              </Button>
              <Button variant="ctaOutline" size="xl" onClick={() => {
                document.getElementById('vorteile')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Mehr erfahren
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="vorteile" className="section-padding bg-secondary/50">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-center mb-12">So funktioniert es</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Calculator,
                title: 'Schnelle Berechnung',
                desc: 'In wenigen Schritten berechnen Sie die korrekte Aufteilung der CO2-Kosten nach dem Stufenmodell des CO2KostAufG.',
              },
              {
                icon: Shield,
                title: 'Rechtssicher',
                desc: 'Die Berechnung basiert auf den gesetzlichen Vorgaben des Kohlendioxidkostenaufteilungsgesetzes und aktuellen CO2-Preisen.',
              },
              {
                icon: FileText,
                title: 'Fertiges Schreiben',
                desc: 'Erstellen Sie direkt ein professionelles PDF-Schreiben mit allen Berechnungsergebnissen zum Versand.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-bold">Vertrauenswürdig & transparent</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Unser Rechner basiert auf dem 10-Stufen-Modell des CO2KostAufG für Wohngebäude
              und berücksichtigt die gesetzlich festgelegten CO2-Preise. Alle Berechnungen
              sind nachvollziehbar und transparent dargestellt.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              {[
                { value: '10', label: 'Stufen-Modell' },
                { value: '§7', label: 'CO2KostAufG' },
                { value: '100%', label: 'Kostenlos' },
                { value: 'PDF', label: 'Schreiben' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary/50">
        <div className="container-narrow px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Häufige Fragen</h2>
          <div>
            <FAQItem
              question="Was ist das CO2KostAufG?"
              answer="Das Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) regelt seit dem 1. Januar 2023 die Aufteilung der CO2-Kosten zwischen Vermieter und Mieter. Ziel ist es, Anreize für klimafreundliches Verhalten und energetische Sanierung zu schaffen."
            />
            <FAQItem
              question="Wie funktioniert das 10-Stufen-Modell?"
              answer="Bei Wohngebäuden werden die CO2-Emissionen pro Quadratmeter und Jahr berechnet. Je höher die Emissionen, desto größer ist der Anteil des Vermieters an den CO2-Kosten – von 0% bei unter 12 kg CO2/m²/a bis zu 95% bei über 52 kg CO2/m²/a."
            />
            <FAQItem
              question="Gilt das Gesetz auch für Nichtwohngebäude?"
              answer="Ja, bei Nichtwohngebäuden werden die CO2-Kosten hälftig (50/50) zwischen Vermieter und Mieter aufgeteilt. Das Stufenmodell kommt hier nicht zur Anwendung."
            />
            <FAQItem
              question="Welche Brennstoffe werden unterstützt?"
              answer="Aktuell unterstützt der Rechner Erdgas, Heizöl und Fernwärme. Bei Fernwärme können Sie den individuellen Emissionsfaktor Ihres Versorgers eingeben."
            />
            <FAQItem
              question="Ist die Nutzung kostenlos?"
              answer="Ja, die Nutzung des Rechners und die Erstellung des PDF-Schreibens sind vollständig kostenlos."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section-padding bg-background">
        <div className="container-narrow px-4">
          <div className="rounded-xl border border-border bg-muted/50 p-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Rechtlicher Hinweis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dieser Rechner dient ausschließlich der unverbindlichen Information und ersetzt keine
                  rechtliche oder steuerliche Beratung. Die Ergebnisse basieren auf den von Ihnen
                  eingegebenen Daten und den gesetzlichen Vorgaben des CO2KostAufG. Für die Richtigkeit
                  und Vollständigkeit der Berechnung wird keine Gewähr übernommen. Bitte konsultieren
                  Sie bei Bedarf einen Rechtsanwalt oder Steuerberater.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container-wide px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CO2-Kostenaufteilungsrechner. Alle Angaben ohne Gewähr.</p>
        </div>
      </footer>
    </div>
  );
}
