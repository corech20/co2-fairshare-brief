import { useNavigate } from 'react-router-dom';
import { useCalculator } from '@/context/CalculatorContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import StepUserRole from '@/components/wizard/StepUserRole';
import StepBuildingType from '@/components/wizard/StepBuildingType';
import StepHeatSupply from '@/components/wizard/StepHeatSupply';
import StepRestriction from '@/components/wizard/StepRestriction';
import StepBillingPeriod from '@/components/wizard/StepBillingPeriod';
import StepFuelSource from '@/components/wizard/StepFuelSource';
import StepInputValues from '@/components/wizard/StepInputValues';

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
  const { currentStep, totalSteps, goNext, goBack, canGoNext, isLastStep, calculate } = useCalculator();

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (isLastStep) {
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
        <div className="container-narrow flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Calculator className="h-5 w-5" />
            <span className="font-semibold">CO2-Rechner</span>
          </button>
          <span className="text-sm text-muted-foreground">
            Schritt {currentStep + 1} von {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-secondary h-1.5">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step labels (desktop) */}
      <div className="hidden md:block border-b border-border bg-background">
        <div className="container-wide px-4">
          <div className="flex justify-between py-3">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className={`text-xs font-medium transition-colors ${
                i === currentStep ? 'text-accent' : i < currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 section-padding">
        <div className="container-narrow px-4 animate-fade-in">
          {renderStep()}
        </div>
      </main>

      {/* Navigation */}
      <div className="border-t border-border bg-background py-4">
        <div className="container-narrow flex items-center justify-between px-4">
          <Button
            variant="outline"
            size="lg"
            onClick={goBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button
            variant={isLastStep ? 'cta' : 'default'}
            size="lg"
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
    <CalculatorProvider>
      <WizardContent />
    </CalculatorProvider>
  );
}
