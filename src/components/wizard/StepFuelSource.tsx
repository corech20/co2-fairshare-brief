import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType, FuelEntry } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer, Zap, Leaf, Factory, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

/** KWK options shown as concrete fuel-bound choices in the advanced section. */
const KWK_OPTIONS: { fuel: BaseFuel; label: string }[] = [
  { fuel: 'erdgas', label: 'KWK (Erdgas)' },
  { fuel: 'heizoel', label: 'KWK (Heizöl)' },
  { fuel: 'fluessiggas', label: 'KWK (Flüssiggas)' },
];

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
  // Helper: detect if any current entry is a KWK fuel (multi-fuel mode)
  const hasKwkInEntries = fuelEntries.some(e => fromFuelType(e.fuelType).kwk);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(current.kwk || hasKwkInEntries);

  // Filter out Fernwärme if already selected as heat supply type in step 3
  const visibleBaseFuels = wizardData.heatSupplyType === 'fernwaerme'
    ? BASE_FUELS.filter(f => f.value !== 'fernwaerme')
    : BASE_FUELS;

  const selectBaseFuel = (base: BaseFuel) => {
    if (isMultiFuel) {
      // Replace the first non-KWK entry's base fuel; keep KWK entries intact.
      const updated = [...fuelEntries];
      const idx = updated.findIndex(e => !fromFuelType(e.fuelType).kwk);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], fuelType: toFuelType(base, false) };
      } else {
        updated.unshift({ fuelType: toFuelType(base, false), amount: 0 });
      }
      setWizardField('fuelEntries', updated);
      return;
    }
    setWizardField('fuelType', toFuelType(base, false));
  };

  /**
   * KWK is a SEPARATE calculation path from the regular heating fuel.
   * Selecting a KWK option therefore creates an additional fuelEntry
   * alongside the regular heating fuel, with its own fuel amount input.
   * The engine processes each entry independently with its own CHP heat share.
   */
  const selectKwk = (fuel: BaseFuel) => {
    const kwkType = toFuelType(fuel, true);

    if (isMultiFuel) {
      // Toggle: if this exact KWK type already present → remove; else replace existing KWK entry or add.
      const existingKwkIdx = fuelEntries.findIndex(e => fromFuelType(e.fuelType).kwk);
      const updated = [...fuelEntries];
      if (existingKwkIdx >= 0 && updated[existingKwkIdx].fuelType === kwkType) {
        // Same KWK already selected → deselect (remove)
        updated.splice(existingKwkIdx, 1);
      } else if (existingKwkIdx >= 0) {
        updated[existingKwkIdx] = { ...updated[existingKwkIdx], fuelType: kwkType };
      } else {
        updated.push({ fuelType: kwkType, amount: 0 });
      }
      // If no entries left, fall back gracefully
      if (updated.length === 0) {
        setWizardField('fuelEntries', undefined);
      } else if (updated.length === 1 && !fromFuelType(updated[0].fuelType).kwk) {
        // Only the regular heating remains → exit multi-fuel mode
        setWizardField('fuelType', updated[0].fuelType);
        setWizardField('fuelAmount', updated[0].amount);
        setWizardField('fuelEntries', undefined);
      } else {
        setWizardField('fuelEntries', updated);
      }
      return;
    }

    // Single-fuel mode: convert into multi-fuel with [regular heating, KWK]
    const regularBase = current.base ?? 'erdgas';
    const regularType = toFuelType(regularBase, false);
    const regularEntry: FuelEntry = {
      fuelType: regularType,
      amount: wizardData.fuelAmount ?? 0,
      emissionFactorCustom: wizardData.emissionFactorCustom,
      co2CostDirect: wizardData.co2CostDirect,
      co2CostDirectType: wizardData.co2CostDirectType,
    };
    const kwkEntry: FuelEntry = { fuelType: kwkType, amount: 0 };
    setWizardField('fuelEntries', [regularEntry, kwkEntry]);
    setWizardField('fuelType', undefined);
    setWizardField('fuelAmount', undefined);
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
    // If currently KWK but new base isn't KWK-capable, fall back to non-KWK
    const keepKwk = wasKwk && KWK_CAPABLE.includes(base);
    updateFuelEntry(index, { fuelType: toFuelType(base, keepKwk) });
  };

  const updateEntryKind = (index: number, kind: 'heizung' | 'kwk') => {
    const entry = fuelEntries[index];
    const { base } = fromFuelType(entry.fuelType);
    if (kind === 'kwk') {
      // Pick a KWK-capable base; default to current if possible, else erdgas
      const target: BaseFuel = base && KWK_CAPABLE.includes(base) ? base : 'erdgas';
      updateFuelEntry(index, { fuelType: toFuelType(target, true) });
    } else {
      const target: BaseFuel = base ?? 'erdgas';
      updateFuelEntry(index, { fuelType: toFuelType(target, false) });
    }
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
    // In single-fuel mode the regular heating list never reflects KWK
    // (KWK lives in the advanced section and switches to multi-fuel on selection).
    const selectedKwkFuel: BaseFuel | undefined = undefined;
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
            <div className="mt-3 pl-6 space-y-2">
              {KWK_OPTIONS.map(opt => {
                const active = selectedKwkFuel === opt.fuel;
                return (
                  <button
                    key={opt.fuel}
                    onClick={() => selectKwk(opt.fuel)}
                    className={`w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      active
                        ? 'border-accent bg-accent/5 text-foreground shadow-sm'
                        : 'border-border bg-card text-foreground hover:border-primary/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
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
      <div className="space-y-3">
        <div>
          <Button variant="ghost" size="sm" onClick={exitMultiFuel} className="-ml-2 h-auto px-2 py-1">
            ← Zurück zur Einzelauswahl
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Wärmequellen</h2>
        <p className="text-muted-foreground text-sm">
          Fügen Sie bei Bedarf mehrere Wärmequellen hinzu.
        </p>
      </div>

      <div className="space-y-4">
        {fuelEntries.map((entry, index) => {
          const { base, kwk } = fromFuelType(entry.fuelType);
          const baseOptions = wizardData.heatSupplyType === 'fernwaerme'
            ? BASE_FUELS.filter(f => f.value !== 'fernwaerme')
            : BASE_FUELS;
          // For KWK kind, only show KWK-capable fuels
          const fuelOptionsForCard = kwk
            ? baseOptions.filter(f => KWK_CAPABLE.includes(f.value))
            : baseOptions;
          return (
            <div key={index} className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Wärmequelle {index + 1}
                </span>
                {fuelEntries.length > 1 && (
                  <button onClick={() => removeFuelEntry(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Art der Wärmequelle</label>
                <select
                  value={kwk ? 'kwk' : 'heizung'}
                  onChange={e => updateEntryKind(index, e.target.value as 'heizung' | 'kwk')}
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="heizung">Heizung</option>
                  <option value="kwk">KWK-Anlage</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Brennstoff</label>
                <select
                  value={base ?? ''}
                  onChange={e => updateEntryBase(index, e.target.value as BaseFuel)}
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {fuelOptionsForCard.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Menge
                  </label>
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
          Weitere Wärmequelle hinzufügen
        </Button>
      ) : null}
    </div>
  );
}