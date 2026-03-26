import { useCalculator } from '@/context/CalculatorContext';
import type { CostInputType, AddressData } from '@/lib/calculator/types';
import { isCrossYearPeriod } from '@/lib/calculator/engine';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
          className="w-full rounded-lg border-2 border-border bg-card px-4 py-3 text-foreground focus:border-accent focus:outline-none transition-colors pr-16"
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
        <div className="sm:col-span-1">
          <select
            value={addr.salutation || ''}
            onChange={e => set('salutation', e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-card px-3 py-3 text-foreground focus:border-accent focus:outline-none transition-colors text-sm"
          >
            <option value="">Anrede</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
            <option value="Firma">Firma</option>
          </select>
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

  const isMultiFuel = wizardData.fuelEntries && wizardData.fuelEntries.length > 0;
  const needsApartmentArea = wizardData.heatSupplyType === 'etage' ||
    (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
  const needsBuildingArea = !needsApartmentArea;
  const isTenantApartmentHeating = wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'etage';
  const isTenant = wizardData.userRole === 'mieter';
  const isNonResidential = wizardData.buildingType === 'nichtwohngebaeude';

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
      default: return 'Gasverbrauch';
    }
  })();

  // Dynamic area label
  const getAreaLabel = () => {
    if (isNonResidential) return 'Bezugsfläche';
    if (needsApartmentArea) return 'Wohnungswohnfläche';
    return 'Gebäudewohnfläche';
  };

  const getAreaHint = () => {
    if (isNonResidential) return 'Maßgebliche Fläche des Nichtwohngebäudes';
    if (needsApartmentArea) return 'Wohnfläche Ihrer Wohnung';
    return 'Gesamte Wohnfläche des Gebäudes';
  };

  const hasDirectCost = wizardData.co2CostDirect != null && wizardData.co2CostDirect > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Berechnungsdaten</h2>
        <p className="text-muted-foreground mt-2">Geben Sie die Verbrauchsdaten und Flächen ein.</p>
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

        {needsApartmentArea && (
          <InputField
            label="Gebäudewohnfläche (optional)"
            hint="Gesamte Wohnfläche des Gebäudes, falls bekannt"
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 500"
            unit="m²"
          />
        )}

        {/* Fuel amount – only for same-year, single fuel */}
        {!isMultiFuel && !crossYear && (
          <InputField
            label={fuelLabel}
            hint={`Verbrauch im Abrechnungszeitraum in ${fuelUnit}`}
            value={wizardData.fuelAmount}
            onChange={v => setWizardField('fuelAmount', v ? parseFloat(v) : undefined)}
            placeholder={`z. B. ${wizardData.fuelType === 'heizoel' ? '3000' : '50000'}`}
            unit={fuelUnit}
          />
        )}

        {/* Cross-year notice */}
        {crossYear && !isMultiFuel && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Die Verbrauchsmengen pro Jahresabschnitt wurden bereits im Schritt „Abrechnungszeitraum" eingegeben.
          </div>
        )}

        {/* District heating emission factor */}
        {!isMultiFuel && wizardData.fuelType === 'fernwaerme' && (
          <InputField
            label="Emissionsfaktor Fernwärme"
            hint="Vom Fernwärmeversorger mitgeteilt (kg CO2/kWh)"
            value={wizardData.emissionFactorCustom}
            onChange={v => setWizardField('emissionFactorCustom', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 0.18"
            unit="kg CO2/kWh"
          />
        )}

        {!isMultiFuel && wizardData.fuelType === 'fernwaerme' && !wizardData.emissionFactorCustom && (
          <p className="text-xs text-destructive">Bitte geben Sie den Emissionsfaktor aus Ihrer Fernwärmeabrechnung an.</p>
        )}

        {/* Direct CO2 cost */}
        {!crossYear && (
          <InputField
            label="CO2-Kosten direkt eingeben (optional)"
            hint="Nur ausfüllen, wenn der CO2-Betrag in Ihrer Abrechnung bereits direkt ausgewiesen ist."
            value={wizardData.co2CostDirect}
            onChange={v => setWizardField('co2CostDirect', v ? parseFloat(v) : undefined)}
            placeholder="z. B. 250"
            unit="EUR"
          />
        )}

        {/* Gross / Net selector */}
        {hasDirectCost && !crossYear && (
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
                ? 'Der Nettobetrag wird mit 7 % USt. auf den Bruttobetrag hochgerechnet.'
                : 'Der eingegebene Betrag wird als Bruttobetrag (inkl. USt.) verwendet.'}
            </p>
          </div>
        )}

        {/* Tenant apartment heating: extra gas device question */}
        {isTenantApartmentHeating && (
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
        <div className="border-t border-border pt-5 mt-6 space-y-4">
          <button
            onClick={() => setShowPdfSection(!showPdfSection)}
            className="flex items-center gap-2 w-full text-left"
          >
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPdfSection ? 'rotate-180' : ''}`} />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Angaben für das Schreiben (optional)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Diese Daten werden nur für die Erstellung des PDF-Dokuments verwendet.</p>
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
      </div>
    </div>
  );
}
