import { useCalculator } from '@/context/CalculatorContext';
import type { HeatSupplyType } from '@/lib/calculator/types';
import { Flame, Thermometer, Heater, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const ALL_OPTIONS: { value: HeatSupplyType; label: string; desc: string; icon: typeof Flame; tenantOnly?: boolean }[] = [
  { value: 'zentral', label: 'Zentrale Heizungsanlage', desc: 'Gemeinsame Heizung für das gesamte Gebäude (z.\u00A0B. Zentralheizung im Keller)', icon: Flame },
  { value: 'fernwaerme', label: 'Fernwärme / Nahwärme', desc: 'Wärmeversorgung über ein Fernwärme- oder Nahwärmenetz', icon: Thermometer },
  { value: 'etage', label: 'Wohnungseigene Heizung', desc: 'Eigene Heizungsanlage in der Wohnung (z.\u00A0B. Gastherme, Gasetagenheizung)', icon: Heater, tenantOnly: true },
];

export default function StepHeatSupply() {
  const { wizardData, setWizardField } = useCalculator();

  const isLandlord = wizardData.userRole === 'vermieter';
  const options = isLandlord
    ? ALL_OPTIONS.filter(opt => !opt.tenantOnly)
    : ALL_OPTIONS;

  // If landlord had Etagenheizung selected from before, clear it
  if (isLandlord && wizardData.heatSupplyType === 'etage') {
    setWizardField('heatSupplyType', undefined as unknown as HeatSupplyType);
  }

  const isFernwaerme = wizardData.heatSupplyType === 'fernwaerme';
  const excluded = !!wizardData.districtHeatingConnectedAfter2023;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Art der Wärmeversorgung</h2>
        <p className="text-muted-foreground mt-2 text-sm">Wie wird das Gebäude bzw. die Wohnung mit Wärme versorgt?</p>
      </div>
      <div className="grid gap-3">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setWizardField('heatSupplyType', opt.value);
              if (opt.value !== 'fernwaerme' && wizardData.fuelType === 'fernwaerme') {
                setWizardField('fuelType', undefined as any);
              }
              if (opt.value !== 'fernwaerme' && wizardData.districtHeatingConnectedAfter2023) {
                setWizardField('districtHeatingConnectedAfter2023', false);
              }
            }}
            className={`rounded-xl border-2 p-5 text-left transition-all hover:shadow-md flex items-start gap-4 ${
              wizardData.heatSupplyType === opt.value
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <opt.icon className={`h-5 w-5 mt-0.5 shrink-0 ${wizardData.heatSupplyType === opt.value ? 'text-accent' : 'text-muted-foreground'}`} />
            <div>
              <div className="font-semibold text-foreground">{opt.label}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {isFernwaerme && (
        <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={excluded}
              onCheckedChange={(v) => setWizardField('districtHeatingConnectedAfter2023', v === true)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                Erstmaliger Anschluss ab dem 1. Januar 2023
              </div>
              <div className="text-xs text-muted-foreground">
                Bitte ankreuzen, wenn das Gebäude erstmalig am oder nach dem 01.01.2023 an das Fernwärme- bzw. Nahwärmenetz angeschlossen wurde.
              </div>
            </div>
          </label>
          {excluded && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                In diesem Fall ist das CO2KostAufG nicht anwendbar. Es wird keine Aufteilung berechnet und kein Dokument erzeugt.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
