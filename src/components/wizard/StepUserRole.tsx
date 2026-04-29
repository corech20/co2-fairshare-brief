import { useCalculator } from '@/context/CalculatorContext';
import type { UserRole } from '@/lib/calculator/types';
import { User, Building2 } from 'lucide-react';

const OPTIONS: { value: UserRole; label: string; desc: string; icon: typeof User }[] = [
  {
    value: 'mieter',
    label: 'Berechnung als Mieter',
    desc: 'Zur Prüfung des CO2-Kostenanteils und möglicher Erstattungsansprüche – insbesondere bei eigener Wärmeversorgung oder direkter Wärmelieferung.',
    icon: User,
  },
  {
    value: 'vermieter',
    label: 'Berechnung als Vermieter',
    desc: 'Gesetzliche CO2-Kostenaufteilung berechnen und als Berechnungsnachweis dokumentieren.',
    icon: Building2,
  },
];

export default function StepUserRole() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Wer nutzt das Tool?</h2>
        <p className="text-muted-foreground mt-2">Bitte wählen Sie aus, ob Sie die Berechnung als Mieter oder als Vermieter durchführen möchten.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWizardField('userRole', opt.value)}
            className={`rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
              wizardData.userRole === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="h-8 mb-3 flex items-start">
              <opt.icon className={`h-8 w-8 ${wizardData.userRole === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <div className="font-semibold text-foreground text-lg">{opt.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}