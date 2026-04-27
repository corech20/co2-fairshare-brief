import { useCalculator } from '@/context/CalculatorContext';
import type { FuelType, FuelEntry } from '@/lib/calculator/types';
import { Flame, Droplets, Thermometer, Zap, Leaf, Factory, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/** UI-level base fuel/heat source – KWK is a separate technique. */
type BaseFuel = 'erdgas' | 'heizoel' | 'fernwaerme' | 'fluessiggas' | 'pellets' | 'kohle';

const BASE_FUELS: { value: BaseFuel; label: string; desc: string; icon: typeof Flame }[] = [
  { value: 'erdgas', label: 'Erdgas', desc: 'Eingabe in kWh (Brennwert/Hs) lt. Gasabrechnung', icon: Flame },
  { value: 'heizoel', label: 'Heizöl', desc: 'Eingabe in Litern lt. Lieferschein oder Abrechnung', icon: Droplets },
  { value: 'fernwaerme', label: 'Fernwärme / Nahwärme', desc: 'Eingabe in kWh – Emissionsfaktor wird separat abgefragt', icon: Thermometer },
  { value: 'fluessiggas', label: 'Flüssiggas (LPG)', desc: 'Eingabe in kg lt. Abrechnung', icon: Zap },
  { value: 'pellets', label: 'Holzpellets', desc: 'Nicht BEHG-pflichtig – keine CO2-Kosten', icon: Leaf },
  { value: 'kohle', label: 'Kohle', desc: 'Eingabe in kg (Braunkohlebriketts)', icon: Factory },
];

/** KWK options shown in the "Besondere Anlagentechnik" collapsible. */
const KWK_OPTIONS: { fuel: BaseFuel; label: string; type: FuelType }[] = [
  { fuel: 'erdgas', label: 'KWK (Erdgas)', type: 'erdgas_kwk' },
  { fuel: 'heizoel', label: 'KWK (Heizöl)', type: 'heizoel_kwk' },
  { fuel: 'fluessiggas', label: 'KWK (Flüssiggas)', type: 'fluessiggas_kwk' },
];

/** Map UI base fuel → internal engine FuelType (non-KWK). */
function baseToFuelType(base: BaseFuel): FuelType {
  if (base === 'kohle') return 'braunkohle';
  return base as FuelType;
}

/** Inverse: internal FuelType → UI base fuel (ignoring KWK distinction). */
function fuelTypeToBase(ft: FuelType): BaseFuel | undefined {
  switch (ft) {
    case 'erdgas': case 'erdgas_kwk': return 'erdgas';
    case 'heizoel': case 'heizoel_kwk': return 'heizoel';
    case 'fluessiggas': case 'fluessiggas_kwk': return 'fluessiggas';
    case 'fernwaerme': return 'fernwaerme';
    case 'pellets': return 'pellets';
    case 'braunkohle': return 'kohle';
    default: return undefined;
  }
}

function isKwkType(ft: FuelType): boolean {
  return ft === 'erdgas_kwk' || ft === 'heizoel_kwk' || ft === 'fluessiggas_kwk';
}

/** Sort order index for input blocks (regular fuels first, then KWK in fixed order). */
const SORT_ORDER: Record<FuelType, number> = {
  erdgas: 1,
  heizoel: 2,
  fernwaerme: 3,
  fluessiggas: 4,
  pellets: 5,
  braunkohle: 6,
  hackschnitzel: 7,
  abfallholz: 8,
  erdgas_kwk: 11,
  heizoel_kwk: 12,
  fluessiggas_kwk: 13,
};

function sortEntries(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => (SORT_ORDER[a.fuelType] ?? 99) - (SORT_ORDER[b.fuelType] ?? 99));
}

