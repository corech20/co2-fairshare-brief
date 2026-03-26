import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType, FuelEntry } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer, Zap, Leaf, Trees, Factory, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const STANDARD_FUELS: { value: FuelType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'erdgas', label: 'Erdgas', desc: 'z.\u00A0B. Gasheizung oder Gasetagenheizung', icon: Flame },
  { value: 'heizoel', label: 'Heizöl', desc: 'z.\u00A0B. Ölheizung', icon: Droplets },
  { value: 'fernwaerme', label: 'Fernwärme', desc: 'Der Emissionsfaktor wird aus Ihrer Fernwärmeabrechnung übernommen.', icon: Thermometer },
  { value: 'fluessiggas', label: 'Flüssiggas (LPG)', desc: 'z.\u00A0B. Flüssiggasheizung', icon: Zap },
  { value: 'pellets', label: 'Holzpellets', desc: 'CO2-Kosten = 0 EUR (nicht BEHG-pflichtig)', icon: Leaf },
];

const ADVANCED_FUELS: { value: FuelType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'hackschnitzel', label: 'Holzhackschnitzel', desc: 'z.\u00A0B. naturbelassene Holzhackschnitzel (nicht BEHG-pflichtig)', icon: Trees },
  { value: 'braunkohle', label: 'Braunkohlebriketts', desc: 'z.\u00A0B. Braunkohleheizung', icon: Factory },
  { value: 'erdgas_kwk', label: 'Erdgas (KWK)', desc: 'Nur auswählen, wenn Ihre Anlage ausdrücklich als Kraft-Wärme-Kopplungsanlage betrieben wird.', icon: Flame },
  { value: 'fluessiggas_kwk', label: 'Flüssiggas (KWK)', desc: 'Nur auswählen, wenn Ihre Anlage ausdrücklich als Kraft-Wärme-Kopplungsanlage betrieben wird.', icon: Zap },
  { value: 'heizoel_kwk', label: 'Heizöl (KWK)', desc: 'Nur auswählen, wenn Ihre Anlage ausdrücklich als Kraft-Wärme-Kopplungsanlage betrieben wird.', icon: Droplets },
];

const ALL_FUELS = [...STANDARD_FUELS, ...ADVANCED_FUELS];

export default function StepFuelSource() {
  const { wizardData, setWizardField } = useCalculator();
  const [showAdvanced, setShowAdvanced] = useState(() => {
    // Show advanced if current selection is an advanced fuel
    const currentFuel = wizardData.fuelType;
    return currentFuel ? ADVANCED_FUELS.some(f => f.value === currentFuel) : false;
  });

  const fuelEntries = wizardData.fuelEntries ?? [];
  const isMultiFuel = fuelEntries.length > 0;

  const selectSingleFuel = (fuelType: FuelType) => {
    setWizardField('fuelType', fuelType);
    if (fuelEntries.length > 0) setWizardField('fuelEntries', undefined);
  };

  const addFuelEntry = () => {
    const existing: FuelEntry[] = fuelEntries.length > 0
      ? [...fuelEntries]
      : wizardData.fuelType
        ? [{ fuelType: wizardData.fuelType, amount: wizardData.fuelAmount ?? 0 }]
        : [];
    existing.push({ fuelType: 'erdgas', amount: 0 });
    setWizardField('fuelEntries', existing);
    setWizardField('fuelType', undefined);
  };

  const updateFuelEntry = (index: number, updates: Partial<FuelEntry>) => {
    const updated = [...fuelEntries];
    updated[index] = { ...updated[index], ...updates };
    setWizardField('fuelEntries', updated);
  };

  const removeFuelEntry = (index: number) => {
    const updated = fuelEntries.filter((_, i) => i !== index);
    if (updated.length <= 1 && updated.length > 0) {
      setWizardField('fuelType', updated[0].fuelType);
      setWizardField('fuelAmount', updated[0].amount);
      setWizardField('fuelEntries', undefined);
    } else {
      setWizardField('fuelEntries', updated);
    }
  };

  // Single fuel mode
  if (!isMultiFuel) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Brennstoff / Wärmequelle</h2>
          <p className="text-muted-foreground mt-2">Bitte wählen Sie den verwendeten Brennstoff bzw. die Wärmequelle aus.</p>
        </div>

        {/* Standard fuels */}
        <div className="grid gap-3">
          {STANDARD_FUELS.map(opt => (
            <button
              key={opt.value}
              onClick={() => selectSingleFuel(opt.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md flex items-start gap-4 ${
                wizardData.fuelType === opt.value
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <opt.icon className={`h-5 w-5 mt-0.5 shrink-0 ${wizardData.fuelType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
              <div>
                <div className="font-semibold text-foreground text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Advanced fuels toggle */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Weitere Brennstoffe anzeigen
          </button>
          {showAdvanced && (
            <div className="grid gap-3 mt-3">
              {ADVANCED_FUELS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => selectSingleFuel(opt.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md flex items-start gap-4 ${
                    wizardData.fuelType === opt.value
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <opt.icon className={`h-5 w-5 mt-0.5 shrink-0 ${wizardData.fuelType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-semibold text-foreground text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={addFuelEntry} className="mt-2">
            <Plus className="h-4 w-4 mr-1" />
            Weiteren Brennstoff hinzufügen
          </Button>
          <p className="text-xs text-muted-foreground">
            Falls mehrere Brennstoffe oder Erzeugungstechniken verwendet wurden, können Sie hier weitere hinzufügen.
          </p>
        </div>
      </div>
    );
  }

  // Multi-fuel mode
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Brennstoffe / Wärmequellen</h2>
        <p className="text-muted-foreground mt-2">Sie können mehrere Brennstoffe für eine Berechnung angeben.</p>
      </div>

      <div className="space-y-4">
        {fuelEntries.map((entry, index) => (
          <div key={index} className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Brennstoff {index + 1}</span>
              {fuelEntries.length > 1 && (
                <button onClick={() => removeFuelEntry(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={entry.fuelType}
              onChange={e => updateFuelEntry(index, { fuelType: e.target.value as FuelType })}
              className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {ALL_FUELS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Menge</label>
                <input
                  type="number"
                  value={entry.amount || ''}
                  onChange={e => updateFuelEntry(index, { amount: parseFloat(e.target.value) || 0 })}
                  placeholder="z.B. 45000"
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              {entry.fuelType === 'fernwaerme' && (
                <div>
                  <label className="text-xs text-muted-foreground">Emissionsfaktor (kg CO2/kWh)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={entry.emissionFactorCustom ?? ''}
                    onChange={e => updateFuelEntry(index, { emissionFactorCustom: parseFloat(e.target.value) || undefined })}
                    placeholder="z.B. 0.18"
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addFuelEntry}>
        <Plus className="h-4 w-4 mr-1" />
        Weiteren Brennstoff hinzufügen
      </Button>
    </div>
  );
}
