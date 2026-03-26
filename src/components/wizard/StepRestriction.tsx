import { useCalculator } from '@/context/CalculatorContext';
import type { RestrictionCase } from '@/lib/calculator/types';

const OPTIONS: { value: RestrictionCase; label: string; desc: string }[] = [
  {
    value: 'fall1',
    label: 'Energetische Verbesserung des Gebäudes nicht möglich',
    desc: 'Zum Beispiel wegen Denkmalschutz oder anderer öffentlich-rechtlicher Vorgaben.',
  },
  {
    value: 'fall2',
    label: 'Energetische Verbesserung der Heizungs- oder Wärmeversorgung nicht möglich',
    desc: 'Zum Beispiel wegen Anschlusszwang an ein Wärmenetz oder ähnlicher Vorgaben.',
  },
  {
    value: 'fall1und2',
    label: 'Beide Einschränkungen treffen zu',
    desc: 'Sowohl die energetische Verbesserung des Gebäudes als auch der Wärmeversorgung ist nicht möglich.',
  },
  {
    value: 'fall3',
    label: 'Keine rechtlichen Einschränkungen bekannt',
    desc: 'Es sind keine öffentlich-rechtlichen Einschränkungen bekannt.',
  },
];

export default function StepRestriction() {
  const { wizardData, setWizardField } = useCalculator();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Öffentlich-rechtliche Einschränkungen</h2>
        <p className="text-muted-foreground mt-2">
          Bestehen rechtliche Vorgaben, die eine energetische Verbesserung des Gebäudes oder der Wärmeversorgung einschränken?
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
      <p className="text-xs text-muted-foreground leading-relaxed">
        Wenn Ihnen keine solchen Einschränkungen bekannt sind, wählen Sie bitte „Keine rechtlichen Einschränkungen bekannt".
      </p>
    </div>
  );
}
