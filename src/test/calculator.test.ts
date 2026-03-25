import { describe, it, expect } from 'vitest';
import { calculateCO2Allocation, calculateSingleFuel, lookupStufenmodell, applyRestrictionModifier } from '../lib/calculator/engine';
import type { WizardData } from '../lib/calculator/types';

function round2(n: number) { return Math.round(n * 100) / 100; }

describe('Reference Case 1: Natural Gas', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'zentral',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'erdgas',
    fuelAmount: 45000,
    buildingArea: 290,
  };

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(8162.76);
    expect(round2(r.emissionsPerSqmYear)).toBe(28.15);
    expect(round2(r.totalCO2Cost)).toBe(262.02);
    expect(r.tenantPercent).toBe(60);
    expect(r.landlordPercent).toBe(40);
    expect(round2(r.tenantShare)).toBe(157.21);
    expect(round2(r.landlordShare)).toBe(104.81);
    expect(r.stufenmodellStep).toBe(5); // 27 to < 32
  });
});

describe('Reference Case 2: District Heating', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall3',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 45000,
    emissionFactorCustom: 0.1234,
    buildingArea: 290,
  };

  it('matches all expected values', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalEmissionsKg)).toBe(5553.00);
    expect(round2(r.emissionsPerSqmYear)).toBe(19.15);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(r.tenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(20);
    expect(round2(r.tenantShare)).toBe(142.60);
    expect(round2(r.landlordShare)).toBe(35.65);
  });
});

describe('Reference Case 3: District Heating with Restriction', () => {
  const data: WizardData = {
    userRole: 'vermieter',
    buildingType: 'wohngebaeude',
    heatSupplyType: 'fernwaerme',
    restrictionCase: 'fall2',
    billingPeriodStart: '2023-01-01',
    billingPeriodEnd: '2023-12-31',
    fuelType: 'fernwaerme',
    fuelAmount: 45000,
    emissionFactorCustom: 0.1234,
    buildingArea: 290,
  };

  it('matches all expected values with restriction modifier', () => {
    const r = calculateCO2Allocation(data);
    expect(round2(r.totalCO2Cost)).toBe(178.25);
    expect(r.baseLandlordPercent).toBe(20);
    expect(r.baseTenantPercent).toBe(80);
    expect(r.landlordPercent).toBe(10);
    expect(r.tenantPercent).toBe(90);
    expect(round2(r.tenantShare)).toBe(160.43);
    expect(round2(r.landlordShare)).toBe(17.83);
  });
});

describe('Restriction modifiers', () => {
  it('fall1und2 sets landlord to 0%', () => {
    const r = applyRestrictionModifier(40, 60, 'fall1und2', true);
    expect(r.landlordPercent).toBe(0);
    expect(r.tenantPercent).toBe(100);
  });

  it('fall1 halves landlord share', () => {
    const r = applyRestrictionModifier(40, 60, 'fall1', true);
    expect(r.landlordPercent).toBe(20);
    expect(r.tenantPercent).toBe(80);
  });
});

describe('Zero-cost biomass fuels', () => {
  it('pellets have zero CO2 cost', () => {
    const r = calculateSingleFuel('pellets', 1000, 30);
    expect(r.co2Kg).toBeGreaterThan(0);
    expect(r.co2CostGross).toBe(0);
  });
});
