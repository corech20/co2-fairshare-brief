import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Verantwortlicher',
    body: (
      <p>
        Paul Hansen<br />
        Luxemburgplatz 5<br />
        65185 Wiesbaden<br />
        Deutschland<br />
        E-Mail: PaulHansen@mein.gmx
      </p>
    ),
  },
  {
    title: '2. Allgemeine Hinweise',
    body: (
      <p>
        Auf dieser Website werden personenbezogene Daten nur insoweit verarbeitet, wie dies
        technisch erforderlich ist oder vom Nutzer selbst eingegeben wird.
      </p>
    ),
  },
  {
    title: '3. Aufruf der Website',
    body: (
      <p>
        Beim Aufruf der Website können technisch notwendige Verbindungsdaten verarbeitet werden,
        um die Website bereitzustellen und die Sicherheit und Stabilität des Angebots zu
        gewährleisten.
      </p>
    ),
  },
  {
    title: '4. Nutzung des Rechners',
    body: (
      <>
        <p>
          Die in den Rechner eingegebenen Angaben werden zur Durchführung der Berechnung und zur
          Erstellung der PDF verarbeitet.
        </p>
        <p>
          Nach aktuellem Stand erfolgt keine dauerhafte Speicherung der vom Nutzer in den Rechner
          eingegebenen Daten.
        </p>
      </>
    ),
  },
  {
    title: '5. PDF-Erstellung',
    body: (
      <>
        <p>
          Wenn der Nutzer ein PDF erstellt, werden die eingegebenen Daten ausschließlich zur
          Erstellung des angeforderten Dokuments verarbeitet.
        </p>
        <p>Nach aktuellem Stand erfolgt keine dauerhafte Speicherung dieser Eingaben.</p>
      </>
    ),
  },
  {
    title: '6. Kontaktaufnahme',
    body: (
      <p>
        Wenn Nutzer per E-Mail Kontakt aufnehmen, werden die übermittelten Angaben zur Bearbeitung
        der Anfrage verarbeitet.
      </p>
    ),
  },
  {
    title: '7. Cookies / Tracking / lokale Speicherung',
    body: (
      <>
        <p>Nach aktuellem Stand werden keine Analyse- oder Trackingdienste eingesetzt.</p>
        <p>
          Es werden keine nicht erforderlichen Cookies zu Analyse- oder Marketingzwecken
          eingesetzt.
        </p>
        <p>
          Es wird nach aktuellem Stand kein Local Storage oder Session Storage für Nutzereingaben
          verwendet.
        </p>
      </>
    ),
  },
  {
    title: '8. Rechtsgrundlagen',
    body: (
      <p>
        Die Verarbeitung erfolgt, soweit erforderlich, zur Bereitstellung der Website und zur
        Durchführung der vom Nutzer gewünschten Berechnung bzw. PDF-Erstellung sowie zur
        Bearbeitung von Anfragen.
      </p>
    ),
  },
  {
    title: '9. Empfänger',
    body: (
      <p>
        Eine Weitergabe personenbezogener Daten erfolgt nur insoweit, wie dies technisch zur
        Bereitstellung der Website erforderlich ist.
      </p>
    ),
  },
  {
    title: '10. Speicherdauer',
    body: (
      <>
        <p>
          Personenbezogene Daten werden nur so lange verarbeitet bzw. gespeichert, wie dies für
          den jeweiligen Zweck erforderlich ist.
        </p>
        <p>
          Nach aktuellem Stand werden die in den Rechner eingegebenen Daten nicht dauerhaft
          gespeichert.
        </p>
      </>
    ),
  },
  {
    title: '11. Betroffenenrechte',
    body: (
      <p>
        Nutzer haben im Rahmen der gesetzlichen Vorgaben insbesondere das Recht auf Auskunft,
        Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch sowie Beschwerde bei
        einer Datenschutz-Aufsichtsbehörde.
      </p>
    ),
  },
  {
    title: '12. Hinweis zur Aktualisierung',
    body: (
      <p>
        Die Datenschutzerklärung ist an den aktuellen technischen Stand der Website gebunden.
        Wenn künftig zusätzliche Funktionen, externe Dienste, Tracking, Formulare, Zahlungsdienste
        oder Speichervorgänge hinzukommen, ist die Datenschutzerklärung entsprechend anzupassen.
      </p>
    ),
  },
];

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container-wide flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold text-foreground tracking-tight">CO2-Kostenaufteilung</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="container-narrow">
          <h1 className="text-2xl font-bold tracking-tight mb-8">Datenschutzerklärung</h1>

          <div className="space-y-8 text-sm leading-relaxed text-foreground">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="font-semibold mb-2">{s.title}</h2>
                <div className="space-y-2 text-muted-foreground">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}