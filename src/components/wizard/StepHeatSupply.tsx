import { useCalculator } from '@/context/CalculatorContext';
import type { HeatSupplyType } from '@/lib/calculator/types';
import { Flame, Thermometer, Heater } from 'lucide-react';

const OPTIONS: { value: HeatSupplyType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'zentral', label: 'Zentrale Heizungsanlage', desc: 'Gemeinsame Heizung für das gesamte Gebäude', icon: Flame },
  { value: 'fernwaerme', label: 'Fernwärme', desc: 'Wärmeversorgung durch einen Fernwärmeversorger', icon: Thermometer },
  { value: 'etage', label: 'Etagenheizung', desc: 'Eigene Heizung in der Wohnung', icon: Heater },
];

export default function StepHeatSupply() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Art der Wärmeversorgung</h2>
        <p className="text-muted-foreground mt-2">Wie wird das Gebäude mit Wärme versorgt?</p>
      </div>
      <div className="grid gap-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWizardField('heatSupplyType', opt.value)}
            className={`rounded-xl border-2 p-5 text-left transition-all hover:shadow-md flex items-start gap-4 ${
              wizardData.heatSupplyType === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <opt.icon className={`h-6 w-6 mt-0.5 shrink-0 ${wizardData.heatSupplyType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
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
