import { useCalculator } from '@/context/CalculatorContext';

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

  const fuelUnit = wizardData.fuelType === 'heizoel' ? 'Liter' : 'kWh';
  const fuelLabel = wizardData.fuelType === 'heizoel'
    ? 'Heizölverbrauch'
    : wizardData.fuelType === 'fernwaerme'
      ? 'Wärmemenge'
      : 'Gasverbrauch';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ihre Angaben</h2>
        <p className="text-muted-foreground mt-2">Geben Sie die Verbrauchsdaten und Flächen ein.</p>
      </div>

      <div className="space-y-5">
        <InputField
          label="Gebäudewohnfläche"
          hint="Gesamte Wohnfläche des Gebäudes"
          value={wizardData.buildingArea}
          onChange={v => setWizardField('buildingArea', v ? parseFloat(v) : undefined)}
          placeholder="z.B. 500"
          unit="m²"
        />

        <InputField
          label="Wohnungsfläche (optional)"
          hint="Fläche Ihrer Wohnung, falls relevant"
          value={wizardData.apartmentArea}
          onChange={v => setWizardField('apartmentArea', v ? parseFloat(v) : undefined)}
          placeholder="z.B. 80"
          unit="m²"
        />

        <InputField
          label={fuelLabel}
          hint={`Verbrauch im Abrechnungszeitraum in ${fuelUnit}`}
          value={wizardData.fuelAmount}
          onChange={v => setWizardField('fuelAmount', v ? parseFloat(v) : undefined)}
          placeholder={`z.B. ${wizardData.fuelType === 'heizoel' ? '3000' : '50000'}`}
          unit={fuelUnit}
        />

        {wizardData.fuelType === 'fernwaerme' && (
          <InputField
            label="Emissionsfaktor Fernwärme"
            hint="Vom Fernwärmeversorger mitgeteilt (kg CO2/kWh)"
            value={wizardData.emissionFactorCustom}
            onChange={v => setWizardField('emissionFactorCustom', v ? parseFloat(v) : undefined)}
            placeholder="z.B. 0.18"
            unit="kg CO2/kWh"
          />
        )}

        <InputField
          label="CO2-Kosten direkt (optional)"
          hint="Falls die CO2-Kosten bereits bekannt sind, hier direkt eingeben"
          value={wizardData.co2CostDirect}
          onChange={v => setWizardField('co2CostDirect', v ? parseFloat(v) : undefined)}
          placeholder="z.B. 250"
          unit="EUR"
        />

        <div className="border-t border-border pt-5 mt-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Angaben für das Schreiben (optional)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Name Vermieter"
              value={wizardData.landlordName}
              onChange={v => setWizardField('landlordName', v)}
              type="text"
              placeholder="Max Mustermann"
            />
            <InputField
              label="Adresse Vermieter"
              value={wizardData.landlordAddress}
              onChange={v => setWizardField('landlordAddress', v)}
              type="text"
              placeholder="Musterstr. 1, 10115 Berlin"
            />
            <InputField
              label="Name Mieter"
              value={wizardData.tenantName}
              onChange={v => setWizardField('tenantName', v)}
              type="text"
              placeholder="Erika Mustermann"
            />
            <InputField
              label="Adresse Mieter"
              value={wizardData.tenantAddress}
              onChange={v => setWizardField('tenantAddress', v)}
              type="text"
              placeholder="Beispielweg 5, 10115 Berlin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
