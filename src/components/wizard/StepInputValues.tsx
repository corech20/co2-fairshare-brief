import { useCalculator } from '@/context/CalculatorContext';
import type { CostInputType, AddressData, FuelType, FuelEntry } from '@/lib/calculator/types';
import { isCrossYearPeriod } from '@/lib/calculator/engine';
import { isReimbursementEligible } from '@/lib/calculator/pdf-helpers';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IntegerInput } from './IntegerInput';

/** Per-entry label/unit/hint helpers for multi-fuel input blocks. */
function getEntryLabel(ft: FuelType): string {
  switch (ft) {
    case 'erdgas': return 'Erdgas';
    case 'heizoel': return 'Heizöl';
    case 'fernwaerme': return 'Fernwärme / Nahwärme';
    case 'fluessiggas': return 'Flüssiggas (LPG)';
    case 'pellets': return 'Holzpellets';
    case 'braunkohle': return 'Kohle';
    case 'hackschnitzel': return 'Hackschnitzel';
    case 'erdgas_kwk': return 'KWK (Erdgas)';
    case 'heizoel_kwk': return 'KWK (Heizöl)';
    case 'fluessiggas_kwk': return 'KWK (Flüssiggas)';
    default: return ft;
  }
}
function getEntryUnit(ft: FuelType): string {
  switch (ft) {
    case 'heizoel': case 'heizoel_kwk': return 'Liter';
    case 'fluessiggas': case 'fluessiggas_kwk': case 'pellets': case 'hackschnitzel': case 'braunkohle': return 'kg';
    default: return 'kWh';
  }
}
function getEntryHint(ft: FuelType): string {
  switch (ft) {
    case 'erdgas': case 'erdgas_kwk':
      return 'Verbrauch in kWh (Brennwert/Hs) lt. Gasabrechnung. Nur ganze Zahlen.';
    case 'heizoel': case 'heizoel_kwk':
      return 'Verbrauch in Litern (nur ganze Zahlen).';
    case 'fluessiggas': case 'fluessiggas_kwk':
      return 'Verbrauch in kg (nur ganze Zahlen).';
    case 'pellets':
      return 'Holzpellets sind nicht BEHG-pflichtig; daher werden keine aufzuteilenden CO2-Kosten angesetzt.';
    case 'braunkohle':
      return 'Verbrauch in kg (Braunkohlebriketts, nur ganze Zahlen).';
    case 'fernwaerme':
      return 'Verbrauch in kWh (nur ganze Zahlen).';
    default:
      return 'Nur ganze Zahlen.';
  }
}

function InputField({ label, hint, value, onChange, type = 'number', placeholder, unit }: {
  label: string; hint?: string; value: string | number | undefined;
  onChange: (v: string) => void; type?: string; placeholder?: string; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full box-border h-12 rounded-lg border-2 border-border bg-card px-4 py-3 text-base leading-tight text-foreground focus:border-accent focus:outline-none transition-colors pr-16"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AddressFields({ title, address, onChangeAddress, showApartment }: {
  title: string;
  address?: AddressData;
  onChangeAddress: (a: AddressData) => void;
  showApartment?: boolean;
}) {
  const addr = address || {};
  const set = (field: keyof AddressData, value: string) => {
    onChangeAddress({ ...addr, [field]: value || undefined });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <div className="relative">
            <select
              value={addr.salutation || ''}
              onChange={e => set('salutation', e.target.value)}
              className="block w-full box-border h-12 appearance-none rounded-lg border-2 border-border bg-card px-4 py-3 pr-10 text-base leading-tight text-foreground focus:border-accent focus:outline-none transition-colors"
            >
              <option value="">Anrede</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
              <option value="Firma">Firma</option>
            </select>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
            </svg>
          </div>
        </div>
        <InputField label="" value={addr.firstName} onChange={v => set('firstName', v)} type="text" placeholder="Vorname" />
        <InputField label="" value={addr.lastName} onChange={v => set('lastName', v)} type="text" placeholder="Nachname" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <InputField label="" value={addr.street} onChange={v => set('street', v)} type="text" placeholder="Straße" />
        </div>
        <InputField label="" value={addr.houseNumber} onChange={v => set('houseNumber', v)} type="text" placeholder="Nr." />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <InputField label="" value={addr.postalCode} onChange={v => set('postalCode', v)} type="text" placeholder="PLZ" />
        <div className="sm:col-span-2">
          <InputField label="" value={addr.city} onChange={v => set('city', v)} type="text" placeholder="Ort" />
        </div>
      </div>
      {showApartment && (
        <InputField label="" value={addr.apartmentDesignation} onChange={v => set('apartmentDesignation', v)} type="text" placeholder="Wohnungsbezeichnung / Lage (optional)" />
      )}
    </div>
  );
}

