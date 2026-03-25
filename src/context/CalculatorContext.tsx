import React, { createContext, useContext, useState, useCallback } from 'react';
import type { WizardData, CalculationResult, WizardStep } from '@/lib/calculator/types';
import { WIZARD_STEPS } from '@/lib/calculator/types';
import { calculateCO2Allocation } from '@/lib/calculator/engine';

interface CalculatorContextType {
  wizardData: WizardData;
  setWizardField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  currentStep: number;
  currentStepKey: WizardStep;
  totalSteps: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  canGoNext: boolean;
  isLastStep: boolean;
  result: CalculationResult | null;
  calculate: () => CalculationResult;
  reset: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const totalSteps = WIZARD_STEPS.length;
  const currentStepKey = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const setWizardField = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep(prev => prev + 1);
  }, [currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) setCurrentStep(step);
  }, [totalSteps]);

  const canGoNext = (() => {
    switch (currentStepKey) {
      case 'userRole': return !!wizardData.userRole;
      case 'buildingType': return !!wizardData.buildingType;
      case 'heatSupply': return !!wizardData.heatSupplyType;
      case 'restriction': return !!wizardData.restrictionCase;
      case 'billingPeriod': return !!wizardData.billingPeriodStart && !!wizardData.billingPeriodEnd;
      case 'fuelSource': {
        // Multi-fuel: check entries or single fuel
        if (wizardData.fuelEntries && wizardData.fuelEntries.length > 0) {
          return wizardData.fuelEntries.every(e => !!e.fuelType && e.amount > 0);
        }
        return !!wizardData.fuelType;
      }
      case 'inputValues': {
        const needsApartment = wizardData.heatSupplyType === 'etage' ||
          (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
        if (needsApartment) {
          return !!(wizardData.apartmentArea && wizardData.apartmentArea > 0 && wizardData.fuelAmount && wizardData.fuelAmount > 0);
        }
        return !!(wizardData.buildingArea && wizardData.buildingArea > 0 && wizardData.fuelAmount && wizardData.fuelAmount > 0);
      }
      default: return false;
    }
  })();

  const calculate = useCallback(() => {
    const res = calculateCO2Allocation(wizardData);
    setResult(res);
    return res;
  }, [wizardData]);

  const reset = useCallback(() => {
    setWizardData({});
    setCurrentStep(0);
    setResult(null);
  }, []);

  return (
    <CalculatorContext.Provider value={{
      wizardData, setWizardField, currentStep, currentStepKey, totalSteps,
      goNext, goBack, goToStep, canGoNext, isLastStep, result, calculate, reset,
    }}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used within CalculatorProvider');
  return ctx;
}
