import { useContext } from 'react';
import { CalculatorContext } from './CalculatorContext';

export function useCalculator() {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error('useCalculator must be used within CalculatorProvider');
  return ctx;
}