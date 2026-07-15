import { Link, useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';

const STUFEN: { stufe: number; range: string; mieter: string; vermieter: string }[] = [
  { stufe: 1, range: 'unter 12', mieter: '100 %', vermieter: '0 %' },
  { stufe: 2, range: '12 bis unter 17', mieter: '90 %', vermieter: '10 %' },
  { stufe: 3, range: '17 bis unter 22', mieter: '80 %', vermieter: '20 %' },
  { stufe: 4, range: '22 bis unter 27', mieter: '70 %', vermieter: '30 %' },
  { stufe: 5, range: '27 bis unter 32', mieter: '60 %', vermieter: '40 %' },
  { stufe: 6, range: '32 bis unter 37', mieter: '50 %', vermieter: '50 %' },
  { stufe: 7, range: '37 bis unter 42', mieter: '40 %', vermieter: '60 %' },
  { stufe: 8, range: '42 bis unter 47', mieter: '30 %', vermieter: '70 %' },
  { stufe: 9, range: '47 bis unter 52', mieter: '20 %', vermieter: '80 %' },
  { stufe: 10, range: '52 und mehr', mieter: '5 %', vermieter: '95 %' },
];

export default function RatgeberPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="CO2-Kostenaufteilung nach CO2KostAufG – Ratgeber für Mieter und Vermieter"
        description="Wie die CO2-Kosten zwischen Mieter und Vermieter aufgeteilt werden: Stufenmodell, Fristen, Sonderfälle und Rechenweg – verständlich erklärt."
        path="/ratgeber"
      />
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-foreground tracking-tight">CO2-Kostenaufteilung</span>
          </Link>
          <Link to="/rechner" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Zum Rechner
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 md:py-14">
        <article className="container-narrow space-y-10 text-foreground">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              CO2-Kostenaufteilung nach dem CO2KostAufG
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Seit dem 1. Januar 2023 werden die CO2-Kosten fürs Heizen mit fossilen Brennstoffen
              zwischen Mieter und Vermieter aufgeteilt. Wie viel jede Seite trägt, hängt vom
              energetischen Zustand des Gebäudes ab.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Wer muss die Aufteilung berechnen?</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                <strong>Zentralheizung oder Versorgung über den Vermieter:</strong> Der Vermieter
                ermittelt die Aufteilung und weist sie in der Heizkostenabrechnung aus. Der
                Mieteranteil erscheint dort direkt.
              </p>
              <p>
                <strong>Etagenheizung oder selbst bezogener Brennstoff (Selbstversorger):</strong>{' '}
                Der Mieter hat einen eigenen Vertrag mit dem Versorger, muss den Vermieteranteil
                selbst berechnen und vom Vermieter die Erstattung verlangen.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Wichtige Frist für Selbstversorger</h2>
            <p className="text-sm leading-relaxed">
              Mieter, die sich selbst versorgen, müssen ihren Erstattungsanspruch innerhalb von{' '}
              <strong>zwölf Monaten nach Erhalt der Abrechnung</strong> ihres Energielieferanten
              gegenüber dem Vermieter in Textform geltend machen. Diese Frist ist eine
              Ausschlussfrist – wird sie versäumt, verfällt der Anspruch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Das 10-Stufen-Modell für Wohngebäude</h2>
            <p className="text-sm leading-relaxed">
              Bei Wohngebäuden richtet sich die Aufteilung nach dem spezifischen CO2-Ausstoß des
              Gebäudes pro Quadratmeter und Jahr. Je höher der Ausstoß, desto größer der
              Vermieteranteil.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold">Stufe</th>
                    <th className="px-3 py-2 font-semibold">CO2-Ausstoß (kg/m²/Jahr)</th>
                    <th className="px-3 py-2 font-semibold">Mieter</th>
                    <th className="px-3 py-2 font-semibold">Vermieter</th>
                  </tr>
                </thead>
                <tbody>
                  {STUFEN.map((s) => (
                    <tr key={s.stufe} className="border-t border-border">
                      <td className="px-3 py-2">{s.stufe}</td>
                      <td className="px-3 py-2">{s.range}</td>
                      <td className="px-3 py-2">{s.mieter}</td>
                      <td className="px-3 py-2">{s.vermieter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Welche Brennstoffe sind betroffen?</h2>
            <p className="text-sm leading-relaxed">
              Das Gesetz gilt für fossile Brennstoffe, die der CO2-Bepreisung unterliegen. Für
              Holzbrennstoffe (Pellets) fallen keine nach dem CO2KostAufG zu verteilenden
              CO2-Kosten an; bei Wärmepumpen/Strom greift das Gesetz nicht.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
              <li><strong>Erdgas:</strong> 0,20088 kg CO2/kWh</li>
              <li><strong>Heizöl:</strong> 0,2664 kg CO2/kWh</li>
              <li><strong>Flüssiggas (LPG):</strong> 0,2358 kg CO2/kWh</li>
              <li><strong>Braunkohlebriketts:</strong> 0,35712 kg CO2/kWh</li>
              <li><strong>Holzpellets:</strong> keine zu verteilenden CO2-Kosten</li>
              <li><strong>Fernwärme:</strong> CO2-Wert wird vom Wärmelieferanten ausgewiesen</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Mehrwertsteuer bei Gas und Fernwärme</h2>
            <p className="text-sm leading-relaxed">
              Für Erdgas und Fernwärme galt vom 1. Oktober 2022 bis 31. März 2024 ein ermäßigter
              Umsatzsteuersatz von 7 %. Seit dem 1. April 2024 gilt wieder der reguläre Satz von
              19 %. Erstreckt sich ein Abrechnungszeitraum über den 1. April 2024 hinaus, teilt der
              Rechner die CO2-Kosten taggenau auf beide Zeiträume auf. Für alle anderen Brennstoffe
              gilt durchgehend 19 %.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Jahresübergreifende Abrechnungszeiträume</h2>
            <p className="text-sm leading-relaxed">
              Erstreckt sich der Abrechnungszeitraum über einen Jahreswechsel, gilt für jedes
              Kalenderjahr der jeweils gültige CO2-Preis. Für die Einstufung ins Stufenmodell
              werden die Emissionen auf ein volles Jahr normiert; die CO2-Kosten werden auf Basis
              des tatsächlichen Verbrauchs angesetzt und nicht hochgerechnet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Nichtwohngebäude</h2>
            <p className="text-sm leading-relaxed">
              Bei Nichtwohngebäuden gilt derzeit eine pauschale Aufteilung von 50 % Mieter und
              50 % Vermieter. Das in § 8 CO2KostAufG ab dem Abrechnungsjahr 2025 vorgesehene
              Stufenmodell für Nichtwohngebäude ist bislang nicht eingeführt worden.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Einschränkungen (z. B. Denkmalschutz)</h2>
            <p className="text-sm leading-relaxed">
              Verhindern öffentlich-rechtliche Vorgaben – etwa Denkmalschutz oder ein Anschluss-
              und Benutzungszwang – eine wesentliche energetische Verbesserung des Gebäudes,
              verringert sich der Vermieteranteil. Liegt ein solcher Fall vor, wird der
              Vermieteranteil halbiert; sind beide Einschränkungen gleichzeitig gegeben, entfällt
              er vollständig.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Das Kürzungsrecht des Mieters</h2>
            <p className="text-sm leading-relaxed">
              Weist der Vermieter die CO2-Kosten und deren Aufteilung nicht oder nicht korrekt in
              der Heizkostenabrechnung aus, darf der Mieter die betreffenden Heizkosten pauschal
              um 3 % kürzen (§ 7 CO2KostAufG).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">Rechtsgrundlage</h2>
            <p className="text-sm leading-relaxed">
              Grundlage ist das Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG), in Kraft seit
              dem 1. Januar 2023.{' '}
              <a
                href="https://www.gesetze-im-internet.de/co2kostaufg/"
                target="_blank"
                rel="noopener"
                className="underline hover:text-primary"
              >
                Kohlendioxidkostenaufteilungsgesetz (CO2KostAufG)
              </a>
              .
            </p>
            <p className="text-sm leading-relaxed">
              Ab 2027 wird der nationale CO2-Preis voraussichtlich durch den europäischen
              Emissionshandel (EU-ETS 2) abgelöst; die Aufteilung nach dem Stufenmodell bleibt
              bestehen.
            </p>
          </section>

          <section className="pt-4">
            <Button variant="cta" size="lg" onClick={() => navigate('/rechner')}>
              Jetzt CO2-Kosten berechnen
            </Button>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            Dieser Ratgeber dient der allgemeinen Information und ersetzt keine rechtliche oder
            steuerliche Beratung.
          </p>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}