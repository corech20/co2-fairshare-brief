import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType, FuelEntry } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer, Zap, Leaf, Trees, Factory, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { IntegerInput } from './IntegerInput';

const STANDARD_FUELS: { value: FuelType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'erdgas', label: 'Erdgas', desc: 'Eingabe in kWh (Brennwert/Hs) lt. Gasabrechnung', icon: Flame },
  { value: 'heizoel', label: 'Heizöl', desc: 'Eingabe in Litern lt. Lieferschein oder Abrechnung', icon: Droplets },
  { value: 'fernwaerme', label: 'Fernwärme / Nahwärme', desc: 'Eingabe in kWh – Emissionsfaktor wird separat abgefragt', icon: Thermometer },
  { value: 'fluessiggas', label: 'Flüssiggas (LPG)', desc: 'Eingabe in kg lt. Abrechnung', icon: Zap },
  { value: 'pellets', label: 'Holzpellets', desc: 'Nicht BEHG-pflichtig – CO2-Kosten betragen 0 EUR', icon: Leaf },
];

const ADVANCED_FUELS: { value: FuelType; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'hackschnitzel', label: 'Holzhackschnitzel', desc: 'Nicht BEHG-pflichtig – CO2-Kosten betragen 0 EUR', icon: Trees },
  { value: 'braunkohle', label: 'Braunkohlebriketts', desc: 'Eingabe in kg', icon: Factory },
  { value: 'erdgas_kwk', label: 'Erdgas (KWK)', desc: 'Nur bei ausdrücklichem KWK-Betrieb der Anlage', icon: Flame },
  { value: 'fluessiggas_kwk', label: 'Flüssiggas (KWK)', desc: 'Nur bei ausdrücklichem KWK-Betrieb der Anlage', icon: Zap },
  { value: 'heizoel_kwk', label: 'Heizöl (KWK)', desc: 'Nur bei ausdrücklichem KWK-Betrieb der Anlage', icon: Droplets },
];

const ALL_FUELS = [...STANDARD_FUELS, ...ADVANCED_FUELS];

export default function StepFuelSource() {
  const { wizardData, setWizardField } = useCalculator();
  const [showAdvanced, setShowAdvanced] = useState(() => {
    const currentFuel = wizardData.fuelType;
    return currentFuel ? ADVANCED_FUELS.some(f => f.value === currentFuel) : false;
  });

  const fuelEntries = wizardData.fuelEntries ?? [];
  const isMultiFuel = fuelEntries.length > 0;

  // Filter out Fernwärme if already selected as heat supply type in step 3
  const visibleStandardFuels = wizardData.heatSupplyType === 'fernwaerme'
    ? STANDARD_FUELS.filter(f => f.value !== 'fernwaerme')
    : STANDARD_FUELS;
  const visibleAllFuels = wizardData.heatSupplyType === 'fernwaerme'
    ? ALL_FUELS.filter(f => f.value !== 'fernwaerme')
    : ALL_FUELS;

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
          <p className="text-muted-foreground mt-2">Welcher Brennstoff wird für die Wärmeversorgung verwendet?</p>
        </div>

        <div className="grid gap-3">
          {visibleStandardFuels.map(opt => (
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

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Weitere Brennstoffe / KWK
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

        <Button variant="outline" size="sm" onClick={addFuelEntry} className="mt-2">
          <Plus className="h-4 w-4 mr-1" />
          Mehrere Brennstoffe kombinieren
        </Button>
      </div>
    );
  }

  // Multi-fuel mode
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Brennstoffe / Wärmequellen</h2>
        <p className="text-muted-foreground mt-2">Mehrere Brennstoffe für eine Berechnung.</p>
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
              {visibleAllFuels.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Menge (nur ganze Zahlen)</label>
                <IntegerInput
                  value={entry.amount > 0 ? entry.amount : undefined}
                  onChange={v => updateFuelEntry(index, { amount: v ?? 0 })}
                  placeholder="z.B. 45000"
                  className="px-3 py-2 text-sm"
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

      {fuelEntries.length < 3 ? (
        <Button variant="outline" size="sm" onClick={addFuelEntry}>
          <Plus className="h-4 w-4 mr-1" />
          Weiteren Brennstoff hinzufügen
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Maximal 3 Brennstoffe / Wärmequellen pro Berechnung.</p>
      )}
    </div>
  );
}
