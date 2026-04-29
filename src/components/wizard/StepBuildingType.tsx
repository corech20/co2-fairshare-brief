import { useCalculator } from '@/context/CalculatorContext';
import type { BuildingType } from '@/lib/calculator/types';
import { Home, Building } from 'lucide-react';

const OPTIONS: { value: BuildingType; label: string; desc: string; icon: typeof Home }[] = [
  { value: 'wohngebaeude', label: 'Wohngebäude', desc: 'Aufteilung nach dem Stufen-Modell gemäß\n§ 5 CO2KostAufG', icon: Home },
  { value: 'nichtwohngebaeude', label: 'Nichtwohngebäude', desc: 'Im Standardfall hälftige Aufteilung gemäß\n§ 8 CO2KostAufG', icon: Building },
];

export default function StepBuildingType() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Gebäudetyp</h2>
        <p className="text-muted-foreground mt-2">Handelt es sich um ein Wohngebäude oder ein Nichtwohngebäude?</p>
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
            <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{opt.desc}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Maßgeblich ist die überwiegende Nutzung der Gesamtfläche. Bei gemischt genutzten Gebäuden kommt es darauf an, ob die Fläche überwiegend zu Wohn- oder zu Nichtwohnzwecken genutzt wird.
      </p>
    </div>
  );
}
