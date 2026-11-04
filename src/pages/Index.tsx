import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Scale, BarChart3, FileText, Building2, Flame, ListChecks, FileDown, Users } from 'lucide-react';
import { useState } from 'react';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';

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

  const faqs = [
    { q: 'Was ist das CO2KostAufG?', a: 'Das Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG) regelt seit dem 1. Januar 2023 die Aufteilung der CO2-Kosten zwischen Vermieter und Mieter. Ziel ist es, Anreize für klimafreundliches Verhalten und energetische Sanierung zu schaffen.' },
    { q: 'Wie funktioniert das 10-Stufen-Modell?', a: 'Bei Wohngebäuden werden die CO2-Emissionen pro Quadratmeter und Jahr berechnet. Je höher die Emissionen, desto größer ist der Anteil des Vermieters an den CO2-Kosten – von 0 % bei unter 12 kg CO2/m²/a bis zu 95 % bei über 52 kg CO2/m²/a.' },
    { q: 'Welche Unterlagen brauche ich?', a: 'Sie benötigen Ihre Wärmeliefer- oder Brennstoffabrechnung mit Angaben zum Abrechnungszeitraum, den CO2-Emissionen (in kg) und den CO2-Kosten (in Euro). Außerdem die Wohn- bzw. Gebäudefläche.' },
    { q: 'Gilt das auch bei Fernwärme?', a: 'Ja. Bei Fernwärme benötigen Sie die CO2-Emissionen der Wärmelieferung sowie die in der Rechnung ausgewiesenen CO2-Kosten des Wärmeversorgers.' },
    { q: 'Wie wird bei Nichtwohngebäuden gerechnet?', a: 'Bei Nichtwohngebäuden gilt im Regelfall eine hälftige Aufteilung (50/50) der CO2-Kosten. Liegen bestimmte öffentlich-rechtliche Einschränkungen vor, kann die Aufteilung abweichen.' },
  ];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="CO2-Kostenberechnung – Rechner für Mieter und Vermieter"
        description="CO2-Kosten nach CO2KostAufG berechnen: Mieter- und Vermieteranteil für Erdgas, Heizöl und Fernwärme ermitteln. PDF-Nachweis und Erstattungsschreiben erstellen."
        path="/"
        jsonLd={faqJsonLd}
      />
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary" />
           <span className="text-base font-semibold text-foreground tracking-tight">CO2-Kostenaufteilung</span>
          </div>
          <button
            onClick={() => navigate('/verlauf')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Verlauf
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <div className="space-y-5">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-tight">
              CO2-Kostenaufteilung berechnen und dokumentieren
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              Ermitteln Sie die gesetzliche Aufteilung der CO2-Kosten zwischen Mieter und Vermieter –
              nachvollziehbar, strukturiert und als druckfähiger Berechnungsnachweis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="cta" size="lg" asChild>
                <Link to="/rechner">Berechnung starten</Link>
              </Button>
              <Button variant="ctaOutline" size="lg" asChild>
                <Link to="/ratgeber">Mehr erfahren</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="info" className="px-4 py-12 md:py-16 bg-secondary/40">
        <div className="container-wide">
          <h2 className="sr-only">Funktionen im Überblick</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Gesetzliche Aufteilung',
                desc: 'Für Wohngebäude nach dem Stufenmodell, für Nichtwohngebäude nach den gesetzlichen Verteilungsregeln.',
              },
              {
                icon: Users,
                title: 'Für Mieter und Vermieter',
                desc: 'Nutzbar aus beiden Perspektiven: Mieter prüfen ihren CO2-Kostenanteil sowie mögliche Erstattungsansprüche. Vermieter erstellen einen strukturierten Berechnungsnachweis.',
              },
              {
                icon: FileText,
                 title: 'Berechnungsnachweis als PDF',
                 desc: 'Erstellen Sie einen strukturierten Berechnungsnachweis als PDF – zur Dokumentation, Weitergabe oder als Anlage zur Abrechnung.',
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

      {/* What the tool provides */}
      <section className="px-4 py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <h2 className="text-xl font-bold text-foreground mb-6">Was dieses Tool kann</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Scale, label: 'CO2-Einstufung und Kostenverteilung' },
              { icon: BarChart3, label: 'Nachvollziehbare Berechnung' },
              { icon: FileDown, label: 'Druckfähiges PDF' },
              { icon: Building2, label: 'Wohn- & Nichtwohngebäude' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-2">
                <item.icon className="h-5 w-5 text-primary mx-auto" />
                <div className="text-sm font-medium text-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data hint */}
      <section className="px-4 py-8 bg-secondary/40">
        <div className="container-narrow">
          <div className="rounded-lg border border-border bg-card p-5 flex gap-4">
            <Flame className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Daten aus Ihrer Abrechnung</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Die meisten Eingaben, insbesondere CO2-Emissionen, CO2-Kosten und der Abrechnungszeitraum,
                können in der Regel direkt aus Ihrer Brennstoff- oder Wärmelieferabrechnung übernommen werden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 md:py-16 bg-background">
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
              answer="Sie benötigen Ihre Wärmeliefer- oder Brennstoffabrechnung mit Angaben zum Abrechnungszeitraum, den CO2-Emissionen (in kg) und den CO2-Kosten (in Euro). Außerdem die Wohn- bzw. Gebäudefläche."
            />
            <FAQItem
              question="Gilt das auch bei Fernwärme?"
              answer="Ja. Bei Fernwärme benötigen Sie die CO2-Emissionen der Wärmelieferung sowie die in der Rechnung ausgewiesenen CO2-Kosten des Wärmeversorgers."
            />
            <FAQItem
              question="Wie wird bei Nichtwohngebäuden gerechnet?"
              answer="Bei Nichtwohngebäuden gilt im Regelfall eine hälftige Aufteilung (50/50) der CO2-Kosten. Liegen bestimmte öffentlich-rechtliche Einschränkungen vor, kann die Aufteilung abweichen."
            />
            <FAQItem
              question="Was gilt bei Erdgas oder Fernwärme, wenn der Abrechnungszeitraum jahresübergreifend ist?"
              answer="Bei Erdgas und Fernwärme geben Sie bitte die CO2-Emissionen und CO2-Kosten für den gesamten Liefer- bzw. Abrechnungszeitraum so ein, wie sie in Ihrer Rechnung ausgewiesen sind. Eine Aufteilung nach Kalenderjahren ist nicht erforderlich."
            />
            <FAQItem
              question="Was gilt bei angelieferten Brennstoffen wie Heizöl, Flüssiggas oder Kohle, wenn mehrere Rechnungen vorliegen?"
              answer="Bei zentraler Versorgung durch einen Vermieter ist nicht zwingend eine einzelne Lieferantenrechnung maßgeblich, sondern der Abrechnungszeitraum, für den auch die Heizkostenabrechnung erstellt wird. Bitte geben Sie deshalb die CO2-Emissionen und CO2-Kosten für diesen maßgeblichen Abrechnungszeitraum ein. Diese Werte können aus einer oder mehreren Rechnungen über angelieferte Brennstoffe wie Heizöl, Flüssiggas oder Kohle stammen bzw. daraus für diesen Zeitraum ermittelt sein."
            />
            <FAQItem
              question="Was erhalte ich als Ergebnis?"
              answer="Sie erhalten eine nachvollziehbare Berechnung mit Stufenmodell-Einstufung und Kostenaufteilung. Das Ergebnis kann als strukturiertes PDF exportiert werden – zur eigenen Dokumentation oder als Anlage zur Abrechnung."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 py-10 bg-secondary/40">
        <div className="container-narrow">
          <div className="rounded-lg border border-border bg-card p-6">
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

      <SiteFooter />
    </div>
  );
}