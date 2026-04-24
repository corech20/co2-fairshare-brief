import { useCalculator } from '@/context/CalculatorContext';
import type { HeatSupplyType } from '@/lib/calculator/types';
import { Flame, Thermometer, Heater, AlertTriangle, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useMemo } from 'react';

type HeatOption = { value: HeatSupplyType; label: string; desc: string; icon: typeof Flame };

const OPT_ZENTRAL: HeatOption = {
  value: 'zentral',
  label: 'Zentrale Heizungsanlage',
  desc: 'Gemeinsame Heizung für das gesamte Gebäude (z.\u00A0B. Zentralheizung im Keller)',
  icon: Flame,
};
const OPT_FERNWAERME: HeatOption = {
  value: 'fernwaerme',
  label: 'Fernwärme / Nahwärme',
  desc: 'Wärmeversorgung über ein Fernwärme- oder Nahwärmenetz',
  icon: Thermometer,
};
const OPT_ETAGE_WOHN: HeatOption = {
  value: 'etage',
  label: 'Wohnungseigene Heizung',
  desc: 'Eigene Heizungsanlage in der Wohnung (z.\u00A0B. Gastherme, Gasetagenheizung)',
  icon: Heater,
};
const OPT_ETAGE_NWG: HeatOption = {
  value: 'etage',
  label: 'Eigene Heizungsanlage der Mietfläche',
  desc: 'Eigene Heizungsanlage für die gemietete Einheit (z.\u00A0B. Gastherme der Mietfläche)',
  icon: Heater,
};

export default function StepHeatSupply() {
  const { wizardData, setWizardField } = useCalculator();

  const isLandlord = wizardData.userRole === 'vermieter';
  const isTenant = wizardData.userRole === 'mieter';
  const isNonResidential = wizardData.buildingType === 'nichtwohngebaeude';

  // Option list per role / building type.
  // - Landlord:  unchanged → Zentral + Fernwärme  (Etagenheizung wird ausgeschlossen)
  // - Tenant Wohngebäude:        Fernwärme + Wohnungseigene Heizung
  // - Tenant Nichtwohngebäude:   Fernwärme + Eigene Heizungsanlage der Mietfläche
  const options: HeatOption[] = useMemo(() => {
    if (isLandlord) return [OPT_ZENTRAL, OPT_FERNWAERME];
    return [OPT_FERNWAERME, isNonResidential ? OPT_ETAGE_NWG : OPT_ETAGE_WOHN];
  }, [isLandlord, isNonResidential]);

  // Clean up stale heat supply values whenever the role/building combination
  // makes the previously stored value invalid:
  //  - landlord must never carry "etage"
  //  - tenant must never carry "zentral"
  useEffect(() => {
    if (isLandlord && wizardData.heatSupplyType === 'etage') {
      setWizardField('heatSupplyType', undefined as unknown as HeatSupplyType);
    }
    if (isTenant && wizardData.heatSupplyType === 'zentral') {
      setWizardField('heatSupplyType', undefined as unknown as HeatSupplyType);
    }
  }, [isLandlord, isTenant, wizardData.heatSupplyType, setWizardField]);

  const isFernwaerme = wizardData.heatSupplyType === 'fernwaerme';
  const excluded = !!wizardData.districtHeatingConnectedAfter2023;
  // Vertragspartner-Frage für Mieter bei Fernwärme (außer Sonderausschluss) – Direktbelieferung vs. Vermieter-Abrechnung
  const showFernwaermeContractQuestion = isTenant && isFernwaerme && !excluded;
  // Reset Vertragspartner-Flag, wenn die Frage nicht (mehr) relevant ist
  // (nur Mieter + Fernwärme ohne Sonderausschluss soll diesen Wert tragen)
  useEffect(() => {
    if (!showFernwaermeContractQuestion && wizardData.tenantIsDirectContractParty !== undefined) {
      setWizardField('tenantIsDirectContractParty', undefined);
    }
  }, [showFernwaermeContractQuestion, wizardData.tenantIsDirectContractParty, setWizardField]);

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

      {showFernwaermeContractQuestion && (
        <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                Wer ist Vertragspartner des Wärmeversorgers?
              </div>
              <div className="text-xs text-muted-foreground">
                Diese Angabe entscheidet, ob ein gesetzlicher Erstattungsanspruch gegenüber dem Vermieter
                besteht und ein Erstattungsschreiben erstellt werden kann.
              </div>
            </div>
          </div>
          <RadioGroup
            value={
              wizardData.tenantIsDirectContractParty === true
                ? 'tenant'
                : wizardData.tenantIsDirectContractParty === false
                  ? 'landlord'
                  : ''
            }
            onValueChange={(v) => setWizardField('tenantIsDirectContractParty', v === 'tenant')}
            className="grid gap-2"
          >
            <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-primary/40">
              <RadioGroupItem value="tenant" className="mt-0.5" />
              <div className="text-sm text-foreground">
                <div className="font-medium">Mieter erhält eigene Rechnung vom Wärmelieferanten</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Direktbelieferung – Erstattungsanspruch gegenüber dem Vermieter möglich.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-primary/40">
              <RadioGroupItem value="landlord" className="mt-0.5" />
              <div className="text-sm text-foreground">
                <div className="font-medium">Vermieter / Hausverwaltung rechnet über Nebenkosten ab</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Kein separates Erstattungsschreiben – Aufteilung erfolgt über die Heiz-/Betriebskostenabrechnung.
                </div>
              </div>
            </label>
          </RadioGroup>
        </div>
      )}

    </div>
  );
}
