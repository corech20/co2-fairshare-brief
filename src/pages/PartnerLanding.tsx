import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Info, Scale } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';
import { getPartner } from '@/config/partners';

export default function PartnerLanding() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const partner = slug ? getPartner(slug) : undefined;

  if (!partner) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${partner.name} – CO2-Kostenberechnung (Mitgliederzugang)`}
        description={`Mitgliederzugang des ${partner.name}: CO2-Kosten nach CO2KostAufG berechnen und Erstattungsschreiben vorbereiten.`}
        canonical={`https://co2kostenberechnung.de/${partner.slug}`}
        noindex
      />

      {/* Entwurfs-Banner */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs">
        <div className="container-wide px-4 py-1.5 text-center">
          Interner Entwurf – noch nicht abgestimmter Partnerzugang
        </div>
      </div>

      {/* Kopfbereich */}
      <header className="border-b border-border bg-background">
        <div className="container-wide flex h-16 items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Scale className="h-5 w-5 text-primary shrink-0" />
            <span className="text-base font-semibold text-foreground tracking-tight truncate">
              CO2-Kostenberechnung
            </span>
          </div>
          <div className="shrink-0" data-partner-logo>
            {partner.logoUrl ? (
              <img
                src={partner.logoUrl}
                alt={`Logo ${partner.name}`}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="h-10 px-4 flex items-center rounded border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                Logo {partner.name}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Partner-Kennzeichnung */}
      <div className="border-b border-border bg-secondary/40">
        <div className="container-narrow px-4 py-2.5">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mitgliederzugang des <span className="font-medium text-foreground">{partner.name}</span>
          </p>
        </div>
      </div>

      {/* Hauptbereich */}
      <main className="flex-1 px-4 py-12 md:py-16">
        <div className="container-narrow space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              CO2-Kosten berechnen und Erstattung vorbereiten
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Dieser Zugang unterstützt Mitglieder des {partner.name} dabei, einen möglichen
              Erstattungsbetrag nach dem CO2-Kostenaufteilungsgesetz zu berechnen und ein
              vorbereitetes Schreiben zu erstellen.
            </p>
          </div>

          {/* Hinweisbox */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 flex gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {partner.hintText}
            </p>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Button
              variant="cta"
              size="lg"
              onClick={() => navigate(`/rechner?partner=${partner.slug}`)}
            >
              Berechnung starten
            </Button>
          </div>

          {partner.contactUrl && (
            <p className="text-sm text-muted-foreground pt-4 border-t border-border">
              <a
                href={partner.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {partner.contactLabel ?? 'Weitere Informationen'}
              </a>
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}