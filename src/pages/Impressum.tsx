import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Impressum — co2kostenberechnung.de"
        description="Anbieterkennzeichnung und rechtliche Angaben zum CO2-Kostenaufteilungsrechner."
        path="/impressum"
      />
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
          <h1 className="text-2xl font-bold tracking-tight mb-8">Impressum</h1>

          <section className="space-y-6 text-sm leading-relaxed text-foreground">
            <div>
              <h2 className="font-semibold mb-2">Angaben gemäß § 5 DDG</h2>
              <p>
                Paul Hansen<br />
                Luxemburgplatz 5<br />
                65185 Wiesbaden<br />
                Deutschland
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">E-Mail</h2>
              <p>PaulHansen@mein.gmx</p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Verantwortlich für den Inhalt</h2>
              <p>
                Paul Hansen<br />
                Luxemburgplatz 5<br />
                65185 Wiesbaden
              </p>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Hinweis</h2>
              <p>Dies ist das Online-Angebot „CO2-Kostenrechner“.</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}