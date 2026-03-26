import { useCalculator } from '@/context/CalculatorContext';
import type { BuildingType } from '@/lib/calculator/types';
import { Home, Building } from 'lucide-react';

const OPTIONS: { value: BuildingType; label: string; desc: string; icon: typeof Home }[] = [
  { value: 'wohngebaeude', label: 'Wohngebäude', desc: 'Gesetzliche Aufteilung nach dem Stufenmodell für Wohngebäude', icon: Home },
  { value: 'nichtwohngebaeude', label: 'Nichtwohngebäude', desc: 'Im Standardfall hälftige Aufteilung zwischen Mieter und Vermieter', icon: Building },
];

export default function StepBuildingType() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gebäudetyp</h2>
        <p className="text-muted-foreground mt-2">Bitte wählen Sie aus, ob es sich insgesamt um ein Wohngebäude oder ein Nichtwohngebäude handelt.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWizardField('buildingType', opt.value)}
            className={`rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
              wizardData.buildingType === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <opt.icon className={`h-8 w-8 mb-3 ${wizardData.buildingType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
            <div className="font-semibold text-foreground text-lg">{opt.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Entscheidend ist, ob das Gebäude insgesamt überwiegend zu Wohnzwecken oder überwiegend nicht zu Wohnzwecken genutzt wird. Bei gemischt genutzten Gebäuden kommt es auf die überwiegende Nutzung der Gesamtfläche an.
      </p>
    </div>
  );
}
