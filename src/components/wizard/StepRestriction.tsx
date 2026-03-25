import { useCalculator } from '@/context/CalculatorContext';
import type { RestrictionCase } from '@/lib/calculator/types';

const OPTIONS: { value: RestrictionCase; label: string; desc: string }[] = [
  { value: 'fall1', label: 'Fall 1', desc: 'Öffentlich-rechtliche Vorgaben verhindern eine energetische Verbesserung (z.B. Denkmalschutz).' },
  { value: 'fall2', label: 'Fall 2', desc: 'Maßnahmen zur energetischen Verbesserung genehmigungsrechtlich nicht umsetzbar.' },
  { value: 'fall1und2', label: 'Fall 1 und Fall 2', desc: 'Beide Einschränkungen liegen vor.' },
  { value: 'fall3', label: 'Fall 3', desc: 'Keine Einschränkungen – Standardberechnung.' },
];

export default function StepRestriction() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Öffentlich-rechtliche Einschränkungen</h2>
        <p className="text-muted-foreground mt-2">
          Gibt es Einschränkungen, die eine energetische Sanierung verhindern?
        </p>
      </div>
      <div className="grid gap-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWizardField('restrictionCase', opt.value)}
            className={`rounded-xl border-2 p-5 text-left transition-all hover:shadow-md ${
              wizardData.restrictionCase === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="font-semibold text-foreground">{opt.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
