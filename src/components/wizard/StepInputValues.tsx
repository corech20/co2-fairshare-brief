import { useCalculator } from '@/context/CalculatorContext';
import type { CostInputType } from '@/lib/calculator/types';

function InputField({ label, hint, value, onChange, type = 'number', placeholder, unit }: {
  label: string; hint?: string; value: string | number | undefined;
  onChange: (v: string) => void; type?: string; placeholder?: string; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
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

export default function StepInputValues() {
  const { wizardData, setWizardField } = useCalculator();

  const isMultiFuel = wizardData.fuelEntries && wizardData.fuelEntries.length > 0;
  const needsApartmentArea = wizardData.heatSupplyType === 'etage' ||
    (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
  const needsBuildingArea = !needsApartmentArea;
  const isTenantApartmentHeating = wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'etage';

  const fuelUnit = (() => {
    switch (wizardData.fuelType) {
      case 'heizoel': case 'heizoel_kwk': return 'Liter';
      case 'fluessiggas': case 'fluessiggas_kwk': return 'kg';
      case 'pellets': case 'hackschnitzel': case 'abfallholz': case 'braunkohle': return 'kg';
      default: return 'kWh';
    }
  })();

  const fuelLabel = (() => {
    switch (wizardData.fuelType) {
      case 'heizoel': case 'heizoel_kwk': return 'Heizölverbrauch';
      case 'fernwaerme': return 'Wärmemenge';
      case 'fluessiggas': case 'fluessiggas_kwk': return 'Flüssiggasverbrauch';
      case 'pellets': return 'Pelletverbrauch';
      case 'hackschnitzel': return 'Hackschnitzelverbrauch';
      case 'abfallholz': return 'Altholzverbrauch';
      case 'braunkohle': return 'Braunkohleverbrauch';
      default: return 'Gasverbrauch';
    }
  })();

  const hasDirectCost = wizardData.co2CostDirect != null && wizardData.co2CostDirect > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ihre Angaben</h2>
        <p className="text-muted-foreground mt-2">Geben Sie die Verbrauchsdaten und Flächen ein.</p>
      </div>

      <div className="space-y-5">
        {/* Area fields - conditional */}
        {needsBuildingArea && (
          <InputField
            label="Gebäudewohnfläche"
            hint="Gesamte Wohnfläche des Gebäudes"
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
            placeholder="z.B. 500"
            unit="m²"
          />
        )}

        {(needsApartmentArea || !needsBuildingArea) && (
          <InputField
            label={needsApartmentArea ? 'Wohnungsfläche' : 'Wohnungsfläche (optional)'}
            hint={needsApartmentArea ? 'Fläche Ihrer Wohnung (Pflichtfeld bei Etagenheizung/Wohnungsfernwärme)' : 'Fläche Ihrer Wohnung, falls relevant'}
            value={wizardData.apartmentArea}
            onChange={v => setWizardField('apartmentArea', v ? parseFloat(v) : undefined)}
            placeholder="z.B. 80"
            unit="m²"
          />
        )}

        {needsApartmentArea && (
          <InputField
            label="Gebäudewohnfläche (optional)"
            hint="Gesamte Wohnfläche des Gebäudes, falls bekannt"
            value={wizardData.buildingArea}
            onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
            placeholder="z.B. 500"
            unit="m²"
          />
        )}

        {/* Fuel amount - only for single fuel */}
        {!isMultiFuel && (
          <InputField
            label={fuelLabel}
            hint={`Verbrauch im Abrechnungszeitraum in ${fuelUnit}`}
            value={wizardData.fuelAmount}
            onChange={v => setWizardField('fuelAmount', v ? parseFloat(v) : undefined)}
            placeholder={`z.B. ${wizardData.fuelType === 'heizoel' ? '3000' : '50000'}`}
            unit={fuelUnit}
          />
        )}

        {/* District heating emission factor */}
        {!isMultiFuel && wizardData.fuelType === 'fernwaerme' && (
          <InputField
            label="Emissionsfaktor Fernwärme"
            hint="Vom Fernwärmeversorger mitgeteilt (kg CO2/kWh)"
            value={wizardData.emissionFactorCustom}
            onChange={v => setWizardField('emissionFactorCustom', v ? parseFloat(v) : undefined)}
            placeholder="z.B. 0.18"
            unit="kg CO2/kWh"
          />
        )}

        {/* District heating validation hint */}
        {!isMultiFuel && wizardData.fuelType === 'fernwaerme' && !wizardData.emissionFactorCustom && (
          <p className="text-xs text-destructive">Bitte geben Sie den Emissionsfaktor aus Ihrer Fernwärmeabrechnung an.</p>
        )}

        {/* Direct CO2 cost */}
        <InputField
          label="CO2-Kosten direkt eingeben (optional)"
          hint="Nur ausfüllen, wenn der CO2-Betrag in Ihrer Abrechnung bereits direkt ausgewiesen ist."
          value={wizardData.co2CostDirect}
          onChange={v => setWizardField('co2CostDirect', v ? parseFloat(v) : undefined)}
          placeholder="z.B. 250"
          unit="EUR"
        />

        {/* Gross / Net selector - only when direct cost entered */}
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

        {/* Letter info fields */}
        <div className="border-t border-border pt-5 mt-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Angaben für das Schreiben (optional)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Name Vermieter" value={wizardData.landlordName} onChange={v => setWizardField('landlordName', v)} type="text" placeholder="Max Mustermann" />
            <InputField label="Adresse Vermieter" value={wizardData.landlordAddress} onChange={v => setWizardField('landlordAddress', v)} type="text" placeholder="Musterstr. 1, 10115 Berlin" />
            <InputField label="Name Mieter" value={wizardData.tenantName} onChange={v => setWizardField('tenantName', v)} type="text" placeholder="Erika Mustermann" />
            <InputField label="Adresse Mieter" value={wizardData.tenantAddress} onChange={v => setWizardField('tenantAddress', v)} type="text" placeholder="Beispielweg 5, 10115 Berlin" />
          </div>
        </div>
      </div>
    </div>
  );
}
