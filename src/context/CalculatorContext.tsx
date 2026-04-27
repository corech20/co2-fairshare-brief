import React, { createContext, useContext, useState, useCallback } from 'react';
import type { WizardData, CalculationResult, WizardStep } from '@/lib/calculator/types';
import { WIZARD_STEPS } from '@/lib/calculator/types';
import { calculateCO2Allocation, validateBillingPeriod } from '@/lib/calculator/engine';
import { generateCalcId, saveHistoryEntry, getHistoryEntry } from '@/lib/calculator/historyStore';

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
  calcId: string | null;
  calculate: () => CalculationResult;
  loadFromHistory: (calcId: string) => boolean;
  reset: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: React.ReactNode }) {
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calcId, setCalcId] = useState<string | null>(null);

  const totalSteps = WIZARD_STEPS.length;
  const currentStepKey = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const setWizardField = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setWizardData(prev => ({ ...prev, [key]: value }));
  }, []);

  const hasMultiFuel = !!(wizardData.fuelEntries && wizardData.fuelEntries.length > 0);

  const goNext = useCallback(() => {
    let next = currentStep + 1;
    // Skip fuel step ONLY for pure single-source Fernwärme (no multi-fuel combination active)
    if (next === 5 && wizardData.heatSupplyType === 'fernwaerme' && !hasMultiFuel) {
      setWizardData(prev => ({ ...prev, fuelType: 'fernwaerme' as WizardData['fuelType'] }));
      next = 6;
    }
    if (next < totalSteps) setCurrentStep(next);
  }, [currentStep, totalSteps, wizardData.heatSupplyType, hasMultiFuel]);

  const goBack = useCallback(() => {
    let prev = currentStep - 1;
    // Skip fuel step ONLY for pure single-source Fernwärme (no multi-fuel combination active)
    if (prev === 5 && wizardData.heatSupplyType === 'fernwaerme' && !hasMultiFuel) prev = 4;
    if (prev >= 0) setCurrentStep(prev);
  }, [currentStep, wizardData.heatSupplyType, hasMultiFuel]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) setCurrentStep(step);
  }, [totalSteps]);

  const canGoNext = (() => {
    switch (currentStepKey) {
      case 'userRole': return !!wizardData.userRole;
      case 'buildingType': return !!wizardData.buildingType;
      case 'heatSupply': {
        if (!wizardData.heatSupplyType) return false;
        // Mieter + Fernwärme/Nahwärme gilt verbindlich als Direktlieferungsfall –
        // keine zusätzliche Vertragspartner-Frage mehr erforderlich.
        return true;
      }
      case 'restriction': return !!wizardData.restrictionCase;
      case 'billingPeriod': {
        if (!wizardData.billingPeriodStart || !wizardData.billingPeriodEnd) return false;
        const err = validateBillingPeriod(wizardData.billingPeriodStart, wizardData.billingPeriodEnd);
        if (err) return false;
        return true;
      }
      case 'fuelSource': {
        if (wizardData.fuelEntries && wizardData.fuelEntries.length > 0) {
          // Amounts are entered on the next step (inputValues)
          return wizardData.fuelEntries.every(e => !!e.fuelType);
        }
        return !!wizardData.fuelType;
      }
      case 'inputValues': {
        const needsApartment = wizardData.heatSupplyType === 'etage' ||
          (wizardData.userRole === 'mieter' && wizardData.heatSupplyType === 'fernwaerme');
        const isMultiFuel = !!(wizardData.fuelEntries && wizardData.fuelEntries.length > 0);
        const hasDirectEmissions = !!(wizardData.co2EmissionsDirect && wizardData.co2EmissionsDirect > 0);
        const hasDirectCost = !!(wizardData.co2CostDirect && wizardData.co2CostDirect > 0);
        const hasFuelAmount = isMultiFuel
          ? wizardData.fuelEntries!.every(e => e.amount > 0)
          : !!(wizardData.fuelAmount && wizardData.fuelAmount > 0);
        // Pellets: keine CO2-Kosten anzusetzen → CO2-Kosten dürfen 0/leer sein
        const isPellets = wizardData.fuelType === 'pellets';
        // Standard-Modus: BEIDE Pflicht (Emissionen kg + Kosten €), außer bei Pellets
        const standardModeOk = wizardData.expertMode
          ? false
          : (isPellets ? hasDirectEmissions : (hasDirectEmissions && hasDirectCost));
        // Expertenmodus: Brennstoffmenge oder direkte Eingaben
        const expertModeOk = !!wizardData.expertMode &&
          (hasDirectEmissions || hasDirectCost || hasFuelAmount);
        const hasAnyEnergyInput = standardModeOk || expertModeOk;
        if (needsApartment) {
          return !!(wizardData.apartmentArea && wizardData.apartmentArea > 0 && hasAnyEnergyInput);
        }
        return !!(wizardData.buildingArea && wizardData.buildingArea > 0 && hasAnyEnergyInput);
      }
      default: return false;
    }
  })();

  const calculate = useCallback(() => {
    const res = calculateCO2Allocation(wizardData);
    setResult(res);
    const newId = generateCalcId();
    setCalcId(newId);
    saveHistoryEntry({
      calcId: newId,
      savedAt: new Date().toISOString(),
      wizardData,
      result: res,
    });
    return res;
  }, [wizardData]);

  const loadFromHistory = useCallback((id: string): boolean => {
    const entry = getHistoryEntry(id);
    if (!entry) return false;
    setWizardData(entry.wizardData);
    setResult(entry.result);
    setCalcId(entry.calcId);
    setCurrentStep(WIZARD_STEPS.length - 1);
    return true;
  }, []);

  const reset = useCallback(() => {
    setWizardData({});
    setCurrentStep(0);
    setResult(null);
    setCalcId(null);
  }, []);

  return (
    <CalculatorContext.Provider value={{
      wizardData, setWizardField, currentStep, currentStepKey, totalSteps,
      goNext, goBack, goToStep, canGoNext, isLastStep, result, calcId, calculate, loadFromHistory, reset,
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
