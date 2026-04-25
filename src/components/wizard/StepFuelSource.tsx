import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType, FuelEntry } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer, Zap, Leaf, Factory, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { IntegerInput } from './IntegerInput';

/** UI-level base fuel/heat source – KWK is a separate technique flag. */
type BaseFuel = 'erdgas' | 'heizoel' | 'fernwaerme' | 'fluessiggas' | 'pellets' | 'kohle';

const BASE_FUELS: { value: BaseFuel; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'erdgas', label: 'Erdgas', desc: 'Eingabe in kWh (Brennwert/Hs) lt. Gasabrechnung', icon: Flame },
  { value: 'heizoel', label: 'Heizöl', desc: 'Eingabe in Litern lt. Lieferschein oder Abrechnung', icon: Droplets },
  { value: 'fernwaerme', label: 'Fernwärme / Nahwärme', desc: 'Eingabe in kWh – Emissionsfaktor wird separat abgefragt', icon: Thermometer },
  { value: 'fluessiggas', label: 'Flüssiggas (LPG)', desc: 'Eingabe in kg lt. Abrechnung', icon: Zap },
  { value: 'pellets', label: 'Holzpellets', desc: 'Nicht BEHG-pflichtig – keine CO2-Kosten', icon: Leaf },
  { value: 'kohle', label: 'Kohle', desc: 'Eingabe in kg (Braunkohlebriketts)', icon: Factory },
];

/** Fuels that have a KWK variant in the engine. */
const KWK_CAPABLE: BaseFuel[] = ['erdgas', 'heizoel', 'fluessiggas'];

/** Map (baseFuel, kwk) → internal engine FuelType. */
function toFuelType(base: BaseFuel, kwk: boolean): FuelType {
  if (base === 'kohle') return 'braunkohle';
  if (kwk && KWK_CAPABLE.includes(base)) {
    if (base === 'erdgas') return 'erdgas_kwk';
    if (base === 'heizoel') return 'heizoel_kwk';
    if (base === 'fluessiggas') return 'fluessiggas_kwk';
  }
  return base as FuelType;
}

/** Inverse: internal FuelType → (baseFuel, kwk). */
function fromFuelType(ft: FuelType | undefined): { base: BaseFuel | undefined; kwk: boolean } {
  if (!ft) return { base: undefined, kwk: false };
  switch (ft) {
    case 'erdgas_kwk': return { base: 'erdgas', kwk: true };
    case 'heizoel_kwk': return { base: 'heizoel', kwk: true };
    case 'fluessiggas_kwk': return { base: 'fluessiggas', kwk: true };
    case 'braunkohle': return { base: 'kohle', kwk: false };
    case 'erdgas': case 'heizoel': case 'fernwaerme': case 'fluessiggas': case 'pellets':
      return { base: ft as BaseFuel, kwk: false };
    default:
      return { base: undefined, kwk: false };
  }
}

export default function StepFuelSource() {
  const { wizardData, setWizardField } = useCalculator();

  const fuelEntries = wizardData.fuelEntries ?? [];
  const isMultiFuel = fuelEntries.length > 0;

  const current = fromFuelType(wizardData.fuelType);
  const [kwkChecked, setKwkChecked] = useState<boolean>(current.kwk);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(current.kwk);

  // Filter out Fernwärme if already selected as heat supply type in step 3
  const visibleBaseFuels = wizardData.heatSupplyType === 'fernwaerme'
    ? BASE_FUELS.filter(f => f.value !== 'fernwaerme')
    : BASE_FUELS;

  const selectBaseFuel = (base: BaseFuel) => {
    const useKwk = kwkChecked && KWK_CAPABLE.includes(base);
    setWizardField('fuelType', toFuelType(base, useKwk));
    if (fuelEntries.length > 0) setWizardField('fuelEntries', undefined);
  };

  const toggleKwk = (checked: boolean) => {
    setKwkChecked(checked);
    // Re-derive currently selected fuel if applicable
    if (current.base && KWK_CAPABLE.includes(current.base)) {
      setWizardField('fuelType', toFuelType(current.base, checked));
    }
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

  const updateEntryBase = (index: number, base: BaseFuel) => {
    const entry = fuelEntries[index];
    const wasKwk = fromFuelType(entry.fuelType).kwk;
    updateFuelEntry(index, { fuelType: toFuelType(base, wasKwk && KWK_CAPABLE.includes(base)) });
  };

  const toggleEntryKwk = (index: number, checked: boolean) => {
    const entry = fuelEntries[index];
    const { base } = fromFuelType(entry.fuelType);
    if (!base) return;
    updateFuelEntry(index, { fuelType: toFuelType(base, checked && KWK_CAPABLE.includes(base)) });
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
    const selectedBase = current.base;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Heizungsart</h2>
          <p className="text-muted-foreground mt-2">Welcher Brennstoff wird für die Wärmeversorgung verwendet?</p>
        </div>

        <div className="grid gap-3">
          {visibleBaseFuels.map(opt => {
            const active = selectedBase === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectBaseFuel(opt.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md flex items-start gap-4 ${
                  active ? 'border-accent bg-accent/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <opt.icon className={`h-5 w-5 mt-0.5 shrink-0 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                <div>
                  <div className="font-semibold text-foreground text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors w-full"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            <span>Besondere Anlagentechnik</span>
            <span className="text-xs text-muted-foreground font-normal ml-1">optional – nur auswählen, wenn bekannt</span>
          </button>
          {showAdvanced && (
            <div className="mt-3 pl-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={kwkChecked}
                  onCheckedChange={(v) => toggleKwk(v === true)}
                  disabled={selectedBase ? !KWK_CAPABLE.includes(selectedBase) : false}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">KWK-Anlage (Kraft-Wärme-Kopplung)</div>
                  <div className="text-xs text-muted-foreground mt-0.5">z. B. Blockheizkraftwerk</div>
                  {selectedBase && !KWK_CAPABLE.includes(selectedBase) && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      Für die gewählte Heizungsart nicht anwendbar.
                    </div>
                  )}
                </div>
              </label>
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
  const exitMultiFuel = () => {
    const first = fuelEntries[0];
    setWizardField('fuelEntries', undefined);
    if (first) {
      setWizardField('fuelType', first.fuelType);
      setWizardField('fuelAmount', first.amount);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Brennstoffe / Wärmequellen</h2>
          <p className="text-muted-foreground mt-2">Mehrere Brennstoffe für eine Berechnung.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={exitMultiFuel}>
          Zurück zur Einzelauswahl
        </Button>
      </div>

      <div className="space-y-4">
        {fuelEntries.map((entry, index) => {
          const { base, kwk } = fromFuelType(entry.fuelType);
          const baseOptions = wizardData.heatSupplyType === 'fernwaerme'
            ? BASE_FUELS.filter(f => f.value !== 'fernwaerme')
            : BASE_FUELS;
          const kwkApplicable = base ? KWK_CAPABLE.includes(base) : false;
          return (
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
                value={base ?? ''}
                onChange={e => updateEntryBase(index, e.target.value as BaseFuel)}
                className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {baseOptions.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {kwkApplicable && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={kwk}
                    onCheckedChange={(v) => toggleEntryKwk(index, v === true)}
                  />
                  <span>KWK-Anlage (Kraft-Wärme-Kopplung)</span>
                </label>
              )}
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
          );
        })}
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