export default function StepInputValues() {
  const { wizardData, setWizardField } = useCalculator();
  const [showPdfSection, setShowPdfSection] = useState(() => {
    // Show if any address data already entered
    const hasAddr = wizardData.tenantAddress || wizardData.landlordAddress;
    return !!hasAddr;
  });

  const isMultiFuel = false;
  const expertMode = false;
  const needsApartmentArea = wizardData.heatSupplyType === 'etage' ||
    (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
  const needsBuildingArea = !needsApartmentArea;
  // Hide the optional building total area for tenant self-/direct-supply cases:
  //   1) tenant + apartment-owned heating (etage)
  //   2) tenant + district heating (always direct supply in tenant flow)
  const hideOptionalBuildingArea =
    wizardData.userRole === 'mieter' && (
      wizardData.heatSupplyType === 'etage' ||
      wizardData.heatSupplyType === 'fernwaerme'
    );
  const showOptionalBuildingArea = needsApartmentArea && !hideOptionalBuildingArea;

  // Clear stale value when the optional field becomes irrelevant, so it cannot block the flow
  // or feed into calculations. Only clears in the two whitelist cases above.
  useEffect(() => {
    if (hideOptionalBuildingArea && wizardData.buildingArea != null) {
      setWizardField('buildingArea', undefined);
    }
  }, [hideOptionalBuildingArea, wizardData.buildingArea, setWizardField]);

  const isTenantApartmentHeating = wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'etage';
  const showGasDeviceQuestion = isTenantApartmentHeating &&
    (wizardData.fuelType === 'erdgas' || wizardData.fuelType === 'erdgas_kwk');
  const isTenant = wizardData.userRole === 'mieter';
  const isNonResidential = wizardData.buildingType === 'nichtwohngebaeude';
  // Adressdaten-Sektion: bei Mietern nur, wenn ein echter Erstattungsfall vorliegt.
  // Bei Vermietern: weiterhin optional für personalisierte Dokumente.
  const reimbursementEligible = isReimbursementEligible(wizardData);
  const showAddressSection = isTenant ? reimbursementEligible : true;

  // Cross-year: fuel amount is entered per segment on billing period step
  const crossYear = wizardData.billingPeriodStart && wizardData.billingPeriodEnd
    ? isCrossYearPeriod(wizardData.billingPeriodStart, wizardData.billingPeriodEnd)
    : false;

  const fuelUnit = (() => {
    switch (wizardData.fuelType) {
      case 'heizoel': case 'heizoel_kwk': return 'Liter';
      case 'fluessiggas': case 'fluessiggas_kwk': return 'kg';
      case 'pellets': case 'hackschnitzel': case 'braunkohle': return 'kg';
      default: return 'kWh';
    }
  })();

  // Dynamic fuel label
  const fuelLabel = (() => {
    switch (wizardData.fuelType) {
      case 'heizoel': case 'heizoel_kwk': return 'Heizölverbrauch';
      case 'fernwaerme': return 'Fernwärmemenge';
      case 'fluessiggas': case 'fluessiggas_kwk': return 'Flüssiggasmenge';
      case 'pellets': return 'Pelletverbrauch';
      case 'hackschnitzel': return 'Hackschnitzelverbrauch';
      case 'braunkohle': return 'Braunkohleverbrauch';
      default: return 'Erdgasverbrauch in kWh (Brennwert, Hs)';
    }
  })();

  // Dynamic area label
  const getAreaLabel = () => {
    if (isNonResidential) {
      return isTenant ? 'Mietfläche' : 'Gesamtnutzfläche des Gebäudes';
    }
    // Wohngebäude
    if (needsApartmentArea) return 'Wohnfläche der Wohnung';
    return isTenant ? 'Wohnfläche der Wohnung' : 'Gesamtwohnfläche des Gebäudes';
  };

  const getAreaHint = () => {
    if (isNonResidential) {
      return isTenant ? 'Mietfläche Ihrer Einheit' : undefined;
    }
    if (needsApartmentArea) return undefined;
    return isTenant ? undefined : undefined;
  };

  const hasDirectCost = wizardData.co2CostDirect != null && wizardData.co2CostDirect > 0;
  const hasDirectEmissions = wizardData.co2EmissionsDirect != null && wizardData.co2EmissionsDirect > 0;

  // Expertenmodus dauerhaft deaktiviert: Multi-Fuel-Einträge auf Single-Fuel zurückführen
  // und etwaige Expertenmodus-Flags zurücksetzen.
  useEffect(() => {
    if (wizardData.expertMode) setWizardField('expertMode', false);
    if (wizardData.fuelEntries && wizardData.fuelEntries.length > 0) {
      const primary = wizardData.fuelEntries.find(e => !e.fuelType.endsWith('_kwk')) ?? wizardData.fuelEntries[0];
      setWizardField('fuelType', primary.fuelType);
      setWizardField('fuelEntries', undefined);
    }
  }, [wizardData.expertMode, wizardData.fuelEntries, setWizardField]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Berechnungsdaten</h2>
        <p className="text-muted-foreground mt-2">Geben Sie die Verbrauchsdaten und Flächen ein. Die meisten Werte können direkt aus Ihrer Energieabrechnung übernommen werden.</p>
      </div>

      <div className="space-y-5">
        {/* Area fields */}
        {needsBuildingArea && (
          <InputField
            label={getAreaLabel()}
            hint={getAreaHint()}
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 500"
            unit="m²"
          />
        )}

        {needsApartmentArea && (
          <InputField
            label={getAreaLabel()}
            hint={getAreaHint()}
            value={wizardData.apartmentArea}
            onChange={v => setWizardField('apartmentArea', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 80"
            unit="m²"
          />
        )}

        {showOptionalBuildingArea && (
          <InputField
            label="Gesamtwohnfläche des Gebäudes (optional)"
            hint="Gesamtwohnfläche des Gebäudes, falls bekannt"
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 500"
            unit="m²"
          />
        )}

        {/* Expert-mode toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Expertenmodus</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Eingabe der Brennstoffmenge (kWh, Liter, kg) statt CO2-Emissionen.
                Mehrere Brennstoffe und KWK werden ebenfalls nur hier angeboten.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={expertMode}
            onClick={() => setWizardField('expertMode', !expertMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              expertMode ? 'bg-accent' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${
                expertMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* ── Standard mode: primary input is CO2 emissions (kg) ───────────── */}
        {!expertMode && (
          <div className="space-y-4 rounded-xl border-2 border-border bg-card p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Werte aus Ihrer Abrechnung</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Bitte tragen Sie beide Werte für den gesamten Rechnungszeitraum genau so ein,
                wie sie in Ihrer Wärmeliefer- oder Brennstoffabrechnung ausgewiesen sind.
              </p>
            </div>

            {/* CO2-Emissionen (kg) – Pflicht */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">CO2-Emissionen lt. Abrechnung</label>
              <div className="relative">
                <IntegerInput
                  value={wizardData.co2EmissionsDirect}
                  onChange={v => setWizardField('co2EmissionsDirect', v)}
                  placeholder="z. B. 1800"
                  className="pr-16"
                />
                <span className="absolute right-4 top-[1.05rem] text-sm text-muted-foreground pointer-events-none">kg</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Wird auf ein Jahr normiert und für die Einstufung nach dem Stufenmodell verwendet.
              </p>
            </div>

            {/* CO2-Kosten (EUR) – Pflicht */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">CO2-Kosten lt. Abrechnung</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={wizardData.co2CostDirect ?? ''}
                  onChange={e => setWizardField('co2CostDirect', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="z. B. 250"
                  className="block w-full box-border h-12 rounded-lg border-2 border-border bg-card px-4 py-3 text-base leading-tight text-foreground focus:border-accent focus:outline-none transition-colors pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">EUR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Exakter Rechnungsbetrag der CO2-Kosten – wird anschließend nach dem Stufenmodell verteilt.
              </p>
            </div>

            {/* Brutto/Netto-Schalter direkt im Block */}
            {hasDirectCost && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Art des eingegebenen Betrags</label>
                <div className="flex gap-3">
                  {([
                    { value: 'brutto' as CostInputType, label: 'Brutto (inkl. USt.)' },
                    { value: 'netto' as CostInputType, label: 'Netto (zzgl. USt.)' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setWizardField('co2CostDirectType', opt.value)}
                      className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        (wizardData.co2CostDirectType ?? 'brutto') === opt.value
                          ? 'border-accent bg-accent/5 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multi-fuel: one input block per selected position (expert only) */}
        {expertMode && isMultiFuel && (
          <div className="space-y-4">
            {wizardData.fuelEntries!.map((entry: FuelEntry, idx: number) => (
              <div key={`${entry.fuelType}-${idx}`} className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{getEntryLabel(entry.fuelType)}</div>
                  {wizardData.fuelEntries!.length > 1 && (
                    <button
                      type="button"
                      aria-label="Eingabeblock entfernen"
                      onClick={() => {
                        const updated = wizardData.fuelEntries!.filter((_, i) => i !== idx);
                        setWizardField('fuelEntries', updated);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors -mr-1 -mt-1 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Menge</label>
                  <div className="relative">
                    <IntegerInput
                      value={entry.amount > 0 ? entry.amount : undefined}
                      onChange={v => {
                        const updated = [...wizardData.fuelEntries!];
                        updated[idx] = { ...updated[idx], amount: v ?? 0 };
                        setWizardField('fuelEntries', updated);
                      }}
                      placeholder="z. B. 45000"
                      className="pr-16"
                    />
                    <span className="absolute right-4 top-[1.05rem] text-sm text-muted-foreground pointer-events-none">{getEntryUnit(entry.fuelType)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{getEntryHint(entry.fuelType)}</p>
                </div>
                {entry.fuelType === 'fernwaerme' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Emissionsfaktor (kg CO2/kWh)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={entry.emissionFactorCustom ?? ''}
                      onChange={e => {
                        const updated = [...wizardData.fuelEntries!];
                        updated[idx] = { ...updated[idx], emissionFactorCustom: parseFloat(e.target.value) || undefined };
                        setWizardField('fuelEntries', updated);
                      }}
                      placeholder="z. B. 0.18"
                      className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fuel amount – expert mode only */}
        {expertMode && !isMultiFuel && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{fuelLabel}</label>
            <div className="relative">
              <IntegerInput
                value={wizardData.fuelAmount}
                onChange={v => setWizardField('fuelAmount', v)}
                placeholder={`z. B. ${wizardData.fuelType === 'heizoel' ? '3000' : '50000'}`}
                className="pr-16"
              />
              <span className="absolute right-4 top-[1.05rem] text-sm text-muted-foreground pointer-events-none">{fuelUnit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {wizardData.fuelType === 'erdgas' || wizardData.fuelType === 'erdgas_kwk'
                ? 'Verbrauch in kWh lt. Abrechnung (Brennwert/Hs) für den gesamten Rechnungszeitraum. Nur ganze Zahlen – wird intern auf Heizwert umgerechnet.'
                : `Verbrauch in ${fuelUnit} für den gesamten Rechnungszeitraum (nur ganze Zahlen).`}
            </p>
            {crossYear && (
              <p className="text-xs text-muted-foreground">
                Bei jahresübergreifenden Zeiträumen bitte die Gesamtmenge des gesamten Rechnungszeitraums eingeben – keine Aufteilung nach Kalenderjahren.
              </p>
            )}
          </div>
        )}

        {/* District heating emission factor */}
        {expertMode && !isMultiFuel && wizardData.fuelType === 'fernwaerme' && (
          <InputField
            label="Emissionsfaktor Fernwärme"
            hint="Vom Fernwärmeversorger mitgeteilt (kg CO2/kWh)"
            value={wizardData.emissionFactorCustom}
            onChange={v => setWizardField('emissionFactorCustom', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 0.18"
            unit="kg CO2/kWh"
          />
        )}

        {expertMode && !isMultiFuel && wizardData.fuelType === 'fernwaerme' && !wizardData.emissionFactorCustom && (
          <p className="text-xs text-destructive">Bitte geben Sie den Emissionsfaktor aus Ihrer Fernwärmeabrechnung an.</p>
        )}

        {/* Direct CO2 cost (Expertenmodus only) */}
        {expertMode && (
          <InputField
            label="CO2-Kosten direkt eingeben (optional)"
            hint="Nur ausfüllen, wenn der CO2-Betrag in Ihrer Abrechnung bereits direkt ausgewiesen ist."
            value={wizardData.co2CostDirect}
            onChange={v => setWizardField('co2CostDirect', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 250"
            unit="EUR"
          />
        )}

        {/* Gross / Net selector – Expertenmodus only (Standard hat eigenen Schalter im Block) */}
        {expertMode && hasDirectCost && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Art des eingegebenen Betrags</label>
            <div className="flex gap-3">
              {([
                { value: 'brutto' as CostInputType, label: 'Brutto (inkl. USt.)' },
                { value: 'netto' as CostInputType, label: 'Netto (zzgl. USt.)' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setWizardField('co2CostDirectType', opt.value)}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    (wizardData.co2CostDirectType ?? 'brutto') === opt.value
                      ? 'border-accent bg-accent/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
          </div>
            <p className="text-xs text-muted-foreground">
              {(wizardData.co2CostDirectType ?? 'brutto') === 'netto'
                ? 'Der Nettobetrag wird mit dem jeweils geltenden USt.-Satz auf den Bruttobetrag hochgerechnet.'
                : 'Der eingegebene Betrag wird als Bruttobetrag (inkl. USt.) verwendet.'}
            </p>
          </div>
        )}

        {/* Tenant apartment heating: extra gas device question */}
        {showGasDeviceQuestion && (
          <div className="rounded-xl border-2 border-border bg-card p-5 space-y-3">
            <label className="text-sm font-medium text-foreground">
              Gibt es in der Wohnung zusätzlich ein Gasgerät ohne eigenen Zähler, z.&nbsp;B. einen Gasherd?
            </label>
            <div className="flex gap-3">
              {([
                { value: true, label: 'Ja' },
                { value: false, label: 'Nein' },
              ]).map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setWizardField('hasExtraGasDevice', opt.value)}
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                    wizardData.hasExtraGasDevice === opt.value
                      ? 'border-accent bg-accent/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {wizardData.hasExtraGasDevice === true && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Der mögliche Erstattungsanspruch gegenüber dem Vermieter wird pauschal um 5 % gekürzt.
              </p>
            )}
          </div>
        )}

        {/* ── PDF Address section (collapsible) ─────────────────────────── */}
        {showAddressSection && (
        <div className="border-t border-border pt-5 mt-6 space-y-4">
          <button
            onClick={() => setShowPdfSection(!showPdfSection)}
            className="flex items-center gap-2 w-full text-left"
          >
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPdfSection ? 'rotate-180' : ''}`} />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isTenant ? 'Adressdaten für ein Erstattungsschreiben (optional)' : 'Adressdaten für ein personalisiertes Dokument (optional)'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                 {isTenant
                   ? 'Nur erforderlich, wenn Sie ein Erstattungsschreiben an den Vermieter erstellen möchten. Für den reinen Berechnungsnachweis sind keine Adressdaten nötig.'
                   : 'Nur erforderlich, wenn ein personalisiertes Dokument gewünscht ist. Für den Berechnungsnachweis sind keine Adressdaten nötig.'}
              </p>
            </div>
          </button>

          {showPdfSection && (
            <div className="space-y-6 pt-2">
              {/* Sender = current user role */}
              <AddressFields
                title={isTenant ? 'Ihre Daten (Mieter/in)' : 'Ihre Daten (Vermieter/in)'}
                address={isTenant ? wizardData.tenantAddress : wizardData.landlordAddress}
                onChangeAddress={a => setWizardField(isTenant ? 'tenantAddress' : 'landlordAddress', a)}
                showApartment={isTenant}
              />

              {/* Recipient = opposite role */}
              <AddressFields
                title={isTenant ? 'Vermieter/in (Empfänger)' : 'Mieter/in (Empfänger)'}
                address={isTenant ? wizardData.landlordAddress : wizardData.tenantAddress}
                onChangeAddress={a => setWizardField(isTenant ? 'landlordAddress' : 'tenantAddress', a)}
                showApartment={!isTenant}
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
