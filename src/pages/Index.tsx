import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronDown, Scale, FileText, ClipboardList, CheckCircle2 } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
  <details className="group border-b border-border">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground hover:text-primary [&::-webkit-details-marker]:hidden">
      <span>{question}</span>
      <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
    <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</p>
  </details>
);

export default function Index() {
  const navigate = useNavigate();

  const faqs = [
    { q: 'Warum nutzt der Rechner die Werte der Lieferantenrechnung?', a: 'Für die Aufteilung werden die auf der Brennstoff- oder Wärmelieferabrechnung ausgewiesenen CO2-Emissionen und CO2-Kosten übernommen. Eine erneute pauschale Berechnung aus dem Verbrauch ist im regulären Eingabeweg nicht nötig.' },
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
        title="CO2-Kostenaufteilung berechnen | Rechner nach CO2KostAufG"
        description="CO2-Kostenaufteilung mit den CO2-Emissionen und CO2-Kosten aus Ihrer Lieferantenrechnung berechnen. Für Mieter und Vermieter – mit PDF-Nachweis."
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

      {/* Hero: real supplier billing data is the key distinction */}
      <main id="hauptinhalt">
      <section className="border-b border-border bg-background px-4 py-12 md:py-16">
        <div className="container-wide grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              CO2KostAufG · Für Mieter und Vermieter
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              CO2-Kostenaufteilung berechnen – mit den Werten Ihrer Rechnung
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Übernehmen Sie die ausgewiesenen CO2-Emissionen und CO2-Kosten aus Ihrer
              Brennstoff- oder Wärmelieferabrechnung. Der Rechner ermittelt daraus die
              gesetzliche Aufteilung zwischen Mieter und Vermieter – nachvollziehbar und mit PDF-Nachweis.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground">
              <strong>Keine pauschale Rückrechnung aus Verbrauchsmengen:</strong> Entscheidend sind
              die CO2-Angaben des Lieferanten für den maßgeblichen Abrechnungszeitraum.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button variant="cta" size="lg" asChild>
                <Link to="/rechner">CO2-Kosten berechnen</Link>
              </Button>
              <Button variant="ctaOutline" size="lg" asChild>
                <Link to="/ratgeber">Gesetzliche Aufteilung verstehen</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Wohn- und Nichtwohngebäude · Erdgas, Heizöl, Fernwärme und weitere Brennstoffe
            </p>
          </div>
          <aside aria-label="Benötigte Angaben aus der Abrechnung" className="rounded-xl border border-border bg-secondary/40 p-6 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-primary">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Das benötigen Sie</h2>
                <p className="text-sm text-muted-foreground">Aus Ihrer Abrechnung und den Gebäudedaten</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'CO2-Emissionen', detail: 'in kg laut Lieferantenrechnung' },
                { label: 'CO2-Kosten', detail: 'in Euro laut Lieferantenrechnung' },
                { label: 'Abrechnungszeitraum und Fläche', detail: 'für die gesetzliche Zuordnung' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Bei mehreren Brennstofflieferungen sind die Angaben für den maßgeblichen
              Abrechnungszeitraum zusammenzustellen.
            </p>
          </aside>
        </div>
      </section>

      {/* Practical benefits */}
      <section id="info" className="bg-secondary/30 px-4 py-12 md:py-16">
        <div className="container-wide">
          <h2 className="mb-7 text-xl font-bold text-foreground">Was den CO2-Rechner auszeichnet</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: 'Rechnungswerte als Grundlage',
                desc: 'CO2-Emissionen und CO2-Kosten werden aus der Abrechnung übernommen – ohne pauschale Schätzung anhand der Brennstoffmenge.',
              },
              {
                icon: Scale,
                title: 'Gesetzliche Kostenaufteilung',
                desc: 'Wohngebäude werden nach dem Stufenmodell des CO2KostAufG eingestuft. Für Nichtwohngebäude gelten eigene Aufteilungsregeln.',
              },
              {
                icon: FileText,
                title: 'Nachweis und Anschreiben als PDF',
                desc: 'Dokumentieren Sie das Ergebnis als PDF. Je nach Fall kann auch ein Erstattungsschreiben erstellt werden.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-card-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explain the calculation without hiding content behind clicks */}
      <section className="bg-background px-4 py-12 md:py-16">
        <div className="container-narrow">
          <h2 className="mb-3 text-xl font-bold text-foreground">So funktioniert die CO2-Kostenaufteilung</h2>
          <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
            Die Berechnung berücksichtigt den Abrechnungszeitraum, die CO2-Emissionen,
            die ausgewiesenen CO2-Kosten und die relevante Wohn- beziehungsweise Gebäudefläche.
          </p>
          <ol className="grid gap-5 md:grid-cols-3">
            {[
              { title: 'Abrechnung bereithalten', detail: 'CO2-Emissionen und CO2-Kosten sowie den Zeitraum aus der Abrechnung übernehmen.' },
              { title: 'Gebäude und Fläche angeben', detail: 'Je nach Gebäudeart und Versorgung die gesetzlich erforderlichen Angaben ergänzen.' },
              { title: 'Aufteilung und PDF erhalten', detail: 'Mieter- und Vermieteranteil ermitteln und als PDF dokumentieren.' },
            ].map((step, i) => (
              <li key={step.title} className="rounded-lg border border-border p-5">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted-foreground">
            Mehr zur gesetzlichen Grundlage und zu Sonderfällen im{' '}
            <Link to="/ratgeber" className="font-medium text-primary underline underline-offset-4 hover:no-underline">
              Ratgeber zur CO2-Kostenaufteilung
            </Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 md:py-16 bg-background">
        <div className="container-narrow">
          <h2 className="text-xl font-bold mb-8">Häufige Fragen zur CO2-Kostenaufteilung</h2>
          <div>
            <FAQItem
              question="Warum werden die Werte der Lieferantenrechnung verwendet?"
              answer="Der Rechner übernimmt im regulären Eingabeweg die auf Ihrer Brennstoff- oder Wärmelieferabrechnung angegebenen CO2-Emissionen und CO2-Kosten. So ist keine pauschale Neuberechnung aus dem Verbrauch erforderlich."
            />
          </div>
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

      </main>
      <SiteFooter />
    </div>
  );
}