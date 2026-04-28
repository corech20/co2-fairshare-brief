import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-6 mt-auto">
      <div className="container-wide px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CO2-Kostenaufteilungsrechner · Alle Angaben ohne Gewähr</p>
        <nav className="flex items-center gap-4">
          <Link to="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link to="/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}