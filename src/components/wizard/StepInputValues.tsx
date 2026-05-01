import { useCalculator } from '@/context/CalculatorContext';
import type { CostInputType, AddressData, FuelType, FuelEntry } from '@/lib/calculator/types';
import { isCrossYearPeriod } from '@/lib/calculator/engine';
import { isReimbursementEligible } from '@/lib/calculator/pdf-helpers';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IntegerInput } from './IntegerInput';
import { DecimalInput } from './DecimalInput';

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

/** Spezialisiertes Flächeneingabefeld mit Validierung > 0. */
function AreaField({ label, hint, value, onChange, placeholder }: {
  label: string; hint?: string; value: number | undefined;
  onChange: (v: number | undefined) => void; placeholder?: string;
}) {
  const invalid = value != null && !(value > 0);
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <input
          type="number"
          min={0}
          step="any"
          value={value ?? ''}
          onChange={e => {
            const raw = e.target.value;
            if (raw === '') { onChange(undefined); return; }
            const n = parseFloat(raw);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={`block w-full box-border h-12 rounded-lg border-2 bg-card px-4 py-3 text-base leading-tight text-foreground focus:outline-none transition-colors pr-16 ${
            invalid ? 'border-destructive focus:border-destructive' : 'border-border focus:border-accent'
          }`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">m²</span>
      </div>
      {invalid && (
        <p className="text-xs text-destructive font-medium" role="alert">
          Bitte geben Sie eine Fläche größer als 0 m² ein.
        </p>
      )}
      {!invalid && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
  // Adressdatenbereich nur sichtbar bei:
  //   Rolle = Mieter UND Wärmeversorgung = eigene Heizungsanlage (etage)
  //                                        ODER Fernwärme/Nahwärme.
  // Bei Vermieter-Rolle nie. Bei Mieter ohne diese Wärmeversorgung nie.
  const reimbursementEligible = isReimbursementEligible(wizardData);
  const showAddressSection =
    isTenant && (wizardData.heatSupplyType === 'etage' || wizardData.heatSupplyType === 'fernwaerme')
    && reimbursementEligible;

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
  const isPellets = wizardData.fuelType === 'pellets';
  const isFernwaerme = wizardData.fuelType === 'fernwaerme';
  const fernwaermeInvalid = isFernwaerme &&
    wizardData.fernwaermeAmountKwh != null &&
    !(wizardData.fernwaermeAmountKwh > 0);

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
        <p className="text-muted-foreground mt-2 text-sm">
          {isFernwaerme
            ? 'Werte aus der Wärmelieferabrechnung sowie die Fläche eintragen.'
            : 'Werte aus der Abrechnung sowie die Fläche eintragen.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* Area fields */}
        {needsBuildingArea && (
          <AreaField
            label={getAreaLabel()}
            hint={getAreaHint()}
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v)}
            placeholder="z. B. 500"
          />
        )}

        {needsApartmentArea && (
          <AreaField
            label={getAreaLabel()}
            hint={getAreaHint()}
            value={wizardData.apartmentArea}
            onChange={v => setWizardField('apartmentArea', v)}
            placeholder="z. B. 80"
          />
        )}

        {showOptionalBuildingArea && (
          <AreaField
            label="Gesamtwohnfläche des Gebäudes (optional)"
            hint="Gesamtwohnfläche des Gebäudes, falls bekannt"
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v)}
            placeholder="z. B. 500"
          />
        )}

        {/* ── Werte aus der Abrechnung: CO2-Emissionen + CO2-Kosten ───────── */}
        <div className="space-y-4 rounded-xl border-2 border-border bg-card p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{isFernwaerme ? 'Werte aus Ihrer Wärmelieferabrechnung' : 'Werte aus Ihrer Abrechnung'}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isFernwaerme
                  ? 'Bitte tragen Sie die Werte für den Abrechnungszeitraum ein.'
                  : isPellets
                  ? 'Holzpellets sind ein Sonderfall: Es sind keine nach dem CO2KostAufG zu verteilenden CO2-Kosten anzusetzen. Eine Eingabe ist nicht erforderlich.'
                  : 'Bitte tragen Sie beide Werte für den Abrechnungszeitraum ein. Bei einer einzelnen Rechnung übernehmen Sie die Werte direkt. Bei mehreren Lieferungen sind die Werte aus den jeweiligen Rechnungen zusammenzustellen.'}
              </p>
            </div>

            {/* Fernwärme/Nahwärme: gelieferte Wärmemenge (Pflichtfeld) – im Block */}
            {isFernwaerme && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Gelieferte Wärmemenge lt. Wärmelieferabrechnung
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={wizardData.fernwaermeAmountKwh ?? ''}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') { setWizardField('fernwaermeAmountKwh', undefined); return; }
                      const n = parseFloat(raw);
                      setWizardField('fernwaermeAmountKwh', Number.isFinite(n) ? n : undefined);
                    }}
                    placeholder="z. B. 12000"
                    aria-invalid={fernwaermeInvalid || undefined}
                    className={`block w-full box-border h-12 rounded-lg border-2 bg-card px-4 py-3 text-base leading-tight text-foreground focus:outline-none transition-colors pr-16 ${
                      fernwaermeInvalid ? 'border-destructive focus:border-destructive' : 'border-border focus:border-accent'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kWh</span>
                </div>
                {fernwaermeInvalid ? (
                  <p className="text-xs text-destructive font-medium" role="alert">
                    Bitte geben Sie eine Wärmemenge größer als 0 kWh ein.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Gelieferte Wärmemenge in kWh lt. Abrechnung des Wärmelieferanten.
                  </p>
                )}
              </div>
            )}

            {/* CO2-Emissionen (kg) – Pflicht */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {isFernwaerme ? 'CO2-Emissionen lt. Wärmelieferabrechnung' : `CO2-Emissionen lt. Abrechnung${isPellets ? ' (optional)' : ''}`}
              </label>
              <div className="relative">
                <DecimalInput
                  value={wizardData.co2EmissionsDirect}
                  onChange={v => setWizardField('co2EmissionsDirect', v)}
                  maxDecimals={4}
                  placeholder="z. B. 1800"
                  className="pr-16"
                />
                <span className="absolute right-4 top-[1.05rem] text-sm text-muted-foreground pointer-events-none">kg</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPellets
                  ? 'Nur informatorisch; keine Grundlage der Kostenaufteilung.'
                  : 'Wird auf ein Jahr normiert und für die gesetzliche Einstufung des Gebäudes oder der gemieteten Einheit verwendet.'}
              </p>
            </div>

            {/* CO2-Kosten (EUR) – Pflicht (nicht für Pellets) */}
            {!isPellets && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{isFernwaerme ? 'CO2-Kosten lt. Wärmelieferabrechnung' : 'CO2-Kosten lt. Abrechnung'}</label>
                <div className="relative">
                  <DecimalInput
                    value={wizardData.co2CostDirect}
                    onChange={v => setWizardField('co2CostDirect', v)}
                    maxDecimals={2}
                    placeholder="z. B. 250"
                    className="pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">EUR</span>
                </div>
              </div>
            )}

            {/* Brutto/Netto-Schalter direkt im Block (nicht für Pellets) */}
            {!isPellets && hasDirectCost && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Betrag ausgewiesen als <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-3">
                  {([
                    { value: 'brutto' as CostInputType, label: 'Brutto (inkl. USt.)' },
                    { value: 'netto' as CostInputType, label: 'Netto (zzgl. USt.)' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setWizardField('co2CostDirectType', opt.value)}
                      className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          wizardData.co2CostDirectType === opt.value
                          ? 'border-accent bg-accent/10 text-foreground shadow-sm'
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
                Adressdaten für ein Erstattungsschreiben (optional)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nur erforderlich, wenn ein Erstattungsschreiben erstellt werden soll. Für den Berechnungsnachweis sind keine Adressdaten nötig.
              </p>
            </div>
          </button>

          {showPdfSection && (
            <div className="space-y-6 pt-2">
              {/* Sender = current user role */}
              <AddressFields
                title="Ihre Daten (Mieter/in)"
                address={wizardData.tenantAddress}
                onChangeAddress={a => setWizardField('tenantAddress', a)}
                showApartment={true}
              />

              {/* Recipient = opposite role */}
              <AddressFields
                title="Vermieter/in (Empfänger)"
                address={wizardData.landlordAddress}
                onChangeAddress={a => setWizardField('landlordAddress', a)}
                showApartment={false}
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
