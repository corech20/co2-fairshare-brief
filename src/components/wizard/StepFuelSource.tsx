import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer } from 'lucide-react';

const OPTIONS: { value: FuelType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'erdgas', label: 'Erdgas', desc: 'z.\u00A0B. Gasheizung oder Gasetagenheizung', icon: Flame },
  { value: 'heizoel', label: 'Heizöl', desc: 'z.\u00A0B. Ölheizung', icon: Droplets },
  { value: 'fernwaerme', label: 'Fernwärme', desc: 'Der Emissionsfaktor wird aus Ihrer Fernwärmeabrechnung übernommen.', icon: Thermometer },
];

export default function StepFuelSource() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Brennstoff / Wärmequelle</h2>
        <p className="text-muted-foreground mt-2">Welcher Brennstoff wird verwendet?</p>
      </div>
      <div className="grid gap-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWizardField('fuelType', opt.value)}
            className={`rounded-xl border-2 p-5 text-left transition-all hover:shadow-md flex items-start gap-4 ${
              wizardData.fuelType === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <opt.icon className={`h-6 w-6 mt-0.5 shrink-0 ${wizardData.fuelType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <div className="font-semibold text-foreground">{opt.label}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
