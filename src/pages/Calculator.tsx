import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Scale } from 'lucide-react';
import StepUserRole from '@/components/wizard/StepUserRole';
import StepBuildingType from '@/components/wizard/StepBuildingType';
import StepHeatSupply from '@/components/wizard/StepHeatSupply';
import StepRestriction from '@/components/wizard/StepRestriction';
import StepBillingPeriod from '@/components/wizard/StepBillingPeriod';
import StepFuelSource from '@/components/wizard/StepFuelSource';
import StepInputValues from '@/components/wizard/StepInputValues';
import SiteFooter from '@/components/SiteFooter';
import SEO from '@/components/SEO';
import RechnerContent from '@/components/RechnerContent';

const STEP_LABELS = [
  'Rolle',
  'Gebäude',
  'Heizung',
  'Einschränkungen',
  'Zeitraum',
  'Brennstoff',
  'Angaben',
];

function WizardContent() {
  const navigate = useNavigate();
  const { currentStep, totalSteps, goNext, goBack, canGoNext, isLastStep, calculate, wizardData } = useCalculator();

  const hasMultiFuel = !!(wizardData.fuelEntries && wizardData.fuelEntries.length > 0);
  const skipFuelStep = wizardData.heatSupplyType === 'fernwaerme' && !hasMultiFuel;
  const effectiveLabels = skipFuelStep
    ? STEP_LABELS.filter((_, i) => i !== 5)
    : STEP_LABELS;
  const effectiveIndex = skipFuelStep && currentStep > 5 ? currentStep - 1 : currentStep;
  const effectiveTotal = effectiveLabels.length;
  const progressPercent = ((effectiveIndex + 1) / effectiveTotal) * 100;

  const handleNext = () => {
    if (isLastStep) {
      // V – Excluded district-heating case: skip calculation, go straight to notice
      if (wizardData.heatSupplyType === 'fernwaerme' && wizardData.districtHeatingConnectedAfter2023) {
        navigate('/ergebnis');
        return;
      }
      calculate();
      navigate('/ergebnis');
    } else {
      goNext();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepUserRole />;
      case 1: return <StepBuildingType />;
      case 2: return <StepHeatSupply />;
      case 3: return <StepRestriction />;
      case 4: return <StepBillingPeriod />;
      case 5: return <StepFuelSource />;
      case 6: return <StepInputValues />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container-narrow flex h-14 items-center justify-between px-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Scale className="h-4 w-4" />
            <span className="text-sm font-semibold">CO2-Kostenaufteilung</span>
          </button>
          <span className="text-xs text-muted-foreground">
            Schritt {effectiveIndex + 1} / {effectiveTotal}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-secondary h-1">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step labels (desktop) */}
      <div className="hidden md:block border-b border-border bg-background">
        <div className="container-wide px-4">
          <div className="flex justify-between py-2.5">
            {effectiveLabels.map((label, i) => (
              <div key={i} className={`text-xs font-medium transition-colors ${
                i === effectiveIndex ? 'text-accent' : i < effectiveIndex ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="container-narrow px-4 animate-fade-in">
          <h1 className="sr-only">CO2-Kostenaufteilung berechnen</h1>
          {renderStep()}
        </div>
      </main>

      {/* Navigation */}
      <div className="border-t border-border bg-background py-3">
        <div className="container-narrow flex items-center justify-between px-4">
          <Button
            variant="outline"
            size="default"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button
            variant={isLastStep ? 'cta' : 'default'}
            size="default"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            {isLastStep ? 'Berechnen' : 'Weiter'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <>
      <SEO
        title="CO2-Rechner — Berechnung starten"
        description="Schrittweise CO2-Kostenaufteilung nach CO2KostAufG ermitteln: Rolle, Gebäude, Zeitraum, Brennstoff und Verbrauchswerte eingeben."
        path="/rechner"
      />
      <WizardContent />
      <RechnerContent />
      <SiteFooter />
    </>
  );
}