export default function StepFuelSource() {
  const { wizardData, setWizardField } = useCalculator();

  const fuelEntries = wizardData.fuelEntries ?? [];
  const isMulti = fuelEntries.length > 0;

  // Effective primary fuel and selected KWK types for UI state
  const primaryFuelType: FuelType | undefined = isMulti
    ? fuelEntries.find(e => !isKwkType(e.fuelType))?.fuelType
    : wizardData.fuelType;
  const primaryBase = primaryFuelType ? fuelTypeToBase(primaryFuelType) : undefined;

  const selectedKwkTypes = new Set<FuelType>(
    fuelEntries.filter(e => isKwkType(e.fuelType)).map(e => e.fuelType)
  );

  // Additional regular fuels beyond the primary
  const additionalEntries = isMulti
    ? fuelEntries.filter(e => !isKwkType(e.fuelType)).slice(1)
    : [];

  const [showAdvanced, setShowAdvanced] = useState<boolean>(selectedKwkTypes.size > 0);

  // Filter Fernwärme out if already chosen as heat supply type
  const visibleBaseFuels = wizardData.heatSupplyType === 'fernwaerme'
    ? BASE_FUELS.filter(f => f.value !== 'fernwaerme')
    : BASE_FUELS;

  /** Build a fresh fuelEntries list and persist (also resorting). */
  const persistEntries = (entries: FuelEntry[]) => {
    if (entries.length === 0) {
      setWizardField('fuelEntries', undefined);
      return;
    }
    setWizardField('fuelEntries', sortEntries(entries));
    // When multi-fuel mode is active, single-fuel fields are cleared to avoid double-counting.
    setWizardField('fuelType', undefined);
    setWizardField('fuelAmount', undefined);
  };

  /** Convert current single-fuel state to a fuelEntries array (for adding KWK or extra fuels). */
  const ensureMultiFuel = (): FuelEntry[] => {
    if (isMulti) return [...fuelEntries];
    if (!wizardData.fuelType) return [];
    return [{
      fuelType: wizardData.fuelType,
      amount: wizardData.fuelAmount ?? 0,
      emissionFactorCustom: wizardData.emissionFactorCustom,
      co2CostDirect: wizardData.co2CostDirect,
      co2CostDirectType: wizardData.co2CostDirectType,
    }];
  };

  /** Click on a base fuel card – sets/replaces the primary regular fuel. */
  const selectPrimaryBase = (base: BaseFuel) => {
    const newType = baseToFuelType(base);
    if (!isMulti) {
      setWizardField('fuelType', newType);
      // Reset amount/emission factor when switching fuel kind
      setWizardField('fuelAmount', undefined);
      setWizardField('emissionFactorCustom', undefined);
      return;
    }
    // Multi mode: replace the first non-KWK entry's fuel type
    const updated = [...fuelEntries];
    const idx = updated.findIndex(e => !isKwkType(e.fuelType));
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], fuelType: newType, amount: 0, emissionFactorCustom: undefined };
    } else {
      updated.unshift({ fuelType: newType, amount: 0 });
    }
    persistEntries(updated);
  };

  /** Toggle a KWK option (add/remove an independent entry). */
  const toggleKwk = (type: FuelType) => {
    const base = ensureMultiFuel();
    const idx = base.findIndex(e => e.fuelType === type);
    if (idx >= 0) {
      base.splice(idx, 1);
    } else {
      base.push({ fuelType: type, amount: 0 });
    }
    // If after toggle there's only one regular entry left and no KWK, fall back to single-fuel mode
    if (base.length === 1 && !isKwkType(base[0].fuelType)) {
      setWizardField('fuelType', base[0].fuelType);
      setWizardField('fuelAmount', base[0].amount > 0 ? base[0].amount : undefined);
      setWizardField('emissionFactorCustom', base[0].emissionFactorCustom);
      setWizardField('fuelEntries', undefined);
      return;
    }
    persistEntries(base);
  };

  /** Add an additional regular fuel block. */
  const addAdditionalFuel = () => {
    const base = ensureMultiFuel();
    // Default new fuel to first available not yet selected as primary; fallback Erdgas
    const usedRegularTypes = new Set(base.filter(e => !isKwkType(e.fuelType)).map(e => e.fuelType));
    const candidate = visibleBaseFuels
      .map(f => baseToFuelType(f.value))
      .find(t => !usedRegularTypes.has(t)) ?? 'erdgas';
    base.push({ fuelType: candidate, amount: 0 });
    persistEntries(base);
  };

  const removeAdditional = (fuelType: FuelType) => {
    const base = fuelEntries.filter(e => e.fuelType !== fuelType || isKwkType(e.fuelType));
    // Need to remove only ONE matching entry (not all duplicates) – but additionals are unique-by-type via add logic.
    // Recompute by mapping: remove first occurrence in additional list.
    const withoutOne: FuelEntry[] = [];
    let removed = false;
    for (const e of fuelEntries) {
      if (!removed && !isKwkType(e.fuelType) && e.fuelType === fuelType) {
        // Skip the primary occurrence first? We want to remove an ADDITIONAL entry.
        // Find primary index first
        const primaryIdx = fuelEntries.findIndex(x => !isKwkType(x.fuelType));
        if (fuelEntries.indexOf(e) !== primaryIdx) {
          removed = true;
          continue;
        }
      }
      withoutOne.push(e);
    }
    // Fallback: if nothing removed, drop first non-primary regular with that type
    const finalList = removed ? withoutOne : base;
    if (finalList.length === 1 && !isKwkType(finalList[0].fuelType)) {
      setWizardField('fuelType', finalList[0].fuelType);
      setWizardField('fuelAmount', finalList[0].amount > 0 ? finalList[0].amount : undefined);
      setWizardField('emissionFactorCustom', finalList[0].emissionFactorCustom);
      setWizardField('fuelEntries', undefined);
      return;
    }
    persistEntries(finalList);
  };

  const changeAdditionalType = (oldType: FuelType, newBase: BaseFuel) => {
    const newType = baseToFuelType(newBase);
    if (newType === oldType) return;
    const updated = [...fuelEntries];
    // Find the additional entry: a non-KWK entry that is NOT the first non-KWK
    const primaryIdx = updated.findIndex(e => !isKwkType(e.fuelType));
    let targetIdx = -1;
    for (let i = 0; i < updated.length; i++) {
      if (i === primaryIdx) continue;
      if (!isKwkType(updated[i].fuelType) && updated[i].fuelType === oldType) { targetIdx = i; break; }
    }
    if (targetIdx === -1) return;
    updated[targetIdx] = { ...updated[targetIdx], fuelType: newType, emissionFactorCustom: undefined };
    persistEntries(updated);
  };

  const fuelLabel = (ft: FuelType): string => {
    const base = fuelTypeToBase(ft);
    const baseEntry = BASE_FUELS.find(b => b.value === base);
    return baseEntry?.label ?? ft;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Heizungsart</h2>
        <p className="text-muted-foreground mt-2">Welcher Brennstoff wird für die Wärmeversorgung verwendet?</p>
      </div>

      {/* 1. Base fuel cards (single-select primary) */}
      <div className="grid gap-3">
        {visibleBaseFuels.map(opt => {
          const active = primaryBase === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => selectPrimaryBase(opt.value)}
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

      {/* 2. Additional fuels section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Gibt es einen weiteren Brennstoff?</h3>

        {additionalEntries.length > 0 && (
          <div className="space-y-2">
            {additionalEntries.map((entry) => (
              <div
                key={`add-${entry.fuelType}`}
                className="flex items-center gap-2 rounded-lg border-2 border-border bg-card px-3 py-2"
              >
                <select
                  value={fuelTypeToBase(entry.fuelType) ?? ''}
                  onChange={e => changeAdditionalType(entry.fuelType, e.target.value as BaseFuel)}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                >
                  {visibleBaseFuels.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeAdditional(entry.fuelType)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Entfernen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={addAdditionalFuel}
          disabled={!primaryFuelType}
        >
          <Plus className="h-4 w-4 mr-1" />
          Weiteren Brennstoff hinzufügen
        </Button>
      </div>

      {/* 3. Besondere Anlagentechnik (collapsible, KWK options) */}
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
              const active = selectedKwkTypes.has(opt.type);
              return (
                <button
                  key={opt.type}
                  onClick={() => toggleKwk(opt.type)}
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
    </div>
  );
}
