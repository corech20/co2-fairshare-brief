import { useCalculator } from '@/context/CalculatorContext';
import type { RestrictionCase } from '@/lib/calculator/types';
import { Info, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const SPECIAL_OPTIONS: { value: RestrictionCase; label: string; desc: string }[] = [
  {
    value: 'fall1',
    label: 'Fall 1: Energetische Verbesserung des Gebäudes nicht möglich',
    desc: 'Öffentlich-rechtliche Vorgaben verhindern eine wesentliche energetische Verbesserung des Gebäudes (z. B. bestimmte Denkmalschutzvorgaben).',
  },
  {
    value: 'fall2',
    label: 'Fall 2: Verbesserung der Wärmeversorgung nicht möglich',
    desc: 'Öffentlich-rechtliche Vorgaben verhindern eine wesentliche Verbesserung der Wärme- oder Warmwasserversorgung (z. B. Anschlusszwang an ein Wärmenetz).',
  },
  {
    value: 'fall1und2',
    label: 'Beide Einschränkungen treffen zu',
    desc: 'Sowohl die energetische Verbesserung des Gebäudes als auch der Wärmeversorgung ist wesentlich eingeschränkt.',
  },
];

export default function StepRestriction() {
  const { wizardData, setWizardField } = useCalculator();

  const currentIsSpecial = wizardData.restrictionCase && wizardData.restrictionCase !== 'fall3';
  const [showSpecial, setShowSpecial] = useState(!!currentIsSpecial);

  const selectDefault = () => {
    setWizardField('restrictionCase', 'fall3');
    setShowSpecial(false);
  };

  const openSpecial = () => {
    setShowSpecial(true);
    // Clear default selection if it was set
    if (wizardData.restrictionCase === 'fall3') {
      setWizardField('restrictionCase', undefined as unknown as RestrictionCase);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Öffentlich-rechtliche Einschränkungen</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Bestehen rechtliche Vorgaben, die eine energetische Verbesserung des Gebäudes oder der Wärmeversorgung einschränken?
        </p>
      </div>

      {/* Default / standard option */}
      <button
        onClick={selectDefault}
        className={`w-full rounded-xl border-2 p-5 text-left transition-all hover:shadow-md ${
          wizardData.restrictionCase === 'fall3' && !showSpecial
            ? 'border-accent bg-accent/5 shadow-sm'
            : 'border-border bg-card hover:border-primary/30'
        }`}
      >
        <div className="font-semibold text-foreground">Keine rechtlichen Einschränkungen bekannt</div>
        <div className="text-sm text-muted-foreground mt-1">
          Es sind keine öffentlich-rechtlichen Einschränkungen bekannt, die eine energetische Verbesserung verhindern.
        </div>
      </button>

      {/* Special case toggle */}
      {!showSpecial ? (
        <button
          onClick={openSpecial}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
          Es könnten öffentlich-rechtliche Einschränkungen vorliegen
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Welche Einschränkung trifft zu?</span>
            <button
              onClick={selectDefault}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurück zur Standardauswahl
            </button>
          </div>

          <div className="grid gap-3">
            {SPECIAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWizardField('restrictionCase', opt.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                  wizardData.restrictionCase === opt.value
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="font-semibold text-foreground text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* Important legal clarification */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 flex gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              <p><strong className="text-foreground">Wichtig:</strong> Ein Denkmalschutzstatus allein genügt nicht. Entscheidend ist, ob öffentlich-rechtliche Vorgaben eine <em>wesentliche</em> energetische Verbesserung tatsächlich verhindern.</p>
              <p>Im Streitfall muss der Vermieter die relevanten Umstände nachweisen.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
